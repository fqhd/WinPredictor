import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, Subset
from tqdm import tqdm
from model.dataset import MmapSeqDataset
from model.network import Network


def collate_fn(batch):
    seqs, labels = zip(*batch)
    lengths = torch.tensor([s.shape[0] for s in seqs], dtype=torch.long)
    max_len = int(lengths.max())
    feat_dim = seqs[0].shape[1]
    padded = torch.zeros(len(seqs), max_len, feat_dim)
    for i, s in enumerate(seqs):
        padded[i, :s.shape[0]] = s
    return padded, lengths, torch.stack([l if torch.is_tensor(l) else torch.tensor(l)
                                         for l in labels])


def masked_bce(probs, y, lengths):
    B, T = probs.shape
    mask = (torch.arange(T, device=probs.device).unsqueeze(0)
            < lengths.unsqueeze(1).to(probs.device)).float()
    y_exp = y.unsqueeze(1).expand_as(probs)
    loss = F.binary_cross_entropy(probs, y_exp, reduction='none')
    return (loss * mask).sum() / mask.sum()


@torch.no_grad()
def evaluate(model, loader, device, desc='val'):
    model.eval()
    correct, total, bce_sum, n_batches = 0, 0, 0.0, 0
    for X, lengths, y in tqdm(loader, desc=desc, leave=False):
        X, y = X.to(device), y.to(device)
        probs = model(X, lengths)
        ar = torch.arange(probs.size(0), device=device)
        last = probs[ar, lengths.to(device) - 1]
        correct += ((last > 0.5).float() == y).sum().item()
        total += y.numel()
        bce_sum += F.binary_cross_entropy(last, y).item()
        n_batches += 1
    return correct / total, bce_sum / n_batches


def compute_normalization_stats(dataset, n_samples=5000, seed=0):
    rng = np.random.default_rng(seed)
    n = len(dataset)
    idxs = rng.choice(n, size=min(n_samples, n), replace=False)
    n_steps, s, ss = 0, None, None
    for i in idxs:
        seq, _ = dataset[int(i)]
        num = seq[:, 10:].numpy().astype(np.float64)
        if s is None:
            s = np.zeros(num.shape[1], dtype=np.float64)
            ss = np.zeros(num.shape[1], dtype=np.float64)
        n_steps += num.shape[0]
        s += num.sum(axis=0)
        ss += (num ** 2).sum(axis=0)
    mean = s / n_steps
    var = ss / n_steps - mean ** 2
    std = np.sqrt(np.maximum(var, 1e-12))
    return torch.from_numpy(mean).float(), torch.from_numpy(std).float()


def count_parameters(model):
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable


def main():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    train_ds = MmapSeqDataset('train_seq.bin', 'train_seq_index.npz')
    test_ds = MmapSeqDataset('test_seq.bin', 'test_seq_index.npz')

    n = len(train_ds)
    g = torch.Generator().manual_seed(42)
    perm = torch.randperm(n, generator=g)
    n_val = int(0.1 * n)
    val_idx = perm[:n_val].tolist()
    train_idx = perm[n_val:].tolist()

    train_subset = Subset(train_ds, train_idx)
    val_subset = Subset(train_ds, val_idx)

    means, stds = compute_normalization_stats(train_subset, n_samples=5000, seed=0)
    n_numerical = means.shape[0]
    print(f'n_numerical = {n_numerical} | '
          f'train games = {len(train_subset)} | val games = {len(val_subset)} | '
          f'test games = {len(test_ds)}')

    model = Network(n_numerical, means=means, stds=stds,
                    n_champions=173, emb_dim=4,
                    hidden_dim=128, num_layers=2, dropout=0.3).to(device)

    total_params, trainable_params = count_parameters(model)
    print(f'Model params: {total_params:,} total | {trainable_params:,} trainable')

    train_loader = DataLoader(train_subset, batch_size=64, shuffle=True,
                              num_workers=4, collate_fn=collate_fn,
                              persistent_workers=True)
    val_loader = DataLoader(val_subset, batch_size=64, shuffle=False,
                            num_workers=4, collate_fn=collate_fn,
                            persistent_workers=True)
    test_loader = DataLoader(test_ds, batch_size=64, shuffle=False,
                             num_workers=4, collate_fn=collate_fn,
                             persistent_workers=True)

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    epochs = 15
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        running, n_batches = 0.0, 0

        pbar = tqdm(train_loader, desc=f'epoch {epoch:02d} [train]', leave=False)
        for X, lengths, y in pbar:
            X, y = X.to(device), y.to(device)
            probs = model(X, lengths)
            loss = masked_bce(probs, y, lengths)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            running += loss.item()
            n_batches += 1
            pbar.set_postfix(loss=f'{running / n_batches:.4f}')

        train_loss = running / n_batches
        val_acc, val_bce = evaluate(model, val_loader, device,
                                    desc=f'epoch {epoch:02d} [val]')
        print(f'Epoch {epoch:2d} | train loss {train_loss:.4f} | '
              f'val acc {val_acc:.4f} | val bce {val_bce:.4f}')

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'gru_best.pt')
            print(f'  -> saved gru_best.pt (val acc {val_acc:.4f})')

    model.load_state_dict(torch.load('gru_best.pt', map_location=device))
    test_acc, test_bce = evaluate(model, test_loader, device, desc='test')
    print(f'\nTest acc {test_acc:.4f} | Test bce {test_bce:.4f}')

    torch.save(model.state_dict(), 'gru_final.pt')
    print('Saved gru_final.pt')


if __name__ == '__main__':
    main()