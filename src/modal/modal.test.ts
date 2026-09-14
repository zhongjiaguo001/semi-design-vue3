import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent, ref } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Modal, { useModal, destroyFns } from './index';
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

function mountModal(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Modal, {
    attachTo: document.body,
    props: { motion: false, ...props },
    slots: { default: () => h('p', { class: 'body-text' }, 'modal body'), ...slots },
  });
}

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
  });
  afterEach(() => {
    Modal.destroyAll();
    document.body.innerHTML = '';
  });

  it('renders nothing when visible=false, renders dialog structure when visible', async () => {
    const wrapper = mountModal({ visible: false, title: 'T' });
    await wait();
    expect(q('.semi-modal')).toBeNull();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(q('.semi-portal')).toBeTruthy();
    expect(q('.semi-modal-mask')).toBeTruthy();
    expect(q('.semi-modal-wrap')).toBeTruthy();
    const dialog = q('.semi-modal')!;
    expect(dialog.classList.contains('semi-modal-small')).toBe(true);
    expect(dialog.getAttribute('id')).toMatch(/^dialog-/);
    const content = q('.semi-modal-content')!;
    expect(content.getAttribute('role')).toBe('dialog');
    expect(content.getAttribute('aria-modal')).toBe('true');
    expect(content.getAttribute('aria-labelledby')).toBe('semi-modal-title');
    expect(q('.semi-modal-header')).toBeTruthy();
    expect(q('.semi-modal-title')!.textContent).toBe('T');
    expect(q('.semi-modal-body')!.textContent).toBe('modal body');
    expect(q('.semi-modal-body')!.getAttribute('x-semi-prop')).toBe('children');
    expect(q('.semi-modal-footer')).toBeTruthy();
    expect((q('.semi-portal') as HTMLElement).style.zIndex).toBe('1000');
    wrapper.unmount();
  });

  it('default footer renders cancel + ok buttons with zh_CN locale text', async () => {
    const wrapper = mountModal({ visible: true, title: 'T' });
    await wait();
    const btns = qa('.semi-modal-footer button');
    expect(btns).toHaveLength(2);
    expect(btns[0].getAttribute('aria-label')).toBe('cancel');
    expect(btns[0].textContent).toBe('取消');
    expect(btns[0].classList.contains('semi-button-tertiary')).toBe(true);
    expect(btns[1].getAttribute('aria-label')).toBe('confirm');
    expect(btns[1].textContent).toBe('确定');
    expect(btns[1].classList.contains('semi-button-primary')).toBe(true);
    expect(btns[1].classList.contains('semi-button-solid')).toBe(true);
    wrapper.unmount();
  });

  it('uses locale from LocaleProvider / ConfigProvider', async () => {
    const w = mount(LocaleProvider, {
      attachTo: document.body,
      props: { locale: en_GB as any },
      slots: { default: () => h(Modal, { visible: true, motion: false, title: 'T' }, () => 'x') },
    });
    await wait();
    const btns = qa('.semi-modal-footer button');
    expect(btns[0].textContent).toBe('Cancel');
    expect(btns[1].textContent).toBe('Confirm');
    w.unmount();
    document.body.innerHTML = '';
    const w2 = mount(ConfigProvider, {
      attachTo: document.body,
      props: { locale: en_GB as any },
      slots: { default: () => h(Modal, { visible: true, motion: false, title: 'T' }, () => 'x') },
    });
    await wait();
    expect(qa('.semi-modal-footer button')[1].textContent).toBe('Confirm');
    w2.unmount();
  });

  it('okText / cancelText / okType / okButtonProps / cancelButtonProps / hasCancel', async () => {
    const wrapper = mountModal({
      visible: true,
      title: 'T',
      okText: 'Go',
      cancelText: 'Nope',
      okType: 'danger',
      okButtonProps: { disabled: true, class: 'ok-cls' },
      cancelButtonProps: { size: 'small', style: { color: 'red' } },
    });
    await wait();
    const btns = qa('.semi-modal-footer button');
    expect(btns[0].textContent).toBe('Nope');
    expect(btns[0].classList.contains('semi-button-size-small')).toBe(true);
    expect(btns[0].style.color).toBe('red');
    expect(btns[1].textContent).toBe('Go');
    expect(btns[1].classList.contains('semi-button-danger-disabled')).toBe(true);
    expect(btns[1].classList.contains('ok-cls')).toBe(true);
    expect((btns[1] as HTMLButtonElement).disabled).toBe(true);
    await wrapper.setProps({ hasCancel: false });
    await wait();
    expect(qa('.semi-modal-footer button')).toHaveLength(1);
    wrapper.unmount();
  });

  it('confirmLoading / cancelLoading show loading buttons', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', confirmLoading: true, cancelLoading: true });
    await wait();
    const btns = qa('.semi-modal-footer button');
    expect(btns[0].classList.contains('semi-button-loading')).toBe(true);
    expect(btns[1].classList.contains('semi-button-loading')).toBe(true);
    wrapper.unmount();
  });

  it('onOk / onCancel callbacks and update:visible emit; promise return sets loading', async () => {
    let resolveOk: () => void = () => undefined;
    const onOk = vi.fn(() => new Promise<void>((r) => (resolveOk = r)));
    const onCancel = vi.fn();
    const wrapper = mountModal({ visible: true, title: 'T', onOk, onCancel });
    await wait();
    const btns = qa('.semi-modal-footer button');
    btns[1].click();
    await wait(20);
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-loading')).toBe(true);
    expect(wrapper.emitted('update:visible')).toBeUndefined();
    resolveOk();
    await wait(20);
    expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-loading')).toBe(false);
    expect(wrapper.emitted('update:visible')![0]).toEqual([false]);

    qa('.semi-modal-footer button')[0].click();
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:visible')).toHaveLength(2);
    wrapper.unmount();
  });

  it('rejected onOk promise resets loading without closing', async () => {
    const onOk = vi.fn(() => Promise.reject(new Error('no')));
    const wrapper = mountModal({ visible: true, title: 'T', onOk });
    await wait();
    qa('.semi-modal-footer button')[1].click();
    await wait(20);
    expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-loading')).toBe(false);
    expect(wrapper.emitted('update:visible')).toBeUndefined();
    wrapper.unmount();
  });

  it('v-model:visible works through a parent component', async () => {
    const Parent = defineComponent({
      setup() {
        const visible = ref(true);
        return () => h('div', [h('span', { class: 'state' }, String(visible.value)), h(Modal, { visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v), motion: false, title: 'T' }, () => 'body')]);
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wait();
    expect(q('.semi-modal')).toBeTruthy();
    qa('.semi-modal-footer button')[0].click();
    await wait(20);
    expect(wrapper.find('.state').text()).toBe('false');
    expect(q('.semi-modal')).toBeNull();
    wrapper.unmount();
  });

  it('close button (closable) calls onCancel; closable=false removes it; closeIcon prop and slot', async () => {
    const onCancel = vi.fn();
    const wrapper = mountModal({ visible: true, title: 'T', onCancel });
    await wait();
    const closeBtn = q('.semi-modal-close')!;
    expect(closeBtn.getAttribute('aria-label')).toBe('close');
    expect(closeBtn.querySelector('.semi-icon-close')).toBeTruthy();
    closeBtn.click();
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ closable: false });
    await wait();
    expect(q('.semi-modal-close')).toBeNull();
    await wrapper.setProps({ closable: true, closeIcon: h('i', { class: 'custom-close' }) });
    await wait();
    expect(q('.semi-modal-close .custom-close')).toBeTruthy();
    wrapper.unmount();

    const w2 = mountModal({ visible: true, title: 'T' }, { closeIcon: () => h('b', { class: 'slot-close' }) });
    await wait();
    expect(q('.semi-modal-close .slot-close')).toBeTruthy();
    w2.unmount();
  });

  it('mask click closes when maskClosable; not when mousedown started in the dialog; maskClosable=false', async () => {
    const onCancel = vi.fn();
    const wrapper = mountModal({ visible: true, title: 'T', onCancel });
    await wait();
    const wrap = q('.semi-modal-wrap')!;
    // mousedown inside dialog then click on wrap => no close
    q('.semi-modal')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    wrap.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    wrap.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await wait(20);
    expect(onCancel).not.toHaveBeenCalled();
    // plain click on the wrap => close
    wrap.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    // clicking the dialog itself (target !== currentTarget) => no close
    q('.semi-modal-content')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(150);
    expect(onCancel).toHaveBeenCalledTimes(1);
    wrapper.unmount();

    const onCancel2 = vi.fn();
    const w2 = mountModal({ visible: true, title: 'T', onCancel: onCancel2, maskClosable: false });
    await wait();
    q('.semi-modal-wrap')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(20);
    expect(onCancel2).not.toHaveBeenCalled();
    w2.unmount();
  });

  it('mask=false hides mask; maskStyle applied', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', maskStyle: { backgroundColor: 'blue' } });
    await wait();
    expect(q('.semi-modal-mask')!.style.backgroundColor).toBe('blue');
    await wrapper.setProps({ mask: false });
    await wait();
    expect(q('.semi-modal-mask')).toBeNull();
    wrapper.unmount();
  });

  it('closeOnEsc closes on Escape keydown; closeOnEsc=false ignores', async () => {
    const onCancel = vi.fn();
    const wrapper = mountModal({ visible: true, title: 'T', onCancel });
    await wait();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 } as any));
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    wrapper.unmount();

    const onCancel2 = vi.fn();
    const w2 = mountModal({ visible: true, title: 'T', onCancel: onCancel2, closeOnEsc: false });
    await wait();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 } as any));
    await wait(20);
    expect(onCancel2).not.toHaveBeenCalled();
    w2.unmount();
  });

  it('centered / size / width / height / style / bodyStyle / className / modalContentClass', async () => {
    const wrapper = mountModal({
      visible: true,
      title: 'T',
      centered: true,
      size: 'large',
      width: 500,
      height: '300px',
      style: { top: '10px' },
      bodyStyle: { padding: '0px' },
      className: 'my-modal',
      modalContentClass: 'my-content',
    });
    await wait();
    const dialog = q('.semi-modal')!;
    expect(dialog.classList.contains('semi-modal-centered')).toBe(true);
    expect(dialog.classList.contains('semi-modal-large')).toBe(true);
    expect(dialog.style.width).toBe('500px');
    expect(dialog.style.height).toBe('300px');
    expect(dialog.style.top).toBe('10px');
    expect(q('.semi-modal-wrap')!.classList.contains('semi-modal-wrap-center')).toBe(true);
    expect(q('.semi-modal-content')!.classList.contains('semi-modal-content-height-set')).toBe(true);
    expect(q('.semi-modal-content')!.classList.contains('my-content')).toBe(true);
    expect(q('.semi-modal-body')!.style.padding).toBe('0px');
    expect(q('.my-modal')).toBeTruthy();
    expect(q('.my-modal .semi-modal-mask')).toBeTruthy();
    wrapper.unmount();
  });

  it('attrs class and data-* attributes are forwarded', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', class: 'attr-cls', 'data-test': 'yes' });
    await wait();
    const root = q('.attr-cls')!;
    expect(root).toBeTruthy();
    expect(root.getAttribute('data-test')).toBe('yes');
    wrapper.unmount();
  });

  it('fullScreen sets full size styles and reacts to prop changes', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', fullScreen: true });
    await wait();
    const dialog = q('.semi-modal')!;
    expect(dialog.style.width).toBe('100%');
    expect(dialog.style.height).toBe('100%');
    expect(q('.semi-modal-content')!.classList.contains('semi-modal-content-fullScreen')).toBe(true);
    await wrapper.setProps({ fullScreen: false });
    await wait();
    expect(q('.semi-modal-content')!.classList.contains('semi-modal-content-fullScreen')).toBe(false);
    wrapper.unmount();
  });

  it('title/icon/header/footer as props and as slots', async () => {
    const wrapper = mountModal({ visible: true, title: h('b', 'ptitle'), icon: h('i', { class: 'p-icon' }), footer: h('button', { class: 'p-footer' }, 'f') });
    await wait();
    expect(q('.semi-modal-title b')!.textContent).toBe('ptitle');
    expect(q('.semi-modal-icon-wrapper .p-icon')).toBeTruthy();
    expect(q('.semi-modal-body')!.classList.contains('semi-modal-withIcon')).toBe(true);
    expect(q('.semi-modal-footer .p-footer')).toBeTruthy();
    expect(qa('.semi-modal-footer button')).toHaveLength(1);
    wrapper.unmount();

    const w2 = mountModal(
      { visible: true },
      {
        title: () => h('em', 'stitle'),
        icon: () => h('i', { class: 's-icon' }),
        footer: () => h('div', { class: 's-footer' }),
        header: () => h('div', { class: 's-header' }, 'custom header'),
      }
    );
    await wait();
    expect(q('.s-header')).toBeTruthy();
    expect(q('.semi-modal-header')).toBeNull();
    expect(q('.semi-modal-footer .s-footer')).toBeTruthy();
    w2.unmount();

    const w3 = mountModal({ visible: true }, { title: () => h('em', 'stitle'), icon: () => h('i', { class: 's-icon' }) });
    await wait();
    expect(q('.semi-modal-title em')!.textContent).toBe('stitle');
    expect(q('.semi-modal-icon-wrapper .s-icon')).toBeTruthy();
    w3.unmount();
  });

  it('header prop replaces the default header; footer=null removes footer', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', header: h('div', { class: 'p-header' }), footer: null });
    await wait();
    expect(q('.p-header')).toBeTruthy();
    expect(q('.semi-modal-header')).toBeNull();
    expect(q('.semi-modal-footer')).toBeNull();
    // body still uses the "with header" layout
    expect(q('#semi-modal-body')).toBeTruthy();
    wrapper.unmount();
  });

  it('no title: renders body-wrapper layout with icon and close button', async () => {
    const wrapper = mountModal({ visible: true, icon: h('i', { class: 'p-icon' }) });
    await wait();
    expect(q('.semi-modal-header')).toBeNull();
    const bw = q('.semi-modal-body-wrapper')!;
    expect(bw).toBeTruthy();
    expect(bw.querySelector('.semi-modal-icon-wrapper .p-icon')).toBeTruthy();
    expect(bw.querySelector('.semi-modal-close')).toBeTruthy();
    wrapper.unmount();
  });

  it('footerFill renders block buttons', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', footerFill: true });
    await wait();
    expect(q('.semi-modal-footerfill')).toBeTruthy();
    const btns = qa('.semi-modal-footer button');
    expect(btns[0].classList.contains('semi-button-block')).toBe(true);
    expect(btns[0].style.marginLeft).toBe('unset');
    expect(btns[1].classList.contains('semi-button-block')).toBe(true);
    wrapper.unmount();
  });

  it('afterClose prop and emit fire when hidden', async () => {
    const afterClose = vi.fn();
    const wrapper = mountModal({ visible: true, title: 'T', afterClose });
    await wait();
    await wrapper.setProps({ visible: false });
    await wait();
    expect(afterClose).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('afterClose')).toHaveLength(1);
    expect(q('.semi-modal')).toBeNull();
    wrapper.unmount();
  });

  it('disables body scroll while visible and restores it after hide', async () => {
    const wrapper = mountModal({ visible: true, title: 'T' });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    await wrapper.setProps({ visible: false });
    await wait();
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
  });

  it('unmount while visible restores body scroll', async () => {
    const wrapper = mountModal({ visible: true, title: 'T' });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    wrapper.unmount();
    await wait();
    expect(document.body.style.overflow).toBe('');
    expect(q('.semi-portal')).toBeNull();
  });

  it('keepDOM keeps content mounted with displayNone class; lazyRender=false renders before first show', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', keepDOM: true });
    await wait();
    await wrapper.setProps({ visible: false });
    await wait();
    expect(q('.semi-modal')).toBeTruthy();
    expect(q('.semi-modal-displayNone')).toBeTruthy();
    wrapper.unmount();

    const w2 = mountModal({ visible: false, title: 'T', keepDOM: true, lazyRender: false });
    await wait();
    expect(q('.semi-modal')).toBeTruthy();
    expect(q('.semi-modal-displayNone')).toBeTruthy();
    w2.unmount();

    const w3 = mountModal({ visible: false, title: 'T', keepDOM: true, lazyRender: true });
    await wait();
    expect(q('.semi-modal')).toBeNull();
    w3.unmount();
  });

  it('zIndex / getPopupContainer / maskFixed', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mountModal({ visible: true, title: 'T', zIndex: 2000, getPopupContainer: () => container });
    await wait();
    const portal = container.querySelector('.semi-portal') as HTMLElement;
    expect(portal).toBeTruthy();
    expect(portal.style.zIndex).toBe('2000');
    expect(portal.style.position).toBe('static');
    expect(container.querySelector('.semi-modal-popup')).toBeTruthy();
    // body scroll untouched when container is not body
    expect(document.body.style.overflow).toBe('');
    await wrapper.setProps({ maskFixed: true });
    await wait();
    expect(container.querySelector('.semi-modal-popup')).toBeNull();
    expect(container.querySelector('.semi-modal-fixed')).toBeTruthy();
    wrapper.unmount();
  });

  it('direction=rtl (prop and ConfigProvider) adds rtl class', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', direction: 'rtl' });
    await wait();
    expect(q('.semi-modal-rtl')).toBeTruthy();
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Modal, { visible: true, motion: false, title: 'T' }, () => 'x') },
    });
    await wait();
    expect(q('.semi-modal-rtl')).toBeTruthy();
    w2.unmount();
  });

  it('modalRender wraps the content element', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', modalRender: (node: any) => h('div', { class: 'render-wrap' }, [node]) });
    await wait();
    expect(q('.semi-modal > .render-wrap > .semi-modal-content')).toBeTruthy();
    wrapper.unmount();
  });

  it('focuses the first focusable element and restores focus on close', async () => {
    const outer = document.createElement('button');
    outer.id = 'outer';
    document.body.appendChild(outer);
    outer.focus();
    expect(document.activeElement).toBe(outer);
    const wrapper = mountModal({ visible: true, title: 'T' });
    await wait();
    expect(q('.semi-modal-content')!.contains(document.activeElement)).toBe(true);
    await wrapper.setProps({ visible: false });
    await wait();
    expect(document.activeElement).toBe(outer);
    wrapper.unmount();
  });

  it('motion: applies animation classes and unmounts after animationend', async () => {
    const wrapper = mountModal({ visible: true, title: 'T', motion: true });
    await wait();
    const content = q('.semi-modal-content')!;
    expect(content.classList.contains('semi-modal-content-animate-show')).toBe(true);
    expect(q('.semi-modal-mask')!.classList.contains('semi-modal-mask-animate-show')).toBe(true);
    await wrapper.setProps({ visible: false });
    await wait();
    const wrap = q('.semi-modal-wrap')!;
    expect(q('.semi-modal-content')!.classList.contains('semi-modal-content-animate-hide')).toBe(true);
    expect(q('.semi-modal')).toBeTruthy();
    wrap.dispatchEvent(new Event('animationend'));
    q('.semi-modal-mask')!.dispatchEvent(new Event('animationend'));
    await wait();
    expect(q('.semi-modal')).toBeNull();
    expect(wrapper.emitted('afterClose')).toHaveLength(1);
    wrapper.unmount();
  });

  it('exposes foundation', () => {
    const wrapper = mountModal({ visible: false });
    expect((wrapper.vm as any).foundation).toBeTruthy();
    wrapper.unmount();
  });

  describe('static API', () => {
    it('Modal.info renders a confirm modal with icon/title/content and destroy() closes it', async () => {
      const afterClose = vi.fn();
      const handle = Modal.info({ title: 'Info title', content: 'Info content', motion: false, afterClose });
      await wait();
      const dialog = q('.semi-modal-confirm')!;
      expect(dialog).toBeTruthy();
      expect(q('.semi-modal-confirm-title-text')!.textContent).toBe('Info title');
      expect(q('.semi-modal-confirm-content')!.textContent).toBe('Info content');
      expect(q('.semi-modal-confirm-content-withIcon')).toBeTruthy();
      const icon = q('.semi-modal-confirm-icon')!;
      expect(icon.classList.contains('semi-modal-info-icon')).toBe(true);
      expect(icon.classList.contains('semi-icon-extra-large')).toBe(true);
      expect(icon.classList.contains('semi-icon-info_circle')).toBe(true);
      expect(destroyFns.length).toBe(1);
      handle.destroy();
      await wait();
      expect(q('.semi-modal')).toBeNull();
      expect(afterClose).toHaveBeenCalledTimes(1);
      expect(destroyFns.length).toBe(0);
    });

    it('success / warning / error / confirm use their type icons; error ok button is danger', async () => {
      Modal.success({ title: 's', motion: false });
      await wait();
      expect(q('.semi-modal-success-icon.semi-icon-tick_circle')).toBeTruthy();
      Modal.destroyAll();
      await wait();
      Modal.warning({ title: 'w', motion: false });
      await wait();
      expect(q('.semi-modal-warning-icon.semi-icon-alert_triangle')).toBeTruthy();
      Modal.destroyAll();
      await wait();
      Modal.error({ title: 'e', motion: false });
      await wait();
      expect(q('.semi-modal-error-icon.semi-icon-alert_circle')).toBeTruthy();
      expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-danger')).toBe(true);
      Modal.destroyAll();
      await wait();
      Modal.confirm({ title: 'c', motion: false });
      await wait();
      expect(q('.semi-modal-confirm-icon.semi-icon-help_circle')).toBeTruthy();
      Modal.destroyAll();
      await wait();
      expect(q('.semi-modal')).toBeNull();
    });

    it('update() merges config; ok click closes; promise onOk keeps it open until resolved', async () => {
      let resolveOk: () => void = () => undefined;
      const onOk = vi.fn(() => new Promise<void>((r) => (resolveOk = r)));
      const handle = Modal.confirm({ title: 'a', content: 'b', motion: false, onOk });
      await wait();
      handle.update({ title: 'updated', content: 'new content' });
      await wait();
      expect(q('.semi-modal-confirm-title-text')!.textContent).toBe('updated');
      expect(q('.semi-modal-confirm-content')!.textContent).toBe('new content');
      qa('.semi-modal-footer button')[1].click();
      await wait(20);
      expect(onOk).toHaveBeenCalled();
      expect(q('.semi-modal')).toBeTruthy();
      expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-loading')).toBe(true);
      resolveOk();
      await wait();
      expect(q('.semi-modal')).toBeNull();
    });

    it('cancel click closes the confirm modal and calls onCancel', async () => {
      const onCancel = vi.fn();
      Modal.confirm({ title: 'a', motion: false, onCancel });
      await wait();
      qa('.semi-modal-footer button')[0].click();
      await wait();
      expect(onCancel).toHaveBeenCalled();
      expect(q('.semi-modal')).toBeNull();
    });

    it('destroyAll closes every open modal', async () => {
      Modal.info({ title: '1', motion: false });
      Modal.info({ title: '2', motion: false });
      await wait();
      expect(qa('.semi-modal')).toHaveLength(2);
      Modal.destroyAll();
      await wait();
      expect(qa('.semi-modal')).toHaveLength(0);
    });
  });

  describe('useModal', () => {
    it('renders modals through ModalHolder and inherits context (locale)', async () => {
      let api: any;
      const Comp = defineComponent({
        setup() {
          const { modal, ModalHolder } = useModal();
          api = modal;
          return () => h(ModalHolder);
        },
      });
      const w = mount(ConfigProvider, { attachTo: document.body, props: { locale: en_GB as any }, slots: { default: () => h(Comp) } });
      await wait();
      const afterClose = vi.fn();
      const handle = api.info({ title: 'hook', content: 'hook content', motion: false, afterClose });
      await wait();
      expect(q('.semi-modal-confirm-title-text')!.textContent).toBe('hook');
      expect(qa('.semi-modal-footer button')[1].textContent).toBe('Confirm');
      handle.update({ title: 'hook2' });
      await wait();
      expect(q('.semi-modal-confirm-title-text')!.textContent).toBe('hook2');
      handle.destroy();
      await wait();
      expect(q('.semi-modal')).toBeNull();
      expect(afterClose).toHaveBeenCalledTimes(1);
      // no leaked global containers
      expect(destroyFns.length).toBe(0);
      api.error({ title: 'e', motion: false });
      await wait();
      expect(qa('.semi-modal-footer button')[1].classList.contains('semi-button-danger')).toBe(true);
      w.unmount();
    });
  });
});
