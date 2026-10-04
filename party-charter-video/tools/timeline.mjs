// Loads the scene scripts in Node (no DOM needed) and dumps narration lines / timeline.
//   node tools/timeline.mjs lines      → build/lines.json
//   node tools/timeline.mjs cues       → build/cues.json   (needs build/timing.js)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import vm from 'vm';
const ROOT = new URL('..', import.meta.url).pathname;
const ctx = { console, Math, JSON, Object, Array, String, Number };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['src/engine.js', 'src/common.js', 'src/scenes1.js', 'src/scenes2.js', 'src/scenes3.js']) vm.runInContext(readFileSync(ROOT + f, 'utf8'), ctx, { filename: f });
if (existsSync(ROOT + 'build/timing.js')) vm.runInContext(readFileSync(ROOT + 'build/timing.js', 'utf8'), ctx);
mkdirSync(ROOT + 'build', { recursive: true });
const mode = process.argv[2];
if (mode === 'lines') {
  const out = [];
  for (const sc of ctx.SCENES) sc.lines.forEach((l, i) => out.push({ key: `${sc.id}:${i}`, text: typeof l === 'string' ? l : l.t, say: typeof l === 'string' ? null : (l.s || null) }));
  writeFileSync(ROOT + 'build/lines.json', JSON.stringify(out, null, 1));
  console.log(out.length, 'lines,', out.reduce((a, l) => a + l.text.length, 0), 'chars');
} else {
  const TL = ctx.ENGINE.buildTimeline(ctx.SCENES, ctx.TIMING);
  const cues = [], chapters = [];
  for (const it of TL.items) {
    it.cues.forEach((c, i) => cues.push({ key: `${it.scene.id}:${i}`, t: it.start + c }));
    chapters.push({ id: it.scene.id, t: it.start, chapter: !!it.scene.chapter });
  }
  writeFileSync(ROOT + 'build/cues.json', JSON.stringify({ total: TL.total, cues, chapters }, null, 1));
  console.log('total', TL.total.toFixed(1), 's');
}
