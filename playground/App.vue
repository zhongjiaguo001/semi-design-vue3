<template>
  <ConfigProvider :theme="themeConfig">
    <div class="docs-shell" :class="{ 'is-dark': dark, 'sider-open': siderOpen }">
      <div class="docs-mask" v-show="siderOpen" @click="siderOpen = false" />
      <aside class="docs-sider">
        <div class="docs-brand" @click="go('getting-started')">
          <IconSemiLogo size="extra-large" class="docs-logo" />
          <div class="docs-brand-col">
            <strong>Semi Design</strong>
            <span>Vue 组件文档</span>
          </div>
        </div>
        <div class="docs-search">
          <Input v-model="query" placeholder="搜索组件" showClear aria-label="搜索组件">
            <template #prefix>
              <IconSearch />
            </template>
          </Input>
        </div>
        <Nav
          class="docs-nav"
          :items="filteredNavItems"
          :selectedKeys="[selected]"
          :openKeys="navOpenKeys"
          :limitIndent="false"
          :subNavMotion="false"
          :style="navStyle"
          @select="onNavSelect"
          @openChange="onOpenChange"
        />
        <div v-if="query.trim() && !filteredNavItems.length" class="docs-nav-empty">无匹配组件</div>
        <div class="docs-sider-foot">Vue 3 · Semi 2.103.0</div>
      </aside>
      <div class="docs-main">
        <header class="docs-header">
          <button type="button" class="docs-icon-btn docs-menu-btn" aria-label="打开菜单" @click="siderOpen = !siderOpen">
            <IconMenu />
          </button>
          <div class="docs-crumb">
            <span v-if="currentGroupTitle" class="docs-crumb-group">{{ currentGroupTitle }}</span>
            <span v-if="currentGroupTitle" class="docs-crumb-sep">/</span>
            <span class="docs-crumb-page">{{ currentTitle }}</span>
          </div>
          <div class="docs-header-actions">
            <a class="docs-link" :href="officialUrl" target="_blank" rel="noreferrer">官方文档</a>
            <span class="docs-ver">2.103.0</span>
            <span class="docs-header-divider" />
            <button
              type="button"
              class="docs-icon-btn"
              :title="dark ? '切换亮色' : '切换暗色'"
              :aria-label="dark ? '切换亮色' : '切换暗色'"
              @click="dark = !dark"
            >
              <IconSun v-if="dark" />
              <IconMoon v-else />
            </button>
          </div>
        </header>
        <main class="docs-content" ref="contentEl">
          <div class="docs-body">
            <div class="docs-page">
              <header class="docs-hero">
                <h1>{{ currentTitle }}</h1>
                <p v-if="currentBrief" class="docs-lead">{{ currentBrief }}</p>
                <div class="docs-meta">
                  <span>Vue 3</span>
                  <span>Semi 2.103.0</span>
                </div>
              </header>
              <OfficialDoc v-if="selected === 'introduction' || selected === 'overview'" :docKey="selected" hideBrief />
              <OfficialDoc
                v-else-if="selected === 'getting-started'"
                :docKey="selected"
                hideBrief
                demoTitle="Vue 3 用法"
              >
                <GettingStarted />
              </OfficialDoc>
              <OfficialDoc
                v-else-if="selected === 'mcp-skills'"
                :docKey="selected"
                hideBrief
                demoTitle="Vue 3 MCP"
              >
                <McpDocs />
              </OfficialDoc>
              <OfficialDoc v-else :docKey="selected" hideBrief>
                <component v-if="componentDemo" :is="componentDemo" />
                <BasicDemos v-else-if="isGroup('basic')" :name="selected" />
                <ButtonDemos v-else-if="selected === 'button'" />
                <TableDemos v-else-if="selected === 'table'" />
                <InputDemos v-else-if="isGroup('cat-input') && selected !== 'button'" :name="selected" />
                <NavDemos v-else-if="isGroup('cat-navigation')" :name="selected" />
                <DisplayDemos v-else-if="isGroup('display')" :name="selected" />
                <FeedbackDemos v-else-if="isGroup('feedback')" :name="selected" />
                <PlusAIDemos v-else-if="isGroup('plus') || isGroup('ai')" :name="selected" />
                <OtherDemos v-else-if="isGroup('other')" :name="selected" />
              </OfficialDoc>
            </div>
            <aside v-if="tocTree.length" class="docs-toc">
              <div class="docs-toc-label">本页目录</div>
              <Anchor
                :key="selected"
                size="small"
                rail-theme="muted"
                :show-tooltip="true"
                position="left"
                :scroll-motion="true"
                :get-container="getTocContainer"
                :target-offset="12"
                :offset-top="12"
                :max-width="188"
                max-height="calc(100vh - 140px)"
                aria-label="本页目录"
                @click="onTocClick"
              >
                <Anchor.Link v-for="h2 in tocTree" :key="h2.id" :href="'#' + h2.id" :title="h2.text">
                  <Anchor.Link v-for="h3 in h2.children" :key="h3.id" :href="'#' + h3.id" :title="h3.text" />
                </Anchor.Link>
              </Anchor>
            </aside>
          </div>
        </main>
      </div>
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ConfigProvider,
  Nav,
  Input,
  Anchor,
  IconSemiLogo,
  IconSearch,
  IconMenu,
  IconMoon,
  IconSun,
  theme,
} from '@/index';
import type { ThemeConfig } from '@/index';
import { catalog, defaultPage, findItem } from './catalog';
import { getOfficialMarkdown } from './official/loadDocs';
import { parseOfficialMd } from './official/parseOfficialMd';
import GettingStarted from './pages/GettingStarted.vue';
import McpDocs from './pages/McpDocs.vue';
import BasicDemos from './demos/BasicDemos.vue';
import ButtonDemos from './demos/ButtonDemos.vue';
import TableDemos from './demos/TableDemos.vue';
import InputDemos from './demos/InputDemos.vue';
import NavDemos from './demos/NavDemos.vue';
import DisplayDemos from './demos/DisplayDemos.vue';
import FeedbackDemos from './demos/FeedbackDemos.vue';
import PlusAIDemos from './demos/PlusAIDemos.vue';
import OtherDemos from './demos/OtherDemos.vue';
import OfficialDoc from './official/OfficialDoc.vue';

