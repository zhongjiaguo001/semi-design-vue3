<script setup lang="ts">
import { FloatButton, IconAIEditLevel1 } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { FloatButton, IconAIEditLevel1 } from 'semi-design-vue';`;
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="官网 AIFloatButton = FloatButton 的 colorful。"
    :code="importCode"
  />

  <DemoBlock title="AI 风格 - 多彩悬浮按钮" desc="完整尺寸/形状/分组示例见 FloatButton 文档。">
    <FloatButton
      :icon="IconAIEditLevel1"
      colorful
      size="large"
      :badge="{ count: 'VIP', type: 'danger' }"
      :style="{ position: 'static' }"
    />
  </DemoBlock>
</template>
