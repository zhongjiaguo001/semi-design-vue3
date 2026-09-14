<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { Button, Switch, Tag, TagInput, TreeSelect } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { TreeSelect } from 'semi-design-vue';`;
const w300 = { width: '300px' };
const dd = { maxHeight: '400px', overflow: 'auto' };
const textStyle = { margin: '20px 0 10px' };

/* ---------- 基本用法 / 尺寸大小 / 禁用 / 受控 / 节点选中关系 / 动态更新 ---------- */
const treeDataCn = [
  {
    label: '亚洲',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: '中国',
        value: 'China',
        key: '0-0',
        children: [
          { label: '北京', value: 'Beijing', key: '0-0-0' },
          { label: '上海', value: 'Shanghai', key: '0-0-1' },
        ],
      },
    ],
  },
  { label: '北美洲', value: 'North America', key: '1' },
];

/* ---------- 多选 / 限制标签展示数量 ---------- */
const treeDataEn = [
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
          { label: 'Chengdu', value: 'Chengdu', key: '0-0-2' },
        ],
      },
      {
        label: 'Japan',
        value: 'Japan',
        key: '0-1',
        children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
      },
    ],
  },
  {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [
      { label: 'United States', value: 'United States', key: '1-0' },
      { label: 'Canada', value: 'Canada', key: '1-1' },
    ],
  },
];

/* ---------- 可搜索的 / 搜索框位置 ---------- */
const treeDataSearch = [
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
      {
        label: 'Japan',
        value: 'Japan',
        key: '0-1',
        children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
      },
    ],
  },
  {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [
      { label: 'United States', value: 'United States', key: '1-0' },
      { label: 'Canada', value: 'Canada', key: '1-1' },
    ],
  },
];
const showFilteredOnly = ref(false);
function onSearch(inputValue: string, filteredExpandedKeys: string[], filteredNodes: any[]) {
  console.log('onSearch', inputValue, filteredExpandedKeys, filteredNodes);
}

/* ---------- 远程搜索 ---------- */
const remoteValue = ref<any>();
const remoteTreeData = ref<any[]>([]);
const remoteLoading = ref(false);
const handleRemoteSearch = (inputValue: string) => {
  if (!inputValue) {
    remoteTreeData.value = [];
    return;
  }
  remoteLoading.value = true;
  // 模拟网络请求
  setTimeout(() => {
    remoteTreeData.value = [
      { label: `${inputValue} - 结果1`, value: `${inputValue}-1`, key: `${inputValue}-1` },
      { label: `${inputValue} - 结果2`, value: `${inputValue}-2`, key: `${inputValue}-2` },
      { label: `${inputValue} - 结果3`, value: `${inputValue}-3`, key: `${inputValue}-3` },
    ];
    remoteLoading.value = false;
  }, 500);
};

/* ---------- Trigger 内多行换行（triggerTagWrap） ---------- */
const treeDataWrap = [
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
          { label: 'Shenzhen', value: 'Shenzhen', key: '0-0-2' },
          { label: 'Guangzhou', value: 'Guangzhou', key: '0-0-3' },
        ],
      },
      {
        label: 'Japan',
        value: 'Japan',
        key: '0-1',
        children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
      },
    ],
  },
  {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [
      { label: 'United States', value: 'United States', key: '1-0' },
      { label: 'Canada', value: 'Canada', key: '1-1' },
    ],
  },
];

/* ---------- 默认展开 ---------- */
const expandData = ref<any[]>([]);
onMounted(() => {
  setTimeout(() => {
    expandData.value = treeDataCn;
  }, 500);
});

/* ---------- 严格禁用 / 开启搜索的展开受控 ---------- */
const treeDataStrict = [
  {
    label: '亚洲',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: '中国',
        value: 'China',
        key: '0-0',
        disabled: true,
        children: [
          { label: '北京', value: 'Beijing', key: '0-0-0' },
          { label: '上海', value: 'Shanghai', key: '0-0-1' },
        ],
      },
      { label: '日本', value: 'Japan', key: '0-1' },
    ],
  },
  { label: '北美洲', value: 'North America', key: '1' },
];
const treeDataExpand = [
  {
    label: '亚洲',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: '中国',
        value: 'China',
        key: '0-0',
        children: [
          { label: '北京', value: 'Beijing', key: '0-0-0' },
          { label: '上海', value: 'Shanghai', key: '0-0-1' },
        ],
      },
      { label: '日本', value: 'Japan', key: '0-1' },
    ],
  },
  { label: '北美洲', value: 'North America', key: '1' },
];

/* ---------- 受控 ---------- */
const controlledValue = ref<any>('Shanghai');

/* ---------- 开启搜索的展开受控 ---------- */
const expandedKeys = ref<string[]>([]);
const onControlledSearch = (_inputValue: string, filteredExpandedKeys: string[]) => {
  expandedKeys.value = [...filteredExpandedKeys, ...expandedKeys.value];
};

/* ---------- 虚拟化 ---------- */
const gData = ref<any[]>([]);
const total = ref(0);
function generateData(x = 5, y = 4, z = 3, data: any[] = []) {
  // x：每一级下的节点总数。y：每级节点里有y个节点、存在子节点。z：树的level层级数（0表示一级）
  function _loop(_level: number, _preKey?: string, _tns?: any[]): any {
    const preKey = _preKey || '0';
    const tns = _tns || data;
    const children: string[] = [];
    for (let i = 0; i < x; i++) {
      const key = `${preKey}-${i}`;
      tns.push({ label: `${key}-标签`, key: `${key}-key`, value: `${key}-value` });
      if (i < y) {
        children.push(key);
      }
    }
    if (_level < 0) {
      return tns;
    }
    const __level = _level - 1;
    children.forEach((key, index) => {
      tns[index].children = [];
      return _loop(__level, key, tns[index].children);
    });
    return null;
  }
  _loop(z);
  function calcTotal(x: number, y: number, z: number) {
    const rec = (n: number): number => (n >= 0 ? x * y ** n-- + rec(n) : 0);
    return rec(z + 1);
  }
  return { gData: data, total: calcTotal(x, y, z) };
}
function onGen() {
  const res = generateData();
  gData.value = res.gData;
  total.value = res.total;
}

/* ---------- 动态更新数据 ---------- */
const dynamicTreeData = ref<any[]>([]);
function addDynamic() {
  const itemLength = Math.floor(Math.random() * 5) + 1;
  dynamicTreeData.value = new Array(itemLength).fill(0).map((_v, i) => {
    const length = Math.floor(Math.random() * 3);
    const children = new Array(length).fill(0).map((_cv, ci) => ({
      key: `${i}-${ci}`,
      label: `Leaf-${i}-${ci}`,
      value: `${i}-${ci}`,
    }));
    return { key: `${i}`, label: `Item-${i}`, value: `${i}`, children };
  });
}

/* ---------- 异步加载数据 ---------- */
const initialAsyncData = [
  { label: 'Expand to load', value: '0', key: '0' },
  { label: 'Expand to load', value: '1', key: '1' },
  { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
];
const asyncTreeData = ref<any[]>(initialAsyncData);
function updateTreeData(list: any[], key: string, children: any[]): any[] {
  return list.map((node) => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateTreeData(node.children, key, children) };
    }
    return node;
  });
}
function onLoadData({ key, children }: any) {
  return new Promise<void>((resolve) => {
    if (children) {
      resolve();
      return;
    }
    setTimeout(() => {
      asyncTreeData.value = updateTreeData(asyncTreeData.value, key, [
        { label: 'Child Node', key: `${key}-0` },
        { label: 'Child Node', key: `${key}-1` },
      ]);
      resolve();
    }, 1000);
  });
}

/* ---------- 自定义 Trigger ---------- */
const treeDataTrigger = [
  {
    label: '亚洲',
    value: '亚洲',
    key: '0',
    children: [
      {
        label: '中国',
        value: '中国',
        key: '0-0',
        children: [
          { label: '北京', value: '北京', key: '0-0-0' },
          { label: '上海', value: '上海', key: '0-0-1' },
        ],
      },
    ],
  },
  { label: '北美洲', value: '北美洲', key: '1' },
];
const onValueChange = (value: any) => {
  console.log('onChange', value);
};
const renderTrigger = (props: any) => {
  const { value, onSearch, onRemove, inputValue } = props;
  const tagInputValue = value.map((item: any) => item.key);
  const renderTagInMultiple = (key: string) => {
    const label = value.find((item: any) => item.key === key).label;
    const onCloseTag = (_value: any, _e: any, tagKey: string) => {
      onRemove(tagKey);
    };
    return h(Tag, { style: { marginLeft: '2px' }, tagKey: key, key, onClose: onCloseTag, closable: true }, () => label);
  };
  return h(TagInput, {
    inputValue,
    value: tagInputValue,
    onInputChange: onSearch,
    renderTagItem: renderTagInMultiple,
  });
};

/* ---------- 自定义渲染已选项 ---------- */
const treeDataSelected = [
  {
    label: '亚洲',
    value: 'Asia',
    key: '0',
    children: [
      {
        label: '中国',
        value: 'China',
        key: '0-0',
        children: [
          { label: '北京', value: 'Beijing', key: '0-0-0' },
          { label: '上海', value: 'Shanghai', key: '0-0-1' },
        ],
      },
    ],
  },
  { label: '北美洲', value: 'North America', key: '1' },
  { label: '南美洲', value: 'South America', key: '2' },
  { label: '南极洲', value: 'Antarctica', key: '3' },
];
const renderSingleSelected = (item: any) => item.label;
const renderInTag = (item: any) => ({ content: item.label, isRenderInTag: true });
const renderNotInTag = (item: any, { index, onClose }: any) => ({
  content: h(Tag, { key: index, color: 'white', closable: true, onClose }, () => item.value),
  isRenderInTag: false,
});
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="最简单的用法，默认为单选模式，每一级菜单项均可选择。">
    <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" placeholder="请选择" />
  </DemoBlock>

  <DemoBlock title="多选" desc="设置 multiple 可以进行多选；leafOnly 只展示叶子节点，onChange 的回调入参也只有叶子节点的值。">
    <div>
      <TreeSelect :style="w300" multiple :dropdownStyle="dd" :treeData="treeDataEn" placeholder="请选择" />
      <br />
      <br />
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataEn" multiple leafOnly placeholder="只渲染叶子节点" />
      <br />
      <br />
    </div>
  </DemoBlock>

  <DemoBlock title="限制标签展示数量" desc="maxTagCount 限制展示的标签数量，超出以 +N 展示；showRestTagsPopover 让 hover +N 时显示 Popover，可用 restTagsPopoverProps 配置。">
    <div>
      <h4 :style="textStyle">maxTagCount=2:</h4>
      <TreeSelect multiple :maxTagCount="2" :style="w300" :dropdownStyle="dd" :treeData="treeDataEn" placeholder="当选中标签超过两个将折叠" :defaultValue="['Beijing', 'Chengdu', 'Canada']" />
      <h4 :style="textStyle">maxTagCount=2, showRestTagsPopover:</h4>
      <TreeSelect
        :showRestTagsPopover="true"
        :restTagsPopoverProps="{ position: 'top' }"
        multiple
        :maxTagCount="2"
        :style="w300"
        :dropdownStyle="dd"
        :treeData="treeDataEn"
        placeholder="hover +N 查看"
        :defaultValue="['Beijing', 'Chengdu', 'Canada']"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="可搜索的" desc="filterTreeNode 开启搜索，默认对 label 搜索（treeNodeFilterProp 可改）；showFilteredOnly 只展示过滤结果；onSearch 获取搜索结果。">
    <span>showFilteredOnly</span>
    <Switch :checked="showFilteredOnly" size="small" @change="(v: boolean) => (showFilteredOnly = v)" />
    <br />
    <br />
    <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataSearch" filterTreeNode :showFilteredOnly="showFilteredOnly" placeholder="单选可搜索的" @search="onSearch" />
    <br />
    <br />
    <TreeSelect
      :style="w300"
      :dropdownStyle="dd"
      :treeData="treeDataSearch"
      multiple
      filterTreeNode
      :maxTagCount="2"
      :showFilteredOnly="showFilteredOnly"
      placeholder="多选可搜索的"
      searchPlaceholder="请输入关键字开始搜索"
      @search="onSearch"
    />
    <br />
    <br />
    <TreeSelect
      :style="w300"
      :dropdownStyle="dd"
      :treeData="treeDataSearch"
      multiple
      filterTreeNode
      :maxTagCount="2"
      :showFilteredOnly="showFilteredOnly"
      placeholder="搜索框autofocus"
      searchPlaceholder="autofocus"
      searchAutoFocus
      @search="onSearch"
    />
  </DemoBlock>

  <DemoBlock title="远程搜索" desc="remote 开启后不做本地过滤，只触发 onSearch，由用户自行获取远程数据并更新 treeData。">
    <TreeSelect
      :style="w300"
      placeholder="请输入关键字进行远程搜索"
      :treeData="remoteTreeData"
      filterTreeNode
      remote
      :loading="remoteLoading"
      :value="remoteValue"
      @change="(v: any) => (remoteValue = v)"
      @search="handleRemoteSearch"
    />
  </DemoBlock>

  <DemoBlock title="搜索框位置" desc="searchPosition 设置搜索框位置，可选 dropdown（默认）、trigger。位于 trigger 时占位符由 placeholder 控制，showClear 会同时清空 inputValue 和 value。">
    <TreeSelect searchPosition="trigger" :style="w300" :dropdownStyle="dd" :treeData="treeDataSearch" filterTreeNode placeholder="单选" />
    <br />
    <br />
    <TreeSelect searchPosition="trigger" :style="w300" :dropdownStyle="dd" :treeData="treeDataSearch" multiple filterTreeNode :maxTagCount="2" placeholder="多选" />
  </DemoBlock>

  <DemoBlock title="Trigger 内多行换行（triggerTagWrap）" desc="多选 + 搜索框位于 trigger 时，triggerTagWrap 让已选标签自动换行（多行展示）。">
    <TreeSelect
      searchPosition="trigger"
      triggerTagWrap
      :style="{ width: '260px' }"
      :dropdownStyle="dd"
      :treeData="treeDataWrap"
      multiple
      filterTreeNode
      placeholder="请选择多个选项或输入长文本"
      :defaultValue="['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou']"
    />
  </DemoBlock>

  <DemoBlock title="尺寸大小" desc="通过 size 设置尺寸大小，可选 small、default、large。">
    <div>
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" multiple size="small" placeholder="small" />
      <br />
      <br />
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" multiple size="default" placeholder="default" />
      <br />
      <br />
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" multiple size="large" placeholder="large" />
    </div>
  </DemoBlock>

  <DemoBlock title="默认展开" desc="defaultExpandAll 只在初始化时生效；expandAll 在 treeData 动态更新后仍然生效。本例数据在 500ms 后才载入。">
    <TreeSelect :style="{ width: '300px', marginBottom: '20px' }" expandAll :treeData="expandData" placeholder="expandAll" />
    <TreeSelect :style="w300" defaultExpandAll :treeData="expandData" placeholder="defaultExpandAll" />
  </DemoBlock>

  <DemoBlock title="禁用" desc="disabled 禁用下拉菜单。">
    <div>
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" disabled placeholder="禁用下拉菜单" />
      <br />
      <br />
      <TreeSelect :style="w300" defaultValue="Shanghai" :dropdownStyle="dd" :treeData="treeDataCn" disabled />
      <br />
      <br />
      <TreeSelect :style="w300" :defaultValue="['Shanghai', 'North America']" :dropdownStyle="dd" :treeData="treeDataCn" multiple disabled />
    </div>
  </DemoBlock>

  <DemoBlock title="严格禁用" desc="disableStrictly 开启严格禁用后，disabled 节点不能通过子级或父级的关系改变选中状态。节点“中国”严格禁用，改变“亚洲”的选中状态不会影响它。">
    <div>
      <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataStrict" disableStrictly multiple :defaultValue="['Shanghai']" />
    </div>
  </DemoBlock>

  <DemoBlock title="受控" desc="传入 value 时即为受控组件，可以配合 onChange 使用。">
    <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" :value="controlledValue" placeholder="请选择" @change="(v: any) => (controlledValue = v)" />
  </DemoBlock>

  <DemoBlock title="节点选中关系" desc="多选时 checkRelation 可选 related（默认）、unRelated；unRelated 时节点之间的选中互不影响。">
    <TreeSelect multiple defaultValue="Asia" checkRelation="unRelated" :style="w300" :dropdownStyle="dd" :treeData="treeDataCn" />
  </DemoBlock>

  <DemoBlock title="开启搜索的展开受控" desc="传入 expandedKeys 即为展开受控；搜索时不再自动展开，可利用 onSearch 的 filteredExpandedKeys 实现搜索展开效果。">
    <TreeSelect
      :style="w300"
      :dropdownStyle="dd"
      :treeData="treeDataExpand"
      filterTreeNode
      :expandedKeys="expandedKeys"
      @expand="(keys: string[]) => (expandedKeys = keys)"
      @search="onControlledSearch"
    />
  </DemoBlock>

  <DemoBlock title="虚拟化" desc="virtualize 列表虚拟化（height / width / itemSize），用于大量树节点；开启后动画关闭。带搜索框时建议开启 showFilteredOnly。">
    <div :style="{ padding: '0 20px' }">
      <Button @click="onGen">生成数据: </Button>
      <span>共 {{ total }} 个节点</span>
      <br />
      <br />
      <TreeSelect
        v-if="gData.length"
        :style="w300"
        :treeData="gData"
        filterTreeNode
        showFilteredOnly
        placeholder="Please select"
        :dropdownStyle="{ overflow: 'hidden' }"
        :virtualize="{ itemSize: 28, height: 236 }"
      />
    </div>
  </DemoBlock>

  <DemoBlock title="动态更新数据" desc="treeData 动态更新后，选项列表随之刷新。">
    <TreeSelect :style="w300" :dropdownStyle="dd" :treeData="dynamicTreeData" placeholder="请选择" />
    <br />
    <br />
    <Button @click="addDynamic">动态改变数据</Button>
  </DemoBlock>

  <DemoBlock title="异步加载数据" desc="通过 loadData 动态加载数据，需要在数据中传入 isLeaf 标明叶子节点。">
    <TreeSelect :loadData="onLoadData" :treeData="asyncTreeData" :style="w300" placeholder="请选择" />
  </DemoBlock>

  <DemoBlock title="自定义 Trigger" desc="triggerRender 自定义选择框的展示；入参含 value、inputValue、onSearch、onRemove、onClear 等。">
    <TreeSelect :triggerRender="renderTrigger" filterTreeNode searchPosition="trigger" multiple :treeData="treeDataTrigger" placeholder="Custom Trigger" :style="w300" @change="onValueChange" />
  </DemoBlock>

  <DemoBlock title="自定义渲染已选项" desc="renderSelectedItem 自定义已选项标签的渲染；多选时返回 { isRenderInTag, content }。">
    <h4>单选</h4>
    <TreeSelect :style="w300" :treeData="treeDataSelected" :renderSelectedItem="renderSingleSelected" />
    <h4>多选+ isRenderInTag=true</h4>
    <TreeSelect :style="w300" :treeData="treeDataSelected" multiple :renderSelectedItem="renderInTag" />
    <h4>多选 + isRenderInTag=false</h4>
    <TreeSelect :style="w300" :treeData="treeDataSelected" multiple :maxTagCount="2" :renderSelectedItem="renderNotInTag" />
  </DemoBlock>
</template>
