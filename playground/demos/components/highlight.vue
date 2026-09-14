<script setup lang="ts">
import { Highlight } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const sourceString = '从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中';
const searchWords = ['设计系统', 'Semi Design'];

const tealStyle = {
  borderRadius: 6,
  marginLeft: 4,
  marginRight: 4,
  paddingLeft: 4,
  paddingRight: 4,
  backgroundColor: 'rgba(var(--semi-teal-5), 1)',
  color: 'rgba(var(--semi-white), 1)',
};
const primaryStyle = {
  borderRadius: 6,
  marginLeft: 4,
  marginRight: 4,
  paddingLeft: 4,
  paddingRight: 4,
  backgroundColor: 'var(--semi-color-primary)',
  color: 'rgba(var(--semi-white), 1)',
};

const complexWords = [
  { text: 'Semi', style: { backgroundColor: 'rgba(var(--semi-teal-5), 1)', color: 'rgba(var(--semi-white), 1)', padding: 4 }, className: 'keyword1' },
  { text: '设计系统', style: { backgroundColor: 'var(--semi-color-primary)', color: 'rgba(var(--semi-white), 1)', padding: 4 }, className: 'keyword2' },
  { text: '设计稿和代码', style: { backgroundColor: 'rgba(var(--semi-violet-5), 1)', color: 'rgba(var(--semi-white), 1)', padding: 4 }, className: 'keyword3' },
];
</script>

<template>
  <DemoBlock title="如何引入" desc="Highlight 从 v2.24.0 版本开始支持" code="import { Highlight } from '@/index';" />

  <DemoBlock title="基本用法" desc="通过 searchWords 指定需要高亮的关键字，通过 sourceString 指定源文本">
    <h2>
      <Highlight :sourceString="sourceString" :searchWords="searchWords" />
    </h2>
  </DemoBlock>

  <DemoBlock title="指定高亮样式" desc="通过 highlightClassName、highlightStyle 自定义高亮样式">
    <h2>
      <Highlight :sourceString="sourceString" :searchWords="searchWords" :highlightStyle="tealStyle" />
    </h2>
    <h2>
      <Highlight :sourceString="sourceString" :searchWords="searchWords" :highlightStyle="primaryStyle" />
    </h2>
  </DemoBlock>

  <DemoBlock title="不同文本使用差异化样式" desc="searchWords 传入对象数组时，可通过 text 指定高亮文本，并单独指定 className、style">
    <h2>
      <Highlight
        component="span"
        sourceString="从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中"
        :searchWords="complexWords"
        :highlightStyle="{ borderRadius: 4 }"
      />
    </h2>
  </DemoBlock>

  <DemoBlock title="指定高亮标签" desc="默认用 mark 标签包裹匹配文本，可通过 component 重新指定标签">
    <h2>
      <Highlight :sourceString="sourceString" :searchWords="searchWords" component="strong" />
    </h2>
  </DemoBlock>
</template>
