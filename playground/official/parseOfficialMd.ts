export type OfficialFrontmatter = {
  title?: string;
  brief?: string;
  category?: string;
  localeCode?: string;
};

export type OfficialBlock =
  | { kind: 'prose'; md: string }
  | { kind: 'import'; code: string }
  | { kind: 'live'; heading: string; headingPath: string[]; code: string };

export type ParsedOfficialDoc = {
  frontmatter: OfficialFrontmatter;
  blocks: OfficialBlock[];
};

const LIVE_FENCE = /^```(?:jsx|tsx|js|javascript|typescript)[^\n]*\blive\b[^\n]*$/i;
const IMPORT_FENCE = /^```(?:jsx|tsx)?[^\n]*\bimport\b[^\n]*$/i;
const ANY_FENCE = /^```/;

function parseFrontmatter(raw: string): { fm: OfficialFrontmatter; body: string } {
  if (!raw.startsWith('---')) return { fm: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: raw };
  const yaml = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\s*\n/, '');
  const fm: OfficialFrontmatter = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(title|brief|category|localeCode)\s*:\s*(.*)$/);
    if (!m) continue;
    (fm as any)[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return { fm, body };
}

function stripJsxWidgets(src: string): string {
  let s = src;
  s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  s = s.replace(/<DesignToken\s*\/>/g, '\n\n> 设计变量请参阅 Semi Design Token / DSM。\n\n');
  s = s.replace(/<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  s = s.replace(/<[A-Z][A-Za-z0-9.]*\s*\/>/g, '');
  s = s.replace(/<Notice\b([^>]*)>([\s\S]*?)<\/Notice>/gi, (_all, attrs: string, inner: string) => {
    const title = (attrs.match(/title\s*=\s*['"]([^'"]+)['"]/) || [])[1] || '注意';
    const text = inner
      .replace(/<\/?div[^>]*>/g, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `> ${l}`)
      .join('\n>\n');
    return `\n\n> **${title}**\n>\n${text}\n\n`;
  });
  return s;
}

export function parseOfficialMd(raw: string): ParsedOfficialDoc {
  const { fm, body } = parseFrontmatter(raw);
  const cleaned = stripJsxWidgets(body);
  const lines = cleaned.split('\n');
  const blocks: OfficialBlock[] = [];
  const headingPath: string[] = [];
  let prose: string[] = [];

  const flushProse = () => {
    const md = prose.join('\n').trim();
    if (md) blocks.push({ kind: 'prose', md });
    prose = [];
  };

  const setHeading = (level: number, title: string) => {
    headingPath.length = level - 1;
    headingPath[level - 1] = title;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm && !line.startsWith('```')) {
      setHeading(hm[1].length, hm[2].trim());
      prose.push(line);
      continue;
    }
    if (LIVE_FENCE.test(line) || IMPORT_FENCE.test(line)) {
      const isImport = IMPORT_FENCE.test(line) && !LIVE_FENCE.test(line);
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !ANY_FENCE.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      flushProse();
      const code = buf.join('\n').trim();
      if (isImport) blocks.push({ kind: 'import', code });
      else {
        const heading = [...headingPath].reverse().find(Boolean) || '';
        blocks.push({ kind: 'live', heading, headingPath: headingPath.filter(Boolean), code });
      }
      continue;
    }
    if (ANY_FENCE.test(line)) {
      prose.push(line);
      i += 1;
      while (i < lines.length && !ANY_FENCE.test(lines[i])) {
        prose.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) prose.push(lines[i]);
      continue;
    }
    prose.push(line);
  }
  flushProse();
  return { frontmatter: fm, blocks };
}

export function normalizeHeading(s: string): string {
  return String(s || '')
    .replace(/[`*_]/g, '')
    .replace(/[·.,，。、:：()（）[\]【】]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function headingScore(official: string, demoTitle: string): number {
  const a = normalizeHeading(official);
  const b = normalizeHeading(demoTitle);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  const chars = new Set(a.split(''));
  let hit = 0;
  for (const ch of b) if (chars.has(ch)) hit += 1;
  const ratio = hit / Math.max(a.length, b.length);
  return ratio >= 0.5 ? Math.round(ratio * 60) : 0;
}
