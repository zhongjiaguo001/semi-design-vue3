<script setup lang="ts">
import { Button, Title, IconAIFilledLevel1, IconAIFilledLevel3 } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Button, IconAIFilledLevel1 } from 'semi-design-vue';`;
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="官网 AIButton = Button 的 colorful。type 仅支持 primary / tertiary，支持全部 theme。"
    :code="importCode"
  />

  <DemoBlock title="AI 风格 - 多彩按钮" desc="设置 colorful 即可。完整主题/尺寸示例见 Button 文档。">
    <div style="display: flex; flex-direction: column; row-gap: 16px">
      <div style="display: flex; column-gap: 16px; flex-wrap: wrap">
        <Button colorful theme="solid" type="primary" :icon="IconAIFilledLevel1">Colorful</Button>
        <Button colorful theme="solid" type="primary" loading>Colorful</Button>
        <Button colorful theme="solid" type="primary" :icon="IconAIFilledLevel1" disabled>Colorful</Button>
      </div>
      <div style="display: flex; column-gap: 16px; flex-wrap: wrap">
        <Button colorful theme="solid" type="tertiary" :icon="IconAIFilledLevel3">Colorful</Button>
        <Button colorful theme="solid" type="tertiary" loading>Colorful</Button>
        <Button colorful theme="solid" type="tertiary" :icon="IconAIFilledLevel3" disabled>Colorful</Button>
      </div>
      <div style="display: flex; column-gap: 16px; flex-wrap: wrap">
        <Button colorful theme="solid" type="primary" :icon="IconAIFilledLevel1" />
        <Button colorful theme="solid" type="primary" loading />
        <Button colorful theme="solid" type="primary" :icon="IconAIFilledLevel1" disabled />
        <Button colorful theme="solid" type="tertiary" :icon="IconAIFilledLevel3" />
        <Button colorful theme="solid" type="tertiary" loading />
        <Button colorful theme="solid" type="tertiary" :icon="IconAIFilledLevel3" disabled />
      </div>
    </div>
  </DemoBlock>
</template>
