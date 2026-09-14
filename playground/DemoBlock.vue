<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  desc?: string;
  code?: string;
}>();

const anchor = computed(() =>
  String(props.title || '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
);
</script>

<template>
  <section class="demo-block">
    <header class="demo-block-head">
      <h3 class="demo-block-title" :id="anchor">
        <span class="demo-block-anchor" aria-hidden="true">#</span>
        {{ title }}
      </h3>
      <p v-if="desc" class="demo-block-desc">{{ desc }}</p>
    </header>
    <div class="demo-block-card">
      <div v-if="$slots.default" class="demo-block-live">
        <slot />
      </div>
      <details v-if="code" class="demo-block-code">
        <summary>查看代码</summary>
        <pre><code>{{ code }}</code></pre>
      </details>
    </div>
  </section>
</template>

<style scoped>
.demo-block {
  margin-bottom: 48px;
}
.demo-block-head {
  margin-bottom: 14px;
}
.demo-block-title {
  position: relative;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: var(--semi-color-text-0);
  line-height: 1.4;
}
.demo-block-anchor {
  position: absolute;
  left: -1.05em;
  color: var(--semi-color-primary);
  opacity: 0;
  font-weight: 500;
}
.demo-block:hover .demo-block-anchor {
  opacity: 1;
}
.demo-block-desc {
  margin: 0;
  color: var(--semi-color-text-2);
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  max-width: 52em;
}
.demo-block-card {
  border: 1px solid var(--semi-color-border);
  border-radius: 12px;
  background: var(--semi-color-bg-0);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--semi-color-shadow, rgba(0, 0, 0, 0.06)) 55%, transparent);
  overflow: hidden;
}
.demo-block-live {
  padding: 24px;
}
.demo-block-code {
  background: var(--semi-color-fill-0);
  border-top: 1px solid var(--semi-color-border);
}
.demo-block-code summary {
  cursor: pointer;
  user-select: none;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--semi-color-text-2);
  list-style: none;
}
.demo-block-code summary::-webkit-details-marker {
  display: none;
}
.demo-block-code summary::before {
  content: '';
  display: inline-block;
  width: 0;
  height: 0;
  margin-right: 8px;
  border-left: 5px solid var(--semi-color-text-2);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transform: translateY(-1px);
}
.demo-block-code[open] summary::before {
  transform: rotate(90deg) translateY(-1px);
}
.demo-block-code pre {
  margin: 0;
  padding: 12px 16px 16px;
  font-size: 12.5px;
  line-height: 1.65;
  overflow-x: auto;
  color: var(--semi-color-text-1);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
