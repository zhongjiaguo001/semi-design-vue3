<script setup lang="ts">
import { ref, h } from 'vue';
import { Cascader, Text, Title, Tooltip, Toast, Tag, Checkbox, Button, TagInput, Spin, IconClose, IconChevronDown } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

/* ---------------- shared data (浙江省 tree used by most official examples) ---------------- */
const zjTreeData = () => [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '萧山区', value: 'xiaoshan' },
          { label: '临安区', value: 'linan' },
        ],
      },
      {
        label: '宁波市',
        value: 'ningbo',
        children: [
          { label: '海曙区', value: 'haishu' },
          { label: '江北区', value: 'jiangbei' },
        ],
      },
    ],
  },
];
const treeData = zjTreeData();

/* 可搜索的: label 为节点，指定 labelText 搜索 */
const tip = (text: string) => h(Tooltip, { content: '说明' }, () => text);
const labelNodeTreeData = [
  {
    label: tip('浙江省'),
    labelText: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: tip('杭州市'),
        labelText: '杭州市',
        value: 'hangzhou',
        children: [
          { label: tip('西湖区'), labelText: '西湖区', value: 'xihu' },
          { label: tip('萧山区'), labelText: '萧山区', value: 'xiaoshan' },
          { label: tip('临安区'), labelText: '临安区', value: 'linan' },
        ],
      },
      {
        label: tip('宁波市'),
        labelText: '宁波市',
        value: 'ningbo',
        children: [
          { label: tip('海曙区'), labelText: '海曙区', value: 'haishu' },
          { label: tip('江北区'), labelText: '江北区', value: 'jiangbei' },
        ],
      },
    ],
  },
];

/* 可搜索的多选 */
const searchMultiValue = ref<any>(['zhejiang', 'ningbo', 'haishu']);

/* filterSorter */
const productTreeData = [
  {
    label: 'Product',
    value: 'Product',
    children: [
      { label: 'Semi-Material', value: 'Semi-Material' },
      { label: 'Semi-DSM', value: 'Semi-DSM' },
      { label: 'Semi', value: 'Semi' },
      { label: 'Semi-C2D', value: 'Semi-C2D' },
      { label: 'Semi-D2C', value: 'Semi-D2C' },
    ],
  },
];
const filterSorter = (first: any[], second: any[], inputValue: string) => {
  const firstData = first[first.length - 1];
  const lastData = second[second.length - 1];
  if (firstData.label === inputValue) return -1;
  if (lastData.label === inputValue) return 1;
  return firstData.label < lastData.label ? -1 : 1;
};

/* filterRender */
const semiTreeData = [
  {
    label: 'Semi',
    value: 'Semi',
    children: [
      { label: 'Semi-Material Semi-Material Semi-Material Semi-Material', value: 'Semi-Material' },
      { label: 'Semi-DSM Semi-DSM Semi-DSM Semi-DSM', value: 'Semi-DSM' },
      { label: 'Semi Design Semi Design Semi Design Semi Design', value: 'Semi' },
      { label: 'Semi-C2D Semi-C2D Semi-C2D Semi-C2D Semi-C2D', value: 'Semi-C2D' },
      { label: 'Semi-D2C Semi-D2C Semi-D2C Semi-D2C Semi-D2C ', value: 'Semi-D2C' },
    ],
  },
];
const ellipsisOpt = { showTooltip: { opts: { style: { wordBreak: 'break-all' } } } };
const renderSearchOptionSingle = (p: any) => {
  const { className, data, selected, onClick } = p;
  return h('li', { class: className, style: { justifyContent: 'flex-start' }, role: 'treeitem', onClick }, [
    h(Text, { ellipsis: ellipsisOpt, style: { width: '270px', color: selected ? 'var(--semi-color-primary)' : undefined } }, () => data.map((item: any) => item.label).join(' / ')),
  ]);
};
const renderSearchOptionMultiple = (p: any) => {
  const { className, data, checkStatus, onCheck } = p;
  return h('li', { class: className, style: { justifyContent: 'flex-start' }, role: 'treeitem', onClick: onCheck }, [
    h(Checkbox, { onChange: onCheck, indeterminate: checkStatus.halfChecked, checked: checkStatus.checked, style: { marginRight: '8px' } }),
    h(Text, { ellipsis: ellipsisOpt, style: { width: '250px' } }, () => data.map((item: any) => item.label).join(' / ')),
  ]);
};

