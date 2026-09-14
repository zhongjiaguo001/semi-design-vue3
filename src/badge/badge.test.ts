import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Badge from './index';
import ConfigProvider from '../configProvider';

describe('Badge', () => {
  it('renders count with default type/theme/position', () => {
    const w = mount(Badge, { props: { count: 5 }, slots: { default: () => h('span', { class: 'child' }, 'x') } });
    expect(w.classes()).toContain('semi-badge');
    const count = w.find('[x-semi-prop="count"]');
    expect(count.text()).toBe('5');
    expect(count.classes()).toContain('semi-badge-count');
    expect(count.classes()).toContain('semi-badge-primary');
    expect(count.classes()).toContain('semi-badge-solid');
    expect(count.classes()).toContain('semi-badge-rightTop');
    expect(count.classes()).not.toContain('semi-badge-block');
  });
  it('no children -> block; string count; overflowCount', () => {
    const w = mount(Badge, { props: { count: 'new' } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('semi-badge-block');
    expect(count.text()).toBe('new');
    expect(mount(Badge, { props: { count: 120, overflowCount: 99 } }).find('[x-semi-prop="count"]').text()).toBe('99+');
    expect(mount(Badge, { props: { count: 50, overflowCount: 99 } }).find('[x-semi-prop="count"]').text()).toBe('50');
  });
  it('dot hides content', () => {
    const w = mount(Badge, { props: { dot: true, count: 3 } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('semi-badge-dot');
    expect(count.text()).toBe('');
    expect(count.classes()).not.toContain('semi-badge-count');
  });
  it('type / theme / position variants', () => {
    const w = mount(Badge, { props: { count: 1, type: 'danger', theme: 'light', position: 'leftBottom' }, slots: { default: () => h('span') } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('semi-badge-danger');
    expect(count.classes()).toContain('semi-badge-light');
    expect(count.classes()).toContain('semi-badge-leftBottom');
  });
  it('custom node count (prop and slot)', () => {
    const w = mount(Badge, { props: { count: () => h('i', { class: 'custom' }) } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('semi-badge-custom');
    expect(count.classes()).not.toContain('semi-badge-primary');
    expect(count.find('i.custom').exists()).toBe(true);
    const w2 = mount(Badge, { slots: { count: () => h('b', 'slot') } });
    expect(w2.find('[x-semi-prop="count"] b').text()).toBe('slot');
  });
  it('countClassName / countStyle / style / class', () => {
    const w = mount(Badge, { props: { count: 1, countClassName: 'cc', countStyle: { color: 'red' } }, attrs: { class: 'root', style: 'top: 1px' } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('cc');
    // style attr wins over countStyle (React parity)
    expect(count.attributes('style')).toContain('top: 1px');
    expect(w.classes()).toContain('root');
    const w2 = mount(Badge, { props: { count: 1, countStyle: { color: 'red' } } });
    expect(w2.find('[x-semi-prop="count"]').attributes('style')).toContain('color: red');
  });
  it('rtl default position is leftTop', () => {
    const w = mount(ConfigProvider, { props: { direction: 'rtl' }, slots: { default: () => h(Badge, { count: 1 }, () => h('span')) } });
    expect(w.find('[x-semi-prop="count"]').classes()).toContain('semi-badge-leftTop');
  });
});

describe('Badge parity extras', () => {
  it('forwards onClick / onMouseEnter / onMouseLeave (React propTypes) to the root span', async () => {
    let clicks = 0, enter = 0, leave = 0;
    const w = mount(Badge, {
      props: { count: 1 },
      attrs: { onClick: () => clicks++, onMouseenter: () => enter++, onMouseleave: () => leave++ },
    });
    await w.trigger('click');
    await w.trigger('mouseenter');
    await w.trigger('mouseleave');
    expect([clicks, enter, leave]).toEqual([1, 1, 1]);
  });
  it('supports type=success and inverted theme', () => {
    const w = mount(Badge, { props: { dot: true, type: 'success', theme: 'inverted' } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).toContain('semi-badge-success');
    expect(count.classes()).toContain('semi-badge-inverted');
    expect(count.classes()).toContain('semi-badge-block');
  });
  it('overflowCount equal to count is not overflowed; undefined count renders no count class', () => {
    expect(mount(Badge, { props: { count: 10, overflowCount: 10 } }).find('[x-semi-prop="count"]').text()).toBe('10');
    const w = mount(Badge, { slots: { default: () => h('span') } });
    const count = w.find('[x-semi-prop="count"]');
    expect(count.classes()).not.toContain('semi-badge-count');
    expect(count.classes()).toContain('semi-badge-rightTop');
  });
});
