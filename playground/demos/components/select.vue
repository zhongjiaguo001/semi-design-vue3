<script setup lang="ts">
import { h, ref, computed } from 'vue';
import {
  Select,
  SelectOption as Option,
  SelectOptGroup as OptGroup,
  Button,
  Toast,
  Tag,
  Avatar,
  TextArea,
  TagInput,
  Checkbox,
  Highlight,
  IconVigoLogo,
  IconGift,
  IconAppCenter,
  IconChevronDown,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Select } from 'semi-design-vue';
const Option = Select.Option; // 或 import { SelectOption, SelectOptGroup } from 'semi-design-vue'`;

// ---------- 以数组形式传入 Option ----------
const arrayList = [
  { value: 'douyin', label: '抖音', otherKey: 0 },
  { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
  { value: 'jianying', label: '剪映', otherKey: 2 },
  { value: 'toutiao', label: '今日头条', otherKey: 3 },
];

// ---------- 多选 ----------
const onExceed = () => Toast.warning('最多只允许选择两项');

// ---------- 分组 (数据驱动) ----------
const groupData = [
  {
    label: 'Asia',
    children: [
      { value: 'a-1', label: 'China' },
      { value: 'a-2', label: 'Korea' },
    ],
  },
  {
    label: 'Europe',
    children: [
      { value: 'b-1', label: 'Germany' },
      { value: 'b-2', label: 'France' },
    ],
  },
  {
    label: 'South America',
    children: [{ value: 'c-1', label: 'Peru' }],
  },
];

// ---------- 在顶部/底部渲染附加项 ----------
const innerSlotStyle = {
  backgroundColor: 'var(--color-white)',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  paddingLeft: '32px',
  borderTop: '1px solid var(--semi-color-border)',
  borderRadius: '0 0 6px 6px',
  color: 'var(--semi-color-link)',
};
const outSlotStyle = {
  backgroundColor: 'var(--semi-color-fill-0)',
  height: '36px',
  display: 'flex',
  paddingLeft: '32px',
  color: 'var(--semi-color-link)',
  alignItems: 'center',
  cursor: 'pointer',
  borderTop: '1px solid var(--semi-color-border)',
  borderRadius: '0 0 6px 6px',
};

// outerTopSlot tabs
const topSlotList: Record<string, { value: string; label: string }[]> = {
  component: [
    { value: 'select', label: '选择器' },
    { value: 'tabs', label: '标签' },
    { value: 'avatar', label: '头像' },
    { value: 'button', label: '按钮' },
  ],
  design: [
    { value: 'color', label: '颜色' },
    { value: 'dark', label: '暗色模式' },
    { value: 'icon', label: '图标' },
    { value: 'font', label: '字体' },
  ],
  feedback: [
    { value: 'faq', label: '常见问题' },
    { value: 'join', label: '加入用户群' },
    { value: 'hornbill', label: '犀鸟反馈问题' },
  ],
};
const tabKey = ref('component');
const tabValue = ref<any>({ value: 'faq', label: '常见问题' });
const tabStyle = { cursor: 'pointer', marginRight: '12px', paddingBottom: '4px' };
const tabActiveStyle = { ...tabStyle, borderBottom: '1px solid var(--semi-color-primary)', fontWeight: 700 };
const tabWrapper = { display: 'flex', paddingTop: '8px', paddingLeft: '32px', borderBottom: '0.5px solid var(--semi-color-border)' };
const tabOptions = [
  { itemKey: 'component', label: '组件' },
  { itemKey: 'design', label: '设计' },
  { itemKey: 'feedback', label: '反馈' },
];
const tabOptionList = computed(() => topSlotList[tabKey.value]);

// ---------- 受控组件 ----------
const controlledValue = ref('xigua');

// ---------- 动态修改 Options ----------
const dynamicOptions = ref<number[]>([1, 2, 3, 4]);
const addOptions = () => {
  const length = Math.ceil(Math.random() * 10);
  dynamicOptions.value = Array.from({ length }, (_v, i) => i + 1);
};

// ---------- 联动 ----------
const provinces = ['四川', '广东'];
const cityMaps: Record<string, string[]> = {
  四川: ['成都', '都江堰'],
  广东: ['广州', '深圳', '东莞'],
};
const province = ref(provinces[0]);
const citys = computed(() => cityMaps[province.value]);
const city = ref(cityMaps[provinces[0]][0]);
const provinceChange = (newProvince: string) => {
  province.value = newProvince;
  city.value = cityMaps[newProvince][0];
};
const cityChange = (newCity: string) => {
  city.value = newCity;
};

// ---------- 远程搜索 ----------
const remoteInitList = [
  { value: 'douyin', label: '抖音', type: 1 },
  { value: 'xingtu', label: '醒图', type: 2 },
  { value: 'jianying', label: '剪映', type: 3 },
  { value: 'toutiao', label: '今日头条', type: 4 },
];
const remoteLoading = ref(false);
const remoteList = ref<any[]>(remoteInitList);
const remoteValue = ref<any>([]);
const handleMultipleChange = (newValue: any) => {
  remoteValue.value = newValue;
};
const handleRemoteSearch = (inputValue: string) => {
  remoteLoading.value = true;
  let result: any[] = [];
  if (inputValue) {
    const length = Math.ceil(Math.random() * 100);
    result = Array.from({ length }, (_v, i) => ({ value: inputValue + i, label: `相近业务 ${inputValue}${i}`, type: i + 1 }));
    setTimeout(() => {
      remoteLoading.value = false;
      remoteList.value = result;
    }, 1000);
  } else {
    remoteLoading.value = false;
  }
};
let remoteTimer: ReturnType<typeof setTimeout> | undefined;
// debounce(handleSearch, 1000)
const debouncedRemoteSearch = (v: string) => {
  if (remoteTimer) clearTimeout(remoteTimer);
  remoteTimer = setTimeout(() => handleRemoteSearch(v), 1000);
};

// ---------- 自定义搜索逻辑 ----------
function searchLabel(sugInput: string, option: any) {
  const label = String(option.label).toUpperCase();
  const sug = sugInput.toUpperCase();
  return label.includes(sug);
}

// ---------- 自定义已选项标签渲染 ----------
const personList = [
  {
    name: '夏可漫',
    email: 'xiakeman@example.com',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png',
  },
  {
    name: '申悦',
    email: 'shenyue@example.com',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/bag.jpeg',
  },
  {
    name: '曲晨一',
    email: 'quchenyi@example.com',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/Viamaker.png',
  },
  {
    name: '文嘉茂',
    email: 'wenjiamao@example.com',
    avatar:
      'https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/6fbafc2d-e3e6-4cff-a1e2-17709c680624.png',
  },
];
const customOptionStyle = { display: 'flex', paddingLeft: '24px', paddingTop: '10px', paddingBottom: '10px' };
const renderSelectedItem = (optionNode: any) =>
  h('div', { style: { display: 'flex', alignItems: 'center' } }, [
    h(Avatar, { src: optionNode.avatar, size: 'small' }, () => optionNode.abbr),
    h('span', { style: { marginLeft: '8px' } }, optionNode.email),
  ]);
// avatarSrc & avatarShape are supported
const renderMultipleWithCustomTag = (optionNode: any, { onClose }: any) => ({
  isRenderInTag: false,
  content: h(Tag, { avatarSrc: optionNode.avatar, avatarShape: 'circle', closable: true, onClose, size: 'large' }, () => optionNode.name),
});
const renderMultipleWithCustomTag2 = (optionNode: any, { onClose }: any) => ({
  isRenderInTag: false,
  content: h(Tag, { avatarSrc: optionNode.avatar, avatarShape: 'square', closable: true, onClose, size: 'large' }, () => optionNode.name),
});
const log = (v: any) => console.log(v);

// ---------- 获取选项的其他属性 ----------
const objList = [
  { value: 'douyin', label: '抖音', type: 1 },
  { value: 'ulikecam', label: '轻颜相机', type: 2 },
  { value: 'jianying', label: '剪映', type: 3 },
  { value: 'toutiao', label: '今日头条', type: 4 },
];
const cbValue = ref<any>();
const multipleCbValue = ref<any>();
const onObjChange = (value: any) => {
  cbValue.value = value;
  console.log(value);
};
const onObjMultipleChange = (value: any) => {
  multipleCbValue.value = value;
  console.log(value);
};
const cbText = computed(() => JSON.stringify(cbValue.value) ?? '');
const multipleCbText = computed(() => JSON.stringify(multipleCbValue.value) ?? '');

// ---------- 创建条目 ----------
const createOptionList = [
  { value: 'douyin', label: '抖音' },
  { value: 'ulikecam', label: '轻颜相机' },
  { value: 'jianying', label: '剪映' },
  { value: 'toutiao', label: '今日头条' },
];
const renderCreateItem = (input: string, _isFocus: boolean, style?: any) => h('div', { style: { padding: '10px', ...(style || {}) } }, `Create Item：${input}`);

// ---------- 虚拟化 ----------
const virtualOptions = Array.from({ length: 3000 }, (_v, i) => ({ label: `option-${i}`, value: i }));
const virtualize = { height: 270, width: '100%', itemSize: 36 };

// ---------- 自定义触发器 ----------
const triggerList = [
  { value: 'douyin', label: '抖音' },
  { value: 'ulikecam', label: '轻颜相机' },
  { value: 'jianying', label: '剪映' },
  { value: 'toutiao', label: '今日头条' },
];
const valList = ref<string[]>(['douyin', 'ulikecam']);
const triggerRender = ({ value }: any) =>
  h(
    'div',
    {
      style: {
        minWidth: '112px',
        backgroundColor: 'var(--semi-color-primary-light-default)',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        borderRadius: '3px',
        color: 'var(--semi-color-primary)',
      },
    },
    [
      h('div', { style: { fontWeight: 600, flexShrink: 0, fontSize: '14px' } }, '业务线'),
      h('div', { style: { margin: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexGrow: 1, overflow: 'hidden' } }, value.map((item: any) => item.label).join(' , ')),
      h(IconAppCenter, { style: { marginRight: '8px', flexShrink: 0 } }),
    ]
  );
const triggerRender2 = ({ value }: any) =>
  h(
    'div',
    { style: { margin: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexGrow: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' } },
    [h(Tag, { size: 'large', color: 'cyan', shape: 'circle', suffixIcon: h(IconChevronDown) }, () => value.map((item: any) => item.label).join(' / '))]
  );

// triggerRender + TagInput 拖拽排序
const sortValList = ref<string[]>(['douyin', 'ulikecam']);
const sortInputVal = ref('');
const handleSort = (currentLabels: string[]) => {
  sortValList.value = currentLabels.map((item) => triggerList.find((i) => i.label === item)!.value);
};
const triggerRenderSort = ({ value, onSearch, onClear }: any) =>
  h('div', { onKeydown: (e: KeyboardEvent) => e.stopPropagation() }, [
    h(TagInput, {
      draggable: true,
      allowDuplicates: false,
      value: value.map((item: any) => item.label),
      inputValue: sortInputVal.value,
      onInputChange: (word: string) => {
        onSearch(word);
        sortInputVal.value = word;
      },
      onChange: handleSort,
      onClear: () => onClear(),
      showClear: true,
    }),
  ]);

// ---------- 自定义候选项渲染 ----------
const renderInputValue = ref('');
const renderOptionItem = (renderProps: any) => {
  const { disabled, selected, label, focused, className, style, onMouseEnter, onClick } = renderProps;
  const optionCls = {
    'custom-option-render': true,
    'custom-option-render-focused': focused,
    'custom-option-render-disabled': disabled,
    'custom-option-render-selected': selected,
    [className]: Boolean(className),
  };
  const searchWords = [renderInputValue.value];
  // Notice：
  // 1.props传入的style需在wrapper dom上进行消费，否则在虚拟化场景下会无法正常使用
  // 2.选中(selected)、聚焦(focused)、禁用(disabled)等状态的样式需自行加上，你可以从props中获取到相对的boolean值
  // 3.onMouseEnter、className需在wrapper dom上绑定，否则上下键盘操作时显示会有问题
  return h('div', { style, class: optionCls, onClick: () => onClick(), onMouseenter: () => onMouseEnter() }, [
    h(Checkbox, { checked: selected }),
    h('div', { class: 'option-right' }, [h(Highlight, { sourceString: label, searchWords })]),
  ]);
};
const renderOptionList = [
  { value: 'douyin', label: '抖音', otherKey: 0 },
  { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
  { value: 'jianying', label: '剪映', otherKey: 2 },
  { value: 'toutiao', label: '今日头条', otherKey: 3 },
];
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本使用" desc="每个 Option 标签都必须声明 value 属性，Option 的 children 或 label 将会被渲染至下拉列表中。">
    <Select defaultValue="douyin" style="width: 120px">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying" disabled>剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select defaultValue="douyin" disabled style="width: 120px">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
    <br />
    <br />
    <Select placeholder="请选择业务线" style="width: 120px">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying" disabled>剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="以数组形式传入 Option" desc="可以直接通过 optionList 传入一个对象数组，每个对象必须包含 value/label 属性（其他属性也可以通过此方式传入）。">
    <Select placeholder="请选择业务线" style="width: 180px" :optionList="arrayList" />
  </DemoBlock>

  <DemoBlock
    title="多选"
    desc="配置 multiple 支持多选；maxTagCount 限制已选项展示数量，超出以 +N 展示；showRestTagsPopover / restTagsPopoverProps 控制 +N 的 Popover；ellipsisTrigger 对溢出 tag 做自适应截断；expandRestTagsOnClick 展开时显示全部 tag；max 限制最多可选数量并触发 exceed 事件。"
  >
    <Select multiple style="width: 320px" :defaultValue="['douyin', 'ulikecam']">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select multiple :maxTagCount="2" showRestTagsPopover :restTagsPopoverProps="{ position: 'top' }" style="width: 320px" :defaultValue="['douyin', 'ulikecam', 'jianying']">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select multiple style="width: 320px" :defaultValue="['douyin']" :max="2" @exceed="onExceed">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select
      multiple
      :maxTagCount="2"
      showRestTagsPopover
      :restTagsPopoverProps="{ position: 'top' }"
      style="width: 220px"
      :defaultValue="['xigua', 'ulikecam', 'jianying', 'douyin']"
      ellipsisTrigger
      expandRestTagsOnClick
    >
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="分组" desc="用 OptGroup 进行分组（仅支持通过 children 方式声明，不支持 optionList）。OptGroup 必须为 Select 的直接子元素。">
    <Select placeholder="" style="width: 180px" filter>
      <OptGroup label="Asia">
        <Option value="a-1">China</Option>
        <Option value="a-2">Korea</Option>
      </OptGroup>
      <OptGroup label="Europe">
        <Option value="b-1">Germany</Option>
        <Option value="b-2">France</Option>
      </OptGroup>
      <OptGroup label="South America">
        <Option value="c-1">Peru</Option>
      </OptGroup>
    </Select>
  </DemoBlock>

  <DemoBlock title="分组 - 2" desc="通过数据循环生成 OptGroup / Option；若 children 需要动态更新，OptGroup 上的 key 也需要更新。">
    <Select placeholder="" style="width: 180px" filter>
      <OptGroup v-for="(group, index) in groupData" :key="`${index}-${group.label}`" :label="group.label">
        <Option v-for="(option, index2) in group.children" :key="`${index2}-${group.label}`" :value="option.value">{{ option.label }}</Option>
      </OptGroup>
    </Select>
  </DemoBlock>

  <DemoBlock title="不同尺寸" desc="通过 size 控制选择器的大小尺寸: small / default / large。">
    <Select placeholder="请选择业务线" style="width: 180px" size="small">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
    <br />
    <br />
    <Select placeholder="请选择业务线" style="width: 180px">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
    <br />
    <br />
    <Select placeholder="请选择业务线" style="width: 180px" size="large">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="不同校验状态样式" desc="validateStatus: default / warning / error，仅影响背景颜色等样式表现。">
    <Select style="width: 180px">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
    <br />
    <br />
    <Select style="width: 180px" validateStatus="warning">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
    <br />
    <br />
    <Select style="width: 180px" validateStatus="error">
      <Option value="ulikecam">轻颜相机</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="配置前缀、后缀、清除按钮" desc="通过 prefix / suffix 传入选择框前后缀（文本或节点）；showClear 控制清除按钮；showArrow 控制右侧下拉箭头。">
    <Select style="width: 320px" defaultValue="ulikecam" showClear>
      <template #prefix><IconVigoLogo /></template>
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select style="width: 320px" defaultValue="ulikecam" :showArrow="false">
      <template #prefix><IconVigoLogo /></template>
      <template #suffix><IconGift /></template>
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
  </DemoBlock>

  <DemoBlock
    title="在顶部/底部渲染附加项"
    desc="innerTopSlot / innerBottomSlot 渲染在 optionList 内部，滚动到顶/底部时展现；outerTopSlot / outerBottomSlot 与 optionList 平级，始终展现。"
  >
    <div>
      <p>outerBottomSlot:</p>
      <Select style="width: 300px" :dropdownStyle="{ width: '180px' }" :maxHeight="150" placeholder="自定义外侧底部slot，始终显示" defaultOpen :autoAdjustOverflow="false" position="bottom">
        <template #outerBottomSlot>
          <div :style="outSlotStyle">
            <span style="color: var(--semi-color-link)">未找到应用?</span>
          </div>
        </template>
        <Option value="douyin">抖音</Option>
        <Option value="ulikecam">轻颜相机</Option>
        <Option value="jianying">剪映</Option>
        <Option value="duoshan">多闪</Option>
        <Option value="xigua">西瓜视频</Option>
      </Select>
      <p style="margin-top: 200px">innerBottomSlot:</p>
      <Select style="width: 300px" :dropdownStyle="{ width: '180px' }" :maxHeight="150" placeholder="自定义内侧底部slot，滚动至底部显示">
        <template #innerBottomSlot>
          <div :style="innerSlotStyle">点击加载更多</div>
        </template>
        <Option value="douyin">抖音</Option>
        <Option value="ulikecam">轻颜相机</Option>
        <Option value="jianying">剪映</Option>
        <Option value="duoshan">多闪</Option>
        <Option value="xigua">西瓜视频</Option>
      </Select>
    </div>
  </DemoBlock>

  <DemoBlock title="在顶部/底部渲染附加项 - 2" desc="通过 outerTopSlot 将内容插入顶部插槽，实现 tab 切换 optionList。">
    <Select defaultOpen :autoAdjustOverflow="false" :value="tabValue" onChangeWithObject @change="(obj: any) => (tabValue = obj)" style="width: 200px" :optionList="tabOptionList">
      <template #outerTopSlot>
        <div :style="tabWrapper">
          <div v-for="item in tabOptions" :key="item.itemKey" :style="item.itemKey === tabKey ? tabActiveStyle : tabStyle" @click="tabKey = item.itemKey">
            {{ item.label }}
          </div>
        </div>
      </template>
    </Select>
  </DemoBlock>

  <DemoBlock title="受控组件" desc="传入 value 时 Select 为受控组件，所选中的值完全由 value 决定。">
    <Select :value="controlledValue" style="width: 300px" @change="(v: any) => (controlledValue = v)" placeholder="受控的Select">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="动态修改 Options" desc="如果需要动态更新 Options，应该使用受控的 value。">
    <Select style="width: 180px" placeholder="请选择" :value="4">
      <Option v-for="option in dynamicOptions" :key="option" :value="option">{{ option }}</Option>
    </Select>
    <br />
    <br />
    <Button @click="addOptions">changeOptions Dynamic</Button>
  </DemoBlock>

  <DemoBlock title="联动" desc="使用受控 value，实现不同 Select 之间的联动。带有层级关系的复杂联动建议使用 Cascader。">
    <Select style="width: 150px; margin: 10px" :value="province" @change="provinceChange">
      <Option v-for="pro in provinces" :key="pro" :value="pro">{{ pro }}</Option>
    </Select>
    <Select style="width: 150px; margin: 10px" :value="city" @change="cityChange">
      <Option v-for="c in citys" :key="c" :value="c">{{ c }}</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="开启搜索" desc="filter 置为 true 开启搜索，默认对 label 做 include 对比；多选选中后默认清空搜索关键字，autoClearSearchValue=false 可保留。">
    <Select filter style="width: 180px" placeholder="带搜索功能的单选">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select filter multiple style="width: 300px" placeholder="带搜索功能的多选" :autoClearSearchValue="false">
      <Option value="semi-0">Semi-0</Option>
      <Option value="semi-1">Semi-1</Option>
      <Option value="semi-2">Semi-2</Option>
      <Option value="semi-3">Semi-3</Option>
      <Option value="semi-4">Semi-4</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="搜索框位置" desc="searchPosition 可选 dropdown / trigger；searchPlaceholder 定制 dropdown 中搜索框的 placeholder。">
    <Select filter searchPosition="dropdown" style="width: 200px" defaultValue="ulikecam" placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的单选">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
    <br />
    <br />
    <Select filter searchPosition="dropdown" multiple style="width: 300px" :defaultValue="['semi-1']" placeholder="我的搜索框在下拉菜单中" searchPlaceholder="带搜索功能的多选" :autoClearSearchValue="false">
      <Option value="semi-0">Semi-0</Option>
      <Option value="semi-1">Semi-1</Option>
      <Option value="semi-2">Semi-2</Option>
      <Option value="semi-3">Semi-3</Option>
      <Option value="semi-4">Semi-4</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="远程搜索" desc="filter 开启搜索，remote 关闭本地筛选，通过 search 事件（防抖）动态更新 optionList，loading 展示加载状态，使用受控 value。">
    <Select style="width: 300px" filter remote onChangeWithObject multiple :value="remoteValue" @search="debouncedRemoteSearch" :optionList="remoteList" :loading="remoteLoading" @change="handleMultipleChange" :emptyContent="null" />
  </DemoBlock>

  <DemoBlock title="自定义搜索逻辑" desc="将 filter 置为自定义函数，定制搜索策略（例如忽略大小写）。">
    <Select :filter="searchLabel" style="width: 180px" placeholder="try douyin">
      <Option value="douyin">douyin</Option>
      <Option value="ulikecam">HOTSOON</Option>
      <Option value="jianying">PIPIXIA</Option>
      <Option value="xigua">XIGUA</Option>
    </Select>
  </DemoBlock>

  <DemoBlock
    title="自定义已选项标签渲染"
    desc="通过 renderSelectedItem 自定义选择框中已选项的渲染。单选返回节点；多选返回 { isRenderInTag, content }，isRenderInTag 为 true 时自动包裹在 Tag 中。"
  >
    <Select placeholder="请选择" style="width: 280px; height: 40px" @change="log" defaultValue="申悦" :renderSelectedItem="renderSelectedItem">
      <Option v-for="item in personList" :key="item.email" :value="item.name" :style="customOptionStyle" showTick v-bind="item">
        <Avatar size="small" :src="item.avatar" />
        <div style="margin-left: 8px">
          <div style="font-size: 14px">{{ item.name }}</div>
          <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">{{ item.email }}</div>
        </div>
      </Option>
    </Select>
    <Select placeholder="请选择" :maxTagCount="2" style="width: 280px; margin-top: 20px" @change="log" :defaultValue="['申悦', '曲晨一']" multiple :renderSelectedItem="renderMultipleWithCustomTag">
      <Option v-for="item in personList" :key="item.email" :value="item.name" :style="customOptionStyle" showTick v-bind="item">
        <Avatar size="small" :src="item.avatar" />
        <div style="margin-left: 8px">
          <div style="font-size: 14px">{{ item.name }}</div>
          <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">{{ item.email }}</div>
        </div>
      </Option>
    </Select>
    <Select placeholder="请选择" :maxTagCount="2" style="width: 280px; margin-top: 20px" @change="log" :defaultValue="['申悦', '曲晨一']" multiple :renderSelectedItem="renderMultipleWithCustomTag2">
      <Option v-for="item in personList" :key="item.email" :value="item.name" :style="customOptionStyle" showTick v-bind="item">
        <Avatar size="small" :src="item.avatar" />
        <div style="margin-left: 8px">
          <div style="font-size: 14px">{{ item.name }}</div>
          <div style="color: var(--color-text-2); font-size: 12px; line-height: 16px; font-weight: normal">{{ item.email }}</div>
        </div>
      </Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="自定义弹出层样式" desc="通过 dropdownClassName、dropdownStyle 控制弹出层的样式，例如通过 dropdownStyle 传入 width。">
    <Select placeholder="自定义弹出层样式的" style="width: 180px" :dropdownStyle="{ width: '250px' }" dropdownClassName="test">
      <Option value="douyin">抖音</Option>
      <Option value="ulikecam">轻颜相机</Option>
      <Option value="jianying">剪映</Option>
      <Option value="xigua">西瓜视频</Option>
    </Select>
  </DemoBlock>

  <DemoBlock title="获取选项的其他属性" desc="onChangeWithObject 为 true 时，change 的入参为 option 对象 { value, label, ...rest }；此时 defaultValue / value 也应为对象。">
    <div>
      <div>
        <Select style="width: 150px" onChangeWithObject :optionList="objList" placeholder="单选" :defaultValue="objList[0]" @change="onObjChange" />
        <h4>onChange回调:</h4>
        <TextArea style="width: 320px; margin-bottom: 48px" autosize :value="cbText" :rows="2" />
      </div>
      <div>
        <Select style="width: 320px" onChangeWithObject multiple :optionList="objList" @change="onObjMultipleChange" placeholder="多选" />
        <h4>onChange回调:</h4>
        <TextArea style="width: 320px" autosize :value="multipleCbText" />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="创建条目" desc="allowCreate 可以创建并选中不存在的条目；renderCreateItem 自定义创建项的内容；配合 defaultActiveFirstOption 回车可立即创建。">
    <Select style="width: 400px" :optionList="createOptionList" allowCreate multiple filter @change="log" defaultActiveFirstOption />
    <br />
    <br />
    <Select style="width: 400px" :optionList="createOptionList" allowCreate multiple filter placeholder="With renderCreateItem" :renderCreateItem="renderCreateItem" @change="log" defaultActiveFirstOption />
  </DemoBlock>

  <DemoBlock title="虚拟化" desc="传入 virtualize（height / width / itemSize）开启列表虚拟化，用于大量 Option 节点的性能优化。">
    <Select placeholder="拥有3k个Option的Select" style="width: 260px" filter :virtualize="virtualize" :optionList="virtualOptions" />
  </DemoBlock>

  <DemoBlock title="自定义触发器" desc="通过 triggerRender 自定义选择框的展示；配合 searchPosition='dropdown' 可保留搜索能力。">
    <div>
      <h4>不同背景色的触发器</h4>
      <Select :value="valList" :triggerRender="triggerRender" :optionList="triggerList" @change="(v: any) => (valList = v)" multiple filter searchPosition="dropdown" style="width: 240px" />
      <br />
      <br />
      <h4>使用 circle Tag 作为触发器</h4>
      <Select :value="valList" @change="(v: any) => (valList = v)" :triggerRender="triggerRender2" :optionList="triggerList" filter multiple searchPosition="dropdown" style="width: 240px; margin-top: 20px; outline: 0" />
    </div>
  </DemoBlock>

  <DemoBlock title="自定义触发器 - 2" desc="更复杂的例子：复用 TagInput 拖拽排序能力，通过 triggerRender 为 Select 增加排序。">
    <h4>可对已选项拖拽重新排序的 Select</h4>
    <Select :value="sortValList" :triggerRender="triggerRenderSort" :optionList="triggerList" @change="(v: any) => (sortValList = v)" multiple filter style="width: 240px" />
  </DemoBlock>

  <DemoBlock
    title="自定义候选项渲染"
    desc="简单自定义：通过 Option 的 label / children 传入节点；完全自定义：通过 renderOptionItem 接管候选项渲染（style、className、onMouseEnter 需在 wrapper dom 上消费，状态样式需自行添加）。"
  >
    <Select filter placeholder="单选" @search="(v: string) => (renderInputValue = v)" dropdownClassName="components-select-demo-renderOptionItem" :optionList="renderOptionList" style="width: 180px" :renderOptionItem="renderOptionItem" />
    <br />
    <br />
    <Select filter placeholder="多选" multiple @search="(v: string) => (renderInputValue = v)" dropdownClassName="components-select-demo-renderOptionItem" :optionList="renderOptionList" style="width: 320px" :renderOptionItem="renderOptionItem" />
  </DemoBlock>
</template>

<style>
.components-select-demo-renderOptionItem .custom-option-render {
  display: flex;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
  padding-left: 12px;
  padding-right: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
  color: var(--semi-color-text-0);
  position: relative;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
}
.components-select-demo-renderOptionItem .custom-option-render .option-right {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
}
.components-select-demo-renderOptionItem .custom-option-render:active {
  background-color: var(--semi-color-fill-1);
}
.components-select-demo-renderOptionItem .custom-option-render-focused {
  background-color: var(--semi-color-fill-0);
}
.components-select-demo-renderOptionItem .custom-option-render-disabled {
  color: var(--semi-color-disabled-text);
  cursor: not-allowed;
}
.components-select-demo-renderOptionItem .custom-option-render:first-of-type {
  margin-top: 4px;
}
.components-select-demo-renderOptionItem .custom-option-render:last-of-type {
  margin-bottom: 4px;
}
</style>
