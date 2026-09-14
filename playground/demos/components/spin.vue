<script setup lang="ts">
import { h, ref } from 'vue';
import { Spin, Button, IconLoading } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Spin } from 'semi-design-vue';`;

const loading = ref(false);
const toggle = () => {
  loading.value = !loading.value;
};

const wrapStyle = {
  border: '1px solid var(--semi-color-primary)',
  borderRadius: '4px',
  paddingLeft: '8px',
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法">
    <div style="margin-left: 30px">
      <div style="margin-bottom: 10px">A basic spin.</div>
      <Spin />
    </div>
  </DemoBlock>

  <DemoBlock title="尺寸" desc="组件定义了三种尺寸：大、中（默认）、小。">
    <div style="margin-left: 30px">
      <div style="margin-bottom: 5px">size: small</div>
      <Spin size="small" />
      <br />
      <br />
      <div style="margin-bottom: 10px">size: middle</div>
      <Spin size="middle" />
      <br />
      <br />
      <div style="margin-bottom: 15px">size: large</div>
      <Spin size="large" />
    </div>
  </DemoBlock>

  <DemoBlock title="带文字的" desc="通过 tip 属性可设置当 Spin 用作包裹元素时的文字。">
    <Spin tip="I am loading...">
      <div :style="wrapStyle">
        <p>Here are some texts.</p>
        <p>And more texts on the way.</p>
      </div>
    </Spin>
  </DemoBlock>

  <DemoBlock title="自定义指示符" desc="可以通过设置 indicator 属性自定义 Spin 的指示符样式。">
    <div style="margin-left: 30px">
      <div>A spin with customized indicator.</div>
      <Spin :indicator="h(IconLoading)" />
    </div>
  </DemoBlock>

  <DemoBlock title="延迟显示" desc="通过 delay 设置延迟显示 loading 的效果。组件是否处于 loading 状态由传入的 spinning 值决定。">
    <Button :style="{ marginRight: '20px' }" @click="toggle">延迟显示的spin</Button>
    <Spin :delay="1000" :spinning="loading" />
  </DemoBlock>
</template>
