import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import Spin, { SpinIcon } from './index';
import { IconLoading } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Spin', () => {
  it('renders default spinner', () => {
    const wrapper = mount(Spin);
    expect(wrapper.classes()).toContain('semi-spin');
    expect(wrapper.classes()).toContain('semi-spin-middle');
    expect(wrapper.classes()).not.toContain('semi-spin-block');
    expect(wrapper.find('.semi-spin-wrapper svg[data-icon="spin"]').exists()).toBe(true);
    expect(wrapper.find('.semi-spin-children').exists()).toBe(true);
  });

  it.each(['small', 'middle', 'large'] as const)('size=%s', (size) => {
    expect(mount(Spin, { props: { size } }).classes()).toContain(`semi-spin-${size}`);
  });

  it('spinning=false hides spinner', async () => {
    const wrapper = mount(Spin, { props: { spinning: false } });
    expect(wrapper.classes()).toContain('semi-spin-hidden');
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(false);
    await wrapper.setProps({ spinning: true });
    expect(wrapper.classes()).not.toContain('semi-spin-hidden');
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(true);
  });

  it('wraps children with block class and childStyle', () => {
    const wrapper = mount(Spin, { props: { childStyle: { height: '100px' } }, slots: { default: () => h('p', 'child') } });
    expect(wrapper.classes()).toContain('semi-spin-block');
    expect(wrapper.find('.semi-spin-children p').text()).toBe('child');
    expect(wrapper.find('.semi-spin-children').attributes('style')).toContain('height: 100px');
  });

  it('custom indicator (prop and slot) and tip', () => {
    const w1 = mount(Spin, { props: { indicator: IconLoading, tip: 'loading...' } });
    expect(w1.find('.semi-spin-animate .semi-icon-loading').exists()).toBe(true);
    expect(w1.find('[x-semi-prop="tip"]').text()).toBe('loading...');
    const w2 = mount(Spin, { slots: { indicator: () => h('i', { class: 'ind' }), tip: () => h('b', 'tip') } });
    expect(w2.find('.semi-spin-animate i.ind').exists()).toBe(true);
    expect(w2.find('[x-semi-prop="tip"] b').text()).toBe('tip');
  });

  it('delay postpones showing spinner', async () => {
    const wrapper = mount(Spin, { props: { delay: 100, spinning: true } });
    await nextTick();
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(false);
    await sleep(150);
    await nextTick();
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(true);
    await wrapper.setProps({ spinning: false });
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(false);
  });

  it('wrapperClassName / class / style / data attrs', () => {
    const wrapper = mount(Spin, { props: { wrapperClassName: 'w' }, attrs: { class: 'c', style: 'color: red', 'data-x': '1' } });
    expect(wrapper.classes()).toContain('w');
    expect(wrapper.classes()).toContain('c');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.attributes('data-x')).toBe('1');
  });

  it('turning spinning off during the delay cancels the pending timer', async () => {
    const wrapper = mount(Spin, { props: { delay: 100, spinning: false } });
    await wrapper.setProps({ spinning: true });
    await nextTick();
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(false);
    await wrapper.setProps({ spinning: false });
    await sleep(150);
    await nextTick();
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(false);
    expect(wrapper.classes()).toContain('semi-spin-hidden');
    await wrapper.setProps({ spinning: true });
    await sleep(150);
    await nextTick();
    expect(wrapper.find('.semi-spin-wrapper').exists()).toBe(true);
  });

  it('exports SpinIcon and renders it with custom class', () => {
    const wrapper = mount(SpinIcon, { props: { className: 'my-icon' } });
    expect(wrapper.find('svg[data-icon="spin"]').classes()).toContain('my-icon');
  });
});
