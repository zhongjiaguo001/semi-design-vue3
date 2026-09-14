import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Collapsible, { getEntryInfo } from './index';

/** capture ResizeObserver instances so tests can fire resize entries */
const observers: Array<{ cb: (entries: any[]) => void; observed: Element[]; disconnected: boolean }> = [];
let originalRO: any;
let heightSpies: Array<{ mockRestore: () => void }> = [];

beforeEach(() => {
  observers.length = 0;
  originalRO = (globalThis as any).ResizeObserver;
  (globalThis as any).ResizeObserver = class {
    observed: Element[] = [];
    disconnected = false;
    constructor(public cb: (entries: any[]) => void) {
      observers.push(this as any);
    }
    observe(el: Element) {
      this.observed.push(el);
    }
    unobserve() {}
    disconnect() {
      this.disconnected = true;
    }
  };
});
afterEach(() => {
  (globalThis as any).ResizeObserver = originalRO;
  heightSpies.forEach((s) => s.mockRestore());
  heightSpies = [];
});

/** jsdom has no layout: make every element report the given offsetHeight / scrollHeight */
function mockLayout(height: number) {
  heightSpies.push(vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height));
  heightSpies.push(vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(height));
}

const content = () => h('div', { class: 'inner' }, 'content');

describe('Collapsible', () => {
  it('renders wrapper + inner container, collapsed by default (no children rendered)', () => {
    const w = mount(Collapsible, { slots: { default: content } });
    expect(w.classes()).toContain('semi-collapsible-wrapper');
    expect(w.classes()).not.toContain('semi-collapsible-transition');
    const el = w.element as HTMLElement;
    expect(el.style.overflow).toBe('hidden');
    expect(el.style.height).toBe('0px');
    expect(el.style.opacity).toBe('1');
    expect(el.style.transitionDuration).toBe('0ms');
    const inner = w.find('[x-semi-prop="children"]');
    expect(inner.exists()).toBe(true);
    expect((inner.element as HTMLElement).style.overflow).toBe('hidden');
    expect(w.find('.inner').exists()).toBe(false);
  });

  it('isOpen renders children and uses the measured DOM height', async () => {
    mockLayout(120);
    const w = mount(Collapsible, { props: { isOpen: true }, slots: { default: content } });
    await nextTick();
    expect(w.find('.inner').exists()).toBe(true);
    expect((w.element as HTMLElement).style.height).toBe('120px');
  });

  it('observes the inner container with ResizeObserver and disconnects on unmount', async () => {
    const w = mount(Collapsible, { props: { isOpen: true }, slots: { default: content } });
    expect(observers).toHaveLength(1);
    expect(observers[0].observed[0]).toBe(w.find('[x-semi-prop="children"]').element);
    w.unmount();
    expect(observers[0].disconnected).toBe(true);
  });

  it('resize entries update the height (borderBoxSize and contentRect fallbacks)', async () => {
    mockLayout(10);
    const w = mount(Collapsible, { props: { isOpen: true }, slots: { default: content } });
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('10px');
    observers[0].cb([{ borderBoxSize: [{ blockSize: 77.2, inlineSize: 100 }], target: w.find('[x-semi-prop="children"]').element }]);
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('78px');
    const target = { clientHeight: 33 };
    observers[0].cb([{ contentRect: { height: 33, width: 10 }, target }]);
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('33px');
  });

  it('getEntryInfo detects display:none (0x0) as not in render tree', () => {
    expect(getEntryInfo({ borderBoxSize: [{ blockSize: 0, inlineSize: 0 }] } as any)).toEqual({ isShown: false, height: 0 });
    expect(getEntryInfo({ contentRect: { height: 0, width: 0 }, target: { clientHeight: 0 } } as any)).toEqual({ isShown: false, height: 0 });
    expect(getEntryInfo({ borderBoxSize: [{ blockSize: 10.1, inlineSize: 5 }] } as any)).toEqual({ isShown: true, height: 11 });
  });

  it('opening with motion: transition class + duration, children rendered; closing keeps DOM until transitionend, then emits motionEnd', async () => {
    mockLayout(50);
    const w = mount(Collapsible, { props: { isOpen: false, duration: 300 }, slots: { default: content } });
    expect(w.find('.inner').exists()).toBe(false);
    await w.setProps({ isOpen: true });
    expect(w.classes()).toContain('semi-collapsible-transition');
    expect((w.element as HTMLElement).style.transitionDuration).toBe('300ms');
    expect((w.element as HTMLElement).style.height).toBe('50px');
    expect(w.find('.inner').exists()).toBe(true);
    await w.trigger('transitionend');
    expect(w.classes()).not.toContain('semi-collapsible-transition');
    expect((w.element as HTMLElement).style.transitionDuration).toBe('0ms');
    expect(w.emitted('motionEnd')).toHaveLength(1);
    expect(w.find('.inner').exists()).toBe(true);
    // close
    await w.setProps({ isOpen: false });
    expect(w.classes()).toContain('semi-collapsible-transition');
    expect((w.element as HTMLElement).style.height).toBe('0px');
    // still visible while transitioning
    expect(w.find('.inner').exists()).toBe(true);
    await w.trigger('transitionend');
    expect(w.find('.inner').exists()).toBe(false);
    expect(w.emitted('motionEnd')).toHaveLength(2);
  });

  it('motion=false: no transition class, children removed immediately on close', async () => {
    const w = mount(Collapsible, { props: { isOpen: true, motion: false }, slots: { default: content } });
    expect(w.find('.inner').exists()).toBe(true);
    await w.setProps({ isOpen: false });
    expect(w.classes()).not.toContain('semi-collapsible-transition');
    expect((w.element as HTMLElement).style.transitionDuration).toBe('0ms');
    expect(w.find('.inner').exists()).toBe(false);
  });

  it('keepDOM keeps children rendered while collapsed', () => {
    const w = mount(Collapsible, { props: { keepDOM: true }, slots: { default: content } });
    expect(w.find('.inner').exists()).toBe(true);
    expect((w.element as HTMLElement).style.height).toBe('0px');
  });

  it('keepDOM + lazyRender only keeps DOM after it has been rendered once', async () => {
    const w = mount(Collapsible, { props: { keepDOM: true, lazyRender: true }, slots: { default: content } });
    expect(w.find('.inner').exists()).toBe(false);
    await w.setProps({ isOpen: true });
    expect(w.find('.inner').exists()).toBe(true);
    await w.setProps({ isOpen: false, motion: false });
    await nextTick();
    expect(w.find('.inner').exists()).toBe(true);
  });

  it('collapseHeight keeps a partial height and renders children', () => {
    const w = mount(Collapsible, { props: { collapseHeight: 40 }, slots: { default: content } });
    expect((w.element as HTMLElement).style.height).toBe('40px');
    expect(w.find('.inner').exists()).toBe(true);
  });

  it('collapseHeightAdaptive limits collapseHeight to the content height', async () => {
    mockLayout(20);
    const w = mount(Collapsible, { props: { collapseHeight: 40, collapseHeightAdaptive: true }, slots: { default: content } });
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('20px');
  });

  it('fade sets opacity 0 when closed with collapseHeight 0', async () => {
    const w = mount(Collapsible, { props: { fade: true }, slots: { default: content } });
    expect((w.element as HTMLElement).style.opacity).toBe('0');
    await w.setProps({ isOpen: true });
    expect((w.element as HTMLElement).style.opacity).toBe('1');
    const partial = mount(Collapsible, { props: { fade: true, collapseHeight: 10 } });
    expect((partial.element as HTMLElement).style.opacity).toBe('1');
  });

  it('reCalcKey change re-measures scrollHeight', async () => {
    const w = mount(Collapsible, { props: { isOpen: true, reCalcKey: 1 }, slots: { default: content } });
    await nextTick();
    mockLayout(99);
    await w.setProps({ reCalcKey: 2 });
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('99px');
  });

  it('entering the render tree via resize re-measures scrollHeight', async () => {
    const w = mount(Collapsible, { props: { isOpen: true }, slots: { default: content } });
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('0px');
    mockLayout(64);
    observers[0].cb([{ borderBoxSize: [{ blockSize: 10, inlineSize: 10 }] }]);
    await nextTick();
    await nextTick();
    expect((w.element as HTMLElement).style.height).toBe('64px');
  });

  it('id is set on the inner container; class / style / data attrs on the wrapper; other attrs dropped', () => {
    const w = mount(Collapsible, { props: { id: 'panel-1' }, attrs: { class: 'c', style: { margin: '1px' }, 'data-x': 'y', title: 'nope' } });
    expect(w.find('[x-semi-prop="children"]').attributes('id')).toBe('panel-1');
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('margin: 1px');
    expect(w.attributes('data-x')).toBe('y');
    expect(w.attributes('title')).toBeUndefined();
  });

  it('duration prop drives transition-duration only while transitioning', async () => {
    const w = mount(Collapsible, { props: { duration: 500 } });
    expect((w.element as HTMLElement).style.transitionDuration).toBe('0ms');
    await w.setProps({ isOpen: true });
    expect((w.element as HTMLElement).style.transitionDuration).toBe('500ms');
  });
});
