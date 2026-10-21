import { useState, useRef } from 'react';
import './Draft.css';

const apiUrl = import.meta.env.VITE_API_URL;

const CHAMPIONS = ['Aatrox', 'Ahri', 'Akali', 'Akshan', 'Alistar', 'Ambessa', 'Amumu', 'Anivia', 'Annie', 'Aphelios', 'Ashe', 'AurelionSol', 'Aurora', 'Azir', 'Bard', 'Belveth', 'Blitzcrank', 'Brand', 'Braum', 'Briar', 'Caitlyn', 'Camille', 'Cassiopeia', 'Chogath', 'Corki', 'Darius', 'Diana', 'DrMundo', 'Draven', 'Ekko', 'Elise', 'Evelynn', 'Ezreal', 'FiddleSticks', 'Fiora', 'Fizz', 'Galio', 'Gangplank', 'Garen', 'Gnar', 'Gragas', 'Graves', 'Gwen', 'Hecarim', 'Heimerdinger', 'Hwei', 'Illaoi', 'Irelia', 'Ivern', 'Janna', 'JarvanIV', 'Jax', 'Jayce', 'Jhin', 'Jinx', 'KSante', 'Kaisa', 'Kalista', 'Karma', 'Karthus', 'Kassadin', 'Katarina', 'Kayle', 'Kayn', 'Kennen', 'Khazix', 'Kindred', 'Kled', 'KogMaw', 'Leblanc', 'LeeSin', 'Leona', 'Lillia', 'Lissandra', 'Lucian', 'Lulu', 'Lux', 'Malphite', 'Malzahar', 'Maokai', 'MasterYi', 'Mel', 'Milio', 'MissFortune', 'Mordekaiser', 'Morgana', 'Naafiri', 'Nami', 'Nasus', 'Nautilus', 'Neeko', 'Nidalee', 'Nilah', 'Nocturne', 'Nunu', 'Olaf', 'Orianna', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Quinn', 'Rakan', 'Rammus', 'RekSai', 'Rell', 'Renata', 'Renekton', 'Rengar', 'Riven', 'Rumble', 'Ryze', 'Samira', 'Sejuani', 'Senna', 'Seraphine', 'Sett', 'Shaco', 'Shen', 'Shyvana', 'Singed', 'Sion', 'Sivir', 'Skarner', 'Smolder', 'Sona', 'Soraka', 'Swain', 'Sylas', 'Syndra', 'TahmKench', 'Taliyah', 'Talon', 'Taric', 'Teemo', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'TwistedFate', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne', 'Veigar', 'Velkoz', 'Vex', 'Vi', 'Viego', 'Viktor', 'Vladimir', 'Volibear', 'Warwick', 'Wukong', 'Xayah', 'Xerath', 'XinZhao', 'Yasuo', 'Yone', 'Yorick', 'Yunara', 'Yuumi', 'Zaahen', 'Zac', 'Zed', 'Zeri', 'Ziggs', 'Zilean', 'Zoe', 'Zyra', 'Locke'];

// Frontend display name -> server name (used for the API request and icon path).
// Add entries here when the frontend spelling differs from Riot's canonical name.
const ALIASES = {
    Wukong: 'MonkeyKing',
};

function toServerName(name) {
    return ALIASES[name] || name;
}

const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            );
        }
    }
    return dp[m][n];
}

/** Snap arbitrary text to a champion name, or '' if no reasonable match. */
function snapToChampion(text) {
    if (!text) return '';
    const lower = text.toLowerCase().trim();
    if (!lower) return '';

    const exact = CHAMPIONS.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;

    const starts = CHAMPIONS.filter((c) => c.toLowerCase().startsWith(lower));
    if (starts.length === 1) return starts[0];
    if (starts.length > 1) {
        return starts.sort((a, b) => a.length - b.length)[0];
    }

    const includes = CHAMPIONS.filter((c) => c.toLowerCase().includes(lower));
    if (includes.length >= 1) {
        return includes.sort((a, b) => a.length - b.length)[0];
    }

    let best = '';
    let bestDist = Infinity;
    for (const c of CHAMPIONS) {
        const d = levenshtein(lower, c.toLowerCase());
        if (d < bestDist) {
            bestDist = d;
            best = c;
        }
    }
    if (bestDist <= Math.max(2, Math.floor(lower.length / 2))) {
        return best;
    }
    return '';
}

/** Preview icon during typing: show it only for an exact or unique-prefix match. */
function previewChampion(text) {
    if (!text) return '';
    const lower = text.toLowerCase().trim();
    if (!lower) return '';
    const starts = CHAMPIONS.filter((c) => c.toLowerCase().startsWith(lower));
    return starts[0];
}

