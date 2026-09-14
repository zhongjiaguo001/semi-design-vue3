<script setup lang="ts">
import { Divider, IconSemiLogo } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Divider } from 'semi-design-vue';`;
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="分割线支持水平/垂直方向（layout）与实线/虚线（dashed），margin 控制上下（垂直时为左右）间距。">
    <div>
      <h3>水平实线</h3>
      <span>Semi Design 是一个设计系统。</span>
      <Divider margin="12px" />
      <span>它定义了一套中后台设计与前端基础组件。</span>

      <h3 style="margin-top: 40px">水平虚线</h3>
      <span>Semi Design 是一个设计系统。</span>
      <Divider :dashed="true" margin="12px" />
      <span>它定义了一套中后台设计与前端基础组件。</span>

      <h3 style="margin-top: 40px">垂直实线</h3>
      <div>
        <span>左</span>
        <Divider layout="vertical" margin="12px" />
        <span>中</span>
        <Divider layout="vertical" margin="12px" />
        <span>右</span>
      </div>

      <h3 style="margin-top: 40px">垂直虚线</h3>
      <div>
        <span>左</span>
        <Divider layout="vertical" :dashed="true" margin="12px" />
        <span>中</span>
        <Divider layout="vertical" :dashed="true" margin="12px" />
        <span>右</span>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="包含内容" desc="水平分割线可以包含文字或任意节点（默认插槽），align 控制内容对齐方式。">
    <div>
      <Divider margin="12px" align="left">这是居左文字</Divider>
      <Divider margin="12px" align="center">这是居中文字</Divider>
      <Divider margin="12px" align="right">这是居右文字</Divider>
      <Divider margin="12px">
        <IconSemiLogo />
      </Divider>
    </div>
  </DemoBlock>
</template>
