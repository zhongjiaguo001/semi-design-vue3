<script setup lang="ts">
import { h } from 'vue';
import { Button, Checkbox, Highlight, Transfer } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Transfer } from 'semi-design-vue';`;
const box = { width: '568px', height: '360px' };
const log = (...args: any[]) => console.log(...args);

const data = Array.from({ length: 20 }, (_, i) => ({
  label: `选项名称 ${i}`,
  value: i,
  disabled: i === 6,
  key: `key-${i}`,
}));

const dataWithGroup = [
  {
    title: '类别A',
    children: [
      { label: 'A-1', value: 1, disabled: false, key: 1 },
      { label: 'A-2', value: 2, disabled: false, key: 2 },
      { label: 'A-3', value: 3, disabled: false, key: 3 },
    ],
  },
  {
    title: '类别B',
    children: [
      { label: 'B-1', value: 4, disabled: false, key: 4 },
      { label: 'B-2', value: 5, disabled: false, key: 5 },
      { label: 'B-3（disabled）', value: 6, disabled: true, key: 6 },
    ],
  },
  {
    title: '类别C',
    children: [
      { label: 'C-1', value: 7, key: 7 },
      { label: 'C-2', value: 8, key: 8 },
      { label: 'C-3', value: 9, key: 9 },
    ],
  },
];

const treeData = [
  {
    label: 'Asia',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: 'China',
        value: 'China',
        key: '0-0',
        children: [
          { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
          { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
        ],
      },
    ],
  },
  {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [{ label: 'United States', value: 'United States', key: '1-0' }],
  },
];

const customFilter = (sug: string, item: any) => String(item.label).includes(sug);
const renderSourceItem = (item: any) =>
  h('div', { style: { display: 'flex', alignItems: 'center', padding: '4px 8px', gap: '8px' } }, [
    h(Checkbox, { checked: item.checked, disabled: item.disabled, onChange: item.onChange }),
    h(Highlight, { sourceString: String(item.label ?? ''), searchWords: [] }),
  ]);
const renderSelectedItem = (item: any) =>
  h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '4px 8px' } }, [
    h('span', item.label),
    h(Button, { size: 'small', theme: 'borderless', type: 'danger', onClick: item.onRemove }, () => '移除'),
  ]);

const renderSourceHeader = ({ num, showButton, allChecked, onAllClick }: any) =>
  h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px' } }, [
    h('span', `源数据 ${num}`),
    showButton ? h(Button, { size: 'small', theme: 'borderless', onClick: onAllClick }, () => (allChecked ? '清空' : '全选')) : null,
  ]);
const renderSelectedHeader = ({ num, showButton, onClear }: any) =>
  h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px' } }, [
    h('span', `已选 ${num}`),
    showButton ? h(Button, { size: 'small', theme: 'borderless', onClick: onClear }, () => '清空') : null,
  ]);

const renderSourcePanel = ({ filterData, selectedItems, onSelectOrRemove, onAllClick }: any) =>
  h('div', { style: { padding: '8px', height: '100%', overflow: 'auto' } }, [
    h(Button, { size: 'small', onClick: onAllClick, style: { marginBottom: '8px' } }, () => '全选源'),
    ...(filterData || []).map((item: any) =>
      h(
        'div',
        {
          key: item.key,
          style: { padding: '4px 0', cursor: 'pointer', fontWeight: selectedItems?.has?.(item.key) ? 600 : 400 },
          onClick: () => onSelectOrRemove(item),
        },
        item.label
      )
    ),
  ]);
const renderSelectedPanel = ({ selectedData, onClear, onRemove }: any) =>
  h('div', { style: { padding: '8px', height: '100%', overflow: 'auto' } }, [
    h(Button, { size: 'small', type: 'danger', theme: 'borderless', onClick: onClear, style: { marginBottom: '8px' } }, () => '清空已选'),
    ...(selectedData || []).map((item: any) =>
      h('div', { key: item.key, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' } }, [
        h('span', item.label),
        h(Button, { size: 'small', theme: 'borderless', onClick: () => onRemove(item) }, () => 'x'),
      ])
    ),
  ]);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本使用" desc="数据项需传入 value、label、key。">
    <Transfer :style="box" :dataSource="data" @change="log" />
  </DemoBlock>

  <DemoBlock title="分组" desc="type='groupList'。一级须有 title 与 children，不支持多层嵌套。">
    <Transfer type="groupList" :defaultValue="[6]" :style="{ width: '568px' }" :dataSource="dataWithGroup" @change="log" />
  </DemoBlock>

  <DemoBlock title="自定义筛选逻辑，自定义选项数据渲染" desc="filter 返回 true 保留。renderSourceItem / renderSelectedItem。">
    <Transfer
      :style="box"
      :dataSource="data"
      :filter="customFilter"
      :renderSourceItem="renderSourceItem"
      :renderSelectedItem="renderSelectedItem"
    />
  </DemoBlock>

  <DemoBlock title="禁用">
    <Transfer disabled :style="box" :dataSource="data" :defaultValue="[1, 2]" />
  </DemoBlock>

  <DemoBlock title="拖拽排序" desc="draggable 对已选项排序。">
    <Transfer draggable :style="box" :dataSource="data" :defaultValue="[1, 2, 3]" />
  </DemoBlock>

  <DemoBlock title="左侧分页">
    <Transfer :style="box" :dataSource="data" :pagination="{ pageSize: 5 }" />
  </DemoBlock>

  <DemoBlock title="左侧分页 + 受控页码">
    <Transfer :style="box" :dataSource="data" :pagination="{ pageSize: 5, defaultCurrentPage: 2 }" />
  </DemoBlock>

  <DemoBlock title="拖拽 + 自定义已选项渲染">
    <Transfer draggable :style="box" :dataSource="data" :defaultValue="[1, 2]" :renderSelectedItem="renderSelectedItem" />
  </DemoBlock>

  <DemoBlock title="自定义渲染面板头部信息">
    <Transfer :style="box" :dataSource="data" :renderSourceHeader="renderSourceHeader" :renderSelectedHeader="renderSelectedHeader" />
  </DemoBlock>

  <DemoBlock title="完全自定义渲染">
    <Transfer :style="box" :dataSource="data" :renderSourcePanel="renderSourcePanel" :renderSelectedPanel="renderSelectedPanel" />
  </DemoBlock>

  <DemoBlock title="完全自定义渲染 、 拖拽排序" desc="自定义面板时可在已选侧自行实现拖拽；本例保留 draggable + 自定义源面板。">
    <Transfer draggable :style="box" :dataSource="data" :renderSourcePanel="renderSourcePanel" />
  </DemoBlock>

  <DemoBlock title="树穿梭框" desc="type='treeList'，通过 treeProps 覆盖默认 Tree。">
    <Transfer type="treeList" :style="box" :dataSource="treeData" @change="log" />
  </DemoBlock>

  <DemoBlock title="树穿梭框自定义头部显示叶子节点数量">
    <Transfer type="treeList" :style="box" :dataSource="treeData" :renderSourceHeader="renderSourceHeader" :renderSelectedHeader="renderSelectedHeader" />
  </DemoBlock>
</template>
