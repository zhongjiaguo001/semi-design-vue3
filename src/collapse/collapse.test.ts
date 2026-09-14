import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Collapse, { CollapsePanel } from './index';
import { IconPlus, IconMinus } from '../icons/generated';

const panels = (extra: any = {}) => [
  h(CollapsePanel, { itemKey: '1', header: 'Header 1', ...extra }, () => h('p', 'content 1')),
  h(CollapsePanel, { itemKey: '2', header: 'Header 2', ...extra }, () => h('p', 'content 2')),
  h(CollapsePanel, { itemKey: '3', header: 'Header 3', ...extra }, () => h('p', 'content 3')),
];

const mountCollapse = (props: any = {}, extra: any = {}, attrs: any = {}) => mount(Collapse, { props: { ...props, ...attrs }, slots: { default: () => panels(extra) } });

describe('Collapse', () => {
  it('renders semi-collapse with items, all collapsed by default', () => {
    const w = mountCollapse();
    expect(w.classes()).toContain('semi-collapse');
    const items = w.findAll('.semi-collapse-item');
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item.classes()).not.toContain('semi-collapse-item-active'));
    const header = items[0].find('.semi-collapse-header');
    expect(header.attributes('role')).toBe('button');
    expect(header.attributes('tabindex')).toBe('0');
    expect(header.attributes('aria-expanded')).toBe('false');
    expect(header.attributes('aria-disabled')).toBe('false');
    expect(w.find('.semi-collapse-content').exists()).toBe(false);
  });

  it('string header renders spans + right block with extra and chevron-down icon on the right', () => {
    const w = mountCollapse({}, { extra: 'more' });
    const header = w.find('.semi-collapse-header');
    expect(header.classes()).not.toContain('semi-collapse-header-iconLeft');
    const spans = header.findAll(':scope > span');
    expect(spans[0].text()).toBe('Header 1');
    const right = header.find('.semi-collapse-header-right');
    expect(right.exists()).toBe(true);
    expect(right.find('span').text()).toBe('more');
    const icon = right.find('.semi-collapse-header-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.find('.semi-icon-chevron_down').exists()).toBe(true);
    // header span comes first, icon last
    expect(header.element.firstElementChild!.classList.contains('semi-collapse-header-icon')).toBe(false);
  });

  it('click header toggles active, renders content with aria links, emits change with keys', async () => {
    const w = mountCollapse();
    const header = w.findAll('.semi-collapse-header')[0];
    await header.trigger('click');
    const item = w.findAll('.semi-collapse-item')[0];
    expect(item.classes()).toContain('semi-collapse-item-active');
    expect(header.attributes('aria-expanded')).toBe('true');
    expect(header.find('.semi-icon-chevron_up').exists()).toBe(true);
    const content = item.find('.semi-collapse-content');
    expect(content.exists()).toBe(true);
    expect(content.attributes('aria-hidden')).toBe('false');
    expect(content.attributes('id')).toBe(header.attributes('aria-owns'));
    expect(content.find('.semi-collapse-content-wrapper p').text()).toBe('content 1');
    expect(item.find('.semi-collapsible-wrapper').exists()).toBe(true);
    const ev = w.emitted('change')!;
    expect(ev).toHaveLength(1);
    expect(ev[0][0]).toEqual(['1']);
    expect(ev[0][1]).toBeInstanceOf(MouseEvent);
    expect(w.emitted('update:activeKey')![0][0]).toEqual(['1']);
    expect(w.emitted('update:modelValue')![0][0]).toEqual(['1']);
    // open a second one -> both open
    await w.findAll('.semi-collapse-header')[1].trigger('click');
    expect(w.emitted('change')![1][0]).toEqual(['1', '2']);
    expect(w.findAll('.semi-collapse-item-active')).toHaveLength(2);
    // close the first
    await header.trigger('click');
    expect(w.emitted('change')![2][0]).toEqual(['2']);
    expect(item.classes()).not.toContain('semi-collapse-item-active');
  });

  it('defaultActiveKey string / array', () => {
    const w = mountCollapse({ defaultActiveKey: '2' });
    const items = w.findAll('.semi-collapse-item');
    expect(items[1].classes()).toContain('semi-collapse-item-active');
    expect(items[0].classes()).not.toContain('semi-collapse-item-active');
    const w2 = mountCollapse({ defaultActiveKey: ['1', '3'] });
    expect(w2.findAll('.semi-collapse-item-active')).toHaveLength(2);
  });

  it('accordion: only one panel open at a time (and defaultActiveKey array takes first)', async () => {
    const w = mountCollapse({ accordion: true, defaultActiveKey: ['1', '2'] });
    expect(w.findAll('.semi-collapse-item-active')).toHaveLength(1);
    expect(w.findAll('.semi-collapse-item')[0].classes()).toContain('semi-collapse-item-active');
    await w.findAll('.semi-collapse-header')[2].trigger('click');
    expect(w.emitted('change')![0][0]).toEqual(['3']);
    const items = w.findAll('.semi-collapse-item');
    expect(items[0].classes()).not.toContain('semi-collapse-item-active');
    expect(items[2].classes()).toContain('semi-collapse-item-active');
  });

  it('controlled activeKey: does not change until parent updates; syncs to prop', async () => {
    const w = mountCollapse({ activeKey: ['1'] });
    expect(w.findAll('.semi-collapse-item')[0].classes()).toContain('semi-collapse-item-active');
    await w.findAll('.semi-collapse-header')[1].trigger('click');
    expect(w.emitted('change')![0][0]).toEqual(['1', '2']);
    await nextTick();
    expect(w.findAll('.semi-collapse-item')[1].classes()).not.toContain('semi-collapse-item-active');
    await w.setProps({ activeKey: '3' });
    expect(w.findAll('.semi-collapse-item-active')).toHaveLength(1);
    expect(w.findAll('.semi-collapse-item')[2].classes()).toContain('semi-collapse-item-active');
  });

  it('controlled activeKey: in-place mutation of the array is picked up (deep watch, like getDerivedStateFromProps)', async () => {
    const keys = ref<string[]>(['1']);
    const Parent = defineComponent({ setup: () => () => h(Collapse, { activeKey: keys.value }, () => panels()) });
    const w = mount(Parent);
    expect(w.findAll('.semi-collapse-item-active')).toHaveLength(1);
    keys.value.push('3');
    await nextTick();
    expect(w.findAll('.semi-collapse-item-active')).toHaveLength(2);
    expect(w.findAll('.semi-collapse-item')[2].classes()).toContain('semi-collapse-item-active');
  });

  it('v-model:activeKey and plain v-model work', async () => {
    const Parent = defineComponent({
      setup() {
        const keys = ref<string[]>([]);
        return () => h('div', [h(Collapse, { modelValue: keys.value, 'onUpdate:modelValue': (v: any) => (keys.value = v) }, () => panels()), h('span', { id: 'out' }, keys.value.join(','))]);
      },
    });
    const w = mount(Parent);
    await w.findAll('.semi-collapse-header')[1].trigger('click');
    expect(w.find('#out').text()).toBe('2');
    expect(w.findAll('.semi-collapse-item')[1].classes()).toContain('semi-collapse-item-active');
    await w.findAll('.semi-collapse-header')[0].trigger('click');
    expect(w.find('#out').text()).toBe('2,1');
  });

  it('expandIconPosition=left moves the icon before the header and adds iconLeft class', () => {
    const w = mountCollapse({ expandIconPosition: 'left' });
    const header = w.find('.semi-collapse-header');
    expect(header.classes()).toContain('semi-collapse-header-iconLeft');
    expect(header.element.firstElementChild!.classList.contains('semi-collapse-header-icon')).toBe(true);
    expect(header.find('.semi-collapse-header-right .semi-collapse-header-icon').exists()).toBe(false);
  });

  it('custom expandIcon / collapseIcon props (component or vnode) and slots', async () => {
    const w = mountCollapse({ expandIcon: IconPlus, collapseIcon: h(IconMinus) });
    expect(w.find('.semi-collapse-header-icon .semi-icon-plus').exists()).toBe(true);
    await w.find('.semi-collapse-header').trigger('click');
    expect(w.find('.semi-collapse-header-icon .semi-icon-minus').exists()).toBe(true);
    const s = mount(Collapse, { slots: { default: () => panels(), expandIcon: () => h('i', { class: 'ex' }), collapseIcon: () => h('i', { class: 'co' }) } });
    expect(s.find('.semi-collapse-header-icon .ex').exists()).toBe(true);
    await s.find('.semi-collapse-header').trigger('click');
    expect(s.find('.semi-collapse-header-icon .co').exists()).toBe(true);
  });

  it('clickHeaderToExpand=false: only the icon toggles', async () => {
    const w = mountCollapse({ clickHeaderToExpand: false });
    await w.find('.semi-collapse-header').trigger('click');
    expect(w.emitted('change')).toBeUndefined();
    await w.find('.semi-collapse-header-icon').trigger('click');
    expect(w.emitted('change')).toHaveLength(1);
    expect(w.emitted('change')![0][0]).toEqual(['1']);
  });

  it('keepDOM keeps panel content in the DOM while collapsed', () => {
    const w = mountCollapse({ keepDOM: true });
    expect(w.findAll('.semi-collapse-content')).toHaveLength(3);
    expect(w.findAll('.semi-collapse-content')[0].attributes('aria-hidden')).toBe('true');
    expect(mountCollapse().findAll('.semi-collapse-content')).toHaveLength(0);
  });

  it('motion=false: content disappears immediately on collapse and no transition class', async () => {
    const w = mountCollapse({ motion: false, defaultActiveKey: '1' });
    expect(w.find('.semi-collapse-content').exists()).toBe(true);
    await w.find('.semi-collapse-header').trigger('click');
    expect(w.find('.semi-collapse-content').exists()).toBe(false);
    expect(w.find('.semi-collapsible-transition').exists()).toBe(false);
  });

  it('lazyRender + keepDOM is forwarded to Collapsible', async () => {
    const w = mountCollapse({ keepDOM: true, lazyRender: true });
    expect(w.findAll('.semi-collapse-content')).toHaveLength(0);
    await w.find('.semi-collapse-header').trigger('click');
    expect(w.findAll('.semi-collapse-content')).toHaveLength(1);
  });

  it('class / style / data attrs on root; other attrs dropped', () => {
    const w = mount(Collapse, { attrs: { class: 'c', style: { margin: '1px' }, 'data-a': 'b', id: 'nope' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('margin: 1px');
    expect(w.attributes('data-a')).toBe('b');
    expect(w.attributes('id')).toBeUndefined();
  });

  it('exposes Collapse.Panel', () => {
    expect(Collapse.Panel).toBe(CollapsePanel);
    expect((CollapsePanel as any).elementType).toBe('Collapse.Panel');
  });
});

describe('Collapse.Panel', () => {
  it('header as node / slot renders without the right block; extra slot', () => {
    const w = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: h('b', 'node') }, () => 'c') } });
    const header = w.find('.semi-collapse-header');
    expect(header.find('b').text()).toBe('node');
    expect(header.find('.semi-collapse-header-right').exists()).toBe(false);
    expect(header.element.lastElementChild!.classList.contains('semi-collapse-header-icon')).toBe(true);
    const s = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: 'prop' }, { header: () => h('i', 'slot'), default: () => 'c' }) } });
    expect(s.find('.semi-collapse-header i').text()).toBe('slot');
    expect(s.text()).not.toContain('prop');
    const e = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: 'h' }, { extra: () => h('em', 'ex'), default: () => 'c' }) } });
    expect(e.find('.semi-collapse-header-right em').text()).toBe('ex');
  });

  it('showArrow=false hides the icon', () => {
    const w = mountCollapse({}, { showArrow: false });
    expect(w.find('.semi-collapse-header-icon').exists()).toBe(false);
  });

  it('disabled: header class, aria-disabled, icon disabled, click ignored', async () => {
    const w = mountCollapse({}, { disabled: true });
    const header = w.find('.semi-collapse-header');
    expect(header.classes()).toContain('semi-collapse-header-disabled');
    expect(header.attributes('aria-disabled')).toBe('true');
    expect(header.find('.semi-collapse-header-icon').classes()).toContain('semi-collapse-header-iconDisabled');
    expect(header.find('.semi-icon-chevron_down').exists()).toBe(true);
    await header.trigger('click');
    expect(w.emitted('change')).toBeUndefined();
  });

  it('panel without children: icon disabled and no Collapsible rendered', () => {
    const w = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: 'h' }) } });
    expect(w.find('.semi-collapse-header-icon').classes()).toContain('semi-collapse-header-iconDisabled');
    expect(w.find('.semi-collapsible-wrapper').exists()).toBe(false);
  });

  it('motionEnd is emitted by the panel after the collapsible transition ends', async () => {
    const onMotionEnd = vi.fn();
    const w = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: 'h', onMotionEnd }, () => 'c') } });
    await w.find('.semi-collapse-header').trigger('click');
    await w.find('.semi-collapsible-wrapper').trigger('transitionend');
    expect(onMotionEnd).toHaveBeenCalledTimes(1);
  });

  it('reCalcKey forwarded to Collapsible triggers re-measure', async () => {
    const key = ref(1);
    const Parent = defineComponent({
      setup() {
        return () => h(Collapse, { defaultActiveKey: 'a' }, () => h(CollapsePanel, { itemKey: 'a', header: 'h', reCalcKey: key.value }, () => 'c'));
      },
    });
    const w = mount(Parent);
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(42);
    key.value = 2;
    await nextTick();
    await nextTick();
    expect((w.find('.semi-collapsible-wrapper').element as HTMLElement).style.height).toBe('42px');
    spy.mockRestore();
  });

  it('class / attrs pass to the item root', () => {
    const w = mount(Collapse, { slots: { default: () => h(CollapsePanel, { itemKey: 'a', header: 'h', class: 'c', id: 'p1', 'data-a': '1' }, () => 'c') } });
    const item = w.find('.semi-collapse-item');
    expect(item.classes()).toContain('c');
    expect(item.attributes('id')).toBe('p1');
    expect(item.attributes('data-a')).toBe('1');
  });
});
