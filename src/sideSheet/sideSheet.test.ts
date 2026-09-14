import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent, ref } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SideSheet from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

function mountSheet(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(SideSheet, {
    attachTo: document.body,
    props: { motion: false, ...props },
    slots: { default: () => h('p', { class: 'body-text' }, 'sheet body'), ...slots },
  });
}

describe('SideSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing when hidden; renders structure when visible (default right/small)', async () => {
    const wrapper = mountSheet({ visible: false, title: 'T' });
    await wait();
    expect(q('.semi-sidesheet')).toBeNull();
    await wrapper.setProps({ visible: true });
    await wait();
    const root = q('.semi-sidesheet')!;
    expect(root).toBeTruthy();
    expect(root.classList.contains('semi-sidesheet-right')).toBe(true);
    expect(root.classList.contains('semi-sidesheet-horizontal')).toBe(false);
    expect(q('.semi-sidesheet-mask')).toBeTruthy();
    expect(q('.semi-sidesheet-mask')!.getAttribute('aria-hidden')).toBe('true');
    const inner = q('.semi-sidesheet-inner')!;
    expect(inner.classList.contains('semi-sidesheet-inner-wrap')).toBe(true);
    expect(inner.classList.contains('semi-sidesheet-size-small')).toBe(true);
    expect(inner.getAttribute('role')).toBe('dialog');
    expect(inner.getAttribute('id')).toMatch(/^sidesheet-/);
    expect(inner.style.height).toBe('100%');
    expect(q('.semi-sidesheet-header')!.getAttribute('role')).toBe('heading');
    expect(q('.semi-sidesheet-title')!.textContent).toBe('T');
    expect(q('.semi-sidesheet-body')!.textContent).toBe('sheet body');
    expect(q('.semi-sidesheet-body')!.getAttribute('x-semi-prop')).toBe('children');
    expect(q('.semi-sidesheet-footer')).toBeNull();
    expect(q('.semi-sidesheet-close')).toBeTruthy();
    expect((q('.semi-portal') as HTMLElement).style.zIndex).toBe('1000');
    wrapper.unmount();
  });

  it('placement top/bottom uses horizontal class and default height 448', async () => {
    const wrapper = mountSheet({ visible: true, placement: 'bottom' });
    await wait();
    const root = q('.semi-sidesheet')!;
    expect(root.classList.contains('semi-sidesheet-bottom')).toBe(true);
    expect(root.classList.contains('semi-sidesheet-horizontal')).toBe(true);
    const inner = q('.semi-sidesheet-inner')!;
    expect(inner.style.height).toBe('448px');
    expect(inner.style.width).toBe('100%');
    await wrapper.setProps({ height: 200, placement: 'top' });
    await wait();
    expect(q('.semi-sidesheet-top')).toBeTruthy();
    expect(q('.semi-sidesheet-inner')!.style.height).toBe('200px');
    wrapper.unmount();
  });

  it('placement left; size medium/large; width prop', async () => {
    const wrapper = mountSheet({ visible: true, placement: 'left', size: 'large', width: 600 });
    await wait();
    expect(q('.semi-sidesheet-left')).toBeTruthy();
    const inner = q('.semi-sidesheet-inner')!;
    expect(inner.classList.contains('semi-sidesheet-size-large')).toBe(true);
    expect(inner.style.width).toBe('600px');
    await wrapper.setProps({ size: 'medium', width: '50%' });
    await wait();
    expect(q('.semi-sidesheet-inner')!.classList.contains('semi-sidesheet-size-medium')).toBe(true);
    expect(q('.semi-sidesheet-inner')!.style.width).toBe('50%');
    wrapper.unmount();
  });

  it('canVerticalSetWidth lets top/bottom sheets take width', async () => {
    const wrapper = mountSheet({ visible: true, placement: 'top', width: 300, canVerticalSetWidth: true });
    await wait();
    expect(q('.semi-sidesheet-inner')!.style.width).toBe('300px');
    wrapper.unmount();
  });

  it('mask=false: fixed wrapper carries size & width, inner width 100%', async () => {
    const wrapper = mountSheet({ visible: true, mask: false, width: 400 });
    await wait();
    expect(q('.semi-sidesheet-mask')).toBeNull();
    const root = q('.semi-sidesheet')!;
    expect(root.classList.contains('semi-sidesheet-fixed')).toBe(true);
    expect(root.classList.contains('semi-sidesheet-size-small')).toBe(true);
    expect(root.style.width).toBe('400px');
    expect(q('.semi-sidesheet-inner')!.style.width).toBe('100%');
    wrapper.unmount();
  });

  it('mask click closes when maskClosable; not when maskClosable=false; inner click ignored', async () => {
    const onCancel = vi.fn();
    const wrapper = mountSheet({ visible: true, onCancel });
    await wait();
    q('.semi-sidesheet-inner')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(20);
    expect(onCancel).not.toHaveBeenCalled();
    q('.semi-sidesheet-mask')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('update:visible')![0]).toEqual([false]);
    wrapper.unmount();

    const onCancel2 = vi.fn();
    const w2 = mountSheet({ visible: true, onCancel: onCancel2, maskClosable: false });
    await wait();
    q('.semi-sidesheet-mask')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(20);
    expect(onCancel2).not.toHaveBeenCalled();
    w2.unmount();
  });

  it('close button calls onCancel; closable=false hides it; closeIcon prop & slot', async () => {
    const onCancel = vi.fn();
    const wrapper = mountSheet({ visible: true, onCancel });
    await wait();
    expect(q('.semi-sidesheet-close .semi-icon-close')).toBeTruthy();
    q('.semi-sidesheet-close')!.click();
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ closable: false });
    await wait();
    expect(q('.semi-sidesheet-close')).toBeNull();
    await wrapper.setProps({ closable: true, closeIcon: h('i', { class: 'p-close' }) });
    await wait();
    expect(q('.semi-sidesheet-close .p-close')).toBeTruthy();
    wrapper.unmount();
    const w2 = mountSheet({ visible: true }, { closeIcon: () => h('b', { class: 's-close' }) });
    await wait();
    expect(q('.semi-sidesheet-close .s-close')).toBeTruthy();
    w2.unmount();
  });

  it('v-model:visible through parent', async () => {
    const Parent = defineComponent({
      setup() {
        const visible = ref(true);
        return () => h('div', [h('span', { class: 'state' }, String(visible.value)), h(SideSheet, { visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v), motion: false }, () => 'body')]);
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wait();
    q('.semi-sidesheet-close')!.click();
    await wait(20);
    expect(wrapper.find('.state').text()).toBe('false');
    expect(q('.semi-sidesheet')).toBeNull();
    wrapper.unmount();
  });

  it('closeOnEsc: Escape on window closes only when enabled', async () => {
    const onCancel = vi.fn();
    const wrapper = mountSheet({ visible: true, onCancel });
    await wait();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 } as any));
    await wait(20);
    expect(onCancel).not.toHaveBeenCalled();
    await wrapper.setProps({ closeOnEsc: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 } as any));
    await wait(20);
    expect(onCancel).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('keydown listener removed after hide', async () => {
    const onCancel = vi.fn();
    const wrapper = mountSheet({ visible: true, closeOnEsc: true, onCancel });
    await wait();
    await wrapper.setProps({ visible: false });
    await wait();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 } as any));
    await wait(20);
    expect(onCancel).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('title / footer as props and slots', async () => {
    const wrapper = mountSheet({ visible: true, title: h('b', 'ptitle'), footer: h('span', { class: 'p-footer' }, 'f') });
    await wait();
    expect(q('.semi-sidesheet-title b')!.textContent).toBe('ptitle');
    expect(q('.semi-sidesheet-footer .p-footer')).toBeTruthy();
    expect(q('.semi-sidesheet-footer')!.getAttribute('x-semi-prop')).toBe('footer');
    wrapper.unmount();
    const w2 = mountSheet({ visible: true }, { title: () => h('em', 'stitle'), footer: () => h('span', { class: 's-footer' }) });
    await wait();
    expect(q('.semi-sidesheet-title em')!.textContent).toBe('stitle');
    expect(q('.semi-sidesheet-footer .s-footer')).toBeTruthy();
    w2.unmount();
    const w3 = mountSheet({ visible: true });
    await wait();
    expect(q('.semi-sidesheet-title')).toBeNull();
    expect(q('.semi-sidesheet-header')).toBeTruthy();
    w3.unmount();
  });

  it('style / bodyStyle / headerStyle / maskStyle / className / class / data attrs / aria-label', async () => {
    const wrapper = mountSheet({
      visible: true,
      title: 'T',
      style: { top: '5px' },
      bodyStyle: { padding: '0px' },
      headerStyle: { color: 'red' },
      maskStyle: { opacity: '0.5' },
      className: 'my-sheet',
      class: 'attr-sheet',
      'data-test': 'yes',
      ariaLabel: 'my label',
    });
    await wait();
    const root = q('.semi-sidesheet')!;
    expect(root.classList.contains('my-sheet')).toBe(true);
    expect(root.classList.contains('attr-sheet')).toBe(true);
    expect(root.getAttribute('data-test')).toBe('yes');
    expect(q('.semi-sidesheet-inner')!.style.top).toBe('5px');
    expect(q('.semi-sidesheet-inner')!.getAttribute('aria-label')).toBe('my label');
    expect(q('.semi-sidesheet-body')!.style.padding).toBe('0px');
    expect(q('.semi-sidesheet-header')!.style.color).toBe('red');
    expect(q('.semi-sidesheet-mask')!.style.opacity).toBe('0.5');
    wrapper.unmount();
  });

  it('zIndex and getPopupContainer', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const wrapper = mountSheet({ visible: true, zIndex: 1500, getPopupContainer: () => container });
    await wait();
    const portal = container.querySelector('.semi-portal') as HTMLElement;
    expect(portal).toBeTruthy();
    expect(portal.style.zIndex).toBe('1500');
    expect(portal.style.position).toBe('static');
    expect(container.querySelector('.semi-sidesheet-popup')).toBeTruthy();
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
  });

  it('disableScroll toggles body overflow; disableScroll=false leaves body alone', async () => {
    const wrapper = mountSheet({ visible: true });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    await wrapper.setProps({ visible: false });
    await wait();
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
    const w2 = mountSheet({ visible: true, disableScroll: false });
    await wait();
    expect(document.body.style.overflow).toBe('');
    w2.unmount();
  });

  it('unmount while visible restores body scroll and removes portal', async () => {
    const wrapper = mountSheet({ visible: true });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    wrapper.unmount();
    await wait();
    expect(document.body.style.overflow).toBe('');
    expect(q('.semi-portal')).toBeNull();
  });

  it('afterVisibleChange prop + emit fire on show and hide', async () => {
    const afterVisibleChange = vi.fn();
    const wrapper = mountSheet({ visible: false, afterVisibleChange });
    await wait();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(afterVisibleChange).toHaveBeenLastCalledWith(true);
    expect(wrapper.emitted('afterVisibleChange')![0]).toEqual([true]);
    await wrapper.setProps({ visible: false });
    await wait();
    expect(afterVisibleChange).toHaveBeenLastCalledWith(false);
    expect(wrapper.emitted('afterVisibleChange')![1]).toEqual([false]);
    wrapper.unmount();
  });

  it('keepDOM keeps the sheet mounted with hidden class', async () => {
    const wrapper = mountSheet({ visible: false, keepDOM: true });
    await wait();
    expect(q('.semi-sidesheet')).toBeTruthy();
    expect(q('.semi-sidesheet-hidden')).toBeTruthy();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(q('.semi-sidesheet-hidden')).toBeNull();
    await wrapper.setProps({ visible: false });
    await wait();
    expect(q('.semi-sidesheet')).toBeTruthy();
    expect(q('.semi-sidesheet-hidden')).toBeTruthy();
    wrapper.unmount();
  });

  it('rtl from ConfigProvider', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(SideSheet, { visible: true, motion: false }, () => 'x') },
    });
    await wait();
    expect(q('.semi-sidesheet-rtl')).toBeTruthy();
    w.unmount();
  });

  it('motion: applies animation classes and unmounts after animationend', async () => {
    const wrapper = mountSheet({ visible: true, motion: true, placement: 'left' });
    await wait();
    expect(q('.semi-sidesheet-inner')!.classList.contains('semi-sidesheet-animation-content_show_left')).toBe(true);
    expect(q('.semi-sidesheet-mask')!.classList.contains('semi-sidesheet-animation-mask_show')).toBe(true);
    await wrapper.setProps({ visible: false });
    await wait();
    expect(q('.semi-sidesheet-inner')!.classList.contains('semi-sidesheet-animation-content_hide_left')).toBe(true);
    expect(q('.semi-sidesheet')).toBeTruthy();
    q('.semi-sidesheet-inner')!.dispatchEvent(new Event('animationend'));
    q('.semi-sidesheet-mask')!.dispatchEvent(new Event('animationend'));
    await wait();
    expect(q('.semi-sidesheet')).toBeNull();
    wrapper.unmount();
  });

  it('exposes foundation', () => {
    const wrapper = mountSheet({ visible: false });
    expect((wrapper.vm as any).foundation).toBeTruthy();
    wrapper.unmount();
  });
  it('aria-label attr (React `aria-label` prop) reaches the dialog; closeIcon=null falls back to IconClose', async () => {
    const wrapper = mountSheet({ visible: true, 'aria-label': 'attr label', closeIcon: null });
    await wait();
    expect(q('.semi-sidesheet-inner')!.getAttribute('aria-label')).toBe('attr label');
    expect(q('.semi-sidesheet-close .semi-icon-close')).toBeTruthy();
    wrapper.unmount();
  });
});
