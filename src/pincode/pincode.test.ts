import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PinCode from './index';

async function settle() {
  await flushPromises();
  await nextTick();
  await flushPromises();
  await nextTick();
}
const values = (w: any) => w.findAll('input').map((i: any) => (i.element as HTMLInputElement).value);

describe('PinCode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders count inputs inside the wrapper with numeric inputmode', () => {
    const wrapper = mount(PinCode, { props: { autoFocus: false } });
    expect(wrapper.classes()).toContain('semi-pincode-wrapper');
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(6);
    inputs.forEach((i) => expect(i.attributes('inputmode')).toBe('numeric'));
    expect(wrapper.findAll('.semi-input-wrapper')).toHaveLength(6);
  });

  it('count / size / disabled / class / style / attrs', () => {
    const wrapper = mount(PinCode, { props: { count: 4, size: 'large', disabled: true, autoFocus: false }, attrs: { class: 'c', style: 'gap: 4px', 'data-x': '1' } });
    expect(wrapper.findAll('input')).toHaveLength(4);
    expect(wrapper.classes()).toContain('c');
    expect(wrapper.attributes('style')).toContain('gap: 4px');
    expect(wrapper.attributes('data-x')).toBe('1');
    wrapper.findAll('.semi-input-wrapper').forEach((w) => {
      expect(w.classes()).toContain('semi-input-wrapper-large');
      expect(w.classes()).toContain('semi-input-wrapper-disabled');
    });
    wrapper.findAll('input').forEach((i) => expect(i.attributes('disabled')).toBeDefined());
  });

  it('format=mixed / RegExp / function change inputmode and validation', async () => {
    const w1 = mount(PinCode, { props: { count: 2, format: 'mixed', autoFocus: false } });
    expect(w1.find('input').attributes('inputmode')).toBe('text');
    await w1.findAll('input')[0].setValue('a');
    await settle();
    expect(w1.emitted('change')![0]).toEqual(['a']);
    await w1.findAll('input')[1].setValue('!');
    await settle();
    expect(w1.emitted('change')).toHaveLength(1);
    const w2 = mount(PinCode, { props: { count: 2, format: /^[xy]$/, autoFocus: false } });
    await w2.findAll('input')[0].setValue('x');
    await settle();
    expect(w2.emitted('change')![0]).toEqual(['x']);
    await w2.findAll('input')[1].setValue('z');
    await settle();
    expect(w2.emitted('change')).toHaveLength(1);
    const fn = vi.fn((v: string) => v === '7');
    const w3 = mount(PinCode, { props: { count: 2, format: fn, autoFocus: false } });
    await w3.findAll('input')[0].setValue('7');
    await settle();
    expect(fn).toHaveBeenCalledWith('7');
    expect(w3.emitted('change')![0]).toEqual(['7']);
  });

  it('format=number rejects letters', async () => {
    const wrapper = mount(PinCode, { props: { count: 2, autoFocus: false } });
    await wrapper.find('input').setValue('a');
    await settle();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(values(wrapper)).toEqual(['', '']);
  });

  it('autoFocus focuses the first input by default', () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 2 } });
    expect(document.activeElement).toBe(wrapper.findAll('input')[0].element);
    wrapper.unmount();
    const w2 = mount(PinCode, { attachTo: document.body, props: { count: 2, autoFocus: false } });
    expect(document.activeElement).not.toBe(w2.findAll('input')[0].element);
    w2.unmount();
  });

  it('typing advances focus, emits change / update:modelValue, and complete on the last input', async () => {
    const onComplete = vi.fn();
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, onComplete } });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('1');
    await settle();
    expect(wrapper.emitted('change')![0]).toEqual(['1']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1']);
    expect(wrapper.emitted('update:value')![0]).toEqual(['1']);
    expect(document.activeElement).toBe(inputs[1].element);
    await inputs[1].setValue('2');
    await settle();
    expect(document.activeElement).toBe(inputs[2].element);
    expect(wrapper.emitted('complete')).toBeUndefined();
    await inputs[2].setValue('3');
    await settle();
    expect(values(wrapper)).toEqual(['1', '2', '3']);
    expect(wrapper.emitted('change')![2]).toEqual(['123']);
    expect(onComplete).toHaveBeenCalledWith('123');
    expect(wrapper.emitted('complete')![0]).toEqual(['123']);
    expect(document.activeElement).not.toBe(inputs[2].element);
    wrapper.unmount();
  });

  it('only the last typed character is taken (overwrite)', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 2, defaultValue: '1' } });
    await wrapper.findAll('input')[0].setValue('15');
    await settle();
    expect(values(wrapper)[0]).toBe('5');
    expect(wrapper.emitted('change')![0]).toEqual(['5']);
    wrapper.unmount();
  });

  it('defaultValue fills the inputs', () => {
    const wrapper = mount(PinCode, { props: { count: 4, defaultValue: '12', autoFocus: false } });
    expect(values(wrapper)).toEqual(['1', '2', '', '']);
  });

  it('controlled value: typing emits but inputs follow the prop; prop change updates inputs', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, value: '12', autoFocus: false } });
    expect(values(wrapper)).toEqual(['1', '2', '']);
    await wrapper.findAll('input')[2].setValue('3');
    await settle();
    expect(wrapper.emitted('change')![0]).toEqual(['123']);
    expect(wrapper.emitted('complete')![0]).toEqual(['123']);
    expect(values(wrapper)).toEqual(['1', '2', '']);
    await wrapper.setProps({ value: '456' });
    await settle();
    expect(values(wrapper)).toEqual(['4', '5', '6']);
    await wrapper.setProps({ value: '' });
    await settle();
    expect(values(wrapper)).toEqual(['', '', '']);
    wrapper.unmount();
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref('');
        return () => h('div', [h(PinCode, { count: 2, autoFocus: false, modelValue: v.value, 'onUpdate:modelValue': (val: string) => (v.value = val) }), h('span', { id: 'out' }, v.value)]);
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wrapper.findAll('input')[0].setValue('9');
    await settle();
    expect(wrapper.find('#out').text()).toBe('9');
    expect(values(wrapper)).toEqual(['9', '']);
    wrapper.unmount();
  });

  it('Backspace clears the current input and moves focus back; Delete clears and moves forward', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, defaultValue: '123', autoFocus: false } });
    const inputs = wrapper.findAll('input');
    (inputs[1].element as HTMLInputElement).focus();
    await inputs[1].trigger('keydown', { key: 'Backspace' });
    await settle();
    expect(values(wrapper)).toEqual(['1', '', '3']);
    expect(wrapper.emitted('change')![0]).toEqual(['13']);
    expect(document.activeElement).toBe(inputs[0].element);
    await inputs[0].trigger('keydown', { key: 'Delete' });
    await settle();
    expect(values(wrapper)).toEqual(['', '', '3']);
    expect(document.activeElement).toBe(inputs[1].element);
    wrapper.unmount();
  });

  it('ArrowLeft / ArrowRight move focus and prevent default', async () => {
    // arrows are clamped to the filled value list (React parity), so start with a value
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, autoFocus: false, defaultValue: '123' } });
    const inputs = wrapper.findAll('input');
    (inputs[1].element as HTMLInputElement).focus();
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true });
    inputs[1].element.dispatchEvent(right);
    await settle();
    expect(right.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(inputs[2].element);
    await inputs[2].trigger('keydown', { key: 'ArrowRight' });
    await settle();
    expect(document.activeElement).toBe(inputs[2].element);
    await inputs[2].trigger('keydown', { key: 'ArrowLeft' });
    await settle();
    expect(document.activeElement).toBe(inputs[1].element);
    await inputs[1].trigger('keydown', { key: 'ArrowLeft' });
    await inputs[0].trigger('keydown', { key: 'ArrowLeft' });
    await settle();
    expect(document.activeElement).toBe(inputs[0].element);
    wrapper.unmount();
  });

  it('paste fills the following inputs and stops at invalid characters / count', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 4, autoFocus: false } });
    const inputs = wrapper.findAll('input');
    const paste = (el: Element, text: string) => {
      const e = new Event('paste', { bubbles: true, cancelable: true }) as any;
      e.clipboardData = { getData: () => text };
      el.dispatchEvent(e);
      return e;
    };
    const e1 = paste(inputs[1].element, '12a9');
    await settle();
    expect(e1.defaultPrevented).toBe(true);
    expect(values(wrapper)).toEqual(['', '1', '2', '']);
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual(['12']);
    paste(inputs[0].element, '987654');
    await settle();
    expect(values(wrapper)).toEqual(['9', '8', '7', '6']);
    expect(wrapper.emitted('complete')![0]).toEqual(['9876']);
    wrapper.unmount();
  });

  it('IME composing input is ignored', async () => {
    const wrapper = mount(PinCode, { props: { count: 2, autoFocus: false } });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = '1';
    input.element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await settle();
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('exposes focus(index) / blur(index)', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, autoFocus: false } });
    const vm = wrapper.vm as any;
    vm.focus(2);
    expect(document.activeElement).toBe(wrapper.findAll('input')[2].element);
    vm.blur(2);
    expect(document.activeElement).not.toBe(wrapper.findAll('input')[2].element);
    wrapper.unmount();
  });

  it('React-style onChange / onComplete listeners passed as attrs are invoked (API parity)', async () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 2, autoFocus: false, onChange, onComplete } as any });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('1');
    await settle();
    expect(onChange).toHaveBeenLastCalledWith('1');
    expect(onComplete).not.toHaveBeenCalled();
    await inputs[1].setValue('2');
    await settle();
    expect(onChange).toHaveBeenLastCalledWith('12');
    expect(onComplete).toHaveBeenCalledWith('12');
    wrapper.unmount();
  });

  it('focus(index) places the caret after the character (setSelectionRange parity)', async () => {
    const wrapper = mount(PinCode, { attachTo: document.body, props: { count: 3, defaultValue: '123', autoFocus: false } });
    const vm = wrapper.vm as any;
    vm.focus(1);
    const el = wrapper.findAll('input')[1].element as HTMLInputElement;
    expect(document.activeElement).toBe(el);
    expect(el.selectionStart).toBe(1);
    expect(el.selectionEnd).toBe(1);
    wrapper.unmount();
  });
});
