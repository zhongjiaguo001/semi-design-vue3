// Generates Vue icon components from @douyinfe/semi-icons react sources (svgr output).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../node_modules/@douyinfe/semi-icons/src/icons');
const outDir = path.resolve(__dirname, '../src/icons/generated');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const attrMap = {
  fillRule: 'fill-rule',
  clipRule: 'clip-rule',
  clipPath: 'clip-path',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeMiterlimit: 'stroke-miterlimit',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  fillOpacity: 'fill-opacity',
  strokeOpacity: 'stroke-opacity',
  xlinkHref: 'xlink:href',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  className: 'class',
};

const files = fs.readdirSync(srcDir).filter((f) => /^Icon.*\.tsx$/.test(f));
const exportsLines = [];
let count = 0;
for (const file of files) {
  const name = file.replace(/\.tsx$/, '');
  const code = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const typeMatch = code.match(/convertIcon\(\s*SvgComponent\s*,\s*['"]([^'"]+)['"]\s*\)/);
  const type = typeMatch
    ? typeMatch[1]
    : name.replace(/^Icon/, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const svgMatch = code.match(/<svg[\s\S]*?<\/svg>/);
  if (!svgMatch) {
    console.warn('no svg in', file);
    continue;
  }
  const svg = svgMatch[0];
  const rootAttrs = svg.match(/^<svg([\s\S]*?)>/)[1];
  const viewBox = (rootAttrs.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24';
  const rootFill = (rootAttrs.match(/\bfill="([^"]+)"/) || [])[1] || 'none';
  let inner = svg.replace(/^<svg[\s\S]*?>/, '').replace(/<\/svg>$/, '').trim();
  inner = inner.replace(/\{\.\.\.props\}/g, '');
  for (const [k, v] of Object.entries(attrMap)) {
    inner = inner.replace(new RegExp(`\\b${k}=`, 'g'), `${v}=`);
  }
  inner = inner
    .replace(/=\{"([^"]*)"\}/g, '="$1"')
    .replace(/=\{([^}]*)\}/g, '="$1"')
    // two-color / multi-color AI icons: normalize runtime placeholders resolved by Icon.tsx
    .replace(/fill="primaryColor"/g, 'fill="__fill1__"')
    .replace(/fill="secondColor"/g, 'fill="__fill2__"')
    .replace(/stop-color="stop([1-4])"/g, 'stop-color="__fill$1__"')
    .replace(/(fill|stroke)="`url\(#\$\{id\}\)`"/g, '$1="url(#__id__)"')
    .replace(/(fill|stroke)="`url\(#\$\{id"\)`\}/g, '$1="url(#__id__)"')
    .replace(/id="id"/g, 'id="__id__"')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><');
  const content = `import { convertIcon } from '../Icon';
const svg = { viewBox: ${JSON.stringify(viewBox)}, fill: ${JSON.stringify(rootFill)}, inner: ${JSON.stringify(inner)} };
export default convertIcon(svg, ${JSON.stringify(type)}, ${JSON.stringify(name)});
`;
  fs.writeFileSync(path.join(outDir, `${name}.ts`), content);
  exportsLines.push(`export { default as ${name} } from './${name}';`);
  count++;
}
fs.writeFileSync(path.join(outDir, 'index.ts'), exportsLines.join('\n') + '\n');
console.log(`generated ${count} icons`);
