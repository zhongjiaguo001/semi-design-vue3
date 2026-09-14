import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, [path.join(root, 'semi-mcp.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = Buffer.alloc(0);
const pending = new Map();
let nextId = 1;

function send(method, params) {
  const id = nextId++;
  const msg = { jsonrpc: '2.0', id, method, params };
  const json = Buffer.from(JSON.stringify(msg), 'utf8');
  child.stdin.write(`Content-Length: ${json.length}\r\n\r\n`);
  child.stdin.write(json);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout: ${method}`)), 8000);
    pending.set(id, (err, result) => {
      clearTimeout(t);
      if (err) reject(err);
      else resolve(result);
    });
  });
}

child.stdout.on('data', (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (true) {
    const headerEnd = buf.indexOf('\r\n\r\n');
    if (headerEnd < 0) break;
    const header = buf.slice(0, headerEnd).toString('utf8');
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) {
      buf = buf.slice(headerEnd + 4);
      continue;
    }
    const len = Number(m[1]);
    const start = headerEnd + 4;
    if (buf.length < start + len) break;
    const body = JSON.parse(buf.slice(start, start + len).toString('utf8'));
    buf = buf.slice(start + len);
    const cb = pending.get(body.id);
    if (cb) {
      pending.delete(body.id);
      if (body.error) cb(new Error(body.error.message));
      else cb(null, body.result);
    }
  }
});
child.stderr.on('data', (d) => process.stderr.write(d));

try {
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-test', version: '0' },
  });
  if (!init?.serverInfo?.name) throw new Error('initialize failed');

  const listed = await send('tools/list');
  const names = (listed.tools || []).map((t) => t.name);
  const required = [
    'get_semi_document',
    'get_semi_code_block',
    'get_component_file_list',
    'get_file_code',
    'get_function_code',
    'get_vue_demo',
    'get_vue_conventions',
  ];
  for (const n of required) {
    if (!names.includes(n)) throw new Error(`missing tool ${n}`);
  }

  const list = await send('tools/call', { name: 'get_semi_document', arguments: {} });
  const listText = list.content[0].text;
  if (!listText.includes('Button')) throw new Error('component list missing Button');

  const doc = await send('tools/call', { name: 'get_semi_document', arguments: { componentName: 'Button' } });
  const docText = doc.content[0].text;
  if (!docText.includes('semi-design-vue3')) throw new Error('docs not vueified');

  const demo = await send('tools/call', { name: 'get_vue_demo', arguments: { componentName: 'Button' } });
  if (!demo.content[0].text.includes('DemoBlock')) throw new Error('vue demo missing');

  const files = await send('tools/call', { name: 'get_component_file_list', arguments: { componentName: 'Button' } });
  if (!files.content[0].text.includes('src/button')) throw new Error('file list missing src/button');

  const conv = await send('tools/call', { name: 'get_vue_conventions', arguments: {} });
  if (!conv.content[0].text.includes('v-model')) throw new Error('conventions missing v-model');

  console.log('mcp ok', names.join(', '));
  child.kill();
  process.exit(0);
} catch (err) {
  console.error(err);
  child.kill();
  process.exit(1);
}
