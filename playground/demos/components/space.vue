<script setup lang="ts">
import { Space, Button, Switch, Tag, Tabs, TabPane } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const divStyle = {
  width: '80px',
  height: '100px',
  lineHeight: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--semi-color-border)',
  borderRadius: '3px',
};
const aligns = ['start', 'center', 'end', 'baseline'] as const;
const sizes = [
  { tab: 'tight', itemKey: '1', spacing: 'tight' },
  { tab: 'medium', itemKey: '2', spacing: 'medium' },
  { tab: 'loose', itemKey: '3', spacing: 'loose' },
] as const;
</script>

<template>
  <DemoBlock title="如何引入" code="import { Space } from 'semi-design-vue'" />

  <DemoBlock title="基本用法" desc="Space 会为子元素之间加上统一的间距。">
    <Space>
      <Switch :defaultChecked="true" />
      <Button type="secondary">次要</Button>
      <Button type="tertiary">第三</Button>
      <Button type="warning">警告</Button>
    </Space>
  </DemoBlock>

  <DemoBlock title="对齐方式" desc="可使用 align 设置对齐方式，可选值：start、center（默认）、end、baseline。">
    <Space vertical>
      <Space v-for="a in aligns" :key="a" :align="a">
        <div :style="divStyle">文本</div>
        <Button theme="solid" type="primary">按钮</Button>
        <Tag color="green" size="large">标签</Tag>
      </Space>
    </Space>
  </DemoBlock>

  <DemoBlock title="间距尺寸" desc="可使用 spacing 设置间距大小：tight（8px，默认）、medium（16px）、loose（24px），也支持 number 或 [水平, 垂直] 数组。">
    <Tabs type="line">
      <TabPane v-for="s in sizes" :key="s.itemKey" :tab="s.tab" :itemKey="s.itemKey">
        <Space :spacing="s.spacing" :style="{ marginTop: '15px' }">
          <Button v-for="i in 4" :key="i" theme="solid" type="primary">按钮</Button>
        </Space>
      </TabPane>
      <TabPane tab="array" itemKey="4">
        <Space :spacing="[8, 16]" wrap :style="{ marginTop: '15px' }">
          <Button v-for="i in 10" :key="i" theme="solid" type="primary">按钮</Button>
        </Space>
      </TabPane>
    </Tabs>
  </DemoBlock>

  <DemoBlock title="间距方向" desc="可使用 vertical 设置间距是否为垂直方向，默认为 false。">
    <Space vertical>
      <Button v-for="i in 4" :key="i" theme="solid" type="primary">按钮</Button>
    </Space>
  </DemoBlock>

  <DemoBlock title="设置换行" desc="当间距为水平方向时，可使用 wrap 设置是否自动换行，默认为 false。">
    <Space wrap>
      <Button v-for="i in 10" :key="i" theme="solid" type="secondary">按钮</Button>
    </Space>
  </DemoBlock>
</template>
