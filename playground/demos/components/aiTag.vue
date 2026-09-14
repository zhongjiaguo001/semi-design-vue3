<script setup lang="ts">
import { h } from 'vue';
import { Tag, IconAIFilledLevel1, IconAIFilledLevel3 } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Tag, IconAIFilledLevel1 } from 'semi-design-vue';`;
const iconL1 = () => h(IconAIFilledLevel1, { size: 'small' });
const iconL3 = () => h(IconAIFilledLevel3, { size: 'small' });
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="官网 AITag = Tag 的 colorful。gradient 控制是否渐变。多彩标签字重与普通标签不同。"
    :code="importCode"
  />

  <DemoBlock title="AI 风格 - 多彩标签" desc="完整颜色/尺寸示例见 Tag 文档。">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 10px; width: fit-content">
      <Tag colorful :prefixIcon="iconL1" type="solid" shape="circle" gradient>AI</Tag>
      <Tag colorful :prefixIcon="iconL3" type="light" shape="circle" gradient>AI</Tag>
      <Tag colorful :prefixIcon="iconL3" type="ghost" shape="circle" gradient>AI</Tag>
      <Tag colorful :prefixIcon="iconL1" type="solid" shape="circle">AI</Tag>
      <Tag colorful :prefixIcon="iconL1" type="light" shape="circle">AI</Tag>
      <Tag colorful :prefixIcon="iconL1" type="ghost" shape="circle">AI</Tag>
    </div>
  </DemoBlock>
</template>
