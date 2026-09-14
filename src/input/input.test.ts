import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './index';
import { IconSearch } from '../icons';

describe('Input', () => {
  it('renders wrapper + input with defaults', () => {
    const wrapper = mount(Input);
    expect(wrapper.classes()).toContain('semi-input-wrapper');
    expect(wrapper.classes()).toContain('semi-input-wrapper-default');
    const input = wrapper.find('input');
    expect(input.classes()).toContain('semi-input');
    expect(input.classes()).toContain('semi-input-default');
    expect(input.attributes('type')).toBe('text');
    expect(input.element.value).toBe('');
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(Input, { props: { size } });
    expect(wrapper.classes()).toContain(`semi-input-wrapper-${size}`);
    expect(wrapper.find('input').classes()).toContain(`semi-input-${size}`);
  });

  it('uncontrolled: defaultValue + typing emits change/input and updates value', async () => {
    const wrapper = mount(Input, { props: { defaultValue: 'a' } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('a');
    await input.setValue('ab');
    expect(input.element.value).toBe('ab');
    expect(wrapper.emitted('change')![0][0]).toBe('ab');
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe('ab');
    expect(wrapper.emitted('input')).toBeTruthy();
  });

  it('controlled: value prop does not change until parent updates', async () => {
    const wrapper = mount(Input, { props: { value: 'x' } });
    const input = wrapper.find('input');
    await input.setValue('xy');
    expect(wrapper.emitted('change')![0][0]).toBe('xy');
    await nextTick();
    expect(input.element.value).toBe('x');
    await wrapper.setProps({ value: 'xyz' });
    expect(input.element.value).toBe('xyz');
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref('init');
        return () => h('div', [h(Input, { modelValue: v.value, 'onUpdate:modelValue': (val: string) => (v.value = val) }), h('span', { id: 'out' }, v.value)]);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').element.value).toBe('init');
    await wrapper.find('input').setValue('changed');
    expect(wrapper.find('#out').text()).toBe('changed');
    expect(wrapper.find('input').element.value).toBe('changed');
  });

  it('disabled / readonly / borderless / validateStatus / type hidden classes', () => {
    const w = mount(Input, { props: { disabled: true, readonly: true, borderless: true, validateStatus: 'error' } });
    expect(w.classes()).toContain('semi-input-wrapper-disabled');
    expect(w.classes()).toContain('semi-input-wrapper-readonly');
    expect(w.classes()).toContain('semi-input-borderless');
    expect(w.classes()).toContain('semi-input-wrapper-error');
    expect(w.find('input').attributes('disabled')).toBeDefined();
    expect(w.find('input').attributes('readonly')).toBeDefined();
    expect(w.find('input').attributes('aria-invalid')).toBe('true');
    expect(w.find('input').classes()).toContain('semi-input-disabled');
    expect(mount(Input, { props: { validateStatus: 'warning' } }).classes()).toContain('semi-input-wrapper-warning');
    expect(mount(Input, { props: { type: 'hidden' } }).classes()).toContain('semi-input-wrapper-hidden');
  });

  it('focus / blur toggle focus class and emit', async () => {
    const wrapper = mount(Input);
    await wrapper.find('input').trigger('focus');
    expect(wrapper.classes()).toContain('semi-input-wrapper-focus');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    await wrapper.find('input').trigger('blur');
    expect(wrapper.classes()).not.toContain('semi-input-wrapper-focus');
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });

  it('clicking wrapper focuses input', async () => {
    const wrapper = mount(Input, { attachTo: document.body });
    await wrapper.trigger('click');
    expect(document.activeElement).toBe(wrapper.find('input').element);
    expect(wrapper.classes()).toContain('semi-input-wrapper-focus');
    wrapper.unmount();
  });

  it('keyboard events: keydown/keyup/keypress/enterPress', async () => {
    const wrapper = mount(Input);
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'a' });
    await input.trigger('keyup', { key: 'a' });
    await input.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('keydown')).toHaveLength(1);
    expect(wrapper.emitted('keyup')).toHaveLength(1);
    expect(wrapper.emitted('keypress')).toHaveLength(1);
    expect(wrapper.emitted('enterPress')).toHaveLength(1);
  });

  it('showClear: shows clear button on hover with value, clears and emits', async () => {
    const wrapper = mount(Input, { props: { defaultValue: 'abc', showClear: true } });
    expect(wrapper.classes()).toContain('semi-input-wrapper-clearable');
    expect(wrapper.find('.semi-input-clearbtn').exists()).toBe(false);
    await wrapper.trigger('mouseenter');
    expect(wrapper.find('.semi-input-clearbtn').exists()).toBe(true);
    expect(wrapper.find('input').classes()).toContain('semi-input-sibling-clearbtn');
    await wrapper.find('.semi-input-clearbtn').trigger('mousedown');
    expect(wrapper.find('input').element.value).toBe('');
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')![0][0]).toBe('');
    await wrapper.trigger('mouseleave');
    expect(wrapper.find('.semi-input-clearbtn').exists()).toBe(false);
  });

  it('showClear hidden when disabled unless showClearIgnoreDisabled; custom clearIcon', async () => {
    const w1 = mount(Input, { props: { defaultValue: 'abc', showClear: true, disabled: true } });
    await w1.trigger('mouseenter');
    expect(w1.find('.semi-input-clearbtn').exists()).toBe(false);
    const w2 = mount(Input, { props: { defaultValue: 'abc', showClear: true, disabled: true, showClearIgnoreDisabled: true, clearIcon: IconSearch } });
    await w2.trigger('mouseenter');
    expect(w2.find('.semi-input-clearbtn .semi-icon-search').exists()).toBe(true);
  });

  it('password mode: eye toggle switches type', async () => {
    const wrapper = mount(Input, { props: { mode: 'password', defaultValue: 'pw' } });
    expect(wrapper.classes()).toContain('semi-input-wrapper-modebtn');
    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('password');
    expect(input.classes()).toContain('semi-input-sibling-modebtn');
    const btn = wrapper.find('.semi-input-modebtn');
    expect(btn.attributes('role')).toBe('button');
    expect(btn.attributes('aria-label')).toBe('Show password');
    expect(btn.find('.semi-icon-eye_closed_solid').exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.find('input').attributes('type')).toBe('text');
    expect(wrapper.find('.semi-input-modebtn').attributes('aria-label')).toBe('Hidden password');
    expect(wrapper.find('.semi-icon-eye_opened').exists()).toBe(true);
    // keyboard toggle
    await wrapper.find('.semi-input-modebtn').trigger('keypress', { key: 'Enter' });
    expect(wrapper.find('input').attributes('type')).toBe('password');
    // hidden when disabled
    expect(mount(Input, { props: { mode: 'password', disabled: true } }).find('.semi-input-modebtn').exists()).toBe(false);
  });

  it('prefix / suffix / insetLabel / addonBefore / addonAfter via props and slots', () => {
    const w = mount(Input, { props: { prefix: 'P', suffix: IconSearch, addonBefore: 'https://', addonAfter: '.com' } });
    expect(w.classes()).toContain('semi-input-wrapper__with-prefix');
    expect(w.classes()).toContain('semi-input-wrapper__with-suffix');
    expect(w.classes()).toContain('semi-input-wrapper__with-suffix-icon');
    expect(w.classes()).toContain('semi-input-wrapper__with-append');
    expect(w.classes()).toContain('semi-input-wrapper__with-prepend');
    expect(w.find('.semi-input-prefix').text()).toBe('P');
    expect(w.find('.semi-input-prefix').classes()).toContain('semi-input-prefix-text');
    expect(w.find('.semi-input-suffix').classes()).toContain('semi-input-suffix-icon');
    expect(w.find('.semi-input-prepend').text()).toBe('https://');
    expect(w.find('.semi-input-prepend').classes()).toContain('semi-input-prepend-text');
    expect(w.find('.semi-input-append').text()).toBe('.com');

    const w2 = mount(Input, {
      props: { insetLabel: 'Label', insetLabelId: 'lbl' },
      slots: { suffix: () => h('b', 'S'), addonBefore: () => h(IconSearch) },
    });
    const inset = w2.find('.semi-input-inset-label');
    expect(inset.exists()).toBe(true);
    expect(inset.attributes('id')).toBe('lbl');
    expect(inset.text()).toBe('Label');
    expect(w2.find('.semi-input-suffix b').text()).toBe('S');
    expect(w2.find('.semi-input-prepend').classes()).toContain('semi-input-prepend-icon');
    expect(w2.classes()).toContain('semi-input-wrapper__with-append-only');
    const w3 = mount(Input, { props: { addonAfter: 'x' } });
    expect(w3.classes()).toContain('semi-input-wrapper__with-prepend-only');
  });

  it('hideSuffix hides suffix while clear button is shown', async () => {
    const wrapper = mount(Input, { props: { defaultValue: 'v', showClear: true, hideSuffix: true, suffix: 'S' } });
    await wrapper.trigger('mouseenter');
    expect(wrapper.find('.semi-input-suffix').classes()).toContain('semi-input-suffix-hidden');
    expect(wrapper.classes()).toContain('semi-input-wrapper__with-suffix-hidden');
  });

  it('clicking prefix focuses input', async () => {
    const wrapper = mount(Input, { attachTo: document.body, props: { prefix: 'P' } });
    await wrapper.find('.semi-input-prefix').trigger('click');
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('maxLength / minLength / getValueLength', async () => {
    const w = mount(Input, { props: { maxLength: 5, minLength: 2 } });
    expect(w.find('input').attributes('maxlength')).toBe('5');
    expect(w.find('input').attributes('minlength')).toBe('2');
    const w2 = mount(Input, { props: { maxLength: 3, getValueLength: (v: string) => v.length } });
    expect(w2.find('input').attributes('maxlength')).toBeUndefined();
    await w2.find('input').setValue('abcdef');
    expect(w2.emitted('change')![0][0]).toBe('abc');
  });

  it('placeholder, inputStyle, onlyBorder, attrs passthrough', () => {
    const w = mount(Input, { props: { placeholder: 'ph', inputStyle: { color: 'red' }, onlyBorder: 2 }, attrs: { id: 'i1', 'aria-label': 'lbl', class: 'cc', style: 'width: 10px' } });
    const input = w.find('input');
    expect(input.attributes('placeholder')).toBe('ph');
    expect(input.attributes('style')).toContain('color: red');
    expect(input.attributes('id')).toBe('i1');
    expect(input.attributes('aria-label')).toBe('lbl');
    expect(w.classes()).toContain('cc');
    expect(w.classes()).toContain('semi-input-only_border');
    expect(w.attributes('style')).toContain('border-width: 2px');
    expect(w.attributes('style')).toContain('width: 10px');
  });

  it('autoFocus focuses on mount', () => {
    const w = mount(Input, { attachTo: document.body, props: { autoFocus: true } });
    expect(document.activeElement).toBe(w.find('input').element);
    w.unmount();
  });

  it('composition events are emitted', async () => {
    const w = mount(Input);
    await w.find('input').trigger('compositionstart');
    await w.find('input').trigger('compositionupdate');
    await w.find('input').trigger('compositionend');
    expect(w.emitted('compositionStart')).toHaveLength(1);
    expect(w.emitted('compositionUpdate')).toHaveLength(1);
    expect(w.emitted('compositionEnd')).toHaveLength(1);
  });

  it('exposes focus / blur', () => {
    const w = mount(Input, { attachTo: document.body });
    (w.vm as any).focus();
    expect(document.activeElement).toBe(w.find('input').element);
    (w.vm as any).blur();
    expect(document.activeElement).not.toBe(w.find('input').element);
    w.unmount();
  });
});

describe('Input parity extras', () => {
  it('preventScroll is passed to focus() from the exposed focus and from clicking prefix', async () => {
    const w = mount(Input, { attachTo: document.body, props: { preventScroll: true, prefix: 'P' } });
    const spy = vi.spyOn(w.find('input').element, 'focus');
    await w.find('.semi-input-prefix').trigger('click');
    expect(spy).toHaveBeenCalledWith({ preventScroll: true });
    w.unmount();
  });

  it('getValueLength counts graphemes so emoji are truncated by visible length', async () => {
    const getValueLength = (s: string) => Array.from(s).length;
    const w = mount(Input, { props: { maxLength: 2, getValueLength } });
    await w.find('input').setValue('💖💖💖');
    expect(w.emitted('change')![0][0]).toBe('💖💖');
    expect(w.find('input').attributes('maxlength')).toBeUndefined();
  });

  it('size classes for large / small', () => {
    const l = mount(Input, { props: { size: 'large' } });
    expect(l.classes()).toContain('semi-input-wrapper-large');
    expect(l.find('input').classes()).toContain('semi-input-large');
    const s = mount(Input, { props: { size: 'small' } });
    expect(s.classes()).toContain('semi-input-wrapper-small');
  });

  it('addonBefore/addonAfter text get the -text class and wrapper flags', () => {
    const w = mount(Input, { props: { addonBefore: 'http://', addonAfter: '.com' } });
    expect(w.find('.semi-input-prepend').classes()).toContain('semi-input-prepend-text');
    expect(w.find('.semi-input-append').classes()).toContain('semi-input-append-text');
    expect(w.classes()).toContain('semi-input-wrapper__with-append');
    expect(w.classes()).toContain('semi-input-wrapper__with-prepend');
  });
});
