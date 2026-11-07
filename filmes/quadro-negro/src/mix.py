"""Som do filme -> out/mix_<tag>.wav (48 kHz estéreo, exatamente DUR s).
uso: python3 mix.py <events.json> <voz.wav> <saida.wav>
Voz do Nei (Chatterbox local) na frente; giz real (gravações CC0/CC BY cortadas em grãos, foley/lib) bem baixo, um
grão por traço; apagador = passe de feltro; tom de sala quase inaudível. Sem música, sem whoosh (regra INEMA D7)."""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(7)
EVJ = json.load(open(sys.argv[1])); VOZ = sys.argv[2]; OUT = sys.argv[3]
DUR = EVJ['dur']; ev = EVJ['ev']; N = int(round(DUR * SR))
filt = lambda x, f, k: sosfilt(butter(2, f, k, fs=SR, output='sos'), x)
voice = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32)

def add(buf, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR)); x = np.asarray(x, np.float32) * g
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), N - i)
    if n <= 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + n, 0] += x[:n] * l * 1.414; buf[i:i + n, 1] += x[:n] * r * 1.414

def fade(x, a=.004, b=.03):
    n = len(x); a, b = min(int(a * SR), n // 2), min(int(b * SR), n // 2)
    x = x.copy(); x[:a] *= np.linspace(0, 1, a); x[n - b:] *= np.linspace(1, 0, b); return x

# ── voz: cada bloco do voz.wav no seu lugar (as pausas extras abrem espaço para apagador e câmera)
v, sr = sf.read(VOZ, dtype='float32')
if v.ndim > 1: v = v.mean(1)
if sr != SR: v = resample_poly(v, SR, sr).astype(np.float32)
for e in ev:
    if e['type'] != 'vo': continue
    seg = v[int(e['src0'] * SR):int(e['src1'] * SR + .25 * SR)]
    add(voice, fade(seg, .005, .06), e['t'], 1.0, 0)

# ── giz
IDX = json.load(open(os.path.join(HERE, 'foley/lib/index.json')))
strokes = [g for g in IDX if g['kind'] == 'stroke']; taps = [g for g in IDX if g['kind'] == 'tap']
cache = {}
def grain(g):
    if g['file'] not in cache:
        x, s = sf.read(os.path.join(HERE, 'foley/lib', g['file']), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        cache[g['file']] = x / (np.abs(x).max() + 1e-9)
    return cache[g['file']]
def chalk(d, soft=False):
    out = np.zeros(int((d + .06) * SR), np.float32); pos = 0
    while pos < len(out) - int(.03 * SR):
        g = grain(strokes[rng.integers(len(strokes))]); n = min(len(g), len(out) - pos)
        out[pos:pos + n] += fade(g[:n], .006, .02); pos += max(int(.6 * n), int(.04 * SR))
    env = np.ones(len(out)); a = int(.012 * SR); env[:a] = np.linspace(.3, 1, a); env[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR))
    out = out * env
    return (filt(out, 3600, 'low') if soft else filt(out, 450, 'high')).astype(np.float32)
for e in ev:
    if e['type'] != 'chalk' or e['t'] < 0: continue
    lv = float(np.clip(.35 + e['len'] / 900, .35, 1.0))
    add(fx, chalk(e['d'], e['color'] == 'inema') * lv, e['t'], .055, e['pan'])
    if rng.random() < .5:
        add(fx, fade(grain(taps[rng.integers(len(taps))]), .002, .03) * .02 * lv, e['t'] - .004, 1.0, e['pan'])

# ── apagador: feltro (ruído marrom filtrado) com a velocidade do passe
def brown(d):
    x = np.cumsum(rng.standard_normal(int(d * SR))).astype(np.float64); x -= np.convolve(x, np.ones(2000) / 2000, 'same'); return x / (np.abs(x).max() + 1e-9)
for e in ev:
    if e['type'] != 'wipe': continue
    d = e['d']; x = filt(filt(brown(d + .1), 1800, 'low'), 180, 'high')
    tt = np.linspace(0, 1, len(x)); env = np.sin(np.pi * tt) ** .6 * (1 + .35 * np.sin(2 * np.pi * tt * 3.2))
    add(fx, (x * env).astype(np.float32), e['t'], .12, 0)

# ── sala
room = filt(brown(DUR + .1), 700, 'low')[:N].astype(np.float32) * .004
fx[:, 0] += room; fx[:, 1] += np.roll(room, 997)

mix = voice + fx
pk = np.abs(mix).max()
if pk > .95: mix *= .95 / pk
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
sf.write(OUT, mix, SR, subtype='PCM_24')
print('mix', OUT, f'{DUR:.2f}s')
