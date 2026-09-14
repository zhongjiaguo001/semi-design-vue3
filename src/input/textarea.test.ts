import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import { TextArea } from './index';

describe('TextArea', () => {
  it('renders wrapper + textarea with defaults', () => {
    const w = mount(TextArea);
    expect(w.classes()).toContain('semi-input-textarea-wrapper');
    const ta = w.find('textarea');
    expect(ta.classes()).toContain('semi-input-textarea');
    expect(ta.attributes('rows')).toBe('4');
    expect(ta.attributes('cols')).toBe('20');
  });

  it('uncontrolled + controlled + v-model', async () => {
    const w = mount(TextArea, { props: { defaultValue: 'a' } });
    await w.find('textarea').setValue('ab');
    expect(w.find('textarea').element.value).toBe('ab');
    expect(w.emitted('change')![0][0]).toBe('ab');
    expect(w.emitted('update:modelValue')![0][0]).toBe('ab');

    const w2 = mount(TextArea, { props: { value: 'x' } });
    await w2.find('textarea').setValue('xy');
    await nextTick();
    expect(w2.find('textarea').element.value).toBe('x');
    await w2.setProps({ value: 'xyz' });
    expect(w2.find('textarea').element.value).toBe('xyz');

    const w3 = mount(TextArea, { props: { modelValue: 'm' } });
    expect(w3.find('textarea').element.value).toBe('m');
  });

  it('disabled / readonly / borderless / validateStatus', () => {
    const w = mount(TextArea, { props: { disabled: true, readonly: true, borderless: true, validateStatus: 'error' } });
    expect(w.classes()).toContain('semi-input-textarea-wrapper-disabled');
    expect(w.classes()).toContain('semi-input-textarea-wrapper-readonly');
    expect(w.classes()).toContain('semi-input-textarea-borderless');
    expect(w.classes()).toContain('semi-input-textarea-wrapper-error');
    expect(w.find('textarea').classes()).toContain('semi-input-textarea-disabled');
    expect(w.find('textarea').attributes('disabled')).toBeDefined();
    expect(w.find('textarea').attributes('readonly')).toBeDefined();
  });

  it('focus / blur / keydown / enterPress', async () => {
    const w = mount(TextArea);
    const ta = w.find('textarea');
    await ta.trigger('focus');
    expect(w.classes()).toContain('semi-input-textarea-wrapper-focus');
    expect(w.emitted('focus')).toHaveLength(1);
    await ta.trigger('keydown', { key: 'Enter', keyCode: 13 });
    expect(w.emitted('keydown')).toHaveLength(1);
    expect(w.emitted('enterPress')).toHaveLength(1);
    await ta.trigger('blur');
    expect(w.classes()).not.toContain('semi-input-textarea-wrapper-focus');
    expect(w.emitted('blur')).toHaveLength(1);
  });

  it('showCounter / maxCount with exceed class', async () => {
    const w = mount(TextArea, { props: { showCounter: true, defaultValue: 'abc' } });
    expect(w.find('.semi-input-textarea-counter').text()).toBe('3');
    const w2 = mount(TextArea, { props: { maxCount: 2, defaultValue: 'abc' } });
    const counter = w2.find('.semi-input-textarea-counter');
    expect(counter.text()).toBe('3/2');
    expect(counter.classes()).toContain('semi-input-textarea-counter-exceed');
    const w3 = mount(TextArea, { props: { maxCount: 10, defaultValue: 'ab', getValueLength: (v: string) => v.length * 2 } });
    expect(w3.find('.semi-input-textarea-counter').text()).toBe('4/10');
  });

  it('showClear shows button on hover with value and clears', async () => {
    const w = mount(TextArea, { props: { showClear: true, defaultValue: 'abc' } });
    expect(w.find('textarea').classes()).toContain('semi-input-textarea-showClear');
    expect(w.find('.semi-input-clearbtn').classes()).toContain('semi-input-clearbtn-hidden');
    await w.trigger('mouseenter');
    expect(w.find('.semi-input-clearbtn').classes()).not.toContain('semi-input-clearbtn-hidden');
    await w.find('.semi-input-clearbtn').trigger('click');
    expect(w.find('textarea').element.value).toBe('');
    expect(w.emitted('clear')).toHaveLength(1);
  });

  it('autosize adds class and resize none; object autosize with maxRows', () => {
    const w = mount(TextArea, { props: { autosize: true } });
    expect(w.find('textarea').classes()).toContain('semi-input-textarea-autosize');
    expect(w.find('textarea').attributes('style')).toContain('resize: none');
    const w2 = mount(TextArea, { props: { autosize: { minRows: 2, maxRows: 5 } as any } });
    expect(w2.find('textarea').classes()).not.toContain('semi-input-textarea-autosize');
    const w3 = mount(TextArea, { props: { autosize: { minRows: 2 } as any } });
    expect(w3.find('textarea').classes()).toContain('semi-input-textarea-autosize');
  });

  it('resize prop sets style and wrapper classes', () => {
    const w = mount(TextArea, { props: { resize: 'both' } });
    expect(w.find('textarea').attributes('style')).toContain('resize: both');
    expect(w.classes()).toContain('semi-input-textarea-wrapper-resizeX');
    expect(w.classes()).toContain('semi-input-textarea-wrapper-resizeY');
    const w2 = mount(TextArea, { props: { resize: 'vertical' } });
    expect(w2.classes()).toContain('semi-input-textarea-wrapper-resizeY');
    expect(w2.classes()).not.toContain('semi-input-textarea-wrapper-resizeX');
  });

  it('showLineNumber renders line numbers', async () => {
    const w = mount(TextArea, { props: { showLineNumber: true, defaultValue: 'a\nb\nc', lineNumberStart: 10, lineNumberClassName: 'ln' } });
    expect(w.classes()).toContain('semi-input-textarea-wrapper-withLineNumber');
    expect(w.find('.semi-input-textarea-content textarea').exists()).toBe(true);
    const items = w.findAll('.semi-input-textarea-lineNumber-item');
    expect(items).toHaveLength(3);
    expect(items[0].text()).toBe('10');
    expect(items[2].text()).toBe('12');
    expect(w.find('.semi-input-textarea-lineNumber').classes()).toContain('ln');
  });

  it('maxLength / minLength / placeholder / attrs / textareaStyle', () => {
    const w = mount(TextArea, { props: { maxLength: 5, minLength: 2, placeholder: 'ph', textareaStyle: { color: 'red' } }, attrs: { id: 't', class: 'cc', style: 'width: 5px' } });
    const ta = w.find('textarea');
    expect(ta.attributes('maxlength')).toBe('5');
    expect(ta.attributes('minlength')).toBe('2');
    expect(ta.attributes('placeholder')).toBe('ph');
    expect(ta.attributes('id')).toBe('t');
    expect(ta.attributes('style')).toContain('color: red');
    expect(w.classes()).toContain('cc');
    expect(w.attributes('style')).toContain('width: 5px');
  });

  it('autoFocus and exposed focus', () => {
    const w = mount(TextArea, { attachTo: document.body, props: { autoFocus: true } });
    expect(document.activeElement).toBe(w.find('textarea').element);
    w.unmount();
    const w2 = mount(TextArea, { attachTo: document.body });
    (w2.vm as any).focus();
    expect(document.activeElement).toBe(w2.find('textarea').element);
    w2.unmount();
  });

  it('composition events', async () => {
    const w = mount(TextArea);
    await w.find('textarea').trigger('compositionstart');
    await w.find('textarea').trigger('compositionend');
    expect(w.emitted('compositionStart')).toHaveLength(1);
    expect(w.emitted('compositionEnd')).toHaveLength(1);
  });
});

