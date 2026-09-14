import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AutoComplete, { AutoCompleteOption } from './index';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitPopup(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const data = ['apple', 'banana', 'cherry'];
const getOptions = () => Array.from(document.querySelectorAll('.semi-autocomplete-option'));
const getTexts = () => getOptions().map((o) => o.textContent);

async function mountOpen(props: Record<string, any> = {}, slots?: Record<string, any>) {
  const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, motion: false, ...props }, slots });
  await wrapper.find('.semi-autocomplete').trigger('click');
  await waitPopup();
  return wrapper;
}

describe('AutoComplete', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an input wrapped in the autocomplete trigger', () => {
    const wrapper = mount(AutoComplete, { props: { data, placeholder: 'type here' } });
    const root = wrapper.find('.semi-autocomplete');
    expect(root.exists()).toBe(true);
    expect(root.attributes('tabindex')).toBe('-1');
    expect(root.find('.semi-input-wrapper').exists()).toBe(true);
    expect(root.find('input').attributes('placeholder')).toBe('type here');
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
  });

  it('class / style / id / data attrs / aria attrs', () => {
    const wrapper = mount(AutoComplete, { props: { id: 'ac' }, attrs: { class: 'c', style: 'width: 300px', 'data-x': 'y', 'aria-label': 'search', 'aria-invalid': true, 'aria-required': true, 'aria-labelledby': 'l', 'aria-describedby': 'd', 'aria-errormessage': 'e' } });
    const root = wrapper.find('.semi-autocomplete');
    expect(root.classes()).toContain('c');
    expect(root.attributes('style')).toContain('width: 300px');
    expect(root.attributes('id')).toBe('ac');
    expect(root.attributes('data-x')).toBe('y');
    const input = wrapper.find('input');
    expect(input.attributes('aria-label')).toBe('search');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-required')).toBe('true');
    expect(input.attributes('aria-labelledby')).toBe('l');
    expect(input.attributes('aria-describedby')).toBe('d');
    expect(input.attributes('aria-errormessage')).toBe('e');
  });

  it.each(['small', 'large', 'default'] as const)('size=%s passes to Input', (size) => {
    const wrapper = mount(AutoComplete, { props: { size } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain(`semi-input-wrapper-${size}`);
  });

  it('validateStatus / disabled / prefix / suffix / insetLabel / showClear pass to Input', async () => {
    const wrapper = mount(AutoComplete, { props: { validateStatus: 'error', prefix: 'P', suffix: 'S', showClear: true, defaultValue: 'x' } });
    expect(wrapper.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-error');
    expect(wrapper.find('.semi-input-prefix').text()).toBe('P');
    expect(wrapper.find('.semi-input-suffix').text()).toBe('S');
    await wrapper.find('input').trigger('focus');
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    expect(wrapper.find('.semi-input-clearbtn').exists()).toBe(true);
    const w2 = mount(AutoComplete, { props: { disabled: true, insetLabel: 'L', insetLabelId: 'lid' } });
    expect(w2.find('.semi-autocomplete').classes()).toContain('semi-autocomplete-disabled');
    expect(w2.find('input').attributes('disabled')).toBeDefined();
    expect(w2.find('.semi-input-prefix').text()).toBe('L');
    expect(w2.find('.semi-input-prefix').attributes('id')).toBe('lid');
    const w3 = mount(AutoComplete, { slots: { prefix: () => h(IconSearch), suffix: () => h('b', { class: 'sf' }) } });
    expect(w3.find('.semi-input-prefix .semi-icon').exists()).toBe(true);
    expect(w3.find('.semi-input-suffix .sf').exists()).toBe(true);
  });

  it('click opens the dropdown with all data items; click again closes; emits dropdownVisibleChange', async () => {
    const wrapper = await mountOpen();
    expect(wrapper.emitted('dropdownVisibleChange')![0]).toEqual([true]);
    const list = document.querySelector('.semi-autocomplete-option-list') as HTMLElement;
    expect(list).toBeTruthy();
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.id).toMatch(/^semi-autocomplete-/);
    expect(list.style.maxHeight).toBe('300px');
    expect(getTexts()).toEqual(['apple', 'banana', 'cherry']);
    expect(getOptions()[0].getAttribute('role')).toBe('option');
    expect(document.querySelector('.semi-autocomplete-option-icon')).toBeNull();
    expect(document.querySelector('.semi-autocomplete-option-focused')).toBeNull();
    await wrapper.find('.semi-autocomplete').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    expect(wrapper.emitted('dropdownVisibleChange')![1]).toEqual([false]);
    wrapper.unmount();
  });

  it('disabled does not open', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, motion: false, disabled: true } });
    await wrapper.find('.semi-autocomplete').trigger('click');
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    wrapper.unmount();
  });

  it('typing emits search + change + update:modelValue, opens dropdown and highlights keyword', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, motion: false } });
    await wrapper.find('input').setValue('an');
    await waitPopup();
    expect(wrapper.emitted('search')![0]).toEqual(['an']);
    expect(wrapper.emitted('change')![0]).toEqual(['an']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['an']);
    expect(wrapper.emitted('update:value')![0]).toEqual(['an']);
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    // the list is not filtered locally (parent is expected to update `data`)
    expect(getOptions()).toHaveLength(3);
    expect(document.querySelector('.semi-autocomplete-option-keyword')!.textContent).toBe('anan');
    await wrapper.setProps({ data: ['banana'] });
    await waitPopup();
    expect(getTexts()).toEqual(['banana']);
    wrapper.unmount();
  });

  it('selecting an option fills the input, emits select (value) + change, closes', async () => {
    const wrapper = await mountOpen();
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')![0]).toEqual(['banana']);
    expect(wrapper.emitted('change')![0]).toEqual(['banana']);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('banana');
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    wrapper.unmount();
  });

  it('onSelectWithObject emits the option object', async () => {
    const wrapper = await mountOpen({ data: [{ value: 'a', label: 'Alpha', extra: 1 }], onSelectWithObject: true });
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ value: 'a', label: 'Alpha', extra: 1 });
    wrapper.unmount();
  });

  it('object data items render label and use value for the input; disabled items are not selectable', async () => {
    const wrapper = await mountOpen({ data: [{ value: 'v1', label: 'Label 1' }, { value: 'v2', label: 'Label 2', disabled: true }] });
    expect(getTexts()).toEqual(['Label 1', 'Label 2']);
    expect(getOptions()[1].classList.contains('semi-autocomplete-option-disabled')).toBe(true);
    (getOptions()[1] as HTMLElement).click();
    await waitPopup();
    expect(wrapper.emitted('select')).toBeUndefined();
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('v1');
    wrapper.unmount();
  });

  it('renderItem (prop & slot) customizes option content', async () => {
    const wrapper = await mountOpen({ renderItem: (item: any) => h('b', { class: 'ri' }, `#${item}`) });
    expect(document.querySelectorAll('.semi-autocomplete-option .ri')).toHaveLength(3);
    expect(document.querySelector('.ri')!.textContent).toBe('#apple');
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({}, { renderItem: ({ item }: any) => h('i', { class: 'rs' }, item) });
    expect(document.querySelectorAll('.semi-autocomplete-option .rs')).toHaveLength(3);
    w2.unmount();
  });

  it('renderSelectedItem controls the input text after select and on value match', async () => {
    const items = [{ value: 'a', label: 'Alpha' }];
    const wrapper = await mountOpen({ data: items, renderSelectedItem: (o: any) => `${o.label}!` });
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Alpha!');
    expect(wrapper.emitted('change')![0]).toEqual(['Alpha!']);
    wrapper.unmount();
  });

  it('defaultValue / controlled value / v-model', async () => {
    const w1 = mount(AutoComplete, { props: { data, defaultValue: 'apple' } });
    expect((w1.find('input').element as HTMLInputElement).value).toBe('apple');
    const w2 = mount(AutoComplete, { attachTo: document.body, props: { data, value: 'banana', motion: false } });
    expect((w2.find('input').element as HTMLInputElement).value).toBe('banana');
    await w2.find('input').setValue('ban');
    await waitPopup();
    expect(w2.emitted('change')![0]).toEqual(['ban']);
    await nextTick();
    expect((w2.find('input').element as HTMLInputElement).value).toBe('banana');
    await w2.setProps({ value: 'cherry' });
    expect((w2.find('input').element as HTMLInputElement).value).toBe('cherry');
    // controlled select only notifies
    (getOptions()[0] as HTMLElement).click();
    await waitPopup();
    expect(w2.emitted('select')![0]).toEqual(['apple']);
    expect((w2.find('input').element as HTMLInputElement).value).toBe('cherry');
    w2.unmount();
    const Parent = defineComponent({
      setup() {
        const v = ref('');
        return () => h('div', [h(AutoComplete, { data, motion: false, modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, v.value)]);
      },
    });
    const w3 = mount(Parent, { attachTo: document.body });
    await w3.find('input').setValue('ch');
    expect(w3.find('#out').text()).toBe('ch');
    w3.unmount();
  });

  it('defaultActiveFirstOption focuses the first option on open; hover moves focus', async () => {
    const wrapper = await mountOpen({ defaultActiveFirstOption: true });
    expect(getOptions()[0].classList.contains('semi-autocomplete-option-focused')).toBe(true);
    (getOptions()[2] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();
    expect(getOptions()[2].classList.contains('semi-autocomplete-option-focused')).toBe(true);
    wrapper.unmount();
  });

  it('keyboard: focus then ArrowDown opens, arrows move (skipping disabled), Enter selects, Escape / Tab close, emits keydown', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data: ['a', { value: 'b', disabled: true }, 'c'], motion: false, defaultActiveFirstOption: true } });
    const input = wrapper.find('input');
    await input.trigger('focus');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    const root = wrapper.find('.semi-autocomplete');
    await root.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    expect(getOptions()[0].classList.contains('semi-autocomplete-option-focused')).toBe(true);
    await root.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await nextTick();
    expect(getOptions()[2].classList.contains('semi-autocomplete-option-focused')).toBe(true);
    await root.trigger('keydown', { keyCode: 38, key: 'ArrowUp' });
    await nextTick();
    expect(getOptions()[0].classList.contains('semi-autocomplete-option-focused')).toBe(true);
    await root.trigger('keydown', { keyCode: 13, key: 'Enter' });
    await waitPopup();
    expect(wrapper.emitted('select')![0]).toEqual(['a']);
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    await root.trigger('keydown', { keyCode: 13, key: 'Enter' });
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    await root.trigger('keydown', { keyCode: 27, key: 'Escape' });
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    await root.trigger('keydown', { keyCode: 40, key: 'ArrowDown' });
    await waitPopup();
    await root.trigger('keydown', { keyCode: 9, key: 'Tab' });
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    expect(wrapper.emitted('keydown')!.length).toBeGreaterThanOrEqual(8);
    await input.trigger('blur');
    expect(wrapper.emitted('blur')).toHaveLength(1);
    wrapper.unmount();
  });

  it('clear button emits clear', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, showClear: true, defaultValue: 'apple' } });
    await wrapper.find('input').trigger('focus');
    await wrapper.find('.semi-input-wrapper').trigger('mouseenter');
    await wrapper.find('.semi-input-clearbtn').trigger('mousedown');
    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual(['']);
    wrapper.unmount();
  });

  it('emptyContent (prop / slot / default null) and loading', async () => {
    const w1 = await mountOpen({ data: [], emptyContent: 'nothing' });
    expect(document.querySelector('.semi-autocomplete-option-list')!.textContent).toBe('nothing');
    w1.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({ data: [] }, { emptyContent: () => h('i', { class: 'ec' }) });
    expect(document.querySelector('.semi-autocomplete-option-list .ec')).toBeTruthy();
    w2.unmount();
    document.body.innerHTML = '';
    const w3 = await mountOpen({ data: [] });
    expect(document.querySelector('.semi-autocomplete-option-list')!.textContent).toBe('');
    w3.unmount();
    document.body.innerHTML = '';
    const w4 = await mountOpen({ loading: true });
    expect(document.querySelector('.semi-autocomplete-loading-wrapper .semi-spin')).toBeTruthy();
    expect(getOptions()).toHaveLength(0);
    w4.unmount();
  });

  it('dropdownClassName / dropdownStyle / maxHeight / dropdownMatchSelectWidth / zIndex / position / getPopupContainer', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mount(AutoComplete, {
      attachTo: document.body,
      props: { data, motion: false, dropdownClassName: 'dd', dropdownStyle: { color: 'red' }, maxHeight: 120, zIndex: 3000, position: 'top', getPopupContainer: () => container },
      attrs: { style: 'width: 180px' },
    });
    await wrapper.find('.semi-autocomplete').trigger('click');
    await waitPopup();
    const list = container.querySelector('.semi-autocomplete-option-list') as HTMLElement;
    expect(list).toBeTruthy();
    expect(list.classList.contains('dd')).toBe(true);
    expect(list.style.color).toBe('red');
    expect(list.style.maxHeight).toBe('120px');
    expect(list.style.minWidth).toBe('180px');
    expect((container.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('3000');
    expect(container.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = await mountOpen({ dropdownMatchSelectWidth: false });
    expect((document.querySelector('.semi-autocomplete-option-list') as HTMLElement).style.minWidth).toBe('');
    w2.unmount();
  });

  it('defaultOpen opens on mount; click outside closes', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, motion: false, defaultOpen: true } });
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await waitPopup();
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeNull();
    wrapper.unmount();
  });

  it('autoFocus focuses the input', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, autoFocus: true } });
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('triggerRender (prop & slot) replaces the input', async () => {
    const wrapper = mount(AutoComplete, {
      attachTo: document.body,
      props: { data, motion: false, defaultValue: 'apple', triggerRender: ({ inputValue, onChange }: any) => h('input', { class: 'custom-input', value: inputValue, onInput: (e: any) => onChange(e.target.value) }) },
      attrs: { class: 'root' },
    });
    expect(wrapper.find('.semi-autocomplete').exists()).toBe(false);
    expect(wrapper.find('.root').exists()).toBe(true);
    const input = wrapper.find('.custom-input');
    expect((input.element as HTMLInputElement).value).toBe('apple');
    await input.setValue('ban');
    await waitPopup();
    expect(wrapper.emitted('search')![0]).toEqual(['ban']);
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    wrapper.unmount();
    const w2 = mount(AutoComplete, { props: { data }, slots: { triggerRender: ({ componentName }: any) => h('span', { class: 'slot-trigger' }, componentName) } });
    expect(w2.find('.slot-trigger').text()).toBe('AutoComplete');
  });

  it('Option standalone: click / disabled / empty', async () => {
    const onSelect = vi.fn();
    const w = mount(AutoCompleteOption, { props: { value: 1, label: 'L', onSelect, showTick: true } });
    expect(w.classes()).toContain('semi-autocomplete-option');
    expect(w.find('.semi-autocomplete-option-icon').exists()).toBe(true);
    await w.trigger('click');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 1, label: 'L' }), expect.anything());
    const e = mount(AutoCompleteOption, { props: { empty: true, emptyContent: 'E' } });
    expect(e.classes()).toContain('semi-autocomplete-option-empty');
    expect(e.text()).toBe('E');
  });

  it('validateStatus=success / warning and clearIcon prop', async () => {
    const w = mount(AutoComplete, { props: { validateStatus: 'success' } });
    expect(w.find('.semi-input-wrapper').exists()).toBe(true);
    const w1 = mount(AutoComplete, { props: { validateStatus: 'warning' } });
    expect(w1.find('.semi-input-wrapper').classes()).toContain('semi-input-wrapper-warning');
    const w2 = mount(AutoComplete, { props: { data, showClear: true, defaultValue: 'apple', clearIcon: () => h('i', { class: 'my-clear' }) } });
    await w2.find('input').trigger('focus');
    await w2.find('.semi-input-wrapper').trigger('mouseenter');
    expect(w2.find('.semi-input-clearbtn .my-clear').exists()).toBe(true);
  });

  it('motion accepts an object (treated as enabled)', async () => {
    const wrapper = mount(AutoComplete, { attachTo: document.body, props: { data, motion: { duration: 10 } as any } });
    await wrapper.find('.semi-autocomplete').trigger('click');
    await waitPopup(300);
    expect(document.querySelector('.semi-autocomplete-option-list')).toBeTruthy();
    wrapper.unmount();
  });

  it('unmount removes document listeners', async () => {
    const wrapper = await mountOpen();
    const onVisible = vi.fn();
    (wrapper.vm as any).foundation._adapter.notifyDropdownVisibleChange = onVisible;
    wrapper.unmount();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flushPromises();
    expect(onVisible).not.toHaveBeenCalled();
  });
});
