import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, h } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Chat from './index';

const sampleChats = [
  { role: 'user', id: 'u1', content: 'Hello', status: 'complete' },
  { role: 'assistant', id: 'a1', content: 'Hi there', status: 'complete' },
];

describe('Chat', () => {
  it('renders container, messages and input', () => {
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        enableUpload: false,
        roleConfig: { user: { name: 'User' }, assistant: { name: 'Bot' } },
      },
    });
    expect(w.classes()).toContain('semi-chat');
    expect(w.find('.semi-chat-inner').exists()).toBe(true);
    expect(w.find('.semi-chat-container').exists()).toBe(true);
    expect(w.find('.semi-chat-inputBox').exists()).toBe(true);
    expect(w.findAll('.semi-chat-chatBox').length).toBe(2);
    expect(w.text()).toContain('User');
    expect(w.text()).toContain('Bot');
  });

  it('hints render and click notifies parent', async () => {
    const onHintClick = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(Chat, {
      props: { chats: sampleChats, hints: ['hint-one'], enableUpload: false, onHintClick, onChatsChange },
    });
    expect(w.find('.semi-chat-hint-item').exists()).toBe(true);
    expect(w.text()).toContain('hint-one');
    await w.find('.semi-chat-hint-item').trigger('click');
    expect(onHintClick).toHaveBeenCalledWith('hint-one');
    expect(onChatsChange).toHaveBeenCalled();
  });

  it('sendMessage / typing send emits chatsChange and messageSend', async () => {
    const onChatsChange = vi.fn();
    const onMessageSend = vi.fn();
    const w = mount(Chat, {
      props: { chats: sampleChats, enableUpload: false, onChatsChange, onMessageSend, placeholder: 'type here' },
    });
    const textarea = w.find('textarea');
    await textarea.setValue('ping');
    await nextTick();
    const send = w.find('.semi-chat-inputBox-sendButton');
    expect(send.exists()).toBe(true);
    await send.trigger('click');
    expect(onMessageSend).toHaveBeenCalled();
    expect(onChatsChange).toHaveBeenCalled();
    const nextChats = onChatsChange.mock.calls[0][0];
    expect(nextChats[nextChats.length - 1].content).toBe('ping');
    expect(nextChats[nextChats.length - 1].role).toBe('user');
  });

  it('showStopGenerate on loading last message', () => {
    const onStopGenerator = vi.fn();
    const w = mount(Chat, {
      props: {
        enableUpload: false,
        showStopGenerate: true,
        onStopGenerator,
        chats: [
          { role: 'user', id: 'u1', content: 'q', status: 'complete' },
          { role: 'assistant', id: 'a1', content: '', status: 'loading' },
        ],
      },
    });
    expect(w.find('.semi-chat-action-stop').exists()).toBe(true);
    w.find('.semi-chat-action-stop').trigger('click');
    expect(onStopGenerator).toHaveBeenCalled();
  });

  it('showClearContext and top/bottom slots', () => {
    const w = mount(Chat, {
      props: { chats: sampleChats, enableUpload: false, showClearContext: true },
      slots: {
        topSlot: () => 'TOP_SLOT',
        bottomSlot: () => 'BOTTOM_SLOT',
      },
    });
    expect(w.text()).toContain('TOP_SLOT');
    expect(w.text()).toContain('BOTTOM_SLOT');
    expect(w.find('.semi-chat-inputBox-clearButton').exists()).toBe(true);
  });

  it('exposes sendMessage / resetMessage / clearContext / scrollToBottom', async () => {
    const onChatsChange = vi.fn();
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, onChatsChange } });
    const vm = w.vm as any;
    expect(typeof vm.sendMessage).toBe('function');
    expect(typeof vm.resetMessage).toBe('function');
    expect(typeof vm.clearContext).toBe('function');
    expect(typeof vm.scrollToBottom).toBe('function');
    vm.sendMessage('from-api', []);
    await flushPromises();
    expect(onChatsChange).toHaveBeenCalled();
  });

  it('chatBoxRenderConfig and renderHintBox customize nodes', async () => {
    const renderHintBox = vi.fn(({ content, onHintClick }: any) =>
      h('button', { class: 'custom-hint', onClick: onHintClick }, content)
    );
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        hints: ['try this'],
        enableUpload: false,
        chatBoxRenderConfig: {
          renderChatBoxTitle: ({ role }: any) => h('span', { class: 'custom-title' }, role?.name || 'x'),
        },
        roleConfig: { user: { name: 'User' }, assistant: { name: 'Bot' } },
        renderHintBox,
      },
    });
    expect(w.find('.custom-title').exists()).toBe(true);
    expect(w.find('.custom-hint').exists()).toBe(true);
    await w.find('.custom-hint').trigger('click');
    expect(renderHintBox).toHaveBeenCalled();
  });

  it('copy action uses in-chat toast holder', async () => {
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        enableUpload: false,
        roleConfig: { user: { name: 'User' }, assistant: { name: 'Bot' } },
      },
    });
    expect(w.find('.semi-chat-toast').exists()).toBe(true);
  });

  it('align leftRight puts user messages on the right', () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, align: 'leftRight' } });
    const boxes = w.findAll('.semi-chat-chatBox');
    expect(boxes[0].classes()).toContain('semi-chat-chatBox-right');
    expect(boxes[1].classes()).not.toContain('semi-chat-chatBox-right');
  });
});

