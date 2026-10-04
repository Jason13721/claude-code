// Render still frames: node tools/preview.mjs out_dir t1 t2 ...   (t may be "scene:local")
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.m4a': 'audio/mp4' };
export function serve() {
  return new Promise(res => {
    const srv = createServer(async (req, rsp) => {
      try { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0])); const b = await readFile(p); rsp.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); rsp.end(b); }
      catch { rsp.writeHead(404); rsp.end(); }
    }).listen(0, () => res(srv));
  });
}
export async function openPage(srv) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${srv.address().port}/index.html?render=1`);
  await page.evaluate(() => window.fontsReady);
  return { browser, page };
}
if (process.argv[1].endsWith('preview.mjs')) {
  const [out, ...ts] = process.argv.slice(2);
  mkdirSync(out, { recursive: true });
  const srv = await serve(); const { browser, page } = await openPage(srv);
  console.log('total', await page.evaluate(() => PLAYER.total));
  for (const spec of ts) {
    const url = await page.evaluate((spec) => {
      let t = +spec;
      if (spec.includes(':')) { const [id, l] = spec.split(':'); const it = PLAYER.timeline.items.find(i => i.scene.id === id); t = it.start + (l.startsWith('e') ? it.cues[+l.slice(1)] + it.durs[+l.slice(1)] + 0.3 : l.startsWith('c') ? it.cues[+l.slice(1).split('+')[0]] + (+(l.split('+')[1] || 0)) : +l); }
      PLAYER.renderAt(t); return PLAYER.canvas.toDataURL('image/jpeg', 0.85);
    }, spec);
    const f = join(out, spec.replace(/[:+]/g, '_') + '.jpg');
    writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log(f);
  }
  await browser.close(); srv.close();
}
