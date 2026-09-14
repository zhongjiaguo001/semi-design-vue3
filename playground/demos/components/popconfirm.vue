<script setup lang="ts">
import { h, ref } from 'vue';
import {
  Popconfirm,
  Button,
  Toast,
  Radio,
  RadioGroup,
  Space,
  Tooltip,
  IconAlertTriangle,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Popconfirm } from 'semi-design-vue';`;

const onConfirm = () => {
  Toast.success('确认保存！');
};
const onCancel = () => {
  Toast.warning('取消保存！');
};

const typeMap: Record<string, any> = {
  default: {
    icon: () => h(IconAlertTriangle, { size: 'extra-large' }),
  },
  warning: {
    icon: () => h(IconAlertTriangle, { size: 'extra-large', style: { color: 'var(--semi-color-warning)' } }),
  },
  danger: {
    okType: 'danger',
    icon: () => h(IconAlertTriangle, { size: 'extra-large', style: { color: 'var(--semi-color-danger)' } }),
  },
  tertiary: {
    icon: () => h(IconAlertTriangle, { size: 'extra-large', style: { color: 'var(--semi-color-tertiary)' } }),
  },
};
const typeKeys = Object.keys(typeMap);
const pcType = ref('default');
const pcVisible = ref(true);
const changeType = (e: any) => {
  const next = e && e.target && e.target.value;
  if (next && typeKeys.includes(next)) pcType.value = next;
};

const onConfirmDelay = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('resolve, close popconfirm');
      resolve();
    }, 2000);
  });
const onCancelDelay = () =>
  new Promise<void>((_resolve, reject) => {
    setTimeout(() => {
      console.log('reject, popconfirm still exist');
      reject();
    }, 2000);
  });

const contentWithFocus = ({ initialFocusRef }: { initialFocusRef: any }) =>
  h('input', { ref: initialFocusRef, placeholder: 'focus here' });
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本使用"
    desc="Popconfirm 底层基于 Tooltip 封装，Children 支持类型同 Tooltip。"
  >
    <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" :onConfirm="onConfirm" :onCancel="onCancel">
      <Button>保存</Button>
    </Popconfirm>
  </DemoBlock>

  <DemoBlock title="类型搭配" desc="可以基于场景使用 okType / cancelType / icon 等参数搭配出不同风格。">
    <RadioGroup type="button" :value="pcType" :style="{ marginTop: '14px', marginBottom: '14px' }" @change="changeType">
      <Radio v-for="key in typeKeys" :key="key" :value="key">
        <span :style="{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }">{{ key }}</span>
      </Radio>
    </RadioGroup>
    <div>
      <Popconfirm
        v-bind="typeMap[pcType]"
        :visible="pcVisible"
        trigger="custom"
        title="确定是否要保存此修改？"
        content="此修改将不可逆"
        @visibleChange="(v: boolean) => (pcVisible = v)"
      >
        <Button @click="pcVisible = !pcVisible">点击此处</Button>
      </Popconfirm>
    </div>
  </DemoBlock>

  <DemoBlock
    title="延时关闭"
    desc="onConfirm、onCancel 可以通过 return Promise 实现点击后延时关闭（v2.19）。promise resolve 会关闭气泡，reject 时气泡保留，同时 button loading 自动结束。"
  >
    <Popconfirm
      title="确定是否要保存此修改？"
      content="此修改将不可逆"
      :onConfirm="onConfirmDelay"
      :onCancel="onCancelDelay"
    >
      <Button>保存</Button>
    </Popconfirm>
  </DemoBlock>

  <DemoBlock
    title="初始化弹出层焦点位置"
    desc="okButtonProps / cancelButtonProps 支持 autoFocus。content 支持函数，入参含 initialFocusRef，打开面板时会自动聚焦（2.30.0）。"
  >
    <Space>
      <Popconfirm
        title="确定是否要保存此修改？"
        content="此修改将不可逆"
        :okButtonProps="{ autoFocus: true, type: 'danger' }"
      >
        <Button>确认聚焦</Button>
      </Popconfirm>
      <Popconfirm
        title="确定是否要保存此修改？"
        content="此修改将不可逆"
        :cancelButtonProps="{ autoFocus: true }"
      >
        <Button>取消聚焦</Button>
      </Popconfirm>
      <Popconfirm title="确定是否要保存此修改？" :content="contentWithFocus">
        <Button>内容聚焦</Button>
      </Popconfirm>
    </Space>
  </DemoBlock>

  <DemoBlock
    title="搭配 Tooltip 或 Popover 使用"
    desc="Tooltip、Popconfirm、Popover 都会劫持 children 事件。直接嵌套会使外层 trigger 失效，需要在中间加一层 div 或 span。"
  >
    <Popconfirm content="是否确认删除" title="确认" :style="{ width: '320px' }">
      <span style="display: inline-block">
        <Tooltip content="删除评价">
          <Button type="danger">删除</Button>
        </Tooltip>
      </span>
    </Popconfirm>
  </DemoBlock>
</template>
