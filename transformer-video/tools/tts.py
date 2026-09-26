# Narration TTS with sherpa-onnx + MeloTTS (zh_en), cached by text hash.
#   python3 tools/tts.py  → build/tts/*.wav, build/timing.js
import hashlib, json, os, re, sys, wave
import numpy as np, soundfile as sf, sherpa_onnx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get('MELO_DIR', os.path.join(ROOT, 'models/vits-melo-tts-zh_en')) + '/'
SPEED = float(os.environ.get('TTS_SPEED', '1.08'))
SR = 44100

# English words the stock lexicon lacks (ARPAbet; tone 7 = consonant, 8 = unstressed vowel, 9 = stressed vowel)
EXTRA_LEXICON = {
    'softmax': 's 7 ao 9 f 7 t 7 m 7 ae 8 k 7 s 7',
    'relu': 'r 7 eh 9 l 7 uw 8',
    'embedding': 'eh 8 m 7 b 7 eh 9 d 7 ih 8 ng 7',
    'chatgpt': 'ch 7 ae 9 t 7 jh 7 iy 8 p 7 iy 8 t 7 iy 9',
}
NUMBERS = {'3721': '三千七百二十一', '3720': '三千七百二十'}

def lexicon_path():
    out = os.path.join(ROOT, 'build/lexicon.txt')
    base = open(MODEL + 'lexicon.txt', encoding='utf-8').read()
    extra = ''
    for w, ph in EXTRA_LEXICON.items():
        toks = ph.split(); phones, tones = toks[0::2], toks[1::2]
        extra += f"{w} {' '.join(phones)} {' '.join(tones)}\n"
    open(out, 'w', encoding='utf-8').write(base.rstrip('\n') + '\n' + extra)
    return out

def speakable(s):
    for k, v in NUMBERS.items(): s = s.replace(k, v)
    s = s.replace('GPT-3', 'GPT 3').replace('——', '，').replace('……', '，')
    s = re.sub(r'["“”"「」]', '', s)
    s = s.replace('（', '，').replace('）', '，').replace('(', '，').replace(')', '，')
    s = s.replace('：', '，')
    return s

def main():
    lines = json.load(open(os.path.join(ROOT, 'build/lines.json')))
    out_dir = os.path.join(ROOT, 'build/tts'); os.makedirs(out_dir, exist_ok=True)
    tts = None
    timing = {}
    for ln in lines:
        say = ln['say'] or speakable(ln['text'])
        h = hashlib.sha1(f'{say}|{SPEED}|{sorted(w for w in EXTRA_LEXICON if w in say.lower())}'.encode()).hexdigest()[:12]
        path = os.path.join(out_dir, h + '.wav')
        if not os.path.exists(path):
            if tts is None:
                cfg = sherpa_onnx.OfflineTtsConfig(
                    model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                        model=MODEL + 'model.onnx', lexicon=lexicon_path(), tokens=MODEL + 'tokens.txt', dict_dir=MODEL + 'dict'), num_threads=4),
                    rule_fsts=','.join(MODEL + f for f in ['date.fst', 'phone.fst', 'number.fst', 'new_heteronym.fst']))
                tts = sherpa_onnx.OfflineTts(cfg)
            a = tts.generate(say, sid=0, speed=SPEED)
            x = np.asarray(a.samples, dtype=np.float32)
            # trim leading/trailing silence
            nz = np.where(np.abs(x) > 0.01)[0]
            if len(nz): x = x[max(0, nz[0] - 800): nz[-1] + 1600]
            # resample to 44.1k (linear is fine for speech at this ratio)
            n = int(len(x) * SR / a.sample_rate)
            x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
            x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
            sf.write(path, x, SR)
            print('tts', ln['key'], f'{len(x)/SR:.1f}s', say[:40], flush=True)
        d = sf.info(path).duration
        timing[ln['key']] = round(d, 3)
        ln['wav'] = path
    json.dump(lines, open(os.path.join(ROOT, 'build/lines.json'), 'w'), ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, 'build/timing.js'), 'w') as f:
        f.write('window.TIMING = ' + json.dumps({'lines': timing}) + ';\n')
    print('total speech', round(sum(timing.values()), 1), 's')

main()
