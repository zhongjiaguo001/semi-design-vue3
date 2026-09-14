import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { InputNumber } from './index';
import ConfigProvider from '../configProvider';
import en_US from '../locale/source/en_US';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('InputNumber', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper, spinbutton input and up/down buttons', () => {
    const wrapper = mount(InputNumber);
    expect(wrapper.classes()).toContain('semi-input-number');
    expect(wrapper.classes()).toContain('semi-input-number-size-default');
    const input = wrapper.find('input');
    expect(input.attributes('role')).toBe('spinbutton');
    expect(input.attributes('step')).toBe('1');
    expect(input.attributes('aria-disabled')).toBe('false');
    expect(input.attributes('aria-valuemax')).toBeUndefined();
    expect(input.attributes('aria-valuemin')).toBeUndefined();
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(true);
    expect(wrapper.find('.semi-input-number-button-up').exists()).toBe(true);
    expect(wrapper.find('.semi-input-number-button-down').exists()).toBe(true);
    expect(wrapper.find('.semi-icon-chevron_up').exists()).toBe(true);
    expect(wrapper.find('.semi-icon-chevron_down').exists()).toBe(true);
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(InputNumber, { props: { size } });
    expect(wrapper.classes()).toContain(`semi-input-number-size-${size}`);
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain(`semi-input-wrapper-${size}`);
  });

  it('class / style attrs go to the root, other attrs to the input', () => {
    const wrapper = mount(InputNumber, { attrs: { class: 'custom', style: 'width: 100px', 'data-x': 'y', id: 'my-id' } });
    expect(wrapper.classes()).toContain('custom');
    expect(wrapper.attributes('style')).toContain('width: 100px');
    expect(wrapper.find('input').attributes('data-x')).toBe('y');
    expect(wrapper.find('input').attributes('id')).toBe('my-id');
  });

  it('min / max produce aria attrs; aria-valuenow reflects number', () => {
    const wrapper = mount(InputNumber, { props: { min: 0, max: 10, defaultValue: 3 } });
    const input = wrapper.find('input');
    expect(input.attributes('aria-valuemin')).toBe('0');
    expect(input.attributes('aria-valuemax')).toBe('10');
    expect(input.attributes('aria-valuenow')).toBe('3');
  });

  it('defaultValue formats initial display value', () => {
    expect(mount(InputNumber, { props: { defaultValue: 5 } }).find('input').element.value).toBe('5');
    expect(mount(InputNumber, { props: { defaultValue: '12' } }).find('input').element.value).toBe('12');
    expect(mount(InputNumber, { props: { defaultValue: 'abc' } }).find('input').element.value).toBe('');
  });

  it('precision applies on init and emits change with the formatted value', () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 1.234, precision: 2 } });
    expect(wrapper.find('input').element.value).toBe('1.23');
    expect(wrapper.emitted('change')![0][0]).toBe(1.23);
  });

  it('uncontrolled typing: emits change / numberChange / update:modelValue with numbers', async () => {
    const wrapper = mount(InputNumber);
    const input = wrapper.find('input');
    await input.setValue('42');
    expect(input.element.value).toBe('42');
    expect(wrapper.emitted('change')![0][0]).toBe(42);
    expect(wrapper.emitted('numberChange')![0][0]).toBe(42);
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(42);
    expect(wrapper.emitted('update:value')![0][0]).toBe(42);
    expect(wrapper.find('input').attributes('aria-valuenow')).toBe('42');
  });

  it('typing an invalid string emits change with the raw string and no numberChange', async () => {
    const wrapper = mount(InputNumber);
    await wrapper.find('input').setValue('abc');
    expect(wrapper.emitted('change')![0][0]).toBe('abc');
    expect(wrapper.emitted('numberChange')).toBeUndefined();
  });

  it('typing out-of-range value: numberChange not emitted; blur clamps to max and emits', async () => {
    const wrapper = mount(InputNumber, { props: { max: 10 } });
    const input = wrapper.find('input');
    await input.trigger('focus');
    await input.setValue('100');
    expect(wrapper.emitted('numberChange')).toBeUndefined();
    await input.trigger('blur');
    expect(input.element.value).toBe('10');
    const changes = wrapper.emitted('change')!;
    expect(changes[changes.length - 1][0]).toBe(10);
    expect(wrapper.emitted('numberChange')![0][0]).toBe(10);
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });

  it('blur clamps below min', async () => {
    const wrapper = mount(InputNumber, { props: { min: 5 } });
    const input = wrapper.find('input');
    await input.setValue('1');
    await input.trigger('blur');
    expect(input.element.value).toBe('5');
  });

  it('blur formats to precision', async () => {
    const wrapper = mount(InputNumber, { props: { precision: 2 } });
    const input = wrapper.find('input');
    await input.setValue('3');
    await input.trigger('blur');
    expect(input.element.value).toBe('3.00');
  });

  it('controlled value: typed text is kept while editing (React parity), parent updates format the value', async () => {
    const wrapper = mount(InputNumber, { props: { value: 1 } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('1');
    await input.setValue('12');
    expect(wrapper.emitted('change')![0][0]).toBe(12);
    await nextTick();
    // like React semi, the foundation keeps the input text while the user edits
    expect(input.element.value).toBe('12');
    expect(input.attributes('aria-valuenow')).toBe('1');
    await wrapper.setProps({ value: 7 });
    expect(input.element.value).toBe('7');
    await wrapper.setProps({ value: '' });
    expect(input.element.value).toBe('');
    await wrapper.setProps({ value: 'zz' });
    expect(input.element.value).toBe('');
  });

  it('controlled value with precision emits change when the formatted value differs', async () => {
    const wrapper = mount(InputNumber, { props: { value: 1, precision: 1 } });
    expect(wrapper.find('input').element.value).toBe('1.0');
    await wrapper.setProps({ value: 2 });
    expect(wrapper.find('input').element.value).toBe('2.0');
    const changes = wrapper.emitted('change')!;
    expect(changes[changes.length - 1][0]).toBe(2);
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref<number | string>(3);
        return () => h('div', [h(InputNumber, { modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, String(v.value))]);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').element.value).toBe('3');
    await wrapper.find('input').setValue('9');
    expect(wrapper.find('#out').text()).toBe('9');
    expect(wrapper.find('input').element.value).toBe('9');
  });

  it('up button click adds step and emits upClick', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 1, step: 2 } });
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 0 });
    await wrapper.find('.semi-input-number-button-up').trigger('mouseup');
    expect(wrapper.find('input').element.value).toBe('3');
    expect(wrapper.emitted('upClick')![0][0]).toBe('3');
    expect(wrapper.emitted('change')![0][0]).toBe(3);
    expect(wrapper.emitted('numberChange')![0][0]).toBe(3);
  });

  it('down button click subtracts step and emits downClick', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5 } });
    await wrapper.find('.semi-input-number-button-down').trigger('mousedown', { button: 0 });
    await wrapper.find('.semi-input-number-button-down').trigger('mouseup');
    expect(wrapper.find('input').element.value).toBe('4');
    expect(wrapper.emitted('downClick')![0][0]).toBe('4');
  });

  it('non-left mouse button is ignored', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5 } });
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 2 });
    expect(wrapper.find('input').element.value).toBe('5');
    expect(wrapper.emitted('upClick')).toBeUndefined();
  });

  it('readonly ignores button clicks', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5, readonly: true } });
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 0 });
    expect(wrapper.find('input').element.value).toBe('5');
  });

  it('long press repeats the step (pressTimeout / pressInterval)', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 0, pressTimeout: 30, pressInterval: 10 } });
    const up = wrapper.find('.semi-input-number-button-up');
    await up.trigger('mousedown', { button: 0 });
    await sleep(120);
    await up.trigger('mouseup');
    await nextTick();
    const val = Number(wrapper.find('input').element.value);
    expect(val).toBeGreaterThan(2);
    const before = wrapper.emitted('upClick')!.length;
    await sleep(60);
    expect(wrapper.emitted('upClick')!.length).toBe(before);
  });

  it('mouseleave while pressing registers a global mouseup that stops the timer', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 0, pressTimeout: 30, pressInterval: 10 } });
    const up = wrapper.find('.semi-input-number-button-up');
    await up.trigger('mousedown', { button: 0 });
    await up.trigger('mouseleave');
    document.dispatchEvent(new MouseEvent('mouseup'));
    await sleep(100);
    expect(wrapper.find('input').element.value).toBe('1');
  });

  it('button not allowed classes at max / min and disabled', async () => {
    const wrapper = mount(InputNumber, { props: { min: 0, max: 1, defaultValue: 1 } });
    expect(wrapper.find('.semi-input-number-button-up').classes()).toContain('semi-input-number-button-up-not-allowed');
    expect(wrapper.find('.semi-input-number-button-down').classes()).not.toContain('semi-input-number-button-down-not-allowed');
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 0 });
    expect(wrapper.find('input').element.value).toBe('1');
    await wrapper.setProps({ defaultValue: 0 });
    const w2 = mount(InputNumber, { props: { min: 0, max: 1, defaultValue: 0 } });
    expect(w2.find('.semi-input-number-button-down').classes()).toContain('semi-input-number-button-down-not-allowed');
    const w3 = mount(InputNumber, { props: { disabled: true } });
    expect(w3.find('.semi-input-number-button-up').classes()).toContain('semi-input-number-button-up-disabled');
    expect(w3.find('.semi-input-number-button-down').classes()).toContain('semi-input-number-button-down-disabled');
    expect(w3.find('input').attributes('disabled')).toBeDefined();
    expect(w3.find('input').attributes('aria-disabled')).toBe('true');
    expect(w3.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-disabled');
  });

  it('keyboard ArrowUp / ArrowDown step the value, shift uses shiftStep, emits keydown', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5, step: 1, shiftStep: 10 } });
    const input = wrapper.find('input');
    await input.trigger('keydown', { keyCode: 38, key: 'ArrowUp' });
    expect(input.element.value).toBe('6');
    await input.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await input.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    expect(input.element.value).toBe('4');
    await input.trigger('keydown', { keyCode: 38, key: 'ArrowUp', shiftKey: true });
    expect(input.element.value).toBe('14');
    await input.trigger('keydown', { keyCode: 40, key: 'ArrowDown', shiftKey: true });
    expect(input.element.value).toBe('4');
    expect(wrapper.emitted('keydown')).toHaveLength(5);
    expect(wrapper.emitted('change')!.map((c) => c[0])).toEqual([6, 5, 4, 14, 4]);
  });

  it('step respects min / max bounds and decimal steps', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 0.1, step: 0.2, max: 0.5, min: 0 } });
    const input = wrapper.find('input');
    await input.trigger('keydown', { keyCode: 38 });
    expect(input.element.value).toBe('0.3');
    await input.trigger('keydown', { keyCode: 38 });
    expect(input.element.value).toBe('0.5');
    // a step that would overshoot max is refused (React parity)
    await input.trigger('keydown', { keyCode: 38 });
    expect(input.element.value).toBe('0.5');
    await input.trigger('keydown', { keyCode: 40 });
    await input.trigger('keydown', { keyCode: 40 });
    expect(input.element.value).toBe('0.1');
    await input.trigger('keydown', { keyCode: 40 });
    expect(input.element.value).toBe('0.1');
  });

  it('formatter / parser round trip', async () => {
    const wrapper = mount(InputNumber, {
      props: {
        defaultValue: 1000,
        formatter: (value: any) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        parser: (value: string) => value.replace(/\$\s?|(,*)/g, ''),
      },
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('$ 1,000');
    await input.setValue('$ 2,500');
    expect(wrapper.emitted('change')!.slice(-1)[0][0]).toBe(2500);
    expect(input.element.value).toBe('$ 2,500');
    await input.trigger('keydown', { keyCode: 38 });
    expect(input.element.value).toBe('$ 2,501');
  });

  it('focus / blur emit and toggle focus class', async () => {
    const wrapper = mount(InputNumber);
    const input = wrapper.find('input');
    await input.trigger('focus');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-focus');
    await input.trigger('blur');
    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(wrapper.find('.semi-input-wrapper').classes()).not.toContain('semi-input-wrapper-focus');
  });

  it('hideButtons hides the suffix buttons', () => {
    const wrapper = mount(InputNumber, { props: { hideButtons: true } });
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(false);
  });

  it('innerButtons renders buttons inside the input suffix on hover / focus only', async () => {
    const wrapper = mount(InputNumber, { props: { innerButtons: true, defaultValue: 1 } });
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(false);
    await wrapper.trigger('mouseenter');
    const btns = wrapper.find('.semi-input-suffix .semi-input-number-suffix-btns');
    expect(btns.exists()).toBe(true);
    expect(btns.classes()).toContain('semi-input-number-suffix-btns-inner');
    expect(btns.classes()).toContain('semi-input-number-suffix-btns-inner-hover');
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 0 });
    expect(wrapper.find('input').element.value).toBe('2');
    await wrapper.trigger('mouseleave');
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(false);
    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(true);
    expect(wrapper.find('.semi-input-number-suffix-btns').classes()).not.toContain('semi-input-number-suffix-btns-inner-hover');
    await wrapper.trigger('mousemove');
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(true);
  });

  it('suffix prop and slot are rendered', () => {
    const w1 = mount(InputNumber, { props: { suffix: 'kg' } });
    expect(w1.find('.semi-input-suffix').text()).toBe('kg');
    const w2 = mount(InputNumber, { slots: { suffix: () => h('b', { class: 'sf' }, 'S') } });
    expect(w2.find('.semi-input-suffix .sf').exists()).toBe(true);
  });

  it('prefix / insetLabel / addonBefore / addonAfter props and slots pass through to Input', () => {
    const w1 = mount(InputNumber, { props: { prefix: 'P', insetLabelId: 'x', addonBefore: 'B', addonAfter: 'A' } });
    expect(w1.find('.semi-input-prefix').text()).toBe('P');
    expect(w1.find('.semi-input-prepend').text()).toBe('B');
    expect(w1.find('.semi-input-append').text()).toBe('A');
    const w2 = mount(InputNumber, { slots: { prefix: () => h(IconSearch), insetLabel: () => 'L', addonBefore: () => h('i', { class: 'ab' }) } });
    expect(w2.find('.semi-input-prefix .semi-icon').exists()).toBe(true);
    expect(w2.find('.semi-input-prepend .ab').exists()).toBe(true);
    const w3 = mount(InputNumber, { props: { insetLabel: 'Label' } });
    expect(w3.find('.semi-input-inset-label').text()).toBe('Label');
  });

  it('showClear renders clear button and clearing emits change("") and clear', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5, showClear: true } });
    await wrapper.find('input').trigger('focus');
    await wrapper.trigger('mouseenter');
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    const clear = wrapper.find('.semi-input-clearbtn');
    expect(clear.exists()).toBe(true);
    await clear.trigger('mousedown');
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')!.slice(-1)[0][0]).toBe('');
    expect(wrapper.find('input').element.value).toBe('');
  });

  it('clearIcon prop / slot customizes the clear icon', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 5, showClear: true }, slots: { clearIcon: () => h('i', { class: 'my-clear' }) } });
    await wrapper.find('input').trigger('focus');
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    expect(wrapper.find('.semi-input-clearbtn .my-clear').exists()).toBe(true);
  });

  it('validateStatus / placeholder / borderless / autoFocus pass through', () => {
    const wrapper = mount(InputNumber, { attachTo: document.body, props: { validateStatus: 'error', placeholder: 'num', borderless: true, autoFocus: true } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-borderless');
    expect(wrapper.find('input').attributes('placeholder')).toBe('num');
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('autofocus (lower-case React prop) initialises focusing state', async () => {
    const wrapper = mount(InputNumber, { attachTo: document.body, props: { autofocus: true, innerButtons: true } });
    expect(wrapper.find('.semi-input-number-suffix-btns').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keepFocus keeps input focused after clicking buttons', async () => {
    const wrapper = mount(InputNumber, { attachTo: document.body, props: { defaultValue: 1, keepFocus: true } });
    const input = wrapper.find('input');
    await input.trigger('focus');
    input.element.blur();
    const up = wrapper.find('.semi-input-number-button-up');
    const ev = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
    up.element.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    await up.trigger('mouseup');
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(input.element);
    wrapper.unmount();
  });

  it('forwarded input events: input / keyup / keypress / enterPress', async () => {
    const wrapper = mount(InputNumber);
    const input = wrapper.find('input');
    await input.setValue('1');
    await input.trigger('keyup');
    await input.trigger('keypress', { key: 'Enter', keyCode: 13 });
    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('keyup')).toHaveLength(1);
    expect(wrapper.emitted('keypress')).toHaveLength(1);
    expect(wrapper.emitted('enterPress')).toHaveLength(1);
  });

  it('currency mode formats on blur using the locale currency (zh_CN default -> CNY)', async () => {
    const wrapper = mount(InputNumber, { props: { currency: true, defaultValue: 1234.5 } });
    const input = wrapper.find('input');
    expect(input.element.value).toContain('1,234.5');
    expect(input.element.value).toMatch(/¥|CN/);
    await input.setValue('20');
    await input.trigger('blur');
    expect(input.element.value).toMatch(/20/);
    expect(input.element.value).toMatch(/¥|CN/);
    expect(wrapper.emitted('change')!.slice(-1)[0][0]).toBe(20);
  });

  it('currency as explicit code / showCurrencySymbol=false / minimumFractionDigits', async () => {
    const w1 = mount(InputNumber, { props: { currency: 'USD', localeCode: 'en-US', defaultValue: 10 } });
    expect(w1.find('input').element.value).toBe('$10.00');
    const w2 = mount(InputNumber, { props: { currency: 'USD', localeCode: 'en-US', defaultValue: 10, showCurrencySymbol: false } });
    expect(w2.find('input').element.value).toBe('10.00');
    const w3 = mount(InputNumber, { props: { currency: 'USD', localeCode: 'en-US', defaultValue: 10, minimumFractionDigits: 3, maximumFractionDigits: 3 } });
    expect(w3.find('input').element.value).toBe('$10.000');
    const w4 = mount(InputNumber, { props: { currency: 'EUR', localeCode: 'en-US', defaultValue: 5, currencyDisplay: 'code' } });
    expect(w4.find('input').element.value).toContain('EUR');
  });

  it('localeCode / currency picked from ConfigProvider locale', () => {
    const wrapper = mount(ConfigProvider, {
      props: { locale: en_US as any },
      slots: { default: () => h(InputNumber, { currency: true, defaultValue: 7 }) },
    });
    expect(wrapper.find('input').element.value).toBe('$7.00');
  });

  it('scientificNotation shows exponent when blurred and full number when focused', async () => {
    const wrapper = mount(InputNumber, { props: { scientificNotation: { threshold: 5 }, defaultValue: 1234500 } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('1.2345e+6');
    await input.trigger('focus');
    expect(input.element.value).toBe('1234500');
    await input.trigger('blur');
    expect(input.element.value).toBe('1.2345e+6');
    const w2 = mount(InputNumber, { props: { scientificNotation: true, defaultValue: 12 } });
    expect(w2.find('input').element.value).toBe('12');
  });

  it('exposes focus / blur / getInputElement', async () => {
    const wrapper = mount(InputNumber, { attachTo: document.body });
    const vm = wrapper.vm as any;
    expect(vm.getInputElement()).toBe(wrapper.find('input').element);
    vm.focus();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    vm.blur();
    expect(document.activeElement).not.toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('prefixCls customizes classes', () => {
    const wrapper = mount(InputNumber, { props: { prefixCls: 'my' } });
    expect(wrapper.classes()).toContain('my-number');
    expect(wrapper.find('.my-number-suffix-btns').exists()).toBe(true);
  });

  it('destroy cleans up timers (unmount while pressing does not throw)', async () => {
    const wrapper = mount(InputNumber, { props: { defaultValue: 0, pressTimeout: 20, pressInterval: 10 } });
    await wrapper.find('.semi-input-number-button-up').trigger('mousedown', { button: 0 });
    wrapper.unmount();
    await sleep(60);
    await flushPromises();
  });

  it('controlled numeric value applies formatter / parser on first render (2.95.0 behavior)', () => {
    const wrapper = mount(InputNumber as any, {
      props: { value: 1, formatter: (v: any) => String(Number(v) * 100), parser: (s: string) => String(Number(s) / 100) },
    });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('100');
  });

  it('aria-label / aria-labelledby / insetLabelId pass through to the inner input', () => {
    const wrapper = mount(InputNumber as any, {
      props: { insetLabel: 'Qty', insetLabelId: 'qty-label' },
      attrs: { 'aria-label': 'quantity', 'aria-labelledby': 'qty-label' },
    });
    const input = wrapper.find('input');
    expect(input.attributes('role')).toBe('spinbutton');
    expect(input.attributes('aria-label')).toBe('quantity');
    expect(input.attributes('aria-labelledby')).toBe('qty-label');
    expect(wrapper.find('#qty-label').exists()).toBe(true);
    expect(wrapper.find('#qty-label').text()).toBe('Qty');
  });
});
