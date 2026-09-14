<script setup lang="ts">
import { ref } from 'vue';
import {
  Input,
  TextArea,
  InputGroup,
  InputNumber,
  AutoComplete,
  DatePicker,
  Select,
  Option,
  Cascader,
  TreeSelect,
  Text,
  HotKeys,
  Form,
  Button,
  IconSearch,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Input, TextArea, InputGroup } from 'semi-design-vue';`;

// ---------- 受控组件 ----------
const controlledValue = ref('controlInput');
const onControlledChange = (val: string) => {
  console.log(val);
  controlledValue.value = val;
};

// ---------- 输入框组合 ----------
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
  { label: 'North America', value: 'North America', key: '1' },
];

// ---------- 行号 ----------
const lineNumberValue = 'Line 1\nLine 2\n这是一行较长的文本，用来演示软换行时的行号对齐效果。\nLine 4\nLine 5';

// ---------- Shift + Enter 换行 ----------
const shiftEnterText = ref('');
const handleShiftEnterKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // 阻止默认的换行行为
  }
};
const handleShiftEnterChange = (_value: string, event: Event) => {
  shiftEnterText.value = (event.target as HTMLTextAreaElement).value;
};

// ---------- 自定义计算字符串长度 ----------
// 官网使用 grapheme-splitter；此处用浏览器内置 Intl.Segmenter 按可见字符（grapheme）计数，回退到 code point 计数
const graphemeSegmenter =
  typeof Intl !== 'undefined' && (Intl as any).Segmenter ? new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' }) : null;
const lengthValue = ref<string | undefined>();
function getValueLength(str: unknown) {
  if (typeof str === 'string') {
    if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(str)).length;
    return Array.from(str).length;
  }
  return 0;
}
function getTextAreaStrLength(str: string) {
  const filteredStr = str.replace(/\s/g, '');
  return filteredStr.length;
}
const onLengthChange = (v: string) => {
  lengthValue.value = v;
};
const onLengthSubmit = (values: any) => console.log('submit', values);

// ---------- 输入法模式 ----------
const compositionInputValue = ref('');
const compositionTextAreaValue = ref('');
const inputLogs = ref<string[]>([]);
const textAreaLogs = ref<string[]>([]);
const handleCompositionInputChange = (value: string) => {
  compositionInputValue.value = value;
  inputLogs.value = [...inputLogs.value, value];
};
const handleCompositionTextAreaChange = (value: string) => {
  compositionTextAreaValue.value = value;
  textAreaLogs.value = [...textAreaLogs.value, value];
};
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock title="基本" desc="基本使用">
    <Input defaultValue="hi" />
  </DemoBlock>

  <DemoBlock title="三种大小" desc="默认定义了三种尺寸：大、默认、小">
    <Input placeholder="large" size="large" />
    <br /><br />
    <Input placeholder="default" />
    <br /><br />
    <Input placeholder="small" size="small" />
  </DemoBlock>

  <DemoBlock title="不可用" desc="设定 disabled 属性为 true">
    <Input defaultValue="enabled input" />
    <br /><br />
    <Input disabled defaultValue="disabled input" />
  </DemoBlock>

  <DemoBlock title="只读" desc="readonly 不可编辑，仍可聚焦与复制。">
    <Input readonly defaultValue="readonly input" />
  </DemoBlock>

  <DemoBlock title="无边框" desc="borderless 去掉边框，适合嵌入其他容器。">
    <Input borderless placeholder="无边框" style="width: 280px" />
  </DemoBlock>

  <DemoBlock
    title="前缀/后缀"
    desc="在输入框上增加前缀、后缀图标。当 prefix、suffix 传入的内容为文本或者 Semi Icon 时，会自动带上左右间隔，若为自定义节点，则左右间隔为 0"
  >
    <Input :prefix="IconSearch" showClear />
    <br /><br />
    <Input prefix="Prefix" showClear />
    <br /><br />
    <Input :suffix="IconSearch" showClear />
    <br /><br />
    <Input showClear>
      <template #suffix>
        <Text strong type="secondary" style="margin-right: 8px">Suffix</Text>
      </template>
    </Input>
  </DemoBlock>

  <DemoBlock
    title="前置/后置标签"
    desc="在输入框上增加前置/后置标签。当 addonBefore、addonAfter 传入的内容为文本或者 Semi Icon 时，会自动带上左右间隔，若为自定义节点，则左右间隔为 0"
  >
    <Input addonBefore="http://" addonAfter=".com" />
  </DemoBlock>

  <DemoBlock title="带移除图标" desc="点击图标删除所有内容">
    <Input showClear defaultValue="click to clear" />
  </DemoBlock>

  <DemoBlock title="密码模式" desc="隐藏输入的具体内容">
    <Input mode="password" defaultValue="123456" />
  </DemoBlock>

  <DemoBlock title="校验状态" desc="可设置不同校验状态，展示不同样式">
    <Input defaultValue="ies" validateStatus="warning" />
    <br /><br />
    <Input defaultValue="ies" validateStatus="error" />
    <br /><br />
    <Input defaultValue="ies" />
  </DemoBlock>

  <DemoBlock title="受控组件" desc="Input 值完全取决于传入的 value 值，配合 onChange 回调函数使用（也可直接使用 v-model）">
    <Input :value="controlledValue" @change="onControlledChange" />
  </DemoBlock>

  <DemoBlock
    title="输入框组合"
    desc="可以将多个输入框放入 InputGroup 的容器中，通过设置 size、disabled 可统一设置组合中的输入框属性，支持输入框类型包括：Input、InputNumber、Select、AutoComplete、TreeSelect、Cascader、DatePicker"
  >
    <div>
      <InputGroup>
        <Input placeholder="Name" style="width: 100px" />
        <InputNumber placeholder="Score" style="width: 140px" />
      </InputGroup>
      <br /><br /><br />
      <InputGroup size="small">
        <Select style="width: 100px" defaultValue="home">
          <Option value="home">Home</Option>
          <Option value="work">Work</Option>
        </Select>
        <AutoComplete :data="['Beijing Haidian']" placeholder="Address: " style="width: 180px" />
      </InputGroup>
      <br /><br /><br />
      <InputGroup size="small">
        <Select style="width: 100px" defaultValue="signup">
          <Option value="signup">Sign Up</Option>
          <Option value="signin">Sign In</Option>
        </Select>
        <Input placeholder="Email" style="width: 180px" />
      </InputGroup>
      <br /><br /><br />
      <InputGroup size="small">
        <Input placeholder="Name" style="width: 100px" />
        <DatePicker placeholder="Birthday" />
      </InputGroup>
      <br /><br /><br />
      <InputGroup disabled>
        <Input placeholder="Name" style="width: 100px" />
        <InputNumber placeholder="Score" style="width: 140px" />
      </InputGroup>
    </div>
  </DemoBlock>

  <DemoBlock title="输入框组合 - 2" desc="InputGroup 与 TreeSelect、Cascader 组合">
    <InputGroup>
      <Select style="width: 100px" defaultValue="from">
        <Option value="from">From: </Option>
        <Option value="to">To: </Option>
      </Select>
      <TreeSelect style="width: 220px" :treeData="treeData" placeholder="Please select" />
    </InputGroup>
    <br /><br />
    <InputGroup>
      <Select style="width: 100px" defaultValue="from">
        <Option value="from">From: </Option>
        <Option value="to">To: </Option>
      </Select>
      <Cascader style="width: 220px" :treeData="treeData" placeholder="Please select" />
    </InputGroup>
  </DemoBlock>

  <DemoBlock title="多行输入框" desc="用于多行输入。通过设置 maxCount 属性可以进行字数限制并显示字数统计。支持 showClear。">
    <div>
      <TextArea />
      <br /><br />
      <TextArea :maxCount="100" showClear />
    </div>
  </DemoBlock>

  <DemoBlock title="设置 TextArea 高度" desc="通过 textareaStyle 可以设置内部 textarea 元素的样式，如高度、背景色等。">
    <div>
      <TextArea :textareaStyle="{ height: '120px' }" placeholder="高度 120px" />
      <br /><br />
      <TextArea :textareaStyle="{ height: '200px', backgroundColor: '#f9f9f9' }" placeholder="高度 200px，灰色背景" />
      <br /><br />
      <TextArea
        style="border: 2px solid var(--semi-color-primary)"
        :textareaStyle="{ height: '150px' }"
        placeholder="style 控制外层容器，textareaStyle 控制 textarea"
      />
    </div>
  </DemoBlock>

  <DemoBlock
    title="行号"
    desc="通过设置 showLineNumber 展示行号。可用 lineNumberStart 设置起始行号，或通过 lineNumberStyle/lineNumberClassName 自定义行号区样式。"
  >
    <TextArea
      showLineNumber
      :lineNumberStart="1"
      :defaultValue="lineNumberValue"
      :rows="12"
      style="width: 420px"
      :lineNumberStyle="{ color: 'var(--semi-color-text-2)' }"
    />
  </DemoBlock>

  <DemoBlock
    title="使用 Shift + Enter 换行的多行输入框"
    desc="TextArea 默认情况下 Enter 回车与 Shift + Enter 均可实现换行。通过适当的事件监听与禁用默认行为，你可以实现禁用 Enter 换行，仅 Shift + Enter 才能换行"
  >
    <p style="display: flex">
      使用
      <HotKeys :hotKeys="['shift', 'enter']" style="margin-bottom: 12px; margin-left: 4px; margin-right: 4px" />
      换行的 TextArea
    </p>
    <TextArea :value="shiftEnterText" @change="handleShiftEnterChange" @keydown="handleShiftEnterKeyDown" />
  </DemoBlock>

  <DemoBlock title="自动扩展的多行输入框" desc="通过设置 autosize 属性可设置只有高度自动随内容增加而变化。">
    <div>
      <TextArea autosize :rows="1" />
      <br /><br />
      <TextArea :autosize="{ minRows: 1, maxRows: 3 }" />
      <br /><br />
      <TextArea autosize :maxCount="100" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="自定义计算字符串长度"
    desc="通过设置 getValueLength 属性可以自定义计算字符串长度。搭配 maxLength 和 minLength 可以支持 emoji 长度按照可见长度计算。（本示例用 Intl.Segmenter 代替官网的 grapheme-splitter）"
  >
    <div>
      <h4>maxLength=10</h4>
      <div>
        <Text>尝试输入以下字符</Text>
        <div><Text copyable>💖</Text></div>
        <div><Text copyable>👨‍👩‍👧‍👦</Text></div>
      </div>
      <Input :maxLength="10" :getValueLength="getValueLength" @change="onLengthChange" style="width: 200px; margin-top: 12px; margin-bottom: 12px" />
      <div v-if="lengthValue">
        <div><Text type="tertiary">{{ `getValueLength=${getValueLength(lengthValue)}` }}</Text></div>
        <div><Text type="tertiary">{{ `length=${lengthValue.length}` }}</Text></div>
      </div>
      <br /><br />
      <h4>Form.Input + minLength=4</h4>
      <Form layout="horizontal" @submit="onLengthSubmit">
        <Form.Input noLabel field="username" :minLength="4" :getValueLength="getValueLength" style="width: 200px" />
        <Button type="primary" htmlType="submit">提交</Button>
      </Form>
      <h4>maxCount=10</h4>
      <TextArea defaultValue="semi design" :rows="2" :maxCount="10" :getValueLength="getTextAreaStrLength" style="width: 200px" />
    </div>
  </DemoBlock>

  <DemoBlock
    title="输入法模式"
    desc="通过设置 composition 属性为 true，可以开启输入法模式。在该模式下，使用输入法（如中文拼音）输入时，onChange 不会在输入法未确认时触发，而是在输入法确认后触发一次。Input 和 TextArea 均支持该属性。"
  >
    <div>
      <h4>Input with composition</h4>
      <Input
        composition
        :value="compositionInputValue"
        @change="handleCompositionInputChange"
        placeholder="开启 composition，拼音输入时不会触发 onChange"
        style="width: 300px"
      />
      <div style="margin-top: 8px; color: var(--semi-color-text-2); font-size: 12px">onChange 触发次数: {{ inputLogs.length }}</div>
      <br /><br />
      <h4>TextArea with composition</h4>
      <TextArea
        composition
        :value="compositionTextAreaValue"
        @change="handleCompositionTextAreaChange"
        placeholder="开启 composition，拼音输入时不会触发 onChange"
        style="width: 300px"
      />
      <div style="margin-top: 8px; color: var(--semi-color-text-2); font-size: 12px">onChange 触发次数: {{ textAreaLogs.length }}</div>
    </div>
  </DemoBlock>
</template>
