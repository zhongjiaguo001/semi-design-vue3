import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Select, { Option, OptionGroup } from './index';
import ConfigProvider from '../configProvider';
import en_US from '../locale/source/en_US';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitPopup(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const list = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
];
const getOptions = () => Array.from(document.querySelectorAll('.semi-select-option'));
const getOptionTexts = () => getOptions().map((o) => o.textContent);
const optionList = () => document.querySelector('.semi-select-option-list');

async function mountOpen(props: Record<string, any> = {}, slots?: Record<string, any>) {
  const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, ...props }, slots });
  await wrapper.find('.semi-select').trigger('click');
  await waitPopup();
  return wrapper;
}

describe('Select', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders combobox trigger with defaults', () => {
    const wrapper = mount(Select, { props: { optionList: list, placeholder: 'pick one' } });
    const trigger = wrapper.find('.semi-select');
    expect(trigger.exists()).toBe(true);
    expect(trigger.classes()).toContain('semi-select-single');
    expect(trigger.attributes('role')).toBe('combobox');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    // the Popover (role=dialog) overrides aria-haspopup / aria-controls with the popup id, like React
    expect(trigger.attributes('aria-haspopup')).toBe('dialog');
    expect(trigger.attributes('tabindex')).toBe('0');
    expect(trigger.attributes('aria-controls')).toBe(trigger.attributes('data-popupid'));
    expect(wrapper.find('.semi-select-selection-placeholder').text()).toBe('pick one');
    expect(wrapper.find('.semi-select-arrow .semi-icon-chevron_down').exists()).toBe(true);
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
  });

  it('placeholder as slot', () => {
    const wrapper = mount(Select, { props: { optionList: list }, slots: { placeholder: () => h('i', { class: 'ph' }, 'p') } });
    expect(wrapper.find('.semi-select-selection-placeholder .ph').exists()).toBe(true);
  });

  it.each(['small', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(Select, { props: { size } });
    expect(wrapper.find('.semi-select').classes()).toContain(`semi-select-${size}`);
  });

  it('class / style / data attrs / id / aria attrs', () => {
    const wrapper = mount(Select, {
      props: { id: 'sel', validateStatus: 'error', borderless: true, showArrow: false },
      attrs: { class: 'c', style: 'width: 200px', 'data-x': '1', 'aria-invalid': true, 'aria-labelledby': 'lb', 'aria-required': true, 'aria-describedby': 'db', 'aria-errormessage': 'em' },
    });
    const trigger = wrapper.find('.semi-select');
    expect(trigger.classes()).toContain('c');
    expect(trigger.classes()).toContain('semi-select-error');
    expect(trigger.classes()).toContain('semi-select-borderless');
    expect(trigger.classes()).toContain('semi-select-no-arrow');
    expect(trigger.find('.semi-select-arrow-empty').exists()).toBe(true);
    expect(trigger.attributes('style')).toContain('width: 200px');
    expect(trigger.attributes('data-x')).toBe('1');
    expect(trigger.attributes('id')).toBe('sel');
    expect(trigger.attributes('aria-invalid')).toBe('true');
    expect(trigger.attributes('aria-labelledby')).toBe('lb');
    expect(trigger.attributes('aria-required')).toBe('true');
    expect(trigger.attributes('aria-describedby')).toBe('db');
    expect(trigger.attributes('aria-errormessage')).toBe('em');
    expect(mount(Select, { props: { validateStatus: 'warning' } }).find('.semi-select').classes()).toContain('semi-select-warning');
  });

  it('defaultValue shows the matched label; unknown value shows the value itself', () => {
    const w1 = mount(Select, { props: { optionList: list, defaultValue: 'banana' } });
    expect(w1.find('.semi-select-selection-text').text()).toBe('Banana');
    expect(w1.find('.semi-select').attributes('aria-label')).toBe('selected');
    const w2 = mount(Select, { props: { optionList: list, defaultValue: 'zzz' } });
    expect(w2.find('.semi-select-selection-text').text()).toBe('zzz');
  });

  it('opens on click, renders options with tick / selected / focused, closes on outside mousedown', async () => {
    const wrapper = await mountOpen({ defaultValue: 'banana' });
    const trigger = wrapper.find('.semi-select');
    expect(trigger.classes()).toContain('semi-select-open');
    expect(trigger.classes()).toContain('semi-select-focus');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.emitted('dropdownVisibleChange')![0]).toEqual([true]);
    expect(wrapper.emitted('focus')).toHaveLength(1);
    const wrapperEl = document.querySelector('.semi-select-option-list-wrapper')!;
    expect(wrapperEl).toBeTruthy();
    expect(wrapperEl.id).toMatch(/^semi-select-/);
    expect(optionList()!.getAttribute('role')).toBe('listbox');
    expect(optionList()!.classList.contains('semi-select-option-list-chosen')).toBe(true);
    expect((optionList() as HTMLElement).style.maxHeight).toBe('270px');
    const options = getOptions();
    expect(options).toHaveLength(4);
    expect(getOptionTexts()).toEqual(['Apple', 'Banana', 'Cherry', 'Date']);
    expect(options[1].classList.contains('semi-select-option-selected')).toBe(true);
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[0].classList.contains('semi-select-option-focused')).toBe(true);
    expect(options[2].classList.contains('semi-select-option-disabled')).toBe(true);
    expect(options[2].getAttribute('aria-disabled')).toBe('true');
    expect(options[0].querySelector('.semi-select-option-icon .semi-icon-tick')).toBeTruthy();
    expect(options[0].id).toBe(trigger.attributes('aria-activedescendant'));
    // click outside
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    expect(wrapper.emitted('dropdownVisibleChange')![1]).toEqual([false]);
    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(wrapper.find('.semi-select').classes()).not.toContain('semi-select-focus');
    wrapper.unmount();
  });

  it('single select: click option emits select + change + update:modelValue and closes', async () => {
    const wrapper = await mountOpen();
    (getOptions()[3] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')![0][0]).toBe('date');
    expect(wrapper.emitted('select')![0][1]).toMatchObject({ value: 'date', label: 'Date' });
    expect(wrapper.emitted('change')![0]).toEqual(['date']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['date']);
    expect(wrapper.emitted('update:value')![0]).toEqual(['date']);
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Date');
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    // disabled option is not selectable
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    (getOptions()[2] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')).toHaveLength(1);
    wrapper.unmount();
  });

  it('selecting the same option again does not emit change', async () => {
    const wrapper = await mountOpen({ defaultValue: 'apple' });
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('controlled value: selection does not change until parent updates', async () => {
    const wrapper = await mountOpen({ value: 'apple' });
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual(['banana']);
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Apple');
    await wrapper.setProps({ value: 'banana' });
    await nextTick();
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Banana');
    await wrapper.setProps({ value: undefined });
    await nextTick();
    expect(wrapper.find('.semi-select-selection-placeholder').exists()).toBe(true);
    wrapper.unmount();
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref('apple');
        return () => h('div', [h(Select, { optionList: list, motion: false, modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, String(v.value))]);
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Apple');
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    (getOptions()[3] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.find('#out').text()).toBe('date');
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Date');
    wrapper.unmount();
  });

  it('children Select.Option / Select.OptGroup render groups and options', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { motion: false, defaultValue: 2 },
      slots: {
        default: () => [
          h(OptionGroup, { label: 'Fruit' }, () => [h(Option, { value: 1 }, () => 'One'), h(Option, { value: 2, label: 'Two' })]),
          h(OptionGroup, { label: 'Veg' }, () => [h(Option, { value: 3, disabled: true }, () => 'Three')]),
        ],
      },
    });
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Two');
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    const groups = document.querySelectorAll('.semi-select-group');
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toBe('Fruit');
    expect(getOptionTexts()).toEqual(['One', 'Two', 'Three']);
    expect(getOptions()[2].classList.contains('semi-select-option-disabled')).toBe(true);
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('One');
    wrapper.unmount();
  });

  it('Option with vnode children / OptionGroup without label', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { motion: false },
      slots: { default: () => [h(Option, { value: 'x' }, () => h('b', { class: 'bold' }, 'X')), h(OptionGroup, {}, () => [h(Option, { value: 'y', label: 'Y' })])] },
    });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-select-option .bold')).toBeTruthy();
    expect(document.querySelectorAll('.semi-select-group')).toHaveLength(0);
    expect(getOptions()).toHaveLength(2);
    wrapper.unmount();
  });

  it('multiple: tags, deselect, backspace, max/onExceed, aria-multiselectable', async () => {
    const wrapper = await mountOpen({ multiple: true, defaultValue: ['apple'], max: 2, placeholder: 'choose' });
    expect(wrapper.find('.semi-select').classes()).toContain('semi-select-multiple');
    expect(optionList()!.getAttribute('aria-multiselectable')).toBe('true');
    expect(wrapper.findAll('.semi-tag')).toHaveLength(1);
    expect(wrapper.find('.semi-tag').text()).toBe('Apple');
    expect(wrapper.find('.semi-tag').classes()).toContain('semi-tag-white-light');
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')![0][0]).toBe('banana');
    expect(wrapper.emitted('change')![0]).toEqual([['apple', 'banana']]);
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    expect(wrapper.findAll('.semi-tag')).toHaveLength(2);
    // max reached
    (getOptions()[3] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('exceed')![0][0]).toMatchObject({ value: 'date' });
    expect(wrapper.emitted('change')).toHaveLength(1);
    // deselect via option click
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('deselect')![0][0]).toBe('apple');
    expect(wrapper.emitted('change')![1]).toEqual([['banana']]);
    // remove via tag close
    await wrapper.find('.semi-tag .semi-tag-close').trigger('click');
    await waitPopup();
    expect(wrapper.emitted('deselect')![1][0]).toBe('banana');
    expect(wrapper.emitted('change')![2]).toEqual([[]]);
    expect(wrapper.find('.semi-select-selection-placeholder').exists()).toBe(true);
    // backspace removes the last tag
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    await wrapper.find('.semi-select').trigger('keydown', { keyCode: 8, key: 'Backspace' });
    await waitPopup();
    expect(wrapper.emitted('change')![4]).toEqual([[]]);
    wrapper.unmount();
  });

  it('multiple controlled value', async () => {
    const wrapper = await mountOpen({ multiple: true, value: ['apple'] });
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual([['apple', 'banana']]);
    expect(wrapper.findAll('.semi-tag')).toHaveLength(1);
    await wrapper.setProps({ value: ['apple', 'banana', 'unknown'] });
    await nextTick();
    expect(wrapper.findAll('.semi-tag').map((t) => t.text())).toEqual(['Apple', 'Banana', 'unknown']);
    wrapper.unmount();
  });

  it('maxTagCount renders +N, showRestTagsPopover shows rest tags in a popover, expandRestTagsOnClick', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, multiple: true, defaultValue: ['apple', 'banana', 'date'], maxTagCount: 1, motion: false } });
    expect(wrapper.find('.semi-select-content-wrapper').classes()).toContain('semi-select-content-wrapper-one-line');
    expect(wrapper.find('.semi-tag-group').exists()).toBe(true);
    const tags = wrapper.findAll('.semi-tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].text()).toBe('Apple');
    expect(tags[1].text()).toBe('+2');
    const w2 = mount(Select, { attachTo: document.body, props: { optionList: list, multiple: true, defaultValue: ['apple', 'banana', 'date'], maxTagCount: 1, showRestTagsPopover: true, motion: false } });
    const plusTag = w2.findAll('.semi-tag')[1];
    expect(plusTag.text()).toBe('+2');
    await plusTag.trigger('mouseenter');
    await waitPopup();
    const pop = document.querySelector('.semi-tag-rest-group-popover');
    expect(pop).toBeTruthy();
    expect(pop!.querySelectorAll('.semi-tag')).toHaveLength(2);
    const w3 = mount(Select, { attachTo: document.body, props: { optionList: list, multiple: true, defaultValue: ['apple', 'banana', 'date'], maxTagCount: 1, expandRestTagsOnClick: true, motion: false } });
    await w3.find('.semi-select').trigger('click');
    await waitPopup();
    expect(w3.findAll('.semi-tag')).toHaveLength(3);
    wrapper.unmount();
    w2.unmount();
    w3.unmount();
  });

  it('ellipsisTrigger renders collapsed tags with a +N tag', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, multiple: true, defaultValue: ['apple', 'banana', 'date'], maxTagCount: 2, ellipsisTrigger: true, motion: false } });
    await nextTick();
    expect(wrapper.find('.semi-select-content-wrapper-collapse').exists()).toBe(true);
    const tags = wrapper.findAll('.semi-tag');
    expect(tags).toHaveLength(3);
    expect(tags[2].classes()).toContain('semi-select-content-wrapper-collapse-tag');
    expect(tags[2].text()).toBe('+1');
    wrapper.unmount();
  });

  it('renderSelectedItem (single & multiple, prop & slot)', async () => {
    const w1 = mount(Select, { props: { optionList: list, defaultValue: 'apple', renderSelectedItem: (o: any) => h('em', { class: 'rs' }, `*${o.label}`) } });
    expect(w1.find('.semi-select-selection-text .rs').text()).toBe('*Apple');
    const w2 = mount(Select, {
      props: {
        optionList: list,
        multiple: true,
        defaultValue: ['apple', 'banana'],
        renderSelectedItem: (o: any, { index, onClose }: any) => ({ isRenderInTag: index === 0, content: h('span', { class: 'custom', onClick: (e: Event) => onClose(null, e) }, o.label) }),
      },
    });
    expect(w2.findAll('.semi-tag')).toHaveLength(1);
    expect(w2.findAll('.custom')).toHaveLength(2);
    await w2.findAll('.custom')[1].trigger('click');
    expect(w2.emitted('change')![0]).toEqual([['apple']]);
    const w3 = mount(Select, { props: { optionList: list, defaultValue: 'apple' }, slots: { renderSelectedItem: ({ optionNode }: any) => h('u', { class: 'slot' }, optionNode.label) } });
    expect(w3.find('.semi-select-selection-text .slot').text()).toBe('Apple');
  });

  it('onChangeWithObject emits option objects and accepts object values', async () => {
    const wrapper = await mountOpen({ onChangeWithObject: true, defaultValue: { value: 'apple', label: 'Apple' } });
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Apple');
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0][0]).toMatchObject({ value: 'banana', label: 'Banana' });
    expect((wrapper.emitted('change')![0][0] as any)._show).toBeUndefined();
    wrapper.unmount();
    const w2 = await mountOpen({ onChangeWithObject: true, multiple: true, defaultValue: [{ value: 'apple', label: 'Apple' }] });
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(w2.emitted('change')![0][0]).toEqual([expect.objectContaining({ value: 'apple' }), expect.objectContaining({ value: 'banana' })]);
    w2.unmount();
  });

  it('filter=true: shows input, filters options case-insensitively, highlights keywords, emits search', async () => {
    const wrapper = await mountOpen({ filter: true });
    expect(wrapper.find('.semi-select').classes()).toContain('semi-select-filterable');
    const inputWrapper = wrapper.find('.semi-select-input');
    expect(inputWrapper.exists()).toBe(true);
    expect(inputWrapper.classes()).toContain('semi-select-input-single');
    expect(inputWrapper.classes()).toContain('semi-input-wrapper');
    const input = wrapper.find('input');
    expect(wrapper.find('.semi-select').attributes('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(input.element);
    await input.setValue('AN');
    await waitPopup();
    expect(wrapper.emitted('search')![0][0]).toBe('AN');
    expect(getOptionTexts()).toEqual(['Banana']);
    // adjacent matches are merged into one highlight chunk (same as React Highlight)
    expect(document.querySelector('.semi-select-option-keyword')!.textContent).toBe('anan');
    expect(document.querySelector('.semi-highlight-tag')).toBeTruthy();
    await input.setValue('zzz');
    await waitPopup();
    expect(document.querySelectorAll('.semi-select-option:not(.semi-select-option-empty)')).toHaveLength(0);
    expect(document.querySelector('.semi-select-option-empty')!.textContent).toBe('暂无数据');
    await input.setValue('');
    await waitPopup();
    expect(getOptions()).toHaveLength(4);
    wrapper.unmount();
  });

  it('filter function is used as a custom predicate', async () => {
    const filter = vi.fn((input: string, option: any) => String(option.value).startsWith(input));
    const wrapper = await mountOpen({ filter });
    await wrapper.find('input').setValue('d');
    await waitPopup();
    expect(filter).toHaveBeenCalled();
    expect(getOptionTexts()).toEqual(['Date']);
    wrapper.unmount();
  });

  it('filter + select clears the input (autoClearSearchValue) and keeps it when false', async () => {
    const wrapper = await mountOpen({ filter: true, multiple: true });
    const input = wrapper.find('input');
    await input.setValue('ap');
    await waitPopup();
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    expect(wrapper.emitted('search')!.slice(-1)[0][0]).toBe('');
    expect(getOptions()).toHaveLength(4);
    wrapper.unmount();
    const w2 = await mountOpen({ filter: true, multiple: true, autoClearSearchValue: false });
    await w2.find('input').setValue('ap');
    await waitPopup();
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect((w2.find('input').element as HTMLInputElement).value).toBe('ap');
    w2.unmount();
  });

  it('remote: options are not filtered locally', async () => {
    const wrapper = await mountOpen({ filter: true, remote: true });
    await wrapper.find('input').setValue('zzz');
    await waitPopup();
    expect(getOptions()).toHaveLength(4);
    expect(wrapper.emitted('search')![0][0]).toBe('zzz');
    await wrapper.setProps({ optionList: [{ value: 'z', label: 'Zed' }] });
    await waitPopup();
    expect(getOptionTexts()).toEqual(['Zed']);
    wrapper.unmount();
  });

  it('allowCreate creates an option from the input and emits create', async () => {
    const wrapper = await mountOpen({ filter: true, allowCreate: true, multiple: true });
    await wrapper.find('input').setValue('kiwi');
    await waitPopup();
    const created = getOptions()[0];
    expect(created.querySelector('.semi-select-create-tips')!.textContent).toBe('创建');
    expect(created.textContent).toContain('kiwi');
    (created as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('create')![0][0]).toMatchObject({ value: 'kiwi', label: 'kiwi' });
    expect(wrapper.emitted('change')![0]).toEqual([['kiwi']]);
    expect(wrapper.find('.semi-tag').text()).toBe('kiwi');
    wrapper.unmount();
  });

  it('renderCreateItem customizes the create option (prop & slot)', async () => {
    const wrapper = await mountOpen({ filter: true, allowCreate: true, renderCreateItem: (v: any, focused: boolean) => h('div', { class: 'my-create' }, `new: ${v} ${focused}`) });
    await wrapper.find('input').setValue('kiwi');
    await waitPopup();
    const node = document.querySelector('.my-create')!;
    expect(node.textContent).toBe('new: kiwi true');
    expect(node.parentElement!.getAttribute('role')).toBe('button');
    (node as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual(['kiwi']);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({ filter: true, allowCreate: true }, { renderCreateItem: ({ inputValue }: any) => h('div', { class: 'slot-create' }, inputValue) });
    await w2.find('input').setValue('q');
    await waitPopup();
    expect(document.querySelector('.slot-create')!.textContent).toBe('q');
    w2.unmount();
  });

  it('searchPosition=dropdown renders the search input inside the dropdown', async () => {
    const wrapper = await mountOpen({ filter: true, searchPosition: 'dropdown', searchPlaceholder: 'search…' });
    expect(wrapper.find('.semi-select-input').exists()).toBe(false);
    const dropdownInput = document.querySelector('.semi-select-dropdown-search-wrapper input') as HTMLInputElement;
    expect(dropdownInput).toBeTruthy();
    expect(document.querySelector('.semi-select-dropdown-input')!.classList.contains('semi-select-dropdown-input-single')).toBe(true);
    expect(dropdownInput.placeholder).toBe('search…');
    expect(document.querySelector('.semi-select-dropdown-search-wrapper .semi-icon-search')).toBeTruthy();
    dropdownInput.value = 'ban';
    dropdownInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitPopup();
    expect(getOptionTexts()).toEqual(['Banana']);
    dropdownInput.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13, key: 'Enter', bubbles: true }));
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual(['banana']);
    wrapper.unmount();
  });

  it('keyboard: ArrowDown / ArrowUp move focus (skipping disabled), Enter selects, Escape closes', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false } });
    const trigger = wrapper.find('.semi-select');
    await trigger.trigger('focus');
    await trigger.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    expect(getOptions()[0].classList.contains('semi-select-option-focused')).toBe(true);
    await trigger.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await nextTick();
    expect(getOptions()[1].classList.contains('semi-select-option-focused')).toBe(true);
    await trigger.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await nextTick();
    // cherry is disabled -> skip to date
    expect(getOptions()[3].classList.contains('semi-select-option-focused')).toBe(true);
    await trigger.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await nextTick();
    expect(getOptions()[0].classList.contains('semi-select-option-focused')).toBe(true);
    await trigger.trigger('keydown', { keyCode: 38, key: 'ArrowUp' });
    await nextTick();
    expect(getOptions()[3].classList.contains('semi-select-option-focused')).toBe(true);
    await trigger.trigger('keydown', { keyCode: 13, key: 'Enter' });
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual(['date']);
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    // Enter on closed select opens it; Escape closes it
    await trigger.trigger('keydown', { keyCode: 13, key: 'Enter' });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    await trigger.trigger('keydown', { keyCode: 27, key: 'Escape' });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    wrapper.unmount();
  });

  it('keypress Enter on trigger opens; Tab closes and emits blur', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false } });
    const trigger = wrapper.find('.semi-select');
    await trigger.trigger('keypress', { key: 'Enter' });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    await trigger.trigger('keydown', { keyCode: 9, key: 'Tab' });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    expect(wrapper.emitted('blur')).toHaveLength(1);
    wrapper.unmount();
  });

  it('option hover updates the focused option', async () => {
    const wrapper = await mountOpen();
    (getOptions()[3] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();
    expect(getOptions()[3].classList.contains('semi-select-option-focused')).toBe(true);
    wrapper.unmount();
  });

  it('defaultActiveFirstOption=false starts without a focused option', async () => {
    const wrapper = await mountOpen({ defaultActiveFirstOption: false });
    expect(document.querySelector('.semi-select-option-focused')).toBeNull();
    expect(wrapper.find('.semi-select').attributes('aria-activedescendant')).toBe('');
    wrapper.unmount();
  });

  it('showClear: clear button appears on hover and clears value, emits clear', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, defaultValue: 'apple', showClear: true, motion: false } });
    expect(wrapper.find('.semi-select-clear').exists()).toBe(false);
    await wrapper.find('.semi-select').trigger('mouseenter');
    expect(wrapper.emitted('mouseEnter')).toHaveLength(1);
    const clear = wrapper.find('.semi-select-clear');
    expect(clear.exists()).toBe(true);
    expect(clear.find('.semi-icon-clear').exists()).toBe(true);
    await clear.trigger('click');
    await waitPopup();
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')![0]).toEqual([undefined]);
    expect(wrapper.find('.semi-select-selection-placeholder').exists()).toBe(true);
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    await wrapper.find('.semi-select').trigger('mouseleave');
    expect(wrapper.emitted('mouseLeave')).toHaveLength(1);
    wrapper.unmount();
  });

  it('clearIcon / arrowIcon customization (prop & slot)', async () => {
    const w1 = mount(Select, { props: { optionList: list, defaultValue: 'apple', showClear: true, clearIcon: h('i', { class: 'ci' }), arrowIcon: h('i', { class: 'ai' }) } });
    expect(w1.find('.semi-select-arrow .ai').exists()).toBe(true);
    await w1.find('.semi-select').trigger('mouseenter');
    expect(w1.find('.semi-select-clear .ci').exists()).toBe(true);
    const w2 = mount(Select, { props: { optionList: list }, slots: { arrowIcon: () => h('i', { class: 'ai2' }) } });
    expect(w2.find('.semi-select-arrow .ai2').exists()).toBe(true);
  });

  it('prefix / suffix / insetLabel (prop & slot) add wrapper classes', () => {
    const w1 = mount(Select, { props: { prefix: 'P', suffix: 'S', insetLabelId: 'lbl' } });
    expect(w1.find('.semi-select').classes()).toContain('semi-select-with-prefix');
    expect(w1.find('.semi-select').classes()).toContain('semi-select-with-suffix');
    expect(w1.find('.semi-select-prefix').text()).toBe('P');
    expect(w1.find('.semi-select-prefix').classes()).toContain('semi-select-prefix-text');
    expect(w1.find('.semi-select-suffix').text()).toBe('S');
    expect(w1.find('.semi-select-suffix').classes()).toContain('semi-select-suffix-text');
    const w2 = mount(Select, { props: { insetLabel: 'Label', insetLabelId: 'lbl' } });
    expect(w2.find('.semi-select-prefix').classes()).toContain('semi-select-inset-label');
    expect(w2.find('.semi-select-prefix').attributes('id')).toBe('lbl');
    const w3 = mount(Select, { slots: { prefix: () => h(IconSearch), suffix: () => h(IconSearch) } });
    expect(w3.find('.semi-select-prefix').classes()).toContain('semi-select-prefix-icon');
    expect(w3.find('.semi-select-suffix').classes()).toContain('semi-select-suffix-icon');
  });

  it('disabled: class, aria, no open', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, disabled: true } });
    const trigger = wrapper.find('.semi-select');
    expect(trigger.classes()).toContain('semi-select-disabled');
    expect(trigger.attributes('aria-disabled')).toBe('true');
    expect(trigger.attributes('tabindex')).toBe('-1');
    await trigger.trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    wrapper.unmount();
  });

  it('emptyContent (prop, slot, null) and loading', async () => {
    const w1 = await mountOpen({ optionList: [], emptyContent: 'Nothing' });
    expect(document.querySelector('.semi-select-option-empty')!.textContent).toBe('Nothing');
    expect(document.querySelector('.semi-select-option-list-wrapper')).toBeTruthy();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({ optionList: [] }, { emptyContent: () => h('i', { class: 'ec' }, 'x') });
    expect(document.querySelector('.semi-select-option-empty .ec')).toBeTruthy();
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = await mountOpen({ optionList: [], emptyContent: null });
    expect(document.querySelector('.semi-select-option-empty')).toBeNull();
    expect(document.querySelector('.semi-select-option-list-wrapper')).toBeNull();
    w3.unmount();
    document.body.innerHTML = '';
    const w4 = await mountOpen({ loading: true });
    expect(document.querySelector('.semi-select-loading-wrapper .semi-spin')).toBeTruthy();
    expect(getOptions()).toHaveLength(0);
    w4.unmount();
  });

  it('locale from ConfigProvider (en_US emptyText / createText)', async () => {
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      props: { locale: en_US as any },
      slots: { default: () => h(Select, { optionList: [], motion: false, filter: true, allowCreate: true }) },
    });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-select-option-empty')!.textContent).toBe('No Result');
    await wrapper.find('input').setValue('n');
    await waitPopup();
    expect(document.querySelector('.semi-select-create-tips')!.textContent).toBe('Create');
    wrapper.unmount();
  });

  it('outerTopSlot / innerTopSlot / innerBottomSlot / outerBottomSlot (prop & slot); hover slot resets focus', async () => {
    const wrapper = await mountOpen({ outerTopSlot: 'OT', innerTopSlot: h('i', 'IT') }, { innerBottomSlot: () => 'IB', outerBottomSlot: () => h('b', { class: 'ob' }, 'OB') });
    const wrap = document.querySelector('.semi-select-option-list-wrapper')!;
    expect(wrap.querySelector('.semi-select-option-list-outer-top-slot')!.textContent).toBe('OT');
    expect(wrap.querySelector('.semi-select-option-list .semi-select-option-list-inner-top-slot')!.textContent).toBe('IT');
    expect(wrap.querySelector('.semi-select-option-list .semi-select-option-list-inner-bottom-slot')!.textContent).toBe('IB');
    expect(wrap.querySelector('.semi-select-option-list-outer-bottom-slot .ob')).toBeTruthy();
    expect(getOptions()[0].classList.contains('semi-select-option-focused')).toBe(true);
    wrap.querySelector('.semi-select-option-list-outer-top-slot')!.dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();
    expect(document.querySelector('.semi-select-option-focused')).toBeNull();
    wrapper.unmount();
  });

  it('dropdownClassName / dropdownStyle / dropdownMatchSelectWidth / maxHeight / zIndex / getPopupContainer / position', async () => {
    const container = document.createElement('div');
    container.id = 'pc';
    document.body.appendChild(container);
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { optionList: list, motion: false, dropdownClassName: 'dd', dropdownStyle: { color: 'red' }, maxHeight: 100, zIndex: 2000, getPopupContainer: () => container, position: 'top', dropdownMatchSelectWidth: false },
    });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    const wrap = container.querySelector('.semi-select-option-list-wrapper') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(wrap.classList.contains('dd')).toBe(true);
    expect(wrap.style.color).toBe('red');
    expect(wrap.style.minWidth).toBe('');
    expect((wrap.querySelector('.semi-select-option-list') as HTMLElement).style.maxHeight).toBe('100px');
    expect((container.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    expect(container.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false }, attrs: { style: 'width: 240px' } });
    await w2.find('.semi-select').trigger('click');
    await waitPopup();
    expect((document.querySelector('.semi-select-option-list-wrapper') as HTMLElement).style.minWidth).toBe('240px');
    w2.unmount();
  });

  it('rtl default position is bottomRight', async () => {
    const wrapper = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(Select, { optionList: list, motion: false }) } });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('bottomRight');
    wrapper.unmount();
  });

  it('defaultOpen / open (controlled) / clickToHide', async () => {
    const w1 = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, defaultOpen: true } });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, open: true } });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    await w2.setProps({ open: false });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    await w2.setProps({ open: true });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = await mountOpen({ clickToHide: true });
    await w3.find('.semi-select').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    w3.unmount();
    document.body.innerHTML = '';
    const w4 = await mountOpen();
    await w4.find('.semi-select').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    w4.unmount();
  });

  it('autoFocus focuses the trigger / opens filterable select', async () => {
    const w1 = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, autoFocus: true } });
    await nextTick();
    expect(document.activeElement).toBe(w1.find('.semi-select').element);
    expect(w1.find('.semi-select').classes()).toContain('semi-select-focus');
    w1.unmount();
    const w2 = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, autoFocus: true, filter: true } });
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    expect(document.activeElement).toBe(w2.find('input').element);
    w2.unmount();
  });

  it('renderOptionItem (prop & slot) renders custom options', async () => {
    const wrapper = await mountOpen({ defaultValue: 'apple', renderOptionItem: ({ label, selected, focused, className, onClick, onMouseEnter }: any) => h('div', { class: ['custom-opt', className], 'data-selected': String(selected), 'data-focused': String(focused), onClick, onMouseenter: onMouseEnter }, label) });
    const items = Array.from(document.querySelectorAll('.custom-opt'));
    expect(items).toHaveLength(4);
    expect(items[0].classList.contains('semi-select-option-custom')).toBe(true);
    expect(items[0].classList.contains('semi-select-option-custom-selected')).toBe(true);
    expect(items[0].getAttribute('data-focused')).toBe('true');
    (items[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual(['banana']);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({}, { renderOptionItem: ({ label, onClick }: any) => h('div', { class: 'slot-opt', onClick }, label) });
    expect(document.querySelectorAll('.slot-opt')).toHaveLength(4);
    w2.unmount();
  });

  it('virtualize renders a virtual list with absolutely positioned rows', async () => {
    const big = Array.from({ length: 100 }, (_, i) => ({ value: i, label: `Item ${i}` }));
    const wrapper = await mountOpen({ optionList: big, virtualize: { itemSize: 30, height: 150 }, defaultValue: 50 });
    const vl = document.querySelector('.semi-select-virtual-list') as HTMLElement;
    expect(vl).toBeTruthy();
    expect(vl.style.height).toBe('150px');
    const rows = getOptions();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(100);
    expect((rows[0] as HTMLElement).style.position).toBe('absolute');
    // opening scrolls to the selected item (center)
    expect(vl.scrollTop).toBeGreaterThan(0);
    vl.scrollTop = 0;
    vl.dispatchEvent(new Event('scroll'));
    await nextTick();
    expect(getOptions()[0].textContent).toBe('Item 0');
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    wrapper.unmount();
  });

  it('onListScroll emits on option list scroll', async () => {
    const wrapper = await mountOpen();
    optionList()!.dispatchEvent(new Event('scroll'));
    expect(wrapper.emitted('listScroll')).toHaveLength(1);
    wrapper.unmount();
  });

  it('inputProps are passed to the filter input', async () => {
    const wrapper = await mountOpen({ filter: true, inputProps: { className: 'my-input', placeholder: 'type' } });
    expect(wrapper.find('.semi-select-input').classes()).toContain('my-input');
    expect(wrapper.find('input').attributes('placeholder')).toBe('type');
    wrapper.unmount();
  });

  it('triggerRender (prop & slot) replaces the trigger content', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { optionList: list, motion: false, defaultValue: 'apple', triggerRender: ({ value, placeholder, onClear }: any) => h('div', { class: 'my-trigger' }, [value.map((v: any) => v.label).join(','), h('button', { class: 'cl', onClick: onClear }, 'x')]) },
      attrs: { class: 'root' },
    });
    expect(wrapper.find('.semi-select').exists()).toBe(false);
    expect(wrapper.find('.my-trigger').text()).toContain('Apple');
    expect(wrapper.find('.root').attributes('role')).toBe('combobox');
    await wrapper.find('.cl').trigger('click');
    await waitPopup();
    expect(wrapper.emitted('clear')).toHaveLength(1);
    wrapper.unmount();
    const w2 = mount(Select, { props: { optionList: list }, slots: { triggerRender: ({ inputValue }: any) => h('div', { class: 'slot-trigger' }, `v:${inputValue}`) } });
    expect(w2.find('.slot-trigger').text()).toBe('v:');
  });

  it('optionList change updates options and the selected label', async () => {
    const wrapper = await mountOpen({ defaultValue: 'apple' });
    await wrapper.setProps({ optionList: [{ value: 'apple', label: 'Green Apple' }, { value: 'pear', label: 'Pear' }] });
    await waitPopup();
    expect(getOptionTexts()).toEqual(['Green Apple', 'Pear']);
    expect(wrapper.find('.semi-select-selection-text').text()).toBe('Green Apple');
    wrapper.unmount();
  });

  it('exposed methods: open / close / clearInput / selectAll / deselectAll / focus / rePosition / search', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, motion: false, multiple: true, filter: true } });
    const vm = wrapper.vm as any;
    vm.open();
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    vm.search('ban');
    await waitPopup();
    expect(getOptionTexts()).toEqual(['Banana']);
    vm.clearInput();
    await waitPopup();
    expect(getOptions()).toHaveLength(4);
    vm.selectAll();
    await waitPopup();
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual([['apple', 'banana', 'cherry', 'date']]);
    expect(wrapper.findAll('.semi-tag')).toHaveLength(4);
    vm.deselectAll();
    await waitPopup();
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual([[]]);
    expect(wrapper.emitted('clear')).toHaveLength(1);
    vm.close();
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeNull();
    vm.rePosition();
    vm.focus();
    await waitPopup();
    expect(document.querySelector('.semi-select-option-list')).toBeTruthy();
    wrapper.unmount();
  });

  it('Option component standalone: empty / click / data attrs', async () => {
    const onSelect = vi.fn();
    const w = mount(Option, { props: { value: 1, label: 'L', onSelect, showTick: true }, attrs: { 'data-a': 'b' } });
    expect(w.classes()).toContain('semi-select-option');
    expect(w.attributes('data-a')).toBe('b');
    expect(w.find('.semi-select-option-text').text()).toBe('L');
    await w.trigger('click');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 1, label: 'L' }), expect.anything());
    const d = mount(Option, { props: { value: 1, label: 'L', onSelect, disabled: true } });
    await d.trigger('click');
    expect(onSelect).toHaveBeenCalledTimes(1);
    const e = mount(Option, { props: { empty: true } });
    expect(e.classes()).toContain('semi-select-option-empty');
    expect(e.text()).toBe('暂无数据');
    const g = mount(OptionGroup, { props: { label: 'G' }, attrs: { 'data-g': '1' } });
    expect(g.classes()).toContain('semi-select-group');
    expect(g.attributes('data-g')).toBe('1');
    expect(mount(OptionGroup, {}).find('.semi-select-group').exists()).toBe(false);
  });

  it('unmount removes document listeners', async () => {
    const wrapper = await mountOpen();
    wrapper.unmount();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flushPromises();
    expect(wrapper.emitted('blur')).toBeUndefined();
  });
});

