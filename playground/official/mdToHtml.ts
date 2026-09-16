import { allItems } from '../catalog';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
    return `<img class="od-img" alt="${alt}" src="${src}" loading="lazy" />`;
  });
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
    const h = rewriteHref(href);
    const ext = h.startsWith('http') ? ' target="_blank" rel="noreferrer"' : '';
    return `<a href="${escapeHtml(h)}"${ext}>${text}</a>`;
  });
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return t;
}

function matchOverviewItem(name: string) {
  const n = name.trim();
  if (!n) return null;
  const exact = allItems.find((i) => i.title === n);
  if (exact) return exact;
  const en = n.split(/\s+/)[0].toLowerCase();
  return (
    allItems.find((i) => i.key.toLowerCase() === en || i.title.split(/\s+/)[0].toLowerCase() === en) || null
  );
}

function renderOverview(body: string): string {
  const names = body
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const cards = names
    .map((name) => {
      const item = matchOverviewItem(name);
      const key = item?.key || name;
      const title = item?.title || name;
      const brief = item?.brief || '';
      const skipped = item?.skipped ? ' is-skipped' : '';
      const skip = item?.skipped ? '<span class="od-card-skip">未移植</span>' : '';
      return `<a class="od-card${skipped}" href="#${escapeHtml(key)}"><span class="od-card-title">${escapeHtml(title)}</span><span class="od-card-brief">${escapeHtml(brief)}</span>${skip}</a>`;
    })
    .join('');
  return `<div class="od-overview">${cards}</div>`;
}

export function rewriteHref(href: string): string {
  const local = href.match(/^\/zh-CN\/[\w-]+\/([\w-]+)/);
  if (local) return `#${toCatalogKey(local[1])}`;
  if (href.startsWith('/')) return `https://semi.design${href}`;
  return href;
}

export function toCatalogKey(folder: string): string {
  const aliases: Record<string, string> = {
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
    chart: 'vchart',
  };
  const lower = folder.replace(/-/g, '').toLowerCase();
  if (aliases[lower]) return aliases[lower];
  if (folder.includes('-')) return folder;
  return folder;
}

function isTableSep(line: string): boolean {
  const cells = splitTableCells(line);
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c.replace(/\s+/g, '')));
}

/** Split a markdown table row on unescaped `|`. `\|` stays as `|` in the cell. */
function splitTableCells(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  const s = line.trim();
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') {
      cur += '|';
      i += 1;
      continue;
    }
    if (s[i] === '|') {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += s[i];
  }
  cells.push(cur.trim());
  if (cells.length && cells[0] === '') cells.shift();
  if (cells.length && cells[cells.length - 1] === '') cells.pop();
  return cells;
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  let para: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      flushPara();
      i += 1;
      continue;
    }
    if (line.startsWith('```')) {
      flushPara();
      const lang = line.slice(3).trim().split(/\s+/)[0].toLowerCase();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      if (lang === 'overview' || lang.startsWith('overview')) {
        out.push(renderOverview(buf.join('\n')));
      } else {
        out.push(`<pre class="od-code"><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      }
      i += 1;
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      flushPara();
      const lv = hm[1].length;
      out.push(`<h${lv} id="${escapeHtml(normalizeId(hm[2]))}">${inline(hm[2])}</h${lv}>`);
      i += 1;
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = splitTableCells(lines[i]);
        if (!isTableSep(lines[i])) rows.push(cells);
        i += 1;
      }
      if (rows.length) {
        const head = rows[0];
        const body = rows.slice(1);
        out.push('<div class="od-table-wrap"><table class="od-table"><thead><tr>');
        out.push(head.map((c) => `<th>${inline(c)}</th>`).join(''));
        out.push('</tr></thead><tbody>');
        for (const r of body) {
          out.push('<tr>');
          out.push(r.map((c) => `<td>${inline(c)}</td>`).join(''));
          out.push('</tr>');
        }
        out.push('</tbody></table></div>');
      }
      continue;
    }
    if (/^\s*>/.test(line)) {
      flushPara();
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote class="od-notice">${buf.map((l) => (l ? `<p>${inline(l)}</p>` : '')).join('')}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/.test(lines[i]) : /^\s*[-*]\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        i += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</${tag}>`);
      continue;
    }
    para.push(line.trim());
    i += 1;
  }
  flushPara();
  return out.join('\n');
}

function normalizeId(s: string): string {
  return s.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
}
