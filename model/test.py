import numpy as np
import torch
from tqdm import tqdm
import matplotlib.pyplot as plt
import seaborn as sns

from model.dataset import MmapSeqDataset
from model.network import Network


CKPT_PATH = 'gru_best.pt'


def find_feature_indices(feat_dim):
    return {
        'time_col': feat_dim - 3,
        'rank_col': feat_dim - 2,
        'dt_col':   feat_dim - 1,
    }


def truncate_at_random_time(seq_full, label, time_col, rng):
    times = seq_full[:, time_col].numpy()
    if len(times) < 2 or times[-1] <= times[0]:
        return None

    T = rng.uniform(0.0, times[-1])
    k = int(np.searchsorted(times, T, side='right') - 1)
    if k < 1:
        return None

    return seq_full[:k + 1].clone(), float(label), float(times[k])


@torch.no_grad()
def evaluate_uniform_time(model, dataset, device, time_col,
                          batch_size=64, seed=2024):
    model.eval()
    rng = np.random.default_rng(seed)

    truncated = []
    for i in range(len(dataset)):
        seq_full, label = dataset[i]
        out = truncate_at_random_time(seq_full, label, time_col, rng)
        if out is None:
            continue
        truncated.append(out)

    if not truncated:
        raise RuntimeError('No usable truncated sequences.')

    truncated.sort(key=lambda s: s[0].shape[0])
    feat_dim = truncated[0][0].shape[1]

    probs_all, labels_all, times_all = [], [], []

    for start in tqdm(range(0, len(truncated), batch_size),
                      desc='eval', leave=False):
        chunk = truncated[start:start + batch_size]
        max_len = max(s[0].shape[0] for s in chunk)

        padded  = torch.zeros(len(chunk), max_len, feat_dim)
        lengths = torch.tensor([s[0].shape[0] for s in chunk], dtype=torch.long)
        labels  = torch.tensor([s[1] for s in chunk], dtype=torch.float32)
        qt      = torch.tensor([s[2] for s in chunk], dtype=torch.float32)

        for j, (seq, _, _) in enumerate(chunk):
            padded[j, :seq.shape[0]] = seq

        padded = padded.to(device)
        probs = model(padded, lengths)
        ar = torch.arange(probs.size(0), device=device)
        last = probs[ar, (lengths - 1).to(device)]

        probs_all.append(last.cpu())
        labels_all.append(labels)
        times_all.append(qt)

    probs  = torch.cat(probs_all).numpy()
    labels = torch.cat(labels_all).numpy()
    times  = torch.cat(times_all).numpy()
    return probs, labels, times


def accuracy(probs, labels):
    return float(((probs > 0.5).astype(np.int64) == labels.astype(np.int64)).mean())


def ece(probs, labels, n_bins=15):
    bins = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(probs, bins, right=True) - 1, 0, n_bins - 1)
    total = 0.0
    for b in range(n_bins):
        m = idx == b
        if m.sum() == 0:
            continue
        total += (m.sum() / len(probs)) * abs(probs[m].mean() - labels[m].mean())
    return float(total)


def bce(probs, labels, eps=1e-7):
    return float(-np.mean(labels * np.log(probs + eps)
                          + (1 - labels) * np.log(1 - probs + eps)))


def spread(probs):
    return float(np.asarray(probs).std())


def print_by_minute(probs, labels, times):
    buckets = [(0, 5), (5, 10), (10, 15), (15, 20), (20, 25),
               (25, 30), (30, 40), (40, 100)]
    print(f'\n{"bucket":>10} | {"n":>6} | {"acc":>7} | {"ECE":>7} | '
          f'{"bce":>7} | {"conf":>7} | {"spread":>7}')
    print('-' * 74)
    for lo, hi in buckets:
        m = (times >= lo) & (times < hi)
        if m.sum() == 0:
            continue
        p, y = probs[m], labels[m]
        conf = float(np.maximum(p, 1 - p).mean())
        print(f'{lo:>3}-{hi:<3} min | {m.sum():>6} | '
              f'{accuracy(p, y):>7.3f} | {ece(p, y, n_bins=10):>7.3f} | '
              f'{bce(p, y):>7.3f} | {conf:>7.3f} | {spread(p):>7.3f}')