describe('Select · disabled option declared as a bare template attribute (regression)', () => {
  // `<Option value="c" disabled>` compiles to { disabled: '' } in vnode.props for a
  // Boolean prop (React always passes a real boolean), so the option collector must
  // normalise it the way Vue's prop resolution would.
  it('marks the option disabled and refuses to select it', async () => {
    const onChange = vi.fn();
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { onChange, motion: false },
      slots: {
        default: () => [h(Option, { value: 'a' }, () => 'Alpha'), h(Option, { value: 'c', disabled: '' as any }, () => 'Gamma')],
      },
    });
    await wrapper.find('.semi-select').trigger('click');
    await flushPromises();
    const options = Array.from(document.querySelectorAll('.semi-select-option')) as HTMLElement[];
    expect(options).toHaveLength(2);
    expect(options[1].classList.contains('semi-select-option-disabled')).toBe(true);
    expect(options[1].getAttribute('aria-disabled')).toBe('true');

    options[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(onChange).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('Gamma');

    // keyboard navigation skips it as well: only 'Alpha' is enabled, so ArrowDown stays on it
    const list = document.querySelector('.semi-select-option-list');
    list?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await flushPromises();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await flushPromises();
    const focused = document.querySelector('.semi-select-option-focused');
    expect(focused?.textContent ?? '').not.toContain('Gamma');

    wrapper.unmount();
  });
});

