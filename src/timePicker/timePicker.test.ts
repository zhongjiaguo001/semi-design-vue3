import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimePicker, { TimeInput, TimePickerCombobox } from './index';
import ConfigProvider from '../configProvider';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const panel = () => document.querySelector('[class*="semi-timepicker-panel-column-"]') as HTMLElement | null;
const listTexts = (sel: string) => Array.from(document.querySelectorAll(`${sel} li`)).map((li) => li.textContent);

describe('TimePicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root, header and input with default classes / placeholder from locale', () => {
    const wrapper = mount(TimePicker);
    expect(wrapper.classes()).toContain('semi-timepicker');
    expect(wrapper.find('.semi-timepicker-header').exists()).toBe(true);
    expect(wrapper.find('.semi-timepicker-input-wrap').exists()).toBe(true);
    const inputWrapper = wrapper.find('.semi-input-wrapper');
    expect(inputWrapper.classes()).toContain('semi-timepicker-input');
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请选择时间');
    expect(input.element.value).toBe('');
    expect(wrapper.find('.semi-input-suffix svg').exists()).toBe(true);
    expect(panel()).toBeNull();
  });

  it('range type uses range placeholder', () => {
    const wrapper = mount(TimePicker, { props: { type: 'timeRange' } });
    expect(wrapper.find('input').attributes('placeholder')).toBe('请选择时间范围');
  });

  it('placeholder prop overrides locale', () => {
    const wrapper = mount(TimePicker, { props: { placeholder: 'pick' } });
    expect(wrapper.find('input').attributes('placeholder')).toBe('pick');
  });

  it('LocaleProvider changes placeholder', () => {
    const wrapper = mount(LocaleProvider, { props: { locale: en_US as any }, slots: { default: () => h(TimePicker) } });
    expect(wrapper.find('input').attributes('placeholder')).toBe('Select time');
  });

  it('defaultValue Date / string / number are formatted into the input', () => {
    const d = new Date(2024, 0, 15, 9, 5, 7);
    expect(mount(TimePicker, { props: { defaultValue: d } }).find('input').element.value).toBe('09:05:07');
    expect(mount(TimePicker, { props: { defaultValue: '13:14:15' } }).find('input').element.value).toBe('13:14:15');
    expect(mount(TimePicker, { props: { defaultValue: d.getTime() } }).find('input').element.value).toBe('09:05:07');
  });

  it('format prop and use12Hours default format', () => {
    const d = new Date(2024, 0, 15, 15, 5, 7);
    expect(mount(TimePicker, { props: { defaultValue: d, format: 'HH:mm' } }).find('input').element.value).toBe('15:05');
    expect(mount(TimePicker, { props: { defaultValue: d, use12Hours: true } }).find('input').element.value).toBe('下午 3:05:07');
  });

  it('range value with rangeSeparator', () => {
    const value = [new Date(2024, 0, 15, 1, 2, 3), new Date(2024, 0, 15, 4, 5, 6)];
    const w1 = mount(TimePicker, { props: { type: 'timeRange', defaultValue: value } });
    expect(w1.find('input').element.value).toBe('01:02:03 ~ 04:05:06');
    const w2 = mount(TimePicker, { props: { type: 'timeRange', defaultValue: value, rangeSeparator: ' - ' } });
    expect(w2.find('input').element.value).toBe('01:02:03 - 04:05:06');
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(TimePicker, { props: { size } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain(`semi-input-wrapper-${size}`);
  });

  it('disabled / validateStatus / borderless / inputReadOnly / showClear', () => {
    const w1 = mount(TimePicker, { props: { disabled: true, defaultValue: '01:00:00' } });
    expect(w1.find('input').attributes('disabled')).toBeDefined();
    expect(w1.find('.semi-input-clearbtn').exists()).toBe(false);
    const w2 = mount(TimePicker, { props: { validateStatus: 'error' } });
    expect(w2.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
    const w3 = mount(TimePicker, { props: { borderless: true } });
    expect(w3.find('.semi-input-wrapper').classes()).toContain('semi-input-borderless');
    const w4 = mount(TimePicker, { props: { inputReadOnly: true } });
    expect(w4.find('input').attributes('readonly')).toBeDefined();
    expect(w4.find('.semi-input-wrapper').classes()).toContain('semi-timepicker-input-readonly');
    const w5 = mount(TimePicker, { props: { showClear: false } });
    expect(w5.find('.semi-input-wrapper').classes()).not.toContain('semi-input-wrapper-clearable');
    const w6 = mount(TimePicker, { props: { showClear: true } });
    expect(w6.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-clearable');
  });

  it('insetLabel as prop and slot, prefix via attrs is ignored (hideSuffix), inputStyle', () => {
    const w1 = mount(TimePicker, { props: { insetLabel: 'Time', insetLabelId: 'lbl', inputStyle: { color: 'red' } } });
    const inset = w1.find('.semi-input-inset-label');
    expect(inset.exists()).toBe(true);
    expect(inset.text()).toBe('Time');
    expect(inset.attributes('id')).toBe('lbl');
    expect((w1.find('input').element as HTMLElement).style.color).toBe('red');
    const w2 = mount(TimePicker, { slots: { insetLabel: () => h('b', 'Slot') } });
    expect(w2.find('.semi-input-inset-label b').text()).toBe('Slot');
  });

  it('prefix as prop and as slot renders the Input prefix', () => {
    const w1 = mount(TimePicker, { props: { prefix: 'PFX' } as any });
    expect(w1.find('.semi-input-prefix').text()).toBe('PFX');
    expect(w1.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper__with-prefix');
    const w2 = mount(TimePicker, { slots: { prefix: () => h('i', { class: 'pfx-slot' }, 'S') } });
    expect(w2.find('.semi-input-prefix .pfx-slot').text()).toBe('S');
    const w3 = mount(TimePicker);
    expect(w3.find('.semi-input-prefix').exists()).toBe(false);
  });

  it('className / class attr / style attr / aria attrs', () => {
    const wrapper = mount(TimePicker, { props: { className: 'custom' }, attrs: { class: 'extra', style: 'width: 100px', 'data-test': 'tp', 'aria-labelledby': 'x' } });
    expect(wrapper.find('input').attributes('aria-labelledby')).toBe('x');
    expect(wrapper.classes()).toContain('custom');
    expect(wrapper.classes()).toContain('extra');
    expect((wrapper.element as HTMLElement).style.width).toBe('100px');
    expect(wrapper.find('input').attributes('data-test')).toBe('tp');
  });

  it('typing a valid time emits change (date first) + v-model, invalid keeps input but no change', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { props: { onChange } });
    const input = wrapper.find('input');
    await input.setValue('12:3');
    expect(onChange).not.toHaveBeenCalled();
    await input.setValue('12:30:00');
    expect(onChange).toHaveBeenCalledTimes(1);
    const [date, str] = onChange.mock.calls[0];
    expect(date).toBeInstanceOf(Date);
    expect(date.getHours()).toBe(12);
    expect(date.getMinutes()).toBe(30);
    expect(str).toBe('12:30:00');
    expect(wrapper.emitted('update:modelValue')![0][0]).toBeInstanceOf(Date);
    expect(wrapper.emitted('update:value')![0][0]).toBeInstanceOf(Date);
    expect(input.element.value).toBe('12:30:00');
  });

  it('onChangeWithDateFirst=false emits string first', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { props: { onChange, onChangeWithDateFirst: false } as any });
    await wrapper.find('input').setValue('08:00:00');
    expect(typeof onChange.mock.calls[0][0]).toBe('string');
    expect(onChange.mock.calls[0][1]).toBeInstanceOf(Date);
    expect(wrapper.emitted('update:modelValue')![0][0]).toBeInstanceOf(Date);
  });

  it('range typing emits array of dates and strings', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { props: { type: 'timeRange', onChange } });
    await wrapper.find('input').setValue('01:00:00 ~ 02:00:00');
    expect(onChange).toHaveBeenCalledTimes(1);
    const [dates, strs] = onChange.mock.calls[0];
    expect(dates).toHaveLength(2);
    expect(dates[1].getHours()).toBe(2);
    expect(strs).toEqual(['01:00:00', '02:00:00']);
  });

  it('blur restores formatted value; blur with empty input clears value', async () => {
    const wrapper = mount(TimePicker, { props: { defaultValue: '10:00:00' } });
    const input = wrapper.find('input');
    await input.setValue('10:00:0');
    await input.trigger('blur');
    expect(input.element.value).toBe('10:00:00');
    await input.setValue('');
    expect(wrapper.emitted('change')!.at(-1)![0]).toBeUndefined();
    await input.trigger('blur');
    expect(input.element.value).toBe('');
  });

  it('invalid (disabled hour) input marks input invalid', async () => {
    const wrapper = mount(TimePicker, { props: { disabledHours: () => [5] } });
    await wrapper.find('input').setValue('05:00:00');
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-timepicker-input-invalid');
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
    expect(wrapper.emitted('change')).toBeFalsy();
  });

  it('controlled value: input follows prop', async () => {
    const wrapper = mount(TimePicker, { props: { value: '01:01:01' } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('01:01:01');
    await input.setValue('02:02:02');
    expect(wrapper.emitted('change')![0][1]).toBe('02:02:02');
    await wrapper.setProps({ value: '03:03:03' });
    expect(input.element.value).toBe('03:03:03');
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref<any>(new Date(2024, 0, 15, 7, 0, 0));
        return () => h('div', [h(TimePicker, { modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, v.value instanceof Date ? v.value.getHours() : '')]);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').element.value).toBe('07:00:00');
    await wrapper.find('input').setValue('09:00:00');
    expect(wrapper.find('#out').text()).toBe('9');
  });

  it('focus opens panel and emits focus/openChange/update:open; panel renders hour/minute/second lists', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, onOpenChange, defaultValue: '10:20:30' } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(wrapper.emitted('focus')).toBeTruthy();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('update:open')![0]).toEqual([true]);
    const p = panel();
    expect(p).toBeTruthy();
    expect(p!.classList.contains('semi-timepicker-panel-column-3')).toBe(true);
    expect(p!.classList.contains('semi-timepicker-panel-narrow')).toBe(false);
    expect(document.querySelector('.semi-scrolllist')).toBeTruthy();
    expect(document.querySelectorAll('.semi-timepicker-panel-list-hour li')).toHaveLength(24);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-minute li')).toHaveLength(60);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-second li')).toHaveLength(60);
    expect(document.querySelector('.semi-timepicker-panel-list-ampm')).toBeNull();
    // selected item shows locale suffix
    const selHour = document.querySelector('.semi-timepicker-panel-list-hour li.semi-scrolllist-item-sel');
    expect(selHour!.textContent).toBe('10时');
    expect(document.querySelector('.semi-timepicker-panel-list-minute li.semi-scrolllist-item-sel')!.textContent).toBe('20分');
    expect(document.querySelector('.semi-timepicker-panel-list-second li.semi-scrolllist-item-sel')!.textContent).toBe('30秒');
    wrapper.unmount();
  });

  it('clicking an hour in the panel emits change and updates input', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, defaultValue: '10:20:30', onChange } });
    await wrapper.find('input').trigger('focus');
    await wait();
    const hours = document.querySelectorAll('.semi-timepicker-panel-list-hour li');
    (hours[13] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getHours()).toBe(13);
    expect(onChange.mock.calls[0][1]).toBe('13:20:30');
    expect(wrapper.find('input').element.value).toBe('13:20:30');
    // panel stays open
    expect(panel()).toBeTruthy();
    wrapper.unmount();
  });

  it('click outside closes the panel and emits openChange(false) + blur', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(panel()).toBeTruthy();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(panel()).toBeNull();
    expect(wrapper.emitted('openChange')!.at(-1)).toEqual([false]);
    expect(wrapper.emitted('blur')).toBeTruthy();
    wrapper.unmount();
  });

  it('defaultOpen opens the panel; open controlled', async () => {
    const w1 = mount(TimePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true } });
    await wait();
    expect(panel()).toBeTruthy();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(TimePicker, { attachTo: document.body, props: { motion: false, open: false } });
    await w2.find('input').trigger('focus');
    await wait();
    expect(panel()).toBeNull();
    expect(w2.emitted('openChange')![0]).toEqual([true]);
    await w2.setProps({ open: true });
    await wait();
    expect(panel()).toBeTruthy();
    await w2.setProps({ open: false });
    await wait();
    expect(panel()).toBeNull();
    w2.unmount();
  });

  it('disabled never opens', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, disabled: true, defaultOpen: true } });
    await wait();
    expect(panel()).toBeNull();
    wrapper.unmount();
  });

  it('use12Hours renders AM/PM list and column-4; selecting PM changes hours', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, use12Hours: true, defaultValue: new Date(2024, 0, 15, 3, 0, 0), onChange } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(panel()!.classList.contains('semi-timepicker-panel-column-4')).toBe(true);
    expect(listTexts('.semi-timepicker-panel-list-ampm')).toEqual(['上午', '下午']);
    const hours = listTexts('.semi-timepicker-panel-list-hour');
    expect(hours).toHaveLength(12);
    expect(hours[0]).toBe('12');
    (document.querySelectorAll('.semi-timepicker-panel-list-ampm li')[1] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getHours()).toBe(15);
    expect(wrapper.find('input').element.value).toBe('下午 3:00:00');
    wrapper.unmount();
  });

  it('format without seconds gives narrow panel with 2 columns', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, format: 'HH:mm' } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(panel()!.classList.contains('semi-timepicker-panel-narrow')).toBe(true);
    expect(panel()!.classList.contains('semi-timepicker-panel-column-2')).toBe(true);
    expect(document.querySelector('.semi-timepicker-panel-list-second')).toBeNull();
    wrapper.unmount();
  });

  it('hourStep / minuteStep / secondStep', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, hourStep: 2, minuteStep: 15, secondStep: 30 } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(listTexts('.semi-timepicker-panel-list-hour')).toHaveLength(12);
    expect(listTexts('.semi-timepicker-panel-list-minute')).toEqual(['00分', '15', '30', '45']);
    expect(listTexts('.semi-timepicker-panel-list-second')).toEqual(['00秒', '30']);
    wrapper.unmount();
  });

  it('disabledHours/Minutes/Seconds mark items disabled; hideDisabledOptions removes them', async () => {
    const props = { motion: false, defaultValue: '00:10:10', disabledHours: () => [1, 2], disabledMinutes: (h: number) => (h === 0 ? [5] : []), disabledSeconds: () => [7] };
    const w1 = mount(TimePicker, { attachTo: document.body, props });
    await w1.find('input').trigger('focus');
    await wait();
    const hours = document.querySelectorAll('.semi-timepicker-panel-list-hour li');
    expect(hours[1].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    expect(hours[2].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    expect(hours[3].classList.contains('semi-scrolllist-item-disabled')).toBe(false);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-minute li')[5].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-second li')[7].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(TimePicker, { attachTo: document.body, props: { ...props, hideDisabledOptions: true } });
    await w2.find('input').trigger('focus');
    await wait();
    expect(document.querySelectorAll('.semi-timepicker-panel-list-hour li')).toHaveLength(22);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-minute li')).toHaveLength(59);
    expect(document.querySelectorAll('.semi-timepicker-panel-list-second li')).toHaveLength(59);
    w2.unmount();
  });

  it('timeRange renders two panels with begin/end headers, disabledTime per panel, panels prop', async () => {
    const disabledTime = vi.fn((_v: Date[], panelType: string) => (panelType === 'right' ? { disabledHours: () => [3] } : {}));
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, type: 'timeRange', disabledTime } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(panel()!.classList.contains('semi-timepicker-range-panel')).toBe(true);
    expect(document.querySelector('.semi-timepicker-lists')).toBeTruthy();
    const lists = document.querySelectorAll('.semi-scrolllist');
    expect(lists).toHaveLength(2);
    const headers = document.querySelectorAll('.semi-scrolllist-header-title');
    expect(headers[0].textContent).toBe('开始时间');
    expect(headers[1].textContent).toBe('结束时间');
    expect(headers[0].getAttribute('x-semi-prop')).toBe('panelHeader');
    expect(disabledTime).toHaveBeenCalled();
    const rightHours = lists[1].querySelectorAll('.semi-timepicker-panel-list-hour li');
    expect(rightHours[3].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    const leftHours = lists[0].querySelectorAll('.semi-timepicker-panel-list-hour li');
    expect(leftHours[3].classList.contains('semi-scrolllist-item-disabled')).toBe(false);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(TimePicker, { attachTo: document.body, props: { motion: false, type: 'timeRange', panels: [{ panelHeader: 'L', panelFooter: 'LF' }, { panelHeader: 'R', panelFooter: 'RF' }] } });
    await w2.find('input').trigger('focus');
    await wait();
    const t = document.querySelectorAll('.semi-scrolllist-header-title');
    expect(t[0].textContent).toBe('L');
    expect(t[1].textContent).toBe('R');
    const f = document.querySelectorAll('.semi-scrolllist-footer');
    expect(f[0].textContent).toBe('LF');
    expect(f[1].textContent).toBe('RF');
    w2.unmount();
  });

  it('range: selecting in second panel changes index 1', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, type: 'timeRange', defaultValue: ['01:00:00', '02:00:00'], onChange } });
    await wrapper.find('input').trigger('focus');
    await wait();
    const lists = document.querySelectorAll('.semi-scrolllist');
    (lists[1].querySelectorAll('.semi-timepicker-panel-list-hour li')[5] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toEqual(['01:00:00', '05:00:00']);
    expect(wrapper.find('input').element.value).toBe('01:00:00 ~ 05:00:00');
    wrapper.unmount();
  });

  it('panelHeader / panelFooter as prop, array (range) and slot', async () => {
    const w1 = mount(TimePicker, { attachTo: document.body, props: { motion: false, panelHeader: 'Head', panelFooter: 'Foot' } });
    await w1.find('input').trigger('focus');
    await wait();
    expect(document.querySelector('.semi-scrolllist-header-title')!.textContent).toBe('Head');
    expect(document.querySelector('.semi-scrolllist-footer')!.textContent).toBe('Foot');
    expect(document.querySelector('.semi-scrolllist-footer')!.getAttribute('x-semi-prop')).toBe('panelFooter');
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(TimePicker, { attachTo: document.body, props: { motion: false, type: 'timeRange', panelHeader: ['A', 'B'] } });
    await w2.find('input').trigger('focus');
    await wait();
    const t = document.querySelectorAll('.semi-scrolllist-header-title');
    expect(t[0].textContent).toBe('A');
    expect(t[1].textContent).toBe('B');
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = mount(TimePicker, { attachTo: document.body, props: { motion: false }, slots: { panelHeader: () => h('em', 'SH'), panelFooter: () => h('i', 'SF') } });
    await w3.find('input').trigger('focus');
    await wait();
    expect(document.querySelector('.semi-scrolllist-header-title em')!.textContent).toBe('SH');
    expect(document.querySelector('.semi-scrolllist-footer i')!.textContent).toBe('SF');
    w3.unmount();
  });

  it('scrollItemProps are forwarded to ScrollItem', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, scrollItemProps: { class: 'my-item', ariaLabel: 'col' } } });
    await wrapper.find('input').trigger('focus');
    await wait();
    expect(document.querySelector('.semi-timepicker-panel-list-hour')!.classList.contains('my-item')).toBe(true);
    expect(document.querySelector('.semi-timepicker-panel-list-hour ul')!.getAttribute('aria-label')).toBe('col');
    wrapper.unmount();
  });

  it('popupClassName / popupStyle / position / getPopupContainer / zIndex', async () => {
    const container = document.createElement('div');
    container.id = 'c';
    document.body.appendChild(container);
    const wrapper = mount(TimePicker, {
      attachTo: document.body,
      props: { motion: false, popupClassName: 'pop', popupStyle: { color: 'rgb(1, 2, 3)' }, position: 'top', getPopupContainer: () => container, zIndex: 2000 },
    });
    await wrapper.find('input').trigger('focus');
    await wait();
    const p = panel()!;
    expect(p.classList.contains('pop')).toBe(true);
    expect(container.contains(p)).toBe(true);
    const wrapperEl = document.querySelector('.semi-timepicker-panel-default-wrapper') as HTMLElement;
    expect(wrapperEl.style.color).toBe('rgb(1, 2, 3)');
    expect(wrapperEl.getAttribute('x-placement')).toBe('top');
    expect((document.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    wrapper.unmount();
  });

  it('default position is bottomLeft; rtl uses bottomRight', async () => {
    const w1 = mount(TimePicker, { attachTo: document.body, props: { motion: false } });
    expect((w1.vm as any).foundation.getPosition()).toBe('bottomLeft');
    w1.unmount();
    const w2 = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(TimePicker, { motion: false }) } });
    expect((w2.findComponent(TimePicker).vm as any).foundation.getPosition()).toBe('bottomRight');
    w2.unmount();
  });

  it('triggerRender renders a custom trigger and click opens the panel', async () => {
    const triggerRender = vi.fn((p: any) => h('button', { class: 'custom-trigger' }, p.inputValue || p.placeholder));
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false, triggerRender, defaultValue: '11:11:11' } });
    const btn = wrapper.find('.custom-trigger');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('11:11:11');
    expect(wrapper.find('.semi-timepicker-header').exists()).toBe(false);
    expect(triggerRender.mock.calls[0][0].componentName).toBe('TimePicker');
    expect(triggerRender.mock.calls[0][0].value[0]).toBeInstanceOf(Date);
    await wrapper.trigger('click');
    await wait();
    expect(panel()).toBeTruthy();
    expect(wrapper.emitted('openChange')![0]).toEqual([true]);
    wrapper.unmount();
  });

  it('timeZone from ConfigProvider converts value for display and emits UTC-based dates', async () => {
    const onChange = vi.fn();
    const value = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));
    const wrapper = mount(ConfigProvider, { attachTo: document.body, props: { timeZone: 'Asia/Shanghai' }, slots: { default: () => h(TimePicker, { defaultValue: value, onChange }) } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('08:00:00');
    await input.setValue('09:00:00');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getUTCHours()).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe('09:00:00');
    wrapper.unmount();
  });

  it('timeZone prop directly + changing timeZone refreshes the display', async () => {
    const value = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));
    const wrapper = mount(TimePicker, { props: { value, timeZone: 8 } });
    expect(wrapper.find('input').element.value).toBe('08:00:00');
    await wrapper.setProps({ timeZone: 9 });
    expect(wrapper.find('input').element.value).toBe('09:00:00');
  });

  it('exposes focus/blur/open/close', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { motion: false } });
    const vm = wrapper.vm as any;
    expect(typeof vm.focus).toBe('function');
    expect(typeof vm.blur).toBe('function');
    vm.open();
    await wait();
    expect(panel()).toBeTruthy();
    vm.close();
    await wait();
    expect(panel()).toBeNull();
    wrapper.unmount();
  });

  it('clear button clears value and emits change with undefined', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimePicker, { props: { defaultValue: '10:00:00', onChange } });
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    await nextTick();
    const clear = wrapper.find('.semi-input-clearbtn');
    expect(clear.exists()).toBe(true);
    await clear.trigger('mousedown');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBeUndefined();
    expect(wrapper.find('input').element.value).toBe('');
  });

  it('focusOnOpen focuses input after mount', async () => {
    const wrapper = mount(TimePicker, { attachTo: document.body, props: { focusOnOpen: true, motion: false } });
    await wait();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });
});

