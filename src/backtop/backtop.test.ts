import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackTop from './index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 30) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

function makeTarget(scrollTop = 0) {
  const el = document.createElement('div');
  el.scrollTop = scrollTop;
  document.body.appendChild(el);
  return el;
}

describe('BackTop', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true, writable: true });
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('is hidden until the target scrolls past visibilityHeight (window default)', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const w = mount(BackTop, { attachTo: document.body });
    await wait();
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(w.html()).toBe('');
    (window as any).pageYOffset = 500;
    window.dispatchEvent(new Event('scroll'));
    await wait();
    expect(w.find('.semi-backtop').exists()).toBe(true);
    expect(w.find('.semi-backtop').attributes('x-semi-prop')).toBe('children');
    // default content: light IconButton with chevron up
    expect(w.find('.semi-backtop .semi-button').exists()).toBe(true);
    expect(w.find('.semi-backtop .semi-button').classes()).toContain('semi-button-light');
    expect(w.find('.semi-backtop .semi-icon-chevron_up').exists()).toBe(true);
    (window as any).pageYOffset = 100;
    window.dispatchEvent(new Event('scroll'));
    await wait();
    expect(w.find('.semi-backtop').exists()).toBe(false);
    w.unmount();
  });

  it('custom target + visibilityHeight; custom children; class/style/attrs', async () => {
    const target = makeTarget(0);
    const w = mount(BackTop, {
      attachTo: document.body,
      props: { target: () => target, visibilityHeight: 50 },
      attrs: { class: 'mine', style: { right: '10px' }, id: 'bt' },
      slots: { default: () => h('span', { class: 'custom' }, 'UP') },
    });
    await wait();
    expect(w.find('.semi-backtop').exists()).toBe(false);
    target.scrollTop = 60;
    target.dispatchEvent(new Event('scroll'));
    await wait();
    const el = w.find('.semi-backtop');
    expect(el.exists()).toBe(true);
    expect(el.classes()).toContain('mine');
    expect((el.element as HTMLElement).style.right).toBe('10px');
    expect(el.attributes('id')).toBe('bt');
    expect(el.find('.custom').text()).toBe('UP');
    expect(el.find('.semi-button').exists()).toBe(false);
    target.scrollTop = 50;
    target.dispatchEvent(new Event('scroll'));
    await wait();
    expect(w.find('.semi-backtop').exists()).toBe(false);
    w.unmount();
  });

  it('click emits click and animates the target scrollTop to 0 within duration', async () => {
    const target = makeTarget(600);
    const w = mount(BackTop, { attachTo: document.body, props: { target: () => target, visibilityHeight: 100, duration: 100 } });
    await wait();
    target.dispatchEvent(new Event('scroll'));
    await wait();
    expect(w.find('.semi-backtop').exists()).toBe(true);
    await w.find('.semi-backtop').trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
    expect(w.emitted('click')![0][0]).toBeInstanceOf(Event);
    await wait(400);
    expect(target.scrollTop).toBe(0);
    w.unmount();
  });

  it('click is throttled by duration', async () => {
    const target = makeTarget(600);
    const w = mount(BackTop, { attachTo: document.body, props: { target: () => target, visibilityHeight: 100, duration: 1000 } });
    await wait();
    target.dispatchEvent(new Event('scroll'));
    await wait();
    await w.find('.semi-backtop').trigger('click');
    await w.find('.semi-backtop').trigger('click');
    expect(w.emitted('click')).toHaveLength(1);
    w.unmount();
  });

  it('window target scrolls documentElement / body to top', async () => {
    (window as any).pageYOffset = 800;
    document.documentElement.scrollTop = 800;
    const w = mount(BackTop, { attachTo: document.body, props: { duration: 50 } });
    await wait();
    window.dispatchEvent(new Event('scroll'));
    await wait();
    await w.find('.semi-backtop').trigger('click');
    await wait(300);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
    w.unmount();
  });

  it('removes the scroll listener on unmount; exposes scrollToTop', async () => {
    const target = makeTarget(600);
    const remove = vi.spyOn(target, 'removeEventListener');
    const w = mount(BackTop, { attachTo: document.body, props: { target: () => target, visibilityHeight: 100, duration: 50 } });
    await wait();
    (w.vm as any).scrollToTop();
    await wait(300);
    expect(target.scrollTop).toBe(0);
    expect(w.emitted('click')).toHaveLength(1);
    w.unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('no target (null) does not throw', async () => {
    const w = mount(BackTop, { props: { target: () => null } });
    await wait();
    expect(w.html()).toBe('');
    w.unmount();
  });
});