describe('Select · pass-through props parity (official API table)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('restTagsPopoverProps are forwarded to the +N popover (className)', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: {
        optionList: list,
        multiple: true,
        defaultValue: ['apple', 'banana', 'date'],
        maxTagCount: 1,
        showRestTagsPopover: true,
        restTagsPopoverProps: { position: 'top', className: 'my-rest-pop' },
        motion: false,
      },
    });
    const plusTag = wrapper.findAll('.semi-tag')[1];
    expect(plusTag.text()).toBe('+2');
    await plusTag.trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.my-rest-pop')).toBeTruthy();
    wrapper.unmount();
  });

  it('spacing / dropdownMargin / rePosKey / mouseEnterDelay / mouseLeaveDelay are forwarded to the Popover', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { optionList: list, motion: false, spacing: 12, dropdownMargin: 20, rePosKey: 'k1', mouseEnterDelay: 0, mouseLeaveDelay: 0 },
    });
    const popover = wrapper.findComponent({ name: 'Popover' });
    expect(popover.exists()).toBe(true);
    expect(popover.props('spacing')).toBe(12);
    expect(popover.props('margin')).toBe(20);
    expect(String(popover.props('rePosKey'))).toContain('k1');
    expect(popover.props('mouseEnterDelay')).toBe(0);
    expect(popover.props('mouseLeaveDelay')).toBe(0);
    // rePosition() bumps the popover rePosKey so it re-computes its placement
    const before = Number(String(popover.props('rePosKey')).split('-')[0]);
    (wrapper.vm as any).rePosition();
    await nextTick();
    expect(String(popover.props('rePosKey'))).toBe(`${before + 1}-k1`);
    wrapper.unmount();
  });

  it('preventScroll is passed to focus() calls of the filter input', async () => {
    const wrapper = mount(Select, { attachTo: document.body, props: { optionList: list, filter: true, motion: false, preventScroll: true } });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    const input = wrapper.find('input').element as HTMLInputElement;
    const spy = vi.spyOn(input, 'focus');
    (wrapper.vm as any).focus();
    await waitPopup();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.some((c) => c[0] && (c[0] as any).preventScroll === true)).toBe(true);
    wrapper.unmount();
  });

  it('Option showTick=false hides the tick icon; className / style are applied', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { motion: false, defaultValue: 'a' },
      slots: {
        default: () => [h(Option, { value: 'a', className: 'opt-a', style: { color: 'red' } }, () => 'Alpha'), h(Option, { value: 'b' }, () => 'Beta')],
      },
    });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    const optA = document.querySelector('.semi-select-option.opt-a') as HTMLElement;
    expect(optA).toBeTruthy();
    expect(optA.style.color).toBe('red');
    expect(optA.classList.contains('semi-select-option-selected')).toBe(true);
    // Select renders its options with showTick (tick shown for selected)
    expect(optA.querySelector('.semi-select-option-icon')).toBeTruthy();
    const standalone = mount(Option, { props: { value: 'x', label: 'X', selected: true, showTick: false } });
    expect(standalone.find('.semi-select-option-icon').exists()).toBe(false);
    wrapper.unmount();
  });

  it('OptGroup className / style are applied to the group label', async () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { motion: false },
      slots: {
        default: () => [h(OptionGroup, { label: 'G', className: 'grp', style: { color: 'blue' } }, () => [h(Option, { value: 'a' }, () => 'Alpha')])],
      },
    });
    await wrapper.find('.semi-select').trigger('click');
    await waitPopup();
    const group = document.querySelector('.semi-select-group.grp') as HTMLElement;
    expect(group).toBeTruthy();
    expect(group.style.color).toBe('blue');
    expect(group.textContent).toBe('G');
    wrapper.unmount();
  });

  it('mouseLeave is emitted from the trigger', async () => {
    const wrapper = mount(Select, { props: { optionList: list, motion: false } });
    await wrapper.find('.semi-select').trigger('mouseenter');
    await wrapper.find('.semi-select').trigger('mouseleave');
    expect(wrapper.emitted('mouseEnter')).toHaveLength(1);
    expect(wrapper.emitted('mouseLeave')).toHaveLength(1);
  });
});

