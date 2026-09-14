import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect } from 'vitest';
import Switch from './index';

describe('Switch', () => {
  it('renders unchecked by default with knob and role switch', () => {
    const w = mount(Switch);
    expect(w.classes()).toContain('semi-switch');
    expect(w.classes()).not.toContain('semi-switch-checked');
    expect(w.find('.semi-switch-knob').exists()).toBe(true);
    const input = w.find('input');
    expect(input.attributes('type')).toBe('checkbox');
    expect(input.attributes('role')).toBe('switch');
    expect(input.attributes('aria-checked')).toBe('false');
    expect((input.element as HTMLInputElement).checked).toBe(false);
  });
  it('uncontrolled: defaultChecked and toggling emits change', async () => {
    const w = mount(Switch, { props: { defaultChecked: true } });
    expect(w.classes()).toContain('semi-switch-checked');
    const input = w.find('input');
    await input.setValue(false);
    expect(w.classes()).not.toContain('semi-switch-checked');
    expect(w.emitted('change')![0][0]).toBe(false);
    expect(w.emitted('update:modelValue')![0][0]).toBe(false);
  });
  it('controlled: checked prop wins', async () => {
    const w = mount(Switch, { props: { checked: false } });
    await w.find('input').setValue(true);
    expect(w.emitted('change')![0][0]).toBe(true);
    await nextTick();
    expect(w.classes()).not.toContain('semi-switch-checked');
    await w.setProps({ checked: true });
    expect(w.classes()).toContain('semi-switch-checked');
    expect((w.find('input').element as HTMLInputElement).checked).toBe(true);
  });
  it('v-model', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref(false);
        return () => h('div', [h(Switch, { modelValue: v.value, 'onUpdate:modelValue': (val: boolean) => (v.value = val) }), h('i', { id: 'o' }, String(v.value))]);
      },
    });
    const w = mount(Parent);
    await w.find('input').setValue(true);
    expect(w.find('#o').text()).toBe('true');
    expect(w.find('.semi-switch').classes()).toContain('semi-switch-checked');
  });
  it('disabled / loading / size', async () => {
    const w = mount(Switch, { props: { disabled: true } });
    expect(w.classes()).toContain('semi-switch-disabled');
    expect(w.find('input').attributes('disabled')).toBeDefined();
    await w.setProps({ disabled: false });
    expect(w.classes()).not.toContain('semi-switch-disabled');
    const l = mount(Switch, { props: { loading: true, size: 'large' } });
    expect(l.classes()).toContain('semi-switch-loading');
    expect(l.classes()).toContain('semi-switch-large');
    expect(l.find('.semi-switch-loading-spin').exists()).toBe(true);
    expect(l.find('.semi-switch-knob').exists()).toBe(false);
    expect(l.find('input').attributes('disabled')).toBeDefined();
    expect(mount(Switch, { props: { size: 'small' } }).classes()).toContain('semi-switch-small');
  });
  it('checkedText / uncheckedText (not for small)', async () => {
    const w = mount(Switch, { props: { checkedText: 'ON', uncheckedText: 'OFF' } });
    expect(w.find('.semi-switch-unchecked-text').text()).toBe('OFF');
    expect(w.find('.semi-switch-checked-text').exists()).toBe(false);
    await w.find('input').setValue(true);
    expect(w.find('.semi-switch-checked-text').text()).toBe('ON');
    const s = mount(Switch, { props: { size: 'small', uncheckedText: 'OFF' } });
    expect(s.find('.semi-switch-unchecked-text').exists()).toBe(false);
    const sl = mount(Switch, { slots: { uncheckedText: () => h('b', 'X') } });
    expect(sl.find('.semi-switch-unchecked-text b').text()).toBe('X');
  });
  it('id, aria and data attrs, mouse events', async () => {
    const w = mount(Switch, { props: { id: 'sw' }, attrs: { 'aria-label': 'lbl', 'data-x': '1', class: 'c', style: 'color: red' } });
    expect(w.find('input').attributes('id')).toBe('sw');
    expect(w.find('input').attributes('aria-label')).toBe('lbl');
    expect(w.attributes('data-x')).toBe('1');
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
    await w.trigger('mouseenter');
    await w.trigger('mouseleave');
    expect(w.emitted('mouseenter')).toHaveLength(1);
    expect(w.emitted('mouseleave')).toHaveLength(1);
  });
  it('v-model:checked (update:checked) and controlled toggling', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref(true);
        return () => h('div', [h(Switch, { checked: v.value, 'onUpdate:checked': (val: boolean) => (v.value = val) }), h('i', { id: 'o' }, String(v.value))]);
      },
    });
    const w = mount(Parent);
    expect(w.find('.semi-switch').classes()).toContain('semi-switch-checked');
    await w.find('input').setValue(false);
    expect(w.find('#o').text()).toBe('false');
    expect(w.find('.semi-switch').classes()).not.toContain('semi-switch-checked');
  });
  it('focus-visible adds semi-switch-focus, blur removes it', async () => {
    const w = mount(Switch, { attachTo: document.body });
    const input = w.find('input');
    const el = input.element as HTMLInputElement;
    const orig = el.matches;
    el.matches = ((sel: string) => (sel === ':focus-visible' ? true : orig.call(el, sel))) as any;
    await input.trigger('focus');
    expect(w.classes()).toContain('semi-switch-focus');
    await input.trigger('blur');
    expect(w.classes()).not.toContain('semi-switch-focus');
    w.unmount();
  });
  it('extra aria attrs go to the native control; aria-disabled mirrors disabled', () => {
    const w = mount(Switch, { props: { disabled: true }, attrs: { 'aria-invalid': 'true', 'aria-errormessage': 'err', 'aria-describedby': 'd', 'aria-labelledby': 'l' } });
    const input = w.find('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-errormessage')).toBe('err');
    expect(input.attributes('aria-describedby')).toBe('d');
    expect(input.attributes('aria-labelledby')).toBe('l');
    expect(input.attributes('aria-disabled')).toBe('true');
    expect(w.attributes('aria-invalid')).toBeUndefined();
  });
  it('checkedText as render function / slot, uncheckedText prop; exposes focus/blur; static name', async () => {
    const w = mount(Switch, { props: { defaultChecked: true, checkedText: () => h('b', 'YES') } });
    expect(w.find('.semi-switch-checked-text b').text()).toBe('YES');
    expect(w.find('.semi-switch-checked-text').attributes('x-semi-prop')).toBe('checkedText');
    const w2 = mount(Switch, { attachTo: document.body });
    (w2.vm as any).focus();
    expect(document.activeElement).toBe(w2.find('input').element);
    (w2.vm as any).blur();
    expect(document.activeElement).not.toBe(w2.find('input').element);
    w2.unmount();
    expect((Switch as any).__SemiComponentName__).toBe('Switch');
  });
});
