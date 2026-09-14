import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Toast, { ToastFactory, ToastItem, useToast } from './index';
import ConfigProvider from '../configProvider';
import { IconClose } from '../icons/generated';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
/** poll until `get()` returns a truthy value (or the deadline passes) */
async function waitFor<T>(get: () => T, timeout = 2000, step = 10): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = get();
    if (value) return value;
    if (Date.now() > deadline) return value;
    await sleep(step);
    await nextTick();
  }
}
/** poll until `get()` returns a falsy value (or the deadline passes) */
async function waitForGone(get: () => any, timeout = 2000, step = 10): Promise<void> {
  const deadline = Date.now() + timeout;
  while (get() && Date.now() < deadline) {
    await sleep(step);
    await nextTick();
  }
}
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

describe('Toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    Toast.destroyAll();
    document.body.innerHTML = '';
  });

  it('Toast.info(string) creates the wrapper and a toast with icon/content/close', async () => {
    const id = Toast.info('hello');
    expect(typeof id).toBe('string');
    await wait();
    const wrapper = q('.semi-toast-wrapper')!;
    expect(wrapper).toBeTruthy();
    expect(wrapper.id).toBe(Toast.getWrapperId());
    expect(wrapper.style.zIndex).toBe('1010');
    expect(q('.semi-toast-innerWrapper')).toBeTruthy();
    const toast = q('.semi-toast')!;
    expect(toast.classList.contains('semi-toast-info')).toBe(true);
    expect(toast.classList.contains('semi-toast-animation-show')).toBe(true);
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.getAttribute('aria-label')).toBe('info type');
    expect(q('.semi-toast-icon.semi-toast-icon-info.semi-icon-large')).toBeTruthy();
    expect(q('.semi-toast-content-text')!.textContent).toBe('hello');
    expect(q('.semi-toast-content-text')!.style.maxWidth).toBe('450px');
    expect(q('.semi-toast-close-button .semi-icon-close')).toBeTruthy();
  });

  it('success / warning / error / create(default) set type classes and icons', async () => {
    Toast.success({ content: 's', motion: false });
    Toast.warning({ content: 'w', motion: false });
    Toast.error({ content: 'e', motion: false });
    Toast.create({ content: 'd', motion: false });
    await wait();
    expect(qa('.semi-toast')).toHaveLength(4);
    expect(q('.semi-toast-success .semi-icon-tick_circle')).toBeTruthy();
    expect(q('.semi-toast-warning .semi-icon-alert_triangle')).toBeTruthy();
    expect(q('.semi-toast-error .semi-icon-alert_circle')).toBeTruthy();
    const def = qa('.semi-toast')[3];
    expect(def.classList.contains('semi-toast-undefined')).toBe(true);
    expect(def.getAttribute('aria-label')).toBe('default type');
    expect(def.querySelector('.semi-toast-icon')).toBeNull();
  });

  it('close(id) removes a toast; destroyAll removes wrapper', async () => {
    const id = Toast.info({ content: 'a', motion: false });
    Toast.info({ content: 'b', motion: false });
    await wait();
    expect(qa('.semi-toast')).toHaveLength(2);
    Toast.close(id);
    await wait();
    expect(qa('.semi-toast')).toHaveLength(1);
    expect(q('.semi-toast-content-text')!.textContent).toBe('b');
    Toast.destroyAll();
    await wait();
    expect(q('.semi-toast-wrapper')).toBeNull();
    expect(Toast.getWrapperId()).toBeNull();
  });

  it('auto closes after duration and calls onClose; duration 0 keeps it', async () => {
    const onClose = vi.fn();
    Toast.info({ content: 'x', duration: 0.1, motion: false, onClose });
    Toast.info({ content: 'keep', duration: 0, motion: false });
    await wait(50);
    expect(qa('.semi-toast')).toHaveLength(2);
    await wait(150);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(qa('.semi-toast')).toHaveLength(1);
    expect(q('.semi-toast-content-text')!.textContent).toBe('keep');
  });

  it('hover pauses the close timer, leave restarts it', async () => {
    // Wall-clock based: keep the margins wide so the test is stable when many
    // test files run in parallel and timer callbacks are delayed.
    Toast.info({ content: 'x', duration: 1, motion: false });
    await waitFor(() => q('.semi-toast'));
    // pause the timer, then wait longer than the duration: it must survive
    const toast = q('.semi-toast')!;
    toast.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(1400);
    expect(q('.semi-toast')).toBeTruthy();
    // leave restarts the timer, so it disappears on its own
    q('.semi-toast')!.dispatchEvent(new MouseEvent('mouseleave'));
    await waitForGone(() => q('.semi-toast'), 4000);
    expect(q('.semi-toast')).toBeNull();
  });

  it('close button click removes toast and calls onClose', async () => {
    const onClose = vi.fn();
    Toast.info({ content: 'x', duration: 0, motion: false, onClose });
    await wait();
    (q('.semi-toast-close-button button') as HTMLElement).click();
    await wait();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(q('.semi-toast')).toBeNull();
  });

  it('showClose=false hides close button; theme light; textMaxWidth; className; style; direction rtl', async () => {
    Toast.info({ content: 'x', duration: 0, motion: false, showClose: false, theme: 'light', textMaxWidth: 200, className: 'my-toast', style: { color: 'red' }, direction: 'rtl' });
    await wait();
    const toast = q('.semi-toast')!;
    expect(toast.querySelector('.semi-toast-close-button')).toBeNull();
    expect(toast.classList.contains('semi-toast-light')).toBe(true);
    expect(toast.classList.contains('my-toast')).toBe(true);
    expect(toast.classList.contains('semi-toast-rtl')).toBe(true);
    expect(toast.style.color).toBe('red');
    expect(q('.semi-toast-content-text')!.style.maxWidth).toBe('200px');
  });

  it('custom icon: semi icon gets size large + class, other nodes render as is', async () => {
    Toast.info({ content: 'x', duration: 0, motion: false, icon: h(IconClose) });
    await wait();
    const icon = q('.semi-toast-content .semi-icon-close')!;
    expect(icon.classList.contains('semi-toast-icon')).toBe(true);
    expect(icon.classList.contains('semi-icon-large')).toBe(true);
    Toast.destroyAll();
    await wait();
    Toast.info({ content: 'x', duration: 0, motion: false, icon: h('i', { class: 'raw-icon' }) });
    await wait();
    expect(q('.semi-toast-content .raw-icon')).toBeTruthy();
  });

  it('content as VNode', async () => {
    Toast.info({ content: h('b', { class: 'vnode' }, 'bold'), duration: 0, motion: false });
    await wait();
    expect(q('.semi-toast-content-text .vnode')!.textContent).toBe('bold');
  });

  it('same id updates the existing toast and restarts its timer', async () => {
    const id = Toast.info({ content: 'first', duration: 0.2, motion: false, id: 'fixed' });
    expect(id).toBe('fixed');
    await wait(120);
    Toast.info({ content: 'second', duration: 0.2, motion: false, id: 'fixed' });
    await wait(120);
    expect(qa('.semi-toast')).toHaveLength(1);
    expect(q('.semi-toast-content-text')!.textContent).toBe('second');
    await wait(150);
    expect(q('.semi-toast')).toBeNull();
  });

  it('config: positions, zIndex, duration, theme, getPopupContainer', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const T = ToastFactory.create({ top: 20, left: '10%', zIndex: 5000, duration: 0, theme: 'light', getPopupContainer: () => container });
    T.info('cfg');
    await wait();
    const wrapper = container.querySelector('.semi-toast-wrapper') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.top).toBe('20px');
    expect(wrapper.style.left).toBe('10%');
    expect(wrapper.style.zIndex).toBe('5000');
    expect(wrapper.querySelector('.semi-toast-light')).toBeTruthy();
    // per-call bottom/right override
    T.info({ content: 'b', bottom: 5, right: 6 });
    await wait();
    expect(wrapper.style.bottom).toBe('5px');
    expect(wrapper.style.right).toBe('6px');
    await wait(100);
    expect(wrapper.querySelectorAll('.semi-toast')).toHaveLength(2);
    T.destroyAll();
    await wait();
    expect(container.querySelector('.semi-toast-wrapper')).toBeNull();
    Toast.config({ theme: 'normal', duration: 3 });
    expect(Toast.defaultOpts.theme).toBe('normal');
  });

  it('ToastFactory.create creates independent instances', async () => {
    const A = ToastFactory.create();
    const B = ToastFactory.create();
    A.info({ content: 'a', motion: false, duration: 0 });
    B.info({ content: 'b', motion: false, duration: 0 });
    await wait();
    expect(qa('.semi-toast-wrapper')).toHaveLength(2);
    expect(A.getWrapperId()).not.toBe(B.getWrapperId());
    A.destroyAll();
    await wait();
    expect(qa('.semi-toast-wrapper')).toHaveLength(1);
    B.destroyAll();
  });

  it('stack: zero-height wrappers and hover class on inner wrapper', async () => {
    Toast.info({ content: 'a', motion: false, duration: 0, stack: true });
    Toast.info({ content: 'b', motion: false, duration: 0, stack: true });
    await wait();
    expect(qa('.semi-toast-zero-height-wrapper')).toHaveLength(2);
    const inner = q('.semi-toast-innerWrapper')!;
    inner.dispatchEvent(new MouseEvent('mouseenter'));
    await wait();
    expect(inner.classList.contains('semi-toast-innerWrapper-hover')).toBe(true);
    // translate3d depth reflects position in list
    const toasts = qa('.semi-toast');
    expect(toasts[0].style.transform).toBe('translate3d(0,0,-10px)');
    expect(toasts[1].style.transform).toBe('translate3d(0,0,0px)');
  });

  it('motion: removed toast keeps DOM until animationend', async () => {
    const id = Toast.info({ content: 'anim', duration: 0 });
    await wait();
    Toast.close(id);
    await wait();
    const toast = q('.semi-toast')!;
    expect(toast).toBeTruthy();
    expect(toast.classList.contains('semi-toast-animation-hide')).toBe(true);
    toast.dispatchEvent(new Event('animationend'));
    await wait();
    expect(q('.semi-toast')).toBeNull();
  });

  it('ToastItem component renders standalone (props + slots) and exposes methods', async () => {
    const close = vi.fn();
    const wrapper = mount(ToastItem, {
      attachTo: document.body,
      props: { id: 't1', type: 'success', content: 'prop content', duration: 0, close },
      slots: { icon: () => h('i', { class: 'slot-icon' }) },
    });
    await wait();
    expect(wrapper.find('.semi-toast-success').exists()).toBe(true);
    expect(wrapper.find('.slot-icon').exists()).toBe(true);
    expect(wrapper.find('.semi-toast-content-text').text()).toBe('prop content');
    (wrapper.vm as any).close();
    expect(close).toHaveBeenCalledWith('t1');
    expect(typeof (wrapper.vm as any).restartCloseTimer).toBe('function');
    wrapper.unmount();
    const w2 = mount(ToastItem, { attachTo: document.body, props: { duration: 0 }, slots: { default: () => h('em', 'slot content') } });
    expect(w2.find('.semi-toast-content-text em').text()).toBe('slot content');
    w2.unmount();
  });

  it('direction from ConfigProvider applies to ToastItem', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(ToastItem, { content: 'x', duration: 0 }) },
    });
    await wait();
    expect(w.find('.semi-toast-rtl').exists()).toBe(true);
    w.unmount();
  });

  it('numeric id (official API type) is accepted, returned, updatable and closable', async () => {
    const id = Toast.info({ content: 'n1', duration: 0, motion: false, id: 42 });
    expect(id).toBe(42);
    await wait();
    expect(qa('.semi-toast')).toHaveLength(1);
    Toast.success({ content: 'n2', duration: 0, motion: false, id: 42 });
    await wait();
    expect(qa('.semi-toast')).toHaveLength(1);
    expect(q('.semi-toast-content-text')!.textContent).toBe('n2');
    expect(q('.semi-toast-success')).toBeTruthy();
    Toast.close(42);
    await wait();
    expect(q('.semi-toast')).toBeNull();
  });

  describe('useToast', () => {
    it('renders toasts through ToastHolder (newest first) and close() removes them', async () => {
      let api: any;
      const Comp = defineComponent({
        setup() {
          const { toast, ToastHolder } = useToast();
          api = toast;
          return () => h('div', { class: 'holder' }, [h(ToastHolder)]);
        },
      });
      const w = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(Comp) } });
      await wait();
      const id1 = api.info({ content: 'one', duration: 0 });
      const id2 = api.success({ content: 'two', duration: 0 });
      await wait();
      const toasts = w.findAll('.holder .semi-toast');
      expect(toasts).toHaveLength(2);
      expect(toasts[0].text()).toContain('two');
      expect(toasts[0].classes()).toContain('semi-toast-success');
      expect(toasts[0].classes()).toContain('semi-toast-rtl');
      api.close(id2);
      await wait();
      expect(w.findAll('.holder .semi-toast')).toHaveLength(1);
      api.error({ content: 'e', duration: 0 });
      api.warning({ content: 'w', duration: 0 });
      api.open({ content: 'o', duration: 0 });
      await wait();
      expect(w.find('.semi-toast-error').exists()).toBe(true);
      expect(w.find('.semi-toast-warning').exists()).toBe(true);
      expect(w.find('.semi-toast-default').exists()).toBe(true);
      // close button inside the holder
      w.find('.holder .semi-toast-close-button button').element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait();
      expect(w.findAll('.holder .semi-toast')).toHaveLength(3);
      // auto close
      api.info({ content: 'auto', duration: 0.3 });
      await wait(20);
      expect(w.findAll('.holder .semi-toast')).toHaveLength(4);
      await wait(400);
      expect(w.findAll('.holder .semi-toast')).toHaveLength(3);
      api.close(id1);
      w.unmount();
    });
  });
});
