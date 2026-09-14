<script setup lang="ts">
import { computed, ref } from 'vue';
import { ConfigProvider, LocaleProvider, Sidebar, Button, Space, Switch, Title, Paragraph, theme } from '@/index';
import type { ThemeConfig } from '@/index';
import zh_CN from '@/locale/source/zh_CN';
import en_US from '@/locale/source/en_US';
import DemoBlock from '../DemoBlock.vue';

defineProps<{ name: string }>();
const dark = ref(false);
const useEn = ref(false);
const locale = computed(() => (useEn.value ? en_US : zh_CN));
const localTheme = computed<ThemeConfig>(() => ({
  algorithm: dark.value ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
}));
</script>

<template>
  <template v-if="name === 'configProvider'">
    <DemoBlock title="如何引入" code="import { ConfigProvider, theme } from 'semi-design-vue'" />
    <DemoBlock title="暗色模式" desc="通过 algorithm 切换暗色。也可在本站顶栏全局切换。">
      <Switch v-model="dark">暗色</Switch>
      <ConfigProvider :theme="localTheme">
        <div style="margin-top: 12px; padding: 16px; background: var(--semi-color-bg-0); border: 1px solid var(--semi-color-border)">
          <Button theme="solid">主题按钮</Button>
        </div>
      </ConfigProvider>
    </DemoBlock>
  </template>

  <template v-else-if="name === 'localeProvider'">
    <DemoBlock title="如何引入" code="import { LocaleProvider } from 'semi-design-vue'" />
    <DemoBlock title="切换语言" desc="也可通过 ConfigProvider 的 locale 注入。">
      <Switch v-model="useEn">English</Switch>
      <LocaleProvider :locale="locale">
        <div style="margin-top: 12px">
          <Paragraph>Modal / Pagination 等组件会读取 locale。当前：{{ useEn ? 'en_US' : 'zh_CN' }}</Paragraph>
        </div>
      </LocaleProvider>
    </DemoBlock>
  </template>

  <template v-else-if="name === 'sidebar'">
    <DemoBlock title="如何引入" code="import { Sidebar } from 'semi-design-vue'" />
    <DemoBlock title="基本用法" desc="侧边配置面板。">
      <div style="height: 280px; position: relative; border: 1px solid var(--semi-color-border)">
        <Sidebar :visible="true" />
      </div>
    </DemoBlock>
  </template>
</template>
