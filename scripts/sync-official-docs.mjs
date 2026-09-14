/**
 * Snapshot Semi Design official zh-CN markdown (v2.103.0) into playground/official-md.
 * Source: DouyinFE/semi-design content/<category>/<name>/index.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAG = process.env.SEMI_DOCS_TAG || 'v2.103.0';
const OUT = path.resolve(__dirname, '../playground/official-md');
const TREE = `https://api.github.com/repos/DouyinFE/semi-design/git/trees/${TAG}?recursive=1`;
const RAW = `https://raw.githubusercontent.com/DouyinFE/semi-design/${TAG}/`;
const UA = { 'User-Agent': 'semi-design-vue-docs-sync' };

const res = await fetch(TREE, { headers: UA });
if (!res.ok) {
  throw new Error(`git trees ${TAG}: ${res.status} ${await res.text()}`);
}
const body = await res.json();
const SKIP = new Set(['changelog']);
const files = (body.tree || []).filter(
  (t) => t.type === 'blob' && /^content\/[^/]+\/[^/]+\/index\.md$/.test(t.path) && !SKIP.has(t.path.split('/')[2])
);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
for (const file of files) {
  const parts = file.path.split('/'); // content / cat / name / index.md
  const category = parts[1];
  const name = parts[2];
  const url = RAW + file.path;
  const mdRes = await fetch(url, { headers: UA });
  if (!mdRes.ok) {
    console.warn('skip', file.path, mdRes.status);
    continue;
  }
  const text = await mdRes.text();
  const dest = path.join(OUT, `${name}.md`);
  fs.writeFileSync(dest, text, 'utf8');
  manifest.push({ name, category, path: file.path, bytes: Buffer.byteLength(text) });
  process.stdout.write(`ok ${category}/${name} (${text.length} chars)\n`);
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ tag: TAG, files: manifest }, null, 2));
console.log(`\nWrote ${manifest.length} docs -> ${OUT}`);
