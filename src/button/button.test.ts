import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { Button, ButtonGroup, SplitButtonGroup, IconButton } from './index';
import { IconClose } from '../icons';

describe('Button', () => {
  it('renders default primary/light button with text', () => {
    const wrapper = mount(Button, { slots: { default: () => 'Click' } });
    const btn = wrapper.find('button');
    expect(btn.exists()).toBe(true);
    expect(btn.classes()).toContain('semi-button');
    expect(btn.classes()).toContain('semi-button-primary');
    expect(btn.classes()).toContain('semi-button-light');
    expect(btn.attributes('type')).toBe('button');
    expect(btn.find('.semi-button-content').text()).toBe('Click');
  });

  it.each(['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const)('supports type=%s', (type) => {
    const wrapper = mount(Button, { props: { type } });
    expect(wrapper.find('button').classes()).toContain(`semi-button-${type}`);
  });

  it.each(['solid', 'borderless', 'light', 'outline'] as const)('supports theme=%s', (theme) => {
    const wrapper = mount(Button, { props: { theme } });
    expect(wrapper.find('button').classes()).toContain(`semi-button-${theme}`);
  });

  it('supports sizes', () => {
    expect(mount(Button, { props: { size: 'small' } }).find('button').classes()).toContain('semi-button-size-small');
    expect(mount(Button, { props: { size: 'large' } }).find('button').classes()).toContain('semi-button-size-large');
    const def = mount(Button, { props: { size: 'default' } }).find('button').classes();
    expect(def).not.toContain('semi-button-size-small');
    expect(def).not.toContain('semi-button-size-large');
  });

  it('supports block / circle / colorful', () => {
    const cls = mount(Button, { props: { block: true, circle: true, colorful: true } }).find('button').classes();
    expect(cls).toContain('semi-button-block');
    expect(cls).toContain('semi-button-circle');
    expect(cls).toContain('semi-button-colorful');
  });

  it('supports htmlType', () => {
    expect(mount(Button, { props: { htmlType: 'submit' } }).find('button').attributes('type')).toBe('submit');
    expect(mount(Button, { props: { htmlType: 'reset' } }).find('button').attributes('type')).toBe('reset');
  });

  it('disabled: adds classes, attribute and blocks click', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Button, { props: { disabled: true, type: 'danger', onClick } });
    const btn = wrapper.find('button');
    expect(btn.classes()).toContain('semi-button-disabled');
    expect(btn.classes()).toContain('semi-button-danger-disabled');
    expect(btn.classes()).not.toContain('semi-button-danger');
    expect(btn.attributes('disabled')).toBeDefined();
    expect(btn.attributes('aria-disabled')).toBe('true');
    await btn.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('emits click / mousedown / mouseenter / mouseleave', async () => {
    const wrapper = mount(Button);
    const btn = wrapper.find('button');
    await btn.trigger('click');
    await btn.trigger('mousedown');
    await btn.trigger('mouseenter');
    await btn.trigger('mouseleave');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('mousedown')).toHaveLength(1);
    expect(wrapper.emitted('mouseenter')).toHaveLength(1);
    expect(wrapper.emitted('mouseleave')).toHaveLength(1);
  });

  it('passes through class, style and native attributes', () => {
    const wrapper = mount(Button, { attrs: { class: 'my-btn', style: 'color: red', id: 'x', 'data-foo': 'bar' } });
    const btn = wrapper.find('button');
    expect(btn.classes()).toContain('my-btn');
    expect(btn.attributes('id')).toBe('x');
    expect(btn.attributes('data-foo')).toBe('bar');
    expect(btn.attributes('style')).toContain('color: red');
  });

  it('renders as IconButton when icon prop is set', () => {
    const wrapper = mount(Button, { props: { icon: IconClose }, slots: { default: () => 'Close' } });
    const btn = wrapper.find('button');
    expect(btn.classes()).toContain('semi-button-with-icon');
    expect(btn.classes()).not.toContain('semi-button-with-icon-only');
    expect(btn.find('.semi-icon-close').exists()).toBe(true);
    expect(btn.find('.semi-button-content-right').text()).toBe('Close');
  });

  it('renders icon-only button when no children', () => {
    const wrapper = mount(Button, { props: { icon: IconClose } });
    expect(wrapper.find('button').classes()).toContain('semi-button-with-icon-only');
  });

  it('supports icon slot and iconPosition=right', () => {
    const wrapper = mount(Button, {
      props: { iconPosition: 'right' },
      slots: { icon: () => h(IconClose), default: () => 'Text' },
    });
    const btn = wrapper.find('button');
    const content = btn.find('.semi-button-content');
    expect(content.element.children[0].className).toContain('semi-button-content-left');
    expect(content.element.children[1].className).toContain('semi-icon');
  });

  it('loading: shows spin icon and adds loading class', () => {
    const wrapper = mount(Button, { props: { loading: true }, slots: { default: () => 'Save' } });
    const btn = wrapper.find('button');
    expect(btn.classes()).toContain('semi-button-loading');
    expect(btn.find('svg[data-icon="spin"]').exists()).toBe(true);
  });

  it('loading + colorful light theme uses AI loading icon', () => {
    const wrapper = mount(Button, { props: { loading: true, colorful: true, theme: 'light' } });
    expect(wrapper.find('.semi-button-content-loading-icon').exists()).toBe(true);
  });

  it('loading + disabled renders base button (no spinner)', () => {
    const wrapper = mount(Button, { props: { loading: true, disabled: true } });
    expect(wrapper.find('svg[data-icon="spin"]').exists()).toBe(false);
  });

  it('noHorizontalPadding removes paddings', () => {
    const w1 = mount(IconButton, { props: { icon: IconClose, noHorizontalPadding: true } });
    expect(w1.find('button').attributes('style')).toContain('padding-left: 0');
    expect(w1.find('button').attributes('style')).toContain('padding-right: 0');
    const w2 = mount(IconButton, { props: { icon: IconClose, noHorizontalPadding: 'left' } });
    expect(w2.find('button').attributes('style')).toContain('padding-left: 0');
    expect(w2.find('button').attributes('style')).not.toContain('padding-right: 0');
    const w3 = mount(IconButton, { props: { icon: IconClose, noHorizontalPadding: ['right'] } });
    expect(w3.find('button').attributes('style')).toContain('padding-right: 0');
  });

  it('colorful icon gets multiple fill colors', () => {
    const wrapper = mount(Button, { props: { icon: IconClose, colorful: true, type: 'primary', theme: 'light' } });
    expect(wrapper.find('svg').html()).toContain('--semi-button-colorful-multiple-fill-0');
  });

  it('x-semi-prop is only set on the content span of non-icon buttons', () => {
    expect(mount(Button, { slots: { default: () => 'A' } }).find('.semi-button-content').attributes('x-semi-prop')).toBe('children');
    const iconBtn = mount(Button, { props: { icon: IconClose }, slots: { default: () => 'A' } });
    expect(iconBtn.find('.semi-button-content').attributes('x-semi-prop')).toBeUndefined();
    expect(iconBtn.find('.semi-button-content-right').attributes('x-semi-prop')).toBe('children');
  });

  it('native aria-label attribute passes through', () => {
    expect(mount(Button, { attrs: { 'aria-label': 'shot' } }).find('button').attributes('aria-label')).toBe('shot');
  });

  it('contentClassName is applied to the content span', () => {
    expect(mount(Button, { props: { contentClassName: 'my-content' } }).find('.semi-button-content').classes()).toContain('my-content');
  });

  it('aria-label is applied', () => {
    const wrapper = mount(Button, { props: { ariaLabel: 'close dialog', icon: IconClose } });
    expect(wrapper.find('button').attributes('aria-label')).toBe('close dialog');
  });
});