const componentDemoModules = import.meta.glob('./demos/components/*.vue', { eager: true, import: 'default' }) as Record<string, any>;
const componentDemos: Record<string, any> = {};
for (const [p, mod] of Object.entries(componentDemoModules)) {
  const key = (p.split('/').pop() || '').replace(/\.vue$/, '');
  componentDemos[key] = mod;
}
const DEMO_ALIAS: Record<string, string> = { aiButton: 'button', aiTag: 'tag', aiIcon: 'icon', aiFloatButton: 'floatButton', vchart: 'chart' };

const pageFromHash = () => {
  const key = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return key && findItem(key) ? key : defaultPage;
};
const selected = ref(pageFromHash());
const query = ref('');
const siderOpen = ref(false);
const contentEl = ref<HTMLElement | null>(null);
const toc = ref<Array<{ id: string; text: string; level: number }>>([]);
type TocNode = { id: string; text: string; level: number; children: TocNode[] };
const tocTree = computed<TocNode[]>(() => {
  const roots: TocNode[] = [];
  let current: TocNode | null = null;
  for (const t of toc.value) {
    if (t.level === 2) {
      current = { ...t, children: [] };
      roots.push(current);
    } else if (current) {
      current.children.push({ ...t, children: [] });
    } else {
      roots.push({ ...t, children: [] });
    }
  }
  return roots;
});
const getTocContainer = () => contentEl.value || window;
const onTocClick = (e: Event | null) => {
  e?.preventDefault?.();
};

