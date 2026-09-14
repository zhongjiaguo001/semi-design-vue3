<script setup lang="ts">
import { ref } from 'vue';
import { Radio, RadioGroup, Button, Space } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Radio, RadioGroup } from 'semi-design-vue';`;

// 禁用
const disabled = ref(true);
const toggleDisabled = () => {
  disabled.value = !disabled.value;
};

// 高级模式
const checked = ref(true);
const toggle = (e: any) => {
  console.log('radio checked', e.target.checked);
  checked.value = e.target.checked;
};

// 单选组合
const value = ref(1);
const onChange = (e: any) => {
  console.log('radio checked', e.target.value);
  value.value = e.target.value;
};

// 配置 options
const value1 = ref('Guest');
const value2 = ref('Developer');
const value3 = ref('Maintainer');
const plainOptions = ['Guest', 'Developer', 'Maintainer'];
const options = [
  { label: 'Guest', value: 'Guest', extra: 'Semi Design', style: { width: '120px' } },
  { label: 'Developer', value: 'Developer', extra: 'Semi Design', style: { width: '120px' } },
  { label: 'Maintainer', value: 'Maintainer', extra: 'Semi Design', style: { width: '120px' } },
];
const optionsWithDisabled = [
  { label: 'Guest', value: 'Guest' },
  { label: 'Developer', value: 'Developer' },
  { label: 'Maintainer', value: 'Maintainer', disabled: true },
];
const onChange1 = (e: any) => {
  console.log('radio1 checked', e.target.value);
  value1.value = e.target.value;
};
const onChange2 = (e: any) => {
  console.log('radio2 checked', e.target.value);
  value2.value = e.target.value;
};
const onChange3 = (e: any) => {
  console.log('radio3 checked', e.target.value);
  value3.value = e.target.value;
};

const cardExtra = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="最简单的单选框。">
    <Radio aria-label="单选示例" name="demo-radio">Radio</Radio>
  </DemoBlock>

  <DemoBlock title="带辅助文本" desc="通过 extra 设置辅助文本，可以是任意类型的节点（也可使用 extra 插槽）。">
    <Radio extra="Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统" aria-label="单选示例" name="demo-radio-extra">
      Semi Design
    </Radio>
  </DemoBlock>

  <DemoBlock title="禁用" desc="Radio 不可用。">
    <div>
      <Radio :defaultChecked="false" :disabled="disabled" aria-label="单选示例" name="demo-radio-disabled">
        Disabled
      </Radio>
      <br />
      <Radio defaultChecked :disabled="disabled" aria-label="单选示例" name="demo-radio-defaultChecked-disabled">
        Disabled
      </Radio>
      <div style="margin-top: 20px">
        <Button type="primary" @click="toggleDisabled">Toggle disabled</Button>
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="高级模式" desc="高级模式（mode='advanced'）checked 可以通过点击转换为 unchecked。">
    <Radio :checked="checked" mode="advanced" @change="toggle" aria-label="单选示例" name="demo-radio-advanced">
      允许取消选择
    </Radio>
  </DemoBlock>

  <DemoBlock title="单选组合" desc="一组互斥的 Radio 配合使用。">
    <RadioGroup :value="value" @change="onChange" aria-label="单选组合示例" name="demo-radio-group">
      <Radio :value="1">A</Radio>
      <Radio :value="2">B</Radio>
      <Radio :value="3">C</Radio>
      <Radio :value="4">D</Radio>
    </RadioGroup>
  </DemoBlock>

  <DemoBlock title="垂直排列" desc="可通过给 RadioGroup 设置 direction 属性来决定组内的 radio 元素水平排列或者垂直排列。">
    <RadioGroup direction="vertical" aria-label="单选组合示例" name="demo-radio-group-vertical">
      <Radio :value="1">A</Radio>
      <Radio :value="2">B</Radio>
      <Radio :value="3">C</Radio>
      <Radio :value="4">D</Radio>
    </RadioGroup>
  </DemoBlock>

  <DemoBlock title="按钮样式" desc="利用 type='button' 设置 button 样式类型的单选器，支持 small / middle / large 三种尺寸；button 类型暂不支持 extra 和垂直排列。">
    <Space vertical spacing="loose" align="start">
      <RadioGroup type="button" buttonSize="small" :defaultValue="1" aria-label="单选组合示例" name="demo-radio-small">
        <Radio :value="1">即时推送</Radio>
        <Radio :value="2">定时推送</Radio>
        <Radio :value="3">动态推送</Radio>
      </RadioGroup>
      <RadioGroup type="button" buttonSize="middle" :defaultValue="1" aria-label="单选组合示例" name="demo-radio-middle">
        <Radio :value="1">即时推送</Radio>
        <Radio :value="2">定时推送</Radio>
        <Radio :value="3">动态推送</Radio>
      </RadioGroup>
      <RadioGroup type="button" buttonSize="large" :defaultValue="1" aria-label="单选组合示例" name="demo-radio-large">
        <Radio :value="1">即时推送</Radio>
        <Radio :value="2">定时推送</Radio>
        <Radio :value="3">动态推送</Radio>
      </RadioGroup>
    </Space>
  </DemoBlock>

  <DemoBlock title="卡片样式" desc="可以给 RadioGroup 设置 type='card' 实现带有背景的卡片样式。">
    <RadioGroup type="card" :defaultValue="2" direction="vertical" aria-label="单选组合示例" name="demo-radio-group-card">
      <Radio :value="1" disabled :extra="cardExtra" style="width: 280px">单选框标题</Radio>
      <Radio :value="2" :extra="cardExtra" style="width: 280px">单选框标题</Radio>
      <Radio :value="3" :extra="cardExtra" style="width: 280px">单选框标题</Radio>
    </RadioGroup>
  </DemoBlock>

  <DemoBlock title="无 radio 的纯卡片样式" desc="可以给 RadioGroup 设置 type='pureCard' 实现带有背景且无 radio 的纯卡片样式。">
    <RadioGroup type="pureCard" :defaultValue="2" direction="vertical" aria-label="单选组合示例" name="demo-radio-group-pureCard">
      <Radio :value="1" disabled :extra="cardExtra" style="width: 280px">单选框标题</Radio>
      <Radio :value="2" :extra="cardExtra" style="width: 280px">单选框标题</Radio>
      <Radio :value="3" :extra="cardExtra" style="width: 280px">单选框标题</Radio>
    </RadioGroup>
  </DemoBlock>

  <DemoBlock title="配置 options" desc="通过配置 options 参数来渲染单选框。">
    <Space vertical align="start" spacing="loose">
      <RadioGroup :options="plainOptions" @change="onChange1" :value="value1" aria-label="单选组合示例" name="demo-radio-group-1" />
      <RadioGroup :options="optionsWithDisabled" @change="onChange2" :value="value2" aria-label="单选组合示例" name="demo-radio-group-2" />
      <RadioGroup :options="options" @change="onChange3" :value="value3" aria-label="单选组合示例" name="demo-radio-group-3" />
    </Space>
  </DemoBlock>
</template>
