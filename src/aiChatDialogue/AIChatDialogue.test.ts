import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { h, nextTick } from 'vue';
import AIChatDialogue, { chatCompletionToMessage, responseToMessage, streamingResponseToMessage, streamingChatCompletionToMessage } from './index';

const chats = [
  { id: 'u1', role: 'user', content: 'Hello AI', status: 'completed' },
  { id: 'a1', role: 'assistant', content: 'Hi from dialogue', status: 'completed' },
];

describe('AIChatDialogue', () => {
  it('renders messages, titles and hints', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats,
        hints: ['hint-a'],
        roleConfig: { user: { name: 'You' }, assistant: { name: 'Bot' } },
      },
    });
    expect(w.classes()).toContain('semi-ai-chat-dialogue');
    expect(w.findAll('.semi-ai-chat-dialogue-wrapper').length).toBe(2);
    expect(w.text()).toContain('You');
    expect(w.text()).toContain('Bot');
    expect(w.find('.semi-ai-chat-dialogue-hint-item').exists()).toBe(true);
    expect(w.text()).toContain('hint-a');
  });

  it('hint click notifies parent', async () => {
    const onHintClick = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(AIChatDialogue, { props: { chats, hints: ['do this'], onHintClick, onChatsChange } });
    await w.find('.semi-ai-chat-dialogue-hint-item').trigger('click');
    expect(onHintClick).toHaveBeenCalledWith('do this');
  });

  it('user messages align right in leftRight mode', () => {
    const w = mount(AIChatDialogue, { props: { chats, align: 'leftRight' } });
    const wrappers = w.findAll('.semi-ai-chat-dialogue-container');
    expect(wrappers[0].classes()).toContain('semi-ai-chat-dialogue-container-right');
    expect(wrappers[1].classes()).not.toContain('semi-ai-chat-dialogue-container-right');
  });

  it('selecting shows checkboxes and selectAll', () => {
    const onSelect = vi.fn();
    const w = mount(AIChatDialogue, { props: { chats, selecting: true, onSelect } });
    expect(w.findAll('.semi-ai-chat-dialogue-checkbox').length).toBe(2);
    (w.vm as any).selectAll();
    expect(onSelect).toHaveBeenCalled();
  });

  it('exposes scroll helpers', () => {
    const w = mount(AIChatDialogue, { props: { chats } });
    expect(typeof (w.vm as any).scrollToBottom).toBe('function');
    expect(typeof (w.vm as any).scrollToTop).toBe('function');
    expect((w.vm as any).foundation).toBeTruthy();
  });

  it('statics', () => {
    expect((AIChatDialogue as any).Reasoning).toBeTruthy();
    expect((AIChatDialogue as any).Step).toBeTruthy();
    expect((AIChatDialogue as any).Annotation).toBeTruthy();
    expect((AIChatDialogue as any).Reference).toBeTruthy();
    expect((AIChatDialogue as any).defaultComponents.code).toBeTruthy();
  });
});

