import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, beforeEach } from 'vitest';
import Popover from './index';
import Tooltip from '../tooltip/Tooltip';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

describe('Popover (official API parity)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('class / style attrs and className prop apply to the popup wrapper (React className/style)', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, className: 'from-prop' },
      attrs: { class: 'from-attr', style: { backgroundColor: 'red', borderColor: 'blue' } },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    const wrap = document.querySelector('.semi-popover-wrapper') as HTMLElement;
    expect(wrap.classList.contains('from-prop')).toBe(true);
    expect(wrap.classList.contains('from-attr')).toBe(true);
    expect(wrap.style.backgroundColor).toBe('red');
    expect(wrap.style.borderColor).toBe('blue');
    wrapper.unmount();
  });

  it('style backgroundColor/borderColor are shared with the arrow when arrowStyle is empty', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, showArrow: true, position: 'right', style: { backgroundColor: 'rgb(1, 2, 3)', borderColor: 'rgb(4, 5, 6)' } },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    const paths = document.querySelectorAll('svg.semi-popover-icon-arrow path');
    expect(paths[0].getAttribute('style')).toContain('rgb(4, 5, 6)');
    expect(paths[1].getAttribute('style')).toContain('rgb(1, 2, 3)');
    wrapper.unmount();
  });

  it('forwards guardFocus=false, arrowPointAtCenter, keepDOM, margin, rePosKey, stopPropagation, condition to Tooltip', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', guardFocus: false, arrowPointAtCenter: false, keepDOM: true, margin: 12, rePosKey: 'k', stopPropagation: true, condition: false, disableArrowKeyDown: true },
      slots: { default: () => h('button', 'trigger') },
    });
    const tip = wrapper.findComponent(Tooltip);
    expect(tip.props('guardFocus')).toBe(false);
    expect(tip.props('arrowPointAtCenter')).toBe(false);
    expect(tip.props('keepDOM')).toBe(true);
    expect(tip.props('margin')).toBe(12);
    expect(tip.props('rePosKey')).toBe('k');
    expect(tip.props('stopPropagation')).toBe(true);
    expect(tip.props('condition')).toBe(false);
    expect(tip.props('disableArrowKeyDown')).toBe(true);
    expect(tip.props('closeOnEsc')).toBe(true);
    expect(tip.props('returnFocusOnClose')).toBe(true);
    expect(tip.props('disableFocusListener')).toBe(true);
    wrapper.unmount();
    const w2 = mount(Popover, { attachTo: document.body, props: { content: 'x' }, slots: { default: () => h('button', 'trigger') } });
    expect(w2.findComponent(Tooltip).props('guardFocus')).toBe(true);
    w2.unmount();
  });

  it('condition=false blocks hover / click triggers; custom trigger unaffected', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', motion: false, condition: false, mouseEnterDelay: 0 },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeNull();
    wrapper.unmount();
    const wc = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', motion: false, condition: false, trigger: 'click' },
      slots: { default: () => h('button', 'trigger') },
    });
    await wc.find('button').trigger('click');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeNull();
    await wc.setProps({ condition: true });
    await wc.find('button').trigger('click');
    await wait();
    expect(document.querySelector('.semi-popover')).toBeTruthy();
    wc.unmount();
    const w2 = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', motion: false, condition: false, trigger: 'custom', visible: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    expect(document.querySelector('.semi-popover')).toBeTruthy();
    w2.unmount();
  });

  it('controlled visible with trigger=custom toggles the card and emits update:visible on hover', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: false, motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    expect(document.querySelector('.semi-popover')).toBeNull();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(document.querySelector('.semi-popover')).toBeTruthy();
    await wrapper.setProps({ visible: false });
    await wait();
    expect(document.querySelector('.semi-popover')).toBeNull();
    wrapper.unmount();
    const w2 = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', motion: false, mouseEnterDelay: 0 },
      slots: { default: () => h('button', 'trigger') },
    });
    await w2.find('button').trigger('mouseenter');
    await wait();
    expect(w2.emitted('update:visible')![0]).toEqual([true]);
    w2.unmount();
  });

  it('getPopupContainer renders the card into the given container; position right; zIndex custom', async () => {
    const parent = document.createElement('div');
    parent.id = 'popup-parent';
    document.body.appendChild(parent);
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, position: 'right', zIndex: 2000, getPopupContainer: () => parent },
      slots: { default: () => h('button', 'trigger') },
    });
    await wait();
    expect(parent.querySelector('.semi-popover')).toBeTruthy();
    expect(parent.querySelector('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('right');
    expect((parent.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    wrapper.unmount();
  });

  it('spacing defaults: 4 without arrow, 10 with arrow, explicit spacing respected', () => {
    const a = mount(Popover, { props: { content: 'x' }, slots: { default: () => h('button', 'b') } });
    expect(a.findComponent(Tooltip).props('spacing')).toBe(4);
    a.unmount();
    const b = mount(Popover, { props: { content: 'x', showArrow: true }, slots: { default: () => h('button', 'b') } });
    expect(b.findComponent(Tooltip).props('spacing')).toBe(10);
    b.unmount();
    const c = mount(Popover, { props: { content: 'x', showArrow: true, spacing: 20 }, slots: { default: () => h('button', 'b') } });
    expect(c.findComponent(Tooltip).props('spacing')).toBe(20);
    c.unmount();
  });

  it('initialFocusRef focuses the bound element on open; aria attributes on trigger', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: {
        trigger: 'click',
        motion: false,
        content: ({ initialFocusRef }: any) => h('div', [h('button', 'first'), h('input', { ref: initialFocusRef, placeholder: 'focus here' })]),
      },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await wait(200);
    const input = document.querySelector('.semi-popover input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
    const trigger = wrapper.find('button');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.attributes('aria-haspopup')).toBe('dialog');
    expect(trigger.attributes('aria-controls')).toBe(document.querySelector('.semi-popover-wrapper')!.id);
    wrapper.unmount();
  });

  it('static names', () => {
    expect((Popover as any).elementType).toBe('Popover');
    expect((Popover as any).__SemiComponentName__).toBe('Popover');
  });
});