const readDark = () => {
  try {
    return localStorage.getItem('semi-vue-docs-dark') === '1';
  } catch {
    return false;
  }
};
const dark = ref(readDark());
const componentDemo = computed(() => componentDemos[selected.value] || componentDemos[DEMO_ALIAS[selected.value] || ''] || null);
const allGroupKeys = catalog.map((g) => g.key);
const userOpenKeys = ref<Array<string | number>>([...allGroupKeys]);
const navOpenKeys = computed(() => (query.value.trim() ? allGroupKeys : userOpenKeys.value));
const navStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  paddingLeft: 0,
  paddingRight: 0,
};

const allNavItems = catalog.map((g) => ({
  itemKey: g.key,
  text: g.title,
  items: g.items.map((i) => ({ itemKey: i.key, text: i.title })),
}));

const filteredNavItems = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return allNavItems;
  return catalog
    .map((g) => ({
      itemKey: g.key,
      text: g.title,
      items: g.items
        .filter((i) => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q))
        .map((i) => ({ itemKey: i.key, text: i.title })),
    }))
    .filter((g) => g.items.length);
});

const currentItem = computed(() => findItem(selected.value));
const currentTitle = computed(() => currentItem.value?.title || 'Semi Design Vue');
const currentBrief = computed(() => {
  const raw = getOfficialMarkdown(selected.value);
  const official = raw ? parseOfficialMd(raw).frontmatter.brief : '';
  return official || currentItem.value?.brief || '';
});
const currentGroupTitle = computed(() => catalog.find((g) => g.items.some((i) => i.key === selected.value))?.title || '');

const officialUrl = computed(() => {
  const map: Record<string, string> = {
    introduction: 'https://semi.design/zh-CN/start/introduction',
    'getting-started': 'https://semi.design/zh-CN/start/getting-started',
    'mcp-skills': 'https://semi.design/zh-CN/start/mcp-skills',
    overview: 'https://semi.design/zh-CN/start/overview',
  };
  if (map[selected.value]) return map[selected.value];
  const groupPath: Record<string, string> = {
    start: 'start',
    basic: 'basic',
    ai: 'ai',
    'cat-input': 'input',
    'cat-navigation': 'navigation',
    display: 'show',
    feedback: 'feedback',
    plus: 'plus',
    other: 'other',
  };
  const cat = groupPath[groupOf(selected.value) || ''] || 'start';
  return `https://semi.design/zh-CN/${cat}/${selected.value.toLowerCase()}`;
});

const themeConfig = computed<ThemeConfig>(() => ({
  algorithm: dark.value ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
}));

watch(
  dark,
  (v) => {
    document.body.setAttribute('theme-mode', v ? 'dark' : '');
    document.documentElement.style.colorScheme = v ? 'dark' : 'light';
    try {
      localStorage.setItem('semi-vue-docs-dark', v ? '1' : '0');
    } catch {
      /* ignore */
    }
  },
  { immediate: true }
);

const groupOf = (key: string) => catalog.find((g) => g.items.some((i) => i.key === key))?.key;
const isGroup = (g: string) => groupOf(selected.value) === g;

const go = (key: string) => {
  if (!findItem(key)) return;
  selected.value = key;
  location.hash = key;
  siderOpen.value = false;
};

const onNavSelect = (data: any) => {
  const k = typeof data === 'string' ? data : data?.itemKey;
  if (k && findItem(String(k))) go(String(k));
};

const onOpenChange = (data: any) => {
  if (query.value.trim()) return;
  const keys = data?.openKeys;
  if (Array.isArray(keys)) userOpenKeys.value = keys;
};

const syncHash = () => {
  const key = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  if (key && findItem(key)) selected.value = key;
};

