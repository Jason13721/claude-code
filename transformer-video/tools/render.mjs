// Frame-exact renderer: N parallel headless Chromium pages each render a slice of frames,
// pipe JPEGs into their own ffmpeg, then the slices are concatenated and muxed with audio.
//   node tools/render.mjs [--fps 30] [--workers 4] [--from s] [--to s] [--out out/transformer.mp4]
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { serve, openPage } from './preview.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') && a.push([v.slice(2), arr[i + 1]]), a), []));
const FPS = +(args.fps || 30), WORKERS = +(args.workers || 4);
const OUT = args.out || 'out/transformer.mp4';
mkdirSync('out/parts', { recursive: true });

const srv = await serve();
const probe = await openPage(srv);
const total = await probe.page.evaluate(() => PLAYER.total);
await probe.browser.close();
const t0 = +(args.from || 0), t1 = Math.min(total, +(args.to || total));
const F0 = Math.round(t0 * FPS), F1 = Math.round(t1 * FPS), NF = F1 - F0;
console.log(`rendering ${NF} frames (${(NF / FPS).toFixed(1)} s) with ${WORKERS} workers`);

const started = Date.now();
let done = 0;
async function worker(w) {
  const a = F0 + Math.floor(NF * w / WORKERS), b = F0 + Math.floor(NF * (w + 1) / WORKERS);
  const part = `out/parts/part${w}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-tune', 'animation', part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const { browser, page } = await openPage(srv);
  const BATCH = 6;
  for (let f = a; f < b; f += BATCH) {
    const n = Math.min(BATCH, b - f);
    const imgs = await page.evaluate(([f, n, fps]) => {
      const out = [];
      for (let k = 0; k < n; k++) { PLAYER.renderAt((f + k) / fps); out.push(PLAYER.canvas.toDataURL('image/jpeg', 0.93).split(',')[1]); }
      return out;
    }, [f, n, FPS]);
    for (const s of imgs) { if (!ff.stdin.write(Buffer.from(s, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
    done += n;
    if (w === 0 && (f - a) % (BATCH * 50) === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`${done}/${NF} frames  ${(done / el).toFixed(1)} fps  eta ${((NF - done) / (done / el) / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  return part;
}
const parts = await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
srv.close();
writeFileSync('out/parts/list.txt', parts.map(p => `file '${p.replace('out/parts/', '')}'`).join('\n'));
const mux = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'out/parts/list.txt'];
const audio = args.audio ?? 'build/audio.wav';
if (audio) mux.push('-ss', String(t0), '-t', String(t1 - t0), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
mux.push('-c:v', 'copy', '-movflags', '+faststart', '-shortest', OUT);
await new Promise((res, rej) => spawn('ffmpeg', mux, { stdio: 'inherit' }).on('close', c => c ? rej(new Error('mux failed')) : res()));
console.log(`done → ${OUT} in ${((Date.now() - started) / 60000).toFixed(1)} min`);
