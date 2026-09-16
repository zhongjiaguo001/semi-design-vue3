<script setup lang="ts">
import { h, ref, markRaw } from 'vue';
import { AutoComplete, Avatar, Empty, IconSearch, IconList, IconEdit, IconText, IconBox, IconGridSquare } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { AutoComplete } from 'semi-design-vue';`;

// ---------- 基本用法 ----------
const stringData = ref<string[]>([]);
const basicValue = ref('');
const handleStringSearch = (value: string) => {
  stringData.value = value ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${value}@${domain}`) : [];
};
const handleBasicChange = (value: string) => {
  console.log('onChange', value);
  basicValue.value = value;
};

// ---------- 自定义候选项渲染 ----------
interface Person {
  name: string;
  email: string;
  abbr: string;
  color: string;
  value?: string;
  label?: string;
}
const persons: Person[] = [
  { name: '夏可漫', email: 'xiakeman@example.com', abbr: 'XK', color: 'amber' },
  { name: '申悦', email: 'shenyue@example.com', abbr: 'SY', color: 'indigo' },
  { name: '曲晨一', email: 'quchenyi@example.com', abbr: 'CY', color: 'blue' },
  { name: '文嘉茂', email: 'wenjiamao@example.com', abbr: 'JM', color: 'cyan' },
];
const customData = ref<Person[]>(persons);
const handleCustomSearch = (value: string) => {
  customData.value = value ? persons.map((item) => ({ ...item, value: item.name, label: item.email })) : [];
};
const renderOption = (item: Person) =>
  h('div', { style: { display: 'flex' } }, [
    h(Avatar, { color: item.color as any, size: 'small' }, () => item.abbr),
    h('div', { style: { marginLeft: '4px' } }, [
      h('div', { style: { fontSize: '14px', marginLeft: '4px' } }, item.name),
      h('div', { style: { marginLeft: '4px' } }, item.email),
    ]),
  ]);
const renderSelectedEmail = (option: Person) => option.email;

// ---------- 远程搜索 ----------
const initList = [
  { value: 'select', label: '选择器', icon: markRaw(IconList) },
  { value: 'input', label: '输入框', icon: markRaw(IconEdit) },
  { value: 'form', label: '表单', icon: markRaw(IconText) },
  { value: 'button', label: '按钮', icon: markRaw(IconBox) },
  { value: 'table', label: '表格', icon: markRaw(IconGridSquare) },
];
const remoteLoading = ref(false);
const remoteList = ref<any[]>(initList);
const remoteSelected = ref<any>();
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const handleRemoteSearch = (inputValue: string) => {
  remoteLoading.value = true;
  let newList = initList;
  if (inputValue) newList = initList.filter((item) => item.value.includes(inputValue));
  setTimeout(() => {
    remoteList.value = newList;
    remoteLoading.value = false;
  }, 1000);
};
// debounce(handleSearch, 200)
const remoteSearch = (v: string) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => handleRemoteSearch(v), 200);
};
const handleRemoteSelect = (v: any) => {
  remoteSelected.value = v;
  console.log(v);
};
const renderRemoteItem = (item: any) =>
  h('div', { style: { display: 'flex', alignItems: 'center' } }, [
    h('div', { style: { fontSize: '32px' } }, [h(item.icon, { size: 'extra-large' })]),
    h('div', { style: { marginLeft: '12px' } }, [h('p', item.value), h('p', item.label)]),
  ]);
// 注意：与其他组件如 Select 不同，此处只能返回 String 类型的值
const renderRemoteSelectedItem = (item: any) => item.value;

// ---------- 下拉菜单的位置 ----------
const positionData = ref<string[]>([]);
const positionChange = (input: string) => {
  positionData.value = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
};

