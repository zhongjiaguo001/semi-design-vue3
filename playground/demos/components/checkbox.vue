<script setup lang="ts">
import { ref, computed } from 'vue';
import { Checkbox, CheckboxGroup, Button, Row, Col } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Checkbox, CheckboxGroup } from 'semi-design-vue';`;

const log = (...args: any[]) => console.log(...args);

// 数组方式声明 Checkbox 组
const onGroupChange = (checkedValues: any[]) => {
  console.log('checked = ', checkedValues);
};
const plainOptions = ['Semi UI', 'Semi DSM', 'Semi D2C'];
const optionsWithExtra = [
  { extra: '从 Semi Design，到 Any Design 快速定制你的设计系统，并应用在设计稿和代码中', label: 'Semi DSM', value: 'dsm' },
  { extra: '高效的 Design To Code 设计稿转代码', label: 'Semi D2C', value: 'd2c' },
];
const optionsWithDisabled = [
  { label: 'Photography', value: 'Photography' },
  { label: 'Movies', value: 'Movies' },
  { label: 'Running', value: 'Running', disabled: false },
];

// 水平排列
const horizontalOptions = [
  { label: '抖音', value: 'abc' },
  { label: '今日头条', value: 'toutiao' },
];

// 受控
const checked = ref(true);
const disabled = ref(false);
const toggleChecked = () => {
  checked.value = !checked.value;
};
const toggleDisable = () => {
  disabled.value = !disabled.value;
};
const onControlledChange = (e: any) => {
  console.log('checked = ', e.target.checked);
  checked.value = e.target.checked;
};
const controlledLabel = computed(() => `${checked.value ? 'Checked' : 'Unchecked'} ${disabled.value ? 'Disabled' : 'Enabled'}`);

// 全选
const allOptions = ['Photography', 'Movies', 'Running'];
const checkedList = ref<string[]>(['Photography', 'Running']);
const indeterminate = ref(true);
const checkAll = ref(false);
const onCheckedListChange = (list: string[]) => {
  checkedList.value = list;
  indeterminate.value = !!list.length && list.length < allOptions.length;
  checkAll.value = list.length === allOptions.length;
};
const onCheckAllChange = (e: any) => {
  console.log(e);
  checkedList.value = e.target.checked ? allOptions.slice() : [];
  indeterminate.value = false;
  checkAll.value = e.target.checked;
};

const extraText = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="Checkbox 单个使用，可以通过 defaultChecked、checked 属性控制是否勾选。当传入 checked 时，为受控使用。">
    <Checkbox aria-label="Checkbox 示例" @change="log">Semi Design</Checkbox>
  </DemoBlock>

  <DemoBlock title="基本用法 - 2" desc="defaultChecked 初始选中。">
    <Checkbox defaultChecked aria-label="Checkbox 示例" @change="log">Semi Design</Checkbox>
  </DemoBlock>

  <DemoBlock title="基本用法 - 3" desc="带辅助文本的 checkbox。通过 extra 传入辅助文本。辅助文本会更长一些，甚至还可能换行。">
    <Checkbox aria-label="Checkbox 示例" :extra="extraText">Semi Design</Checkbox>
    <br />
    <Checkbox :style="{ width: '280px' }" aria-label="Checkbox 示例" :extra="extraText">Semi Design</Checkbox>
  </DemoBlock>

  <DemoBlock title="禁用" desc="通过设置 disabled 属性，禁用 Checkbox。">
    <div>
      <Checkbox :defaultChecked="false" disabled aria-label="Checkbox 示例">Unchecked Disabled</Checkbox>
      <br />
      <Checkbox defaultChecked disabled aria-label="Checkbox 示例">Checked Disabled</Checkbox>
    </div>
  </DemoBlock>

  <DemoBlock
    title="JSX方式声明Checkbox组"
    desc="通过在 CheckboxGroup 内部放置 Checkbox 元素，可以声明 Checkbox 组。使用 CheckboxGroup 的 defaultValue、value 属性去控制一组 Checkbox 的选中与否，此时 Checkbox 不需要再声明 defaultChecked、checked 属性。"
  >
    <CheckboxGroup :style="{ width: '100%' }" :defaultValue="['A', 'B']" aria-label="CheckboxGroup 示例">
      <Checkbox value="A">A</Checkbox>
      <Checkbox value="B">B</Checkbox>
      <Checkbox value="C">C</Checkbox>
      <Checkbox value="D">D</Checkbox>
      <Checkbox value="E">E</Checkbox>
    </CheckboxGroup>
  </DemoBlock>

  <DemoBlock title="数组方式声明 Checkbox 组" desc="也可以将数组通过 options 属性直接传入 CheckboxGroup，直接生成 Checkbox 组。">
    <div>
      <CheckboxGroup :options="plainOptions" :defaultValue="['Semi D2C']" aria-label="CheckboxGroup 示例" @change="onGroupChange" />
      <br /><br />
      <CheckboxGroup :options="optionsWithExtra" :defaultValue="[]" aria-label="带 extra 示例" @change="onGroupChange" />
      <br /><br />
      <CheckboxGroup
        :options="optionsWithDisabled"
        disabled
        :defaultValue="['Photography']"
        aria-label="Checkbox 示例"
        @change="onGroupChange"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="水平排列" desc="通过设置 direction 为 horizontal 或者 vertical 可以调整 CheckboxGroup 内的布局。">
    <CheckboxGroup :options="horizontalOptions" direction="horizontal" aria-label="CheckboxGroup 示例" />
  </DemoBlock>

  <DemoBlock title="受控" desc="联动 checkbox。">
    <div>
      <p :style="{ marginBottom: '20px' }">
        <Checkbox :checked="checked" :disabled="disabled" aria-label="Checkbox 示例" @change="onControlledChange">
          {{ controlledLabel }}
        </Checkbox>
      </p>
      <p>
        <Button type="primary" size="small" @click="toggleChecked">{{ !checked ? 'Check' : 'Uncheck' }}</Button>
        <Button :style="{ marginLeft: '10px' }" type="primary" size="small" @click="toggleDisable">
          {{ !disabled ? 'Disable' : 'Enable' }}
        </Button>
      </p>
    </div>
  </DemoBlock>

  <DemoBlock title="全选" desc="在实现全选效果时，你可能会用到 indeterminate 属性。">
    <div>
      <div :style="{ paddingBottom: '8px', borderBottom: '1px solid var(--semi-color-border)' }">
        <Checkbox :indeterminate="indeterminate" :checked="checkAll" aria-label="Checkbox 示例" @change="onCheckAllChange">
          Check all
        </Checkbox>
      </div>
      <CheckboxGroup
        :style="{ marginTop: '6px' }"
        :options="allOptions"
        :value="checkedList"
        aria-label="CheckboxGroup 示例"
        @change="onCheckedListChange"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="卡片样式" desc="可以给 CheckboxGroup 设置 type='card'，实现带有背景的卡片样式。">
    <CheckboxGroup type="card" :defaultValue="['1', '3']" direction="vertical" aria-label="CheckboxGroup 示例">
      <Checkbox value="1" disabled :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="2" disabled :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="3" :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="4" :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
    </CheckboxGroup>
  </DemoBlock>

  <DemoBlock title="无 checkbox 的纯卡片样式" desc="可以给 CheckboxGroup 设置 type='pureCard'，实现带有背景且无 checkbox 的纯卡片样式。">
    <CheckboxGroup type="pureCard" :defaultValue="['1', '3']" direction="vertical" aria-label="CheckboxGroup 示例">
      <Checkbox value="1" disabled :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="2" disabled :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="3" :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
      <Checkbox value="4" :extra="extraText" :style="{ width: '280px' }">单选框标题</Checkbox>
    </CheckboxGroup>
  </DemoBlock>

  <DemoBlock title="配合grid布局" desc="CheckboxGroup 内嵌 Checkbox 并与 Grid 组件一起使用，可以实现灵活的布局。">
    <CheckboxGroup :style="{ width: '100%' }" aria-label="CheckboxGroup 示例">
      <Row>
        <Col :span="8"><Checkbox value="A">A</Checkbox></Col>
        <Col :span="8"><Checkbox value="B">B</Checkbox></Col>
        <Col :span="8"><Checkbox value="C">C</Checkbox></Col>
        <Col :span="8"><Checkbox value="D">D</Checkbox></Col>
        <Col :span="8"><Checkbox value="E">E</Checkbox></Col>
      </Row>
    </CheckboxGroup>
  </DemoBlock>
</template>
