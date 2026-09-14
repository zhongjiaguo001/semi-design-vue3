import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ScrollList, { ScrollItem } from './index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const list = [
  { value: 0, text: '00' },
  { value: 1, text: '01' },
  { value: 2, text: '02', disabled: true },
  { value: 3, text: '03' },
];

describe('ScrollList', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper, body and children', () => {
    const wrapper = mount(ScrollList, { slots: { default: () => h('span', { class: 'child' }, 'c') } });
    expect(wrapper.classes()).toContain('semi-scrolllist');
    const body = wrapper.find('.semi-scrolllist-body');
    expect(body.exists()).toBe(true);
    expect(body.attributes('x-semi-prop')).toBe('children');
    expect(body.find('.child').exists()).toBe(true);
    expect(wrapper.find('.semi-scrolllist-header').exists()).toBe(false);
    expect(wrapper.find('.semi-scrolllist-footer').exists()).toBe(false);
  });

  it('header / footer as props', () => {
    const wrapper = mount(ScrollList, { props: { header: 'Head', footer: 'Foot' } });
    const header = wrapper.find('.semi-scrolllist-header');
    expect(header.exists()).toBe(true);
    expect(header.find('.semi-scrolllist-header-title').text()).toBe('Head');
    expect(header.find('.semi-scrolllist-header-title').attributes('x-semi-prop')).toBe('header');
    expect(header.find('.semi-scrolllist-line').exists()).toBe(true);
    const footer = wrapper.find('.semi-scrolllist-footer');
    expect(footer.text()).toBe('Foot');
    expect(footer.attributes('x-semi-prop')).toBe('footer');
  });

  it('header / footer as slots win over props', () => {
    const wrapper = mount(ScrollList, {
      props: { header: 'propHead', footer: 'propFoot' },
      slots: { header: () => h('b', 'slotHead'), footer: () => h('i', 'slotFoot') },
    });
    expect(wrapper.find('.semi-scrolllist-header-title b').text()).toBe('slotHead');
    expect(wrapper.find('.semi-scrolllist-footer i').text()).toBe('slotFoot');
  });

  it('x-semi-header-alias / x-semi-footer-alias', () => {
    const wrapper = mount(ScrollList, { props: { header: 'h', footer: 'f', 'x-semi-header-alias': 'panelHeader', 'x-semi-footer-alias': 'panelFooter' } });
    expect(wrapper.find('.semi-scrolllist-header-title').attributes('x-semi-prop')).toBe('panelHeader');
    expect(wrapper.find('.semi-scrolllist-footer').attributes('x-semi-prop')).toBe('panelFooter');
  });

  it('bodyHeight number and string', () => {
    const w1 = mount(ScrollList, { props: { bodyHeight: 200 } });
    expect((w1.find('.semi-scrolllist-body').element as HTMLElement).style.height).toBe('200px');
    const w2 = mount(ScrollList, { props: { bodyHeight: '10rem' } });
    expect((w2.find('.semi-scrolllist-body').element as HTMLElement).style.height).toBe('10rem');
  });

  it('prefixCls, className, class attr, style and data attrs', () => {
    const wrapper = mount(ScrollList, {
      props: { prefixCls: 'my-list', className: 'custom', style: { width: '10px' }, header: 'x' },
      attrs: { class: 'extra', 'data-foo': 'bar', id: 'ignored' },
    });
    expect(wrapper.classes()).toContain('my-list');
    expect(wrapper.classes()).toContain('custom');
    expect(wrapper.classes()).toContain('extra');
    expect((wrapper.element as HTMLElement).style.width).toBe('10px');
    expect(wrapper.attributes('data-foo')).toBe('bar');
    expect(wrapper.attributes('id')).toBeUndefined();
    expect(wrapper.find('.my-list-header').exists()).toBe(true);
    expect(wrapper.find('.my-list-body').exists()).toBe(true);
  });

  it('exposes Item as static member', () => {
    expect((ScrollList as any).Item).toBe(ScrollItem);
  });
});

