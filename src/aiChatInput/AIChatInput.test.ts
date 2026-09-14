import { mount, flushPromises } from '@vue/test-utils';

const emptyRect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() { return this; } };
if (typeof Text !== 'undefined' && !(Text.prototype as any).getClientRects) {
  (Text.prototype as any).getClientRects = () => ({ length: 0, item: () => null });
  (Text.prototype as any).getBoundingClientRect = () => emptyRect;
}
import { nextTick, h } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import AIChatInput from './index';

const waitEditor = async (w: any) => {
  await flushPromises();
  await nextTick();
  await flushPromises();
  return (w.vm as any).getEditor?.();
};

describe('AIChatInput', () => {
  it('renders editor chrome and send button', async () => {
    const w = mount(AIChatInput, { props: { placeholder: 'Ask anything', className: 'mine' } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput').classes()).toContain('mine');
    expect(w.find('.semi-aiChatInput-editor-content').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-footer').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-footer-action-send').exists()).toBe(true);
    w.unmount();
  });

  it('send is disabled until there is content, then emits messageSend', async () => {
    const onMessageSend = vi.fn();
    const w = mount(AIChatInput, { attachTo: document.body, props: { onMessageSend, showUploadButton: false } });
    const editor = await waitEditor(w);
    expect(editor).toBeTruthy();
    expect(w.find('.semi-aiChatInput-footer-action-send-disabled').exists()).toBe(true);
    (w.vm as any).setContent('hello ai');
    await nextTick();
    await flushPromises();
    await nextTick();
    expect(w.find('.semi-aiChatInput-footer-action-send-disabled').exists()).toBe(false);
    await w.find('.semi-aiChatInput-footer-action-send').trigger('click');
    expect(onMessageSend).toHaveBeenCalled();
    const payload = onMessageSend.mock.calls[0][0];
    expect(payload.inputContents.some((c: any) => c.text === 'hello ai')).toBe(true);
    w.unmount();
  });

  it('generating shows stop and emits stopGenerate', async () => {
    const onStopGenerate = vi.fn();
    const w = mount(AIChatInput, { props: { generating: true, onStopGenerate } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-footer-action-stop').exists()).toBe(true);
    await w.find('.semi-aiChatInput-footer-action-stop').trigger('click');
    expect(onStopGenerate).toHaveBeenCalled();
    w.unmount();
  });

  it('renders references and selected skill chip after select', async () => {
    const onSkillChange = vi.fn();
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: {
        showUploadButton: false,
        skillHotKey: '/',
        skills: [{ label: 'Translate', value: 'tr' }],
        references: [{ id: 'r1', type: 'text', content: 'quoted' }],
        onSkillChange,
      },
    });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-reference').exists()).toBe(true);
    expect(w.text()).toContain('quoted');
    const editorRoot = w.find('.semi-aiChatInput-editor-content');
    expect(editorRoot.exists()).toBe(true);
    await editorRoot.trigger('keydown', { key: '/' });
    await nextTick();
    const skillItem = document.querySelector('.semi-aiChatInput-skill-item') as HTMLElement | null;
    expect(skillItem).toBeTruthy();
    skillItem?.click();
    await nextTick();
    await flushPromises();
    expect(onSkillChange).toHaveBeenCalled();
    expect(w.find('.skill-slot').exists() || document.querySelector('.skill-slot')).toBeTruthy();
    w.unmount();
  });

  it('exposes send / focus / setContent / getEditor / changeTemplateVisible', async () => {
    const w = mount(AIChatInput, { props: {} });
    await waitEditor(w);
    const vm = w.vm as any;
    expect(typeof vm.send).toBe('function');
    expect(typeof vm.focus).toBe('function');
    expect(typeof vm.setContent).toBe('function');
    expect(typeof vm.getEditor).toBe('function');
    expect(typeof vm.changeTemplateVisible).toBe('function');
    expect(typeof vm.deleteUploadFile).toBe('function');
    expect((AIChatInput as any).Configure).toBeTruthy();
    expect((AIChatInput as any).getConfigureItem).toBeTruthy();
    expect(vm.getEditor()?.commands).toBeTruthy();
    w.unmount();
  });

  it('renderUploadButton customizes trigger', async () => {
    const w = mount(AIChatInput, {
      props: {
        renderUploadButton: () => h('button', { class: 'custom-upload', type: 'button' }, 'up'),
      },
    });
    await waitEditor(w);
    expect(w.find('.custom-upload').exists()).toBe(true);
    w.unmount();
  });
});

const settle = async () => {
  await nextTick();
  await flushPromises();
  await nextTick();
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ZW = /﻿/g;

describe('AIChatInput parity', () => {
  it('generating=true clears editor + attachments (clearContentOnGenerating), clearContentOnGenerating=false keeps content', async () => {
    const w = mount(AIChatInput, { attachTo: document.body, props: { generating: false, showUploadButton: false } });
    const editor = await waitEditor(w);
    (w.vm as any).setContent('draft text');
    await settle();
    expect(editor.getText()).toContain('draft text');
    await w.setProps({ generating: true });
    await settle();
    expect(editor.getText().replace(ZW, '')).toBe('');
    w.unmount();

    const w2 = mount(AIChatInput, { attachTo: document.body, props: { generating: false, clearContentOnGenerating: false, showUploadButton: false } });
    const editor2 = await waitEditor(w2);
    (w2.vm as any).setContent('keep me');
    await settle();
    await w2.setProps({ generating: true });
    await settle();
    expect(editor2.getText()).toContain('keep me');
    w2.unmount();
  });

  it('setContentWhileSaveTool keeps the selected skill slot; deleteContent is safe', async () => {
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: { showUploadButton: false, skills: [{ label: 'Write', value: 'writing', hasTemplate: true }], skillHotKey: '/' },
    });
    const editor = await waitEditor(w);
    (w.vm as any).foundation.handleSkillSelect({ label: 'Write', value: 'writing', hasTemplate: true });
    await settle();
    expect(editor.getHTML()).toContain('skill-slot');
    (w.vm as any).setContentWhileSaveTool('hello template');
    await settle();
    const html = editor.getHTML();
    expect(html).toContain('skill-slot');
    expect(html).toContain('hello template');
    expect(w.text()).toContain('模板');
    expect(() => (w.vm as any).deleteContent({ uniqueKey: 'none' })).not.toThrow();
    w.unmount();
  });

  it('suggestions prop change opens the suggestion popover and onSuggestClick fires on click', async () => {
    const onSuggestClick = vi.fn();
    const w = mount(AIChatInput, { attachTo: document.body, props: { showUploadButton: false, suggestions: [], onSuggestClick } });
    await waitEditor(w);
    await w.setProps({ suggestions: ['天气如何', '空气质量'] });
    await settle();
    await wait(50);
    await settle();
    const item = document.querySelector('.semi-aiChatInput-suggestion-item') as HTMLElement | null;
    expect(item).toBeTruthy();
    item?.click();
    await settle();
    expect(onSuggestClick).toHaveBeenCalledWith('天气如何');
    expect(w.emitted('suggestClick')).toBeTruthy();
    await w.setProps({ suggestions: [] });
    await settle();
    expect((w.vm as any).state.suggestionVisible).toBe(false);
    w.unmount();
  });

  it('changeTemplateVisible notifies onTemplateVisibleChange and renders renderTemplate with templatesCls', async () => {
    const onTemplateVisibleChange = vi.fn();
    const renderTemplate = vi.fn((_skill: any, onTemplateClick: any) => h('button', { class: 'tpl-btn', onClick: () => onTemplateClick('from template') }, 'tpl'));
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: { showUploadButton: false, showTemplateButton: true, renderTemplate, onTemplateVisibleChange, templatesCls: 'my-tpl' },
    });
    const editor = await waitEditor(w);
    (w.vm as any).changeTemplateVisible(true);
    await settle();
    await wait(50);
    await settle();
    expect(onTemplateVisibleChange).toHaveBeenCalledWith(true);
    expect(w.emitted('templateVisibleChange')?.[0]).toEqual([true]);
    expect(document.querySelector('.semi-aiChatInput-template.my-tpl')).toBeTruthy();
    (document.querySelector('.tpl-btn') as HTMLElement).click();
    await settle();
    expect(editor.getText()).toContain('from template');
    w.unmount();
  });

  it('references: default rendering, click/delete callbacks, renderReference, showReference=false', async () => {
    const onReferenceClick = vi.fn();
    const onReferenceDelete = vi.fn();
    const refs = [
      { id: '1', type: 'text', content: 'quoted text' },
      { id: '2', name: 'doc.pdf' },
      { id: '3', name: 'pic.png', url: 'x.png' },
    ];
    const w = mount(AIChatInput, { attachTo: document.body, props: { showUploadButton: false, references: refs, onReferenceClick, onReferenceDelete } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-references').exists()).toBe(true);
    expect(w.findAll('.semi-aiChatInput-reference').length).toBe(3);
    expect(w.find('.semi-aiChatInput-reference-icon.semi-aiChatInput-ref-icon-pdf').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-reference-img').exists()).toBe(true);
    await w.findAll('.semi-aiChatInput-reference')[0].trigger('click');
    expect(onReferenceClick).toHaveBeenCalledWith(refs[0]);
    expect(w.emitted('referenceClick')).toBeTruthy();
    await w.findAll('.semi-aiChatInput-reference-delete')[1].trigger('click');
    expect(onReferenceDelete).toHaveBeenCalledWith(refs[1]);
    expect(onReferenceClick).toHaveBeenCalledTimes(1);
    await w.setProps({ renderReference: (r: any) => h('i', { class: 'custom-ref' }, r.id) });
    expect(w.findAll('.custom-ref').length).toBe(3);
    await w.setProps({ showReference: false });
    expect(w.find('.semi-aiChatInput-references').exists()).toBe(false);
    w.unmount();
  });

  it('attachments from uploadProps.defaultFileList render with icons/progress and deleteUploadFile removes + notifies once', async () => {
    const onUploadChange = vi.fn();
    const onRemove = vi.fn();
    const uploadProps = {
      action: '/upload',
      onRemove,
      defaultFileList: [
        { uid: '1', name: 'dy.jpeg', status: 'success', size: '130kb', url: 'a.png' },
        { uid: '5', name: 'report.pdf', percent: 50, status: 'uploading', size: '222kb' },
      ],
    };
    const w = mount(AIChatInput, { attachTo: document.body, props: { uploadProps, onUploadChange } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-scroll-wrapper').exists()).toBe(true);
    expect(w.findAll('.semi-aiChatInput-attachment').length).toBe(2);
    expect(w.find('.semi-aiChatInput-attachment-img').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-attachment-icon.semi-aiChatInput-ref-icon-pdf').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-attachment-progress').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-footer-action-send-disabled').exists()).toBe(false);
    (w.vm as any).deleteUploadFile(uploadProps.defaultFileList[0]);
    await settle();
    await wait(10);
    await settle();
    expect(w.findAll('.semi-aiChatInput-attachment').length).toBe(1);
    expect(onRemove).toHaveBeenCalled();
    expect(onUploadChange).toHaveBeenCalledTimes(1);
    expect(w.emitted('uploadChange')?.length).toBe(1);
    await w.setProps({ showUploadFile: false });
    expect(w.find('.semi-aiChatInput-attachment').exists()).toBe(false);
    w.unmount();
  });

  it('renderTopSlot receives references/attachments/content and respects topSlotPosition', async () => {
    const renderTopSlot = vi.fn((p: any) => h('div', { class: 'top-slot' }, `${p.references.length}-${p.attachments.length}-${p.content.length}`));
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: { showUploadButton: false, renderTopSlot, references: [{ id: 'a', type: 'text', content: 'x' }], topSlotPosition: 'bottom' },
    });
    await waitEditor(w);
    (w.vm as any).setContent('abc');
    await settle();
    expect(w.find('.top-slot').exists()).toBe(true);
    expect(w.find('.top-slot').text()).toBe('1-0-1');
    const lastArgs = renderTopSlot.mock.calls[renderTopSlot.mock.calls.length - 1][0];
    expect(typeof lastArgs.handleReferenceDelete).toBe('function');
    expect(typeof lastArgs.handleUploadFileDelete).toBe('function');
    const children = Array.from(w.find('.semi-aiChatInput').element.children);
    const refIdx = children.findIndex((c) => c.classList.contains('semi-aiChatInput-references'));
    const slotIdx = children.findIndex((c) => c.classList.contains('top-slot'));
    expect(slotIdx).toBeGreaterThan(refIdx);
    w.unmount();
  });

  it('round=false removes the round footer class; canSend overrides; renderActionArea gets menuItem + className', async () => {
    const renderActionArea = vi.fn((p: any) => h('div', { class: ['custom-action', p.className] }, p.menuItem));
    const w = mount(AIChatInput, { props: { round: false, canSend: true, renderActionArea } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-footer-round').exists()).toBe(false);
    expect(w.find('.semi-aiChatInput-footer-action-send-disabled').exists()).toBe(false);
    expect(w.find('.custom-action.semi-aiChatInput-footer-action').exists()).toBe(true);
    expect(w.find('.custom-action .semi-aiChatInput-footer-action-upload').exists()).toBe(true);
    expect(w.find('.custom-action .semi-aiChatInput-footer-action-send').exists()).toBe(true);
    w.unmount();
  });

  it('renderConfigureArea with Configure items registers initValue and reports onConfigureChange / setup in messageSend', async () => {
    const Configure = (AIChatInput as any).Configure;
    const onConfigureChange = vi.fn();
    const onMessageSend = vi.fn();
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: {
        showUploadButton: false,
        onConfigureChange,
        onMessageSend,
        renderConfigureArea: () => [
          h(Configure.Select, { optionList: [{ value: 'a', label: 'A' }], field: 'model', initValue: 'a' }),
          h(Configure.Button, { field: 'onlineSearch' }, () => '联网搜索'),
          h(Configure.Mcp, { options: [{ label: 'x', value: 'x' }], showConfigure: true }),
          h(Configure.RadioButton, { options: [{ label: '极速', value: 'fast' }], field: 'thinkType', initValue: 'fast' }),
        ],
      },
    });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-footer-configure').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-footer-configure-select').exists()).toBe(true);
    expect(w.find('.semi-aiChatInput-footer-configure-mcp-trigger').text()).toContain('MCP · 1');
    expect(w.find('.semi-aiChatInput-footer-configure-radio-button').exists()).toBe(true);
    await w.find('.semi-aiChatInput-footer-configure-button').trigger('click');
    expect(onConfigureChange).toHaveBeenCalled();
    expect(onConfigureChange.mock.calls[0][1]).toEqual({ onlineSearch: true });
    expect(w.emitted('configureChange')).toBeTruthy();
    (w.vm as any).setContent('go');
    await settle();
    (w.vm as any).send();
    expect(onMessageSend).toHaveBeenCalled();
    expect(onMessageSend.mock.calls[0][0].setup).toMatchObject({ model: 'a', onlineSearch: true, thinkType: 'fast' });
    w.unmount();
  });

  it('renderSkillItem customises skill list items', async () => {
    const w = mount(AIChatInput, {
      attachTo: document.body,
      props: {
        showUploadButton: false,
        skills: [{ label: 'T', value: 't' }],
        skillHotKey: '/',
        renderSkillItem: ({ skill, className, onClick }: any) => h('div', { class: [className, 'my-skill'], onClick }, skill.label),
      },
    });
    await waitEditor(w);
    await w.find('.semi-aiChatInput-editor-content').trigger('keydown', { key: '/' });
    await settle();
    await wait(30);
    expect(document.querySelector('.my-skill')).toBeTruthy();
    w.unmount();
  });

  it('onFocus/onBlur props + emits fire from the editor, onPaste forwards clipboard event', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onPaste = vi.fn();
    const w = mount(AIChatInput, { attachTo: document.body, props: { showUploadButton: false, onFocus, onBlur, onPaste } });
    await waitEditor(w);
    const content = w.find('.semi-aiChatInput-editor-content');
    await content.trigger('focus');
    await content.trigger('blur');
    await content.trigger('paste');
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(onPaste).toHaveBeenCalled();
    expect(w.emitted('focus')).toBeTruthy();
    expect(w.emitted('blur')).toBeTruthy();
    expect(w.emitted('paste')).toBeTruthy();
    w.unmount();
  });

  it('sendHotKey: Enter sends (default), shift+enter mode does not send on plain Enter', async () => {
    const onMessageSend = vi.fn();
    const w = mount(AIChatInput, { attachTo: document.body, props: { showUploadButton: false, onMessageSend } });
    const editor = await waitEditor(w);
    (w.vm as any).setContent('hi');
    await settle();
    const handled = (w.vm as any).foundation.handRichTextArealKeyDown(editor.view, { key: 'Enter', shiftKey: false, preventDefault() {} });
    expect(handled).toBe(true);
    expect(onMessageSend).toHaveBeenCalledTimes(1);
    await w.setProps({ sendHotKey: 'shift+enter' });
    (w.vm as any).setContent('hi2');
    await settle();
    (w.vm as any).foundation.handRichTextArealKeyDown(editor.view, { key: 'Enter', shiftKey: false, preventDefault() {} });
    expect(onMessageSend).toHaveBeenCalledTimes(1);
    (w.vm as any).foundation.handRichTextArealKeyDown(editor.view, { key: 'Enter', shiftKey: true, preventDefault() {} });
    expect(onMessageSend).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('uploadTipProps wraps upload button in a Tooltip; showUploadButton=false hides it', async () => {
    const w = mount(AIChatInput, { props: { uploadTipProps: { content: 'tip' } } });
    await waitEditor(w);
    expect(w.find('.semi-aiChatInput-footer-action-upload').exists()).toBe(true);
    await w.setProps({ showUploadButton: false });
    expect(w.find('.semi-aiChatInput-footer-action-upload').exists()).toBe(false);
    w.unmount();
  });

  it('static getCustomSlotAttribute and Configure sub-components exist', () => {
    expect(typeof (AIChatInput as any).getCustomSlotAttribute).toBe('function');
    const C = (AIChatInput as any).Configure;
    expect(C.Button && C.Select && C.Mcp && C.RadioButton).toBeTruthy();
  });
});
