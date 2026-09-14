import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent, ref } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Popconfirm from './index';
import ConfigProvider from '../configProvider';
import { LocaleProvider } from '../locale';
import en_GB from '../locale/source/en_GB';
import { IconClose } from '../icons/generated';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

function mountPop(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Popconfirm, {
    attachTo: document.body,
    props: { motion: false, title: 'Sure?', content: 'desc', ...props },
    slots: { default: () => h('button', { class: 'trigger' }, 'trigger'), ...slots },
  });
}

describe('Popconfirm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('data-position');
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens on click (default trigger) and renders card structure with default icon, title, content, footer buttons', async () => {
    const wrapper = mountPop();
    await wait();
    expect(q('.semi-popconfirm')).toBeNull();
    await wrapper.find('.trigger').trigger('click');
    await wait();
    const card = q('.semi-popconfirm')!;
    expect(card).toBeTruthy();
    expect(q('.semi-popover-wrapper')!.classList.contains('semi-popconfirm-popover')).toBe(true);
    expect(q('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('bottomLeft');
    expect((q('.semi-portal') as HTMLElement).style.zIndex).toBe('1030');
    expect(card.querySelector('.semi-popconfirm-inner')).toBeTruthy();
    expect(card.querySelector('.semi-popconfirm-header-icon .semi-icon-alert_triangle.semi-icon-extra-large')).toBeTruthy();
    expect(card.querySelector('.semi-popconfirm-header-title')!.textContent).toBe('Sure?');
    expect(card.querySelector('.semi-popconfirm-body')!.textContent).toBe('desc');
    expect(card.querySelector('.semi-popconfirm-body')!.classList.contains('semi-popconfirm-body-withIcon')).toBe(true);
    expect(card.querySelector('.semi-popconfirm-btn-close .semi-icon-close')).toBeTruthy();
    const btns = Array.from(card.querySelectorAll('.semi-popconfirm-footer button')) as HTMLElement[];
    expect(btns).toHaveLength(2);
    expect(btns[0].getAttribute('data-type')).toBe('cancel');
    expect(btns[0].textContent).toBe('取消');
    expect(btns[0].classList.contains('semi-button-tertiary')).toBe(true);
    expect(btns[1].getAttribute('data-type')).toBe('ok');
    expect(btns[1].textContent).toBe('确定');
    expect(btns[1].classList.contains('semi-button-primary')).toBe(true);
    expect(btns[1].classList.contains('semi-button-solid')).toBe(true);
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    wrapper.unmount();
  });

  it('locale from LocaleProvider / ConfigProvider', async () => {
    const w = mount(LocaleProvider, {
      attachTo: document.body,
      props: { locale: en_GB as any },
      slots: { default: () => h(Popconfirm, { title: 't', motion: false, defaultVisible: true }, () => h('button', 'trigger')) },
    });
    await wait();
    const btns = qa('.semi-popconfirm-footer button');
    expect(btns[0].textContent).toBe('Cancel');
    expect(btns[1].textContent).toBe('Confirm');
    w.unmount();
    document.body.innerHTML = '';
    const w2 = mount(ConfigProvider, {
      attachTo: document.body,
      props: { locale: en_GB as any },
      slots: { default: () => h(Popconfirm, { title: 't', motion: false, defaultVisible: true }, () => h('button', 'trigger')) },
    });
    await wait();
    expect(qa('.semi-popconfirm-footer button')[1].textContent).toBe('Confirm');
    w2.unmount();
  });

  it('okText / cancelText / okType / cancelType / okButtonProps / cancelButtonProps', async () => {
    const wrapper = mountPop({ defaultVisible: true, okText: 'Yes', cancelText: 'No', okType: 'danger', cancelType: 'secondary', okButtonProps: { disabled: true, class: 'ok-cls', autoFocus: true }, cancelButtonProps: { size: 'small' } });
    await wait();
    const btns = qa('.semi-popconfirm-footer button');
    expect(btns[0].textContent).toBe('No');
    expect(btns[0].classList.contains('semi-button-secondary')).toBe(true);
    expect(btns[0].classList.contains('semi-button-size-small')).toBe(true);
    expect(btns[1].textContent).toBe('Yes');
    expect(btns[1].classList.contains('ok-cls')).toBe(true);
    expect(btns[1].classList.contains('semi-button-danger-disabled')).toBe(true);
    expect(btns[1].hasAttribute('autofocus')).toBe(false);
    // close icon button uses cancelType
    expect(q('.semi-popconfirm-btn-close')!.classList.contains('semi-button-secondary')).toBe(true);
    wrapper.unmount();
  });

  it('onConfirm / onCancel (+ emits) close the popup; promise return shows loading until resolved', async () => {
    let resolveOk: () => void = () => undefined;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolveOk = r)));
    const onCancel = vi.fn();
    const wrapper = mountPop({ defaultVisible: true, onConfirm, onCancel });
    await wait();
    qa('.semi-popconfirm-footer button')[1].click();
    await wait(20);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(qa('.semi-popconfirm-footer button')[1].classList.contains('semi-button-loading')).toBe(true);
    expect(q('.semi-popconfirm')).toBeTruthy();
    resolveOk();
    await wait();
    expect(q('.semi-popconfirm')).toBeNull();
    expect(wrapper.emitted('visibleChange')!.at(-1)).toEqual([false]);
    expect(wrapper.emitted('update:visible')!.at(-1)).toEqual([false]);

    await wrapper.find('.trigger').trigger('click');
    await wait();
    expect(q('.semi-popconfirm')).toBeTruthy();
    qa('.semi-popconfirm-footer button')[0].click();
    await wait();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();
  });

  it('rejected onCancel promise keeps the popup open and resets loading', async () => {
    const onCancel = vi.fn(() => Promise.reject(new Error('x')));
    const wrapper = mountPop({ defaultVisible: true, onCancel });
    await wait();
    qa('.semi-popconfirm-footer button')[0].click();
    await wait(20);
    expect(q('.semi-popconfirm')).toBeTruthy();
    expect(qa('.semi-popconfirm-footer button')[0].classList.contains('semi-button-loading')).toBe(false);
    wrapper.unmount();
  });

  it('close icon button cancels; showCloseIcon=false hides it', async () => {
    const onCancel = vi.fn();
    const wrapper = mountPop({ defaultVisible: true, onCancel });
    await wait();
    q('.semi-popconfirm-btn-close')!.click();
    await wait();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();
    const w2 = mountPop({ defaultVisible: true, showCloseIcon: false });
    await wait();
    expect(q('.semi-popconfirm-btn-close')).toBeNull();
    w2.unmount();
  });

  it('controlled visible (trigger becomes custom) + v-model:visible', async () => {
    const wrapper = mountPop({ visible: false });
    await wrapper.find('.trigger').trigger('click');
    await wait();
    expect(q('.semi-popconfirm')).toBeNull();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(q('.semi-popconfirm')).toBeTruthy();
    qa('.semi-popconfirm-footer button')[1].click();
    await wait();
    // still visible: controlled
    expect(q('.semi-popconfirm')).toBeTruthy();
    expect(wrapper.emitted('update:visible')!.at(-1)).toEqual([false]);
    await wrapper.setProps({ visible: false });
    await wait();
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();

    const Parent = defineComponent({
      setup() {
        const visible = ref(true);
        return () => h('div', [h('span', { class: 'state' }, String(visible.value)), h(Popconfirm, { visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v), motion: false, title: 't' }, () => h('button', 'trigger'))]);
      },
    });
    const w2 = mount(Parent, { attachTo: document.body });
    await wait();
    expect(q('.semi-popconfirm')).toBeTruthy();
    qa('.semi-popconfirm-footer button')[0].click();
    await wait();
    expect(w2.find('.state').text()).toBe('false');
    expect(q('.semi-popconfirm')).toBeNull();
    w2.unmount();
  });

  it('defaultVisible opens initially', async () => {
    const wrapper = mountPop({ defaultVisible: true });
    await wait();
    expect(q('.semi-popconfirm')).toBeTruthy();
    wrapper.unmount();
  });

  it('title / content / icon as props (VNode, render fn) and as slots; icon=null removes icon', async () => {
    const contentFn = vi.fn(() => h('em', 'fn content'));
    const wrapper = mountPop({ defaultVisible: true, title: h('b', 'vt'), content: contentFn, icon: h(IconClose) });
    await wait();
    expect(q('.semi-popconfirm-header-title b')!.textContent).toBe('vt');
    expect(q('.semi-popconfirm-body em')!.textContent).toBe('fn content');
    expect((contentFn.mock.calls[0] as any)[0]).toHaveProperty('initialFocusRef');
    expect(q('.semi-popconfirm-header-icon .semi-icon-close')).toBeTruthy();
    wrapper.unmount();

    const w2 = mountPop({ defaultVisible: true, title: undefined, content: undefined }, { title: () => h('i', 'st'), content: () => h('u', 'sc'), icon: () => h('span', { class: 's-icon' }) });
    await wait();
    expect(q('.semi-popconfirm-header-title i')!.textContent).toBe('st');
    expect(q('.semi-popconfirm-body u')!.textContent).toBe('sc');
    expect(q('.semi-popconfirm-header-icon .s-icon')).toBeTruthy();
    w2.unmount();

    const w3 = mountPop({ defaultVisible: true, icon: null, content: undefined });
    await wait();
    expect(q('.semi-popconfirm-header-icon')).toBeNull();
    expect(q('.semi-popconfirm-body')).toBeNull();
    w3.unmount();
  });

  it('className / style / prefixCls / zIndex / position', async () => {
    const wrapper = mountPop({ defaultVisible: true, className: 'my-pc', style: { width: '300px' }, zIndex: 2000, position: 'top' });
    await wait();
    const card = q('.semi-popconfirm')!;
    expect(card.classList.contains('my-pc')).toBe(true);
    expect(card.style.width).toBe('300px');
    expect((q('.semi-portal') as HTMLElement).style.zIndex).toBe('2000');
    expect(q('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('top');
    wrapper.unmount();
  });

  it('disabled renders only the children', async () => {
    const wrapper = mountPop({ disabled: true });
    expect(wrapper.find('.trigger').exists()).toBe(true);
    expect(wrapper.find('.trigger').attributes('data-popupid')).toBeUndefined();
    await wrapper.find('.trigger').trigger('click');
    await wait();
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();
  });

  it('click outside closes and emits clickOutSide', async () => {
    const wrapper = mountPop({ defaultVisible: true });
    await wait();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('clickOutSide')).toBeTruthy();
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();
  });

  it('trigger hover works when passed', async () => {
    const wrapper = mountPop({ trigger: 'hover', mouseEnterDelay: 0, mouseLeaveDelay: 0 });
    await wrapper.find('.trigger').trigger('mouseenter');
    await wait();
    expect(q('.semi-popconfirm')).toBeTruthy();
    wrapper.unmount();
  });

  it('rtl: default position bottomRight and rtl class', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Popconfirm, { title: 't', motion: false, defaultVisible: true }, () => h('button', 'trigger')) },
    });
    await wait();
    expect(q('.semi-popconfirm')!.classList.contains('semi-popconfirm-rtl')).toBe(true);
    expect(q('.semi-popover-wrapper')!.getAttribute('x-placement')).toBe('bottomRight');
    w.unmount();
  });

  it('autoFocus button props focus cancel/ok button on open', async () => {
    const wrapper = mountPop({ cancelButtonProps: { autoFocus: true } });
    await wrapper.find('.trigger').trigger('click');
    await wait();
    expect(document.activeElement).toBe(q('[data-type=cancel]'));
    wrapper.unmount();
    const w2 = mountPop({ okButtonProps: { autoFocus: true } });
    await w2.find('.trigger').trigger('click');
    await wait();
    expect(document.activeElement).toBe(q('[data-type=ok]'));
    w2.unmount();
  });

  it('escKeyDown emit; closeOnEsc closes', async () => {
    const wrapper = mountPop({ defaultVisible: true });
    await wait();
    q('.semi-popconfirm')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait();
    expect(wrapper.emitted('escKeyDown')).toBeTruthy();
    expect(q('.semi-popconfirm')).toBeNull();
    wrapper.unmount();
  });

  it('exposes focusTrigger / rePosition / foundation', () => {
    const wrapper = mountPop();
    expect(typeof (wrapper.vm as any).focusTrigger).toBe('function');
    expect(typeof (wrapper.vm as any).rePosition).toBe('function');
    expect((wrapper.vm as any).foundation).toBeTruthy();
    wrapper.unmount();
  });

  it('afterClose emitted after hide', async () => {
    const wrapper = mountPop({ defaultVisible: true });
    await wait();
    qa('.semi-popconfirm-footer button')[0].click();
    await wait();
    expect(wrapper.emitted('afterClose')).toBeTruthy();
    wrapper.unmount();
  });
});
