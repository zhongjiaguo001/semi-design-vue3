<script setup lang="ts">
import { ref, h, computed, onBeforeUnmount } from 'vue';
import {
  Chat,
  Radio,
  RadioGroup,
  Avatar,
  AvatarGroup,
  Button,
  Dropdown,
  MarkdownRender,
  Form,
  IconForward,
  IconMoreStroked,
  IconChevronUp,
  IconUpload,
  IconArrowRight,
} from '@/index';
import DemoBlock from '../../DemoBlock.vue';

// ---------- shared data (identical to the official examples) ----------
const roleInfo = {
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

const uploadProps = { action: 'https://api.semi.design/upload' };
const uploadTipProps = { content: '自定义上传按钮提示信息' };

let id = 0;
function getId() {
  return `id-${id++}`;
}

const outerStyle = (height: number, margin = false) => ({
  border: '1px solid var(--semi-color-border)',
  borderRadius: '16px',
  margin: margin ? '8px 16px' : undefined,
  height: `${height}px`,
});

const mockReply = (list: any[], content = '这是一条 mock 回复信息') => [
  ...list,
  { role: 'assistant', id: getId(), createAt: Date.now(), content },
];

// ---------- 基本用法 ----------
const basicDefault = [
  { role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." },
  { role: 'user', id: '2', createAt: 1715676751919, content: '给一个 Semi Design 的 Button 组件的使用示例' },
  {
    role: 'assistant',
    id: '3',
    createAt: 1715676751919,
    content:
      "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@douyinfe/semi-ui';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
  },
];
const basicMessage = ref<any[]>(basicDefault);
const basicMode = ref<'bubble' | 'noBubble' | 'userBubble'>('bubble');
const basicAlign = ref<'leftRight' | 'leftAlign'>('leftRight');
const onBasicChatsChange = (chats?: any[]) => {
  basicMessage.value = chats || [];
};
const onBasicMessageSend = () => {
  setTimeout(() => {
    basicMessage.value = mockReply(basicMessage.value);
  }, 200);
};
const onBasicMessageReset = () => {
  setTimeout(() => {
    const list = basicMessage.value;
    const last = list[list.length - 1];
    basicMessage.value = [...list.slice(0, -1), { ...last, status: 'complete', content: 'This is a mock reset message.' }];
  }, 200);
};

// ---------- 消息状态 ----------
const statusMessage = ref<any[]>([
  { role: 'assistant', id: '1', createAt: 1715676751919, content: '请求成功' },
  { id: 'loading', role: 'assistant', status: 'loading' },
  { role: 'assistant', id: 'error', content: '请求错误', status: 'error' },
]);
const onStatusChatsChange = (chats?: any[]) => {
  statusMessage.value = chats || [];
};
const onStatusMessageSend = () => {
  setTimeout(() => {
    statusMessage.value = mockReply(statusMessage.value);
  }, 200);
};

// ---------- 动态更新数据 ----------
const dynamicMessage = ref<any[]>([
  { role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." },
  { role: 'user', id: '2', createAt: 1715676751919, content: '介绍一下 Semi design' },
  {
    role: 'assistant',
    id: '3',
    createAt: 1715676751919,
    content: `
Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户[[1]](https://semi.design/zh-CN/start/introduction)。

Semi Design的特点包括：

1. 设计简洁、现代化。
2. 提供主题方案，可深度样式定制。
3. 提供明暗色两套模式，切换方便。
4. 国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
5. 采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。

---
Learn more:
1. [Introduction 介绍 - Semi Design](https://semi.design/zh-CN/start/introduction)
2. [Getting Started 快速开始 - Semi Design](https://semi.design/zh-CN/start/getting-started)
3. [Semi D2C 设计稿转代码的演进之路 - 知乎](https://zhuanlan.zhihu.com/p/667189184)
`,
  },
]);
let intervalId: ReturnType<typeof setInterval> | null = null;
const onDynamicChatsChange = (chats?: any[]) => {
  dynamicMessage.value = chats || [];
};
const generateMockResponse = (content: string) => {
  const timer = setInterval(() => {
    const list = dynamicMessage.value;
    const lastMessage = list[list.length - 1];
    let newMessage = { ...lastMessage };
    if (lastMessage.status === 'loading') {
      newMessage = { ...newMessage, content: `mock Response for ${content} \n`, status: 'incomplete' };
    } else if (lastMessage.status === 'incomplete') {
      if (lastMessage.content.length > 200) {
        clearInterval(timer);
        intervalId = null;
        newMessage = { ...newMessage, content: `${lastMessage.content} mock stream message`, status: 'complete' };
      } else {
        newMessage = { ...newMessage, content: `${lastMessage.content} mock stream message` };
      }
    }
    dynamicMessage.value = [...list.slice(0, -1), newMessage];
  }, 400);
  intervalId = timer;
};
const onDynamicMessageSend = (content: string) => {
  dynamicMessage.value = [...dynamicMessage.value, { role: 'assistant', status: 'loading', createAt: Date.now(), id: getId() }];
  generateMockResponse(content);
};
const onStopGenerator = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    const list = dynamicMessage.value;
    const lastMessage = list[list.length - 1];
    if (lastMessage.status && lastMessage.status !== 'complete') {
      dynamicMessage.value = [...list.slice(0, -1), { ...lastMessage, status: 'complete' }];
    }
  }
};
onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});