describe('TimeInput', () => {
  it('renders wrap + input, emits change/focus/blur/click', async () => {
    const wrapper = mount(TimeInput, { props: { prefixCls: 'semi-timepicker', value: '01:00:00', locale: { placeholder: { time: 'ph' } }, type: 'time' } });
    expect(wrapper.classes()).toContain('semi-timepicker-input-wrap');
    expect(wrapper.find('input').attributes('placeholder')).toBe('ph');
    await wrapper.find('input').setValue('02:00:00');
    expect(wrapper.emitted('change')![0][0]).toBe('02:00:00');
    await wrapper.find('input').trigger('focus');
    expect(wrapper.emitted('focus')).toBeTruthy();
    await wrapper.find('input').trigger('blur');
    expect(wrapper.emitted('blur')).toBeTruthy();
    await wrapper.find('.semi-input-suffix svg').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('invalid adds error status and invalid class', () => {
    const wrapper = mount(TimeInput, { props: { prefixCls: 'semi-timepicker', invalid: true } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-timepicker-input-invalid');
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
  });
});

describe('TimePickerCombobox', () => {
  it('renders lists from timeStampValue and emits change on select', async () => {
    const ts = new Date(2024, 0, 15, 8, 30, 45).getTime();
    const onChange = vi.fn();
    const wrapper = mount(TimePickerCombobox, { props: { prefixCls: 'semi-timepicker-panel', timeStampValue: ts, format: 'HH:mm:ss', onChange } });
    expect(wrapper.find('.semi-timepicker-panel-list-hour li.semi-scrolllist-item-sel').text()).toBe('08时');
    await wrapper.findAll('.semi-timepicker-panel-list-minute li')[10].trigger('click');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ value: '08:10:45' });
    expect(new Date(onChange.mock.calls[0][0].timeStampValue).getMinutes()).toBe(10);
  });

  it('re-inits options when props change; exposes reselect', async () => {
    const wrapper = mount(TimePickerCombobox, { props: { prefixCls: 'p', timeStampValue: undefined, format: 'HH:mm:ss' } });
    expect(wrapper.findAll('.p-list-hour li')).toHaveLength(24);
    await wrapper.setProps({ hourStep: 6 });
    expect(wrapper.findAll('.p-list-hour li')).toHaveLength(4);
    await wrapper.setProps({ format: 'HH' });
    expect(wrapper.find('.p-list-minute').exists()).toBe(false);
    expect(typeof (wrapper.vm as any).reselect).toBe('function');
    (wrapper.vm as any).reselect();
  });
});
