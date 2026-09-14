<script setup lang="ts">
import { h, ref } from 'vue';
import { TagInput, Button, Avatar, Toast, IconVigoLogo, IconGift, IconClose } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { TagInput } from 'semi-design-vue';`;

const log = (...args: any[]) => console.log(...args);

// ---------- 输入限制 ----------
const onExceed = (v: string[]) => {
  Toast.warning('超过 max');
  console.log(v);
};
const onInputExceed = (v: string) => {
  Toast.warning('超过 maxLength');
  console.log(v);
};

// ---------- 标签受控 ----------
const controlledValue = ref<string[]>(['抖音']);
const handleChange = (v: string[]) => {
  controlledValue.value = v;
};

// ---------- 输入受控 ----------
const controlledInput = ref('abc');
const handleInputChange = (v: string, _e: any) => {
  controlledInput.value = v;
};

// ---------- 焦点管理 ----------
const tagInputRef = ref<any>(null);
const handleTagInputFocus = () => {
  tagInputRef.value && tagInputRef.value.focus();
};

// ---------- 自定义标签渲染 ----------
const customValue = ref<string[]>(['夏可漫']);
const list = [
  { name: '夏可漫', avatar: 'https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/avatarDemo.jpeg' },
  { name: '申悦', avatar: 'https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg' },
  { name: '曲晨一', avatar: 'https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dbf7351bb779433d17c4f50478cf42f7.jpg' },
  { name: '文嘉茂', avatar: 'https://sf6-cdn-tos.douyinstatic.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/7abf810ff060ac3387bd027ead92c4e0.jpg' },
];
const mapList = new Map(list.map((item) => [item.name, item]));
const renderTagItem = (value: string, index: number, onClose: (...args: any[]) => void) => {
  const data = mapList.get(value);
  return h(
    'div',
    {
      key: index,
      style: {
        backgroundColor: 'var(--semi-color-info-light-default)',
        padding: '4px 8px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        marginRight: '10px',
      },
    },
    [
      h(Avatar, {
        alt: 'avatar',
        src: data ? data.avatar : 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/dy.png',
        size: 'extra-small',
      }),
      h('span', { style: { marginLeft: '8px' } }, `${value}@semi.com`),
      h(IconClose, { style: { paddingLeft: '4px', color: 'var(--semi-color-text-3)' }, size: 'small', onClick: onClose }),
    ]
  );
};
const handleCustomChange = (v: string[]) => {
  customValue.value = v;
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本演示" desc="敲击回车键后，输入内容将成为标签。标签内容如果为空串或者纯空格时，则会被过滤。">
    <TagInput :defaultValue="['抖音', '火山', '西瓜视频']" placeholder="请输入..." @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="批量添加" desc="可以使用 separator 设置分隔符，来实现批量输入，它的默认值为英文逗号。支持多个分隔符以 string[] 格式传入。">
    <TagInput separator="-" placeholder="使用 - 进行批量输入" @change="(v) => log(v)" />
    <br /><br />
    <TagInput :separator="['-', '/', '|', '++']" placeholder="支持多个分隔符进行批量输入" @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="批量删除" desc="可使用 showClear 设置是否支持一键删除所有标签和输入框内容。">
    <TagInput showClear :defaultValue="['抖音', '火山']" placeholder="请输入..." @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="禁用" desc="禁用状态。">
    <TagInput disabled showClear :defaultValue="['抖音', '火山', '西瓜视频']" placeholder="请输入..." />
  </DemoBlock>

  <DemoBlock title="尺寸大小" desc="通过 size 控制标签输入框的大小尺寸，可选: small、default、large。">
    <TagInput size="small" placeholder="small" />
    <br /><br />
    <TagInput placeholder="default" />
    <br /><br />
    <TagInput size="large" placeholder="large" />
  </DemoBlock>

  <DemoBlock title="不同校验状态样式" desc="可以使用 validateStatus 设置不同校验状态的样式，可选值: default、warning、error。">
    <TagInput placeholder="default" />
    <br /><br />
    <TagInput placeholder="warning" validateStatus="warning" />
    <br /><br />
    <TagInput placeholder="error" validateStatus="error" />
  </DemoBlock>

  <DemoBlock title="前缀 / 后缀" desc="可以通过 prefix 传入输入框前缀，通过 suffix 传入输入框后缀，可以为文本或者节点（prop 或同名插槽）。">
    <TagInput>
      <template #prefix><IconVigoLogo /></template>
    </TagInput>
    <br /><br />
    <TagInput prefix="Prefix" />
    <br /><br />
    <TagInput>
      <template #suffix><IconGift /></template>
    </TagInput>
    <br /><br />
    <TagInput suffix="Suffix" />
  </DemoBlock>

  <DemoBlock title="失焦后自动创建标签" desc="可使用 addOnBlur，设置是否在 blur 事件触发时，将当前 input 的值自动创建成 tag。">
    <TagInput :defaultValue="['抖音', '火山', '西瓜视频']" :addOnBlur="true" placeholder="请输入..." @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="过滤重复标签" desc="可使用 allowDuplicates，设置是否允许创建相同 tag，默认为 true。">
    <TagInput :defaultValue="['抖音', '火山', '西瓜视频']" :allowDuplicates="false" placeholder="请输入..." @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="输入限制" desc="可使用 max 限制输入的标签数量，超出后触发 onExceed；可使用 maxLength 限制单个标签的最大长度，超出后触发 onInputExceed。">
    <TagInput :max="3" placeholder="最多输入3条标签.." @change="(v) => log(v)" @exceed="onExceed" />
    <TagInput :maxLength="5" placeholder="单个标签长度不超过5..." style="margin-top: 12px" @change="(v) => log(v)" @inputExceed="onInputExceed" />
  </DemoBlock>

  <DemoBlock title="限制标签展示数量" desc="利用 maxTagCount 可以限制展示的标签数量，超出部分将以 +N 的方式展示。使用 showRestTagsPopover / restTagsPopoverProps 配置 hover +N 时的 Popover。">
    <TagInput :maxTagCount="2" :showRestTagsPopover="true" :restTagsPopoverProps="{ position: 'top' }" :defaultValue="['抖音', '火山', '西瓜视频']" @change="(v) => log(v)" />
  </DemoBlock>

  <DemoBlock title="标签受控" desc="可使用 value 设置标签内容，并配合 onChange 实现标签内容受控。">
    <TagInput :value="controlledValue" @change="handleChange" />
    <div style="margin-top: 8px; color: var(--semi-color-text-2)">当前值：{{ JSON.stringify(controlledValue) }}</div>
  </DemoBlock>

  <DemoBlock title="输入受控" desc="可使用 inputValue 设置输入框内容，并配合 onInputChange 实现输入内容受控。">
    <TagInput :inputValue="controlledInput" @inputChange="handleInputChange" />
    <div style="margin-top: 8px; color: var(--semi-color-text-2)">当前输入：{{ controlledInput }}</div>
  </DemoBlock>

  <DemoBlock title="回调" desc="onFocus / onBlur / onChange / onAdd / onRemove / onInputChange 回调，打开控制台查看输出。">
    <TagInput
      :defaultValue="['抖音']"
      placeholder="请输入..."
      showClear
      @focus="() => log('onFocus')"
      @blur="() => log('onBlur')"
      @change="(tag) => log(`onChange,当前标签数组：${tag}`)"
      @add="(tag) => log(`onAdd，新增：${tag}`)"
      @remove="(v, i) => log(`onRemove，移除：${v}, 序号：${i}`)"
      @inputChange="(input) => log(`onInputChange，当前输入内容：${input}`)"
    />
  </DemoBlock>

  <DemoBlock title="焦点管理" desc="可以使用 blur() 和 focus() 方法对焦点进行管理。">
    <TagInput ref="tagInputRef" :defaultValue="['抖音', '火山']" />
    <Button style="margin-top: 10px" @click="handleTagInputFocus">点击按钮聚焦</Button>
  </DemoBlock>

  <DemoBlock title="自定义标签渲染" desc="可以使用 renderTagItem(value, index, onClose) 自定义标签渲染。">
    <TagInput :value="customValue" :renderTagItem="renderTagItem" @change="handleCustomChange" />
  </DemoBlock>

  <DemoBlock title="拖拽排序" desc="将 draggable 设为 true 开启拖拽排序；拖拽排序下不允许添加相同 Tag，需将 allowDuplicates 设为 false。点击 TagInput 后 Tag 可拖拽，点击外部区域后不可拖拽。">
    <TagInput draggable :allowDuplicates="false" :defaultValue="['抖音', '火山', '西瓜视频']" placeholder="请输入..." @change="(v) => log(v)" />
  </DemoBlock>
</template>