// ---------- 清除上下文 ----------
const clearDefault = [
  { role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." },
  { role: 'user', id: '2', createAt: 1715676751919, content: '介绍一下 semi design' },
  { role: 'assistant', id: '3', createAt: 1715676751919, content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统' },
];
const clearMessage = ref<any[]>(clearDefault);
const clearChatRef = ref<any>(null);
const onClearChatsChange = (chats?: any[]) => {
  clearMessage.value = chats || [];
};
const onClearMessageSend = () => {
  setTimeout(() => {
    clearMessage.value = mockReply(clearMessage.value);
  }, 200);
};
const onClearMessageReset = () => {
  setTimeout(() => {
    const list = clearMessage.value;
    const last = list[list.length - 1];
    clearMessage.value = [...list.slice(0, -1), { ...last, status: 'complete', content: 'This is a mock reset message.' }];
  }, 200);
};

// ---------- 自定义渲染会话框：头像 / 标题 ----------
const customTitleMessage = ref<any[]>([
  { role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." },
  {
    role: 'user',
    id: '2',
    createAt: 1715676751919,
    content: [
      { type: 'text', text: '这张图片里有什么？' },
      {
        type: 'image_url',
        image_url: { url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/root-web-sites/edit-bag.jpeg' },
      },
    ],
  },
  { role: 'assistant', id: '3', createAt: 1715676751919, content: '图片中是一个有卡通画像装饰的黄色背包。' },
]);
const titleMode = ref<'default' | 'null' | 'custom'>('null');
const avatarMode = ref<'default' | 'null' | 'custom'>('null');
const customRenderAvatar = computed(() => {
  switch (avatarMode.value) {
    case 'custom':
      return (props: any) => {
        const { role } = props;
        return h(Avatar, { size: 'extra-small', shape: 'square', style: { flexShrink: '0' } }, () => role.name);
      };
    case 'null':
      return () => null;
    default:
      return undefined;
  }
});
const customRenderTitle = computed(() => {
  switch (titleMode.value) {
    case 'custom':
      return (props: any) => {
        const { role, message } = props;
        const date = new Date(message.createAt);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return h('span', { class: 'title' }, [role.name, h('span', { class: 'time' }, `${hours}:${minutes}`)]);
      };
    case 'null':
      return () => null;
    default:
      return undefined;
  }
});
const titleAvatarRenderConfig = computed(() => ({
  renderChatBoxTitle: customRenderTitle.value,
  renderChatBoxAvatar: customRenderAvatar.value,
}));
const onCustomTitleChatsChange = (chats?: any[]) => {
  customTitleMessage.value = chats || [];
};
const onCustomTitleMessageSend = () => {
  setTimeout(() => {
    customTitleMessage.value = [...customTitleMessage.value, { role: 'assistant', id: getId(), content: 'This is a mock response' }];
  }, 200);
};

// ---------- 自定义渲染会话框：操作区 ----------
const actionMessage = ref<any[]>([...clearDefault]);
const onActionChatsChange = (chats?: any[]) => {
  actionMessage.value = chats || [];
};
const onActionMessageSend = () => {
  setTimeout(() => {
    actionMessage.value = [...actionMessage.value, { role: 'assistant', id: getId(), content: 'This is a mock response' }];
  }, 200);
};
const findChatBoxWrap = (el: HTMLElement | null) => {
  let parent = el?.parentElement ?? null;
  while (parent) {
    if (parent.classList.contains('semi-chat-chatBox-wrap')) return parent;
    parent = parent.parentElement;
  }
  return document.body;
};
const customRenderAction = (props: any) => {
  const { defaultActions, className } = props;
  let spanEl: HTMLElement | null = null;
  return h(
    'span',
    {
      class: className,
      ref: (el: any) => {
        spanEl = el as HTMLElement;
      },
    },
    [
      defaultActions,
      h(
        Dropdown,
        {
          key: 'dropdown',
          trigger: 'click',
          position: 'top',
          getPopupContainer: () => findChatBoxWrap(spanEl),
          render: () =>
            h(Dropdown.Menu, null, () => [h(Dropdown.Item, { icon: () => h(IconForward) }, () => '分享')]),
        },
        () => h(Button, { class: 'semi-chat-chatBox-action-btn', icon: () => h(IconMoreStroked), theme: 'borderless', type: 'tertiary' })
      ),
    ]
  );
};
const actionRenderConfig = { renderChatBoxAction: customRenderAction };

// ---------- 自定义渲染会话框：内容区 ----------
const contentMessage = ref<any[]>([
  {
    role: 'assistant',
    id: '3',
    createAt: 1715676751919,
    content:
      'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。它作为全面、易用、优质的现代应用 UI 解决方案，从字节跳动各业务线的复杂场景提炼而来，支撑近千计平台产品，服务内外部 10 万+ 用户。',
    source: [
      {
        avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
        url: '/zh-CN/start/introduction',
        title: 'semi Design',
        subTitle: 'Semi design website',
        content: 'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。',
      },
      {
        avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
        url: '/dsm/landing',
        subTitle: 'Semi DSM website',
        title: 'Semi 设计系统',
        content: '从 Semi Design，到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中',
      },
      {
        avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png',
        url: '/code/zh-CN/start/introduction',
        subTitle: 'Semi D2C website',
        title: '设计稿转代码',
        content: 'Semi 设计稿转代码（Semi Design to Code，或简称 Semi D2C），是由抖音前端 Semi Design 团队推出的全新的提效工具',
      },
    ],
  },
]);
const onContentChatsChange = (chats?: any[]) => {
  contentMessage.value = chats || [];
};
const onContentMessageSend = () => {
  setTimeout(() => {
    contentMessage.value = [...contentMessage.value, { role: 'assistant', id: getId(), content: 'This is a mock response' }];
  }, 200);
};
// SourceCard: a small stateful sub-component (open/closed), same look as the official example
const sourceOpen = ref<Record<string, boolean>>({});
const SourceCard = (props: { source: any[]; id: string }) => {
  const open = sourceOpen.value[props.id] !== false;
  const setOpen = (v: boolean) => {
    sourceOpen.value = { ...sourceOpen.value, [props.id]: v };
  };
  const { source } = props;
  return h(
    'div',
    {
      style: {
        transition: open ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease',
        height: open ? '30px' : '200px',
        width: open ? '190px' : '100%',
        background: 'var(--semi-color-tertiary-light-hover)',
        borderRadius: '16px',
        boxSizing: 'border-box',
        marginBottom: '10px',
      },
    },
    [
      h(
        'span',
        {
          style: {
            display: !open ? 'none' : 'flex',
            width: 'fit-content',
            columnGap: '10px',
            background: 'var(--semi-color-tertiary-light-hover)',
            borderRadius: '16px',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--semi-color-text-1)',
          },
          onClick: () => setOpen(false),
        },
        [
          h('span', null, `基于${source.length}个搜索来源`),
          h(AvatarGroup, { size: 'extra-extra-small' }, () => source.map((s: any, index: number) => h(Avatar, { key: index, src: s.avatar }))),
        ]
      ),
      h(
        'span',
        {
          style: {
            height: '100%',
            boxSizing: 'border-box',
            display: !open ? 'flex' : 'none',
            flexDirection: 'column',
            background: 'var(--semi-color-tertiary-light-hover)',
            borderRadius: '16px',
            padding: '12px',
            cursor: 'pointer',
          },
          onClick: () => setOpen(true),
        },
        [
          h(
            'span',
            {
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', columnGap: '10px', color: 'var(--semi-color-text-1)' },
            },
            [h('span', { style: { fontSize: '14px', fontWeight: 500 } }, 'Source'), h(IconChevronUp)]
          ),
          h(
            'span',
            { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', overflow: 'auto', padding: '5px 10px' } },
            source.map((s: any, index: number) =>
              h(
                'span',
                {
                  key: index,
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: '5px',
                    flexBasis: '150px',
                    flexGrow: 1,
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '12px',
                  },
                },
                [
                  h('span', { style: { display: 'flex', columnGap: '5px', alignItems: 'center' } }, [
                    h(Avatar, { style: { width: '16px', height: '16px', flexShrink: 0 }, shape: 'square', src: s.avatar }),
                    h('span', { style: { color: 'var(--semi-color-text-2)', textOverflow: 'ellipsis' } }, s.title),
                  ]),
                  h('span', { style: { color: 'var(--semi-color-primary)', fontSize: '12px' } }, s.subTitle),
                  h(
                    'span',
                    {
                      style: {
                        display: '-webkit-box',
                        '-webkit-box-orient': 'vertical',
                        WebkitLineClamp: '3',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        color: 'var(--semi-color-text-2)',
                      },
                    },
                    s.content
                  ),
                ]
              )
            )
          ),
        ]
      ),
    ]
  );
};
const renderContent = (props: any) => {
  const { message, className } = props;
  return h('div', { class: className }, [
    message.source ? h(SourceCard, { source: message.source, id: String(message.id) }) : null,
    h(MarkdownRender, { raw: message.content, format: 'md' }),
  ]);
};
const contentRenderConfig = { renderChatBoxContent: renderContent };

// ---------- 自定义渲染会话框：整个会话框 ----------
const fullMessage = ref<any[]>([...clearDefault]);
const onFullChatsChange = (chats?: any[]) => {
  fullMessage.value = chats || [];
};
const onFullMessageSend = () => {
  setTimeout(() => {
    fullMessage.value = [...fullMessage.value, { role: 'assistant', id: getId(), content: 'This is a mock response' }];
  }, 200);
};
const titleStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', columnGap: '10px', padding: '5px 0px', width: 'fit-content' };
const customRenderChatBox = (props: any) => {
  const { role, message, defaultNodes, className } = props;
  let titleNode: any = null;
  if (message.role !== 'user') {
    titleNode = h('span', { style: titleStyle }, [h(Avatar, { size: 'extra-small', shape: 'square', src: role.avatar }), defaultNodes.title]);
  }
  return h('div', { class: className }, [
    h('div', { style: { display: 'flex', flexDirection: 'column', rowGap: '4px', alignItems: message.role === 'user' ? 'end' : '' } }, [
      titleNode,
      h('div', { style: { width: 'fit-content' } }, [defaultNodes.content]),
      defaultNodes.action,
    ]),
  ]);
};
const fullRenderConfig = { renderFullChatBox: customRenderChatBox };

// ---------- 自定义渲染输入框 ----------
const inputAreaMessage = ref<any[]>([{ role: 'system', id: '1', createAt: 1715676751919, content: "Hello, I'm your AI assistant." }]);
const onInputAreaChatsChange = (chats?: any[]) => {
  inputAreaMessage.value = chats || [];
};
const onInputAreaMessageSend = () => {
  setTimeout(() => {
    inputAreaMessage.value = [...inputAreaMessage.value, { role: 'assistant', id: getId(), content: 'This is a mock response' }];
  }, 200);
};
const inputStyle = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--semi-color-border)',
  margin: '8px 16px',
  borderRadius: '8px',
  padding: '8px',
};
let customFormApi: any = null;
const renderInputArea = (props: any) => {
  const { onSend } = props;
  const onSubmit = () => {
    if (customFormApi) {
      const values = customFormApi.getValues();
      if ((values.name && values.name.length !== 0) || (values.file && values.file.length !== 0)) {
        onSend(values.name, values.file);
        customFormApi.reset();
      }
    }
  };
  return h('div', { style: inputStyle }, [
    h(
      Form,
      {
        getFormApi: (api: any) => {
          customFormApi = api;
        },
      },
      () => [
        h('strong', null, '输入信息'),
        h((Form as any).Input, { field: 'name', label: '名称（Input）', style: { width: '250px' }, trigger: 'blur' }),
        h((Form as any).Upload, { field: 'file', label: '文档', action: 'https://api.semi.design/upload' }, () =>
          h(Button, { icon: () => h(IconUpload), theme: 'light' }, () => '点击上传')
        ),
      ]
    ),
    h(Button, { style: { width: 'fit-content' }, onClick: onSubmit }, () => '提交'),
  ]);
};

// ---------- 提示信息 ----------
const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够通过 DSM 定制自己的主题吗？'];
const hintChatDefault = [
  {
    role: 'assistant',
    id: '1',
    createAt: 1715676751919,
    content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
  },
];
const hintMessage = ref<any[]>(hintChatDefault);
const hints = ref<string[]>(hintsExample);
const onHintClick = () => {
  hints.value = [];
};
const onHintChatsChange = (chats?: any[]) => {
  hintMessage.value = chats || [];
};
const onHintMessageSend = () => {
  setTimeout(() => {
    hintMessage.value = mockReply(hintMessage.value);
  }, 200);
};
const onHintClear = () => {
  hints.value = [];
};

// ---------- 自定义提示信息渲染 ----------
const customHintMessage = ref<any[]>(hintChatDefault);
const customHints = ref<string[]>(hintsExample);
const onCustomHintClick = () => {
  customHints.value = [];
};
const onCustomHintChatsChange = (chats?: any[]) => {
  customHintMessage.value = chats || [];
};
const onCustomHintMessageSend = () => {
  setTimeout(() => {
    customHintMessage.value = mockReply(customHintMessage.value);
  }, 200);
  customHints.value = [];
};
const onCustomHintClear = () => {
  customHints.value = [];
};
const commonHintStyle = {
  border: '1px solid var(--semi-color-border)',
  padding: '10px',
  borderRadius: '10px',
  color: 'var(--semi-color-text-1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: '14px',
};
const renderHintBox = (props: { content: string; index: number; onHintClick: () => void }) => {
  const { content, onHintClick: click, index } = props;
  return h('div', { style: commonHintStyle, onClick: click, key: index }, [content, h(IconArrowRight, { style: { marginLeft: '10px' } })]);
};
</script>

<template>
  <DemoBlock title="如何引入" desc="Chat 从 v2.63.0 版本开始支持。" code="import { Chat } from 'semi-design-vue'" />

  <DemoBlock
    title="基本用法"
    desc="通过设置 chats 和 onChatsChange，onMessageSend 实现基础对话显示和交互。附件支持点击上传、粘贴、拖拽（uploadProps / uploadTipProps）。roleConfig 传入角色信息；align 设置布局（leftRight 默认 / leftAlign）；mode 设置气泡模式。"
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
    <Chat
      :key="basicAlign + basicMode"
      :align="basicAlign"
      :mode="basicMode"
      :upload-props="uploadProps"
      :style="outerStyle(550, true)"
      :chats="basicMessage"
      :role-config="roleInfo"
      :upload-tip-props="uploadTipProps"
      @chats-change="onBasicChatsChange"
      @message-send="onBasicMessageSend"
      @message-reset="onBasicMessageReset"
    />
  </DemoBlock>

  <DemoBlock
    title="消息状态"
    desc="chats 类型为 Message[]，Message 包含 role、content、attachment、status、id、createAt 等。status 不同（loading / incomplete / complete / error），会话样式不同。"
  >
    <Chat
      :style="outerStyle(400)"
      :chats="statusMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @chats-change="onStatusChatsChange"
      @message-send="onStatusMessageSend"
    />
  </DemoBlock>

  <DemoBlock
    title="动态更新数据"
    desc="对于 SSE 流式数据，可将获取到的数据用于更新 chats，对话内容将实时更新。showStopGenerate 设置是否展示停止生成按钮（默认 false），在 onStopGenerator 中处理停止逻辑。"
  >
    <Chat
      :chats="dynamicMessage"
      :show-stop-generate="true"
      :style="outerStyle(600)"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @stop-generator="onStopGenerator"
      @chats-change="onDynamicChatsChange"
      @message-send="onDynamicMessageSend"
    />
  </DemoBlock>

  <DemoBlock title="清除上下文" desc="通过 showClearContext 在输入框中显示清除上下文按钮（默认 false），也可以通过 ref 调用 clearContext 方法清除上下文。">
    <div style="margin: 0 16px 8px">
      <Button size="small" @click="clearChatRef?.clearContext()">通过 ref 调用 clearContext</Button>
    </div>
    <Chat
      ref="clearChatRef"
      :upload-props="uploadProps"
      :style="outerStyle(550, true)"
      :chats="clearMessage"
      :role-config="roleInfo"
      :upload-tip-props="uploadTipProps"
      show-clear-context
      @chats-change="onClearChatsChange"
      @message-send="onClearMessageSend"
      @message-reset="onClearMessageReset"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染会话框" desc="通过 chatBoxRenderConfig 传入自定义渲染配置。自定义渲染头像和标题，可通过 renderChatBoxAvatar 和 renderChatBoxTitle 实现。">
    <span style="display: flex; flex-direction: column; row-gap: 8px; margin-bottom: 5px">
      <span style="display: flex; align-items: center; column-gap: 10px">
        头像渲染模式
        <RadioGroup v-model="avatarMode" type="button">
          <Radio value="default">默认头像</Radio>
          <Radio value="null">无头像</Radio>
          <Radio value="custom">自定义头像</Radio>
        </RadioGroup>
      </span>
      <span style="display: flex; align-items: center; column-gap: 10px">
        标题渲染模式
        <RadioGroup v-model="titleMode" type="button">
          <Radio value="default">默认标题</Radio>
          <Radio value="null">无标题</Radio>
          <Radio value="custom">自定义标题</Radio>
        </RadioGroup>
      </span>
    </span>
    <Chat
      :key="`${avatarMode}${titleMode}`"
      :chat-box-render-config="titleAvatarRenderConfig"
      :style="outerStyle(400)"
      class="component-chat-demo-custom-render"
      :chats="customTitleMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @chats-change="onCustomTitleChatsChange"
      @message-send="onCustomTitleMessageSend"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染会话框 - 操作区" desc="鼠标移动到会话上，即可显示会话操作区，通过 renderChatBoxAction 自定义渲染操作区（在默认操作后追加一个“分享”下拉菜单）。">
    <Chat
      :chat-box-render-config="actionRenderConfig"
      :style="outerStyle(400)"
      :chats="actionMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @chats-change="onActionChatsChange"
      @message-send="onActionMessageSend"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染会话框 - 内容区" desc="通过 renderChatBoxContent 自定义内容区域（此处在正文前插入可展开的搜索来源卡片）。">
    <Chat
      :style="outerStyle(500)"
      :chats="contentMessage"
      :role-config="roleInfo"
      :chat-box-render-config="contentRenderConfig"
      :upload-props="uploadProps"
      @chats-change="onContentChatsChange"
      @message-send="onContentMessageSend"
    />
  </DemoBlock>

  <DemoBlock title="自定义渲染会话框 - 整个会话框" desc="使用 renderFullChatBox 自定义渲染整个会话框，defaultNodes 中包含 avatar / title / content / action 默认节点。">
    <Chat
      :chat-box-render-config="fullRenderConfig"
      :style="outerStyle(400)"
      :chats="fullMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @chats-change="onFullChatsChange"
      @message-send="onFullMessageSend"
    />
  </DemoBlock>

  <DemoBlock
    title="自定义渲染输入框"
    desc="可通过 renderInputArea 自定义渲染输入框，参数包含 defaultNode、onSend、onClear 以及 detailProps（clearContextNode / uploadNode / inputNode / sendNode / onClick）。此处使用 Form 作为输入区。"
  >
    <Chat
      :render-input-area="renderInputArea"
      :style="outerStyle(500)"
      :chats="inputAreaMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @chats-change="onInputAreaChatsChange"
      @message-send="onInputAreaMessageSend"
    />
  </DemoBlock>

  <DemoBlock title="提示信息" desc="通过 hints 可设置提示区域内容，点击提示内容后，提示内容将成为新的用户输入内容，并触发 onHintClick 回调。">
    <Chat
      :hints="hints"
      :style="outerStyle(400)"
      :chats="hintMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @hint-click="onHintClick"
      @chats-change="onHintChatsChange"
      @message-send="onHintMessageSend"
      @clear="onHintClear"
    />
  </DemoBlock>

  <DemoBlock title="自定义提示信息渲染" desc="通过 renderHintBox 自定义提示区域内容，参数为 { content, index, onHintClick }。">
    <Chat
      :render-hint-box="renderHintBox"
      :hints="customHints"
      :style="outerStyle(400)"
      :chats="customHintMessage"
      :role-config="roleInfo"
      :upload-props="uploadProps"
      @hint-click="onCustomHintClick"
      @chats-change="onCustomHintChatsChange"
      @message-send="onCustomHintMessageSend"
      @clear="onCustomHintClear"
    />
  </DemoBlock>
</template>

<style scoped>
:deep(.component-chat-demo-custom-render .title) {
  display: flex;
  align-items: center;
  column-gap: 8px;
  font-size: 14px;
  color: var(--semi-color-text-0);
}
:deep(.component-chat-demo-custom-render .time) {
  font-size: 12px;
  color: var(--semi-color-text-2);
}
</style>
