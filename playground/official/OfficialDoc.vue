<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@/index';
import { getOfficialMarkdown } from './loadDocs';
import { parseOfficialMd } from './parseOfficialMd';
import { mdToHtml } from './mdToHtml';

const props = defineProps<{
  docKey: string;
  hideBrief?: boolean;
  demoTitle?: string;
  demoCaption?: string;
}>();

const parsed = computed(() => {
  const raw = getOfficialMarkdown(props.docKey);
  return raw ? parseOfficialMd(raw) : null;
});

const DEMO_RE = /(^|\n)##\s*代码演示/;
const API_RE = /(^|\n)##\s*API/;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function importHtml(code: string): string {
  const next = code.replace(/@douyinfe\/semi-ui-19/g, 'semi-design-vue3').replace(/@douyinfe\/semi-ui/g, 'semi-design-vue3').replace(/@douyinfe\/semi-icons/g, 'semi-design-vue3');
  return `<pre class="od-code"><code>${escapeHtml(next)}</code></pre>`;
}

/** Overview / 使用场景 — stop at 代码演示 (Vue demos replace that section). */
const introHtml = computed(() => {
  const doc = parsed.value;
  if (!doc) return '';
  const parts: string[] = [];
  for (const b of doc.blocks) {
    if (b.kind === 'live' || b.kind === 'import') continue;
    if (b.kind !== 'prose') continue;
    const demoAt = b.md.search(DEMO_RE);
    const apiAt = b.md.search(API_RE);
    let cut = b.md;
    let stop = false;
    if (demoAt >= 0) {
      cut = b.md.slice(0, demoAt);
      stop = true;
    } else if (apiAt >= 0) {
      cut = b.md.slice(0, apiAt);
      stop = true;
    } else if (props.docKey === 'getting-started') {
      const firstH2 = b.md.search(/(^|\n)##\s+/);
      if (firstH2 >= 0) {
        cut = b.md.slice(0, firstH2);
        stop = true;
      }
    } else if (props.docKey === 'mcp-skills') {
      const installAt = b.md.search(/(^|\n)##\s*安装指南/);
      if (installAt >= 0) {
        cut = b.md.slice(0, installAt);
        stop = true;
      }
    }
    const trimmed = cut.trim();
    if (trimmed) parts.push(mdToHtml(trimmed));
    if (stop) break;
  }
  return parts.join('\n');
});

const apiHtml = computed(() => {
  const doc = parsed.value;
  if (!doc) return '';
  const parts: string[] = [];
  let started = false;
  for (const b of doc.blocks) {
    if (b.kind === 'live') continue;
    if (!started) {
      if (b.kind === 'prose' && API_RE.test(b.md)) {
        started = true;
        const idx = b.md.search(API_RE);
        parts.push(mdToHtml(b.md.slice(idx).replace(/^\n/, '')));
      }
      continue;
    }
    if (b.kind === 'prose') parts.push(mdToHtml(b.md));
    else if (b.kind === 'import') parts.push(importHtml(b.code));
  }
  return parts.join('\n');
});

const demoHeading = computed(() => props.demoTitle || '代码演示');
const demoAnchor = computed(() =>
  demoHeading.value.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
);
</script>

<template>
  <div class="official-doc">
    <template v-if="parsed">
      <p v-if="parsed.frontmatter.brief && !hideBrief" class="od-brief">{{ parsed.frontmatter.brief }}</p>
      <div v-if="introHtml" class="od-prose" v-html="introHtml" />
      <div v-if="$slots.default" class="od-vue-demos">
        <div class="od-section-head">
          <h2 :id="demoAnchor">{{ demoHeading }}</h2>
          <p v-if="demoCaption">{{ demoCaption }}</p>
        </div>
        <slot />
      </div>
      <div v-if="apiHtml" class="od-prose od-api" v-html="apiHtml" />
    </template>
    <template v-else>
      <slot />
      <Banner v-if="!$slots.default" type="warning" description="未找到对应的官网文档快照，请运行 npm run docs:sync。" />
    </template>
  </div>
</template>

<style scoped>
.od-brief {
  margin: 0 0 28px;
  color: var(--semi-color-text-2);
  font-size: 16px;
  line-height: 1.75;
  max-width: 42em;
}
.od-section-head {
  margin: 4px 0 28px;
}
.od-section-head h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.03em;
  color: var(--semi-color-text-0);
}
.od-section-head p {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--semi-color-text-2);
}
.od-vue-demos {
  margin: 12px 0 48px;
}
.od-prose {
  color: var(--semi-color-text-0);
  font-size: 15px;
  line-height: 1.8;
}
.od-prose :deep(h1),
.od-prose :deep(h2),
.od-prose :deep(h3),
.od-prose :deep(h4) {
  color: var(--semi-color-text-0);
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.35;
}
.od-prose :deep(h1) {
  font-size: 28px;
  margin: 0 0 12px;
}
.od-prose :deep(h2) {
  font-size: 22px;
  margin: 40px 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--semi-color-border);
}
.od-prose :deep(h3) {
  font-size: 17px;
  margin: 28px 0 10px;
}
.od-prose :deep(h4) {
  font-size: 15px;
  margin: 20px 0 8px;
}
.od-prose :deep(p) {
  margin: 0 0 12px;
}
.od-prose :deep(ul),
.od-prose :deep(ol) {
  margin: 0 0 14px;
  padding-left: 22px;
}
.od-prose :deep(li) {
  margin: 4px 0;
}
.od-prose :deep(code) {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  background: var(--semi-color-fill-1);
  padding: 1px 6px;
  border-radius: 4px;
}
.od-prose :deep(a) {
  color: var(--semi-color-link);
  text-decoration: none;
}
.od-prose :deep(a:hover) {
  text-decoration: underline;
}
.od-prose :deep(blockquote.od-notice) {
  margin: 16px 0 20px;
  padding: 12px 16px;
  border-left: 3px solid var(--semi-color-primary);
  background: var(--semi-color-primary-light-default);
  border-radius: 0 8px 8px 0;
}
.od-prose :deep(.od-table-wrap) {
  overflow-x: auto;
  margin: 16px 0 28px;
  border: 1px solid var(--semi-color-border);
  border-radius: 10px;
}
.od-prose :deep(.od-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.od-prose :deep(.od-table th),
.od-prose :deep(.od-table td) {
  border-bottom: 1px solid var(--semi-color-border);
  border-right: none;
  border-left: none;
  padding: 10px 14px;
  vertical-align: top;
  text-align: left;
}
.od-prose :deep(.od-table tr:last-child td) {
  border-bottom: none;
}
.od-prose :deep(.od-table th) {
  background: var(--semi-color-fill-0);
  font-weight: 600;
  white-space: nowrap;
  color: var(--semi-color-text-1);
}
.od-prose :deep(.od-table tbody tr:hover td) {
  background: var(--semi-color-fill-0);
}
.od-prose :deep(.od-code) {
  margin: 0 0 20px;
  padding: 14px 16px;
  background: var(--semi-color-fill-0);
  border: 1px solid var(--semi-color-border);
  border-radius: 10px;
  font-size: 12.5px;
  overflow-x: auto;
  line-height: 1.65;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.od-api {
  margin-top: 8px;
}
.od-prose :deep(.od-img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 16px 0 24px;
  border-radius: 12px;
  border: 1px solid var(--semi-color-border);
}
.od-prose :deep(.od-overview) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin: 8px 0 36px;
}
.od-prose :deep(.od-card) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 96px;
  padding: 16px 18px;
  border: 1px solid var(--semi-color-border);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  background: var(--semi-color-bg-0);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.od-prose :deep(.od-card:hover) {
  border-color: var(--semi-color-primary);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--semi-color-shadow, rgba(0, 0, 0, 0.08)) 70%, transparent);
  transform: translateY(-1px);
}
.od-prose :deep(.od-card-title) {
  font-size: 14px;
  font-weight: 650;
  color: var(--semi-color-text-0);
  letter-spacing: -0.02em;
}
.od-prose :deep(.od-card-brief) {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--semi-color-text-2);
}
.od-prose :deep(.od-card.is-skipped) {
  opacity: 0.72;
}
.od-prose :deep(.od-card-skip) {
  font-size: 11px;
  font-weight: 600;
  color: var(--semi-color-warning);
}
</style>