const headingText = (el: Element) =>
  [...el.childNodes]
    .filter((n) => n.nodeType === 3 || (n instanceof HTMLElement && !n.classList.contains('demo-block-anchor')))
    .map((n) => n.textContent || '')
    .join('')
    .replace(/^#\s*/, '')
    .trim();

const collectToc = () => {
  const root = contentEl.value;
  if (!root) {
    toc.value = [];
    return;
  }
  const nodes = root.querySelectorAll('.docs-page h2, .docs-page h3');
  toc.value = [...nodes]
    .filter((el) => !el.closest('.demo-block-live'))
    .map((el) => {
      const text = headingText(el);
      let id = el.id;
      if (!id && text) {
        id = text.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
        el.id = id;
      }
      return { id, text, level: el.tagName === 'H2' ? 2 : 3 };
    })
    .filter((t) => t.id && t.text);
};

let tocTimer = 0;
const scheduleToc = () => {
  window.clearTimeout(tocTimer);
  tocTimer = window.setTimeout(() => collectToc(), 50);
};

const scrollNavSelected = () => {
  const nav = document.querySelector('.docs-nav') as HTMLElement | null;
  const el = nav?.querySelector('.semi-navigation-item-selected') as HTMLElement | null;
  if (!nav || !el) return;
  const n = nav.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  nav.scrollTop += e.top - n.top - n.height / 3;
};

watch(
  selected,
  async () => {
    siderOpen.value = false;
    toc.value = [];
    const g = groupOf(selected.value);
    if (g && !userOpenKeys.value.includes(g)) userOpenKeys.value = [...userOpenKeys.value, g];
    await nextTick();
    if (contentEl.value) contentEl.value.scrollTop = 0;
    scheduleToc();
    await nextTick();
    scrollNavSelected();
  },
  { flush: 'post' }
);

onMounted(() => {
  syncHash();
  window.addEventListener('hashchange', syncHash);
  scheduleToc();
  nextTick(scrollNavSelected);
});
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncHash);
  window.clearTimeout(tocTimer);
});
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}
html {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body {
  background: var(--semi-color-bg-0);
  color: var(--semi-color-text-0);
}

.docs-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--semi-color-bg-0);
  color: var(--semi-color-text-0);
}
.docs-mask {
  display: none;
}
.docs-sider {
  flex: 0 0 280px;
  width: 280px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--semi-color-border);
  background: var(--semi-color-bg-1);
  z-index: 30;
}
.docs-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px 12px;
  cursor: pointer;
  user-select: none;
}
.docs-logo {
  flex-shrink: 0;
  color: var(--semi-color-primary);
}
.docs-brand-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.docs-brand-col strong {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--semi-color-text-0);
}
.docs-brand-col span {
  margin-top: 3px;
  font-size: 12px;
  color: var(--semi-color-text-2);
}
.docs-search {
  padding: 0 16px 12px;
}
.docs-search .semi-input-wrapper {
  background: var(--semi-color-fill-0);
}
.docs-nav.semi-navigation {
  flex: 1;
  width: 100% !important;
  height: auto !important;
  min-height: 0;
  overflow: auto;
  background: transparent !important;
  border-right: none !important;
  padding: 0 10px 16px !important;
}
.docs-nav .semi-navigation-inner,
.docs-nav .semi-navigation-list-wrapper,
.docs-nav .semi-navigation-list {
  width: 100%;
}
.docs-nav .semi-navigation-list > .semi-navigation-sub-wrap {
  margin-top: 6px;
}
.docs-nav .semi-navigation-list > .semi-navigation-sub-wrap:first-child {
  margin-top: 0;
}
.docs-nav .semi-navigation-item {
  border-radius: 8px !important;
  margin: 1px 0;
}
.docs-nav .semi-navigation-sub-title {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--semi-color-text-2) !important;
  letter-spacing: 0.02em;
}
.docs-nav .semi-navigation-item-normal {
  font-size: 13.5px;
}
.docs-nav .semi-navigation-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.docs-nav .semi-navigation-item-selected {
  background: var(--semi-color-primary-light-default) !important;
  font-weight: 600;
}
.docs-nav .semi-navigation-item-selected,
.docs-nav .semi-navigation-item-selected .semi-navigation-item-text {
  color: var(--semi-color-primary) !important;
}
.docs-nav::-webkit-scrollbar,
.docs-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.docs-nav::-webkit-scrollbar-thumb,
.docs-content::-webkit-scrollbar-thumb {
  background: var(--semi-color-fill-2);
  border-radius: 8px;
}
.docs-nav-empty {
  padding: 8px 20px 16px;
  font-size: 13px;
  color: var(--semi-color-text-2);
}
.docs-sider-foot {
  flex-shrink: 0;
  padding: 10px 20px 14px;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--semi-color-text-2);
  border-top: 1px solid var(--semi-color-border);
}

