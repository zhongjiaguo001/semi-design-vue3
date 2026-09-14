#!/usr/bin/env node
/**
 * Semi Design Vue MCP server (stdio JSON-RPC).
 * Mirrors @douyinfe/semi-mcp tools, but returns Vue 3 adapter docs / demos / source.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(HERE, 'data');

const meta = readJson(path.join(DATA, 'meta.json')) || {
  name: 'semi-design-vue3',
  version: '2.103.0',
  semiFoundation: '2.103.0',
  framework: 'vue3',
};

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}
function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}
function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function docsDir() {
  if (exists(path.join(DATA, 'docs'))) return path.join(DATA, 'docs');
  return path.join(ROOT, 'playground', 'official-md');
}
function demosDir() {
  if (exists(path.join(DATA, 'demos'))) return path.join(DATA, 'demos');
  return path.join(ROOT, 'playground', 'demos', 'components');
}
function srcDir() {
  return path.join(ROOT, 'src');
}

function loadCatalog() {
  const packed = readJson(path.join(DATA, 'catalog.json'));
  if (packed) return packed;
  const tsPath = path.join(ROOT, 'playground', 'catalog.ts');
  if (!exists(tsPath)) return [];
  const ts = readText(tsPath);
  const m = ts.match(/export const catalog: DocGroup\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) return [];
  return Function(`"use strict"; return (${m[1]});`)();
}

const ALIAS = {
  autocomplete: 'autoComplete',
  datepicker: 'datePicker',
  inputnumber: 'inputNumber',
  timepicker: 'timePicker',
  taginput: 'tagInput',
  treeselect: 'treeSelect',
  colorpicker: 'colorPicker',
  pincode: 'pinCode',
  backtop: 'backTop',
  overflowlist: 'overflowList',
  sidesheet: 'sideSheet',
  scrolllist: 'scrollList',
  userguide: 'userGuide',
  floatbutton: 'floatButton',
  configprovider: 'configProvider',
  locale: 'localeProvider',
  localeprovider: 'localeProvider',
  markdownrender: 'markdownRender',
  codehighlight: 'codeHighlight',
  jsonviewer: 'jsonViewer',
  hotkeys: 'hotKeys',
  dragmove: 'dragMove',
  audioplayer: 'audioPlayer',
  videoplayer: 'videoPlayer',
  aichatinput: 'aiChatInput',
  aichatdialogue: 'aiChatDialogue',
  gettingstarted: 'getting-started',
  navigation: 'navigation',
  nav: 'navigation',
  aibutton: 'aiButton',
  aitag: 'aiTag',
  aiicon: 'aiIcon',
  aifloatbutton: 'aiFloatButton',
  chart: 'vchart',
  vchart: 'vchart',
};

function normKey(name) {
  if (!name) return '';
  const raw = String(name).trim();
  const compact = raw.replace(/[-\s]/g, '').toLowerCase();
  if (ALIAS[compact]) return ALIAS[compact];
  const catalog = loadCatalog();
  for (const g of catalog) {
    for (const i of g.items) {
      if (i.key.toLowerCase() === raw.toLowerCase()) return i.key;
      if (i.key.replace(/-/g, '').toLowerCase() === compact) return i.key;
      if (i.title.split(/\s+/)[0].toLowerCase() === raw.toLowerCase()) return i.key;
      if (i.title.toLowerCase() === raw.toLowerCase()) return i.key;
    }
  }
  if (/^[A-Z]/.test(raw)) return raw[0].toLowerCase() + raw.slice(1);
  return raw;
}

function docFileForKey(key) {
  const dir = docsDir();
  const lower = key.toLowerCase();
  const alias = ALIAS[lower.replace(/-/g, '')] || key;
  const candidates = [
    `${key}.md`,
    `${alias}.md`,
    `${lower}.md`,
    `${String(alias).toLowerCase()}.md`,
  ];
  const extra = {
    autoComplete: 'autocomplete.md',
    datePicker: 'datepicker.md',
    inputNumber: 'inputnumber.md',
    timePicker: 'timepicker.md',
    tagInput: 'taginput.md',
    treeSelect: 'treeselect.md',
    colorPicker: 'colorpicker.md',
    pinCode: 'pincode.md',
    backTop: 'backtop.md',
    overflowList: 'overflowlist.md',
    sideSheet: 'sidesheet.md',
    scrollList: 'scrolllist.md',
    userGuide: 'userGuide.md',
    floatButton: 'floatbutton.md',
    configProvider: 'configprovider.md',
    localeProvider: 'locale.md',
    markdownRender: 'markdownrender.md',
    codeHighlight: 'codehighlight.md',
    jsonViewer: 'jsonviewer.md',
    hotKeys: 'hotkeys.md',
    dragMove: 'dragMove.md',
    audioPlayer: 'audioPlayer.md',
    videoPlayer: 'videoPlayer.md',
    aiChatInput: 'aiChatInput.md',
    aiChatDialogue: 'aiChatDialogue.md',
    navigation: 'navigation.md',
    vchart: 'chart.md',
  };
  if (extra[key]) candidates.unshift(extra[key]);
  for (const name of candidates) {
    const p = path.join(dir, name);
    if (exists(p)) return p;
  }
  if (exists(dir)) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    const hit = files.find((f) => f.replace(/\.md$/, '').replace(/-/g, '').toLowerCase() === key.replace(/-/g, '').toLowerCase());
    if (hit) return path.join(dir, hit);
  }
  return null;
}

function vueifyMarkdown(md) {
  let s = md;
  s = s.replace(/@douyinfe\/semi-ui-19/g, 'semi-design-vue3');
  s = s.replace(/@douyinfe\/semi-ui/g, 'semi-design-vue3');
  s = s.replace(/@douyinfe\/semi-icons/g, 'semi-design-vue3');
  s = s.replace(/from 'react'/g, "from 'vue'");
  s = s.replace(/from "react"/g, 'from "vue"');
  return s;
}

const VUE_HEADER = `> **Semi Design Vue 3**（\`semi-design-vue3\`）适配层说明：
> - 包名使用 \`semi-design-vue3\`，对齐 Semi Foundation **${meta.semiFoundation}**。
> - React \`onClick\` / \`onChange\` → Vue \`@click\` / \`@change\`；受控值优先 \`v-model\`。
> - \`children\` → 默认插槽；\`prefix\` / \`icon\` / \`title\` 等节点 props 也可用同名 slot。
> - 样式：\`import 'semi-design-vue3/style.css'\`。
> - 不要生成 React JSX；请输出 Vue 3 SFC 或 \`h()\` 渲染函数。

`;

function listMarkdown() {
  const catalog = loadCatalog();
  const lines = [`# Semi Design Vue 组件列表`, ``, `包：\`${meta.name}@${meta.version}\` · Foundation ${meta.semiFoundation}`, ``];
  for (const g of catalog) {
    lines.push(`## ${g.title}`);
    for (const i of g.items) {
      const skip = i.skipped ? ' （未移植）' : '';
      lines.push(`- **${i.title}** \`${i.key}\`${skip}${i.brief ? ` — ${i.brief}` : ''}`);
    }
    lines.push('');
  }
  lines.push('使用 `get_semi_document` 并传入 componentName（如 Button、DatePicker）获取文档。');
  return lines.join('\n');
}

function extractFences(md) {
  const fences = [];
  const re = /```([^\n]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) {
    fences.push({ lang: m[1].trim(), code: m[2].replace(/\n$/, '') });
  }
  return fences;
}

function hideFences(md) {
  let i = 0;
  return md.replace(/```[^\n]*\n[\s\S]*?```/g, () => {
    i += 1;
    return `\n\n[代码块 ${i} 已折叠，请调用 get_semi_code_block，componentName 同上，codeBlockIndex=${i}]\n\n`;
  });
}

function getDemoVue(key) {
  const dir = demosDir();
  const candidates = [`${key}.vue`, `${key.toLowerCase()}.vue`];
  for (const name of candidates) {
    const p = path.join(dir, name);
    if (exists(p)) return { path: `playground/demos/components/${name}`, content: readText(p) };
  }
  if (exists(dir)) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.vue'));
    const hit = files.find((f) => f.replace(/\.vue$/, '').toLowerCase() === key.toLowerCase());
    if (hit) return { path: `playground/demos/components/${hit}`, content: readText(path.join(dir, hit)) };
  }
  return null;
}

function folderForKey(key) {
  const map = {
    navigation: 'navigation',
    localeProvider: 'locale',
    aiButton: 'button',
    aiTag: 'tag',
    aiIcon: 'icons',
    aiFloatButton: 'floatButton',
    vchart: null,
  };
  if (key in map) return map[key];
  const dir = path.join(srcDir(), key);
  if (exists(dir)) return key;
  const lower = key.toLowerCase();
  if (exists(srcDir())) {
    const hit = fs.readdirSync(srcDir()).find((n) => n.toLowerCase() === lower);
    if (hit) return hit;
  }
  return key;
}

function listComponentFiles(key) {
  const folder = folderForKey(key);
  const files = [];
  if (folder) {
    const dir = path.join(srcDir(), folder);
    if (exists(dir)) {
      const walk = (d, prefix) => {
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const rel = `${prefix}/${ent.name}`;
          if (ent.isDirectory()) walk(path.join(d, ent.name), rel);
          else if (!ent.name.endsWith('.test.ts')) files.push(`src/${folder}${rel}`);
        }
      };
      walk(dir, '');
    }
  }
  files.push(`@douyinfe/semi-foundation/lib/es/${folder || key}/`);
  return files;
}

function resolveSrcFile(filePath) {
  let p = String(filePath || '').replace(/\\/g, '/');
  p = p.replace(/^@douyinfe\/semi-ui\//, 'src/');
  p = p.replace(/^semi-design-vue3\//, '');
  p = p.replace(/^semi-design-vue\//, '');
  if (p.startsWith('src/')) return path.join(ROOT, p);
  if (exists(path.join(ROOT, p))) return path.join(ROOT, p);
  if (exists(path.join(srcDir(), p))) return path.join(srcDir(), p);
  return path.join(ROOT, p);
}

function extractFunction(code, functionName) {
  const name = functionName.trim();
  const patterns = [
    new RegExp(`function\\s+${name}\\s*\\(`, 'm'),
    new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s*)?(?:function\\b|\\()`, 'm'),
    new RegExp(`${name}\\s*\\([^)]*\\)\\s*\\{`, 'm'),
    new RegExp(`(?:async\\s+)?${name}\\s*\\(`, 'm'),
  ];
  let idx = -1;
  for (const re of patterns) {
    const m = re.exec(code);
    if (m) {
      idx = m.index;
      break;
    }
  }
  if (idx < 0) return null;
  const brace = code.indexOf('{', idx);
  if (brace < 0) return code.slice(idx, idx + 400);
  let depth = 0;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return code.slice(idx, i + 1);
    }
  }
  return code.slice(idx);
}

function summarizeTs(code) {
  const lines = code.split('\n');
  if (lines.length < 500) return code;
  let out = [];
  let depth = 0;
  let hiding = false;
  for (const line of lines) {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (!hiding && depth === 0 && /\)\s*\{?\s*$/.test(line) && opens) {
      out.push(line.replace(/\{\s*$/, '{ ... }'));
      hiding = true;
      depth += opens - closes;
      continue;
    }
    if (hiding) {
      depth += opens - closes;
      if (depth <= 0) hiding = false;
      continue;
    }
    out.push(line);
    depth += opens - closes;
  }
  return out.join('\n');
}

const VUE_CONVENTIONS = `# Semi Design Vue 用法约定

包名：\`semi-design-vue3\`（对齐 @douyinfe/semi-foundation ${meta.semiFoundation}）

\`\`\`ts
import { createApp } from 'vue'
import { Button, ConfigProvider, theme, IconClose } from 'semi-design-vue3'
import 'semi-design-vue3/style.css'
\`\`\`

## 事件与受控

| React | Vue 3 |
| --- | --- |
| \`onClick\` / \`onChange\` / \`onVisibleChange\` | \`@click\` / \`@change\` / \`@visible-change\` |
| \`value\` + \`onChange\` | \`v-model\`（内部 alias 到 value） |
| \`checked\` | \`v-model\` |
| \`visible\` | \`v-model:visible\` 或 \`visible\` + \`@update:visible\` |

## 插槽

- React \`children\` → 默认插槽
- 节点型 props（\`prefix\` \`suffix\` \`icon\` \`title\` \`extra\` \`header\` \`footer\`）可用同名 slot

## 主题

\`\`\`vue
<ConfigProvider :theme="{ algorithm: [theme.defaultAlgorithm] }">
  <App />
</ConfigProvider>
\`\`\`

暗色：\`theme.darkAlgorithm\`，并给 \`document.body\` 设置 \`theme-mode="dark"\`。

## 不要做

- 不要 import \`@douyinfe/semi-ui\`（那是 React）
- 不要写 React JSX 示例
- 不要修改 \`@douyinfe/semi-foundation\`
`;

const tools = [
  {
    name: 'get_semi_document',
    description:
      '获取 Semi Design Vue 组件文档或组件列表。不传 componentName 时返回全部组件。传入 Button、Input、Table 等返回该组件的 Vue 适配文档（由 Semi 2.103.0 官网文档改写）。',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: '组件名或文档名，如 Button、DatePicker、getting-started。省略则返回组件列表',
        },
      },
    },
  },
  {
    name: 'get_semi_code_block',
    description: '获取组件文档中第 N 个代码块，或对应的 Vue DemoBlock 源码。',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: { type: 'string', description: '组件名，如 Button' },
        codeBlockIndex: { type: 'number', description: '代码块序号，从 1 开始' },
      },
      required: ['componentName', 'codeBlockIndex'],
    },
  },
  {
    name: 'get_component_file_list',
    description: '列出 Semi Design Vue 适配层中某组件的源码文件（src/<component>/），以及对应 foundation 路径。',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: { type: 'string', description: '组件名，如 Table、DatePicker' },
      },
      required: ['componentName'],
    },
  },
  {
    name: 'get_file_code',
    description: '读取 Vue 适配层源码文件。路径来自 get_component_file_list，如 src/button/Button.tsx。',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '文件路径，如 src/table/Table.tsx' },
        fullCode: { type: 'boolean', description: 'true 时返回完整文件；默认对超长 TS/TSX 折叠函数体' },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'get_function_code',
    description: '从 Vue 适配层文件中提取指定函数/方法的完整实现。',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '文件路径，如 src/button/Button.tsx' },
        functionName: { type: 'string', description: '函数名，如 render、setup、handleClick' },
      },
      required: ['filePath', 'functionName'],
    },
  },
  {
    name: 'get_vue_demo',
    description: '获取 playground 中该组件的 Vue 3 可交互示例源码（.vue SFC）。',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: { type: 'string', description: '组件名，如 Button、aiChatInput' },
      },
      required: ['componentName'],
    },
  },
  {
    name: 'get_vue_conventions',
    description: '获取 Semi Design Vue 的用法约定：安装、v-model、事件、插槽、主题、与 React 的差异。编写 Vue 代码前应先读此工具。',
    inputSchema: { type: 'object', properties: {} },
  },
];

function textResult(text) {
  return { content: [{ type: 'text', text: String(text) }] };
}

function callTool(name, args = {}) {
  switch (name) {
    case 'get_semi_document': {
      const raw = args.componentName;
      if (!raw) return textResult(listMarkdown());
      const extraDocs = new Set([
        'introduction',
        'getting-started',
        'overview',
        'customize-theme',
        'dark-mode',
        'faq',
        'accessibility',
        'tokens',
        'mcp-skills',
      ]);
      const key = extraDocs.has(String(raw).toLowerCase()) ? String(raw).toLowerCase() : normKey(raw);
      const file = docFileForKey(key) || docFileForKey(String(raw));
      if (!file) return textResult(`未找到文档：${raw}。请先调用 get_semi_document 不带参数查看组件列表。`);
      let md = vueifyMarkdown(readText(file));
      const fences = extractFences(md);
      if (fences.length > 4) md = hideFences(md);
      return textResult(VUE_HEADER + md);
    }
    case 'get_semi_code_block': {
      const key = normKey(args.componentName);
      const idx = Number(args.codeBlockIndex) || 1;
      const file = docFileForKey(key);
      if (!file) return textResult(`未找到组件文档：${args.componentName}`);
      const fences = extractFences(readText(file));
      if (idx < 1 || idx > fences.length) {
        const demo = getDemoVue(key);
        if (demo) return textResult(`文档仅有 ${fences.length} 个代码块。下面是 Vue playground 示例：\n\n\`\`\`vue\n${demo.content}\n\`\`\``);
        return textResult(`代码块序号超出范围（1-${fences.length}）`);
      }
      const block = fences[idx - 1];
      return textResult(`\`\`\`${block.lang}\n${vueifyMarkdown(block.code)}\n\`\`\`\n\n对应 Vue 用法请再调用 get_vue_demo。`);
    }
    case 'get_component_file_list': {
      const key = normKey(args.componentName);
      const files = listComponentFiles(key);
      if (!files.length) return textResult(`未找到组件源码目录：${args.componentName}`);
      return textResult(files.join('\n'));
    }
    case 'get_file_code': {
      const abs = resolveSrcFile(args.filePath);
      if (!exists(abs)) return textResult(`文件不存在：${args.filePath}`);
      const code = readText(abs);
      const full = Boolean(args.fullCode);
      const body = !full && /\.(ts|tsx)$/.test(abs) ? summarizeTs(code) : code;
      return textResult(body);
    }
    case 'get_function_code': {
      const abs = resolveSrcFile(args.filePath);
      if (!exists(abs)) return textResult(`文件不存在：${args.filePath}`);
      const fn = extractFunction(readText(abs), String(args.functionName || ''));
      if (!fn) return textResult(`未找到函数 ${args.functionName} 于 ${args.filePath}`);
      return textResult(fn);
    }
    case 'get_vue_demo': {
      const key = normKey(args.componentName);
      const demo = getDemoVue(key);
      if (!demo) return textResult(`未找到 Vue 示例：${args.componentName}。可尝试 get_semi_document。`);
      return textResult(`// ${demo.path}\n\n${demo.content}`);
    }
    case 'get_vue_conventions':
      return textResult(VUE_CONVENTIONS);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function send(msg) {
  const json = JSON.stringify(msg);
  const payload = Buffer.from(json, 'utf8');
  process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
  process.stdout.write(payload);
}

function handle(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return;
  if (msg.method === undefined && msg.id === undefined) return;
  const { id, method, params } = msg;
  if (method === undefined) return;
  if (String(method).startsWith('notifications/')) return;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: (params && params.protocolVersion) || '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'semi-design-vue-mcp', version: meta.version },
          instructions:
            'Semi Design Vue 3 组件库 MCP。编写代码前先 get_vue_conventions，再用 get_semi_document / get_vue_demo。包名 semi-design-vue3，不要用 @douyinfe/semi-ui。',
        },
      });
      return;
    }
    if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
      return;
    }
    if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools } });
      return;
    }
    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments || {};
      const result = callTool(name, args);
      send({ jsonrpc: '2.0', id, result });
      return;
    }
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (err) {
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
    });
  }
}

class Reader {
  constructor() {
    this.buf = Buffer.alloc(0);
  }
  push(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    const msgs = [];
    while (this.buf.length) {
      if (this.buf[0] === 0x7b) {
        const nl = this.buf.indexOf(10);
        if (nl < 0) break;
        const line = this.buf.slice(0, nl).toString('utf8').replace(/\r$/, '');
        this.buf = this.buf.slice(nl + 1);
        if (line.trim()) msgs.push(JSON.parse(line));
        continue;
      }
      const headerEnd = this.buf.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = this.buf.slice(0, headerEnd).toString('utf8');
      const m = header.match(/Content-Length:\s*(\d+)/i);
      if (!m) {
        this.buf = this.buf.slice(headerEnd + 4);
        continue;
      }
      const len = Number(m[1]);
      const start = headerEnd + 4;
      if (this.buf.length < start + len) break;
      const body = this.buf.slice(start, start + len).toString('utf8');
      this.buf = this.buf.slice(start + len);
      msgs.push(JSON.parse(body));
    }
    return msgs;
  }
}

const reader = new Reader();
process.stdin.on('data', (chunk) => {
  try {
    for (const msg of reader.push(chunk)) handle(msg);
  } catch (err) {
    process.stderr.write(String(err instanceof Error ? err.stack : err) + '\n');
  }
});
process.stdin.on('end', () => process.exit(0));
process.stdin.resume();
