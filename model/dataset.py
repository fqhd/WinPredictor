import os
import json
import numpy as np
import torch
from torch.utils.data import Dataset
from model.game import sample_every

with open('champion_to_index.json') as f:
    champion_to_index = json.load(f)

DRAKE_TYPES = ['EARTH_DRAGON', 'AIR_DRAGON', 'CHEMTECH_DRAGON',
               'HEXTECH_DRAGON', 'FIRE_DRAGON', 'WATER_DRAGON']

RANKS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD',
         'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']

STORAGE_DTYPE = np.float32


def vectorize_state(state):
    v = []
    for champion in state['champions']:
        v.append(champion_to_index[champion])

    for team in state['teams']:
        for player in team['players']:
            for key in player:
                v.append(player[key])

        for drake in team['drakes']:
            drakes_oh = [0] * 6
            drakes_oh[DRAKE_TYPES.index(drake)] = 1
            v += drakes_oh
        for _ in range(4 - len(team['drakes'])):
            v += [0] * 6

        v.append(team['rifts'])
        v.append(team['grubs'])
        v += team['towers']
        v += team['inhibs']

    v.append(state['time'] / 60_000.0)   # minutes, not ms
    return v


def rank_to_elo(rank):
    return RANKS.index(rank) + 1


def is_strong_event(event):
    if event['type'] == 'ELITE_MONSTER_KILL' and event['killerId'] == 0:
        return False
    return event['type'] in ['CHAMPION_KILL', 'BUILDING_KILL', 'ELITE_MONSTER_KILL']


def event_callback(state, event):
    return (is_strong_event(event), None)


def create_game_sequence(game, rank, min_events=3):
    samples = sample_every(game, event_callback)
    if len(samples) < min_events:
        return None, None

    seq = []
    prev_t = None
    for state_copy, _ in samples:
        v = vectorize_state(state_copy)
        v.append(rank_to_elo(rank))

        t_min = state_copy['time'] / 60_000.0
        dt_min = 0.0 if prev_t is None else (t_min - prev_t)
        v.append(dt_min)
        prev_t = t_min

        seq.append(v)

    win = int(samples[-1][0]['win'])
    return np.asarray(seq, dtype=STORAGE_DTYPE), win


def create_dataset_mmap(root, bin_path, index_path, min_events=3):
    offsets = []
    labels = []
    total_elems = 0
    feat_dim = None

    f = open(bin_path, 'wb')
    try:
        for rank in os.listdir(root):
            if rank == '.DS_Store':
                continue
            for tier in os.listdir(os.path.join(root, rank)):
                if tier == '.DS_Store':
                    continue
                for filename in os.listdir(os.path.join(root, rank, tier)):
                    if filename == '.DS_Store':
                        continue
                    with open(os.path.join(root, rank, tier, filename)) as fh:
                        game = json.load(fh)

                    seq, win = create_game_sequence(game, rank, min_events=min_events)
                    if seq is None:
                        continue

                    if feat_dim is None:
                        feat_dim = seq.shape[1]
                    seq.tofile(f)

                    offsets.append((total_elems, seq.shape[0]))
                    labels.append(win)
                    total_elems += seq.size

                    if len(labels) % 5000 == 0:
                        gb = total_elems * np.dtype(STORAGE_DTYPE).itemsize / 1e9
                        print(f'  wrote {len(labels)} games ({gb:.2f} GB)')
    finally:
        f.close()

    np.savez(
        index_path,
        offsets=np.asarray(offsets, dtype=np.int64),
        labels=np.asarray(labels, dtype=np.uint8),
        feat_dim=np.int64(feat_dim),
        dtype=np.array(np.dtype(STORAGE_DTYPE).str),
    )
    print(f'wrote {len(labels)} games -> {bin_path} + {index_path}')


class MmapSeqDataset(Dataset):
    def __init__(self, bin_path, index_path):
        idx = np.load(index_path, allow_pickle=False)
        self.offsets = idx['offsets']
        self.labels = idx['labels'].astype(np.float32)
        self.feat_dim = int(idx['feat_dim'])
        self.dtype = np.dtype(idx['dtype'].item())
        self.bin_path = bin_path
        self._mmap = None

    def _get_mmap(self):
        if self._mmap is None:
            self._mmap = np.memmap(self.bin_path, dtype=self.dtype, mode='r')
        return self._mmap

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, i):
        off, length = self.offsets[i]
        length = int(length)
        n = length * self.feat_dim
        flat = np.array(self._get_mmap()[off:off + n])
        seq = flat.reshape(length, self.feat_dim).astype(np.float32)
        return torch.from_numpy(seq), self.labels[i]


if __name__ == '__main__':
    print('--- train split ---')
    create_dataset_mmap('dataset/train', 'train_seq.bin', 'train_seq_index.npz')
    print('--- test split ---')
    create_dataset_mmap('dataset/test', 'test_seq.bin', 'test_seq_index.npz')