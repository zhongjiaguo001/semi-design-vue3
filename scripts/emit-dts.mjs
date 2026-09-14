/**
 * Emit a consumer-facing dist/index.d.ts without requiring vue-tsc to
 * successfully compile every adapter file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const named = new Set();
const typeNames = new Set();

function addExportsFromIndex(file) {
  if (!fs.existsSync(file)) return;
  const text = read(file);
  for (const m of text.matchAll(/export\s+(?:\{([^}]+)\}|type\s+\{([^}]+)\})/g)) {
    const block = m[1] || m[2];
    const isType = Boolean(m[2]) || /export\s+type\s+\{/.test(m[0]);
    for (const part of block.split(',')) {
      const token = part.trim().split(/\s+as\s+/).pop()?.replace(/[^\w$]/g, '');
      if (!token) continue;
      if (isType) typeNames.add(token);
      else named.add(token);
    }
  }
  for (const m of text.matchAll(/export\s+(?:const|function|class|enum)\s+(\w+)/g)) named.add(m[1]);
  for (const m of text.matchAll(/export\s+type\s+(\w+)/g)) typeNames.add(m[1]);
  for (const m of text.matchAll(/export\s+\{([^}]+)\}\s+from/g)) {
    for (const part of m[1].split(',')) {
      const token = part.trim().split(/\s+as\s+/).pop()?.replace(/[^\w$]/g, '');
      if (token) named.add(token);
    }
  }
}

addExportsFromIndex(path.join(src, 'index.ts'));
for (const dir of fs.readdirSync(src, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  addExportsFromIndex(path.join(src, dir.name, 'index.ts'));
}

const iconSrc = read(path.join(src, 'icons', 'generated', 'index.ts'));
const icons = [...iconSrc.matchAll(/export\s+\{\s*default\s+as\s+(Icon\w+)/g)].map((m) => m[1]);

const extras = [
  'theme',
  'useToken',
  'useLocale',
  'useConfigContext',
  'LocaleProvider',
  'ConfigConsumer',
  'defaultResponsiveMap',
  'gridResponsiveMap',
];
for (const e of extras) named.add(e);

const skip = new Set(['default']);
const components = [...named].filter((n) => !skip.has(n) && !n.startsWith('Icon')).sort();

const lines = [];
lines.push('import type { DefineComponent } from \'vue\';');
lines.push('');
lines.push('type SemiComponent = DefineComponent<Record<string, any>, any, any>;');
lines.push('');
lines.push('export const theme: {');
lines.push('  defaultAlgorithm: (...args: any[]) => any;');
lines.push('  darkAlgorithm: (...args: any[]) => any;');
lines.push('  compactAlgorithm: (...args: any[]) => any;');
lines.push('  getDesignToken: (config?: any) => Record<string, any>;');
lines.push('  useToken: () => { token: Record<string, any>; hashId: string; theme: any };');
lines.push('  defaultSeed: Record<string, any>;');
lines.push('  generate: (color: string) => string[];');
lines.push('};');
lines.push('');
lines.push('export function useToken(): { token: Record<string, any>; hashId: string; theme: any };');
lines.push('export function useLocale(componentName?: string): { locale: Record<string, any>; dateLocale?: any; code?: string };');
lines.push('export const defaultResponsiveMap: Record<string, string>;');
lines.push('export const gridResponsiveMap: Record<string, string>;');
lines.push('');
for (const n of components) {
  if (n === 'theme' || n === 'useToken' || n === 'useLocale' || n === 'defaultResponsiveMap' || n === 'gridResponsiveMap') continue;
  if (/^[A-Z]/.test(n) || n.endsWith('Props') || n.endsWith('Context') || n.endsWith('Key')) {
    if (n.endsWith('Props') || n.endsWith('Context') || n.endsWith('Key') || n.startsWith('use')) {
      lines.push(`export const ${n}: any;`);
    } else {
      lines.push(`export const ${n}: SemiComponent;`);
    }
  } else {
    lines.push(`export const ${n}: any;`);
  }
}
lines.push('');
lines.push('// Icons (500+)');
for (const n of icons) lines.push(`export const ${n}: SemiComponent;`);
lines.push('');
lines.push('export type { SemiComponent };');
lines.push('');

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.d.ts'), lines.join('\n'));
console.log(`wrote dist/index.d.ts (${components.length} exports, ${icons.length} icons)`);
