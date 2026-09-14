import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'mcp', 'data');

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function copyDir(from, to, filter) {
  mkdir(to);
  if (!fs.existsSync(from)) return 0;
  let n = 0;
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, ent.name);
    const dest = path.join(to, ent.name);
    if (ent.isDirectory()) n += copyDir(src, dest, filter);
    else if (!filter || filter(src, ent.name)) {
      fs.copyFileSync(src, dest);
      n += 1;
    }
  }
  return n;
}

function parseCatalog(ts) {
  const m = ts.match(/export const catalog: DocGroup\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('catalog.ts: failed to extract catalog array');
  return Function(`"use strict"; return (${m[1]});`)();
}

function walkSrc(dir, acc, prefix = '') {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSrc(abs, acc, rel);
    else if (/\.(tsx?|scss|css)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) acc.push(rel.replace(/\\/g, '/'));
  }
}

rmrf(dataDir);
mkdir(dataDir);

const catalog = parseCatalog(fs.readFileSync(path.join(root, 'playground', 'catalog.ts'), 'utf8'));
fs.writeFileSync(path.join(dataDir, 'catalog.json'), JSON.stringify(catalog, null, 2));

const docsN = copyDir(path.join(root, 'playground', 'official-md'), path.join(dataDir, 'docs'), (_p, name) => name.endsWith('.md') || name === 'manifest.json');
const demoN = copyDir(path.join(root, 'playground', 'demos', 'components'), path.join(dataDir, 'demos'), (_p, name) => name.endsWith('.vue'));

const files = [];
walkSrc(path.join(root, 'src'), files);
fs.writeFileSync(path.join(dataDir, 'files.json'), JSON.stringify(files, null, 2));

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(
  path.join(dataDir, 'meta.json'),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      semiFoundation: '2.103.0',
      framework: 'vue3',
    },
    null,
    2
  )
);

console.log(`mcp data: ${catalog.length} groups, ${docsN} docs, ${demoN} demos, ${files.length} src files`);
