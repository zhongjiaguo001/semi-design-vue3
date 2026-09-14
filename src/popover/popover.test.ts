import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Popover from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

describe('Popover', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders pop card with content (prop) and default position bottom', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'pop content', trigger: 'custom', visible: true, motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    const card = document.querySelector('.semi-popover') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.querySelector('.semi-popover-content')!.textContent).toBe('pop content');
    const wrap = document.querySelector('.semi-popover-wrapper') as HTMLElement;
    expect(wrap.getAttribute('x-placement')).toBe('bottom');
    expect(wrap.getAttribute('role')).toBe('dialog');
    expect((document.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('1030');
    expect(document.querySelector('.semi-popover-icon-arrow')).toBeNull();
    wrapper.unmount();
  });

  it('content slot & function content receive initialFocusRef; contentClassName applied', async () => {
    const fn = vi.fn(() => h('em', 'fn'));
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: fn, trigger: 'custom', visible: true, motion: false, contentClassName: 'cc' },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    expect((fn.mock.calls[0] as any)[0]).toHaveProperty('initialFocusRef');
    expect(document.querySelector('.semi-popover.cc em')!.textContent).toBe('fn');
    wrapper.unmount();
    const w2 = mount(Popover, {
      attachTo: document.body,
      props: { trigger: 'custom', visible: true, motion: false },
      slots: { default: () => h('button', 'trigger'), content: () => h('i', 'slot') },
    });
    await wait();
    expect(document.querySelector('.semi-popover-content i')!.textContent).toBe('slot');
    w2.unmount();
  });

  it('showArrow renders Arrow svg with arrowStyle colors', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, showArrow: true, arrowStyle: { backgroundColor: 'red', borderColor: 'blue', borderOpacity: 0.5 }, position: 'top' },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    const arrow = document.querySelector('svg.semi-popover-icon-arrow') as SVGElement;
    expect(arrow).toBeTruthy();
    const paths = arrow.querySelectorAll('path');
    expect(paths[0].getAttribute('style')).toContain('fill: blue');
    expect(paths[0].getAttribute('style')).toContain('opacity: 0.5');
    expect(paths[1].getAttribute('style')).toContain('fill: red');
    expect(document.querySelector('.semi-popover-wrapper')!.classList.contains('semi-popover-with-arrow')).toBe(true);
    wrapper.unmount();
  });

  it('hover trigger shows / hides and emits visibleChange', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0 },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeTruthy();
    expect(document.querySelector('.semi-popover-wrapper')!.getAttribute('role')).toBe('tooltip');
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    await wrapper.find('button').trigger('mouseleave');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeNull();
    wrapper.unmount();
  });

  it('click trigger + closeOnEsc default true + clickOutSide', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'click', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeTruthy();
    await wrapper.find('button').trigger('keydown', { key: 'Escape' });
    await wait();
    expect(wrapper.emitted('escKeyDown')).toBeTruthy();
    expect(document.querySelector('.semi-popover')).toBeNull();
    await wrapper.find('button').trigger('click');
    await wait();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('clickOutSide')).toBeTruthy();
    expect(document.querySelector('.semi-popover')).toBeNull();
    wrapper.unmount();
  });

  it('rtl adds rtl class to card, exposes focusTrigger/rePosition', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Popover, { content: 'x', trigger: 'custom', visible: true, motion: false }, () => h('button', 'trigger')) },
    });
    await wait();
    expect(document.querySelector('.semi-popover')!.classList.contains('semi-popover-rtl')).toBe(true);
    w.unmount();
    const w2 = mount(Popover, { attachTo: document.body, props: { content: 'x' }, slots: { default: () => h('button', 'b') } });
    expect(typeof (w2.vm as any).focusTrigger).toBe('function');
    expect(typeof (w2.vm as any).rePosition).toBe('function');
    w2.unmount();
  });
});
