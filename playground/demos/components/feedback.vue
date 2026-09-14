<script setup lang="ts">
import { h, ref } from 'vue';
import { Feedback, Button, TextArea, Empty, IconTickCircle } from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { Feedback } from 'semi-design-vue';`;

const visibleEmoji = ref(false);
const visibleText = ref(false);
const visibleRadio = ref(false);
const visibleCheckbox = ref(false);
const visibleCustom = ref(false);
const customValue = ref('');
const visibleModal = ref(false);

const visibleThanks1 = ref(false);
const value1 = ref('');
const showThanks1 = ref(false);
const visibleThanks2 = ref(false);
const value2 = ref('');
const showThanks2 = ref(false);

const logEmoji = (value: any) => {
  console.log('emoji value', value);
};

const thanksImage = () =>
  h(IconTickCircle, {
    size: 'extra-large',
    style: { fontSize: '80px', color: 'var(--semi-color-success)' },
  });

const renderCustom = () => [
  h('span', '这是一段自定义的内容'),
  h(TextArea, {
    onChange: (v: string) => {
      customValue.value = v;
    },
  }),
];

const renderThanksContent = (showThanks: boolean, setValue: (v: string) => void) => {
  if (showThanks) {
    return h(Empty, {
      image: thanksImage,
      description: '感谢您的反馈',
      style: { padding: '30px' },
    });
  }
  return [
    h('span', '这是一段自定义的内容'),
    h(TextArea, { onChange: (v: string) => setValue(v) }),
  ];
};

const renderThanks1 = () => renderThanksContent(showThanks1.value, (v) => { value1.value = v; });
const renderThanks2 = () => renderThanksContent(showThanks2.value, (v) => { value2.value = v; });

const handleOk1 = () => {
  showThanks1.value = true;
  setTimeout(() => {
    visibleThanks1.value = false;
    setTimeout(() => {
      showThanks1.value = false;
    }, 200);
  }, 1500);
};

const handleOk2 = () => {
  showThanks2.value = true;
  setTimeout(() => {
    visibleThanks2.value = false;
    setTimeout(() => {
      showThanks2.value = false;
    }, 200);
  }, 1500);
};
</script>

<template>
  <DemoBlock title="如何引入" desc="Feedback 自 2.85.0 支持。" :code="importCode" />

  <DemoBlock title="基本使用" desc="通过 visible 设置是否显示。默认反馈展示内容是 emoji 形式。可通过 valueChange 获取当前选择的内容。">
    <Button @click="visibleEmoji = !visibleEmoji">展示反馈: Popup, emoji</Button>
    <Feedback
      title="您对本产品的评分是？"
      :visible="visibleEmoji"
      @ok="visibleEmoji = false"
      @cancel="visibleEmoji = false"
      @valueChange="logEmoji"
    />
  </DemoBlock>

  <DemoBlock title="文字类型" desc="设置 type 为 text 可获得多行输入框形式的 feedback，可通过 textAreaProps 设置多行输入框的参数。">
    <Button @click="visibleText = !visibleText">展示反馈: Popup, text</Button>
    <Feedback
      type="text"
      :textAreaProps="{ maxCount: 200 }"
      title="您对本产品的建议是？"
      :visible="visibleText"
      @ok="visibleText = false"
      @cancel="visibleText = false"
    />
  </DemoBlock>

  <DemoBlock title="单选反馈" desc="设置 type 为 radio，可通过 radioGroupProps 设置单选的参数。">
    <Button @click="visibleRadio = !visibleRadio">展示反馈: Popup, radio</Button>
    <Feedback
      type="radio"
      :radioGroupProps="{ options: ['访客', '开发者', '维护者'] }"
      title="您的身份是"
      :visible="visibleRadio"
      @ok="visibleRadio = false"
      @cancel="visibleRadio = false"
    />
  </DemoBlock>

  <DemoBlock title="多选反馈" desc="设置 type 为 checkbox，可通过 checkboxGroupProps 设置多选的参数。">
    <Button @click="visibleCheckbox = !visibleCheckbox">展示反馈: Popup, checkbox</Button>
    <Feedback
      type="checkbox"
      :checkboxGroupProps="{ options: ['抖音', '火山', '豆包'] }"
      title="您最常使用以下哪些产品？"
      :visible="visibleCheckbox"
      @ok="visibleCheckbox = false"
      @cancel="visibleCheckbox = false"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义反馈内容"
    desc="设置 type 为 custom，通过 renderContent 设置反馈内容。自定义时需自行控制提交按钮禁用，可通过 okButtonProps 设置。"
  >
    <Button @click="visibleCustom = !visibleCustom">展示反馈: Popup, custom</Button>
    <Feedback
      type="custom"
      :okButtonProps="{ disabled: !customValue }"
      title="您对本产品的建议是？"
      :visible="visibleCustom"
      :renderContent="renderCustom"
      @ok="visibleCustom = false"
      @cancel="visibleCustom = false"
    />
  </DemoBlock>

  <DemoBlock title="模态对话框形式" desc="通过 mode 设置反馈形式，默认 popup，设置为 modal 可获得模态对话框。">
    <Button @click="visibleModal = !visibleModal">展示反馈: Modal, emoji</Button>
    <Feedback
      mode="modal"
      title="Why did you choose this rating?"
      :visible="visibleModal"
      @ok="visibleModal = false"
      @cancel="visibleModal = false"
      @valueChange="logEmoji"
    />
  </DemoBlock>

  <DemoBlock
    title="反馈完成提示"
    desc="反馈完成后可以切换展示信息提示用户本次反馈已经完成。Vue 端口未内置 @douyinfe/semi-illustrations，完成态使用 Empty + IconTickCircle。"
  >
    <Button @click="visibleThanks1 = !visibleThanks1">Open Feedback: Popup, Custom</Button>
    <Feedback
      :visible="visibleThanks1"
      type="custom"
      :okButtonProps="{ disabled: !value1 }"
      :title="showThanks1 ? ' ' : 'What is your feedback on this product?'"
      :footer="showThanks1 ? null : undefined"
      :renderContent="renderThanks1"
      @ok="handleOk1"
      @cancel="visibleThanks1 = false"
    />
    <br />
    <br />
    <Button @click="visibleThanks2 = !visibleThanks2">Open Feedback: Modal, Custom</Button>
    <Feedback
      :visible="visibleThanks2"
      type="custom"
      mode="modal"
      :okButtonProps="{ disabled: !value2 }"
      :title="showThanks2 ? ' ' : 'What is your feedback on this product?'"
      :footer="showThanks2 ? null : undefined"
      :renderContent="renderThanks2"
      @ok="handleOk2"
      @cancel="visibleThanks2 = false"
    />
  </DemoBlock>
</template>
