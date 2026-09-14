<script setup lang="ts">
import { h } from 'vue';
import { FloatButton, FloatButtonGroup, IconAIEditLevel1, IconAIStrokedLevel3, IconSearchStroked, IconHelpCircleStroked } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const onClick = () => {
  console.log('float button clicked');
};

const groupItems = [
  { icon: h(IconAIStrokedLevel3), content: '编辑', value: 'editor' },
  { icon: h(IconSearchStroked), content: '搜索', value: 'search' },
  { icon: h(IconHelpCircleStroked), content: '帮助', value: 'help' },
];

const onGroupClick = (value: string | undefined, e: MouseEvent) => {
  console.log('点击了 ', value, e);
};
</script>

<template>
  <DemoBlock title="如何引入" code="import { FloatButton, FloatButtonGroup } from 'semi-design-vue'" />

  <DemoBlock title="基本用法" desc="悬浮按钮固定在页面右下角（fixed 定位）。">
    <span>基本使用：页面右下第三列 1 </span>
    <FloatButton :style="{ bottom: '270px' }" @click="onClick">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="支持三种尺寸：默认，小，大。">
    <span>大尺寸：页面右下第三列 2</span>
    <FloatButton size="large" :style="{ bottom: '200px' }" @click="onClick">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="形状" desc="默认定义了两种形状：square（默认）、circle。">
    <span>方形：页面右下第三列 3</span>
    <FloatButton shape="square" :style="{ bottom: '150px' }" @click="onClick">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="点击跳转" desc="可通过 href 设置跳转地址, target 指定目标网页应该在哪个窗口或框架中打开。">
    <span>点击跳转：页面右下第三列 4</span>
    <FloatButton :style="{ bottom: '100px' }" href="https://semi.design" target="_blank">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="AI 风格 - 多彩悬浮按钮" desc="可设置 colorful 为 true，展示多彩的悬浮按钮。">
    <span>多彩按钮：页面右下第一列</span>
    <FloatButton colorful :style="{ bottom: '110px', insetInlineEnd: '150px' }" href="https://semi.design" target="_blank">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="带徽章的" desc="通过 badge 传入 Badge 参数。">
    <span>带徽章：页面右下第二列</span>
    <FloatButton disabled :badge="{ dot: true, type: 'danger' }" :style="{ bottom: '270px', insetInlineEnd: '100px' }">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
    <FloatButton :badge="{ count: 1000, overflowCount: 999 }" size="large" :style="{ bottom: '210px', insetInlineEnd: '100px' }">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
    <FloatButton :badge="{ dot: true }" colorful :style="{ bottom: '170px', insetInlineEnd: '100px' }">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
    <FloatButton colorful size="large" :badge="{ count: 'VIP', type: 'danger' }" :style="{ bottom: '110px', insetInlineEnd: '100px' }">
      <template #icon><IconAIEditLevel1 /></template>
    </FloatButton>
  </DemoBlock>

  <DemoBlock title="悬浮按钮组" desc="可通过 items 传入子项，点击回调返回 (value, e)。">
    <span>The last row at the bottom right of the page</span>
    <FloatButtonGroup :style="{ insetInlineEnd: '24px', bottom: '50px' }" :items="groupItems" @click="onGroupClick" />
  </DemoBlock>
</template>
