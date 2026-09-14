<script setup lang="ts">
import { Button, Toast, Title, Paragraph, Text, Banner } from '@/index';
</script>

<template>
  <article class="doc-article">
    <Banner type="info" title="和官网的差异" description="官方文档安装的是 @douyinfe/semi-ui（React）。本仓库是 Vue 3 适配层，包名为 semi-design-vue3，API 与 React 版对齐，事件使用 Vue 的 emit / v-model。" />

    <Title :heading="2">1、安装</Title>
    <Paragraph>在本仓库开发：</Paragraph>
    <pre class="doc-pre">npm install
npm run dev</pre>
    <Paragraph>业务项目中引用源码或构建产物：</Paragraph>
    <pre class="doc-pre"># 开发时通过 workspace / alias 指向本仓库 src
import { Button, Toast } from 'semi-design-vue3'</pre>

    <Title :heading="2">2、使用组件</Title>
    <Paragraph>无需额外编译配置，直接引入即可（CSS 由组件内部按需 import foundation css）。</Paragraph>
    <pre class="doc-pre">import { Button, Toast } from 'semi-design-vue3'

const hello = () => Toast.warning({ content: 'welcome' })
</pre>
    <div class="doc-live">
      <Button @click="() => Toast.warning({ content: 'welcome' })">Hello Semi</Button>
    </div>

    <Title :heading="2">3、Vue 用法对照</Title>
    <Paragraph>
      React 的 <Text code>onClick</Text> / <Text code>onChange</Text> 在 Vue 中为 <Text code>@click</Text> / <Text code>@change</Text>。受控值优先使用 <Text code>v-model</Text>（内部 alias 到 React 的 value）。
    </Paragraph>
    <pre class="doc-pre">&lt;!-- React --&gt;
&lt;Input value={text} onChange={setText} /&gt;

&lt;!-- Vue --&gt;
&lt;Input v-model="text" /&gt;</pre>

    <Title :heading="2">4、主题</Title>
    <Paragraph>用 ConfigProvider 包一层，传入 algorithm 与 token：</Paragraph>
    <pre class="doc-pre">import { ConfigProvider, theme } from 'semi-design-vue3'

&lt;ConfigProvider :theme="{ algorithm: [theme.defaultAlgorithm] }"&gt;
  &lt;App /&gt;
&lt;/ConfigProvider&gt;</pre>

    <Title :heading="2">5、下一步</Title>
    <Paragraph>从左侧「Overview 组件总览」进入各组件，查看官网结构对应的用法、说明和可交互示例。AI 接入见「MCP / Skills」。</Paragraph>
  </article>
</template>
