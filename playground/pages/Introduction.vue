<script setup lang="ts">
import { Typography, Title, Paragraph, Text } from '@/index';
</script>

<template>
  <article class="doc-article">
    <Title :heading="1">Introduction 介绍</Title>
    <Paragraph>
      Semi Design 是由抖音前端团队、MED 产品设计团队设计、开发并维护的设计系统。它作为全面、易用、优质的现代应用 UI 解决方案，从字节跳动各业务线的复杂场景提炼而来。
    </Paragraph>
    <Title :heading="2">本仓库</Title>
    <Paragraph>
      <Text strong>semi-design-vue</Text>
      复用官方
      <Text code>@douyinfe/semi-foundation</Text>
      （业务逻辑 + CSS），仅将 React Adapter（<Text code>@douyinfe/semi-ui</Text>）改写为 Vue 3。Foundation 层保持框架无关，这与 Semi 官方介绍中的 F/A 分层一致。
    </Paragraph>
    <Title :heading="3">Foundation</Title>
    <Paragraph>包含组件交互的业务逻辑。不直接操作 DOM，需要更新 UI 时委派给 Adapter。</Paragraph>
    <Title :heading="3">Adapter</Title>
    <Paragraph>
      本仓库用 Vue 3 的 <Text code>defineComponent</Text> + <Text code>h()</Text> + <Text code>useBaseComponent</Text> 实现 Adapter：声明 DOM、把 props/state 映射给 Foundation。
    </Paragraph>
    <Title :heading="2">主题与暗色</Title>
    <Paragraph>
      左侧菜单顶部可切换 Dark。底层走 ConfigProvider 的 algorithm（default / dark / compact），与 Semi DSM Token 体系对齐。
    </Paragraph>
    <Title :heading="2">国际化</Title>
    <Paragraph>内置 zh_CN 等 locale。可通过 ConfigProvider 的 locale 或 LocaleProvider 切换。</Paragraph>
  </article>
</template>
