import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Tooltip from './index';
import Button from '../button';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getPortals() {
  return Array.from(document.querySelectorAll('.semi-portal'));
}

async function showAndWait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

describe('Tooltip', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger with a11y attrs and no portal initially', async () => {
    const wrapper = mount(Tooltip, { attachTo: document.body, props: { content: 'hi' }, slots: { default: () => h('button', 'trigger') } });
    await nextTick();
    const btn = wrapper.find('button');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('tabindex')).toBe('0');
    expect(btn.attributes('aria-describedby')).toBeDefined();
    expect(btn.attributes('data-popupid')).toBeDefined();
    expect(getPortals()).toHaveLength(0);
    wrapper.unmount();
  });

  it('shows on hover (delay), hides on mouseleave', async () => {
    const onVisibleChange = vi.fn();
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'tip content', mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false, onVisibleChange },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    const portal = document.querySelector('.semi-portal') as HTMLElement;
    expect(portal).toBeTruthy();
    expect(portal.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    expect(portal.querySelector('.semi-tooltip-content')!.textContent).toBe('tip content');
    expect(portal.querySelector('.semi-tooltip-icon-arrow')).toBeTruthy();
    expect(portal.querySelector('[role="tooltip"]')).toBeTruthy();
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);

    await wrapper.find('button').trigger('mouseleave');
    await showAndWait();
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('respects mouseEnterDelay', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', mouseEnterDelay: 200, mouseLeaveDelay: 0, motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await sleep(50);
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    await showAndWait(250);
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();
  });

  it('trigger=click toggles and hides on outside click', async () => {
    const onClickOutSide = vi.fn();
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'click', motion: false, onClickOutSide },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    await wrapper.find('button').trigger('click');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    // click outside
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await showAndWait();
    expect(onClickOutSide).toHaveBeenCalled();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('trigger=focus shows on focus and hides on blur', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'focus', motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0 },
      slots: { default: () => h('input') },
    });
    await wrapper.find('input').trigger('focus');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    await wrapper.find('input').trigger('blur');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('trigger=contextMenu shows on right click', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'contextMenu', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('contextmenu');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();
  });

  it('trigger=custom is controlled by visible prop', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: false, motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await wrapper.find('button').trigger('click');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    await wrapper.setProps({ visible: true });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    await wrapper.setProps({ visible: false });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('visible=true shows initially (click trigger)', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', visible: true, motion: false, trigger: 'click' },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();
  });

  it('portal inner style uses pixel units for left/top (Vue does not auto-px numbers)', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'click', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await showAndWait();
    const inner = document.querySelector('.semi-portal-inner') as HTMLElement;
    expect(inner).toBeTruthy();
    expect(inner.style.left).toMatch(/px$/);
    expect(inner.style.top).toMatch(/px$/);
    wrapper.unmount();
  });

  it('content slot and function content receive initialFocusRef', async () => {
    const contentFn = vi.fn(() => h('b', 'fn content'));
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: contentFn, visible: true, trigger: 'custom', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    expect(contentFn).toHaveBeenCalled();
    expect((contentFn.mock.calls[0] as any)[0]).toHaveProperty('initialFocusRef');
    expect(document.querySelector('.semi-tooltip-content b')!.textContent).toBe('fn content');
    wrapper.unmount();

    const w2 = mount(Tooltip, {
      attachTo: document.body,
      props: { visible: true, trigger: 'custom', motion: false },
      slots: { default: () => h('button', 'trigger'), content: () => h('i', 'slot content') },
    });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-content i')!.textContent).toBe('slot content');
    w2.unmount();
  });

  it('showArrow=false hides arrow; position sets x-placement; className/style/zIndex applied', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', visible: true, trigger: 'custom', motion: false, showArrow: false, position: 'bottomLeft', className: 'my-tip', style: { backgroundColor: 'red' }, zIndex: 2000 },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    const wrap = document.querySelector('.semi-tooltip-wrapper') as HTMLElement;
    expect(wrap.classList.contains('my-tip')).toBe(true);
    expect(wrap.classList.contains('semi-tooltip-with-arrow')).toBe(false);
    expect(wrap.querySelector('.semi-tooltip-icon-arrow')).toBeNull();
    expect(wrap.getAttribute('x-placement')).toBe('bottomLeft');
    expect(wrap.style.backgroundColor).toBe('red');
    expect((document.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    wrapper.unmount();
  });

  it('wraps disabled button in span and disables pointer events', () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x' },
      slots: { default: () => h(Button, { disabled: true }, () => 'dis') },
    });
    const span = wrapper.find('span');
    expect(span.exists()).toBe(true);
    expect(span.attributes('style')).toContain('display: inline-block');
    expect(span.attributes('style')).toContain('cursor: not-allowed');
    const btn = wrapper.find('button');
    expect(btn.attributes('style')).toContain('pointer-events: none');
    wrapper.unmount();
  });

  it('wraps plain text children in span', () => {
    const wrapper = mount(Tooltip, { attachTo: document.body, props: { content: 'x', wrapperClassName: 'wrap' }, slots: { default: () => 'plain' } });
    const span = wrapper.find('span.wrap');
    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('plain');
    wrapper.unmount();
  });

  it('role=dialog uses aria-expanded / aria-haspopup', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', role: 'dialog', trigger: 'click', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    const btn = wrapper.find('button');
    expect(btn.attributes('aria-haspopup')).toBe('dialog');
    expect(btn.attributes('aria-expanded')).toBe('false');
    await btn.trigger('click');
    await showAndWait();
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('closeOnEsc hides and emits escKeyDown', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'click', motion: false, closeOnEsc: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    await wrapper.find('button').trigger('keydown', { key: 'Escape' });
    await showAndWait();
    expect(wrapper.emitted('escKeyDown')).toBeTruthy();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('keepDOM keeps portal with display none after hide', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, keepDOM: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    await wrapper.setProps({ visible: false });
    await showAndWait();
    const wrap = document.querySelector('.semi-tooltip-wrapper') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(wrap.style.display).toBe('none');
    wrapper.unmount();
  });

  it('clickToHide hides when clicking into the popup', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0, clickToHide: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    (document.querySelector('.semi-portal-inner') as HTMLElement).click();
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();
  });

  it('getPopupContainer from props and ConfigProvider', async () => {
    const container = document.createElement('div');
    container.id = 'c1';
    document.body.appendChild(container);
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false, getPopupContainer: () => container },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    expect(container.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();

    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    const w2 = mount(ConfigProvider, {
      attachTo: document.body,
      props: { getPopupContainer: () => container2, theme: { token: { colorPrimary: '#123456' } } },
      slots: { default: () => h(Tooltip, { content: 'x', trigger: 'custom', visible: true, motion: false }, () => h('button', 'trigger')) },
    });
    await showAndWait();
    expect(container2.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    // theme scope class is propagated to the portal
    expect(Array.from((container2.querySelector('.semi-portal') as HTMLElement).classList).some((c) => c.startsWith('semi-theme-'))).toBe(true);
    w2.unmount();
  });

  it('rtl direction adds rtl class on wrapper', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Tooltip, { content: 'x', trigger: 'custom', visible: true, motion: false }, () => h('button', 'trigger')) },
    });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')!.classList.contains('semi-tooltip-rtl')).toBe(true);
    w.unmount();
  });

  it('exposes rePosition / focusTrigger', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'click', motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    expect(typeof (wrapper.vm as any).rePosition).toBe('function');
    expect(typeof (wrapper.vm as any).focusTrigger).toBe('function');
    (wrapper.vm as any).rePosition();
    wrapper.unmount();
  });

  it('motion: applies animation class and removes portal after animationend', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: true, onAfterClose: vi.fn() },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    const wrap = document.querySelector('.semi-tooltip-wrapper') as HTMLElement;
    expect(wrap.classList.contains('semi-tooltip-animation-show')).toBe(true);
    wrap.dispatchEvent(new Event('animationend'));
    await showAndWait();
    await wrapper.setProps({ visible: false });
    await showAndWait();
    const wrap2 = document.querySelector('.semi-tooltip-wrapper') as HTMLElement;
    expect(wrap2.classList.contains('semi-tooltip-animation-hide')).toBe(true);
    wrap2.dispatchEvent(new Event('animationend'));
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    expect(wrapper.emitted('afterClose')).toBeTruthy();
    wrapper.unmount();
  });

  it('unmount removes portal', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', trigger: 'custom', visible: true, motion: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    expect(getPortals().length).toBe(1);
    wrapper.unmount();
    await nextTick();
    expect(getPortals().length).toBe(0);
  });

  it('works with component child (Button) as trigger', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0 },
      slots: { default: () => h(Button, null, () => 'btn') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();
  });
});