describe('Chat parity (official API)', () => {
  const roleConfig = { user: { name: 'User' }, assistant: { name: 'Bot' }, system: { name: 'Sys' } };

  it('message status: loading renders loading dots, error adds error class', () => {
    const w = mount(Chat, {
      props: {
        enableUpload: false,
        chats: [
          { role: 'assistant', id: '1', content: 'ok' },
          { role: 'assistant', id: 'loading', status: 'loading' },
          { role: 'assistant', id: 'error', content: 'bad', status: 'error' },
        ],
      },
    });
    expect(w.find('.semi-chat-chatBox-content-loading').exists()).toBe(true);
    expect(w.find('.semi-chat-chatBox-content-error').exists()).toBe(true);
  });

  it('mode noBubble / userBubble toggles content classes', () => {
    const chats = [
      { role: 'user', id: 'u', content: 'q' },
      { role: 'assistant', id: 'a', content: 'r' },
    ];
    const bubble = mount(Chat, { props: { enableUpload: false, chats, mode: 'bubble' } });
    expect(bubble.findAll('.semi-chat-chatBox-content-bubble').length).toBe(2);
    const noBubble = mount(Chat, { props: { enableUpload: false, chats, mode: 'noBubble' } });
    expect(noBubble.findAll('.semi-chat-chatBox-content-bubble').length).toBe(0);
    const userBubble = mount(Chat, { props: { enableUpload: false, chats, mode: 'userBubble' } });
    expect(userBubble.findAll('.semi-chat-chatBox-content-userBubble').length).toBe(1);
    expect(userBubble.find('.semi-chat-chatBox-content-user').exists()).toBe(true);
  });

  it('align leftAlign never puts user on the right', () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, align: 'leftAlign' } });
    expect(w.find('.semi-chat-chatBox-right').exists()).toBe(false);
  });

  it('chatBoxRenderConfig: avatar / content / action / full render functions', () => {
    const renderChatBoxAvatar = vi.fn(({ role }: any) => h('i', { class: 'c-avatar' }, role?.name));
    const renderChatBoxContent = vi.fn(({ className, defaultContent }: any) => h('div', { class: [className, 'c-content'] }, [defaultContent]));
    const renderChatBoxAction = vi.fn(({ className, defaultActions, defaultActionsObj }: any) =>
      h('span', { class: [className, 'c-action'], 'data-has-copy': String(!!defaultActionsObj?.copyNode) }, defaultActions)
    );
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        enableUpload: false,
        roleConfig,
        chatBoxRenderConfig: { renderChatBoxAvatar, renderChatBoxContent, renderChatBoxAction },
      },
    });
    expect(w.findAll('.c-avatar').length).toBe(2);
    expect(w.findAll('.c-content').length).toBe(2);
    expect(w.findAll('.c-action').length).toBe(2);
    expect(w.find('.c-action').attributes('data-has-copy')).toBe('true');
    expect(renderChatBoxAvatar.mock.calls[0][0]).toHaveProperty('defaultAvatar');
    expect(renderChatBoxAvatar.mock.calls[0][0]).toHaveProperty('message');

    const renderFullChatBox = vi.fn(({ className, defaultNodes, message }: any) =>
      h('div', { class: [className, 'c-full'], 'data-role': message.role }, [defaultNodes.title, defaultNodes.content, defaultNodes.action])
    );
    const full = mount(Chat, { props: { chats: sampleChats, enableUpload: false, roleConfig, chatBoxRenderConfig: { renderFullChatBox } } });
    expect(full.findAll('.c-full').length).toBe(2);
    expect(full.find('.c-full').attributes('data-role')).toBe('user');
    expect(full.find('.c-full').classes()).toContain('semi-chat-chatBox');
    expect(full.find('.c-full .semi-chat-chatBox-title').exists()).toBe(true);
  });

  it('renderChatBoxAvatar / renderChatBoxTitle returning null hides nodes', () => {
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        enableUpload: false,
        roleConfig,
        chatBoxRenderConfig: { renderChatBoxAvatar: () => null, renderChatBoxTitle: () => null },
      },
    });
    expect(w.find('.semi-chat-chatBox-avatar').exists()).toBe(false);
    expect(w.find('.semi-chat-chatBox-title').exists()).toBe(false);
  });

  it('roleConfig avatar string renders img; node avatar renders custom node', () => {
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        enableUpload: false,
        roleConfig: {
          user: { name: 'U', avatar: 'https://example.com/a.png', color: 'blue' },
          assistant: { name: 'A', avatar: h('b', { class: 'node-avatar' }, 'N') },
        },
      },
    });
    expect(w.find('.semi-chat-chatBox-avatar img').attributes('src')).toBe('https://example.com/a.png');
    expect(w.find('.node-avatar').exists()).toBe(true);
  });

  it('content array renders text + image_url + file_url', () => {
    const w = mount(Chat, {
      props: {
        enableUpload: false,
        chats: [
          {
            role: 'user',
            id: 'u',
            content: [
              { type: 'text', text: 'what is this' },
              { type: 'image_url', image_url: { url: 'https://example.com/pic.jpeg' } },
              { type: 'file_url', file_url: { url: 'https://example.com/a.pdf', name: 'a.pdf', size: '1kb', type: 'application/pdf' } },
            ],
          },
        ],
      },
    });
    expect(w.text()).toContain('what is this');
    expect(w.find('img[src="https://example.com/pic.jpeg"]').exists()).toBe(true);
    expect(w.text()).toContain('a.pdf');
  });

  it('escapeHtml escapes user html by default and can be disabled', async () => {
    const chats = [{ role: 'user', id: 'u', content: 'a <b>bold</b> tag' }];
    const on = mount(Chat, { props: { enableUpload: false, chats } });
    const off = mount(Chat, { props: { enableUpload: false, chats, escapeHtml: false } });
    await new Promise((r) => setTimeout(r, 300));
    await flushPromises();
    // escaped: the literal tag text survives markdown rendering
    expect(on.find('.semi-chat-chatBox-content').text()).toContain('<b>bold</b>');
    // not escaped: md format strips raw HTML (same as React), leaving only surrounding text
    expect(off.find('.semi-chat-chatBox-content').text()).not.toContain('<b>');
  });

  it('renderDivider customizes divider messages; default divider shows locale text', () => {
    const chats = [
      { role: 'user', id: 'u', content: 'a' },
      { role: 'divider', id: 'd' },
      { role: 'assistant', id: 'b', content: 'b' },
    ];
    const def = mount(Chat, { props: { enableUpload: false, chats } });
    expect(def.find('.semi-chat-divider').exists()).toBe(true);
    const custom = mount(Chat, { props: { enableUpload: false, chats, renderDivider: (m: any) => h('hr', { class: 'c-divider', 'data-id': m.id }) } });
    expect(custom.find('.c-divider').attributes('data-id')).toBe('d');
  });

  it('clearContext button appends divider and calls onClear + emits clear', async () => {
    const onClear = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, showClearContext: true, onClear, onChatsChange } });
    await w.find('.semi-chat-inputBox-clearButton').trigger('click');
    expect(onClear).toHaveBeenCalled();
    expect(w.emitted('clear')).toBeTruthy();
    const next = onChatsChange.mock.calls[0][0];
    expect(next[next.length - 1].role).toBe('divider');
  });

  it('renderInputArea receives defaultNode, onSend, onClear and detailProps', async () => {
    const onMessageSend = vi.fn();
    const onClear = vi.fn();
    const renderInputArea = vi.fn((p: any) =>
      h('div', { class: 'c-input' }, [
        h('button', { class: 'c-send', onClick: () => p.onSend('custom text', []) }, 'send'),
        h('button', { class: 'c-clear', onClick: () => p.onClear() }, 'clear'),
        p.detailProps.inputNode,
        p.detailProps.sendNode,
        p.detailProps.uploadNode,
        p.detailProps.clearContextNode,
      ])
    );
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, renderInputArea, onMessageSend, onClear } });
    expect(w.find('.c-input').exists()).toBe(true);
    const arg = renderInputArea.mock.calls[0][0];
    expect(arg.defaultNode).toBeTruthy();
    expect(typeof arg.detailProps.onClick).toBe('function');
    expect(w.find('.c-input .semi-chat-inputBox-textarea').exists()).toBe(true);
    expect(w.find('.c-input .semi-chat-inputBox-sendButton').exists()).toBe(true);
    expect(w.find('.c-input .semi-chat-inputBox-clearButton').exists()).toBe(true);
    await w.find('.c-send').trigger('click');
    expect(onMessageSend).toHaveBeenCalledWith('custom text', []);
    await w.find('.c-clear').trigger('click');
    expect(onClear).toHaveBeenCalled();
  });

  it('send button disabled when empty; canSend overrides', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false } });
    expect(w.find('.semi-chat-inputBox-sendButton').attributes('disabled')).toBeDefined();
    const forced = mount(Chat, { props: { chats: sampleChats, enableUpload: false, canSend: true } });
    expect(forced.find('.semi-chat-inputBox-sendButton').attributes('disabled')).toBeUndefined();
    const blocked = mount(Chat, { props: { chats: sampleChats, enableUpload: false, canSend: false } });
    await blocked.find('textarea').setValue('hello');
    expect(blocked.find('.semi-chat-inputBox-sendButton').attributes('disabled')).toBeDefined();
  });

  it('showStopGenerate disables send while last message is loading', () => {
    const w = mount(Chat, {
      props: { enableUpload: false, showStopGenerate: true, chats: [{ role: 'assistant', id: 'a', status: 'incomplete', content: 'x' }] },
    });
    expect(w.find('.semi-chat-action-stop').exists()).toBe(true);
    expect(w.find('.semi-chat-inputBox-sendButton').attributes('disabled')).toBeDefined();
  });

  it('onInputChange / inputChange fires when typing', async () => {
    const onInputChange = vi.fn();
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, onInputChange } });
    await w.find('textarea').setValue('abc');
    expect(onInputChange).toHaveBeenCalled();
    expect(onInputChange.mock.calls[0][0].inputValue).toBe('abc');
    expect(w.emitted('inputChange')).toBeTruthy();
  });

  it('sendHotKey enter sends on Enter, shift+enter does not', async () => {
    const onMessageSend = vi.fn();
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, onMessageSend } });
    await w.find('textarea').setValue('hi');
    await w.find('textarea').trigger('keydown', { key: 'Enter', keyCode: 13 });
    await flushPromises();
    expect(onMessageSend).toHaveBeenCalledWith('hi', []);

    const onSend2 = vi.fn();
    const w2 = mount(Chat, { props: { chats: sampleChats, enableUpload: false, onMessageSend: onSend2, sendHotKey: 'shift+enter' } });
    await w2.find('textarea').setValue('hi');
    await w2.find('textarea').trigger('keydown', { key: 'Enter', keyCode: 13 });
    await flushPromises();
    expect(onSend2).not.toHaveBeenCalled();
    await w2.find('textarea').trigger('keydown', { key: 'Enter', keyCode: 13, shiftKey: true });
    await flushPromises();
    expect(onSend2).toHaveBeenCalledWith('hi', []);
  });

  it('message actions: copy / like / dislike / reset / delete emit', async () => {
    const onMessageCopy = vi.fn();
    const onMessageGoodFeedback = vi.fn();
    const onMessageBadFeedback = vi.fn();
    const onMessageReset = vi.fn();
    const onMessageDelete = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(Chat, {
      attachTo: document.body,
      props: { chats: sampleChats, enableUpload: false, onMessageCopy, onMessageGoodFeedback, onMessageBadFeedback, onMessageReset, onMessageDelete, onChatsChange },
    });
    const actions = w.findAll('.semi-chat-chatBox-action')[1];
    const btns = actions.findAll('.semi-chat-chatBox-action-btn');
    // copy, like, dislike, reset, delete
    expect(btns.length).toBe(5);
    await btns[0].trigger('click');
    expect(onMessageCopy).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }));
    expect(w.emitted('messageCopy')).toBeTruthy();
    await btns[1].trigger('click');
    expect(onMessageGoodFeedback).toHaveBeenCalled();
    expect(w.emitted('messageGoodFeedback')).toBeTruthy();
    await btns[2].trigger('click');
    expect(onMessageBadFeedback).toHaveBeenCalled();
    expect(w.emitted('messageBadFeedback')).toBeTruthy();
    await btns[3].trigger('click');
    expect(onMessageReset).toHaveBeenCalled();
    expect(w.emitted('messageReset')).toBeTruthy();
    await btns[4].trigger('click');
    await flushPromises();
    await nextTick();
    const ok = document.body.querySelector('.semi-popconfirm .semi-button-primary, .semi-popconfirm-footer .semi-button:last-child') as HTMLElement;
    expect(ok).toBeTruthy();
    ok.click();
    await flushPromises();
    expect(onMessageDelete).toHaveBeenCalled();
    expect(w.emitted('messageDelete')).toBeTruthy();
    w.unmount();
  });

  it('hintCls / hintStyle / inputBoxCls / inputBoxStyle / placeholder / className', () => {
    const w = mount(Chat, {
      props: {
        chats: sampleChats,
        hints: ['h'],
        enableUpload: false,
        hintCls: 'my-hint',
        hintStyle: { color: 'red' },
        inputBoxCls: 'my-input',
        inputBoxStyle: { color: 'blue' },
        placeholder: 'say something',
        className: 'my-chat',
      },
    });
    expect(w.classes()).toContain('my-chat');
    expect(w.find('.semi-chat-hints').classes()).toContain('my-hint');
    expect(w.find('.semi-chat-hints').attributes('style')).toContain('red');
    expect(w.find('.semi-chat-inputBox').classes()).toContain('my-input');
    expect(w.find('.semi-chat-inputBox').attributes('style')).toContain('blue');
    expect(w.find('textarea').attributes('placeholder')).toBe('say something');
  });

  it('enableUpload true renders upload button; object form controls clickUpload', () => {
    const on = mount(Chat, { props: { chats: sampleChats, uploadProps: { action: '/upload' } } });
    expect(on.find('.semi-chat-inputBox-uploadButton').exists()).toBe(true);
    const off = mount(Chat, { props: { chats: sampleChats, enableUpload: { clickUpload: false } } });
    expect(off.find('.semi-chat-inputBox-uploadButton').exists()).toBe(false);
  });

  it('resetMessage via ref calls onMessageReset for last assistant message', () => {
    const onMessageReset = vi.fn();
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, onMessageReset } });
    (w.vm as any).resetMessage();
    expect(onMessageReset).toHaveBeenCalled();
  });
});