/* virtualizeInSearch */
const bigTreeData = ['通用', '场景'].map((label, m) => ({
  label,
  value: m,
  children: new Array(100).fill(0).map((_, n) => ({
    value: `${m}-${n}`,
    label: `${m}-${n} 第二级`,
    children: new Array(20).fill(0).map((__, o) => ({
      value: `${m}-${n}-${o}`,
      label: `${m}-${n}-${o} 第三级详细内容`,
    })),
  })),
}));
const virtualize = { height: 172, width: 320, itemSize: 36 };
const virtualFilterRender = (p: any) => {
  const { data, onCheck, checkStatus, className } = p;
  return h('div', { key: data.value, class: className, style: { justifyContent: 'start', padding: '8px 16px 8px 12px', boxSizing: 'border-box' } }, [
    h(Checkbox, { onChange: onCheck, indeterminate: checkStatus.halfChecked, checked: checkStatus.checked, style: { marginRight: '8px' } }),
    h(Text, { ellipsis: ellipsisOpt, style: { maxWidth: '260px' } }, () => data.map((item: any) => item.label).join(' | ')),
  ]);
};

/* 限制选中数量 */
const onExceed = (v: any) => {
  Toast.warning('exceed max');
  console.log(v);
};

/* 自定义显示 */
const displayRenderSingle = (list: any[]) => '已选择：' + list.join(' -> ');
const displayRenderMultiple = (item: any, idx: number) => h(Tag, { style: { marginRight: '4px' }, color: 'white', key: `${idx}-${item.data.label}` }, () => item.data.label);

/* 禁用 */
const disabledTreeData = [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '萧山区', value: 'xiaoshan' },
          { label: '临安区', value: 'linan' },
        ],
      },
    ],
  },
];

/* 严格禁用 */
const strictTreeData = [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '萧山区', value: 'xiaoshan' },
          { label: '临安区', value: 'linan' },
        ],
      },
      {
        label: '宁波市',
        value: 'ningbo',
        disabled: true,
        children: [
          { label: '海曙区', value: 'haishu' },
          { label: '江北区', value: 'jiangbei' },
        ],
      },
    ],
  },
];

/* 点击选中 */
const clickTreeData = [
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '萧山区', value: 'xiaoshan' },
        ],
      },
      {
        label: '宁波市',
        value: 'ningbo',
        children: [{ label: '海曙区', value: 'haishu' }],
      },
    ],
  },
];

/* 顶部/底部插槽 */
const slotStyle = {
  height: '36px',
  display: 'flex',
  padding: '0 32px',
  alignItems: 'center',
  cursor: 'pointer',
  borderTop: '1px solid var(--semi-color-border)',
};

/* 受控 */
const controlledValue = ref<any>([]);
const onControlledChange = (v: any) => {
  controlledValue.value = v;
};

/* 自动合并 value */
const mergeValue = ref<any>([]);
const onMergeChange = (v: any) => {
  console.log(v);
  mergeValue.value = v;
};

/* 仅叶子节点 */
const leafValue = ref<any>([]);
const onLeafChange = (v: any) => {
  console.log(v);
  leafValue.value = v;
};

/* 节点选中关系 */
const relationTreeData = [
  {
    label: '亚洲',
    value: 'Asia',
    children: [
      {
        label: '中国',
        value: 'China',
        children: [
          { label: '北京', value: 'Beijing' },
          { label: '上海', value: 'Shanghai' },
        ],
      },
    ],
  },
  { label: '北美洲', value: 'North America' },
];

/* 动态更新数据 */
const dynamicTreeData = ref<any[]>([]);
const addDynamic = () => {
  const itemLength = Math.floor(Math.random() * 3) + 1;
  dynamicTreeData.value = new Array(itemLength).fill(0).map((_, i) => {
    const length = Math.floor(Math.random() * 3);
    const children = new Array(length).fill(0).map((__, ci) => ({
      key: `${i}-${ci}`,
      label: `Item-${i}-${ci}`,
      value: `${i}-${ci}`,
    }));
    return { key: `${i}`, label: `Item-${i}`, value: `${i}`, children };
  });
};