.docs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--semi-color-bg-0);
}
.docs-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid var(--semi-color-border);
  background: color-mix(in srgb, var(--semi-color-bg-0) 88%, transparent);
  backdrop-filter: blur(12px);
  z-index: 20;
}
.docs-crumb {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--semi-color-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.docs-crumb-sep {
  opacity: 0.55;
}
.docs-crumb-page {
  color: var(--semi-color-text-0);
  font-weight: 600;
}
.docs-header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.docs-link {
  color: var(--semi-color-link);
  text-decoration: none;
  font-size: 13px;
}
.docs-link:hover {
  text-decoration: underline;
}
.docs-ver {
  font-size: 12px;
  font-weight: 600;
  color: var(--semi-color-text-2);
  background: var(--semi-color-fill-1);
  padding: 2px 8px;
  border-radius: 999px;
}
.docs-header-divider {
  width: 1px;
  height: 16px;
  background: var(--semi-color-border);
}
.docs-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--semi-color-text-1);
  cursor: pointer;
}
.docs-icon-btn:hover {
  background: var(--semi-color-fill-1);
  color: var(--semi-color-text-0);
}
.docs-menu-btn {
  display: none;
}

.docs-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.docs-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 188px;
  gap: 40px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 48px 96px;
}
.docs-page {
  min-width: 0;
  max-width: 920px;
}
.docs-hero {
  margin: 0 0 28px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--semi-color-border);
}
.docs-hero h1 {
  margin: 0 0 10px;
  font-size: 34px;
  font-weight: 720;
  letter-spacing: -0.04em;
  line-height: 1.2;
  color: var(--semi-color-text-0);
}
.docs-lead {
  margin: 0 0 14px;
  max-width: 42em;
  font-size: 16px;
  line-height: 1.75;
  color: var(--semi-color-text-2);
}
.docs-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.docs-meta span {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--semi-color-fill-1);
  color: var(--semi-color-text-2);
  font-size: 12px;
  font-weight: 600;
}

.docs-toc {
  position: sticky;
  top: 24px;
  align-self: start;
}
.docs-toc-label {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 650;
  color: var(--semi-color-text-2);
  letter-spacing: 0.06em;
}
.docs-toc .semi-anchor {
  background: transparent;
  border: none;
  padding: 0;
}

.doc-article h1,
.doc-article :deep(.semi-typography-h1) {
  margin-bottom: 12px;
}
.doc-article h2,
.doc-article :deep(.semi-typography-h2) {
  margin: 28px 0 12px;
}
.doc-pre {
  background: var(--semi-color-fill-0);
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 13px;
  overflow-x: auto;
  line-height: 1.65;
  border: 1px solid var(--semi-color-border);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.doc-live {
  margin-top: 12px;
}

h2[id],
h3[id] {
  scroll-margin-top: 12px;
}

@media (max-width: 1180px) {
  .docs-body {
    grid-template-columns: minmax(0, 1fr);
    padding: 32px 32px 80px;
  }
  .docs-toc {
    display: none;
  }
}
@media (max-width: 960px) {
  .docs-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.38);
    z-index: 25;
  }
  .docs-sider {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: var(--semi-shadow-elevated, 0 8px 24px rgba(0, 0, 0, 0.12));
  }
  .docs-shell.sider-open .docs-sider {
    transform: none;
  }
  .docs-menu-btn {
    display: inline-flex;
  }
  .docs-body {
    padding: 24px 20px 64px;
  }
  .docs-hero h1 {
    font-size: 28px;
  }
  .docs-link,
  .docs-ver {
    display: none;
  }
  .docs-header {
    padding: 0 12px;
  }
}
</style>
