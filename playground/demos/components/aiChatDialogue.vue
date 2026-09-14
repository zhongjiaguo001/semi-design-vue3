<script setup lang="ts">
import { h, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  AIChatDialogue,
  RadioGroup,
  Radio,
  Avatar,
  MarkdownRender,
  Toast,
  IconSearchStroked,
  IconCodeStroked,
  IconBriefStroked,
  IconArrowRight,
  chatCompletionToMessage,
  streamingChatCompletionToMessage,
  responseToMessage,
  streamingResponseToMessage,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

const importCode = "import { AIChatDialogue } from 'semi-design-vue'";

const roleConfig = {
  user: {
    name: 'User',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png',
  },
  assistant: {
    name: 'Assistant',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
  },
  system: {
    name: 'System',
    avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
  },
};

const fence = '`'.repeat(3);
const codeAnswer =
  '以下是一个 Semi 代码的使用示例：\n' +
  fence +
  "jsx \nimport React from 'react';\nimport { Button } from '@douyinfe/semi-ui';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n" +
  fence +
  '\n';

const basicDefaultMessages = () => [
  { role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." },
  { role: 'user', id: '2', createAt: 1715676751919, content: '给一个 Semi Design 的 Button 组件的使用示例' },
  { role: 'assistant', id: '3', createAt: 1715676751919, content: codeAnswer },
];

// ---------- 基本用法 ----------
const basicMessages = ref<any[]>(basicDefaultMessages());
const basicMode = ref<'bubble' | 'noBubble' | 'userBubble'>('bubble');
const basicAlign = ref<'leftRight' | 'leftAlign'>('leftRight');
const onBasicChatsChange = (chats?: any[]) => {
  basicMessages.value = chats || [];
};

// ---------- 消息状态 ----------
const statusMessages = ref<any[]>([
  { role: 'assistant', id: '1', createAt: 1715676751919, content: '请求成功' },
  { id: 'loading', role: 'assistant', status: 'in_progress' },
  { role: 'assistant', id: 'error', content: '请求错误', status: 'failed' },
]);
const onStatusChatsChange = (chats?: any[]) => {
  statusMessages.value = chats || [];
};

// ---------- 消息展示 ----------
const allTypeMessages = ref<any[]>([
  { role: 'assistant', id: '1', createAt: 1715676751919, content: '普通文本' },
  {
    id: '2',
    role: 'user',
    content: [
      {
        type: 'message',
        content: [
          { type: 'input_text', text: '帮我生成类似的图片' },
          {
            type: 'input_image',
            image_url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/edit-bag.jpeg',
            file_id: 'demo-file-id',
          },
          { type: 'input_text', text: '以下是文件展示' },
          { type: 'input_file', file_url: 'https://www.semi.pdf', filename: 'semi.pdf', size: '100KB' },
          { type: 'input_file', file_url: 'https://www.semi.json', filename: 'semi.json', size: '100KB' },
          { type: 'input_file', file_url: 'https://www.semi.docx', filename: 'semi.docx', size: '100KB' },
        ],
      },
    ],
    status: 'completed',
  },
  {
    id: '3',
    role: 'assistant',
    content: [
      {
        type: 'reasoning',
        status: 'completed',
        summary: [{ type: 'summary_text', text: '\n我需要思考并回答用户关于什么是 Semi 组件库的问题...' }],
      },
      {
        type: 'message',
        content: [{ type: 'output_text', text: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。' }],
        status: 'completed',
      },
      {
        id: 'fc_12345xyz',
        call_id: 'call_12345xyz',
        type: 'function_call',
        name: 'get_weather',
        status: 'completed',
        arguments: "{'location':'Paris, France'}",
      },
      {
        type: 'message',
        content: [
          {
            type: 'output_text',
            text: '恭喜你，你已经掌握了 semi design 的所有知识！',
            annotations: [
              {
                title: 'semi.design',
                url: 'https://semi.design/',
                detail: 'semi design page',
                logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
              },
              {
                title: 'semi.design',
                url: 'https://semi.design/',
                detail: 'semi design page',
                logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
              },
            ],
          },
        ],
      },
      {
        type: 'plan',
        content: [
          {
            summary: '创建一份全面的北京旅游攻略，包含景点、住宿、交通、美食和实用旅行建议',
            steps: [
              { summary: '搜索北京旅游景点介绍及门票信息', description: '正在搜索: 北京旅游景点介绍及门票信息', type: 'search' },
              { summary: '读取指定文件的指定行内容', description: '正在创建文档:  北京旅游攻略', type: 'docs' },
              { summary: '创建包含北京旅游攻略的文件', description: '正在创建代码文件: beijing_travel_guide.html', type: 'code' },
            ],
            statues: 'completed',
          },
          { summary: '总结北京旅游攻略的创建成果并呈现给用户', steps: [] },
        ],
      },
    ],
    status: 'completed',
  },
]);
const onAllTypeChatsChange = (chats?: any[]) => {
  allTypeMessages.value = chats || [];
};
const mapStep = (steps?: any[]) => {
  if (!steps) return [];
  return steps.map((item) => {
    let icon: any = null;
    switch (item.type) {
      case 'search':
        icon = h(IconSearchStroked);
        break;
      case 'docs':
        icon = h(IconBriefStroked);
        break;
      case 'code':
        icon = h(IconCodeStroked);
        break;
    }
    return { summary: item.summary, description: item.description, icon };
  });
};
const allTypeCustomRender = {
  // plan 为用户自定义类型
  plan: (item: any) => {
    const steps = item.content.map((c: any) => ({ summary: c.summary, actions: mapStep(c.steps), status: 'completed' }));
    return h((AIChatDialogue as any).Step, { steps });
  },
};

// ---------- 引用 ----------
const referenceMessages = ref<any[]>([
  {
    id: '1',
    role: 'user',
    content: '当前消息为引用 demo 的示例',
    references: [
      {
        id: '1',
        type: 'text',
        content:
          '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
      },
      { id: '2', name: '飞书文档.docx' },
      { id: '3', name: 'Music.mp4' },
      {
        id: '4',
        name: 'Image.jpeg',
        url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/Resso.png',
      },
      { id: '5', name: 'code.json' },
    ],
  },
]);
const onReferenceChatsChange = (chats?: any[]) => {
  referenceMessages.value = chats || [];
};
const onReferenceClick = (item?: any) => {
  console.log('You click the reference button!', item);
};

// ---------- 选择 ----------
const selectingRef = ref<any>(null);
const selectingMessages = ref<any[]>(basicDefaultMessages());
const selectingAlign = ref<'leftRight' | 'leftAlign'>('leftRight');
const selectingEnabled = ref(true);
const selection = ref<'allSelect' | 'cancelSelect'>('allSelect');
onMounted(() => {
  selectingRef.value?.selectAll();
});
const onSelectionChange = (e: any) => {
  const value = e.target.value;
  if (value === 'allSelect') selectingRef.value?.selectAll();
  else selectingRef.value?.deselectAll();
  selection.value = value;
};
const onSelect = (selectionId: string[]) => {
  console.log('onSelect', selectionId);
};

// ---------- 提示 ----------
const hintDefaultMessages = () => [
  {
    role: 'assistant',
    id: '1',
    createAt: 1715676751919,
    content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
  },
];
const hintsExample = ['Semi 组件库有哪些常用组件？', '能否展示一个使用 Semi 组件库构建的页面示例？', 'Semi 组件库有官方文档吗？'];
const hintMessages = ref<any[]>(hintDefaultMessages());
const hints = ref<string[]>([...hintsExample]);
const onHintChatsChange = (chats?: any[]) => {
  console.log('onChatsChange', chats);
  hintMessages.value = chats || [];
};
const onHintClick = (hint: string) => {
  console.log('onHintClick', hint);
  hints.value = [];
};

// ---------- 自定义渲染提示 ----------
const customHintMessages = ref<any[]>(hintDefaultMessages());
const customHints = ref<string[]>([...hintsExample]);
const onCustomHintChatsChange = (chats?: any[]) => {
  customHintMessages.value = chats || [];
};
const onCustomHintClick = () => {
  customHints.value = [];
};
const commonHintStyle = {
  border: '1px solid var(--semi-color-border)',
  padding: '10px',
  borderRadius: '10px',
  color: 'var( --semi-color-text-1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: '14px',
};
const renderHintBox = (p: { content: string; index: number; onHintClick: () => void }) =>
  h('div', { style: commonHintStyle, onClick: p.onHintClick, key: p.index }, [p.content, h(IconArrowRight, { style: { marginLeft: '10px' } })]);

// ---------- 自定义渲染会话框 ----------
const renderConfigMessages = ref<any[]>(basicDefaultMessages());
const onRenderConfigChatsChange = (chats?: any[]) => {
  renderConfigMessages.value = chats || [];
};
const renderConfig = {
  renderDialogueTitle: (p: any) => h('div', { class: 'semi-ai-chat-dialogue-title' }, `My-${p.role.name}`),
  renderDialogueAvatar: (p: any) => h(Avatar, { src: p.role.avatar, size: 'extra-small', shape: 'square' }),
  renderDialogueAction: (p: any) => h('div', { class: p.className }, [p.defaultActions[0]]),
};

// ---------- 自定义渲染消息内容 ----------
const customRenderMessages = ref<any[]>([
  { id: '1', role: 'user', content: '你好' },
  { id: '2', role: 'assistant', content: '你好呀，请问有什么可以帮助你的吗~', status: 'completed' },
  {
    id: '3',
    role: 'user',
    content: [
      {
        type: 'message',
        role: 'user',
        content: [
          { type: 'input_text', text: '帮我生成类似的图片' },
          {
            type: 'input_image',
            image_url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/edit-bag.jpeg',
            file_id: 'demo-file-id',
          },
          {
            type: 'input_image',
            image_url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/edit-bag.jpeg',
            file_id: 'demo-file-id',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    role: 'assistant',
    content: [
      {
        type: 'reasoning',
        summary: [{ type: 'summary_text', text: '\n用户问需要我帮助他生成类似图片，我需要先分析图片内容，然后生成类似的图片...' }],
        annotations: [
          {
            title: 'semi.design',
            url: 'https://semi.design/',
            detail: 'semi design page',
            logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
          },
          {
            title: 'semi.design',
            url: 'https://semi.design/',
            detail: 'semi design page',
            logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
          },
        ],
        status: 'completed',
      },
      { type: 'function_call', name: 'create_travel_guide', arguments: '{\n"city": "北京"\n}', status: 'completed' },
    ],
    status: 'completed',
  },
]);
const onCustomRenderChatsChange = (chats?: any[]) => {
  customRenderMessages.value = chats || [];
};
const userTextStyle = {
  backgroundColor: 'var(--semi-color-fill-1)',
  color: 'var(--semi-color-text-0)',
  borderRadius: '25px',
  padding: '6px 16px',
};
const assistantStyle = { color: 'var(--semi-color-text-0)', padding: '6px 16px' };
const functionCallStyle = { backgroundColor: 'var(--semi-color-fill-1)', padding: '6px 16px', borderRadius: '25px' };
const customRenderReasoningContent = (p: any) =>
  h('div', null, [
    h((AIChatDialogue as any).Annotation, {
      annotation: p.annotations,
      description: '参考资料',
      maxCount: 3,
      onClick: (e?: MouseEvent) => {
        e && e.stopPropagation();
        Toast.success('Ready to open the sidebar!');
      },
    }),
    h('div', { style: { marginTop: '8px' } }, [h(MarkdownRender, { format: 'md', raw: p.summary[0].text, ...(p.markdownRenderProps || {}) })]),
  ]);
const customRender = {
  function_call: {
    create_travel_guide: (item: any) => h('div', { style: functionCallStyle }, `Function Tool Call: ${item.name} ${item.arguments}`),
  },
  input_text: (item: any, message: any) => {
    if (message.role === 'user') return h('div', { style: userTextStyle, class: 'userTextStyle' }, item.text);
    return h('div', { style: assistantStyle }, item.text);
  },
  reasoning: (item: any) => h((AIChatDialogue as any).Reasoning, { ...item, customRenderer: customRenderReasoningContent }),
  default: (item: any, message: any) => {
    if (message.role === 'user') return h('div', { style: userTextStyle, class: 'userTextStyle' }, item);
    return h('div', { style: assistantStyle }, item);
  },
};

// ---------- 消息数据转换 1: chatCompletionToMessage ----------
const CHAT_COMPLETION_DATA: any = {
  id: 'chatcmpl-B9MBs8CjcvOU2jLn4n570S5qMJKcT',
  object: 'chat.completion',
  created: 1741569952,
  model: 'gpt-4.1-2025-04-14',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'Hello! How can I assist you today?',
        refusal: null,
        annotations: [],
        tool_calls: [
          { id: 'call_abc123', type: 'function', function: { name: 'get_current_weather', arguments: '{\n"location": "Boston, MA"\n}' } },
        ],
      },
      logprobs: null,
      finish_reason: 'stop',
    },
  ],
};
const completionMessages = ref<any[]>([]);
const onCompletionChatsChange = (chats?: any[]) => {
  completionMessages.value = chats || [];
};
onMounted(() => {
  completionMessages.value = [...chatCompletionToMessage(CHAT_COMPLETION_DATA)];
});

// ---------- 消息数据转换 2: streamingChatCompletionToMessage ----------
const STREAMING_CHAT_COMPLETION_DATA: any[] = [
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { role: 'assistant', content: '', refusal: null }, finish_reason: null }], obfuscation: 'ahPqlzj6DD' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { content: '' }, finish_reason: null }], obfuscation: 'i2PXRIwvc3D' },
  // index 0: 输出文本增量
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { content: '我正在使用 ' }, finish_reason: null }], obfuscation: '3sslO5QylW' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { content: 'streamingChatCompletionToMessage' }, finish_reason: null }], obfuscation: '3sslO5QylW' },
  // index 1: 工具调用增量（function_call / tool_calls）
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011845, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 1, delta: { tool_calls: [{ id: 'call_1', function: { name: 'searchWeather', arguments: '{"city":"北京"' } }] }, finish_reason: null }], obfuscation: 'T1' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011846, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 1, delta: { tool_calls: [{ id: 'call_1', function: { name: null, arguments: ',"day":"today"}' } }] }, finish_reason: null }], obfuscation: 'T2' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011844, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { content: ' 转换 Chat Completion Chunks' }, finish_reason: null }], obfuscation: 'X1' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011844, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: { content: ' 🥳' }, finish_reason: null }], obfuscation: 'X2' },
  // 终止信号
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], obfuscation: 'n13SLf' },
  { id: 'chatcmpl-COjljxurV5GKrRUsg1wd7mIyQCiiT', object: 'chat.completion.chunk', created: 1760011843, model: 'o3-mini-2025-01-31', service_tier: 'default', system_fingerprint: 'fp_6c43dcef8c', choices: [{ index: 1, delta: {}, finish_reason: 'stop' }], obfuscation: 'jt9rDb' },
];
const streamingCompletionMessages = ref<any[]>([]);
const onStreamingCompletionChatsChange = (chats?: any[]) => {
  streamingCompletionMessages.value = chats || [];
};
let streamingCompletionTimer: any = null;
onMounted(() => {
  const total = STREAMING_CHAT_COMPLETION_DATA.length;
  let i = 1;
  let state: any = undefined;
  streamingCompletionTimer = setInterval(() => {
    if (i > total) {
      clearInterval(streamingCompletionTimer);
      return;
    }
    const slice = STREAMING_CHAT_COMPLETION_DATA.slice(0, i);
    const { messages: partialMessages, state: nextState } = streamingChatCompletionToMessage(slice, state) as any;
    state = nextState;
    streamingCompletionMessages.value = [partialMessages[0]];
    i += 1;
  }, 100);
});

