import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TagInput from './index';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitPopup(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const tagTexts = (w: any) => w.findAll('.semi-tagInput-wrapper-tag').map((t: any) => t.text());
const enter = async (w: any) => {
  await w.find('input').trigger('keydown', { keyCode: 13, key: 'Enter' });
  await nextTick();
};

describe('TagInput', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper, inner Input, mirror and placeholder', () => {
    const wrapper = mount(TagInput, { props: { placeholder: 'add tags' } });
    expect(wrapper.classes()).toContain('semi-tagInput');
    expect(wrapper.attributes('aria-disabled')).toBe('false');
    expect(wrapper.attributes('aria-invalid')).toBe('false');
    expect(wrapper.find('.semi-tagInput-wrapper').exists()).toBe(true);
    expect(wrapper.find('.semi-tagInput-wrapper-inputMirror').exists()).toBe(true);
    const inputWrapper = wrapper.find('.semi-tagInput-wrapper-input');
    expect(inputWrapper.classes()).toContain('semi-tagInput-wrapper-input-default');
    expect(inputWrapper.classes()).toContain('semi-input-wrapper');
    expect(wrapper.find('input').attributes('placeholder')).toBe('add tags');
    expect(wrapper.find('input').attributes('aria-label')).toBe('input value');
    expect(wrapper.find('.semi-tagInput-clearBtn').exists()).toBe(false);
  });

  it('defaultValue renders tags; placeholder hidden when there are tags', () => {
    const wrapper = mount(TagInput, { props: { defaultValue: ['a', 'b'], placeholder: 'p' } });
    expect(tagTexts(wrapper)).toEqual(['a', 'b']);
    const tag = wrapper.find('.semi-tagInput-wrapper-tag');
    expect(tag.classes()).toContain('semi-tag');
    expect(tag.classes()).toContain('semi-tag-white-light');
    expect(tag.classes()).toContain('semi-tag-large');
    expect(tag.classes()).toContain('semi-tagInput-wrapper-tag-size-default');
    expect(tag.classes()).toContain('semi-tag-closable');
    expect(tag.attributes('aria-label')).toBe('Closable Tag: a');
    expect(tag.find('.semi-tagInput-wrapper-typo').exists()).toBe(true);
    expect(wrapper.find('input').attributes('placeholder')).toBe('');
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(TagInput, { props: { size, defaultValue: ['x'] } });
    if (size !== 'default') expect(wrapper.classes()).toContain(`semi-tagInput-${size}`);
    expect(wrapper.find('.semi-tagInput-wrapper-input').classes()).toContain(`semi-tagInput-wrapper-input-${size}`);
    expect(wrapper.find('.semi-tagInput-wrapper-tag').classes()).toContain(`semi-tagInput-wrapper-tag-size-${size}`);
    expect(wrapper.find('.semi-tag').classes()).toContain(size === 'small' ? 'semi-tag-small' : 'semi-tag-large');
  });

  it('class / style / data attrs / aria-label / validateStatus', () => {
    const wrapper = mount(TagInput, { props: { validateStatus: 'error' }, attrs: { class: 'c', style: 'width: 100px', 'data-t': '1', 'aria-label': 'tags', id: 'nope' } });
    expect(wrapper.classes()).toContain('c');
    expect(wrapper.classes()).toContain('semi-tagInput-error');
    expect(wrapper.attributes('style')).toContain('width: 100px');
    expect(wrapper.attributes('data-t')).toBe('1');
    expect(wrapper.attributes('aria-label')).toBe('tags');
    expect(wrapper.attributes('aria-invalid')).toBe('true');
    expect(wrapper.attributes('id')).toBeUndefined();
    expect(mount(TagInput, { props: { validateStatus: 'warning' } }).classes()).toContain('semi-tagInput-warning');
    expect(mount(TagInput, { props: { ariaLabel: 'p-label' } }).attributes('aria-label')).toBe('p-label');
  });

  it('typing emits inputChange / update:inputValue; Enter adds tags split by separator and emits add/change', async () => {
    const wrapper = mount(TagInput);
    const input = wrapper.find('input');
    await input.setValue('a,b');
    expect(wrapper.emitted('inputChange')![0][0]).toBe('a,b');
    expect(wrapper.emitted('update:inputValue')![0][0]).toBe('a,b');
    await enter(wrapper);
    expect(wrapper.emitted('add')![0]).toEqual([['a', 'b']]);
    expect(wrapper.emitted('change')![0]).toEqual([['a', 'b']]);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['a', 'b']]);
    expect(wrapper.emitted('update:value')![0]).toEqual([['a', 'b']]);
    expect(wrapper.emitted('keydown')).toHaveLength(1);
    expect(tagTexts(wrapper)).toEqual(['a', 'b']);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    expect(wrapper.emitted('inputChange')!.slice(-1)[0][0]).toBe('');
    // empty / whitespace input does not add
    await input.setValue('  ');
    await enter(wrapper);
    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('separator (string / array) and custom split', async () => {
    const w1 = mount(TagInput, { props: { separator: ';' } });
    await w1.find('input').setValue('a;b,c');
    await enter(w1);
    expect(tagTexts(w1)).toEqual(['a', 'b,c']);
    const w2 = mount(TagInput, { props: { separator: [',', ';', ' '] } });
    await w2.find('input').setValue('a;b c,d');
    await enter(w2);
    expect(tagTexts(w2)).toEqual(['a', 'b', 'c', 'd']);
    const split = vi.fn((s: string) => s.split('|'));
    const w3 = mount(TagInput, { props: { split } });
    await w3.find('input').setValue('x|y');
    await enter(w3);
    expect(split).toHaveBeenCalled();
    expect(tagTexts(w3)).toEqual(['x', 'y']);
  });

  it('allowDuplicates=false filters duplicates', async () => {
    const wrapper = mount(TagInput, { props: { defaultValue: ['a'], allowDuplicates: false } });
    await wrapper.find('input').setValue('a,b,b');
    await enter(wrapper);
    expect(wrapper.emitted('add')![0]).toEqual([['b']]);
    expect(tagTexts(wrapper)).toEqual(['a', 'b']);
    const w2 = mount(TagInput, { props: { defaultValue: ['a'] } });
    await w2.find('input').setValue('a');
    await enter(w2);
    expect(tagTexts(w2)).toEqual(['a', 'a']);
  });

  it('max limits tags and emits exceed (prop callback + event)', async () => {
    const onExceed = vi.fn();
    const wrapper = mount(TagInput, { props: { defaultValue: ['a'], max: 2, onExceed } });
    await wrapper.find('input').setValue('b,c');
    await enter(wrapper);
    expect(onExceed).toHaveBeenCalledWith(['a', 'b', 'c']);
    expect(wrapper.emitted('exceed')![0]).toEqual([['a', 'b', 'c']]);
    expect(wrapper.emitted('add')![0]).toEqual([['b']]);
    expect(tagTexts(wrapper)).toEqual(['a', 'b']);
  });

  it('maxLength blocks over-long input and emits inputExceed', async () => {
    const onInputExceed = vi.fn();
    const wrapper = mount(TagInput, { props: { maxLength: 2, onInputExceed } });
    const input = wrapper.find('input');
    await input.setValue('ab');
    expect(wrapper.emitted('inputChange')![0][0]).toBe('ab');
    await input.setValue('abc');
    await nextTick();
    expect(onInputExceed).toHaveBeenCalledWith('abc');
    expect(wrapper.emitted('inputExceed')![0]).toEqual(['abc']);
    expect(wrapper.emitted('inputChange')).toHaveLength(1);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('ab');
  });

  it('maxLength with IME composition truncates on compositionend', async () => {
    const wrapper = mount(TagInput, { props: { maxLength: 2 } });
    const input = wrapper.find('input');
    await input.trigger('compositionstart');
    await input.setValue('abcd');
    expect(wrapper.emitted('inputChange')![0][0]).toBe('abcd');
    await input.trigger('compositionend');
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('ab');
  });

  it('Backspace on empty input removes the last tag and emits remove', async () => {
    const wrapper = mount(TagInput, { props: { defaultValue: ['a', 'b'] } });
    await wrapper.find('input').trigger('keydown', { keyCode: 8, key: 'Backspace' });
    expect(wrapper.emitted('remove')![0]).toEqual(['b', 1]);
    expect(wrapper.emitted('change')![0]).toEqual([['a']]);
    expect(tagTexts(wrapper)).toEqual(['a']);
  });

  it('closing a tag removes it (emits remove with index) and the tag does not hide itself first', async () => {
    const wrapper = mount(TagInput, { props: { defaultValue: ['a', 'b', 'c'] } });
    await wrapper.findAll('.semi-tag-close')[1].trigger('click');
    expect(wrapper.emitted('remove')![0]).toEqual(['b', 1]);
    expect(wrapper.emitted('change')![0]).toEqual([['a', 'c']]);
    expect(tagTexts(wrapper)).toEqual(['a', 'c']);
    expect(wrapper.find('.semi-tag-invisible').exists()).toBe(false);
  });

  it('controlled value: tags follow the prop; empty value clears', async () => {
    const wrapper = mount(TagInput, { props: { value: ['a'] } });
    expect(tagTexts(wrapper)).toEqual(['a']);
    await wrapper.find('input').setValue('b');
    await enter(wrapper);
    expect(wrapper.emitted('change')![0]).toEqual([['a', 'b']]);
    expect(tagTexts(wrapper)).toEqual(['a']);
    await wrapper.setProps({ value: ['x', 'y'] });
    expect(tagTexts(wrapper)).toEqual(['x', 'y']);
    await wrapper.setProps({ value: undefined });
    expect(tagTexts(wrapper)).toEqual([]);
  });

  it('controlled inputValue', async () => {
    const wrapper = mount(TagInput, { props: { inputValue: 'ctrl' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('ctrl');
    await wrapper.setProps({ inputValue: 'next' });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('next');
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref<string[]>(['a']);
        return () => h('div', [h(TagInput, { modelValue: v.value, 'onUpdate:modelValue': (val: string[]) => (v.value = val) }), h('span', { id: 'out' }, v.value.join('|'))]);
      },
    });
    const wrapper = mount(Parent);
    await wrapper.find('input').setValue('b');
    await enter(wrapper);
    expect(wrapper.find('#out').text()).toBe('a|b');
    expect(tagTexts(wrapper)).toEqual(['a', 'b']);
  });

  it('addOnBlur adds the pending input on blur; focus / blur emit and toggle focus class', async () => {
    const wrapper = mount(TagInput, { props: { addOnBlur: true } });
    const input = wrapper.find('input');
    await input.trigger('focus');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.classes()).toContain('semi-tagInput-focus');
    await input.setValue('z');
    await input.trigger('blur');
    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(tagTexts(wrapper)).toEqual(['z']);
    expect(wrapper.classes()).not.toContain('semi-tagInput-focus');
    const w2 = mount(TagInput);
    await w2.find('input').setValue('z');
    await w2.find('input').trigger('blur');
    expect(tagTexts(w2)).toEqual([]);
  });

  it('click activates (focus class) and outside click deactivates', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body });
    await wrapper.trigger('click');
    expect(wrapper.classes()).toContain('semi-tagInput-focus');
    document.body.click();
    await nextTick();
    expect(wrapper.classes()).not.toContain('semi-tagInput-focus');
    wrapper.unmount();
  });

  it('hover class and showClear button clears tags + input', async () => {
    const wrapper = mount(TagInput, { props: { showClear: true, defaultValue: ['a'] } });
    const clear = wrapper.find('.semi-tagInput-clearBtn');
    expect(clear.exists()).toBe(true);
    expect(clear.classes()).toContain('semi-tagInput-clearBtn-invisible');
    expect(clear.attributes('role')).toBe('button');
    expect(clear.find('.semi-icon-clear').exists()).toBe(true);
    await wrapper.trigger('mouseenter');
    expect(wrapper.classes()).toContain('semi-tagInput-hover');
    expect(wrapper.find('.semi-tagInput-clearBtn').classes()).not.toContain('semi-tagInput-clearBtn-invisible');
    await wrapper.find('input').setValue('typed');
    await wrapper.find('.semi-tagInput-clearBtn').trigger('click');
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual([[]]);
    expect(wrapper.emitted('inputChange')!.slice(-1)[0][0]).toBe('');
    expect(tagTexts(wrapper)).toEqual([]);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    await wrapper.trigger('mouseleave');
    expect(wrapper.classes()).not.toContain('semi-tagInput-hover');
    await wrapper.find('.semi-tagInput-clearBtn').trigger('keypress', { key: 'Enter' });
    const w2 = mount(TagInput, { props: { showClear: true, disabled: true, defaultValue: ['a'] } });
    await w2.trigger('mouseenter');
    expect(w2.find('.semi-tagInput-clearBtn').classes()).toContain('semi-tagInput-clearBtn-invisible');
  });

  it('clearIcon prop / slot', () => {
    const w1 = mount(TagInput, { props: { showClear: true, clearIcon: h('i', { class: 'ci' }) } });
    expect(w1.find('.semi-tagInput-clearBtn .ci').exists()).toBe(true);
    const w2 = mount(TagInput, { props: { showClear: true }, slots: { clearIcon: () => h('i', { class: 'ci2' }) } });
    expect(w2.find('.semi-tagInput-clearBtn .ci2').exists()).toBe(true);
  });

  it('disabled: no close icons, class, no click activation, no tag removal', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { disabled: true, defaultValue: ['a'] } });
    expect(wrapper.classes()).toContain('semi-tagInput-disabled');
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.semi-tag-close').exists()).toBe(false);
    expect(wrapper.find('.semi-tagInput-wrapper-typo').classes()).toContain('semi-tagInput-wrapper-typo-disabled');
    expect(wrapper.find('.semi-tag').attributes('aria-label')).toBe('Tag: a');
    await wrapper.trigger('click');
    expect(wrapper.classes()).not.toContain('semi-tagInput-focus');
    wrapper.unmount();
  });

  it('maxTagCount collapses tags into +N with a rest popover; expandRestTagsOnClick expands when active', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { defaultValue: ['a', 'b', 'c'], maxTagCount: 1, motion: false } as any });
    expect(tagTexts(wrapper)).toEqual(['a']);
    const n = wrapper.find('.semi-tagInput-wrapper-n');
    expect(n.text()).toBe('+2');
    expect(n.attributes('data-popupid')).toBeDefined();
    await n.trigger('mouseenter');
    await waitPopup();
    const pop = document.querySelector('.semi-popover');
    expect(pop).toBeTruthy();
    expect(pop!.querySelectorAll('.semi-tagInput-wrapper-tag')).toHaveLength(2);
    await wrapper.trigger('click');
    expect(tagTexts(wrapper)).toEqual(['a', 'b', 'c']);
    expect(wrapper.find('.semi-tagInput-wrapper-n').exists()).toBe(false);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(TagInput, { attachTo: document.body, props: { defaultValue: ['a', 'b', 'c'], maxTagCount: 2, expandRestTagsOnClick: false, showRestTagsPopover: false } });
    await w2.trigger('click');
    expect(tagTexts(w2)).toEqual(['a', 'b']);
    const n2 = w2.find('.semi-tagInput-wrapper-n');
    expect(n2.text()).toBe('+1');
    expect(n2.attributes('data-popupid')).toBeUndefined();
    w2.unmount();
    const w3 = mount(TagInput, { props: { defaultValue: ['a', 'b'], maxTagCount: 1, disabled: true } });
    expect(w3.find('.semi-tagInput-wrapper-n').classes()).toContain('semi-tagInput-wrapper-n-disabled');
  });

  it('restTagsPopoverProps are forwarded to the popover', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { defaultValue: ['a', 'b'], maxTagCount: 1, restTagsPopoverProps: { className: 'rest-pop', motion: false } } });
    await wrapper.find('.semi-tagInput-wrapper-n').trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.rest-pop')).toBeTruthy();
    wrapper.unmount();
  });

  it('renderTagItem (prop & slot) renders custom tags and can close them', async () => {
    const wrapper = mount(TagInput, {
      props: { defaultValue: ['a', 'b'], renderTagItem: (value: string, index: number, onClose: any) => h('span', { class: 'custom-tag', onClick: onClose }, `${index}:${value}`) },
    });
    const items = wrapper.findAll('.custom-tag');
    expect(items.map((i) => i.text())).toEqual(['0:a', '1:b']);
    expect(wrapper.find('.semi-tag').exists()).toBe(false);
    await items[0].trigger('click');
    expect(wrapper.emitted('remove')![0]).toEqual(['a', 0]);
    expect(wrapper.findAll('.custom-tag').map((i) => i.text())).toEqual(['0:b']);
    const w2 = mount(TagInput, { props: { defaultValue: ['x'] }, slots: { renderTagItem: ({ value }: any) => h('b', { class: 'slot-tag' }, value) } });
    expect(w2.find('.slot-tag').text()).toBe('x');
  });

  it('prefix / suffix / insetLabel (prop & slot) and clicking them focuses the input', async () => {
    const w1 = mount(TagInput, { attachTo: document.body, props: { prefix: 'P', suffix: 'S', insetLabelId: 'lid' } });
    expect(w1.classes()).toContain('semi-tagInput-with-prefix');
    expect(w1.classes()).toContain('semi-tagInput-with-suffix');
    expect(w1.find('.semi-tagInput-prefix').text()).toBe('P');
    expect(w1.find('.semi-tagInput-prefix').classes()).toContain('semi-tagInput-prefix-text');
    expect(w1.find('.semi-tagInput-suffix').text()).toBe('S');
    expect(w1.find('.semi-tagInput-suffix').classes()).toContain('semi-tagInput-suffix-text');
    const ev = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    w1.find('.semi-tagInput-prefix').element.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    await w1.find('.semi-tagInput-suffix').trigger('click');
    expect(document.activeElement).toBe(w1.find('input').element);
    w1.unmount();
    const w2 = mount(TagInput, { props: { insetLabel: 'L', insetLabelId: 'lid' } });
    expect(w2.find('.semi-tagInput-prefix').classes()).toContain('semi-tagInput-inset-label');
    expect(w2.find('.semi-tagInput-prefix').attributes('id')).toBe('lid');
    const w3 = mount(TagInput, { slots: { prefix: () => h(IconSearch), suffix: () => h(IconSearch) } });
    expect(w3.find('.semi-tagInput-prefix').classes()).toContain('semi-tagInput-prefix-icon');
    expect(w3.find('.semi-tagInput-suffix').classes()).toContain('semi-tagInput-suffix-icon');
  });

  it('autoFocus focuses the input and activates', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { autoFocus: true } });
    await nextTick();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    expect(wrapper.classes()).toContain('semi-tagInput-focus');
    wrapper.unmount();
  });

  it('draggable: active state renders a sortable list with drag handles; drop reorders and emits change', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { defaultValue: ['a', 'b', 'c'], draggable: true } });
    expect(wrapper.find('.semi-tagInput-sortable-list').exists()).toBe(false);
    await wrapper.trigger('click');
    expect(wrapper.find('.semi-tagInput-sortable-list').exists()).toBe(true);
    const items = wrapper.findAll('.semi-tagInput-sortable-item');
    expect(items).toHaveLength(3);
    expect(wrapper.findAll('.semi-tagInput-drag-handler')).toHaveLength(3);
    expect(wrapper.find('.semi-tagInput-wrapper-tag').classes()).toContain('semi-tagInput-wrapper-tag-icon');
    const tags = wrapper.findAll('.semi-tagInput-wrapper-tag');
    expect(tags[0].attributes('draggable')).toBe('true');
    await tags[0].trigger('dragstart');
    await tags[2].trigger('dragover');
    await tags[2].trigger('drop');
    expect(wrapper.emitted('change')![0]).toEqual([['b', 'c', 'a']]);
    expect(tagTexts(wrapper)).toEqual(['b', 'c', 'a']);
    wrapper.unmount();
  });

  it('draggable + renderTagItem wraps custom items with a drag handle', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body, props: { defaultValue: ['a'], draggable: true, renderTagItem: (v: string) => h('span', { class: 'ct' }, v) } });
    await wrapper.trigger('click');
    expect(wrapper.find('.semi-tagInput-drag-item .semi-tagInput-drag-handler').exists()).toBe(true);
    expect(wrapper.find('.semi-tagInput-drag-item .ct').exists()).toBe(true);
    wrapper.unmount();
  });

  it('showContentTooltip=false disables the paragraph tooltip', () => {
    const wrapper = mount(TagInput, { props: { defaultValue: ['a'], showContentTooltip: false } });
    expect(wrapper.find('.semi-tagInput-wrapper-typo').exists()).toBe(true);
  });

  it('input width follows the mirror while typing', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body });
    const mirror = wrapper.find('.semi-tagInput-wrapper-inputMirror').element as HTMLElement;
    Object.defineProperty(mirror, 'scrollWidth', { value: 40, configurable: true });
    await wrapper.find('input').setValue('hello');
    await nextTick();
    expect(mirror.textContent).toBe('hello');
    expect(wrapper.find('.semi-tagInput-wrapper-input').attributes('style')).toContain('width: 42px');
    await wrapper.find('input').setValue('');
    await nextTick();
    expect(wrapper.find('.semi-tagInput-wrapper-input').attributes('style') ?? '').not.toContain('width');
    wrapper.unmount();
  });

  it('exposes focus / blur', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body });
    const vm = wrapper.vm as any;
    vm.focus();
    await nextTick();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    expect(wrapper.classes()).toContain('semi-tagInput-focus');
    vm.blur();
    await nextTick();
    expect(document.activeElement).not.toBe(wrapper.find('input').element);
    expect(wrapper.classes()).not.toContain('semi-tagInput-focus');
    wrapper.unmount();
  });

  it('unmount removes the document click listener', async () => {
    const wrapper = mount(TagInput, { attachTo: document.body });
    await wrapper.trigger('click');
    const spy = vi.spyOn(document, 'removeEventListener');
    wrapper.unmount();
    expect(spy).toHaveBeenCalledWith('click', expect.any(Function), false);
    spy.mockRestore();
  });
});