def plot_reliability(probs, labels, ece_val, out_path='reliability.png'):
    bins = np.linspace(0, 1, 16)
    idx = np.clip(np.digitize(probs, bins, right=True) - 1, 0, len(bins) - 2)
    centers, accs, counts = [], [], []
    for b in range(len(bins) - 1):
        m = idx == b
        if m.sum() < 5:
            continue
        centers.append(probs[m].mean())
        accs.append(labels[m].mean())
        counts.append(m.sum())

    plt.figure(figsize=(6, 6))
    plt.plot([0, 1], [0, 1], 'k--', label='perfect')
    plt.scatter(centers, accs,
                s=[c / max(counts) * 400 for c in counts],
                alpha=0.7, label='model')
    plt.xlabel('predicted P(win)')
    plt.ylabel('empirical win rate')
    plt.title(f'Reliability  |  ECE={ece_val:.4f}')
    plt.legend()
    plt.tight_layout()
    plt.savefig(out_path, dpi=130)
    plt.close()
    print(f'Saved {out_path}')


def plot_distribution(probs, out_path='distribution.png'):
    plt.figure(figsize=(8, 5))
    sns.histplot(x=probs, kde=True, bins=15)
    plt.xlabel('Predicted P(blue wins)')
    plt.ylabel('Count')
    plt.title(f'Distribution of predicted P(win)  |  '
              f'spread={spread(probs):.4f}')
    plt.tight_layout()
    plt.savefig(out_path, dpi=130)
    plt.close()
    print(f'Saved {out_path}')


def main():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    test_ds = MmapSeqDataset('test_seq.bin', 'test_seq_index.npz')
    print(f'Test games on disk: {len(test_ds)}')

    feat_dim = test_ds.feat_dim
    cols = find_feature_indices(feat_dim)
    print(f'feat_dim={feat_dim} | time_col={cols["time_col"]} | '
          f'rank_col={cols["rank_col"]} | dt_col={cols["dt_col"]}')

    state = torch.load(CKPT_PATH, map_location=device)
    n_numerical = state['means'].shape[0]
    emb_dim     = state['embed.weight'].shape[1]
    hidden_dim  = state['rnn.weight_hh_l0'].shape[1]
    num_layers  = sum(1 for k in state if k.startswith('rnn.weight_ih_l'))
    rnn_type    = {3: 'GRU', 4: 'LSTM'}[state['rnn.weight_hh_l0'].shape[0] // hidden_dim]

    model = Network(
        n_numerical=n_numerical,
        means=state['means'],
        stds=state['stds'],
        n_champions=173,
        emb_dim=emb_dim,
        hidden_dim=hidden_dim,
        num_layers=num_layers,
        dropout=0.0,
    ).to(device)
    model.load_state_dict(state)
    model.eval()
    print(f'Model: {rnn_type} | {num_layers} layers | hidden={hidden_dim} | '
          f'emb_dim={emb_dim} | n_numerical={n_numerical}')

    probs, labels, times = evaluate_uniform_time(
        model, test_ds, device, cols['time_col'], seed=2024,
    )

    a = accuracy(probs, labels)
    e = ece(probs, labels)
    b = bce(probs, labels)
    s = spread(probs)

    print(f'\n=== Uniform time-sampling evaluation ===')
    print(f'Games evaluated: {len(labels)}')
    print(f'Accuracy:        {a:.4f}')
    print(f'ECE (15 bins):   {e:.4f}')
    print(f'BCE:             {b:.4f}')
    print(f'Spread:          {s:.4f}')

    print_by_minute(probs, labels, times)
    plot_reliability(probs, labels, e)
    plot_distribution(probs)

    np.savez('test_predictions.npz', probs=probs, labels=labels, times=times)
    print('Saved test_predictions.npz')


if __name__ == '__main__':
    main()