describe('ButtonGroup', () => {
  it('renders group with lines between buttons and propagates props', () => {
    const wrapper = mount(ButtonGroup, {
      props: { size: 'small', type: 'warning', disabled: true, ariaLabel: 'group' },
      slots: { default: () => [h(Button, null, () => 'A'), h(Button, null, () => 'B'), h(Button, null, () => 'C')] },
    });
    const group = wrapper.find('.semi-button-group');
    expect(group.attributes('role')).toBe('group');
    expect(group.attributes('aria-label')).toBe('group');
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach((b) => {
      expect(b.classes()).toContain('semi-button-size-small');
      expect(b.classes()).toContain('semi-button-disabled');
      expect(b.classes()).toContain('semi-button-warning-disabled');
    });
    const lines = wrapper.findAll('.semi-button-group-line');
    expect(lines).toHaveLength(2);
    expect(lines[0].classes()).toContain('semi-button-group-line-warning');
    expect(lines[0].classes()).toContain('semi-button-group-line-disabled');
  });

  it('child props override group props and outline theme has no line', () => {
    const wrapper = mount(ButtonGroup, {
      props: { type: 'primary' },
      slots: { default: () => [h(Button, { type: 'danger', theme: 'outline' }, () => 'A'), h(Button, null, () => 'B')] },
    });
    expect(wrapper.findAll('button')[0].classes()).toContain('semi-button-danger');
    expect(wrapper.findAll('.semi-button-group-line')).toHaveLength(0);
  });

  it('propagates colorful and theme to children (group wins over child, like React rest spread)', () => {
    const wrapper = mount(ButtonGroup, {
      props: { colorful: true, theme: 'solid' },
      slots: { default: () => [h(Button, { theme: 'light' }, () => 'A'), h(Button, null, () => 'B')] },
    });
    const buttons = wrapper.findAll('button');
    buttons.forEach((b) => {
      expect(b.classes()).toContain('semi-button-colorful');
      expect(b.classes()).toContain('semi-button-solid');
    });
    expect(wrapper.find('.semi-button-group-line').classes()).toContain('semi-button-group-line-solid');
  });

  it('native aria-label attr and style pass through to the group root', () => {
    const wrapper = mount(ButtonGroup, {
      attrs: { 'aria-label': 'ops', style: 'margin-right: 10px', class: 'my-group' },
      slots: { default: () => h(Button, null, () => 'A') },
    });
    const root = wrapper.find('.semi-button-group');
    expect(root.attributes('aria-label')).toBe('ops');
    expect(root.attributes('style')).toContain('margin-right: 10px');
    expect(root.classes()).toContain('my-group');
  });

  it('single child renders without line', () => {
    const wrapper = mount(ButtonGroup, { slots: { default: () => h(Button, null, () => 'A') } });
    expect(wrapper.findAll('.semi-button-group-line')).toHaveLength(0);
    expect(wrapper.findAll('button')).toHaveLength(1);
  });
});

describe('SplitButtonGroup', () => {
  it('marks first and last buttons', async () => {
    const wrapper = mount(SplitButtonGroup, {
      attachTo: document.body,
      props: { ariaLabel: 'split' },
      slots: { default: () => [h(Button, null, () => 'A'), h(Button, null, () => 'B'), h(Button, null, () => 'C')] },
    });
    await nextTick();
    const buttons = wrapper.findAll('button');
    expect(wrapper.find('.semi-button-split').attributes('aria-label')).toBe('split');
    expect(buttons[0].classes()).toContain('semi-button-first');
    expect(buttons[2].classes()).toContain('semi-button-last');
    expect(buttons[1].classes()).not.toContain('semi-button-first');
    wrapper.unmount();
  });
});
