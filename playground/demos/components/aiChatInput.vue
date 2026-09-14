<script setup lang="ts">
import { h, ref } from 'vue';
import {
  AIChatInput,
  Configure,
  Button,
  Divider,
  Radio,
  RadioGroup,
  Tooltip,
  IconBookOpenStroked,
  IconFeishuLogo,
  IconGit,
  IconFigma,
  IconDeleteStroked,
  IconUpload,
  IconTemplateStroked,
  IconSearch,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = `import { AIChatInput, Configure } from 'semi-design-vue';
// Configure 也可通过 AIChatInput.Configure 访问`;

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

const onContentChange = (content: any) => console.log('onContentChange', content);
const onUploadChange = (fileList: any) => console.log('onUploadChange', fileList);

const generating = ref(false);
const sendPayload = ref('');
const onMessageSend = (payload: any) => {
  sendPayload.value = JSON.stringify(payload?.inputContents?.map((c: any) => c.text).filter(Boolean) || []);
  generating.value = true;
};
const onStopGenerate = () => {
  generating.value = false;
};

const richRef = ref<any>(null);
const richIndex = ref(0);
const richTemps: Record<string, string> = {
  'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
  'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
  'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
};
const richKeys = Object.keys(richTemps);
const setRichTemplate = (index: number) => {
  richIndex.value = index;
  const content = Object.values(richTemps)[index];
  richRef.value?.setContent?.(content);
  richRef.value?.focusEditor?.();
};

const references = ref<any[]>([
  { id: '1', type: 'text', content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字' },
  { id: '2', name: '飞书文档.docx' },
  { id: '3', name: '飞书文档.pdf' },
  { id: '5', name: 'Image.jpeg', url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/Resso.png' },
]);
const handleReferenceDelete = (item: any) => {
  references.value = references.value.filter((r) => r.id !== item.id);
};

const modelOptions = [
  { value: 'GPT-5', label: 'GPT-5' },
  { value: 'GPT-4o', label: 'GPT-4o' },
  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
];
const mcpOptions = [
  { icon: () => h(IconFeishuLogo), label: '飞书文档', value: 'feishu' },
  { icon: () => h(IconGit), label: 'Github Mcp', value: 'github' },
  { icon: () => h(IconFigma), label: 'Figma Mcp', value: 'figma' },
];
const radioButtonProps = [
  { label: '极速', value: 'fast' },
  { label: '思考', value: 'think' },
  { label: '超能', value: 'super' },
];
const renderConfigureArea = () =>
  h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [
    h(Configure.Select, { optionList: modelOptions, field: 'model', initValue: 'GPT-4o' }),
    h(Configure.Button, { icon: IconBookOpenStroked, field: 'onlineSearch' }, () => '联网搜索'),
    h(Configure.Mcp, { options: mcpOptions, showConfigure: true }),
    h(Configure.RadioButton, { options: radioButtonProps, field: 'thinkType', initValue: 'fast' }),
  ]);
const onConfigureChange = (value: any, changed: any) => console.log('onConfigureChange', value, changed);

const renderActionArea = (props: { menuItem: any[]; className: string }) =>
  h('div', { class: props.className }, [
    h('div', { style: { display: 'flex', alignItems: 'center' }, key: 'delete' }, [
      h(Button, { type: 'tertiary', style: { borderRadius: '50%' }, icon: IconDeleteStroked }),
      h(Divider, { layout: 'vertical', style: { marginLeft: '8px' } }),
    ]),
    props.menuItem,
  ]);

const renderUploadButton = ({ openFileDialog, disabled }: any) =>
  h(
    'button',
    {
      type: 'button',
      disabled,
      class: 'semi-button semi-button-borderless',
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        openFileDialog();
      },
    },
    [h(IconUpload)]
  );

const round = ref(true);

const suggestionTemplate = ['天气如何', '空气质量', '工作进程', '日程安排'];
const suggestions = ref<string[]>([]);
const onSuggestContentChange = (content: any[]) => {
  const value = content?.[0]?.text;
  if (value === undefined || String(value).includes('\n') || !value.length) {
    suggestions.value = [];
    return;
  }
  if (value.length > 0 && value.length < 4) {
    suggestions.value = suggestionTemplate.map((s) => `${value}，${s}`);
  } else {
    suggestions.value = [];
  }
};

const skills = [
  { icon: () => h(IconTemplateStroked), value: 'writing', label: '帮我写作', hasTemplate: true },
  { icon: () => h(IconSearch), value: 'AI 编程', label: 'AI coding' },
];
const skillRef = ref<any>(null);
const renderTemplate = (skill: any, onTemplateClick: (content: string) => void) => {
  if (skill?.value !== 'writing') return null;
  return h('div', { style: { padding: '12px', minWidth: '240px' } }, [
    h('div', { style: { fontWeight: 600, marginBottom: '8px' } }, '工作模版'),
    h(
      Button,
      {
        theme: 'light',
        onClick: () =>
          onTemplateClick('我的职业是<input-slot placeholder="[请输入职业]"></input-slot>，帮我写一份总结汇报'),
      },
      () => '总结汇报'
    ),
  ]);
};

const renderTopSlot = ({ references: refs }: any) =>
  h('div', { style: { padding: '8px 12px', color: 'var(--semi-color-text-2)', fontSize: '12px' } }, [
    `自定义顶部：${refs?.length ?? 0} 条引用`,
  ]);
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="支持文本输入与文件上传。uploadProps 见 Upload；onUploadChange 获取文件变化；placeholder / defaultContent / onContentChange 控制输入。"
  >
    <AIChatInput
      placeholder="输入内容或者上传内容..."
      :uploadProps="uploadProps"
      :onContentChange="onContentChange"
      :onUploadChange="onUploadChange"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="消息发送"
    desc="有内容时可发送，触发 onMessageSend。generating=true 时发送按钮变为停止，点击触发 onStopGenerate。引用需自行清除。"
  >
    <AIChatInput
      placeholder="输入后点击发送，将进入 generating"
      :uploadProps="uploadProps"
      :generating="generating"
      :onMessageSend="onMessageSend"
      :onStopGenerate="onStopGenerate"
      :style="outerStyle"
    />
    <p v-if="sendPayload" style="color: var(--semi-color-text-2); font-size: 12px">payload: {{ sendPayload }}</p>
  </DemoBlock>

  <DemoBlock
    title="富文本输入区"
    desc="内置 input-slot / select-slot / skill-slot。可通过 setContent、focusEditor 设置内容与焦点。"
  >
    <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap">
      <Button
        v-for="(k, i) in richKeys"
        :key="k"
        size="small"
        :theme="richIndex === i ? 'solid' : 'light'"
        @click="setRichTemplate(i)"
      >
        {{ k }}
      </Button>
    </div>
    <AIChatInput
      ref="richRef"
      :defaultContent="richTemps['input-slot']"
      placeholder="输入内容或者上传内容"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock title="引用" desc="references 展示在输入框顶部。onReferenceDelete / onReferenceClick 处理删除与点击。">
    <AIChatInput
      placeholder="用于查看引用内容的用例"
      :references="references"
      :onReferenceDelete="handleReferenceDelete"
      :onReferenceClick="(item: any) => console.log('点击了引用', item)"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="配置区域"
    desc="renderConfigureArea 自定义左下配置。Configure.Select / Button / Mcp / RadioButton 需配置 field，initValue 设初值。变化走 onConfigureChange。"
  >
    <AIChatInput
      placeholder="用于查看左下方配置项的用例"
      :renderConfigureArea="renderConfigureArea"
      :onConfigureChange="onConfigureChange"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock title="操作区域" desc="renderActionArea 自定义右下操作区，参数含 menuItem（默认操作）与 className。">
    <AIChatInput
      placeholder="输入内容或者上传内容..."
      :renderActionArea="renderActionArea"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock title="自定义上传按钮" desc="renderUploadButton 只改按钮 UI，上传/粘贴逻辑仍由内部 Upload 托管。">
    <AIChatInput
      placeholder="自定义上传按钮（仍支持粘贴上传）"
      :uploadProps="uploadProps"
      :renderUploadButton="renderUploadButton"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock title="底部按钮形状" desc="round 默认 true 为圆角按钮，false 为方形。">
    <RadioGroup :value="round" name="ai-round" @change="(e: any) => (round = e.target.value)">
      <Radio :value="true">圆形</Radio>
      <Radio :value="false">方形</Radio>
    </RadioGroup>
    <AIChatInput
      placeholder="下方按钮形状用例"
      :round="round"
      :renderConfigureArea="renderConfigureArea"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="建议"
    desc="suggestions 类似 AutoComplete。输入长度 1–3 时展示建议，Esc 或点击外部关闭。可用 renderSuggestionItem 自定义。"
  >
    <AIChatInput
      placeholder="输入内容，长度小于 4 个字符可以看到建议"
      :suggestions="suggestions"
      :onContentChange="onSuggestContentChange"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="技能及模版"
    desc="skills + skillHotKey（默认 /）唤起技能。hasTemplate 的技能会显示模版按钮，用 renderTemplate 自定义模版面板。"
  >
    <AIChatInput
      ref="skillRef"
      placeholder="输入 / 唤起技能，选择后可点模版按钮"
      :skills="skills"
      skillHotKey="/"
      :renderTemplate="renderTemplate"
      :showTemplateButton="true"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染顶部区域"
    desc="renderTopSlot 自定义顶部。可配合 showReference / showUploadFile 与 topSlotPosition（top / middle / bottom）。"
  >
    <AIChatInput
      placeholder="自定义渲染顶部内容"
      :references="references"
      :showReference="false"
      :renderTopSlot="renderTopSlot"
      :uploadProps="uploadProps"
      :style="outerStyle"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义扩展"
    desc="通过 extensions 添加 TipTap 自定义扩展，并在 transformer 中写转换规则。扩展需设置 isCustomSlot；若占用 Enter，需设置 editor.storage.AIChatInput.allowHotKeySend。Vue 使用 @tiptap/vue-3。完整 Mention 示例见官网。"
  />
</template>