describe('Chat callbacks fire exactly once', () => {
  it('@message-send listener form fires once per send', async () => {
    const onMessageSend = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(Chat, {
      props: { chats: sampleChats, enableUpload: false, onMessageSend, onChatsChange },
    });
    await w.find('textarea').setValue('once');
    await w.find('.semi-chat-inputBox-sendButton').trigger('click');
    expect(onMessageSend).toHaveBeenCalledTimes(1);
    expect(onChatsChange).toHaveBeenCalledTimes(1);
    expect(w.emitted('messageSend')?.length).toBe(1);
  });
});

describe('Chat parity (remaining official API surface)', () => {
  const roleConfig = { user: { name: 'User' }, assistant: { name: 'Bot' } };

  it('topSlot / bottomSlot as props (node or render fn)', () => {
    const w = mount(Chat, {
      props: { chats: sampleChats, enableUpload: false, topSlot: h('i', { class: 'top-prop' }, 'T'), bottomSlot: () => h('i', { class: 'bottom-prop' }, 'B') },
    });
    const inner = w.find('.semi-chat-inner');
    expect(inner.find('.top-prop').exists()).toBe(true);
    expect(inner.find('.bottom-prop').exists()).toBe(true);
    const html = inner.html();
    expect(html.indexOf('top-prop')).toBeLessThan(html.indexOf('semi-chat-content'));
    expect(html.indexOf('bottom-prop')).toBeGreaterThan(html.indexOf('semi-chat-inputBox'));
  });

  it('roleConfig color is forwarded to Avatar', () => {
    const w = mount(Chat, {
      props: { chats: sampleChats, enableUpload: false, roleConfig: { user: { name: 'U', color: 'blue' }, assistant: { name: 'A', color: 'red' } } },
    });
    expect(w.find('.semi-chat-chatBox-avatar.semi-avatar-blue').exists()).toBe(true);
    expect(w.find('.semi-chat-chatBox-avatar.semi-avatar-red').exists()).toBe(true);
  });

  it('customMarkDownComponents overrides markdown element rendering', () => {
    const Strong = { setup: (_: any, { slots }: any) => () => h('mark', { class: 'custom-strong' }, slots.default?.()) };
    const w = mount(Chat, {
      props: {
        chats: [{ role: 'assistant', id: 'a', content: 'hi **bold**', status: 'complete' }],
        enableUpload: false,
        roleConfig,
        customMarkDownComponents: { strong: Strong },
      },
    });
    expect(w.find('.custom-strong').exists()).toBe(true);
    expect(w.find('.custom-strong').text()).toBe('bold');
  });

  it('markdownRenderProps is spread onto MarkdownRender (className)', () => {
    const w = mount(Chat, {
      props: {
        chats: [{ role: 'assistant', id: 'a', content: 'text', status: 'complete' }],
        enableUpload: false,
        roleConfig,
        markdownRenderProps: { className: 'md-extra-cls' },
      },
    });
    expect(w.find('.semi-chat-chatBox-content .md-extra-cls').exists()).toBe(true);
  });

  it('uploadTipProps wraps the upload button in a Tooltip trigger', () => {
    const w = mount(Chat, {
      attachTo: document.body,
      props: { chats: sampleChats, uploadProps: { action: '/upload' }, uploadTipProps: { content: 'upload tip', motion: false } },
    });
    expect(w.find('.semi-chat-inputBox-uploadButton').exists()).toBe(true);
    expect(w.find('.semi-chat-inputBox-container > span .semi-chat-inputBox-upload').exists()).toBe(true);
    w.unmount();
  });

  it('uploadProps.children replaces the default upload button', () => {
    const w = mount(Chat, {
      props: { chats: sampleChats, uploadProps: { action: '/upload', children: h('button', { class: 'my-upload-trigger' }, 'up') } },
    });
    expect(w.find('.my-upload-trigger').exists()).toBe(true);
    expect(w.find('.semi-chat-inputBox-uploadButton').exists()).toBe(false);
  });

  it('enableUpload false hides the upload node and drag handlers', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false } });
    expect(w.find('.semi-chat-inputBox-upload').exists()).toBe(false);
    await w.find('.semi-chat').trigger('dragover');
    await nextTick();
    expect(w.find('.semi-chat-dropArea').exists()).toBe(false);
  });

  it('dragUpload shows the drop area on dragover and hides it on drop', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, uploadProps: { action: '/upload' } } });
    expect(w.find('.semi-chat-dropArea').exists()).toBe(false);
    await w.find('.semi-chat').trigger('dragover');
    await nextTick();
    expect(w.find('.semi-chat-dropArea').exists()).toBe(true);
    expect(w.find('.semi-chat-dropArea-text').text()).toBe('将文件放到这里');
    await w.find('.semi-chat-dropArea').trigger('drop', { dataTransfer: { files: [] } });
    await nextTick();
    expect(w.find('.semi-chat-dropArea').exists()).toBe(false);
  });

  it('enableUpload { dragUpload: false } never shows the drop area', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: { dragUpload: false } } });
    await w.find('.semi-chat').trigger('dragover');
    await nextTick();
    expect(w.find('.semi-chat-dropArea').exists()).toBe(false);
  });

  it('emits hintClick / chatsChange (listener form) with the hint as new user message', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, hints: ['ask me'], enableUpload: false } });
    await w.find('.semi-chat-hint-item').trigger('click');
    expect(w.emitted('hintClick')?.[0]).toEqual(['ask me']);
    const chats = w.emitted('chatsChange')?.[0]?.[0] as any[];
    expect(chats[chats.length - 1]).toMatchObject({ role: 'user', content: 'ask me' });
  });

  it('emits stopGenerator when the stop button is clicked', async () => {
    const w = mount(Chat, {
      props: {
        enableUpload: false,
        showStopGenerate: true,
        chats: [{ role: 'assistant', id: 'a1', content: '', status: 'incomplete' }],
      },
    });
    await w.find('.semi-chat-action-stop').trigger('click');
    expect(w.emitted('stopGenerator')?.length).toBe(1);
    expect(w.find('.semi-chat-action-backBottom').exists()).toBe(false);
  });

  it('inputChange payload carries inputValue and attachment', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false } });
    await w.find('textarea').setValue('abc');
    const payload = w.emitted('inputChange')?.[0]?.[0] as any;
    expect(payload.inputValue).toBe('abc');
    expect(Array.isArray(payload.attachment)).toBe(true);
  });

  it('messageDelete emits and removes the message from chats via chatsChange', async () => {
    const onMessageDelete = vi.fn();
    const w = mount(Chat, { attachTo: document.body, props: { chats: sampleChats, enableUpload: false, roleConfig, onMessageDelete } });
    const deleteBtn = w.findAll('.semi-chat-chatBox-action-delete-wrap .semi-button')[0];
    await deleteBtn.trigger('click');
    await flushPromises();
    await nextTick();
    const confirm = document.body.querySelector('.semi-popconfirm .semi-button-primary') as HTMLElement;
    expect(confirm).toBeTruthy();
    confirm.click();
    await flushPromises();
    expect(onMessageDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }));
    const chats = w.emitted('chatsChange')?.slice(-1)[0]?.[0] as any[];
    expect(chats.find((c) => c.id === 'u1')).toBeUndefined();
    w.unmount();
  });

  it('continuous messages from the same role hide title and avatar', () => {
    const w = mount(Chat, {
      props: {
        chats: [
          { role: 'assistant', id: 'a1', content: 'one', status: 'complete' },
          { role: 'assistant', id: 'a2', content: 'two', status: 'complete' },
        ],
        enableUpload: false,
        roleConfig,
      },
    });
    expect(w.findAll('.semi-chat-chatBox-title').length).toBe(1);
    expect(w.findAll('.semi-chat-chatBox-avatar-hidden').length).toBe(1);
  });

  it('code blocks in assistant content get the copy top slot with language', () => {
    const fence = '```';
    const w = mount(Chat, {
      props: {
        chats: [{ role: 'assistant', id: 'a', content: 'x\n' + fence + 'js\nconst a = 1;\n' + fence + '\n', status: 'complete' }],
        enableUpload: false,
        roleConfig,
      },
    });
    expect(w.find('.semi-chat-chatBox-content-code').exists()).toBe(true);
    expect(w.find('.semi-chat-chatBox-content-code-topSlot-type').text()).toBe('js');
    expect(w.find('.semi-chat-chatBox-content-code-topSlot-toCopy').text()).toContain('复制');
  });

  it('like / dislike toggle icon state via chatsChange', async () => {
    const w = mount(Chat, { props: { chats: sampleChats, enableUpload: false, roleConfig } });
    const btns = w.findAll('.semi-chat-chatBox')[1].findAll('.semi-chat-chatBox-action-btn');
    expect(btns.length).toBe(5);
    await btns[1].trigger('click');
    const chats = w.emitted('chatsChange')?.slice(-1)[0]?.[0] as any[];
    expect(chats[1].like).toBe(true);
    expect(w.emitted('messageGoodFeedback')?.[0]?.[0]).toMatchObject({ id: 'a1' });
  });
});
