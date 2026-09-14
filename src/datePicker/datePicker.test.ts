import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DatePicker, { DateInput, DatePickerMonth, DatePickerNavigation, DatePickerQuickControl, DatePickerFooter, DatePickerYearAndMonth, DatePickerMonthsGrid } from './index';
import ConfigProvider from '../configProvider';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const panel = () => document.querySelector('.semi-portal .semi-datepicker') as HTMLElement | null;
const dayCell = (fullDate: string) => document.querySelector(`.semi-datepicker-day[title="${fullDate}"]`) as HTMLElement | null;
const D = (y: number, m: number, d: number, hh = 0, mm = 0, ss = 0) => new Date(y, m, d, hh, mm, ss);

describe('DatePicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root, combobox wrapper, input with locale placeholder + calendar icon', () => {
    const wrapper = mount(DatePicker);
    expect(wrapper.classes()).toContain('semi-datepicker');
    const combo = wrapper.find('[role="combobox"]');
    expect(combo.exists()).toBe(true);
    expect(combo.classes()).toContain('semi-datepicker-input');
    expect(combo.attributes('aria-label')).toBe('Choose date');
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请选择日期');
    expect(input.element.value).toBe('');
    expect(wrapper.find('.semi-input-suffix svg').exists()).toBe(true);
    expect(panel()).toBeNull();
  });

  it('placeholder prop / dateTime locale placeholder / LocaleProvider', () => {
    expect(mount(DatePicker, { props: { placeholder: 'pick' } }).find('input').attributes('placeholder')).toBe('pick');
    expect(mount(DatePicker, { props: { type: 'dateTime' } }).find('input').attributes('placeholder')).toBe('请选择日期及时间');
    const w = mount(LocaleProvider, { props: { locale: en_US as any }, slots: { default: () => h(DatePicker) } });
    expect(w.find('input').attributes('placeholder')).toBe('Select date');
  });

  it('defaultValue Date / string / number formatted with default format; format prop', () => {
    const d = D(2024, 0, 15, 9, 5, 7);
    expect(mount(DatePicker, { props: { defaultValue: d } }).find('input').element.value).toBe('2024-01-15');
    expect(mount(DatePicker, { props: { defaultValue: '2024-01-15' } }).find('input').element.value).toBe('2024-01-15');
    expect(mount(DatePicker, { props: { defaultValue: d.getTime() } }).find('input').element.value).toBe('2024-01-15');
    expect(mount(DatePicker, { props: { defaultValue: d, format: 'yyyy/MM/dd' } }).find('input').element.value).toBe('2024/01/15');
    expect(mount(DatePicker, { props: { defaultValue: d, type: 'dateTime' } }).find('input').element.value).toBe('2024-01-15 09:05:07');
    expect(mount(DatePicker, { props: { defaultValue: d, type: 'month' } }).find('input').element.value).toBe('2024-01');
  });

  it('format without time tokens downgrades dateTime to date (aria-label Change date)', () => {
    const wrapper = mount(DatePicker, { props: { type: 'dateTime', format: 'yyyy-MM-dd', defaultValue: D(2024, 0, 15, 9) } });
    expect(wrapper.find('input').element.value).toBe('2024-01-15');
    expect(wrapper.find('[role="combobox"]').attributes('aria-label')).toBe('Change date');
    expect(wrapper.find('.semi-input-suffix svg').exists()).toBe(true);
  });

  it('dateRange renders two inputs, separator, active class on focus, rangeSeparator padded', async () => {
    const wrapper = mount(DatePicker, { props: { type: 'dateRange', defaultValue: [D(2024, 0, 1), D(2024, 0, 10)], rangeSeparator: '-' } });
    const combo = wrapper.find('[role="combobox"]');
    expect(combo.classes()).toContain('semi-datepicker-range-input');
    expect(combo.classes()).toContain('semi-datepicker-range-input-default');
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].element.value).toBe('2024-01-01');
    expect(inputs[1].element.value).toBe('2024-01-10');
    expect(wrapper.find('.semi-datepicker-range-input-separator').text()).toBe('-');
    expect(wrapper.find('.semi-datepicker-range-input-wrapper-start').exists()).toBe(true);
    expect(wrapper.find('.semi-datepicker-range-input-wrapper-end').exists()).toBe(true);
    expect(inputs[0].attributes('placeholder')).toBe('开始日期');
    expect(inputs[1].attributes('placeholder')).toBe('结束日期');
    await inputs[1].trigger('focus');
    expect(wrapper.find('.semi-datepicker-range-input-wrapper-end').classes()).toContain('semi-datepicker-range-input-wrapper-active');
    expect(combo.classes()).toContain('semi-datepicker-range-input-active');
  });

  it('rangeSeparatorNode prop and slot, placeholder array', () => {
    const w1 = mount(DatePicker, { props: { type: 'dateRange', rangeSeparatorNode: 'TO', placeholder: ['from', 'to'] } });
    expect(w1.find('.semi-datepicker-range-input-separator').text()).toBe('TO');
    const inputs = w1.findAll('input');
    expect(inputs[0].attributes('placeholder')).toBe('from');
    expect(inputs[1].attributes('placeholder')).toBe('to');
    const w2 = mount(DatePicker, { props: { type: 'dateRange' }, slots: { rangeSeparatorNode: () => h('b', 'SEP') } });
    expect(w2.find('.semi-datepicker-range-input-separator b').text()).toBe('SEP');
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(DatePicker, { props: { size } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain(`semi-input-wrapper-${size}`);
    const range = mount(DatePicker, { props: { size, type: 'dateRange' } });
    expect(range.find('[role="combobox"]').classes()).toContain(`semi-datepicker-range-input-${size}`);
  });

  it('disabled / validateStatus / borderless / inputReadOnly / showClear=false', () => {
    const w1 = mount(DatePicker, { props: { disabled: true } });
    expect(w1.find('input').attributes('disabled')).toBeDefined();
    expect(w1.find('[role="combobox"]').attributes('aria-disabled')).toBe('true');
    const w2 = mount(DatePicker, { props: { validateStatus: 'error' } });
    expect(w2.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
    const w3 = mount(DatePicker, { props: { borderless: true } });
    expect(w3.find('.semi-input-wrapper').classes()).toContain('semi-input-borderless');
    expect(w3.find('[role="combobox"]').classes()).toContain('semi-datepicker-borderless');
    const w4 = mount(DatePicker, { props: { inputReadOnly: true } });
    expect(w4.find('input').attributes('readonly')).toBeDefined();
    expect(w4.find('.semi-input-wrapper').classes()).toContain('semi-datepicker-input-readonly');
    const w5 = mount(DatePicker, { props: { showClear: false } });
    expect(w5.find('.semi-input-wrapper').classes()).not.toContain('semi-input-wrapper-clearable');
    const w6 = mount(DatePicker, { props: { type: 'dateRange', disabled: true, validateStatus: 'warning' } });
    expect(w6.find('[role="combobox"]').classes()).toContain('semi-datepicker-range-input-disabled');
    expect(w6.find('[role="combobox"]').classes()).toContain('semi-datepicker-range-input-warning');
  });

  it('prefix / insetLabel as prop and slot (single + range)', () => {
    const w1 = mount(DatePicker, { props: { prefix: 'P' } });
    expect(w1.find('.semi-input-prefix').text()).toBe('P');
    const w2 = mount(DatePicker, { props: { insetLabel: 'L', insetLabelId: 'lid' } });
    expect(w2.find('.semi-input-inset-label').text()).toBe('L');
    expect(w2.find('.semi-input-inset-label').attributes('id')).toBe('lid');
    const w3 = mount(DatePicker, { slots: { prefix: () => h('i', 'SP') } });
    expect(w3.find('.semi-input-prefix i').text()).toBe('SP');
    const w4 = mount(DatePicker, { props: { type: 'dateRange', prefix: 'RP' } });
    expect(w4.find('.semi-datepicker-range-input-prefix').text()).toBe('RP');
    expect(w4.find('.semi-datepicker-range-input-wrapper-start').classes()).toContain('semi-datepicker-range-input-wrapper-start-with-prefix');
    const w5 = mount(DatePicker, { props: { type: 'dateRange' }, slots: { insetLabel: () => h('em', 'RL') } });
    expect(w5.find('.semi-datepicker-range-input-prefix em').text()).toBe('RL');
  });

  it('className / class attr / style / data attrs / aria attrs / inputStyle', () => {
    const wrapper = mount(DatePicker, {
      props: { className: 'custom', style: { width: '10px' }, 'aria-labelledby': 'lb', 'aria-required': true, inputStyle: { color: 'red' } },
      attrs: { class: 'extra', 'data-x': '1' },
    });
    expect(wrapper.classes()).toContain('custom');
    expect(wrapper.classes()).toContain('extra');
    expect((wrapper.element as HTMLElement).style.width).toBe('10px');
    const w2 = mount(DatePicker, { attrs: { style: 'height: 5px' } });
    expect((w2.element as HTMLElement).style.height).toBe('5px');
    expect(wrapper.attributes('data-x')).toBe('1');
    expect(wrapper.attributes('aria-labelledby')).toBe('lb');
    expect(wrapper.attributes('aria-required')).toBe('true');
    expect((wrapper.find('input').element as HTMLElement).style.color).toBe('red');
  });

  it('typing a full valid date emits change (date first) + v-model updates', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { onChange } });
    const input = wrapper.find('input');
    await input.setValue('2024-01-1');
    expect(onChange).not.toHaveBeenCalled();
    expect(input.element.value).toBe('2024-01-1');
    await input.setValue('2024-01-15');
    expect(onChange).toHaveBeenCalledTimes(1);
    const [date, str] = onChange.mock.calls[0];
    expect(date).toBeInstanceOf(Date);
    expect(date.getDate()).toBe(15);
    expect(str).toBe('2024-01-15');
    expect(wrapper.emitted('update:modelValue')![0][0]).toBeInstanceOf(Date);
    expect(wrapper.emitted('update:value')![0][0]).toBeInstanceOf(Date);
  });

  it('onChangeWithDateFirst=false emits string first', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { onChange, onChangeWithDateFirst: false } as any });
    await wrapper.find('input').setValue('2024-01-15');
    expect(onChange.mock.calls[0][0]).toBe('2024-01-15');
    expect(onChange.mock.calls[0][1]).toBeInstanceOf(Date);
    expect(wrapper.emitted('update:modelValue')![0][0]).toBeInstanceOf(Date);
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref<any>(D(2024, 0, 15));
        return () => h('div', [h(DatePicker, { modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, v.value instanceof Date ? v.value.getDate() : '')]);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').element.value).toBe('2024-01-15');
    await wrapper.find('input').setValue('2024-01-20');
    expect(wrapper.find('#out').text()).toBe('20');
    expect(wrapper.find('input').element.value).toBe('2024-01-20');
  });

  it('controlled value: input follows prop', async () => {
    const wrapper = mount(DatePicker, { props: { value: '2024-01-01' } });
    expect(wrapper.find('input').element.value).toBe('2024-01-01');
    await wrapper.setProps({ value: D(2024, 1, 2) });
    expect(wrapper.find('input').element.value).toBe('2024-02-02');
  });

  it('multiple: typing comma separated dates, max limits', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { multiple: true, max: 2, onChange, defaultValue: [D(2024, 0, 1), D(2024, 0, 2)] } });
    expect(wrapper.find('input').element.value).toBe('2024-01-01,2024-01-02');
    await wrapper.find('input').setValue('2024-01-01,2024-01-03');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toHaveLength(2);
    expect(onChange.mock.calls[0][1]).toEqual(['2024-01-01', '2024-01-03']);
    await wrapper.find('input').setValue('2024-01-01,2024-01-03,2024-01-04');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('enter press with empty input falls back to current date', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { onChange } });
    await wrapper.find('input').trigger('keypress', { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it('clear button emits clear + change(undefined) and clears input', async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { defaultValue: D(2024, 0, 15), onClear, onChange } });
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    await nextTick();
    const btn = wrapper.find('.semi-input-clearbtn');
    expect(btn.exists()).toBe(true);
    await btn.trigger('mousedown');
    expect(onClear).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBeUndefined();
    expect(wrapper.find('input').element.value).toBe('');
  });

  it('range clear button clears both values and emits clear/change([])', async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { props: { type: 'dateRange', defaultValue: [D(2024, 0, 1), D(2024, 0, 10)], onClear, onChange } });
    const btn = wrapper.find('.semi-datepicker-range-input-clearbtn');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('aria-label')).toBe('Clear range input value');
    await btn.trigger('mousedown');
    expect(onClear).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toEqual([]);
    expect(wrapper.findAll('input')[0].element.value).toBe('');
    expect(wrapper.find('.semi-datepicker-range-input-clearbtn').exists()).toBe(false);
  });

  it('clearIcon prop is used for range clear button', () => {
    const wrapper = mount(DatePicker, { props: { type: 'dateRange', defaultValue: [D(2024, 0, 1), D(2024, 0, 10)], clearIcon: h('i', { class: 'my-clear' }) } });
    expect(wrapper.find('.semi-datepicker-range-input-clearbtn .my-clear').exists()).toBe(true);
  });

  it('focus opens panel with month grid, weekday header, cells; emits focus/openChange/update:open', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultValue: D(2024, 0, 15), onOpenChange } });
    await wrapper.find('input').trigger('focus');
    expect(wrapper.emitted('focus')).toBeTruthy();
    expect(panel()).toBeNull();
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('update:open')![0]).toEqual([true]);
    const p = panel()!;
    expect(p).toBeTruthy();
    expect(p.getAttribute('x-type')).toBe('date');
    expect(p.querySelector('.semi-datepicker-container')).toBeTruthy();
    expect(p.querySelector('.semi-datepicker-month-grid')).toBeTruthy();
    expect(p.querySelector('.semi-datepicker-month-grid-left')!.getAttribute('x-open-type')).toBe('date');
    expect(p.querySelector('.semi-datepicker-navigation-month')!.textContent).toBe('2024年 1月');
    const weekdays = Array.from(p.querySelectorAll('.semi-datepicker-weekday-item')).map((e) => e.textContent);
    expect(weekdays).toEqual(['日', '一', '二', '三', '四', '五', '六']);
    expect(p.querySelectorAll('.semi-datepicker-week')).toHaveLength(5);
    const selected = p.querySelector('.semi-datepicker-day-selected') as HTMLElement;
    expect(selected.getAttribute('title')).toBe('2024-01-15');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.textContent).toBe('15');
    expect(p.querySelector('.semi-datepicker-footer')).toBeNull();
    wrapper.unmount();
  });

  it('clicking a day emits change, updates input and closes panel', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultValue: D(2024, 0, 15), onChange } });
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    dayCell('2024-01-20')!.click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getDate()).toBe(20);
    expect(onChange.mock.calls[0][1]).toBe('2024-01-20');
    expect(wrapper.find('input').element.value).toBe('2024-01-20');
    expect(panel()).toBeNull();
    expect(wrapper.emitted('openChange')!.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('weekStartsOn=1 starts with Monday', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, weekStartsOn: 1, defaultOpen: true } });
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-weekday-item')!.textContent).toBe('一');
    wrapper.unmount();
  });

  it('disabledDate marks cells disabled and blocks click', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, defaultValue: D(2024, 0, 15), disabledDate: (d?: Date) => Boolean(d && d.getDate() === 20), onChange },
    });
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    const cell = dayCell('2024-01-20')!;
    expect(cell.classList.contains('semi-datepicker-day-disabled')).toBe(true);
    expect(cell.getAttribute('aria-disabled')).toBe('true');
    expect(cell.getAttribute('tabindex')).toBe('-1');
    cell.click();
    await wait();
    expect(onChange).not.toHaveBeenCalled();
    expect(panel()).toBeTruthy();
    wrapper.unmount();
  });

  it('renderDate / renderFullDate customise cells', async () => {
    const renderDate = vi.fn((dayNumber: any, _fullDate?: string) => h('b', { class: 'rd' }, `d${dayNumber}`));
    const w1 = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, defaultValue: D(2024, 0, 15), renderDate } });
    await wait();
    expect(dayCell('2024-01-15')!.querySelector('.semi-datepicker-day-main b.rd')!.textContent).toBe('d15');
    expect(renderDate.mock.calls.some((c) => c[1] === '2024-01-15')).toBe(true);
    w1.unmount();
    document.body.innerHTML = '';
    const renderFullDate = vi.fn((dayNumber: any, fullDate: string, status: any) => h('i', { class: status.isSelected ? 'full-sel' : 'full' }, String(dayNumber)));
    const w2 = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, defaultValue: D(2024, 0, 15), renderFullDate } });
    await wait();
    const cell = dayCell('2024-01-15')!;
    expect(cell.querySelector('i.full-sel')).toBeTruthy();
    expect(cell.classList.contains('semi-datepicker-day-selected')).toBe(false);
    w2.unmount();
  });

  it('navigation prev/next month & year emit panelChange; autoSwitchDate moves value', async () => {
    const onPanelChange = vi.fn();
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, defaultValue: D(2024, 0, 15), onPanelChange, onChange } });
    await wait();
    (panel()!.querySelector('[aria-label="Next month"]') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-navigation-month')!.textContent).toBe('2024年 2月');
    expect(onPanelChange).toHaveBeenCalledTimes(1);
    expect(onPanelChange.mock.calls[0][0].getMonth()).toBe(1);
    expect(onPanelChange.mock.calls[0][1]).toBe('2024-02-15');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(wrapper.find('input').element.value).toBe('2024-02-15');
    (panel()!.querySelector('[aria-label="Previous year"]') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-navigation-month')!.textContent).toBe('2023年 2月');
    (panel()!.querySelector('[aria-label="Next year"]') as HTMLElement).click();
    (panel()!.querySelector('[aria-label="Previous month"]') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-navigation-month')!.textContent).toBe('2024年 1月');
    wrapper.unmount();
  });

  it('autoSwitchDate=false keeps the value when navigating', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, defaultValue: D(2024, 0, 15), autoSwitchDate: false, onChange } });
    await wait();
    (panel()!.querySelector('[aria-label="Next month"]') as HTMLElement).click();
    await wait();
    expect(onChange).not.toHaveBeenCalled();
    expect(wrapper.find('input').element.value).toBe('2024-01-15');
    wrapper.unmount();
  });

  it('clicking month title opens year/month layer; selecting navigates back', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, defaultValue: D(2024, 0, 15), autoSwitchDate: false } });
    await wait();
    (panel()!.querySelector('.semi-datepicker-navigation-month button') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-yam')).toBeTruthy();
    expect(panel()!.querySelector('.semi-datepicker-month-grid-left')!.getAttribute('x-open-type')).toBe('year');
    expect(panel()!.querySelector('.semi-datepicker-month-grid')!.getAttribute('x-panel-yearandmonth-open-type')).toBe('left');
    expect(panel()!.querySelector('.semi-datepicker-month-grid-left')!.classList.contains('semi-datepicker-yam-showing')).toBe(true);
    const lists = panel()!.querySelectorAll('.semi-scrolllist-item');
    expect(lists).toHaveLength(2);
    expect(lists[0].querySelector('.semi-scrolllist-item-sel')!.textContent).toBe('2024年');
    expect(lists[1].querySelector('.semi-scrolllist-item-sel')!.textContent).toBe('1月');
    // select March
    (lists[1].querySelectorAll('li')[2] as HTMLElement).click();
    await wait();
    // back to main
    (panel()!.querySelector('.semi-datepicker-yearmonth-header button') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-yam')).toBeNull();
    expect(panel()!.querySelector('.semi-datepicker-navigation-month')!.textContent).toBe('2024年 3月');
    wrapper.unmount();
  });

  it('dateRange: two panels, selecting start then end emits change and closes', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateRange', defaultPickerValue: D(2024, 0, 1), onChange } });
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    const p = panel()!;
    expect(p.getAttribute('x-type')).toBe('dateRange');
    expect(p.querySelector('.semi-datepicker-month-grid-left')).toBeTruthy();
    expect(p.querySelector('.semi-datepicker-month-grid-right')).toBeTruthy();
    const titles = Array.from(p.querySelectorAll('.semi-datepicker-navigation-month')).map((e) => e.textContent);
    expect(titles).toEqual(['2024年 1月', '2024年 2月']);
    dayCell('2024-01-05')!.click();
    await wait();
    expect(onChange).not.toHaveBeenCalled();
    expect(wrapper.findAll('input')[0].element.value).toBe('2024-01-05');
    expect(dayCell('2024-01-05')!.classList.contains('semi-datepicker-day-selected-start')).toBe(true);
    dayCell('2024-01-10')!.click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toEqual(['2024-01-05', '2024-01-10']);
    expect(wrapper.findAll('input')[1].element.value).toBe('2024-01-10');
    expect(panel()).toBeNull();
    wrapper.unmount();
  });

  it('dateRange hover marks in-range classes; day-inrange on selected range', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateRange', defaultOpen: true, defaultValue: [D(2024, 0, 5), D(2024, 0, 10)] } });
    await wait();
    expect(dayCell('2024-01-07')!.classList.contains('semi-datepicker-day-inrange')).toBe(true);
    expect(dayCell('2024-01-10')!.classList.contains('semi-datepicker-day-selected-end')).toBe(true);
    wrapper.unmount();
  });

  it('startDateOffset / endDateOffset select a week on click', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: {
        motion: false,
        type: 'dateRange',
        defaultOpen: true,
        defaultPickerValue: D(2024, 0, 1),
        startDateOffset: (d?: Date) => new Date(d!.getFullYear(), d!.getMonth(), d!.getDate() - 1),
        endDateOffset: (d?: Date) => new Date(d!.getFullYear(), d!.getMonth(), d!.getDate() + 1),
        onChange,
      },
    });
    await wait();
    dayCell('2024-01-15')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await wait();
    expect(dayCell('2024-01-14')!.classList.contains('semi-datepicker-day-offsetrange-start')).toBe(true);
    expect(dayCell('2024-01-16')!.classList.contains('semi-datepicker-day-offsetrange-end')).toBe(true);
    dayCell('2024-01-15')!.click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toEqual(['2024-01-14', '2024-01-16']);
    wrapper.unmount();
  });

  it('syncSwitchMonth hides inner nav buttons and switches both panels', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateRange', defaultOpen: true, syncSwitchMonth: true, defaultPickerValue: D(2024, 0, 1) } });
    await wait();
    const leftNav = panel()!.querySelector('.semi-datepicker-month-grid-left .semi-datepicker-navigation')!;
    expect((leftNav.querySelector('[aria-label="Next month"]') as HTMLElement).style.visibility).toBe('hidden');
    (leftNav.querySelector('[aria-label="Previous month"]') as HTMLElement).click();
    await wait();
    const titles = Array.from(panel()!.querySelectorAll('.semi-datepicker-navigation-month')).map((e) => e.textContent);
    expect(titles).toEqual(['2023年 12月', '2024年 1月']);
    wrapper.unmount();
  });

  it('dateTime: switch bar, time layer with combobox, selecting time emits change', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTime', defaultOpen: true, defaultValue: D(2024, 0, 15, 10, 20, 30), onChange } });
    await wait();
    const p = panel()!;
    const sw = p.querySelector('.semi-datepicker-switch')!;
    expect(sw).toBeTruthy();
    expect(sw.querySelector('.semi-datepicker-switch-date')!.classList.contains('semi-datepicker-switch-date-active')).toBe(true);
    expect(sw.querySelector('.semi-datepicker-switch-date .semi-datepicker-switch-text')!.textContent).toBe('2024-01-15');
    expect(sw.querySelector('.semi-datepicker-switch-time .semi-datepicker-switch-text')!.textContent).toBe('10:20:30');
    (sw.querySelector('[aria-label="Switch to time panel"]') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-tpk .semi-datepicker-time')).toBeTruthy();
    expect(panel()!.querySelector('.semi-datepicker-month-grid-left')!.getAttribute('x-open-type')).toBe('time');
    expect(panel()!.querySelector('.semi-scrolllist-header-title')!.textContent).toBe('选择时间');
    const hours = panel()!.querySelectorAll('.semi-timepicker-panel-list-hour li, .semi-scrolllist-item ul li');
    expect(hours.length).toBeGreaterThan(0);
    const hourItems = panel()!.querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    (hourItems[12] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getHours()).toBe(12);
    expect(onChange.mock.calls[0][1]).toBe('2024-01-15 12:20:30');
    expect(panel()).toBeTruthy();
    wrapper.unmount();
  });

  it('needConfirm renders footer; confirm emits confirm + change; cancel emits cancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTime', needConfirm: true, defaultOpen: true, defaultValue: D(2024, 0, 15, 1, 1, 1), onConfirm, onCancel, onChange } });
    await wait();
    const footer = panel()!.querySelector('.semi-datepicker-footer')!;
    expect(footer).toBeTruthy();
    const btns = footer.querySelectorAll('button');
    expect(btns[0].textContent).toBe('取消');
    expect(btns[1].textContent).toBe('确定');
    dayCell('2024-01-20')!.click();
    await wait();
    expect(panel()).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
    (panel()!.querySelector('.semi-datepicker-footer button:last-child') as HTMLElement).click();
    await wait();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][1]).toBe('2024-01-20 01:01:01');
    expect(panel()).toBeNull();
    expect(wrapper.find('input').element.value).toBe('2024-01-20 01:01:01');
    (wrapper.vm as any).open();
    await wait();
    (panel()!.querySelector('.semi-datepicker-footer button:first-child') as HTMLElement).click();
    await wait();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(panel()).toBeNull();
    wrapper.unmount();
  });

  it('needConfirm range: confirm disabled until range complete; click outside does not close', async () => {
    const onClickOutSide = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTimeRange', needConfirm: true, defaultOpen: true, defaultPickerValue: D(2024, 0, 1), onClickOutSide } });
    await wait();
    const confirmBtn = panel()!.querySelector('.semi-datepicker-footer button:last-child') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false);
    dayCell('2024-01-05')!.click();
    await wait();
    expect((panel()!.querySelector('.semi-datepicker-footer button:last-child') as HTMLButtonElement).disabled).toBe(true);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(onClickOutSide).toHaveBeenCalled();
    expect(panel()).toBeTruthy();
    wrapper.unmount();
  });

  it('click outside closes (no confirm), emits clickOutSide, openChange(false), blur', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false } });
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    expect(panel()).toBeTruthy();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('clickOutSide')).toBeTruthy();
    expect(panel()).toBeNull();
    expect(wrapper.emitted('openChange')!.at(-1)).toEqual([false]);
    expect(wrapper.emitted('blur')).toBeTruthy();
    wrapper.unmount();
  });

  it('open controlled / defaultOpen / disabled', async () => {
    const w1 = mount(DatePicker, { attachTo: document.body, props: { motion: false, open: false } });
    await w1.find('[role="combobox"]').trigger('click');
    await wait();
    expect(panel()).toBeNull();
    expect(w1.emitted('openChange')![0]).toEqual([true]);
    await w1.setProps({ open: true });
    await wait();
    expect(panel()).toBeTruthy();
    await w1.setProps({ open: false });
    await wait();
    expect(panel()).toBeNull();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, disabled: true } });
    await wait();
    expect(panel()).toBeNull();
    w2.unmount();
  });

  it('presets render quick controls (bottom default), click emits presetClick + change', async () => {
    const onPresetClick = vi.fn();
    const onChange = vi.fn();
    const presets = [{ text: 'Today', start: D(2024, 0, 15), end: D(2024, 0, 15) }, () => ({ text: 'Fn', start: '2024-02-01' })];
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, presets, onPresetClick, onChange } });
    await wait();
    const qc = panel()!.querySelector('.semi-datepicker-quick-control')!;
    expect(qc).toBeTruthy();
    expect(qc.classList.contains('semi-datepicker-quick-control-bottom')).toBe(true);
    expect(qc.classList.contains('semi-datepicker-quick-control-date')).toBe(true);
    expect(qc.querySelector('.semi-datepicker-quick-control-header')).toBeNull();
    const btns = qc.querySelectorAll('button');
    expect(btns).toHaveLength(2);
    expect(btns[1].textContent).toContain('Fn');
    (btns[0] as HTMLElement).click();
    await wait();
    expect(onPresetClick).toHaveBeenCalledTimes(1);
    expect(onPresetClick.mock.calls[0][0].text).toBe('Today');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe('2024-01-15');
    expect(wrapper.find('input').element.value).toBe('2024-01-15');
    wrapper.unmount();
  });

  it.each(['left', 'right', 'top'] as const)('presetPosition=%s', async (presetPosition) => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, presets: [{ text: 'A', start: D(2024, 0, 1) }], presetPosition } });
    await wait();
    const qc = panel()!.querySelector('.semi-datepicker-quick-control')!;
    expect(qc.classList.contains(`semi-datepicker-quick-control-${presetPosition}`)).toBe(true);
    if (presetPosition === 'left' || presetPosition === 'right') {
      expect(qc.querySelector('.semi-datepicker-quick-control-header')!.textContent).toBe('快捷选择');
      expect(panel()!.querySelector('.semi-datepicker-month-grid')!.getAttribute('x-preset-position')).toBe(presetPosition);
    }
    wrapper.unmount();
  });

  it('topSlot / bottomSlot / leftSlot / rightSlot props and slots', async () => {
    const w1 = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, topSlot: 'T', bottomSlot: 'B', leftSlot: 'L', rightSlot: 'R' } });
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-topSlot')!.textContent).toBe('T');
    expect(panel()!.querySelector('.semi-datepicker-bottomSlot')!.textContent).toBe('B');
    expect(panel()!.querySelector('.semi-datepicker-leftSlot')!.textContent).toBe('L');
    expect(panel()!.querySelector('.semi-datepicker-rightSlot')!.textContent).toBe('R');
    expect(panel()!.querySelector('.semi-datepicker-topSlot')!.getAttribute('x-semi-prop')).toBe('topSlot');
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true }, slots: { topSlot: () => h('b', 'ST'), bottomSlot: () => h('i', 'SB') } });
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-topSlot b')!.textContent).toBe('ST');
    expect(panel()!.querySelector('.semi-datepicker-bottomSlot i')!.textContent).toBe('SB');
    w2.unmount();
  });

  it('density=compact adds compact class; dropdownClassName / dropdownStyle / getPopupContainer / zIndex / position', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, defaultOpen: true, density: 'compact', dropdownClassName: 'dd', dropdownStyle: { color: 'rgb(1, 2, 3)' }, getPopupContainer: () => container, zIndex: 3000, position: 'top' },
    });
    await wait();
    const p = panel()!;
    expect(p.classList.contains('semi-datepicker-compact')).toBe(true);
    expect(p.classList.contains('dd')).toBe(true);
    expect(p.style.color).toBe('rgb(1, 2, 3)');
    expect(container.contains(p)).toBe(true);
    expect((document.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('3000');
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
  });

  it('rtl default position is bottomRight', async () => {
    const w = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(DatePicker, { motion: false, defaultOpen: true }) } });
    await wait();
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('bottomRight');
    w.unmount();
  });

  it('type=month renders year/month panel (panel-yam) and selecting emits change', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'month', defaultOpen: true, defaultValue: D(2024, 0, 1), onChange } });
    await wait();
    const p = panel()!;
    expect(p.classList.contains('semi-datepicker-panel-yam')).toBe(true);
    expect(p.querySelector('.semi-datepicker-yearmonth-header')).toBeNull();
    const lists = p.querySelectorAll('.semi-scrolllist-item');
    expect(lists).toHaveLength(2);
    expect(lists[1].querySelector('.semi-scrolllist-item-sel')!.textContent).toBe('1月');
    (lists[1].querySelectorAll('li')[4] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe('2024-05');
    expect(wrapper.find('input').element.value).toBe('2024-05');
    wrapper.unmount();
  });

  it('type=monthRange renders single input and two year/month panels', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'monthRange', defaultOpen: true, defaultValue: [D(2024, 0, 1), D(2024, 2, 1)], onChange } });
    await wait();
    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(wrapper.find('input').element.value).toBe('2024-01 ~ 2024-03');
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-datepicker-monthRange-input');
    const body = panel()!.querySelector('.semi-datepicker-yearmonth-body')!;
    expect(body).toBeTruthy();
    expect(body.querySelectorAll('.semi-scrolllist')).toHaveLength(2);
    const rightMonths = body.querySelectorAll('.semi-scrolllist')[1].querySelectorAll('.semi-scrolllist-item')[1].querySelectorAll('li');
    // months before left month in the same year are disabled on the right panel
    expect(rightMonths[0].classList.contains('semi-scrolllist-item-disabled')).toBe(false);
    (rightMonths[5] as HTMLElement).click();
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toEqual(['2024-01', '2024-06']);
    wrapper.unmount();
  });

  it('triggerRender renders custom trigger and wrapper click opens panel', async () => {
    const triggerRender = vi.fn((p: any) => h('button', { class: 'ct' }, p.inputValue || p.placeholder));
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, triggerRender, defaultValue: D(2024, 0, 15) } });
    expect(wrapper.find('.ct').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(triggerRender.mock.calls[0][0].componentName).toBe('DatePicker');
    expect(triggerRender.mock.calls[0][0].value[0]).toBeInstanceOf(Date);
    expect(triggerRender.mock.calls[0][0].placeholder).toBe('请选择日期');
    await wrapper.find('[role="combobox"]').trigger('click');
    await wait();
    expect(panel()).toBeTruthy();
    expect(wrapper.emitted('openChange')![0]).toEqual([true]);
    wrapper.unmount();
  });

  it('insetInput renders inputs inside the panel, trigger is readonly, position leftTopOver', async () => {
    const onChange = vi.fn();
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, insetInput: true, defaultOpen: true, defaultValue: D(2024, 0, 15), onChange } });
    await wait();
    expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    const p = panel()!;
    const insetWrap = p.querySelector('.semi-datepicker-inset-input-wrapper')!;
    expect(insetWrap).toBeTruthy();
    expect(insetWrap.getAttribute('x-type')).toBe('date');
    const insetInput = insetWrap.querySelector('input') as HTMLInputElement;
    expect(insetInput.value).toBe('2024-01-15');
    expect(insetInput.placeholder).toBe('yyyy-MM-dd');
    expect(p.querySelector('.semi-datepicker-month-grid')!.getAttribute('x-insetinput')).toBe('true');
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('leftTopOver');
    insetInput.value = '2024-01-20';
    insetInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe('2024-01-20');
    expect(wrapper.find('input').element.value).toBe('2024-01-20');
    wrapper.unmount();
  });

  it('insetInput with placeholder object and dateTimeRange renders 4 inputs + separator; no switch bar', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, insetInput: { placeholder: { dateStart: 'DS', dateEnd: 'DE', timeStart: 'TS', timeEnd: 'TE' } }, type: 'dateTimeRange', defaultOpen: true } as any,
    });
    await wait();
    const inputs = panel()!.querySelectorAll('.semi-datepicker-inset-input-wrapper input');
    expect(inputs).toHaveLength(4);
    expect(Array.from(inputs).map((i) => (i as HTMLInputElement).placeholder)).toEqual(['DS', 'TS', 'DE', 'TE']);
    expect((inputs[1] as HTMLInputElement).disabled).toBe(true);
    expect(panel()!.querySelector('.semi-datepicker-inset-input-separator')!.textContent).toBe('-');
    expect(panel()!.querySelector('.semi-datepicker-switch')).toBeNull();
    wrapper.unmount();
  });

  it('timeZone from ConfigProvider converts display and emitted value', async () => {
    const onChange = vi.fn();
    const value = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));
    const wrapper = mount(ConfigProvider, { props: { timeZone: 'Asia/Shanghai' }, slots: { default: () => h(DatePicker, { type: 'dateTime', defaultValue: value, onChange }) } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('2024-01-15 08:00:00');
    await input.setValue('2024-01-15 09:00:00');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getUTCHours()).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe('2024-01-15 09:00:00');
  });

  it('timeZone prop change refreshes display', async () => {
    const value = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));
    const wrapper = mount(DatePicker, { props: { type: 'dateTime', value, timeZone: 8 } });
    expect(wrapper.find('input').element.value).toBe('2024-01-15 08:00:00');
    await wrapper.setProps({ timeZone: 9 });
    expect(wrapper.find('input').element.value).toBe('2024-01-15 09:00:00');
  });

  it('disabledTime disables hours in time panel', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, type: 'dateTime', defaultOpen: true, defaultValue: D(2024, 0, 15, 10), disabledTime: () => ({ disabledHours: () => [1, 2] }) },
    });
    await wait();
    (panel()!.querySelector('[aria-label="Switch to time panel"]') as HTMLElement).click();
    await wait();
    const hourItems = panel()!.querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(hourItems[1].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    expect(hourItems[3].classList.contains('semi-scrolllist-item-disabled')).toBe(false);
    wrapper.unmount();
  });

  it('exposes open/close/focus/blur', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false } });
    const vm = wrapper.vm as any;
    vm.open();
    await wait();
    expect(panel()).toBeTruthy();
    vm.close();
    await wait();
    expect(panel()).toBeNull();
    vm.focus();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    vm.blur();
    expect(document.activeElement).not.toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('range: exposed focus(rangeEnd) focuses the end input', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateRange' } });
    (wrapper.vm as any).focus('rangeEnd');
    await wait();
    expect(document.activeElement).toBe(wrapper.findAll('input')[1].element);
    wrapper.unmount();
  });

  it('autoFocus focuses trigger input', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { autoFocus: true, motion: false } });
    await nextTick();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('spacing / dropdownMargin / stopPropagation / motion props are accepted', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, defaultOpen: true, spacing: 10, dropdownMargin: 4, stopPropagation: false, autoAdjustOverflow: false } });
    await wait();
    expect(panel()).toBeTruthy();
    wrapper.unmount();
  });

  it('startYear / endYear limit the year list', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'month', defaultOpen: true, startYear: 2020, endYear: 2025 } });
    await wait();
    const years = panel()!.querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(years).toHaveLength(6);
    expect(years[0].textContent).toBe('2020');
    wrapper.unmount();
  });
  it('hideDisabledOptions=true hides disabled hours; false keeps them (aria-disabled)', async () => {
    const disabledTime = () => ({ disabledHours: () => [1, 2] });
    const w1 = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTime', defaultOpen: true, defaultValue: D(2024, 0, 15, 10), disabledTime, hideDisabledOptions: true } });
    await wait();
    (panel()!.querySelector('[aria-label="Switch to time panel"]') as HTMLElement).click();
    await wait();
    const hours1 = panel()!.querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(hours1.length).toBe(22);
    w1.unmount();
    const w2 = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTime', defaultOpen: true, defaultValue: D(2024, 0, 15, 10), disabledTime, hideDisabledOptions: false } });
    await wait();
    (panel()!.querySelector('[aria-label="Switch to time panel"]') as HTMLElement).click();
    await wait();
    const hours2 = panel()!.querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(hours2.length).toBe(24);
    w2.unmount();
  });

  it('timePickerOpts.scrollItemProps mode=wheel + cycled renders wheel scroll items', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, type: 'dateTime', defaultOpen: true, defaultValue: D(2024, 0, 15, 10), timePickerOpts: { scrollItemProps: { mode: 'wheel', cycled: true } } },
    });
    await wait();
    (panel()!.querySelector('[aria-label="Switch to time panel"]') as HTMLElement).click();
    await wait();
    expect(panel()!.querySelectorAll('.semi-scrolllist-item-wheel').length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('disabledTimePicker adds switch-time-disabled class', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTime', defaultOpen: true, disabledTimePicker: true } });
    await wait();
    expect(panel()!.querySelector('.semi-datepicker-switch-time-disabled')).toBeTruthy();
    wrapper.unmount();
  });

  it('disabledTime receives panelType for dateTimeRange (left/right)', async () => {
    const seen: string[] = [];
    const disabledTime = (_d: any, panelType?: string) => {
      panelType && seen.push(panelType);
      return panelType === 'left' ? { disabledHours: () => [17, 18] } : { disabledHours: () => [12] };
    };
    const wrapper = mount(DatePicker, {
      attachTo: document.body,
      props: { motion: false, type: 'dateTimeRange', defaultOpen: true, defaultValue: [D(2024, 0, 15, 10), D(2024, 0, 20, 10)], disabledTime, hideDisabledOptions: false },
    });
    await wait();
    const switches = panel()!.querySelectorAll('[aria-label="Switch to time panel"]');
    (switches[0] as HTMLElement).click();
    await wait();
    (switches[1] as HTMLElement).click();
    await wait();
    expect(seen).toContain('left');
    expect(seen).toContain('right');
    const lists = panel()!.querySelectorAll('.semi-datepicker-time');
    const leftHours = lists[0].querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(leftHours[17].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    expect(leftHours[12].classList.contains('semi-scrolllist-item-disabled')).toBe(false);
    const rightHours = lists[1].querySelectorAll('.semi-scrolllist-item')[0].querySelectorAll('li');
    expect(rightHours[12].classList.contains('semi-scrolllist-item-disabled')).toBe(true);
    wrapper.unmount();
  });

  it('disabledDate options: rangeStart / rangeInputFocus passed for dateRange', async () => {
    const calls: any[] = [];
    const disabledDate = (_d: Date, options?: any) => {
      calls.push(options);
      return false;
    };
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateRange', defaultOpen: true, defaultValue: [D(2024, 0, 10), D(2024, 0, 20)], disabledDate } });
    await wait();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toHaveProperty('rangeStart');
    expect(calls[0]).toHaveProperty('rangeInputFocus');
    expect(calls.some((c) => c && c.rangeStart === '2024-01-10')).toBe(true);
    const inputs = wrapper.findAll('input');
    await inputs[1].trigger('focus');
    await wait();
    expect(calls.some((c) => c && c.rangeInputFocus === 'rangeEnd')).toBe(true);
    wrapper.unmount();
  });

  it('yearAndMonthOpts are forwarded to the ScrollItem (cycled wheel mode)', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'month', defaultOpen: true, yearAndMonthOpts: { mode: 'wheel', cycled: true } } });
    await wait();
    expect(panel()!.querySelectorAll('.semi-scrolllist-item-wheel').length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('defaultPickerValue opens the panel at that month (dateTimeRange array)', async () => {
    const wrapper = mount(DatePicker, { attachTo: document.body, props: { motion: false, type: 'dateTimeRange', defaultOpen: true, defaultPickerValue: [D(2022, 7, 8, 0, 0), D(2022, 7, 9, 12, 0)] } });
    await wait();
    // both panels are driven by the array: left = Aug 8, right = Aug 9 -> both show 2022-08
    expect(document.querySelectorAll('.semi-datepicker-day[title="2022-08-15"]')).toHaveLength(2);
    expect(dayCell('2022-09-15')).toBeNull();
    wrapper.unmount();
  });

});