/* 异步加载数据 */
const asyncData = ref<any[]>([
  { label: 'Node1', value: '0-0' },
  { label: 'Node2', value: '0-1' },
  { label: 'Node3', value: '0-2', isLeaf: true },
]);
const updateTreeData = (list: any[], value: any, children: any[]): any[] =>
  list.map((node) => {
    if (node.value === value) return { ...node, children };
    if (node.children) return { ...node, children: updateTreeData(node.children, value, children) };
    return node;
  });
const onLoadData = (selectedOpt: any[]) => {
  const targetOpt = selectedOpt[selectedOpt.length - 1];
  const { label, value } = targetOpt;
  return new Promise<void>((resolve) => {
    if (targetOpt.children) {
      resolve();
      return;
    }
    setTimeout(() => {
      asyncData.value = updateTreeData(asyncData.value, value, [
        { label: `${label} - 1`, value: `${label}-1`, isLeaf: selectedOpt.length > 1 },
        { label: `${label} - 2`, value: `${label}-2`, isLeaf: selectedOpt.length > 1 },
      ]);
      resolve();
    }, 1000);
  });
};

/* 远程搜索 */
const remoteTreeData = ref<any[]>([]);
const remoteLoading = ref(false);
let reqToken = 0;
let debounceTimer: any = null;
const fetchByKeyword = (keyword: string) =>
  new Promise<any[]>((resolve) => {
    const delay = 200 + Math.floor(Math.random() * 800);
    setTimeout(() => {
      if (!keyword) {
        resolve([]);
        return;
      }
      resolve([
        { label: `${keyword} - 选项 A`, value: `${keyword}-a` },
        { label: `${keyword} - 选项 B`, value: `${keyword}-b` },
        { label: `${keyword} - 选项 C`, value: `${keyword}-c` },
      ]);
    }, delay);
  });
const onRemoteChange = (v: any) => console.log('selected:', v);
const handleRemoteSearch = (input: string) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (!input) {
      remoteTreeData.value = [];
      remoteLoading.value = false;
      return;
    }
    const token = ++reqToken;
    remoteLoading.value = true;
    fetchByKeyword(input).then((next) => {
      if (token !== reqToken) return;
      remoteTreeData.value = next;
      remoteLoading.value = false;
    });
  }, 300);
};

/* 超长列表 */
const longTreeData = [
  {
    label: 'A',
    value: 'A',
    children: [
      {
        label: 'B',
        value: 'B',
        children: [
          {
            label: 'C',
            value: 'C',
            children: [
              {
                label: 'D',
                value: 'D',
                children: [{ label: 'E', value: 'E', children: [{ label: 'F', value: 'F' }] }],
              },
            ],
          },
        ],
      },
    ],
  },
];

/* 自定义 Trigger */
const getLabelFromValue = (value: string) => {
  const valueArr = value.split('-').map((item) => Number(item));
  let resultData: any = treeData;
  valueArr.forEach((item, index) => {
    resultData = index === 0 ? resultData[item] : resultData.children[item];
  });
  return resultData.label;
};
const closeIcon = (value: any, onClear: any) => (value ? h(IconClose, { onClick: onClear }) : h(IconChevronDown));
const triggerRenderSingle = ({ value, placeholder, onClear }: any) =>
  h(Button, { theme: 'light', icon: closeIcon(value, onClear), iconPosition: 'right' }, () => (value && value.length > 0 ? getLabelFromValue(value) : placeholder));
const triggerRenderMultiple = (p: any) => {
  const { value, onSearch, onRemove } = p;
  const onCloseTag = (_v: any, _e: any, tagKey: any) => {
    onRemove(tagKey);
  };
  const renderTagItem = (value: string) => {
    const label = getLabelFromValue(value);
    return h(Tag, { tagKey: value, key: value, closable: true, onClose: onCloseTag, style: { marginLeft: '2px' } }, () => label);
  };
  return h(TagInput, { value: Array.from(value as Set<string>), onInputChange: onSearch, renderTagItem });
};

const w300 = { width: '300px' };
const w320 = { width: '320px' };
</script>

