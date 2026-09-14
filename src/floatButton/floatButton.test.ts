import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FloatButton, FloatButtonGroup } from './index';
import { IconPlus } from '../icons/generated';

describe('FloatButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders root + body with default shape/size classes and icon prop', () => {
    const wrapper = mount(FloatButton, { props: { icon: h(IconPlus) } });
    expect(wrapper.classes()).toContain('semi-floatButton');
    expect(wrapper.classes()).toContain('semi-floatButton-round');
    expect(wrapper.classes()).toContain('semi-floatButton-default');
    const body = wrapper.find('.semi-floatButton-body');
    expect(body.exists()).toBe(true);
    expect(body.classes()).toContain('semi-floatButton-round');
    expect(body.classes()).toContain('semi-floatButton-default');
    expect(body.classes()).not.toContain('semi-floatButton-colorful');
    expect(body.classes()).not.toContain('semi-floatButton-disabled');
    expect(body.find('.semi-icon-plus').exists()).toBe(true);
  });

  it.each(['square', 'round'] as const)('shape=%s', (shape) => {
    const wrapper = mount(FloatButton, { props: { shape } });
    expect(wrapper.classes()).toContain(`semi-floatButton-${shape}`);
    expect(wrapper.find('.semi-floatButton-body').classes()).toContain(`semi-floatButton-${shape}`);
  });

  it.each(['small', 'default', 'large'] as const)('size=%s', (size) => {
    const wrapper = mount(FloatButton, { props: { size } });
    expect(wrapper.classes()).toContain(`semi-floatButton-${size}`);
    expect(wrapper.find('.semi-floatButton-body').classes()).toContain(`semi-floatButton-${size}`);
  });

  it('colorful / disabled / className / class / style / attrs', () => {
    const wrapper = mount(FloatButton, { props: { colorful: true, disabled: true, className: 'a', class: 'b', style: { top: '1px' }, 'data-x': 'y' } });
    const body = wrapper.find('.semi-floatButton-body');
    expect(body.classes()).toContain('semi-floatButton-colorful');
    expect(body.classes()).toContain('semi-floatButton-disabled');
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('top: 1px');
    expect(wrapper.attributes('data-x')).toBe('y');
  });

  it('icon slot and default slot (description) render inside the body', () => {
    const wrapper = mount(FloatButton, { slots: { icon: () => h('i', { class: 'ic' }), default: () => h('span', { class: 'desc' }, 'Help') } });
    const body = wrapper.find('.semi-floatButton-body');
    expect(body.find('.ic').exists()).toBe(true);
    expect(body.find('.desc').text()).toBe('Help');
  });

  it('badge prop wraps the body in a Badge', () => {
    const wrapper = mount(FloatButton, { props: { badge: { count: 5 } } });
    const badge = wrapper.find('.semi-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.find('.semi-floatButton-body').exists()).toBe(true);
    expect(badge.text()).toContain('5');
    const dot = mount(FloatButton, { props: { badge: { dot: true } } });
    expect(dot.find('.semi-badge-dot').exists()).toBe(true);
    expect(mount(FloatButton).find('.semi-badge').exists()).toBe(false);
  });

  it('click emits click; disabled swallows it', async () => {
    const wrapper = mount(FloatButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('click')![0][0]).toBeInstanceOf(MouseEvent);
    const disabled = mount(FloatButton, { props: { disabled: true } });
    await disabled.trigger('click');
    expect(disabled.emitted('click')).toBeUndefined();
  });

  it('href navigates; target=_blank opens a new window', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const blank = mount(FloatButton, { props: { href: 'https://x.test/', target: '_blank' } });
    await blank.trigger('click');
    expect(open).toHaveBeenCalledWith('https://x.test/', '_blank');
    expect(blank.emitted('click')).toHaveLength(1);

    const original = window.location;
    const setter = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, set href(v: string) { setter(v); }, get href() { return original.href; } } });
    const same = mount(FloatButton, { props: { href: '/same' } });
    await same.trigger('click');
    expect(setter).toHaveBeenCalledWith('/same');
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('exposes Group static and elementType', () => {
    expect((FloatButton as any).Group).toBe(FloatButtonGroup);
    expect((FloatButton as any).elementType).toBe('FloatButton');
  });
});

describe('FloatButtonGroup', () => {
  const items = [
    { value: 'a', icon: h(IconPlus), content: 'Add' },
    { value: 'b', content: h('b', { class: 'bb' }, 'B'), badge: { count: 2 } },
  ];

  it('renders items with data-value, icon/content and badge', () => {
    const wrapper = mount(FloatButtonGroup, { props: { items } });
    expect(wrapper.classes()).toContain('semi-floatButtonGroup');
    const list = wrapper.findAll('.semi-floatButtonGroup-item');
    expect(list).toHaveLength(2);
    expect(list[0].attributes('data-value')).toBe('a');
    expect(list[0].find('.semi-icon-plus').exists()).toBe(true);
    expect(list[0].text()).toBe('Add');
    expect(list[1].find('.bb').exists()).toBe(true);
    const badge = wrapper.find('.semi-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.find('.semi-floatButtonGroup-item').attributes('data-value')).toBe('b');
  });

  it('disabled / className / class / style / attrs / default slot', () => {
    const wrapper = mount(FloatButtonGroup, { props: { items: [], disabled: true, className: 'a', class: 'b', style: { top: '2px' }, 'data-k': 'v' }, slots: { default: () => h('i', { class: 'extra' }) } });
    expect(wrapper.classes()).toContain('semi-floatButtonGroup-disabled');
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('top: 2px');
    expect(wrapper.attributes('data-k')).toBe('v');
    expect(wrapper.find('.extra').exists()).toBe(true);
  });

  it('click emits (value, event) from the clicked item', async () => {
    const wrapper = mount(FloatButtonGroup, { props: { items } });
    await wrapper.findAll('.semi-floatButtonGroup-item')[1].trigger('click');
    const [value, e] = wrapper.emitted('click')![0];
    expect(value).toBe('b');
    expect(e).toBeInstanceOf(MouseEvent);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')![1][0]).toBeUndefined();
  });

  it('click on the icon / content inside an item still resolves that item value', async () => {
    const wrapper = mount(FloatButtonGroup, { props: { items } });
    await wrapper.find('.semi-icon-plus').trigger('click');
    expect(wrapper.emitted('click')![0][0]).toBe('a');
    await wrapper.find('.bb').trigger('click');
    expect(wrapper.emitted('click')![1][0]).toBe('b');
  });

  it('exposes elementType and default props', () => {
    expect((FloatButtonGroup as any).elementType).toBe('FloatButtonGroup');
    const wrapper = mount(FloatButtonGroup);
    expect(wrapper.findAll('.semi-floatButtonGroup-item')).toHaveLength(0);
    expect(wrapper.classes()).not.toContain('semi-floatButtonGroup-disabled');
  });
});
