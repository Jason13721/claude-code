# Round-trip check: transcribe each narration wav with an offline Paraformer model.
import json, os, sys, numpy as np, soundfile as sf, sherpa_onnx
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, 'models/sherpa-onnx-paraformer-zh-small-2024-03-09/')
rec = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=M + 'model.int8.onnx', tokens=M + 'tokens.txt', num_threads=4)
lines = json.load(open(os.path.join(ROOT, 'build/lines.json')))
keys = sys.argv[1:]
for ln in lines:
    if keys and ln['key'] not in keys: continue
    x, sr = sf.read(ln['wav'], dtype='float32')
    x = np.interp(np.linspace(0, len(x) - 1, int(len(x) * 16000 / sr)), np.arange(len(x)), x).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, x); rec.decode_stream(s)
    print(f"{ln['key']:10s} {ln['text']}\n{'':10s} → {s.result.text}\n")