describe('ScrollItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('normal mode renders items with selected / disabled classes', () => {
    const wrapper = mount(ScrollItem, { props: { mode: 'normal', list, selectedIndex: 1 } });
    expect(wrapper.classes()).toContain('semi-scrolllist-item');
    const ul = wrapper.find('ul');
    expect(ul.attributes('role')).toBe('listbox');
    expect(ul.attributes('aria-multiselectable')).toBe('false');
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(4);
    expect(items[0].attributes('role')).toBe('option');
    expect(items.map((i) => i.text())).toEqual(['00', '01', '02', '03']);
    expect(items[1].classes()).toContain('semi-scrolllist-item-sel');
    expect(items[0].classes()).not.toContain('semi-scrolllist-item-sel');
    expect(items[2].classes()).toContain('semi-scrolllist-item-disabled');
    expect(items[2].attributes('aria-disabled')).toBe('true');
  });

  it('normal mode: click emits select with item data, type and index; disabled item ignored', async () => {
    const onSelect = vi.fn();
    const wrapper = mount(ScrollItem, { props: { mode: 'normal', list, selectedIndex: 0, type: 'hour', onSelect } });
    const items = wrapper.findAll('li');
    await items[3].trigger('click');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual({ value: 3, text: '03', type: 'hour', index: 3 });
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ value: 3, index: 3 });
    await items[2].trigger('click');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('transform applies only to the selected item; item transform wins', () => {
    const transform = (value: any, text: string) => `${text}!`;
    const data = [
      { value: 0, text: 'a' },
      { value: 1, text: 'b', transform: (v: any) => `item-${v}` },
    ];
    const w1 = mount(ScrollItem, { props: { mode: 'normal', list: data, selectedIndex: 0, transform } });
    expect(w1.findAll('li').map((i) => i.text())).toEqual(['a!', 'b']);
    const w2 = mount(ScrollItem, { props: { mode: 'normal', list: data, selectedIndex: 1, transform } });
    expect(w2.findAll('li').map((i) => i.text())).toEqual(['a', 'item-1']);
  });

  it('falls back to value when text is missing', () => {
    const wrapper = mount(ScrollItem, { props: { mode: 'normal', list: [{ value: 7 }, { value: 8 }] } });
    expect(wrapper.findAll('li').map((i) => i.text())).toEqual(['7', '8']);
  });

  it('wheel mode (default) renders shades, selector and list-outer', () => {
    const wrapper = mount(ScrollItem, { props: { list, selectedIndex: 0 } });
    expect(wrapper.classes()).toContain('semi-scrolllist-item-wheel');
    expect(wrapper.find('.semi-scrolllist-shade-pre').exists()).toBe(true);
    expect(wrapper.find('.semi-scrolllist-shade-post').exists()).toBe(true);
    expect(wrapper.find('.semi-scrolllist-selector').exists()).toBe(true);
    const outer = wrapper.find('.semi-scrolllist-list-outer');
    expect(outer.exists()).toBe(true);
    expect(outer.classes()).toContain('semi-scrolllist-list-outer-nocycle');
    expect(wrapper.findAll('li')).toHaveLength(4);
    // wheel mode does not use item-sel class
    expect(wrapper.find('.semi-scrolllist-item-sel').exists()).toBe(false);
  });

  it('cycled=true removes nocycle class', () => {
    const wrapper = mount(ScrollItem, { attachTo: document.body, props: { list, cycled: true } });
    expect(wrapper.find('.semi-scrolllist-list-outer').classes()).not.toContain('semi-scrolllist-list-outer-nocycle');
    wrapper.unmount();
  });

  it('wheel mode: clicking an item emits select (debounced)', async () => {
    const onSelect = vi.fn();
    const wrapper = mount(ScrollItem, { attachTo: document.body, props: { list, selectedIndex: 0, type: 'minute', onSelect, motion: false } });
    const items = wrapper.findAll('li');
    await items[3].trigger('click');
    await sleep(60);
    await flushPromises();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual({ value: 3, text: '03', type: 'minute', index: 3 });
    // disabled item is ignored
    await items[2].trigger('click');
    await sleep(60);
    expect(onSelect).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('wheel mode: scrolling selects nearest enabled item (debounced)', async () => {
    const onSelect = vi.fn();
    const wrapper = mount(ScrollItem, { attachTo: document.body, props: { list, selectedIndex: 0, onSelect, motion: false } });
    const outer = wrapper.find('.semi-scrolllist-list-outer');
    await outer.trigger('scroll');
    await sleep(60);
    await flushPromises();
    // jsdom has no layout: nearest node is the first non-disabled (index 0)
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ value: 0, index: 0 });
    wrapper.unmount();
  });

  it('selectedIndex change scrolls without emitting', async () => {
    const onSelect = vi.fn();
    const wrapper = mount(ScrollItem, { attachTo: document.body, props: { mode: 'normal', list, selectedIndex: 0, onSelect, motion: false } });
    const vm = wrapper.vm as any;
    const spy = vi.spyOn(vm, 'scrollToIndex');
    await wrapper.setProps({ selectedIndex: 3 });
    await nextTick();
    expect(wrapper.findAll('li')[3].classes()).toContain('semi-scrolllist-item-sel');
    expect(onSelect).not.toHaveBeenCalled();
    spy.mockRestore();
    wrapper.unmount();
  });

  it('motion=false sets scrollTop directly; motion=true uses animation', async () => {
    const w1 = mount(ScrollItem, { attachTo: document.body, props: { mode: 'normal', list, motion: false } });
    (w1.vm as any).scrollToPos(50, 100);
    expect(w1.find('.semi-scrolllist-item').element.scrollTop).toBe(50);
    w1.unmount();
    const w2 = mount(ScrollItem, { attachTo: document.body, props: { mode: 'normal', list, motion: true } });
    (w2.vm as any).scrollToPos(50, 100);
    await sleep(200);
    expect(w2.find('.semi-scrolllist-item').element.scrollTop).toBe(50);
    w2.unmount();
  });

  it('exposed helpers', () => {
    const wrapper = mount(ScrollItem, { attachTo: document.body, props: { mode: 'normal', list, selectedIndex: 1 } });
    const vm = wrapper.vm as any;
    const items = wrapper.findAll('li');
    expect(vm.getIndexByNode(items[2].element)).toBe(2);
    expect(vm.getNodeByIndex(3)).toBe(items[3].element);
    expect(typeof vm.scrollToCenter).toBe('function');
    expect(typeof vm.scrollToNode).toBe('function');
    expect(vm.foundation).toBeTruthy();
    wrapper.unmount();
  });

  it('className, style, class attr and aria-label', () => {
    const wrapper = mount(ScrollItem, {
      props: { mode: 'normal', list, className: 'custom', style: { width: '20px' }, ariaLabel: 'hours' },
      attrs: { class: 'extra' },
    });
    expect(wrapper.classes()).toContain('custom');
    expect(wrapper.classes()).toContain('extra');
    expect((wrapper.element as HTMLElement).style.width).toBe('20px');
    expect(wrapper.find('ul').attributes('aria-label')).toBe('hours');
    const w2 = mount(ScrollItem, { props: { list }, attrs: { 'aria-label': 'minutes' } });
    expect(w2.find('ul').attributes('aria-label')).toBe('minutes');
  });

  it('works inside ScrollList', () => {
    const wrapper = mount(ScrollList, { props: { header: 'H' }, slots: { default: () => h(ScrollItem, { mode: 'normal', list }) } });
    expect(wrapper.find('.semi-scrolllist-body .semi-scrolllist-item').exists()).toBe(true);
  });
});
