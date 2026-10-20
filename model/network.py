import torch
from torch import nn


class Network(nn.Module):
    def __init__(self, n_numerical, means=None, stds=None,
                 n_champions=173, emb_dim=4, hidden_dim=64,
                 num_layers=2, dropout=0.0, input_dropout=0.0):
        super().__init__()

        self.embed = nn.Embedding(n_champions, emb_dim)

        if means is None:
            means = torch.zeros(n_numerical)
        if stds is None:
            stds = torch.ones(n_numerical)
        self.register_buffer('means', means.clone().detach().float())
        self.register_buffer('stds', stds.clone().detach().float())

        lstm_input = emb_dim * 10 + n_numerical
        self.rnn = nn.GRU(
            lstm_input, hidden_dim, num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x, lengths=None):
        champs = x[:, :, :10].long()
        nums = x[:, :, 10:]

        stds = torch.clamp(self.stds, min=1e-6)
        nums_norm = (nums - self.means) / stds

        emb = self.embed(champs).flatten(-2)
        inp = torch.cat([emb, nums_norm], dim=-1)

        if lengths is not None:
            packed = nn.utils.rnn.pack_padded_sequence(
                inp, lengths.cpu(), batch_first=True, enforce_sorted=False,
            )
            out_packed, _ = self.rnn(packed)
            out, _ = nn.utils.rnn.pad_packed_sequence(
                out_packed, batch_first=True,
            )
        else:
            out, _ = self.rnn(inp)

        return torch.sigmoid(self.head(out)).squeeze(-1)

    @torch.no_grad()
    def predict_final(self, x, lengths=None):
        probs = self.forward(x, lengths)
        if lengths is not None:
            ar = torch.arange(probs.size(0), device=probs.device)
            return probs[ar, (lengths - 1).to(probs.device)]
        return probs[:, -1]