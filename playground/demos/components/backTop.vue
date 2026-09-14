<script setup lang="ts">
import { BackTop, IconArrowUp } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { BackTop } from 'semi-design-vue';`;

// 文档站内容区域自身滚动（.docs-content），官方示例监听 window；这里优先监听文档滚动容器。
const getTarget = (): any => document.querySelector('.docs-content') || window;

const customStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '30px',
  width: '30px',
  borderRadius: '100%',
  backgroundColor: '#0077fa',
  color: '#fff',
  bottom: '100px',
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="BackTop 预设了基本的返回按钮，可以直接调用。向下滚动页面（超过 400px）后右下角出现灰色按钮。">
    <div>
      <span>Scroll down to see the bottom-right gray button.</span>
      <BackTop :target="getTarget" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="自定义样式"
    desc="BackTop 预设了默认样式：距离底部 50px，距离右侧 100px，box-sizing 为 border-box，内容水平居中。样式可以通过 style 覆盖，子内容通过默认插槽自定义。"
  >
    <div>
      <span>
        Scroll down to see the bottom-right <span style="color: #0077fa">blue circular</span> button.
      </span>
      <BackTop :style="customStyle" :target="getTarget">
        <IconArrowUp />
      </BackTop>
    </div>
  </DemoBlock>
</template>
