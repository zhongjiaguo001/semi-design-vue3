<script setup lang="ts">
import { h, ref, reactive } from 'vue';
import {
  Tree,
  Switch,
  Input,
  Button,
  ButtonGroup,
  Checkbox,
  Toast,
  Text,
  IconMapPin,
  IconMore,
  IconMinus,
  IconPlus,
  IconChevronDown,
  IconFixedStroked,
  IconSectionStroked,
  IconAbsoluteStroked,
  IconInnerSectionStroked,
  IconComponentStroked,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Tree } from 'semi-design-vue';`;

const style = { width: '260px', height: '420px', border: '1px solid var(--semi-color-border)' };

/* ---------------- 基本用法 ---------------- */
const basicData = [
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

/* ---------------- 多选 / 通用英文数据 ---------------- */
const multiData = [
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
      { label: 'Japan', value: 'Japan', key: '0-1', children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }] },
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

const enData = [
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
      { label: 'Japan', value: 'Japan', key: '0-1', children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }] },
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

/* ---------------- 可搜索的 ---------------- */
const showFilteredOnly = ref(false);
const searchRender = ({ prefix, ...restProps }: any) => h(Input, { prefix: 'Search', ...restProps });

/* ---------------- 手动触发搜索 ---------------- */
const manualTreeRef = ref<any>(null);
const onManualSearch = (v: string) => manualTreeRef.value?.search(v);

/* ---------------- 简单 JSON ---------------- */
const json = {
  Node1: {
    'Child Node1': '0-0-1',
    'Child Node2': '0-0-2',
  },
  Node2: '0-1',
};

/* ---------------- 自定义节点内容 ---------------- */
const opts = { content: 'Hi, Bytedance dance dance', duration: 3 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const button = () =>
  h(ButtonGroup, { size: 'small', theme: 'borderless' }, () => [
    h(
      Button,
      {
        onClick: (e: MouseEvent) => {
          Toast.info(opts);
          e.stopPropagation();
        },
      },
      () => '提示'
    ),
    h(Button, null, () => '点击'),
  ]);
const nodeLabel = (text: string) => h('div', { style: rowStyle }, [h('span', text), button()]);
const treeDataWithNode = [
  {
    label: nodeLabel('亚洲'),
    value: 'yazhou',
    key: 'yazhou',
    children: [
      { label: nodeLabel('中国'), value: 'zhongguo', key: 'zhongguo' },
      { label: nodeLabel('日本'), value: 'riben', key: 'riben' },
    ],
  },
];

const renderBtn = (content: string) =>
  h(Button, {
    onClick: (e: MouseEvent) => {
      Toast.info({ content });
      e.stopPropagation();
    },
    icon: h(IconMore),
    size: 'small',
  });
const renderEllipsisLabel = (label: any, item: any) =>
  h('div', { style: { display: 'flex' } }, [
    h(Text, { ellipsis: { showTooltip: true }, style: { width: 'calc(100% - 48px)' } }, () => label),
    renderBtn(item.key),
  ]);
const longLabelData = [
  {
    label: '亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲',
    value: 'yazhou',
    key: 'yazhou',
    children: [
      { label: '中国中国中国中国中国中国中国中国', value: 'zhongguo', key: 'zhongguo' },
      { label: '日本日本日本日本日本日本日本日本', value: 'riben', key: 'riben' },
    ],
  },
];

/* ---------------- 自定义图标 ---------------- */
const pin = () => h(IconMapPin, { style: { color: 'var(--semi-color-text-2)' } });
const iconData = [
  {
    label: 'Asia',
    value: 'Asia',
    key: '0',
    icon: pin(),
    children: [
      { label: 'China', value: 'China', key: '0-0', icon: pin() },
      { label: 'Japan', value: 'Japan', key: '0-1', icon: pin() },
    ],
  },
];

/* ---------------- 禁用 ---------------- */
const disabledData = [
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
          { label: 'Beijing', value: 'Beijing', key: '0-0-0', disabled: true },
          { label: 'Shanghai', value: 'Shanghai', key: '0-0-1', disabled: true },
        ],
      },
      { label: 'Japan', value: 'Japan', key: '0-1', children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }] },
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

/* ---------------- 默认展开 ---------------- */
const json2 = {
  Node3: {
    'Child Node1': '0-0-1',
    'Child Node2': '0-0-2',
    'Child Node3': '0-0-3',
    'Child Node4': '0-0-4',
  },
  Node2: '0-1',
};
const expandJson = ref<any>(json);
const expandStyle = { marginRight: '20px', ...style };

/* ---------------- 开启搜索的展开受控 ---------------- */
const searchExpandedKeys = ref<string[]>([]);
const searchExpandData = [
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

/* ---------------- 受控 ---------------- */
const controlledValue = ref<any>(undefined);

/* ---------------- 自动展开父节点 ---------------- */
const autoExpandedKeys = ref<string[]>(['0', '0-0']);

/* ---------------- 自定义展开 Icon ---------------- */
const expandIconData = [
  {
    label: '亚洲',
    key: 'yazhou',
    children: [
      {
        label: '中国',
        key: 'zhongguo',
        children: [
          { label: '北京', key: 'beijing' },
          { label: '上海', key: 'shanghai' },
        ],
      },
      { label: '日本', key: 'riben' },
    ],
  },
  { label: '北美洲', key: 'beimeizhou' },
];
const expandIconFunc = (props: any) => {
  const { expanded, onClick, className } = props;
  return expanded ? h(IconMinus, { size: 'small', class: className, onClick }) : h(IconPlus, { size: 'small', class: className, onClick });
};
const expandIconNode = h(IconChevronDown, { size: 'small', class: 'testCls' });
const expandIconStyle = { width: '260px', height: '200px', border: '1px solid var(--semi-color-border)' };

/* ---------------- 连接线 ---------------- */
const showLine = ref(true);
const lineData = [
  {
    label: 'parent-0',
    key: 'parent-0',
    children: [
      {
        label: 'leaf-0-0',
        key: 'leaf-0-0',
        children: [
          { label: 'leaf-0-0-0', key: 'leaf-0-0-0' },
          { label: 'leaf-0-0-1', key: 'leaf-0-0-1' },
          { label: 'leaf-0-0-2', key: 'leaf-0-0-2' },
        ],
      },
      { label: 'leaf-0-1', key: 'leaf-0-1' },
    ],
  },
  { label: 'parent-1', key: 'parent-1' },
];

/* ---------------- 虚拟化 ---------------- */
const gData = ref<any[]>([]);
const total = ref(0);
function generateData(x = 5, y = 4, z = 3, data: any[] = []) {
  function _loop(_level: number, _preKey?: string, _tns?: any[]) {
    const preKey = _preKey || '0';
    const tns = _tns || data;
    const children: string[] = [];
    for (let i = 0; i < x; i++) {
      const key = `${preKey}-${i}`;
      tns.push({ label: `${key}-标签`, key: `${key}-key`, value: `${key}-value` });
      if (i < y) children.push(key);
    }
    if (_level < 0) return tns;
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
const onGen = () => {
  const res = generateData();
  gData.value = res.gData;
  total.value = res.total;
};
const virtualStyle = { width: '260px', border: '1px solid var(--semi-color-border)' };

/* ---------------- 动态更新数据 ---------------- */
const dynamicData = ref<any[]>([{ key: '0', label: 'item-0', value: '0' }]);
const addDynamic = () => {
  const itemLength = Math.floor(Math.random() * 5) + 1;
  dynamicData.value = new Array(itemLength).fill(0).map((_v, i) => {
    const length = Math.floor(Math.random() * 3);
    const children = new Array(length).fill(0).map((_cv, ci) => ({ key: `${i}-${ci}`, label: `Leaf-${i}-${ci}`, value: `${i}-${ci}` }));
    return { key: `${i}`, label: `Item-${i}`, value: `${i}`, children };
  });
};

/* ---------------- 异步加载数据 ---------------- */
const asyncData = ref<any[]>([
  { label: 'Expand to load', value: '0', key: '0' },
  { label: 'Expand to load', value: '1', key: '1' },
  { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
]);
function updateTreeData(list: any[], key: string, children: any[]): any[] {
  return list.map((node) => {
    if (node.key === key) return { ...node, children };
    if (node.children) return { ...node, children: updateTreeData(node.children, key, children) };
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
      asyncData.value = updateTreeData(asyncData.value, key, [
        { label: 'Child Node', key: `${key}-0` },
        { label: 'Child Node', key: `${key}-1` },
      ]);
      resolve();
    }, 1000);
  });
}

/* ---------------- 可拖拽的Tree ---------------- */
const dragData = ref<any[]>(JSON.parse(JSON.stringify(enData)));
const makeOnDrop = (source: { value: any[] }) => (info: any) => {
  const { dropToGap, node, dragNode } = info;
  const dropKey = node.key;
  const dragKey = dragNode.key;
  const dropPos = node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
  const data = [...source.value];
  const loop = (list: any[], key: string, callback: (item: any, ind: number, arr: any[]) => void) => {
    list.forEach((item, ind, arr) => {
      if (item.key === key) return callback(item, ind, arr);
      if (item.children) return loop(item.children, key, callback);
    });
  };
  let dragObj: any;
  loop(data, dragKey, (item, ind, arr) => {
    arr.splice(ind, 1);
    dragObj = item;
  });
  if (!dropToGap) {
    loop(data, dropKey, (item) => {
      item.children = item.children || [];
      item.children.push(dragObj);
    });
  } else if (dropPosition === 1 && node.children && node.expanded) {
    loop(data, dropKey, (item) => {
      item.children = item.children || [];
      item.children.unshift(dragObj);
    });
  } else {
    let dropNodeInd = 0;
    let dropNodePosArr: any[] = [];
    loop(data, dropKey, (_item, ind, arr) => {
      dropNodePosArr = arr;
      dropNodeInd = ind;
    });
    if (dropPosition === -1) dropNodePosArr.splice(dropNodeInd, 0, dragObj);
    else dropNodePosArr.splice(dropNodeInd + 1, 0, dragObj);
  }
  source.value = data;
};
const onDrop = makeOnDrop(dragData);

/* ---------------- 高级定制 ---------------- */
const renderLeafCheckLabel = ({ className, onExpand, data, onCheck, checkStatus, expandIcon }: any) => {
  const { label } = data;
  const isLeaf = !(data.children && data.children.length);
  return h('li', { class: className, role: 'treeitem', onClick: isLeaf ? onCheck : onExpand }, [
    isLeaf ? null : expandIcon,
    isLeaf
      ? h('div', { onClick: onCheck, role: 'checkbox', tabindex: 0, 'aria-checked': checkStatus.checked }, [
          h(Checkbox, { indeterminate: checkStatus.halfChecked, checked: checkStatus.checked, style: { marginRight: '8px' } }),
        ])
      : null,
    h('span', label),
  ]);
};
const renderLeafSelectLabel = ({ className, onExpand, onClick, data, expandIcon }: any) => {
  const { label } = data;
  const isLeaf = !(data.children && data.children.length);
  return h('li', { class: className, role: 'treeitem', onClick: isLeaf ? onClick : onExpand }, [expandIcon, h('span', label)]);
};

const iconStyle = { marginRight: '8px', color: 'var(--semi-color-text-2)' };
const makeDesignData = () => [
  { label: '黑色固定按钮', icon: h(IconFixedStroked, { style: iconStyle }), key: 'fix-btn-0' },
  {
    label: '模块',
    key: 'module-0',
    icon: h(IconSectionStroked, { style: iconStyle }),
    children: [
      { label: '可自由摆放的组件', icon: h(IconAbsoluteStroked, { style: iconStyle }), key: 'free-compo-0' },
      {
        label: '分栏容器',
        icon: h(IconInnerSectionStroked, { style: iconStyle }),
        key: 'split-col-0',
        children: [
          { label: '按钮组件', icon: h(IconComponentStroked, { style: iconStyle }), key: 'btn-0' },
          { label: '按钮组件', icon: h(IconComponentStroked, { style: iconStyle }), key: 'btn-1' },
        ],
      },
    ],
  },
  {
    label: '模块',
    icon: h(IconSectionStroked, { style: iconStyle }),
    key: 'module-1',
    children: [{ label: '自定义组件', icon: h(IconComponentStroked, { style: iconStyle }), key: 'cus-0' }],
  },
];
const designData = makeDesignData();
const findDescendantKeys = (node: any) => {
  const res: string[] = [node.key];
  const findChild = (item: any) => {
    if (!item) return;
    const { children } = item;
    if (children && children.length) {
      children.forEach((child: any) => {
        res.push(child.key);
        findChild(child);
      });
    }
  };
  findChild(node);
  return res;
};
const makeHighlightState = () => {
  const s = reactive({ selected: new Set<string>(), selectedThroughParent: new Set<string>() });
  const handleSelect = (key: string, _bool: boolean, node: any) => {
    s.selected = new Set([key]);
    s.selectedThroughParent = new Set(findDescendantKeys(node));
  };
  const renderLabel = ({ className, data, onClick, expandIcon }: any) => {
    const { label, icon, key } = data;
    const isLeaf = !(data.children && data.children.length);
    const bg = s.selected.has(key) ? 'rgba(var(--semi-blue-0), 1)' : s.selectedThroughParent.has(key) ? 'rgba(var(--semi-blue-0), .5)' : 'transparent';
    return h('li', { class: className, role: 'treeitem', onClick, style: { backgroundColor: bg } }, [
      isLeaf ? h('span', { style: { width: '24px' } }) : expandIcon,
      icon,
      h('span', label),
    ]);
  };
  return { handleSelect, renderLabel };
};
const highlight3 = makeHighlightState();

/* ---------------- 可拖拽的高级定制 ---------------- */
const dragDesignData = ref<any[]>(makeDesignData());
const onDragDesignDrop = makeOnDrop(dragDesignData);
const highlightDrag = makeHighlightState();
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本用法" desc="最简单的用法，默认为单选模式，每一级菜单项均可选择。">
    <Tree :treeData="basicData" defaultExpandAll :style="style" />
  </DemoBlock>

  <DemoBlock title="多选" desc="设置 multiple，可以进行多选。多选情况下所有子项都被选择时，自动勾选显示其父项。">
    <Tree :treeData="multiData" multiple defaultExpandAll :style="style" />
  </DemoBlock>

  <DemoBlock title="可搜索的" desc="通过设置 filterTreeNode 属性可支持搜索功能。默认对 label 值进行搜索，可通过 treeNodeFilterProp 更改。如果只希望展示过滤后的结果，可以设置 showFilteredOnly。">
    <span>showFilteredOnly</span>
    <Switch v-model:checked="showFilteredOnly" size="small" />
    <br />
    <Tree :treeData="enData" multiple filterTreeNode :showFilteredOnly="showFilteredOnly" :style="style" />
  </DemoBlock>

  <DemoBlock title="可搜索的 - 2" desc="设置 filterTreeNode 属性开启搜索后，可以通过设置 searchRender 自定义搜索框的渲染方法，设置为 false 时可以隐藏搜索框。">
    <Tree filterTreeNode :searchRender="searchRender" :treeData="enData" />
  </DemoBlock>

  <DemoBlock title="手动触发搜索" desc="可以通过 ref 的方式获取 tree 的实例，调用 tree 的 search 方法进行搜索。注意需要同时设置 filterTreeNode 开启搜索，如果搜索框在 tree 外部，可以通过设置 searchRender=false 隐藏 tree 内部的搜索框。">
    <div>
      <Input aria-label="filter tree" prefix="Search" showClear @change="onManualSearch" />
      <div style="margin-top: 20px">搜索结果如下：</div>
      <Tree ref="manualTreeRef" filterTreeNode :searchRender="false" :treeData="enData" :blockNode="false" />
    </div>
  </DemoBlock>

  <DemoBlock title="简单 JSON 格式的数据" desc="可以通过 treeDataSimpleJson 传入 JSON 形式的 treeNodes 数据。此时 key-value 键值对中的 key 值将作为 TreeNodeData 的 key 和 label，value 值将作为 TreeNodeData 的 value。返回值为包含选中节点的 JSON 数据。">
    <Tree :treeDataSimpleJson="json" multiple :style="style" @change="(e) => console.log('当前所有选中项: ', e)" @select="(e) => console.log('当前选项: ', e)" />
  </DemoBlock>

  <DemoBlock title="行显示节点" desc="可以通过设置 blockNode 使节点显示为整行，此时悬浮选中高亮状态都会显示整行。默认打开。关闭时只高亮节点 label。">
    <div>
      <Tree :treeData="enData" defaultValue="Shanghai" :blockNode="false" />
      <br />
      <Tree :treeData="enData" defaultValue="Shanghai" multiple :blockNode="false" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义节点内容" desc="TreeNodeData 的 label 属性支持传入 VNode 来自定义显示的节点内容。注意如果设置 filterTreeNode 开启搜索，默认是对 label 的值进行搜索，当 label 为节点时，需要自定义 filterTreeNode 的函数来满足搜索需求。">
    <Tree :treeData="treeDataWithNode" :style="style" />
  </DemoBlock>

  <DemoBlock title="自定义节点内容 - 2" desc="过长省略。可以使用 renderLabel 来实现文本过长省略的效果。">
    <Tree :treeData="longLabelData" :renderLabel="renderEllipsisLabel" :style="style" />
  </DemoBlock>

  <DemoBlock title="自定义图标" desc="通过设置 icon 属性可添加自定义图标。">
    <Tree :treeData="iconData" :style="style" />
  </DemoBlock>

  <DemoBlock title="目录树模式" desc="通过设置 directory 属性可显示为目录树模式。目录树模式下自带目录图标，可以通过自定义图标覆盖。">
    <Tree :treeData="enData" directory :style="style" />
  </DemoBlock>

  <DemoBlock title="禁用" desc="可以使用 disableStrictly 来开启严格禁用。开启严格禁用后，当节点是 disabled 的时候，则不能通过子级或者父级的关系改变选中状态。">
    <Tree :treeData="disabledData" defaultValue="Shanghai" multiple disableStrictly :style="style" />
  </DemoBlock>

  <DemoBlock title="节点选中关系" desc="多选时，可以使用 checkRelation 来设置节点选中关系的类型，可选：'related'（默认）、'unRelated'。当选中关系为 'unRelated'，意味着节点之间的选中互不影响。">
    <Tree :treeData="multiData" multiple checkRelation="unRelated" defaultExpandAll :style="style" />
  </DemoBlock>

  <DemoBlock title="默认展开" desc="defaultExpandAll 只在初始化时生效，而 expandAll 不仅会在初始化时生效，当数据（treeData/treeDataSimpleJson）发生动态更新时也仍然生效。点击按钮更新 TreeData 后，defaultExpandAll 失效，expandAll 仍然生效。">
    <Button style="margin-bottom: 10px" @click="expandJson = json2">点击更新 TreeData</Button>
    <div style="display: flex">
      <div>
        <span>defaultExpandAll</span>
        <Tree defaultExpandAll :treeDataSimpleJson="expandJson" :style="expandStyle" />
      </div>
      <div>
        <span>expandAll</span>
        <Tree expandAll :treeDataSimpleJson="expandJson" :style="expandStyle" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="开启搜索的展开受控" desc="传入 expandedKeys 时即为展开受控组件，可以配合 onExpand 使用。当展开受控时，如果开启 filterTreeNode 并进行搜索是不会再自动展开节点的，可以利用 onSearch 的入参 filteredExpandedKeys 来实现展开受控时的搜索展开效果。">
    <Tree
      style="width: 300px"
      :treeData="searchExpandData"
      filterTreeNode
      :expandedKeys="searchExpandedKeys"
      @expand="(keys) => (searchExpandedKeys = keys)"
      @search="(_input, filteredExpandedKeys) => (searchExpandedKeys = [...filteredExpandedKeys])"
    />
  </DemoBlock>

  <DemoBlock title="受控" desc="传入 value 时即为受控组件，可以配合 onChange 使用。">
    <Tree :treeData="basicData" :value="controlledValue" :style="style" @change="(v) => (controlledValue = v)" />
  </DemoBlock>

  <DemoBlock title="自动展开父节点" desc="在展开受控的情况下，当开启了 autoExpandParent，如果想要收起父元素，则需要把它的所有子元素均收起后才可以。默认情况下 autoExpandParent 为 false，即父元素收起不受到子元素的影响。">
    <div>需要先将“中国”节点收起后，才能够收起“亚洲”节点</div>
    <br />
    <Tree autoExpandParent :treeData="basicData" :expandedKeys="autoExpandedKeys" :style="style" @expand="(v) => (autoExpandedKeys = v)" />
  </DemoBlock>

  <DemoBlock title="自定义展开 Icon" desc="可以通过 expandIcon 自定义展开 Icon。支持传入 VNode 或者函数 (props: { onClick, className, expanded }) => VNode。">
    <p>expandIcon 是 VNode</p>
    <Tree :expandIcon="expandIconNode" multiple :defaultExpandedKeys="['yazhou']" :treeData="expandIconData" :style="expandIconStyle" />
    <br />
    <p>expandIcon 是函数</p>
    <Tree multiple :expandIcon="expandIconFunc" :defaultExpandedKeys="['yazhou']" :treeData="expandIconData" :style="expandIconStyle" />
  </DemoBlock>

  <DemoBlock title="连接线" desc="通过 showLine 设置节点之间的连接线，默认为 false。">
    <div style="display: flex; align-items: center; column-gap: 5px; margin-bottom: 5px">
      <strong>showLine </strong>
      <Switch v-model:checked="showLine" />
    </div>
    <Tree :showLine="showLine" defaultExpandAll :treeData="lineData" :style="style" />
  </DemoBlock>

  <DemoBlock title="虚拟化" desc="列表虚拟化，用于大量树节点的情况。开启后，动画效果将被关闭。virtualize 由 height、width、itemSize（必传）组成。如果带搜索框，建议开启 showFilteredOnly 减少多余节点的渲染。">
    <div style="padding: 0 20px">
      <Button @click="onGen">生成数据: </Button>
      <span>共 {{ total }} 个节点</span>
      <br />
      <br />
      <Tree v-if="gData.length" :treeData="gData" filterTreeNode showFilteredOnly :style="virtualStyle" :virtualize="{ height: 300, itemSize: 28 }" />
    </div>
  </DemoBlock>

  <DemoBlock title="动态更新数据" desc="treeData 变化后树会自动更新。">
    <div :style="style">
      <Tree :treeData="dynamicData" />
      <br />
      <Button style="margin: 20px" @click="addDynamic">动态改变数据</Button>
    </div>
  </DemoBlock>

  <DemoBlock title="异步加载数据" desc="通过设置 loadData 可以动态加载数据，此时需要在数据中传入 isLeaf 标明叶子节点。">
    <Tree :loadData="onLoadData" :treeData="[...asyncData]" />
  </DemoBlock>

  <DemoBlock title="可拖拽的Tree" desc="通过设置 draggable 配合 onDrop 可以实现 Tree 节点的拖拽。目前不支持与虚拟化同时使用。onDrop 入参：{ event, node, dragNode, dragNodesKeys, dropPosition, dropToGap }。">
    <Tree :treeData="dragData" draggable @drop="onDrop" />
  </DemoBlock>

  <DemoBlock title="高级定制" desc="使用 renderFullLabel 接管整行 option 的渲染。第一个 demo：只有叶子节点可以选中，父节点只起到分组作用；同时开启 leafOnly 使 onChange 的回调入参都是叶子节点。">
    <Tree :treeData="enData" :renderFullLabel="renderLeafCheckLabel" multiple leafOnly :style="style" />
  </DemoBlock>

  <DemoBlock title="高级定制 - 2" desc="第二个 demo：只有叶子节点可以单选，父节点只起到分组作用。">
    <Tree :treeData="enData" :renderFullLabel="renderLeafSelectLabel" :style="style" @change="(...args) => console.log('change', ...args)" />
  </DemoBlock>

  <DemoBlock title="高级定制 - 3" desc="第三个 demo：单选选中父节点同时也高亮子节点。">
    <Tree :treeData="designData" :renderFullLabel="highlight3.renderLabel" :style="style" defaultExpandAll @select="highlight3.handleSelect" />
  </DemoBlock>

  <DemoBlock title="可拖拽的高级定制" desc="可拖拽（draggable）和高级定制（renderFullLabel）可以同时使用。">
    <Tree :treeData="dragDesignData" draggable :renderFullLabel="highlightDrag.renderLabel" :style="style" defaultExpandAll @drop="onDragDesignDrop" @select="highlightDrag.handleSelect" />
  </DemoBlock>
</template>