describe('AIChatDialogue parity', () => {
  const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' }, system: { name: 'System' } };

  it('prop callbacks fire exactly once and emits are mirrored', async () => {
    const onHintClick = vi.fn();
    const onChatsChange = vi.fn();
    const w = mount(AIChatDialogue, { props: { chats, hints: ['do this'], onHintClick, onChatsChange } });
    await w.find('.semi-ai-chat-dialogue-hint-item').trigger('click');
    expect(onHintClick).toHaveBeenCalledTimes(1);
    expect(w.emitted('hintClick')?.length).toBe(1);
    expect(onChatsChange).toHaveBeenCalledTimes(1);
    const next = onChatsChange.mock.calls[0][0];
    expect(next.length).toBe(3);
    expect(next[2].role).toBe('user');
    expect(next[2].content).toBe('do this');
  });

  it('mode classes: bubble / noBubble / userBubble', () => {
    const b = mount(AIChatDialogue, { props: { chats, mode: 'bubble' } });
    expect(b.find('.semi-ai-chat-dialogue-content-bubble').exists()).toBe(true);
    const n = mount(AIChatDialogue, { props: { chats, mode: 'noBubble' } });
    expect(n.find('.semi-ai-chat-dialogue-content-no-bubble').exists()).toBe(true);
    expect(n.find('.semi-ai-chat-dialogue-content-bubble').exists()).toBe(false);
    const u = mount(AIChatDialogue, { props: { chats, mode: 'userBubble' } });
    expect(u.findAll('.semi-ai-chat-dialogue-content-userBubble').length).toBe(1);
    expect(u.findAll('.semi-ai-chat-dialogue-content-no-bubble').length).toBe(1);
  });

  it('leftAlign keeps user messages on the left', () => {
    const w = mount(AIChatDialogue, { props: { chats, align: 'leftAlign' } });
    expect(w.find('.semi-ai-chat-dialogue-container-right').exists()).toBe(false);
  });

  it('message status: loading, failed and cancelled', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats: [
          { id: 'ok', role: 'assistant', content: 'ok' },
          { id: 'loading', role: 'assistant', status: 'in_progress' },
          { id: 'error', role: 'assistant', content: 'err', status: 'failed' },
          { id: 'cancel', role: 'assistant', content: 'x', status: 'cancelled' },
        ],
        roleConfig,
      },
    });
    expect(w.findAll('.semi-ai-chat-dialogue-content-loading').length).toBe(1);
    expect(w.findAll('.semi-ai-chat-dialogue-content-loading-item').length).toBe(3);
    expect(w.findAll('.semi-ai-chat-dialogue-content-failed').length).toBe(2);
    expect(w.findAll('.semi-ai-chat-dialogue-content-error').length).toBe(1);
    expect(w.findAll('.semi-ai-chat-dialogue-action-hidden').length).toBe(1);
  });

  it('renders text / image / file / reasoning / function_call / annotation content items', () => {
    const w = mount(AIChatDialogue, {
      props: {
        roleConfig,
        chats: [
          {
            id: '2',
            role: 'user',
            content: [
              {
                type: 'message',
                content: [
                  { type: 'input_text', text: 'make similar image' },
                  { type: 'input_image', image_url: 'https://example.com/a.jpeg', file_id: 'f' },
                  { type: 'input_file', file_url: 'https://www.semi.pdf', filename: 'semi.pdf', size: '100KB' },
                  { type: 'input_file', file_url: 'https://www.semi.json', filename: 'semi.json', size: '100KB' },
                  { type: 'input_file', file_url: 'https://www.semi.docx', filename: 'semi.docx', size: '100KB' },
                ],
              },
            ],
          },
          {
            id: '3',
            role: 'assistant',
            content: [
              { type: 'reasoning', status: 'completed', summary: [{ type: 'summary_text', text: 'thinking...' }] },
              { type: 'message', content: [{ type: 'output_text', text: 'Semi Design' }] },
              { type: 'function_call', name: 'get_weather', status: 'completed', arguments: '{"location":"Paris"}' },
              {
                type: 'message',
                content: [
                  {
                    type: 'output_text',
                    text: 'done',
                    annotations: [
                      { title: 'semi', url: 'https://semi.design', logo: 'https://l.png' },
                      { title: 'semi2', url: 'https://semi.design', logo: 'https://l.png' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(w.text()).toContain('make similar image');
    expect(w.find('.semi-ai-chat-dialogue-content-img').exists()).toBe(true);
    expect(w.findAll('.semi-ai-chat-dialogue-content-file').length).toBe(3);
    expect(w.find('.semi-ai-chat-dialogue-content-file-icon-pdf').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-content-file-icon-code').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-content-file-icon-word').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-reasoning-wrapper').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-content-tool-call').text()).toContain('get_weather');
    expect(w.find('.semi-ai-chat-dialogue-annotation-wrapper').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-annotation-content-description').text()).toContain('2');
  });

  it('fileClick / annotationClick callbacks', async () => {
    const onFileClick = vi.fn();
    const onAnnotationClick = vi.fn();
    const w = mount(AIChatDialogue, {
      props: {
        onFileClick,
        onAnnotationClick,
        disabledFileItemClick: true,
        chats: [
          {
            id: '2',
            role: 'user',
            content: [{ type: 'message', content: [{ type: 'input_file', file_url: 'https://www.semi.pdf', filename: 'semi.pdf', size: '1KB' }] }],
          },
          { id: '3', role: 'assistant', content: [{ type: 'message', content: [{ type: 'output_text', text: 'd', annotations: [{ title: 'a', url: 'u' }] }] }] },
        ],
      },
    });
    await w.find('.semi-ai-chat-dialogue-content-file').trigger('click');
    expect(onFileClick).toHaveBeenCalledTimes(1);
    expect(onFileClick.mock.calls[0][0].filename).toBe('semi.pdf');
    expect(w.emitted('fileClick')?.length).toBe(1);
    await w.find('.semi-ai-chat-dialogue-annotation-wrapper').trigger('click');
    expect(onAnnotationClick).toHaveBeenCalledTimes(1);
    expect(onAnnotationClick.mock.calls[0][0][0].title).toBe('a');
  });

  it('references + showReference + onReferenceClick', async () => {
    const onReferenceClick = vi.fn();
    const w = mount(AIChatDialogue, {
      props: {
        showReference: true,
        onReferenceClick,
        roleConfig,
        chats: [
          {
            id: '1',
            role: 'user',
            content: 'quoted message',
            references: [
              { id: '1', type: 'text', content: 'some text' },
              { id: '2', name: 'doc.docx' },
              { id: '3', name: 'Music.mp4' },
              { id: '4', name: 'Image.jpeg', url: 'https://example.com/r.png' },
              { id: '5', name: 'code.json' },
            ],
          },
        ],
      },
    });
    expect(w.findAll('.semi-ai-chat-dialogue-reference').length).toBe(5);
    expect(w.find('.semi-ai-chat-dialogue-reference-icon-word').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-reference-icon-video').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-reference-icon-code').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-reference-img').exists()).toBe(true);
    expect(w.text()).toContain('some text');
    const btn = w.find('.semi-ai-chat-dialogue-content-icon-reference');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(onReferenceClick).toHaveBeenCalledTimes(1);
    expect(onReferenceClick.mock.calls[0][0]).toEqual({ type: 'text', content: 'quoted message' });
    expect(w.emitted('referenceClick')?.length).toBe(1);
  });

  it('selecting: checkbox toggles, selectAll / deselectAll, wrapper-selected class', async () => {
    const onSelect = vi.fn();
    const w = mount(AIChatDialogue, { props: { chats, selecting: true, onSelect } });
    (w.vm as any).selectAll();
    await nextTick();
    expect(onSelect).toHaveBeenLastCalledWith(['u1', 'a1']);
    expect(w.findAll('.semi-ai-chat-dialogue-wrapper-selected').length).toBe(2);
    (w.vm as any).deselectAll();
    await nextTick();
    expect(onSelect).toHaveBeenLastCalledWith([]);
    expect(w.findAll('.semi-ai-chat-dialogue-wrapper-selected').length).toBe(0);
    await w.find('.semi-ai-chat-dialogue-checkbox .semi-checkbox').trigger('click');
    expect(onSelect).toHaveBeenLastCalledWith(['u1']);
    expect(w.emitted('select')?.length).toBe(3);
  });

  it('like / dislike / reset / edit actions notify once and update chats', async () => {
    const onChatsChange = vi.fn();
    const onMessageGoodFeedback = vi.fn();
    const onMessageBadFeedback = vi.fn();
    const onMessageReset = vi.fn();
    const onMessageEdit = vi.fn();
    const w = mount(AIChatDialogue, {
      props: { chats, roleConfig, onChatsChange, onMessageGoodFeedback, onMessageBadFeedback, onMessageReset, onMessageEdit },
    });
    const actions = w.findAll('.semi-ai-chat-dialogue-action');
    expect(actions.length).toBe(2);
    // assistant (last) action bar: copy, reset, share, like, dislike, more
    const assistantBtns = actions[1].findAll('button');
    expect(assistantBtns.length).toBe(6);
    await assistantBtns[3].trigger('click'); // like
    expect(onMessageGoodFeedback).toHaveBeenCalledTimes(1);
    expect(onMessageGoodFeedback.mock.calls[0][0].id).toBe('a1');
    expect(onChatsChange).toHaveBeenCalledTimes(1);
    expect(onChatsChange.mock.calls[0][0][1].like).toBe(true);
    await assistantBtns[4].trigger('click'); // dislike
    expect(onMessageBadFeedback).toHaveBeenCalledTimes(1);
    expect(w.emitted('messageBadFeedback')?.length).toBe(1);
    await assistantBtns[1].trigger('click'); // reset
    expect(onMessageReset).toHaveBeenCalledTimes(1);
    expect(w.emitted('messageReset')?.length).toBe(1);
    // user action bar: copy, share, edit, more
    const userBtns = actions[0].findAll('button');
    expect(userBtns.length).toBe(4);
    await userBtns[2].trigger('click'); // edit
    expect(onMessageEdit).toHaveBeenCalledTimes(1);
    expect(w.emitted('messageEdit')?.length).toBe(1);
  });

  it('showReset=false hides reset button', () => {
    const w = mount(AIChatDialogue, { props: { chats, showReset: false } });
    const assistantBtns = w.findAll('.semi-ai-chat-dialogue-action')[1].findAll('button');
    expect(assistantBtns.length).toBe(5);
  });

  it('messageEditRender renders when the user message is editing', () => {
    const messageEditRender = vi.fn(() => h('div', { class: 'my-edit' }, 'editing'));
    const w = mount(AIChatDialogue, {
      props: { chats: [{ id: 'u1', role: 'user', content: 'Hello', editing: true }], messageEditRender },
    });
    expect(w.find('.my-edit').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-content-editing').exists()).toBe(true);
    expect(messageEditRender).toHaveBeenCalled();
  });

  it('renderHintBox / hintCls / hintStyle', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats,
        hints: ['a', 'b'],
        hintCls: 'my-hints',
        hintStyle: { color: 'red' },
        renderHintBox: ({ content, index }: any) => h('div', { class: 'my-hint', key: index }, content),
      },
    });
    const section = w.find('.semi-ai-chat-dialogue-hints');
    expect(section.classes()).toContain('my-hints');
    expect(section.attributes('style')).toContain('color: red');
    expect(w.findAll('.my-hint').length).toBe(2);
  });

  it('dialogueRenderConfig: title / avatar / action / content / full', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats,
        roleConfig,
        dialogueRenderConfig: {
          renderDialogueTitle: (p: any) => h('div', { class: 'my-title' }, 'My-' + p.role.name),
          renderDialogueAvatar: (p: any) => h('span', { class: 'my-avatar' }, p.role.name),
          renderDialogueAction: (p: any) => h('div', { class: ['my-action', p.className] }, [p.defaultActions[0]]),
          renderDialogueContent: (p: any) => h('div', { class: 'my-content' }, [p.defaultContent]),
        },
      },
    });
    expect(w.findAll('.my-title').length).toBe(2);
    expect(w.text()).toContain('My-User');
    expect(w.findAll('.my-avatar').length).toBe(2);
    expect(w.findAll('.my-action').length).toBe(2);
    expect(w.findAll('.my-action button').length).toBe(2);
    expect(w.findAll('.my-content .semi-ai-chat-dialogue-content-wrapper').length).toBe(2);

    const full = mount(AIChatDialogue, {
      props: {
        chats,
        roleConfig,
        dialogueRenderConfig: {
          renderFullDialogue: (p: any) => h('div', { class: ['my-full', p.className] }, [p.defaultNodes.title, p.defaultNodes.content]),
        },
      },
    });
    expect(full.findAll('.my-full').length).toBe(2);
    expect(full.find('.semi-ai-chat-dialogue-wrapper').exists()).toBe(false);
  });

  it('renderDialogueContentItem: custom type, nested tool call, input_text and default', () => {
    const w = mount(AIChatDialogue, {
      props: {
        roleConfig,
        chats: [
          { id: '1', role: 'user', content: 'hello' },
          { id: '3', role: 'user', content: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hi' }] }] },
          {
            id: '4',
            role: 'assistant',
            content: [
              { type: 'reasoning', summary: [{ type: 'summary_text', text: 'r' }], status: 'completed' },
              { type: 'function_call', name: 'create_travel_guide', arguments: '{}', status: 'completed' },
              { type: 'plan', content: [{ summary: 's1', steps: [{ summary: 'a', description: 'b' }] }, { summary: 's2', steps: [] }] },
            ],
          },
        ],
        renderDialogueContentItem: {
          function_call: { create_travel_guide: (item: any) => h('div', { class: 'my-fc' }, 'Function Tool Call: ' + item.name) },
          input_text: (item: any, message: any) => h('div', { class: 'my-text-' + message.role }, item.text),
          default: (item: any, message: any) => h('div', { class: 'my-default-' + message.role }, item),
          plan: (item: any) =>
            h((AIChatDialogue as any).Step, {
              steps: item.content.map((c: any) => ({ summary: c.summary, actions: c.steps, status: 'completed' })),
            }),
        },
      },
    });
    expect(w.find('.my-fc').text()).toContain('create_travel_guide');
    expect(w.find('.my-text-user').text()).toBe('hi');
    expect(w.find('.my-default-user').text()).toBe('hello');
    expect(w.findAll('.semi-ai-chat-dialogue-step').length).toBe(2);
    expect(w.findAll('.semi-ai-chat-dialogue-step-action').length).toBe(1);
    expect(w.findAll('.semi-ai-chat-dialogue-content-custom-renderer').length).toBeGreaterThanOrEqual(4);
  });

  it('Reasoning widget customRenderer; Annotation widget description + maxCount + onClick', async () => {
    const customRenderer = vi.fn((p: any) => h('div', { class: 'my-reason' }, p.summary[0].text));
    const r = mount((AIChatDialogue as any).Reasoning, {
      props: { status: 'in_progress', summary: [{ type: 'summary_text', text: 'deep' }], customRenderer },
    });
    expect(r.find('.my-reason').text()).toBe('deep');
    expect(r.find('.semi-ai-chat-dialogue-reasoning-header-title').exists()).toBe(true);
    expect(customRenderer).toHaveBeenCalled();
    // completed => collapsed by default
    const done = mount((AIChatDialogue as any).Reasoning, { props: { status: 'completed', summary: [{ text: 'x' }] } });
    expect(done.find('.semi-collapsible-wrapper').attributes('style')).toContain('height: 0px');
    await done.find('.semi-ai-chat-dialogue-reasoning-wrapper').trigger('click');
    expect(done.find('.semi-ai-chat-dialogue-reasoning-content').exists()).toBe(true);

    const onClick = vi.fn();
    const a = mount((AIChatDialogue as any).Annotation, {
      props: { description: 'refs', maxCount: 3, onClick, annotation: [{ logo: 'l1' }, { logo: 'l2' }, { logo: 'l3' }, { logo: 'l4' }, { logo: 'l5' }] },
    });
    expect(a.find('.semi-ai-chat-dialogue-annotation-content-description').text()).toBe('refs');
    expect(a.find('.semi-ai-chat-dialogue-annotation-content-logo-renderMore').exists()).toBe(true);
    await a.find('.semi-ai-chat-dialogue-annotation-wrapper').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][1].length).toBe(5);
  });

  it('defaultComponents.code renders language tag + copy button', () => {
    const Code = (AIChatDialogue as any).defaultComponents.code;
    const w = mount(Code, { props: { className: 'language-jsx' }, slots: { default: () => 'const a = 1;' } });
    expect(w.find('.semi-ai-chat-dialogue-code').exists()).toBe(true);
    expect(w.find('.semi-ai-chat-dialogue-code-topSlot-type').text()).toBe('jsx');
    expect(w.find('.semi-ai-chat-dialogue-code-topSlot-copy-wrapper').exists()).toBe(true);
    const plain = mount(Code, { props: {}, slots: { default: () => 'x' } });
    expect(plain.find('.semi-ai-chat-dialogue-code').exists()).toBe(false);
  });

  it('escapeHtml escapes user html but not assistant', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats: [
          { id: 'u', role: 'user', content: '<b>bold</b>' },
          { id: 'a', role: 'assistant', content: '<b>bold</b>' },
        ],
      },
    });
    const contents = w.findAll('.semi-ai-chat-dialogue-content-wrapper');
    // user raw markdown is html-escaped before reaching MarkdownRender, assistant is not
    expect(contents[0].text()).toContain('&lt;b>');
    expect(contents[1].text()).not.toContain('&lt;');
    const off = mount(AIChatDialogue, { props: { escapeHtml: false, chats: [{ id: 'u', role: 'user', content: '<b>bold</b>' }] } });
    expect(off.find('.semi-ai-chat-dialogue-content-wrapper').text()).not.toContain('&lt;');
  });

  it('roleConfig supports Map keyed by message.name', () => {
    const w = mount(AIChatDialogue, {
      props: {
        chats: [{ id: 'a', role: 'assistant', name: 'bot-2', content: 'x' }],
        roleConfig: { assistant: new Map([['bot-2', { name: 'Second Bot' }]]) },
      },
    });
    expect(w.find('.semi-ai-chat-dialogue-title').text()).toBe('Second Bot');
  });

  it('className / style / data attrs on root', () => {
    const w = mount(AIChatDialogue, { props: { chats, className: 'foo', style: { height: '10px' } }, attrs: { 'data-x': '1' } });
    expect(w.classes()).toContain('foo');
    expect(w.attributes('style')).toContain('height: 10px');
    expect(w.attributes('data-x')).toBe('1');
  });

  it('exports data adapters that produce renderable messages', () => {
    const msgs = chatCompletionToMessage({
      id: 'c',
      object: 'chat.completion',
      created: 1,
      model: 'm',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Hello!', tool_calls: [{ id: 'call', type: 'function', function: { name: 'f', arguments: '{}' } }] },
          finish_reason: 'stop',
        },
      ],
    } as any);
    expect(msgs.length).toBe(1);
    const w = mount(AIChatDialogue, { props: { chats: msgs } });
    expect(w.text()).toContain('Hello!');
    expect(typeof responseToMessage).toBe('function');
    expect(typeof streamingResponseToMessage).toBe('function');
    expect(typeof streamingChatCompletionToMessage).toBe('function');
  });
});