describe('Tooltip parity extras', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('condition=false blocks hover/click triggers but not custom', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, condition: false },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    await wrapper.setProps({ trigger: 'click' });
    await wrapper.find('button').trigger('click');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    wrapper.unmount();

    const custom = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, condition: false, trigger: 'custom', visible: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    custom.unmount();
  });

  it('disableFocusListener prevents focus from opening a hover tooltip', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, disableFocusListener: true },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('focus');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull();
    await wrapper.find('button').trigger('mouseenter');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')).toBeTruthy();
    wrapper.unmount();
  });

  it('wrapperId is used as popup id and aria-describedby', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, wrapperId: 'my-tip', trigger: 'click' },
      slots: { default: () => h('button', 'trigger') },
    });
    expect(wrapper.find('button').attributes('aria-describedby')).toBe('my-tip');
    await wrapper.find('button').trigger('click');
    await showAndWait();
    expect(document.querySelector('.semi-tooltip-wrapper')?.id).toBe('my-tip');
    expect((wrapper.vm as any).getPopupId()).toBe('my-tip');
    wrapper.unmount();
  });

  it('stopPropagation stops click bubbling from the popup', async () => {
    const outer = vi.fn();
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, trigger: 'click', stopPropagation: true },
      slots: { default: () => h('button', 'trigger') },
    });
    document.body.addEventListener('click', outer);
    await wrapper.find('button').trigger('click');
    await showAndWait();
    const before = outer.mock.calls.length;
    (document.querySelector('.semi-tooltip-content') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(outer.mock.calls.length).toBe(before);
    document.body.removeEventListener('click', outer);
    wrapper.unmount();
  });

  it('rePosKey change triggers a re-position', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, trigger: 'click', rePosKey: 1 },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await showAndWait();
    const spy = vi.spyOn((wrapper.vm as any).foundation, 'calcPosition');
    await wrapper.setProps({ rePosKey: 2 });
    await showAndWait();
    expect(spy).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('spacing object and arrowPointAtCenter=false / prefixCls are accepted', async () => {
    const wrapper = mount(Tooltip, {
      attachTo: document.body,
      props: { content: 'x', motion: false, trigger: 'click', spacing: { x: 4, y: 12 }, arrowPointAtCenter: false, prefixCls: 'my-pop', position: 'topLeft' },
      slots: { default: () => h('button', 'trigger') },
    });
    await wrapper.find('button').trigger('click');
    await showAndWait();
    const el = document.querySelector('.my-pop-wrapper') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('x-placement')).toBe('topLeft');
    expect(el.querySelector('.my-pop-icon-arrow')).toBeTruthy();
    wrapper.unmount();
  });
});