// ---------- 自定义空内容 ----------
const emptyData = ref<number[]>([]);
const emptyLoading = ref(false);
const fetchData = (v: string) => {
  emptyLoading.value = true;
  setTimeout(() => {
    if (!v) {
      emptyData.value = [];
      emptyLoading.value = false;
      return;
    }
    emptyData.value = Array.from(Array(5)).map(() => Math.random());
    emptyLoading.value = false;
  }, 1000);
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="通过 search 事件监听用户输入并更新 data；通过 change 事件（或 v-model）保持受控，输入框变化/选中输入项时触发。">
    <AutoComplete
      :data="stringData"
      :value="basicValue"
      showClear
      :prefix="h(IconSearch)"
      placeholder="搜索... "
      style="width: 200px"
      @search="handleStringSearch"
      @change="handleBasicChange"
    />
  </DemoBlock>

  <DemoBlock title="自定义候选项渲染" desc="data 传入对象数组（必须含 label、value），通过 renderItem 自定义候选项渲染，renderSelectedItem 控制选中后输入框显示的字符串。">
    <AutoComplete
      :data="customData"
      showClear
      :prefix="h(IconSearch)"
      :renderItem="renderOption"
      :renderSelectedItem="renderSelectedEmail"
      style="width: 280px"
      @search="handleCustomSearch"
    />
  </DemoBlock>

  <DemoBlock title="远程搜索" desc="从 search 事件中获取用户输入值（防抖 200ms），异步更新 data，并用 loading 展示加载状态。">
    <AutoComplete
      :data="remoteList"
      style="width: 250px"
      :prefix="h(IconSearch)"
      :loading="remoteLoading"
      :renderItem="renderRemoteItem"
      :renderSelectedItem="renderRemoteSelectedItem"
      @search="remoteSearch"
      @select="handleRemoteSelect"
    />
  </DemoBlock>

  <DemoBlock title="尺寸" desc="通过 size 设置输入框尺寸，可选 small、default（默认）、large。">
    <div>
      <AutoComplete :data="[1, 2, 3, 4]" size="small" placeholder="small" style="width: 200px" />
      <br />
      <br />
      <AutoComplete :data="[1, 2, 3, 4]" size="default" placeholder="default" style="width: 200px" />
      <br />
      <br />
      <AutoComplete :data="[1, 2, 3, 4]" size="large" placeholder="large" style="width: 200px" />
    </div>
  </DemoBlock>

  <DemoBlock title="下拉菜单的位置" desc="通过 position 设置下拉菜单位置，可选值参考 Tooltip position。">
    <div>
      <AutoComplete :data="positionData" position="top" placeholder="选项菜单在上方显示" style="width: 200px; margin: 10px" @search="positionChange" />
      <AutoComplete :data="positionData" position="rightTop" placeholder="选项菜单在右侧显示" style="width: 200px; margin: 10px" @search="positionChange" />
    </div>
  </DemoBlock>

  <DemoBlock title="禁用" desc="disabled 禁用输入与下拉菜单。">
    <AutoComplete :data="[1, 2, 3, 4]" placeholder="禁用下拉菜单" disabled style="width: 200px" />
  </DemoBlock>

  <DemoBlock title="校验状态" desc="validateStatus 可设置 warning / error / default 等不同校验状态，仅影响展示样式。">
    <div>
      <AutoComplete default-value="ies" validate-status="warning" />
      <br />
      <br />
      <AutoComplete default-value="ies" validate-status="error" />
      <br />
      <br />
      <AutoComplete default-value="ies" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义空内容" desc="data 为空时通过 emptyContent 自定义下拉内容；配合 loading 模拟异步请求。">
    <AutoComplete
      :loading="emptyLoading"
      :data="emptyData"
      :emptyContent="h(Empty, { style: { padding: '12px', width: '300px' }, description: '暂无内容' }, { image: () => h(IconBox, { style: { width: '150px', height: '150px', fontSize: '150px', color: 'var(--semi-color-text-3)' } }) })"
      @search="fetchData"
    />
  </DemoBlock>
</template>
