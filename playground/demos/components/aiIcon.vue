<script setup lang="ts">
import {
  Title,
  IconAIBellLevel1,
  IconAIEditLevel2,
  IconAIFileLevel3,
  IconAIFilledLevel3,
  IconAIImageLevel3,
  IconAISearchLevel3,
  IconAIStrokedLevel3,
  IconAIWandLevel3,
  IconAILoading,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { IconAIFilledLevel1, IconAIWandLevel3 } from 'semi-design-vue';`;
const purpleDots = Array.from({ length: 10 }, (_, i) => i);
const generalDots = Array.from({ length: 10 }, (_, i) => i);
const wandFill = ['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)'];
</script>

<template>
  <DemoBlock
    title="如何引入"
    desc="官网 AIIcon 不是独立包，而是 IconAI* 系列（单色 / 双色 / 多色，共 25 个）。"
    :code="importCode"
  />

  <DemoBlock title="AI Token" desc="在基础色中新增 AI purple 与 AI general 两个色相、各 10 档色盘。">
    <div style="display: flex; flex-direction: column; row-gap: 10px">
      <div style="display: flex; align-items: center; column-gap: 10px">
        <span>Purple</span>
        <div style="display: inline-flex; column-gap: 4px">
          <div
            v-for="i in purpleDots"
            :key="'p' + i"
            :style="{ width: '40px', height: '40px', backgroundColor: `rgba(var(--semi-ai-purple-${i}), 1)`, borderRadius: '50%' }"
          />
        </div>
      </div>
      <div style="display: flex; align-items: center; column-gap: 10px">
        <span>General</span>
        <div style="display: inline-flex; column-gap: 4px">
          <div
            v-for="i in generalDots"
            :key="'g' + i"
            :style="{ width: '40px', height: '40px', background: `var(--semi-ai-general-${i})`, borderRadius: '50%' }"
          />
        </div>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="AI Icon" desc="支持单色、双色及多色。多色通过 fill 传入颜色数组。">
    <div style="display: flex; column-gap: 10px; flex-wrap: wrap; align-items: center">
      <IconAIBellLevel1 size="extra-large" />
      <IconAIEditLevel2 size="extra-large" />
      <IconAIFileLevel3 size="extra-large" />
      <IconAIFilledLevel3 size="extra-large" />
      <IconAIImageLevel3 size="extra-large" />
      <IconAISearchLevel3 size="extra-large" />
      <IconAIStrokedLevel3 size="extra-large" />
      <IconAIWandLevel3 :fill="wandFill" size="extra-large" />
      <IconAILoading size="extra-large" />
    </div>
  </DemoBlock>
</template>