// ---------- 消息数据转换 3: responseToMessage ----------
const RESPONSE_DATA: any = {
  id: 'resp_67ccd3a9da748190baa7f1570fe91ac604becb25c45c1d41',
  object: 'response',
  created_at: 1741476777,
  status: 'completed',
  error: null,
  incomplete_details: null,
  instructions: null,
  max_output_tokens: null,
  model: 'gpt-4o-2024-08-06',
  output: [
    {
      id: 'rs_6876cf02e0bc8192b74af0fb64b715ff06fa2fcced15a5ac',
      type: 'reasoning',
      status: 'completed',
      summary: [
        {
          type: 'summary_text',
          text: '**用户询问什么是 Semi Design** 用户问 “Semi Design”需整合多源信息。首先发现抖音的 Semi Design 是设计系统，支持多平台且含 Design Token 和代码转换工具。印度 Semi Design 专注半导体培训，但用户可能更关注抖音案例。其他结果涉及半定制设计，但关联性较低。需确认是否有其他解释，但当前信息已覆盖主要维度。虽然继续推理可能提高完备性，但现阶段已足够支撑答案，可以开始输出给用户。',
        },
      ],
    },
    {
      type: 'message',
      id: 'msg_67ccd3acc8d48190a77525dc6de64b4104becb25c45c1d41',
      status: 'completed',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统',
          annotations: [
            { title: 'Semi Design', url: 'https://semi.design/zh-CN/start/getting-started', detail: 'Semi Design 快速开始', logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png' },
            { title: 'Semi Design', url: 'https://semi.design/zh-CN/start/getting-started', detail: 'Semi Design 快速开始', logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png' },
            { title: 'Semi Design', url: 'https://semi.design/zh-CN/start/getting-started', detail: 'Semi Design 快速开始', logo: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/docs-icon.png' },
          ],
        },
      ],
    },
    { id: 'fc_12345xyz', call_id: 'call_12345xyz', type: 'function_call', name: 'get_semi_page', status: 'completed', arguments: '{"pageName":"AIChatDialogue"}' },
  ],
};
const responseMessages = ref<any[]>([]);
const onResponseChatsChange = (chats?: any[]) => {
  responseMessages.value = chats || [];
};
onMounted(() => {
  responseMessages.value = [responseToMessage(RESPONSE_DATA)];
});

// ---------- 消息数据转换 4: streamingResponseToMessage ----------
const FIXED_SHUFFLED_INDICES = [0, 1, 2, 3, 4, 6, 6, 7, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const baseResponse = (status: string, output: any[], extra: any = {}) => ({
  id: 'resp_reason_001',
  object: 'response',
  created_at: 1760091777,
  status,
  background: false,
  error: null,
  incomplete_details: null,
  instructions: null,
  max_output_tokens: null,
  max_tool_calls: null,
  model: 'o3-mini-2025-01-31',
  output,
  parallel_tool_calls: true,
  previous_response_id: null,
  prompt_cache_key: null,
  reasoning: { effort: 'medium', summary: null },
  safety_identifier: null,
  service_tier: 'auto',
  store: true,
  temperature: 1.0,
  text: { format: { type: 'text' }, verbosity: 'medium' },
  tool_choice: 'auto',
  tools: [],
  top_logprobs: 0,
  top_p: 1.0,
  truncation: 'disabled',
  usage: null,
  user: null,
  metadata: {},
  ...extra,
});
const REASONING_CHUNKS: any[] = [
  { type: 'response.created', sequence_number: 0, response: baseResponse('in_progress', []) },
  { type: 'response.in_progress', sequence_number: 1, response: baseResponse('in_progress', []) },
  // reasoning item（输出索引 0）
  { type: 'response.output_item.added', sequence_number: 2, output_index: 0, item: { id: 'rs_reason_001', type: 'reasoning', summary: [] } },
  { type: 'response.reasoning_summary_part.added', sequence_number: 3, output_index: 0, summary_index: 0, part: { type: 'reasoning', text: '' } },
  { type: 'response.reasoning_summary_text.delta', sequence_number: 4, output_index: 0, summary_index: 0, delta: '思' },
  { type: 'response.reasoning_summary_text.delta', sequence_number: 5, output_index: 0, summary_index: 0, delta: '考' },
  { type: 'response.reasoning_summary_text.delta', sequence_number: 6, output_index: 0, summary_index: 0, delta: '完' },
  { type: 'response.reasoning_summary_text.delta', sequence_number: 7, output_index: 0, summary_index: 0, delta: '成' },
  { type: 'response.reasoning_summary_text.delta', sequence_number: 8, output_index: 0, summary_index: 0, delta: '！' },
  { type: 'response.reasoning_summary_text.done', sequence_number: 9, output_index: 0, summary_index: 0, text: '思考完成！' },
  { type: 'response.output_item.done', sequence_number: 10, output_index: 0, item: { id: 'rs_reason_001', type: 'reasoning', summary: [{ type: 'reasoning', text: '思考完成！' }] } },
  // assistant message（输出索引 1）
  { type: 'response.output_item.added', sequence_number: 11, output_index: 1, item: { id: 'msg_reason_001', type: 'message', status: 'in_progress', content: [], role: 'assistant' } },
  { type: 'response.content_part.added', sequence_number: 12, item_id: 'msg_reason_001', output_index: 1, content_index: 0, part: { type: 'output_text', annotations: [], text: '' } },
  { type: 'response.output_text.delta', sequence_number: 13, item_id: 'msg_reason_001', output_index: 1, content_index: 0, delta: '基于上述思考，' },
  { type: 'response.output_text.delta', sequence_number: 14, item_id: 'msg_reason_001', output_index: 1, content_index: 0, delta: '结论如下：' },
  { type: 'response.output_text.done', sequence_number: 15, item_id: 'msg_reason_001', output_index: 1, content_index: 0, text: '基于上述思考，结论如下：...' },
  {
    type: 'response.completed',
    sequence_number: 16,
    response: baseResponse(
      'completed',
      [
        { id: 'rs_reason_001', type: 'reasoning', summary: [{ type: 'reasoning', text: '思考完成！' }] },
        { id: 'msg_reason_001', type: 'message', status: 'completed', content: [{ type: 'output_text', annotations: [], text: '基于上述思考，结论如下：...' }], role: 'assistant' },
      ],
      { service_tier: 'default', usage: { input_tokens: 12, input_tokens_details: { cached_tokens: 0 }, output_tokens: 120, output_tokens_details: { reasoning_tokens: 16 }, total_tokens: 132 } }
    ),
  },
];
const streamingResponseMessages = ref<any[]>([]);
const onStreamingResponseChatsChange = (chats?: any[]) => {
  streamingResponseMessages.value = chats || [];
};
let streamingResponseTimer: any = null;
onMounted(() => {
  let currentLength = 1;
  let currentState: any = null;
  streamingResponseTimer = setInterval(() => {
    if (currentLength > FIXED_SHUFFLED_INDICES.length) {
      clearInterval(streamingResponseTimer);
      return;
    }
    const currentIndices = FIXED_SHUFFLED_INDICES.slice(0, currentLength);
    const currentChunks = currentIndices.map((index) => REASONING_CHUNKS[index]);
    const result: any = streamingResponseToMessage(currentChunks, currentState);
    if (result) {
      const { message: responseMessage, nextState } = result;
      if (responseMessage) {
        streamingResponseMessages.value = [responseMessage];
        currentState = nextState;
      }
    }
    currentLength += 1;
  }, 200);
});
onBeforeUnmount(() => {
  if (streamingCompletionTimer) clearInterval(streamingCompletionTimer);
  if (streamingResponseTimer) clearInterval(streamingResponseTimer);
});

const boxStyle = computed(() => ({ border: '1px solid var(--semi-color-border)', borderRadius: '12px', marginTop: '10px', padding: '20px' }));
</script>

<template>
  <DemoBlock title="如何引入" :code="importCode" />

  <DemoBlock
    title="基本用法"
    desc="通过设置 chats 和 onChatsChange 实现基础对话显示和交互。使用 align 属性可以设置对话的布局，支持左右分布（leftRight，默认）和左对齐（leftAlign）。"
  >
    <span style="display: flex; flex-direction: column; row-gap: 8px">
      <span style="display: flex; align-items: center; column-gap: 10px">
        模式
        <RadioGroup v-model="basicMode" type="button">
          <Radio value="bubble">气泡</Radio>
          <Radio value="noBubble">非气泡</Radio>
          <Radio value="userBubble">用户会话气泡</Radio>
        </RadioGroup>
      </span>
      <span style="display: flex; align-items: center; column-gap: 10px">
        会话布局方式
        <RadioGroup v-model="basicAlign" type="button">
          <Radio value="leftRight">左右分布</Radio>
          <Radio value="leftAlign">左对齐</Radio>
        </RadioGroup>
      </span>
    </span>
    <div :style="boxStyle">
      <AIChatDialogue
        :key="basicAlign + basicMode"
        :align="basicAlign"
        :mode="basicMode"
        :chats="basicMessages"
        :role-config="roleConfig"
        :on-chats-change="onBasicChatsChange"
      />
    </div>
  </DemoBlock>

  <DemoBlock
    title="消息状态"
    desc="Message 的 status 与 Response API Status 相同，存在 6 种状态，对应 3 种官方样式（成功 / 请求中 / 失败）：completed；queued / in_progress / incomplete；failed / cancelled。"
  >
    <AIChatDialogue :chats="statusMessages" :role-config="roleConfig" :on-chats-change="onStatusChatsChange" />
  </DemoBlock>

  <DemoBlock
    title="消息展示"
    desc="content 为 ContentItem[]，支持文本、文件、图片、代码、思考块 reasoning、参考来源 annotation、工具调用 tool call 等消息块，并提供 AIChatDialogue.Step 用于分步展示（通过 renderDialogueContentItem 渲染自定义 plan 类型）。"
  >
    <AIChatDialogue
      :chats="allTypeMessages"
      :role-config="roleConfig"
      :on-chats-change="onAllTypeChatsChange"
      :render-dialogue-content-item="allTypeCustomRender"
    />
  </DemoBlock>

  <DemoBlock
    title="引用"
    desc="通过 references 字段定义当前消息引用的文件或者文本，showReference 配置当前消息是否显示可被引用样式，onReferenceClick 配置引用按钮点击回调。"
  >
    <AIChatDialogue
      :chats="referenceMessages"
      :role-config="roleConfig"
      :on-chats-change="onReferenceChatsChange"
      show-reference
      :on-reference-click="onReferenceClick"
    />
  </DemoBlock>

  <DemoBlock title="选择" desc="selecting 开启选择模式；通过 ref 调用 selectAll / deselectAll，onSelect 返回选中的消息 id 列表。">
    <div>
      <span style="display: flex; flex-direction: column; row-gap: 8px">
        <span style="display: flex; align-items: center; column-gap: 10px">
          会话布局方式
          <RadioGroup v-model="selectingAlign" type="button">
            <Radio value="leftRight">左右分布</Radio>
            <Radio value="leftAlign">左对齐</Radio>
          </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
          是否开启选择
          <RadioGroup v-model="selectingEnabled" type="button">
            <Radio :value="true">开启</Radio>
            <Radio :value="false">关闭</Radio>
          </RadioGroup>
        </span>
        <span style="display: flex; align-items: center; column-gap: 10px">
          选择方式
          <RadioGroup :value="selection" type="button" @change="onSelectionChange">
            <Radio value="allSelect">全选</Radio>
            <Radio value="cancelSelect">取消全选</Radio>
          </RadioGroup>
        </span>
      </span>
      <div :style="boxStyle">
        <AIChatDialogue
          ref="selectingRef"
          :align="selectingAlign"
          mode="bubble"
          :chats="selectingMessages"
          :selecting="selectingEnabled"
          :on-select="onSelect"
          :role-config="roleConfig"
        />
      </div>
    </div>
  </DemoBlock>

  <DemoBlock title="提示" desc="通过 hints 可设置提示区域内容，点击提示内容后，提示内容将成为新的用户输入内容，并触发 onHintClick 回调。">
    <AIChatDialogue
      align="leftRight"
      mode="bubble"
      :chats="hintMessages"
      :role-config="roleConfig"
      :on-chats-change="onHintChatsChange"
      :hints="hints"
      :on-hint-click="onHintClick"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染提示" desc="通过 renderHintBox 可自定义提示区域内容，参数为 { content, index, onHintClick }。">
    <AIChatDialogue
      align="leftRight"
      mode="bubble"
      :chats="customHintMessages"
      :role-config="roleConfig"
      :on-chats-change="onCustomHintChatsChange"
      :hints="customHints"
      :on-hint-click="onCustomHintClick"
      :render-hint-box="renderHintBox"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染会话框"
    desc="通过 dialogueRenderConfig 传入自定义渲染配置：renderDialogueTitle / renderDialogueAvatar / renderDialogueContent / renderDialogueAction / renderFullDialogue。"
  >
    <AIChatDialogue
      align="leftRight"
      mode="bubble"
      :chats="renderConfigMessages"
      :role-config="roleConfig"
      :on-chats-change="onRenderConfigChatsChange"
      :dialogue-render-config="renderConfig"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染消息内容"
    desc="通过 renderDialogueContentItem 按照消息类型返回内容渲染；工具调用类型可按函数名嵌套配置，default 用于纯文本消息。"
  >
    <AIChatDialogue
      :chats="customRenderMessages"
      :role-config="roleConfig"
      :on-chats-change="onCustomRenderChatsChange"
      :render-dialogue-content-item="customRender"
    />
  </DemoBlock>

  <DemoBlock
    title="消息数据转换"
    desc="chatCompletionToMessage：将 Chat Completion API 返回的非流式数据转换为 Dialogue Message（返回数组，n > 1 时需自行选择展示哪条）。"
  >
    <AIChatDialogue align="leftRight" mode="bubble" :chats="completionMessages" :role-config="roleConfig" :on-chats-change="onCompletionChatsChange" />
  </DemoBlock>

  <DemoBlock
    title="消息数据转换 - streamingChatCompletionToMessage"
    desc="将 Chat Completion API 的流式 Chunk 列表转换为 Dialogue Message，示例每 100ms 追加一个 chunk。"
  >
    <AIChatDialogue
      align="leftRight"
      mode="bubble"
      :chats="streamingCompletionMessages"
      :role-config="roleConfig"
      :on-chats-change="onStreamingCompletionChatsChange"
    />
  </DemoBlock>

  <DemoBlock title="消息数据转换 - responseToMessage" desc="将 Response API 返回的非流式 Response Object 转换为 Dialogue Message。">
    <AIChatDialogue align="leftRight" mode="bubble" :chats="responseMessages" :role-config="roleConfig" :on-chats-change="onResponseChatsChange" />
  </DemoBlock>

  <DemoBlock
    title="消息数据转换 - streamingResponseToMessage"
    desc="将 Response API 的流式 Chunk 列表转换为 Dialogue Message，示例模拟了 chunk 乱序、重复到达的情况（按 sequence_number 归并）。"
  >
    <AIChatDialogue
      align="leftRight"
      mode="bubble"
      :chats="streamingResponseMessages"
      :role-config="roleConfig"
      :on-chats-change="onStreamingResponseChatsChange"
    />
  </DemoBlock>
</template>