describe('TextArea parity extras', () => {
  it('disabledEnterStartNewLine prevents default on plain Enter but not Shift+Enter', async () => {
    const w = mount(TextArea, { props: { disabledEnterStartNewLine: true } });
    const ta = w.find('textarea');
    const e1 = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, cancelable: true } as any);
    ta.element.dispatchEvent(e1);
    expect(e1.defaultPrevented).toBe(true);
    const e2 = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, shiftKey: true, cancelable: true } as any);
    ta.element.dispatchEvent(e2);
    expect(e2.defaultPrevented).toBe(false);
    expect(w.emitted('enterPress')).toHaveLength(2);
  });

  it('user keydown handler can preventDefault on Enter (Shift+Enter newline demo)', async () => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
    };
    const w = mount(TextArea, { props: { onKeydown } });
    const e1 = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, cancelable: true } as any);
    w.find('textarea').element.dispatchEvent(e1);
    expect(e1.defaultPrevented).toBe(true);
  });

  it('maxCount counter uses getValueLength', async () => {
    const w = mount(TextArea, { props: { defaultValue: 'semi design', maxCount: 10, getValueLength: (s: string) => s.replace(/\s/g, '').length } });
    expect(w.find('.semi-input-textarea-counter').text()).toBe('10/10');
    expect(w.find('.semi-input-textarea-counter').classes()).not.toContain('semi-input-textarea-counter-exceed');
  });

  it('textareaStyle height and wrapper style attr are applied separately', () => {
    const w = mount(TextArea, { props: { textareaStyle: { height: '120px' } }, attrs: { style: 'border: 2px solid red' } });
    expect(w.find('textarea').attributes('style')).toContain('height: 120px');
    expect(w.attributes('style')).toContain('border: 2px solid red');
  });
});

describe('TextArea keyboard emits (verifier)', () => {
  it('emits keyup and keypress as declared events', async () => {
    const w = mount(TextArea);
    await w.find('textarea').trigger('keyup', { key: 'a' });
    await w.find('textarea').trigger('keypress', { key: 'a' });
    expect(w.emitted('keyup')).toHaveLength(1);
    expect(w.emitted('keypress')).toHaveLength(1);
    expect((w.emitted('keyup')![0][0] as KeyboardEvent).key).toBe('a');
  });
});