describe('Select · static sub-components and remaining popover pass-through props', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes Select.Option / Select.OptGroup statics and elementType markers', () => {
    expect((Select as any).Option).toBe(Option);
    expect((Select as any).OptGroup).toBe(OptionGroup);
    expect((Select as any).elementType).toBe('Select');
    expect((Option as any).isSelectOption).toBe(true);
    expect((OptionGroup as any).isSelectOptionGroup).toBe(true);
  });

  it('stopPropagation / autoAdjustOverflow / motion / zIndex are forwarded to the Popover', () => {
    const wrapper = mount(Select, {
      attachTo: document.body,
      props: { optionList: list, motion: false, stopPropagation: false, autoAdjustOverflow: false, zIndex: 2000 },
    });
    const popover = wrapper.findComponent({ name: 'Popover' });
    expect(popover.props('stopPropagation')).toBe(false);
    expect(popover.props('autoAdjustOverflow')).toBe(false);
    expect(popover.props('motion')).toBe(false);
    expect(popover.props('zIndex')).toBe(2000);
    expect(popover.props('trigger')).toBe('custom');
    wrapper.unmount();
  });

  it('searchPlaceholder is used by the dropdown search input and dropdownVisibleChange fires on open/close', async () => {
    const wrapper = await mountOpen({ filter: true, searchPosition: 'dropdown', searchPlaceholder: 'type here' });
    const input = document.querySelector('.semi-select-dropdown-input input, input.semi-select-dropdown-input, .semi-select-dropdown-search-wrapper input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute('placeholder')).toBe('type here');
    expect(wrapper.emitted('dropdownVisibleChange')?.[0]).toEqual([true]);
    (wrapper.vm as any).close();
    await waitPopup();
    expect(wrapper.emitted('dropdownVisibleChange')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });
});
