# Builds the soundtrack: narration placed on the timeline + procedurally generated
# ambient music (ducked under speech) + chapter whooshes/chimes.
#   python3 tools/mix.py → build/audio.wav, build/audio.m4a
import json, os, subprocess
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
cues = json.load(open(os.path.join(ROOT, 'build/cues.json')))
lines = {l['key']: l for l in json.load(open(os.path.join(ROOT, 'build/lines.json')))}
T = cues['total'] + 0.5
N = int(T * SR)
t = np.arange(N) / SR

# ---------------- narration
voice = np.zeros(N, np.float32)
speaking = np.zeros(N, np.float32)
for c in cues['cues']:
    x, sr = sf.read(lines[c['key']]['wav'], dtype='float32')
    i = int(c['t'] * SR); j = min(N, i + len(x))
    voice[i:j] += x[:j - i] * 0.95
    speaking[i:j] = 1

# ---------------- music
def midi(m): return 440 * 2 ** ((m - 69) / 12)
# gentle, hopeful progression: Cmaj9 – Am9 – Fmaj7#11 – Gsus/G
CHORDS = [[48, 55, 64, 67, 71, 74], [45, 52, 60, 64, 67, 71], [41, 48, 57, 64, 67, 71], [43, 50, 59, 62, 67, 69]]
BAR = 8.0
music = np.zeros(N, np.float32)
rng = np.random.default_rng(1)

def one_pole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x).astype(np.float32)

# pad: overlapping chord segments with raised-cosine envelopes
seg = int(BAR * SR); fade = int(2.0 * SR)
k = 0
for start in range(-fade, N, seg):
    ch = CHORDS[k % len(CHORDS)]; k += 1
    a, b = max(0, start), min(N, start + seg + fade)
    if b <= a: continue
    tt = t[a:b]
    env = np.ones(b - a, np.float32)
    rel = np.arange(b - a) + (a - start)
    env *= np.clip(rel / fade, 0, 1) ** 1.5
    env *= np.clip((seg + fade - rel) / fade, 0, 1) ** 1.5
    s = np.zeros(b - a, np.float32)
    for m in ch[1:]:
        f = midi(m)
        for det in (-0.12, 0.0, 0.11):
            ph = rng.uniform(0, 6.28)
            s += np.sin(2 * np.pi * f * (1 + det / 100) * tt + ph) * 0.05
            s += np.sin(2 * np.pi * 2 * f * (1 + det / 100) * tt + ph) * 0.008
    s += np.sin(2 * np.pi * midi(ch[0] - 12) * tt) * 0.10          # sub bass
    s *= 1 + 0.15 * np.sin(2 * np.pi * 0.11 * tt)                   # slow swell
    music[a:b] += s * env

# arpeggio plucks
step = 0.5
pattern = [0, 2, 3, 4, 5, 4, 3, 2]
n_steps = int(T / step)
pl_len = int(1.6 * SR); pt = np.arange(pl_len) / SR
for i in range(n_steps):
    ch = CHORDS[int((i * step) // BAR) % len(CHORDS)]
    m = ch[1 + pattern[i % len(pattern)] % (len(ch) - 1)] + 12
    f = midi(m)
    vel = 0.035 * (1.0 if i % 4 == 0 else 0.7) * (0.8 + 0.4 * rng.random())
    tone = (np.sin(2 * np.pi * f * pt) + 0.25 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt * 3.2) * vel
    a = int(i * step * SR); b = min(N, a + pl_len)
    music[a:b] += tone[:b - a]

music = one_pole_lp(music, 2400)
# stereo-ish echo on music
d = int(0.375 * SR)
echo = np.zeros_like(music); echo[d:] = music[:-d] * 0.3
music = music + echo

# duck under speech (smooth 0.6s)
from scipy.ndimage import uniform_filter1d
sp = uniform_filter1d(speaking, int(0.8 * SR))
gain = 0.21 - 0.14 * np.clip(sp * 1.5, 0, 1)
# fade music in/out at the very ends
gain *= np.clip(t / 3.0, 0, 1) * np.clip((T - t) / 4.0, 0, 1)
music *= gain

# ---------------- sfx
sfx = np.zeros(N, np.float32)
from scipy.signal import butter, sosfilt
for ch in cues['chapters']:
    if not ch['chapter']: continue
    a = int((ch['t'] + 0.05) * SR); L = int(1.1 * SR); b = min(N, a + L)
    noise = rng.standard_normal(L).astype(np.float32)
    # rising band-passed noise sweep
    out = np.zeros(L, np.float32)
    for q in range(8):
        lo, hi = 300 * 1.45 ** q, 300 * 1.45 ** q * 1.6
        sos = butter(2, [lo, hi], btype='band', fs=SR, output='sos')
        band = sosfilt(sos, noise)
        center = (q + 0.5) / 8
        w = np.exp(-((np.linspace(0, 1, L) - center) ** 2) / 0.02)
        out += band * w
    out *= np.sin(np.linspace(0, np.pi, L)) * 0.10
    sfx[a:b] += out[:b - a]
    # chime
    a2 = int((ch['t'] + 0.55) * SR); L2 = int(2.5 * SR); b2 = min(N, a2 + L2); tt = np.arange(L2) / SR
    bell = sum(np.sin(2 * np.pi * f * tt) * amp for f, amp in [(1046.5, 0.06), (1568, 0.035), (2093, 0.02), (2637, 0.01)]) * np.exp(-tt * 2.2)
    sfx[a2:b2] += bell[:b2 - a2]

mix = voice + music + sfx
peak = np.max(np.abs(mix)); mix = mix / peak * 0.89
stereo = np.stack([mix, mix], axis=1)
# tiny stereo widening for the music bed only
w = int(0.012 * SR)
stereo[w:, 1] = (voice + sfx)[w:] / peak * 0.89 + music[:-w] / peak * 0.89
out = os.path.join(ROOT, 'build/audio.wav')
sf.write(out, stereo, SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out, '-c:a', 'aac', '-b:a', '160k', os.path.join(ROOT, 'build/audio.m4a')], check=True)
print('audio', round(T, 1), 's, peak', round(float(peak), 3))