describe('DatePicker sub components', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('DateInput single: formats value, emits change/enterPress/clear/focus/blur', async () => {
    const wrapper = mount(DateInput, { props: { value: [D(2024, 0, 15)], type: 'date', dateFnsLocale: (en_US as any).dateFnsLocale } });
    expect(wrapper.find('input').element.value).toBe('2024-01-15');
    await wrapper.find('input').setValue('2024-01-16');
    expect(wrapper.emitted('change')![0][0]).toBe('2024-01-16');
    await wrapper.find('input').trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('enterPress')).toBeTruthy();
    await wrapper.find('input').trigger('focus');
    expect(wrapper.emitted('focus')).toBeTruthy();
    await wrapper.find('input').trigger('blur');
    expect(wrapper.emitted('blur')).toBeTruthy();
    expect(wrapper.find('.semi-input-suffix svg').exists()).toBe(true);
  });

  it('DateInput range: emits change with joined value, rangeClear, rangeEndTabPress, focus with rangeType', async () => {
    const wrapper = mount(DateInput, { props: { value: [D(2024, 0, 1), D(2024, 0, 5)], type: 'dateRange', dateFnsLocale: (en_US as any).dateFnsLocale, rangeInputFocus: 'rangeStart' } });
    const inputs = wrapper.findAll('input');
    await inputs[1].setValue('2024-01-06');
    expect(wrapper.emitted('change')![0][0]).toBe('2024-01-01 ~ 2024-01-06');
    await inputs[1].trigger('focus');
    expect(wrapper.emitted('focus')!.at(-1)![1]).toBe('rangeEnd');
    await inputs[1].trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('rangeEndTabPress')).toBeTruthy();
    await wrapper.find('.semi-datepicker-range-input-clearbtn').trigger('mousedown');
    expect(wrapper.emitted('rangeClear')).toBeTruthy();
  });

  it('Navigation emits events, density compact uses small buttons', async () => {
    const wrapper = mount(DatePickerNavigation, { props: { monthText: 'M', density: 'compact', panelType: 'left' } });
    expect(wrapper.classes()).toContain('semi-datepicker-navigation');
    expect(wrapper.find('.semi-datepicker-navigation-month').text()).toBe('M');
    expect(wrapper.find('button').classes()).toContain('semi-button-size-small');
    await wrapper.find('[aria-label="Previous year"]').trigger('click');
    await wrapper.find('[aria-label="Previous month"]').trigger('click');
    await wrapper.find('[aria-label="Next month"]').trigger('click');
    await wrapper.find('[aria-label="Next year"]').trigger('click');
    await wrapper.find('.semi-datepicker-navigation-month button').trigger('click');
    expect(wrapper.emitted('prevYear')).toBeTruthy();
    expect(wrapper.emitted('prevMonth')).toBeTruthy();
    expect(wrapper.emitted('nextMonth')).toBeTruthy();
    expect(wrapper.emitted('nextYear')).toBeTruthy();
    expect(wrapper.emitted('monthClick')).toBeTruthy();
  });

  it('Footer renders locale buttons and emits', async () => {
    const wrapper = mount(DatePickerFooter, { props: { locale: { footer: { cancel: 'C', confirm: 'OK' } }, disabledConfirm: true } });
    const btns = wrapper.findAll('button');
    expect(btns[0].text()).toBe('C');
    expect(btns[1].text()).toBe('OK');
    expect(btns[1].attributes('disabled')).toBeDefined();
    await btns[0].trigger('click');
    expect(wrapper.emitted('cancelClick')).toBeTruthy();
  });

  it('QuickControl renders nothing without presets, header for left position', () => {
    const w1 = mount(DatePickerQuickControl, { props: { presets: [] } });
    expect(w1.find('.semi-datepicker-quick-control').exists()).toBe(false);
    const w2 = mount(DatePickerQuickControl, { props: { presets: [{ text: 'A' }], presetPosition: 'left', type: 'dateRange', locale: { presets: 'Q' } } });
    expect(w2.find('.semi-datepicker-quick-control-header').text()).toBe('Q');
    expect(w2.classes()).toContain('semi-datepicker-quick-control-dateRange');
    expect(w2.find('.semi-datepicker-quick-control-left-content-item').exists()).toBe(true);
  });

  it('Month renders grid for the given month, emits dayClick/dayHover', async () => {
    const wrapper = mount(DatePickerMonth, { props: { month: D(2024, 1, 1), locale: (en_US as any).DatePicker, weekStartsOn: 0 } });
    expect(wrapper.attributes('role')).toBe('grid');
    expect(wrapper.findAll('.semi-datepicker-week')).toHaveLength(5);
    const cell = wrapper.find('[title="2024-02-10"]');
    await cell.trigger('click');
    expect(wrapper.emitted('dayClick')![0][0]).toMatchObject({ fullDate: '2024-02-10' });
    await cell.trigger('mouseenter');
    expect(wrapper.emitted('dayHover')![0][0]).toMatchObject({ fullDate: '2024-02-10' });
    await wrapper.setProps({ month: D(2024, 2, 1) });
    expect(wrapper.find('[title="2024-03-10"]').exists()).toBe(true);
  });

  it('YearAndMonth emits select with year/month pairs and backToMain', async () => {
    const wrapper = mount(DatePickerYearAndMonth, { props: { currentYear: { left: 2024, right: 0 }, currentMonth: { left: 1, right: 0 }, locale: (en_US as any).DatePicker, localeCode: 'en-US', startYear: 2020, endYear: 2030, type: 'month' } });
    expect(wrapper.find('.semi-datepicker-yearmonth-header').exists()).toBe(true);
    const lists = wrapper.findAll('.semi-scrolllist-item');
    await lists[1].findAll('li')[3].trigger('click');
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ currentYear: { left: 2024 }, currentMonth: { left: 4 } });
    await wrapper.find('.semi-datepicker-yearmonth-header button').trigger('click');
    expect(wrapper.emitted('backToMain')).toBeTruthy();
    expect(typeof (wrapper.vm as any).reselect).toBe('function');
  });

  it('MonthsGrid standalone renders one panel for date and emits change on day click', async () => {
    const wrapper = mount(DatePickerMonthsGrid, { props: { type: 'date', locale: (en_US as any).DatePicker, dateFnsLocale: (en_US as any).dateFnsLocale, defaultValue: [D(2024, 0, 15)] } });
    expect(wrapper.find('.semi-datepicker-month-grid').attributes('x-type')).toBe('date');
    await wrapper.find('[title="2024-01-20"]').trigger('click');
    expect(wrapper.emitted('change')![0][0][0].getDate()).toBe(20);
  });
});
