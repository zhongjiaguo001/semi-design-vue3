import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Notification, { Notice, createNotification, useNotification } from './index';
import ConfigProvider from '../configProvider';
import { IconClose } from '../icons/generated';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

describe('Notification', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    Notification.destroyAll();
    document.body.innerHTML = '';
  });

  it('Notification.info creates wrapper, list (topRight) and a notice with icon/title/content/close', async () => {
    const id = Notification.info({ title: 'Title', content: 'Content', motion: false });
    expect(typeof id).toBe('string');
    await wait();
    const wrapper = q('.semi-notification-wrapper')!;
    expect(wrapper).toBeTruthy();
    expect(wrapper.id).toBe(Notification.getWrapperId());
    expect(wrapper.style.zIndex).toBe('1010');
    const list = q('.semi-notification-list')!;
    expect(list.getAttribute('placement')).toBe('topRight');
    const notice = q('.semi-notification-notice')!;
    expect(notice.classList.contains('semi-notification-notice-info')).toBe(true);
    expect(notice.classList.contains('semi-notification-notice-icon-show')).toBe(true);
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.getAttribute('aria-labelledby')).toBe(q('.semi-notification-notice-title')!.id);
    expect(q('.semi-notification-notice-icon.semi-notification-notice-info .semi-icon-info_circle.semi-icon-large')).toBeTruthy();
    expect(q('.semi-notification-notice-title')!.textContent).toBe('Title');
    expect(q('.semi-notification-notice-content')!.textContent).toBe('Content');
    expect(q('.semi-notification-notice-icon-close .semi-icon-close')).toBeTruthy();
  });

  it('success / warning / error / open types and icons; default type has no icon', async () => {
    Notification.success({ title: 's', motion: false });
    Notification.warning({ title: 'w', motion: false });
    Notification.error({ title: 'e', motion: false });
    Notification.open({ title: 'd', motion: false });
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(4);
    expect(q('.semi-notification-notice-success .semi-icon-tick_circle')).toBeTruthy();
    expect(q('.semi-notification-notice-warning .semi-icon-alert_triangle')).toBeTruthy();
    expect(q('.semi-notification-notice-error .semi-icon-alert_circle')).toBeTruthy();
    const def = q('.semi-notification-notice.semi-notification-notice-default')!;
    expect(def).toBeTruthy();
    expect(def.querySelector('.semi-notification-notice-icon')).toBeNull();
    // newest first
    expect(qa('.semi-notification-notice-title')[0].textContent).toBe('d');
  });

  it('positions: each position renders its own list with placement attribute; top/left/bottom/right offsets', async () => {
    Notification.info({ title: 'a', position: 'topLeft', motion: false, top: 10, left: '5%' });
    Notification.info({ title: 'b', position: 'bottomRight', motion: false, bottom: 20, right: 30 });
    Notification.info({ title: 'c', position: 'bottomLeft', motion: false });
    Notification.info({ title: 'd', position: 'top', motion: false });
    Notification.info({ title: 'e', position: 'bottom', motion: false });
    await wait();
    const lists = qa('.semi-notification-list');
    expect(lists.map((l) => l.getAttribute('placement'))).toEqual(['top', 'topLeft', 'bottom', 'bottomLeft', 'bottomRight']);
    const topLeft = q('.semi-notification-list[placement="topLeft"]')!;
    expect(topLeft.style.top).toBe('10px');
    expect(topLeft.style.left).toBe('5%');
    const bottomRight = q('.semi-notification-list[placement="bottomRight"]')!;
    expect(bottomRight.style.bottom).toBe('20px');
    expect(bottomRight.style.right).toBe('30px');
  });

  it('close(id) removes; destroyAll removes wrapper', async () => {
    const id = Notification.info({ title: 'a', motion: false });
    Notification.info({ title: 'b', motion: false });
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(2);
    expect(Notification.close(id)).toBe(id);
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(1);
    Notification.destroyAll();
    await wait();
    expect(q('.semi-notification-wrapper')).toBeNull();
    expect(Notification.getWrapperId()).toBeNull();
  });

  it('auto closes after duration and calls onClose; duration 0 keeps it', async () => {
    const onClose = vi.fn();
    Notification.info({ title: 'x', duration: 0.1, motion: false, onClose });
    Notification.info({ title: 'keep', duration: 0, motion: false });
    await wait(50);
    expect(qa('.semi-notification-notice')).toHaveLength(2);
    await wait(150);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(qa('.semi-notification-notice')).toHaveLength(1);
    expect(q('.semi-notification-notice-title')!.textContent).toBe('keep');
  });

  it('hover pauses timer, leave restarts it', async () => {
    Notification.info({ title: 'x', duration: 0.15, motion: false });
    await wait(20);
    q('.semi-notification-notice')!.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(200);
    expect(q('.semi-notification-notice')).toBeTruthy();
    q('.semi-notification-notice')!.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(220);
    expect(q('.semi-notification-notice')).toBeNull();
  });

  it('close button: onCloseClick(id) + onClose; onClick on the notice body', async () => {
    const onCloseClick = vi.fn();
    const onClose = vi.fn();
    const onClick = vi.fn();
    const id = Notification.info({ title: 'x', duration: 0, motion: false, onCloseClick, onClose, onClick });
    await wait();
    q('.semi-notification-notice')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
    (q('.semi-notification-notice-icon-close') as HTMLElement).click();
    await wait();
    expect(onCloseClick).toHaveBeenCalledWith(id);
    expect(onClose).toHaveBeenCalledTimes(1);
    // close button click is stopped from bubbling into onClick
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(q('.semi-notification-notice')).toBeNull();
  });

  it('showClose=false, theme light, className, style, direction rtl (default position topLeft)', async () => {
    Notification.info({ title: 'x', duration: 0, motion: false, showClose: false, theme: 'light', className: 'my-notice', style: { color: 'red' }, direction: 'rtl' });
    await wait();
    const notice = q('.semi-notification-notice')!;
    expect(notice.querySelector('.semi-notification-notice-icon-close')).toBeNull();
    expect(notice.classList.contains('semi-notification-notice-light')).toBe(true);
    expect(notice.classList.contains('my-notice')).toBe(true);
    expect(notice.classList.contains('semi-notification-notice-rtl')).toBe(true);
    expect(notice.style.color).toBe('red');
    // defaultConfig.position is 'topRight' (as React); the rtl fallback applies only when position is explicitly undefined
    expect(q('.semi-notification-list')!.getAttribute('placement')).toBe('topRight');
    Notification.destroyAll();
    await wait();
    Notification.info({ title: 'y', duration: 0, motion: false, direction: 'rtl', position: undefined });
    await wait();
    expect(q('.semi-notification-list')!.getAttribute('placement')).toBe('topLeft');
  });

  it('custom icon (semi icon keeps its size, raw node rendered as is); title/content as VNodes; empty title/content omitted', async () => {
    Notification.info({ title: h('b', { class: 'vt' }, 't'), content: h('i', { class: 'vc' }, 'c'), duration: 0, motion: false, icon: h(IconClose, { size: 'small' }) });
    await wait();
    const icon = q('.semi-notification-notice-icon .semi-icon-close')!;
    expect(icon.classList.contains('semi-icon-small')).toBe(true);
    expect(q('.semi-notification-notice-title .vt')).toBeTruthy();
    expect(q('.semi-notification-notice-content .vc')).toBeTruthy();
    Notification.destroyAll();
    await wait();
    Notification.open({ content: 'only content', duration: 0, motion: false, icon: h('em', { class: 'raw' }) });
    await wait();
    expect(q('.semi-notification-notice-icon .raw')).toBeTruthy();
    expect(q('.semi-notification-notice-title')).toBeNull();
    expect(q('.semi-notification-notice-content')!.textContent).toBe('only content');
  });

  it('same id updates the existing notice', async () => {
    Notification.info({ id: 'fixed', title: 'first', duration: 0, motion: false });
    await wait();
    const id = Notification.info({ id: 'fixed', title: 'second', duration: 0, motion: false });
    expect(id).toBe('fixed');
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(1);
    expect(q('.semi-notification-notice-title')!.textContent).toBe('second');
  });

  it('config: position, zIndex, duration, offsets; getPopupContainer', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const N = createNotification();
    N.config({ position: 'bottomLeft', zIndex: 3000, duration: 0, top: 1, left: 2, bottom: 3, right: 4 });
    expect(N.defaultConfig.position).toBe('bottomLeft');
    N.info({ title: 'cfg', motion: false, getPopupContainer: () => container });
    await wait();
    const wrapper = container.querySelector('.semi-notification-wrapper') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.zIndex).toBe('3000');
    const list = wrapper.querySelector('.semi-notification-list') as HTMLElement;
    expect(list.getAttribute('placement')).toBe('bottomLeft');
    expect(list.style.top).toBe('1px');
    expect(list.style.right).toBe('4px');
    await wait(100);
    expect(wrapper.querySelectorAll('.semi-notification-notice')).toHaveLength(1);
    N.destroyAll();
    await wait();
    expect(container.querySelector('.semi-notification-wrapper')).toBeNull();
  });

  it('motion: removed notice keeps DOM until animationend', async () => {
    const id = Notification.info({ title: 'anim', duration: 0 });
    await wait();
    expect(q('.semi-notification-notice')!.classList.contains('semi-notification-notice-animation-show_topRight')).toBe(true);
    Notification.close(id);
    await wait();
    const notice = q('.semi-notification-notice')!;
    expect(notice).toBeTruthy();
    expect(notice.classList.contains('semi-notification-notice-animation-hide_topRight')).toBe(true);
    notice.dispatchEvent(new Event('animationend'));
    await wait();
    expect(q('.semi-notification-notice')).toBeNull();
  });

  it('Notice component renders standalone with props/slots and exposes methods', async () => {
    const close = vi.fn();
    const wrapper = mount(Notice, {
      attachTo: document.body,
      props: { id: 'n1', type: 'success', title: 'pt', duration: 0, close },
      slots: { content: () => h('em', 'slot content'), icon: () => h('i', { class: 'slot-icon' }) },
    });
    await wait();
    expect(wrapper.find('.semi-notification-notice-success').exists()).toBe(true);
    expect(wrapper.find('.slot-icon').exists()).toBe(true);
    expect(wrapper.find('.semi-notification-notice-content em').text()).toBe('slot content');
    (wrapper.vm as any).close();
    expect(close).toHaveBeenCalledWith('n1');
    expect(typeof (wrapper.vm as any).restartCloseTimer).toBe('function');
    wrapper.unmount();
    const w2 = mount(Notice, { attachTo: document.body, props: { duration: 0 }, slots: { default: () => 'default slot', title: () => h('b', 'slot title') } });
    expect(w2.find('.semi-notification-notice-title b').text()).toBe('slot title');
    expect(w2.find('.semi-notification-notice-content').text()).toBe('default slot');
    w2.unmount();
  });

  it('direction from ConfigProvider applies rtl to Notice', async () => {
    const w = mount(ConfigProvider, {
      attachTo: document.body,
      props: { direction: 'rtl' },
      slots: { default: () => h(Notice, { title: 'x', duration: 0 }) },
    });
    await wait();
    expect(w.find('.semi-notification-notice-rtl').exists()).toBe(true);
    w.unmount();
  });

  it('close accepts numeric ids (coerced to string), addNotice/removeNotice/useNotification/defaultConfig are exposed', async () => {
    const onCloseClick = vi.fn();
    Notification.info({ id: '42', title: 'num', duration: 0, motion: false, onCloseClick });
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(1);
    Notification.close(42 as any);
    await wait();
    expect(qa('.semi-notification-notice')).toHaveLength(0);
    expect(Notification.useNotification).toBe(useNotification);
    expect(typeof Notification.addNotice).toBe('function');
    expect(Notification.removeNotice('nope')).toBe('nope');
    expect(Notification.defaultConfig.duration).toBe(3);
  });

  describe('useNotification', () => {
    it('renders notices grouped by position through NotificationHolder; close removes', async () => {
      let api: any;
      const Comp = defineComponent({
        setup() {
          const { notification, NotificationHolder } = useNotification();
          api = notification;
          return () => h('div', { class: 'holder' }, [h(NotificationHolder)]);
        },
      });
      const w = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(Comp) } });
      await wait();
      const id1 = api.info({ title: 'one', duration: 0 });
      const id2 = api.success({ title: 'two', duration: 0, position: 'bottomLeft' });
      api.error({ title: 'e', duration: 0 });
      api.warning({ title: 'w', duration: 0 });
      api.open({ title: 'o', duration: 0 });
      await wait();
      const lists = w.findAll('.holder .semi-notification-list');
      expect(lists.map((l) => l.attributes('placement'))).toEqual(['topRight', 'bottomLeft']);
      expect(w.findAll('.holder .semi-notification-notice')).toHaveLength(5);
      expect(w.find('.holder .semi-notification-notice').classes()).toContain('semi-notification-notice-rtl');
      // newest first within a position
      expect(w.findAll('.holder .semi-notification-list[placement="topRight"] .semi-notification-notice-title')[0].text()).toBe('o');
      api.close(id2);
      await wait();
      expect(w.findAll('.holder .semi-notification-list')).toHaveLength(1);
      // close button
      const onCloseClick = vi.fn();
      api.info({ title: 'btn', duration: 0, onCloseClick });
      await wait();
      w.find('.holder .semi-notification-notice-icon-close').element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait();
      expect(onCloseClick).toHaveBeenCalled();
      expect(w.findAll('.holder .semi-notification-notice')).toHaveLength(4);
      // auto close
      api.info({ title: 'auto', duration: 0.3 });
      await wait(20);
      expect(w.findAll('.holder .semi-notification-notice')).toHaveLength(5);
      await wait(400);
      expect(w.findAll('.holder .semi-notification-notice')).toHaveLength(4);
      api.close(id1);
      w.unmount();
    });
  });
});
