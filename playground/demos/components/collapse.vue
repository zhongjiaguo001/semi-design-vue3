<script setup lang="ts">
import { Collapse, CollapsePanel, Tag, IconPlus, IconMinus, IconCopy } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Collapse, CollapsePanel } from 'semi-design-vue';
// CollapsePanel 也可通过 Collapse.Panel 访问`;

const text = 'Hi, bytedance dance dance. This is the docsite of Semi UI. ';
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="可以同时展开多个面板，可以通过 defaultActiveKey 设置默认展开的面板。">
    <Collapse>
      <CollapsePanel header="This is panel header 1" itemKey="1">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>

  <DemoBlock title="手风琴效果" desc="可以通过设置 accordion 使每次只允许展开一个面板。">
    <Collapse accordion>
      <CollapsePanel header="This is panel header 1" itemKey="1">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>

  <DemoBlock title="禁用面板" desc="可以通过设置 disabled 禁用面板。">
    <Collapse accordion>
      <CollapsePanel header="This is panel header 1" itemKey="1" disabled>
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>

  <DemoBlock title="隐藏面板展开/收起图标" desc="可以通过设置 showArrow 隐藏面板展开/收起图标。">
    <Collapse accordion>
      <CollapsePanel header="This is panel header 1" itemKey="1" :showArrow="false">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>

  <DemoBlock title="自定义展开图标" desc="可以通过 expandIcon 设置展开图标，collapseIcon 设置折叠图标（也可使用同名插槽）。">
    <Collapse :expandIcon="IconPlus" :collapseIcon="IconMinus">
      <CollapsePanel header="This is panel header 1" itemKey="1">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>

  <DemoBlock title="自定义右上角辅助区域内容" desc="通过 extra 属性或 #extra 插槽设置右上角辅助区域内容。仅在 header 为 string 时生效，如果 header 为节点则会包含 extra 所在的区域，可以自行渲染。">
    <Collapse>
      <CollapsePanel header="This is panel header 1" itemKey="1" extra="1234">
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 2" itemKey="2">
        <template #extra><IconCopy /></template>
        <p>{{ text }}</p>
      </CollapsePanel>
      <CollapsePanel header="This is panel header 3" itemKey="3">
        <template #extra>
          <Tag color="violet" style="margin: 0"> Recommended </Tag>
        </template>
        <p>{{ text }}</p>
      </CollapsePanel>
    </Collapse>
  </DemoBlock>
</template>