export default function Draft() {
    const [blueChamps, setBlueChamps] = useState(Array(5).fill(''));
    const [redChamps, setRedChamps] = useState(Array(5).fill(''));
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const blueRefs = useRef([]);
    const redRefs = useRef([]);

    const allFilled =
        blueChamps.every((c) => c.trim() !== '') &&
        redChamps.every((c) => c.trim() !== '');

    const handleChampionChange = (side, index, value) => {
        if (side === 'blue') {
            const next = [...blueChamps];
            next[index] = value;
            setBlueChamps(next);
        } else {
            const next = [...redChamps];
            next[index] = value;
            setRedChamps(next);
        }
        if (result) setResult(null);
        if (error) setError('');
    };

    const snapSlot = (side, index) => {
        const arr = side === 'blue' ? blueChamps : redChamps;
        const current = arr[index];
        if (!current) return;
        const snapped = snapToChampion(current);
        if (snapped !== current) {
            handleChampionChange(side, index, snapped);
        }
    };

    const focusNext = (side, index) => {
        if (side === 'blue') {
            if (index < 4) blueRefs.current[index + 1]?.focus();
            else redRefs.current[0]?.focus();
        } else {
            if (index < 4) redRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (side, index, e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const arr = side === 'blue' ? blueChamps : redChamps;
            const snapped = snapToChampion(arr[index]);
            if (snapped) {
                handleChampionChange(side, index, snapped);
                focusNext(side, index);
            }
        }
    };

    const handlePredict = async () => {
        const snappedBlue = blueChamps.map(snapToChampion);
        const snappedRed = redChamps.map(snapToChampion);
        setBlueChamps(snappedBlue);
        setRedChamps(snappedRed);

        if (!snappedBlue.every(Boolean) || !snappedRed.every(Boolean)) {
            setError('Every slot must contain a valid champion.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Alias to server names before joining
            const blueServer = snappedBlue.map(toServerName);
            const redServer = snappedRed.map(toServerName);

            const url =
                `${apiUrl}/api/draft/` +
                `?blue=${encodeURIComponent(blueServer.join(','))}` +
                `&red=${encodeURIComponent(redServer.join(','))}`;

            const resp = await fetch(url);
            if (resp.status !== 200) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || `Request failed (${resp.status})`);
            }
            const data = await resp.json();
            setResult(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setBlueChamps(Array(5).fill(''));
        setRedChamps(Array(5).fill(''));
        setResult(null);
        setError('');
        blueRefs.current[0]?.focus();
    };

    const handleSwap = () => {
        const b = [...blueChamps];
        setBlueChamps([...redChamps]);
        setRedChamps(b);
        setResult(null);
    };

    const renderSlot = (side, index) => {
        const value = side === 'blue' ? blueChamps[index] : redChamps[index];
        const preview = previewChampion(value);
        const refs = side === 'blue' ? blueRefs : redRefs;
        const iconName = preview ? toServerName(preview) : null;

        return (
            <div className="draft-slot" key={`${side}-${index}`}>
                <span className="draft-role">{ROLES[index]}</span>
                <div className="draft-input-wrapper">
                    {iconName ? (
                        <img
                            className="draft-icon"
                            src={`/images/icons/${iconName}.jpg`}
                            alt={preview}
                            onError={(e) => {
                                e.target.style.visibility = 'hidden';
                            }}
                        />
                    ) : (
                        <div className="draft-icon draft-icon-placeholder">?</div>
                    )}
                    <input
                        ref={(el) => (refs.current[index] = el)}
                        className="draft-input"
                        type="text"
                        placeholder="Champion"
                        value={value}
                        onChange={(e) =>
                            handleChampionChange(side, index, e.target.value)
                        }
                        onBlur={() => snapSlot(side, index)}
                        onKeyDown={(e) => handleKeyDown(side, index, e)}
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="draft-page">
            <div className="draft-header">
                <h1>Draft Analysis</h1>
                <p className="draft-subtitle">
                    Predict win probability from a champion draft.
                </p>
            </div>

            <div className="draft-teams">
                <div className="draft-team blue-team">
                    <h2>Blue Team</h2>
                    {ROLES.map((_, i) => renderSlot('blue', i))}
                </div>

                <div className="draft-vs">VS</div>

                <div className="draft-team red-team">
                    <h2>Red Team</h2>
                    {ROLES.map((_, i) => renderSlot('red', i))}
                </div>
            </div>

            <div className="draft-actions">
                <button
                    className="draft-button secondary"
                    onClick={handleReset}
                    disabled={loading}
                >
                    Reset
                </button>
                <button
                    className="draft-button secondary"
                    onClick={handleSwap}
                    disabled={loading}
                >
                    Swap Sides
                </button>
                <button
                    className="draft-button primary"
                    onClick={handlePredict}
                    disabled={!allFilled || loading}
                >
                    {loading ? 'Predicting…' : 'Predict Win Probability'}
                </button>
            </div>

            {error && <div className="draft-error">{error}</div>}

            {result && (
                <div className="draft-result">
                    <div className="draft-result-label">
                        Blue team win probability
                    </div>
                    <div className="draft-result-bar">
                        <div
                            className="draft-result-blue"
                            style={{ width: `${result.blue_win_prob * 100}%` }}
                        >
                            {result.blue_win_prob > 0.5 &&
                                `${(result.blue_win_prob * 100).toFixed(1)}%`}
                        </div>
                        <div
                            className="draft-result-red"
                            style={{
                                width: `${(1 - result.blue_win_prob) * 100}%`,
                            }}
                        >
                            {result.blue_win_prob <= 0.5 &&
                                `${((1 - result.blue_win_prob) * 100).toFixed(1)}%`}
                        </div>
                    </div>
                    <div className="draft-result-legend">
                        <span className="draft-legend-blue">
                            Blue · {(result.blue_win_prob * 100).toFixed(1)}%
                        </span>
                        <span className="draft-legend-red">
                            Red · {((1 - result.blue_win_prob) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}