<template>
  <DemoBlock title="如何引入" code="import { Cascader } from 'semi-design-vue'" />

  <DemoBlock title="基本用法" desc="最简单的用法，默认只可以选叶子节点。">
    <Cascader :style="w300" :treeData="treeData" placeholder="请选择所在地区" />
  </DemoBlock>

  <DemoBlock title="多选" desc="设置 multiple，可以进行多选。">
    <Cascader :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" :style="w300" :treeData="treeData" placeholder="请选择所在地区" multiple />
  </DemoBlock>

  <DemoBlock
    title="可搜索的"
    desc="通过设置 filterTreeNode 属性可支持搜索功能。默认对 label 值进行搜索，可通过 treeNodeFilterProp 指定其他属性值进行搜索。默认搜索结果只会展示叶子结点的路径，想要显示更多的结果，可以设置 filterLeafOnly 为 false。"
  >
    <div>
      <Cascader :style="w300" :treeData="treeData" placeholder="默认对label值进行搜索" filterTreeNode />
      <br /><br />
      <Cascader :style="w300" :treeData="treeData" placeholder="对value值进行搜索" filterTreeNode treeNodeFilterProp="value" />
      <br /><br />
      <Title :heading="6">filterLeafOnly=false:</Title>
      <Cascader :style="w300" :treeData="treeData" placeholder="filterLeafOnly=false" filterTreeNode :filterLeafOnly="false" />
      <br /><br />
      <Title :heading="6">Label 为 ReactNode，指定其他属性进行搜索</Title>
      <Cascader :style="w300" :treeData="labelNodeTreeData" placeholder="Search for labelText" filterTreeNode treeNodeFilterProp="labelText" />
    </div>
  </DemoBlock>

  <DemoBlock title="可搜索的多选" desc="支持多选和搜索同时使用，在这种场景下，可以通过按下 BackSpace 键来删除对应的已选项目。">
    <Cascader :style="w300" :treeData="treeData" placeholder="请选择所在地区" v-model="searchMultiValue" multiple filterTreeNode />
  </DemoBlock>

  <DemoBlock title="可搜索的多选 - filterSorter" desc="可以使用 filterSorter 对筛选后的数据进行排序。">
    <div>
      <Cascader :style="w300" :treeData="productTreeData" placeholder="输入 s 查看排序效果" filterTreeNode :filterSorter="filterSorter" />
    </div>
  </DemoBlock>

  <DemoBlock title="可搜索的多选 - filterRender" desc="如果想要自定义渲染搜索后的选项，可以使用 filterRender 实现整行的自定义渲染。">
    <div>
      <p>鼠标 hover 到选项可查看被省略文本完整内容</p>
      <br />
      <Cascader :style="w320" :treeData="semiTreeData" placeholder="单选，输入 s 自定义搜索选项渲染结果" filterTreeNode :filterRender="renderSearchOptionSingle" />
      <br />
      <Cascader multiple :style="{ width: '320px', marginTop: '20px' }" :treeData="semiTreeData" placeholder="多选，输入 s 自定义搜索选项渲染结果" filterTreeNode :filterRender="renderSearchOptionMultiple" />
    </div>
  </DemoBlock>

  <DemoBlock title="可搜索的多选 - virtualizeInSearch" desc="如果搜索结果中存在大量 Option，可以通过设置 virtualizeInSearch（height、width、itemSize）开启搜索结果面板的虚拟化来优化性能。">
    <Cascader multiple filterTreeNode :style="w320" :treeData="bigTreeData" placeholder="输入 通用 or 场景 进行搜索" :virtualizeInSearch="virtualize" :filterRender="virtualFilterRender" />
  </DemoBlock>

  <DemoBlock title="限制标签展示数量" desc="在多选的场景中，利用 maxTagCount 可以限制展示的标签数量，超出部分将以 +N 的方式展示。使用 showRestTagsPopover 可以设置 hover +N 时是否显示 Popover，并可在 restTagsPopoverProps 中配置 Popover。">
    <Cascader
      :style="w300"
      :treeData="treeData"
      placeholder="请选择所在地区"
      multiple
      :showRestTagsPopover="true"
      :restTagsPopoverProps="{ position: 'top' }"
      :maxTagCount="1"
      :defaultValue="[
        ['zhejiang', 'ningbo', 'haishu'],
        ['zhejiang', 'hangzhou', 'xihu'],
      ]"
    />
  </DemoBlock>

  <DemoBlock title="限制选中数量" desc="在多选的场景中，利用 max 可以限制多选选中的数量。超出 max 后将触发 onExceed 回调。">
    <Cascader :style="w300" :treeData="treeData" placeholder="请选择所在地区" multiple :max="1" @exceed="onExceed" :defaultValue="['zhejiang', 'ningbo', 'haishu']" />
  </DemoBlock>

  <DemoBlock title="选择即改变" desc="在单选的情况下，还可以通过设置 changeOnSelect，允许选中父级选项。">
    <div>
      <Cascader :style="w300" :treeData="treeData" changeOnSelect placeholder="选择即改变" />
      <br /><br />
      <Cascader :style="w300" :treeData="treeData" changeOnSelect placeholder="可搜索的选择即改变" filterTreeNode />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义显示" desc="可以通过 displayProp 设置回填选项显示的属性值，默认为 label。">
    <Title :heading="6">单选</Title>
    <Cascader :style="w300" :treeData="treeData" placeholder="回填时显示数据的value值" displayProp="value" :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" />
    <br /><br />
    <Title :heading="6">多选</Title>
    <Cascader multiple :style="w300" :treeData="treeData" :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" placeholder="回填时显示数据的value值" displayProp="value" />
  </DemoBlock>

  <DemoBlock title="自定义显示 - displayRender" desc="可以通过设置 displayRender 设定返回格式。单选时入参为 label 构成的 path 数组；多选时入参为 (item: Entity, index)。">
    <Title :heading="6">单选</Title>
    <Cascader :style="w300" :treeData="treeData" placeholder="自定义回填时显示数据的格式" :displayRender="displayRenderSingle" :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" />
    <br /><br />
    <Title :heading="6">多选</Title>
    <Cascader multiple :style="w300" :treeData="treeData" :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" placeholder="自定义回填时显示数据的格式" :displayRender="displayRenderMultiple" />
  </DemoBlock>

  <DemoBlock title="自定义分隔符" desc="可以使用 separator 设置分隔符，包括：搜索时显示在下拉框的内容以及单选时回显到 Trigger 的内容的分隔符。">
    <Cascader :style="w300" :treeData="treeData" :defaultValue="['zhejiang', 'ningbo', 'jiangbei']" filterTreeNode separator=" > " />
  </DemoBlock>

  <DemoBlock title="禁用" desc="设置 disabled 禁用组件。">
    <div>
      <Cascader :style="w300" :treeData="disabledTreeData" placeholder="请选择所在地区" disabled />
      <br /><br />
      <Cascader :style="w300" :treeData="disabledTreeData" placeholder="请选择所在地区" :defaultValue="['zhejiang', 'hangzhou', 'xihu']" filterTreeNode disabled />
    </div>
  </DemoBlock>

  <DemoBlock title="严格禁用" desc="开启 disableStrictly 后，当节点是 disabled 的时候，则不能通过子级或者父级的关系改变选中状态。节点“宁波”开启了严格禁用，改变其父节点“浙江省”的选中状态时不会影响到“宁波”。">
    <Cascader :style="w300" :treeData="strictTreeData" multiple placeholder="请选择所在地区" disableStrictly />
  </DemoBlock>

  <DemoBlock title="展示子菜单的时机" desc="可以使用 showNext 设置展开 Dropdown 子菜单的触发时机，可选: click（默认）、hover。">
    <Cascader :style="w300" :treeData="disabledTreeData" placeholder="请选择所在地区" showNext="hover" />
  </DemoBlock>

  <DemoBlock title="点击选中" desc="在多选模式下，默认点击非叶子节点不会触发选中。通过 clickToSelect 开启点击任意节点即选中，常配合 showNext=&quot;hover&quot; 使用：悬浮展开子菜单，点击则选中当前节点。">
    <Cascader :style="w300" :treeData="clickTreeData" multiple placeholder="请选择所在地区" showNext="hover" clickToSelect />
  </DemoBlock>

  <DemoBlock title="在顶部/底部渲染附加项" desc="级联选择器的顶部、底部分别预留了插槽，可通过 topSlot 或 bottomSlot 来设置。">
    <Cascader :style="w300" :treeData="treeData" placeholder="请选择所在地区">
      <template #bottomSlot>
        <div :style="slotStyle">
          <Text>找不到相关选项？</Text>
          <Text link>去新建</Text>
        </div>
      </template>
    </Cascader>
  </DemoBlock>

  <DemoBlock title="受控" desc="传入 value 时即为受控组件，可以配合 onChange 使用。">
    <Cascader :style="w300" :treeData="treeData" placeholder="请选择所在地区" :value="controlledValue" @change="onControlledChange" />
  </DemoBlock>

  <DemoBlock title="自动合并 value" desc="多选场景中，当选中祖先节点时，如果希望 value 不包含它对应的子孙节点，则可以通过 autoMergeValue 来设置，默认为 true。当 autoMergeValue 和 leafOnly 同时开启时，后者优先级更高。">
    <Cascader :style="w300" :treeData="treeData" placeholder="autoMergeValue 为 false" :value="mergeValue" multiple :autoMergeValue="false" @change="onMergeChange" />
  </DemoBlock>

  <DemoBlock title="仅叶子节点" desc="在多选时，可以通过开启 leafOnly 来设置 value 只包含叶子节点，即显示的 Tag 和 onChange 的参数 value 只包含叶子节点。">
    <Cascader :style="w300" :treeData="treeData" placeholder="开启 leafOnly" :value="leafValue" multiple leafOnly @change="onLeafChange" />
  </DemoBlock>

  <DemoBlock title="节点选中关系" desc="多选时，可以使用 checkRelation 来设置节点之间选中关系的类型，可选：'related'（默认）、'unRelated'。当选中关系为 'unRelated' 时，节点之间的选中互不影响。">
    <Cascader multiple :defaultValue="[['Asia'], ['Asia', 'China', 'Beijing']]" checkRelation="unRelated" :style="w300" :treeData="relationTreeData" />
  </DemoBlock>

  <DemoBlock title="动态更新数据" desc="treeData 变化后下拉选项随之更新。">
    <Cascader :style="w300" :treeData="dynamicTreeData" placeholder="请选择" />
    <br /><br />
    <Button @click="addDynamic">动态改变数据</Button>
  </DemoBlock>

  <DemoBlock title="异步加载数据" desc="可以使用 loadData 实现异步加载数据。不能与搜索同时使用。">
    <Cascader :style="w300" :treeData="asyncData" :loadData="onLoadData" placeholder="Please select" />
  </DemoBlock>

  <DemoBlock title="远程搜索" desc="设置 remote 后，搜索输入不再走本地匹配，而是仅触发 onSearch 回调，由你根据输入异步拉取 treeData。建议自行处理防抖、竞态保护、loading 提示以及空输入还原。">
    <Spin :spinning="remoteLoading">
      <Cascader :style="w300" placeholder="输入关键词远程搜索" filterTreeNode remote :treeData="remoteTreeData" @search="handleRemoteSearch" @change="onRemoteChange" />
    </Spin>
  </DemoBlock>

  <DemoBlock title="超长列表" desc="当数据层级特别深时，下拉菜单可能会超出屏幕，建议为下拉菜单设置 overflow-x: auto 以及一个合适的 width（建议以 N+0.5 列的宽度为准）。">
    <Cascader dropdownClassName="components-cascader-demo" :style="w300" :treeData="longTreeData" placeholder="请选择所在地区" />
  </DemoBlock>

  <DemoBlock title="自定义 Trigger" desc="如果默认的触发器样式满足不了你的需求，可以用 triggerRender 自定义选择框的展示。入参包含 componentProps、disabled、value（选中节点的层级位置，如 '0-0-1'）、inputValue、onSearch、onClear、placeholder、onRemove。">
    <Cascader :treeData="treeData" placeholder="Custom Trigger" :triggerRender="triggerRenderSingle" />
    <br />
    <Cascader :triggerRender="triggerRenderMultiple" multiple filterTreeNode :treeData="treeData" :style="w300" placeholder="Custom Trigger" />
  </DemoBlock>
</template>

<style>
.components-cascader-demo .semi-cascader-option-lists {
  max-width: 510px;
  overflow-x: auto;
}
</style>
