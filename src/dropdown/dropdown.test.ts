import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dropdown, { DropdownMenu, DropdownItem, DropdownDivider, DropdownTitle, dropdownProps } from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

const menuSlot = () =>
  h(DropdownMenu, null, () => [
    h(DropdownTitle, null, () => 'Group'),
    h(DropdownItem, { class: 'i1' }, () => 'Alpha'),
    h(DropdownItem, { class: 'i2', disabled: true }, () => 'Beta'),
    h(DropdownDivider),
    h(DropdownItem, { class: 'i3' }, () => 'Gamma'),
  ]);

function mountDd(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  const merged: Record<string, any> = { default: () => h('button', { class: 'trigger' }, 'trigger'), render: menuSlot, ...slots };
  Object.keys(merged).forEach((k) => merged[k] === undefined && delete merged[k]);
  return mount(Dropdown, {
    attachTo: document.body,
    props: { motion: false, ...props },
    slots: merged,
  });
}

describe('Dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('trigger gets aria attrs; hover opens menu with expected structure', async () => {
    const wrapper = mountDd({ mouseEnterDelay: 0, mouseLeaveDelay: 0 });
    const trigger = wrapper.find('.trigger');
    expect(trigger.attributes('aria-haspopup')).toBe('true');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(trigger.classes()).not.toContain('semi-dropdown-showing');
    await trigger.trigger('mouseenter');
    await wait();
    expect(q('.semi-dropdown-wrapper')).toBeTruthy();
    expect(q('.semi-dropdown-wrapper')!.getAttribute('x-placement')).toBe('bottom');
    expect(q('.semi-dropdown-icon-arrow')).toBeNull();
    expect((q('.semi-portal') as HTMLElement).style.zIndex).toBe('1060');
    expect(q('.semi-dropdown')).toBeTruthy();
    expect(q('.semi-dropdown-content')!.getAttribute('x-semi-prop')).toBe('render');
    const menu = q('.semi-dropdown-menu')!;
    expect(menu.tagName).toBe('UL');
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-orientation')).toBe('vertical');
    expect(q('.semi-dropdown-title')!.textContent).toBe('Group');
    expect(qa('.semi-dropdown-item')).toHaveLength(3);
    expect(q('.semi-dropdown-divider')).toBeTruthy();
    const items = qa('.semi-dropdown-item');
    expect(items[0].getAttribute('role')).toBe('menuitem');
    expect(items[0].getAttribute('tabindex')).toBe('-1');
    expect(items[0].getAttribute('aria-disabled')).toBe('false');
    expect(items[1].classList.contains('semi-dropdown-item-disabled')).toBe(true);
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(wrapper.find('.trigger').classes()).toContain('semi-dropdown-showing');
    expect(wrapper.find('.trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    await wrapper.find('.trigger').trigger('mouseleave');
    await wait();
    expect(q('.semi-dropdown-wrapper')).toBeNull();
    expect(wrapper.emitted('visibleChange')!.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('render prop (VNode / render fn) and menu prop', async () => {
    const wrapper = mountDd({ trigger: 'custom', visible: true, render: h('div', { class: 'r-node' }, 'node') }, { render: undefined });
    await wait();
    expect(q('.semi-dropdown-content .r-node')!.textContent).toBe('node');
    wrapper.unmount();

    const w2 = mountDd({ trigger: 'custom', visible: true, render: () => h('div', { class: 'r-fn' }) }, { render: undefined });
    await wait();
    expect(q('.semi-dropdown-content .r-fn')).toBeTruthy();
    w2.unmount();

    const onClick = vi.fn();
    const w3 = mountDd(
      {
        trigger: 'custom',
        visible: true,
        menu: [
          { node: 'title', name: 'T' },
          { node: 'item', name: 'One', onClick, type: 'danger', icon: h('i', { class: 'm-icon' }) },
          { node: 'divider' },
          { node: 'item', name: 'Two', disabled: true },
        ],
      },
      { render: undefined }
    );
    await wait();
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    expect(q('.semi-dropdown-title')!.textContent).toBe('T');
    const items = qa('.semi-dropdown-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('One');
    expect(items[0].classList.contains('semi-dropdown-item-danger')).toBe(true);
    expect(items[0].querySelector('.semi-dropdown-item-icon .m-icon')).toBeTruthy();
    expect(q('.semi-dropdown-divider')).toBeTruthy();
    expect(items[1].classList.contains('semi-dropdown-item-disabled')).toBe(true);
    items[0].click();
    expect(onClick).toHaveBeenCalledTimes(1);
    items[1].click();
    w3.unmount();
  });

  it('trigger click / focus / contextMenu / custom(visible)', async () => {
    const wrapper = mountDd({ trigger: 'click' });
    await wrapper.find('.trigger').trigger('click');
    await wait();
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    // click trigger focuses first enabled item
    expect(document.activeElement).toBe(q('.i1'));
    expect(q('.i1')!.getAttribute('tabindex')).toBe('0');
    wrapper.unmount();

    const w2 = mountDd({ trigger: 'focus', mouseEnterDelay: 0 }, { default: () => h('input', { class: 'trigger' }) });
    await w2.find('.trigger').trigger('focus');
    await wait();
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    w2.unmount();

    const w3 = mountDd({ trigger: 'contextMenu' });
    await w3.find('.trigger').trigger('contextmenu');
    await wait();
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    w3.unmount();

    const w4 = mountDd({ trigger: 'custom', visible: false });
    await w4.find('.trigger').trigger('click');
    await wait();
    expect(q('.semi-dropdown-menu')).toBeNull();
    await w4.setProps({ visible: true });
    await wait();
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    w4.unmount();
  });

  it('DropdownItem emits click/mouseenter/mouseleave/contextmenu/keydown; disabled item emits nothing', async () => {
    const onClick = vi.fn();
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    const onContextmenu = vi.fn();
    const onKeydown = vi.fn();
    const dOnClick = vi.fn();
    const wrapper = mountDd(
      { trigger: 'custom', visible: true },
      {
        render: () =>
          h(DropdownMenu, null, () => [
            h(DropdownItem, { class: 'i1', onClick, onMouseenter, onMouseleave, onContextmenu, onKeydown }, () => 'A'),
            h(DropdownItem, { class: 'i2', disabled: true, onClick: dOnClick }, () => 'B'),
          ]),
      }
    );
    await wait();
    const i1 = q('.i1')!;
    i1.click();
    i1.dispatchEvent(new MouseEvent('mouseenter'));
    i1.dispatchEvent(new MouseEvent('mouseleave'));
    i1.dispatchEvent(new MouseEvent('contextmenu'));
    i1.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onMouseenter).toHaveBeenCalledTimes(1);
    expect(onMouseleave).toHaveBeenCalledTimes(1);
    expect(onContextmenu).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledTimes(1);
    q('.i2')!.click();
    expect(dOnClick).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('DropdownItem props: type / active / hover / icon (prop+slot) / className / style / showTick / forwardRef / data-*', async () => {
    const forwardRef = vi.fn();
    const wrapper = mount(DropdownItem, {
      attachTo: document.body,
      props: { type: 'warning', active: true, hover: true, icon: h('i', { class: 'p-icon' }), className: 'cls-a', style: { color: 'red' }, showTick: true, forwardRef, 'data-x': '1' },
      slots: { default: () => 'text' },
    });
    const li = wrapper.find('li');
    expect(li.classes()).toEqual(expect.arrayContaining(['semi-dropdown-item', 'semi-dropdown-item-warning', 'semi-dropdown-item-active', 'semi-dropdown-item-hover', 'semi-dropdown-item-withTick', 'cls-a']));
    expect(li.attributes('style')).toContain('color: red');
    expect(li.attributes('data-x')).toBe('1');
    expect(li.find('.semi-icon-tick').exists()).toBe(true);
    expect(li.find('.semi-icon-tick').attributes('style') || '').not.toContain('transparent');
    expect(li.find('.semi-dropdown-item-icon .p-icon').exists()).toBe(true);
    expect(forwardRef).toHaveBeenCalledWith(li.element);
    expect((wrapper.vm as any).getElement()).toBe(li.element);
    await wrapper.setProps({ active: false });
    expect(wrapper.find('.semi-icon-tick').attributes('style')).toContain('transparent');
    wrapper.unmount();

    const w2 = mount(DropdownItem, { attachTo: document.body, slots: { default: () => 'x', icon: () => h('b', { class: 's-icon' }) } });
    expect(w2.find('.semi-dropdown-item-icon .s-icon').exists()).toBe(true);
    expect(w2.find('.semi-icon-tick').exists()).toBe(false);
    w2.unmount();
  });

  it('showTick on Dropdown propagates through context to items and title', async () => {
    const wrapper = mountDd(
      { trigger: 'custom', visible: true, showTick: true },
      { render: () => h(DropdownMenu, null, () => [h(DropdownTitle, null, () => 'T'), h(DropdownItem, { active: true }, () => 'A'), h(DropdownItem, null, () => 'B')]) }
    );
    await wait();
    expect(q('.semi-dropdown-title')!.classList.contains('semi-dropdown-title-withTick')).toBe(true);
    const items = qa('.semi-dropdown-item');
    expect(items[0].classList.contains('semi-dropdown-item-withTick')).toBe(true);
    expect(items[0].querySelector('.semi-icon-tick')).toBeTruthy();
    expect((items[1].querySelector('.semi-icon-tick') as HTMLElement).style.color).toBe('transparent');
    wrapper.unmount();
  });

  it('Divider / Title / Menu accept className, style and attrs', () => {
    const d = mount(DropdownDivider, { props: { className: 'd-cls', style: { margin: '1px' } }, attrs: { class: 'd-attr' } });
    expect(d.classes()).toEqual(expect.arrayContaining(['semi-dropdown-divider', 'd-cls', 'd-attr']));
    expect(d.attributes('style')).toContain('margin: 1px');
    d.unmount();
    const t = mount(DropdownTitle, { props: { className: 't-cls', style: { color: 'red' } }, slots: { default: () => 'title' } });
    expect(t.classes()).toEqual(expect.arrayContaining(['semi-dropdown-title', 't-cls']));
    expect(t.text()).toBe('title');
    t.unmount();
    const m = mount(DropdownMenu, { props: { className: 'm-cls', style: { width: '10px' } }, attrs: { id: 'mm' }, slots: { default: () => h(DropdownItem, null, () => 'x') } });
    expect(m.classes()).toEqual(expect.arrayContaining(['semi-dropdown-menu', 'm-cls']));
    expect(m.attributes('id')).toBe('mm');
    expect(m.attributes('style')).toContain('width: 10px');
    m.unmount();
  });

  it('keyboard: ArrowDown/ArrowUp on trigger focus first/last item; menu arrows cycle; Enter clicks; first char jumps', async () => {
    const onClick = vi.fn();
    const wrapper = mountDd(
      { trigger: 'click' },
      {
        render: () =>
          h(DropdownMenu, null, () => [
            h(DropdownItem, { class: 'i1', onClick }, () => 'Alpha'),
            h(DropdownItem, { class: 'i2', disabled: true }, () => 'Beta'),
            h(DropdownItem, { class: 'i3' }, () => 'Gamma'),
          ]),
      }
    );
    const trigger = wrapper.find('.trigger');
    await trigger.trigger('click');
    await wait();
    expect(document.activeElement).toBe(q('.i1'));
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement).toBe(q('.i3'));
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(q('.i1'));
    // menu navigation skips the disabled item and wraps
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(q('.i3'));
    q('.i3')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(q('.i1'));
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(q('.i3'));
    // first character
    q('.i3')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(document.activeElement).toBe(q('.i1'));
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    expect(document.activeElement).toBe(q('.i3'));
    // Enter clicks the focused item
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('Enter / Space on trigger clicks it', async () => {
    const onClick = vi.fn();
    const wrapper = mountDd({ trigger: 'click' }, { default: () => h('button', { class: 'trigger', onClick }, 't') });
    await wrapper.find('.trigger').trigger('keydown', { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
    await wrapper.find('.trigger').trigger('keydown', { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('child keydown listener is preserved', async () => {
    const onKeydown = vi.fn();
    const wrapper = mountDd({}, { default: () => h('button', { class: 'trigger', onKeydown }, 't') });
    await wrapper.find('.trigger').trigger('keydown', { key: 'x' });
    expect(onKeydown).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('closeOnEsc (default true) closes and emits escKeyDown; Escape in menu with trigger=custom focuses trigger', async () => {
    const wrapper = mountDd({ trigger: 'click' });
    await wrapper.find('.trigger').trigger('click');
    await wait();
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait();
    expect(wrapper.emitted('escKeyDown')).toBeTruthy();
    expect(q('.semi-dropdown-menu')).toBeNull();
    wrapper.unmount();

    const w2 = mountDd({ trigger: 'custom', visible: true, closeOnEsc: false });
    await wait();
    q('.i1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait();
    expect(document.activeElement).toBe(w2.find('.trigger').element);
    expect(q('.semi-dropdown-menu')).toBeTruthy();
    w2.unmount();
  });

  it('click outside closes and emits clickOutSide; afterClose emitted', async () => {
    const wrapper = mountDd({ trigger: 'click' });
    await wrapper.find('.trigger').trigger('click');
    await wait();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('clickOutSide')).toBeTruthy();
    expect(wrapper.emitted('afterClose')).toBeTruthy();
    expect(q('.semi-dropdown-menu')).toBeNull();
    wrapper.unmount();
  });

  it('position / zIndex / className / contentClassName / style / getPopupContainer / rtl', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mountDd({ trigger: 'custom', visible: true, position: 'topLeft', zIndex: 3000, className: 'wrap-cls', contentClassName: ['c1', 'c2'], style: { width: '200px' }, getPopupContainer: () => container });
    await wait();
    const wrap = container.querySelector('.semi-dropdown-wrapper') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect(wrap.getAttribute('x-placement')).toBe('topLeft');
    expect(wrap.classList.contains('wrap-cls')).toBe(true);
    expect((container.querySelector('.semi-portal') as HTMLElement).style.zIndex).toBe('3000');
    const card = container.querySelector('.semi-dropdown') as HTMLElement;
    expect(card.classList.contains('c1')).toBe(true);
    expect(card.classList.contains('c2')).toBe(true);
    expect(card.style.width).toBe('200px');
    wrapper.unmount();

    const w2 = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Dropdown, { trigger: 'custom', visible: true, motion: false, render: h('div', 'x') }, () => h('button', 'trigger')) },
    });
    await wait();
    expect(q('.semi-dropdown-wrapper')!.classList.contains('semi-dropdown-rtl')).toBe(true);
    w2.unmount();
  });

  it('nested dropdown: level > 1 uses nested spacing and item click fires on mousedown', async () => {
    const innerClick = vi.fn();
    const wrapper = mountDd(
      { trigger: 'custom', visible: true, spacing: 20 },
      {
        render: () =>
          h(DropdownMenu, null, () => [
            h(
              Dropdown,
              { trigger: 'custom', visible: true, motion: false, position: 'rightTop' },
              {
                default: () => h(DropdownItem, { class: 'outer' }, () => 'Outer'),
                render: () => h(DropdownMenu, null, () => [h(DropdownItem, { class: 'inner', onClick: innerClick }, () => 'Inner')]),
              }
            ),
          ]),
      }
    );
    await wait();
    expect(q('.inner')).toBeTruthy();
    q('.inner')!.click();
    expect(innerClick).not.toHaveBeenCalled();
    q('.inner')!.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    expect(innerClick).toHaveBeenCalledTimes(1);
    q('.inner')!.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
    expect(innerClick).toHaveBeenCalledTimes(1);
    expect(qa('.semi-dropdown-wrapper')).toHaveLength(2);
    wrapper.unmount();
  });

  it('exposes focusTrigger / rePosition / getPopupId / foundation; static sub components', async () => {
    const wrapper = mountDd({ trigger: 'click' });
    expect(typeof (wrapper.vm as any).focusTrigger).toBe('function');
    expect(typeof (wrapper.vm as any).rePosition).toBe('function');
    expect((wrapper.vm as any).foundation).toBeTruthy();
    expect(wrapper.find('.trigger').attributes('data-popupid')).toBe((wrapper.vm as any).getPopupId());
    wrapper.unmount();
    expect(Dropdown.Menu).toBe(DropdownMenu);
    expect(Dropdown.Item).toBe(DropdownItem);
    expect(Dropdown.Divider).toBe(DropdownDivider);
    expect(Dropdown.Title).toBe(DropdownTitle);
  });

  it('motion: animation class applied and removed after animationend', async () => {
    const wrapper = mountDd({ trigger: 'custom', visible: true, motion: true });
    await wait();
    const wrap = q('.semi-dropdown-wrapper')!;
    expect(wrap.classList.contains('semi-tooltip-animation-show')).toBe(true);
    wrap.dispatchEvent(new Event('animationend'));
    await wait();
    await wrapper.setProps({ visible: false });
    await wait();
    const wrap2 = q('.semi-dropdown-wrapper')!;
    expect(wrap2.classList.contains('semi-tooltip-animation-hide')).toBe(true);
    wrap2.dispatchEvent(new Event('animationend'));
    await wait();
    expect(q('.semi-dropdown-wrapper')).toBeNull();
    wrapper.unmount();
  });
  it('Tooltip pass-through props: keepDOM / clickToHide / stopPropagation / mouseLeaveDelay default / render slot precedence', async () => {
    // keepDOM keeps the popup DOM (display none) after close
    const w = mountDd({ trigger: 'custom', visible: true, keepDOM: true });
    await wait();
    expect(q('.semi-dropdown-wrapper')).toBeTruthy();
    await w.setProps({ visible: false });
    await wait(200);
    expect(q('.semi-dropdown-wrapper')).toBeTruthy();
    w.unmount();

    // default mouseLeaveDelay is the dropdown one (100), not the tooltip one
    expect((dropdownProps as any).mouseLeaveDelay.default).toBe(100);
    expect((dropdownProps as any).closeOnEsc.default).toBe(true);

    // clickToHide: clicking inside popup closes it
    const onVisibleChange = vi.fn();
    const w2 = mountDd({ trigger: 'click', clickToHide: true, onVisibleChange });
    await w2.find('.trigger').trigger('click');
    await wait();
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    q('.i1')!.click();
    await wait();
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    w2.unmount();

    // stopPropagation: click inside popup does not reach document listeners
    const docClick = vi.fn();
    document.addEventListener('click', docClick);
    const w3 = mountDd({ trigger: 'custom', visible: true, stopPropagation: true });
    await wait();
    q('.i1')!.click();
    expect(docClick).not.toHaveBeenCalled();
    document.removeEventListener('click', docClick);
    w3.unmount();

    // render slot wins over render prop and menu prop
    const w4 = mountDd(
      { trigger: 'custom', visible: true, render: h('div', { class: 'r-prop' }), menu: [{ node: 'item', name: 'x' }] },
      { render: () => h('div', { class: 'r-slot' }) }
    );
    await wait();
    expect(q('.r-slot')).toBeTruthy();
    expect(q('.r-prop')).toBeNull();
    expect(q('.semi-dropdown-menu')).toBeNull();
    w4.unmount();
  });
});
