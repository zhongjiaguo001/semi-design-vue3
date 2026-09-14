import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverflowList } from './index';

/* ---------- controllable observer mocks ---------- */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  targets = new Set<Element>();
  constructor(public cb: (entries: any[]) => void) {
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
}
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  targets = new Set<Element>();
  constructor(public cb: (entries: any[]) => void, public options: any) {
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords() {
    return [];
  }
}

const setWidth = (el: Element, width: number) => Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width });

/** fire resize entries for every observed element of every observer */
const fireResize = (widths: (el: Element) => number | undefined) => {
  for (const ro of MockResizeObserver.instances) {
    const entries: any[] = [];
    for (const el of ro.targets) {
      const w = widths(el);
      if (w === undefined) continue;
      setWidth(el, w);
      entries.push({ target: el, contentRect: { width: w, height: 10 } });
    }
    if (entries.length) ro.cb(entries);
  }
};

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `k${i}`, label: `item ${i}` }));
const visibleItemRenderer = (item: any) => h('span', { class: 'vis-item', 'data-key': item.key }, item.label);
const overflowRenderer = (overflow: any[]) => (overflow.length ? h('span', { class: 'more' }, `+${overflow.length}`) : null);

const flush = async () => {
  await flushPromises();
  await nextTick();
  await nextTick();
};

/** container 100px, each item 30px, overflow button 20px */
async function layout(wrapper: any, { container = 100, item = 30, overflow = 20 } = {}) {
  fireResize((el) => {
    if (el.classList.contains('semi-overflow-list')) return container;
    if (el.classList.contains('semi-overflow-list-item')) return item;
    if (el.classList.contains('semi-overflow-list-overflow')) return overflow;
    return undefined;
  });
  await flush();
  // second pass: overflow button might have been rendered after first calculation
  fireResize((el) => {
    if (el.classList.contains('semi-overflow-list-item')) return item;
    if (el.classList.contains('semi-overflow-list-overflow')) return overflow;
    return undefined;
  });
  await flush();
}

describe('OverflowList', () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('renders all items in collapse mode initially (hidden while calculating)', () => {
    const wrapper = mount(OverflowList, { props: { items: items(3), visibleItemRenderer, overflowRenderer } });
    expect(wrapper.classes()).toContain('semi-overflow-list');
    expect(wrapper.findAll('.semi-overflow-list-item')).toHaveLength(3);
    expect(wrapper.findAll('.vis-item').map((w) => w.text())).toEqual(['item 0', 'item 1', 'item 2']);
    expect(wrapper.attributes('style')).toContain('max-width: 100%');
    expect(wrapper.attributes('style')).toContain('visibility: hidden');
    expect(wrapper.find('.semi-overflow-list-overflow').exists()).toBe(false);
  });

  it('className / class / style / wrapperClassName attrs', () => {
    const wrapper = mount(OverflowList, {
      props: { items: items(2), visibleItemRenderer, className: 'a', class: 'b', style: { color: 'red' }, renderMode: 'scroll', wrapperClassName: 'wc', wrapperStyle: { padding: '1px' } },
    });
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('color: red');
    const sw = wrapper.find('.semi-overflow-list-scroll-wrapper');
    expect(sw.classes()).toContain('wc');
    expect(sw.attributes('style')).toContain('padding: 1px');
  });

  it('no overflow when everything fits: visibility visible, all items, no overflow node', async () => {
    const onOverflow = vi.fn();
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(3), visibleItemRenderer, overflowRenderer, onOverflow } });
    await layout(wrapper, { container: 200 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(3);
    expect(wrapper.find('.more').exists()).toBe(false);
    expect(wrapper.attributes('style')).toContain('visibility: visible');
    expect(onOverflow).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('collapses from end when items overflow and emits overflow(items)', async () => {
    const onOverflow = vi.fn();
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(5), visibleItemRenderer, overflowRenderer, onOverflow } });
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    // 20 (overflow) + 30 + 30 = 80 <= 100, + 30 = 110 > 100 -> pivot 2
    expect(wrapper.findAll('.vis-item').map((w) => w.text())).toEqual(['item 0', 'item 1']);
    expect(wrapper.find('.more').text()).toBe('+3');
    // overflow rendered at the end
    const children = Array.from(wrapper.element.children as HTMLCollection) as HTMLElement[];
    expect(children[children.length - 1].classList.contains('semi-overflow-list-overflow')).toBe(true);
    expect(onOverflow).toHaveBeenCalled();
    const overflowArg = onOverflow.mock.calls[onOverflow.mock.calls.length - 1][0];
    expect(overflowArg.map((i: any) => i.key)).toEqual(['k2', 'k3', 'k4']);
    expect(wrapper.emitted('overflow')).toBeTruthy();
    expect(wrapper.attributes('style')).toContain('visibility: visible');
    wrapper.unmount();
  });

  it('collapseFrom=start renders overflow first and keeps the tail visible', async () => {
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(5), visibleItemRenderer, overflowRenderer, collapseFrom: 'start' } });
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item').map((w) => w.text())).toEqual(['item 3', 'item 4']);
    expect((wrapper.element.children[0] as HTMLElement).classList.contains('semi-overflow-list-overflow')).toBe(true);
    const last = wrapper.emitted('overflow')!.pop()![0] as any[];
    expect(last.map((i) => i.key)).toEqual(['k0', 'k1', 'k2']);
    wrapper.unmount();
  });

  it('minVisibleItems keeps at least N items visible', async () => {
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(5), visibleItemRenderer, overflowRenderer, minVisibleItems: 4 } });
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(4);
    expect(wrapper.find('.more').text()).toBe('+1');
    wrapper.unmount();
  });

  it('recalculates when items change', async () => {
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(5), visibleItemRenderer, overflowRenderer } });
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(2);
    await wrapper.setProps({ items: items(2) });
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(2);
    expect(wrapper.find('.more').exists()).toBe(false);
    wrapper.unmount();
  });

  it('recalculates when the container shrinks', async () => {
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(4), visibleItemRenderer, overflowRenderer } });
    await layout(wrapper, { container: 200, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(4);
    await layout(wrapper, { container: 70, item: 30, overflow: 20 });
    expect(wrapper.findAll('.vis-item')).toHaveLength(1);
    expect(wrapper.find('.more').text()).toBe('+3');
    wrapper.unmount();
  });

  it('itemKey (string / function) is used for keys', async () => {
    const data = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const wrapper = mount(OverflowList, { props: { items: data, itemKey: 'id', visibleItemRenderer: (i: any) => h('i', i.label) } });
    expect(wrapper.findAll('.semi-overflow-list-item')).toHaveLength(2);
    const wrapper2 = mount(OverflowList, { props: { items: data, itemKey: (i: any) => i.id, visibleItemRenderer: (i: any) => h('i', i.label) } });
    expect(wrapper2.findAll('.semi-overflow-list-item')).toHaveLength(2);
  });

  it('item / overflow slots override the renderer props', async () => {
    const wrapper = mount(OverflowList, {
      attachTo: document.body,
      props: { items: items(5) },
      slots: {
        item: ({ item, index }: any) => h('b', { class: 'slot-item' }, `${index}:${item.label}`),
        overflow: (overflow: any[]) => h('u', { class: 'slot-more' }, String(overflow.length)),
      },
    });
    expect(wrapper.findAll('.slot-item')[1].text()).toBe('1:item 1');
    await layout(wrapper, { container: 100, item: 30, overflow: 20 });
    expect(wrapper.find('.slot-more').text()).toBe('3');
    wrapper.unmount();
  });

  it('default renderers render nothing', () => {
    const wrapper = mount(OverflowList, { props: { items: items(2) } });
    expect(wrapper.findAll('.semi-overflow-list-item')).toHaveLength(2);
    expect(wrapper.find('.semi-overflow-list-item').text()).toBe('');
  });

  it('unmount disconnects observers', async () => {
    const wrapper = mount(OverflowList, { attachTo: document.body, props: { items: items(3), visibleItemRenderer, overflowRenderer } });
    await flush();
    const observers = [...MockResizeObserver.instances];
    expect(observers.length).toBeGreaterThan(0);
    wrapper.unmount();
    observers.forEach((o) => expect(o.targets.size).toBe(0));
  });

  describe('scroll mode', () => {
    const scrollOverflowRenderer = (overflow: any[][]) => [
      h('span', { class: 'start-more', key: 's' }, String(overflow[0].length)),
      h('span', { class: 'end-more', key: 'e' }, String(overflow[1].length)),
    ];

    it('renders scroll wrapper with data-scrollkey items and observes them with the threshold', async () => {
      const wrapper = mount(OverflowList, {
        attachTo: document.body,
        props: { items: items(4), renderMode: 'scroll', threshold: 0.5, visibleItemRenderer, overflowRenderer: scrollOverflowRenderer },
      });
      await flush();
      const sw = wrapper.find('.semi-overflow-list-scroll-wrapper');
      expect(sw.exists()).toBe(true);
      const nodes = sw.findAll('.vis-item');
      expect(nodes).toHaveLength(4);
      expect(nodes[2].attributes('data-scrollkey')).toBe('k2');
      expect(wrapper.attributes('style') || '').not.toContain('max-width');
      const io = MockIntersectionObserver.instances[0];
      expect(io).toBeTruthy();
      expect(io.options.threshold).toBe(0.5);
      expect(io.options.root).toBe(sw.element);
      expect(io.targets.size).toBe(4);
      // overflowRenderDirection=both: start before wrapper, end after
      const children = Array.from(wrapper.element.children as HTMLCollection) as HTMLElement[];
      expect(children[0].classList.contains('start-more')).toBe(true);
      expect(children[children.length - 1].classList.contains('end-more')).toBe(true);
      expect(wrapper.find('.start-more').text()).toBe('0');
      wrapper.unmount();
    });

    it.each([
      ['start', ['start-more', 'end-more', 'semi-overflow-list-scroll-wrapper']],
      ['end', ['semi-overflow-list-scroll-wrapper', 'start-more', 'end-more']],
    ])('overflowRenderDirection=%s', (dir, order) => {
      const wrapper = mount(OverflowList, {
        props: { items: items(2), renderMode: 'scroll', visibleItemRenderer, overflowRenderer: scrollOverflowRenderer, overflowRenderDirection: dir as any },
      });
      const classes = (Array.from(wrapper.element.children as HTMLCollection) as HTMLElement[]).map((c) => c.classList[0]);
      expect(classes).toEqual(order);
    });

    it('intersection entries update overflow lists and emit intersect / visibleStateChange', async () => {
      const onIntersect = vi.fn();
      const wrapper = mount(OverflowList, {
        attachTo: document.body,
        props: { items: items(4), renderMode: 'scroll', visibleItemRenderer, overflowRenderer: scrollOverflowRenderer, onIntersect },
      });
      await flush();
      const io = MockIntersectionObserver.instances[0];
      const targets = Array.from(io.targets) as HTMLElement[];
      const entry = (el: HTMLElement, isIntersecting: boolean) => ({ target: el, isIntersecting, boundingClientRect: { y: 0 } });
      io.cb([entry(targets[0], false), entry(targets[1], true), entry(targets[2], true), entry(targets[3], false)]);
      await flush();
      expect(wrapper.find('.start-more').text()).toBe('1');
      expect(wrapper.find('.end-more').text()).toBe('1');
      expect(onIntersect).toHaveBeenCalledTimes(1);
      expect(Object.keys(onIntersect.mock.calls[0][0])).toEqual(['k0', 'k1', 'k2', 'k3']);
      expect(wrapper.emitted('intersect')).toHaveLength(1);
      const vs = wrapper.emitted('visibleStateChange')![0][0] as Map<string, boolean>;
      expect(vs.get('k1')).toBe(true);
      expect(vs.get('k0')).toBe(false);
      expect((wrapper.vm as any).getOverflowItem()[0].map((i: any) => i.key)).toEqual(['k0']);
      wrapper.unmount();
    });

    it('keeps last overflow while the whole list is scrolled out vertically', async () => {
      const wrapper = mount(OverflowList, {
        attachTo: document.body,
        props: { items: items(3), renderMode: 'scroll', visibleItemRenderer, overflowRenderer: scrollOverflowRenderer },
      });
      await flush();
      const io = MockIntersectionObserver.instances[0];
      const t = Array.from(io.targets) as HTMLElement[];
      io.cb([
        { target: t[0], isIntersecting: false, boundingClientRect: { y: 0 } },
        { target: t[1], isIntersecting: true, boundingClientRect: { y: 0 } },
        { target: t[2], isIntersecting: true, boundingClientRect: { y: 0 } },
      ]);
      await flush();
      expect(wrapper.find('.start-more').text()).toBe('1');
      // list scrolled out vertically -> ignored
      io.cb([
        { target: t[0], isIntersecting: false, boundingClientRect: { y: 500 } },
        { target: t[1], isIntersecting: false, boundingClientRect: { y: 500 } },
        { target: t[2], isIntersecting: false, boundingClientRect: { y: 500 } },
      ]);
      await flush();
      expect(wrapper.find('.start-more').text()).toBe('1');
      expect(wrapper.emitted('intersect')).toHaveLength(1);
      wrapper.unmount();
    });

    it('re-observes when items change', async () => {
      const wrapper = mount(OverflowList, {
        attachTo: document.body,
        props: { items: items(2), renderMode: 'scroll', visibleItemRenderer, overflowRenderer: scrollOverflowRenderer },
      });
      await flush();
      const io = MockIntersectionObserver.instances[0];
      expect(io.targets.size).toBe(2);
      await wrapper.setProps({ items: items(3) });
      await flush();
      expect(io.targets.size).toBe(3);
      expect(wrapper.findAll('.vis-item')).toHaveLength(3);
      wrapper.unmount();
    });
  });

  it('elementType static', () => {
    expect((OverflowList as any).elementType).toBe('OverflowList');
  });
});

describe('OverflowList parity extras', () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('accepts direction / collapseMask (React propTypes pass-through) without leaking them to the DOM', () => {
    const wrapper = mount(OverflowList, {
      props: { items: items(2), visibleItemRenderer, overflowRenderer, direction: 'horizontal', collapseMask: { a: 1 } } as any,
      attachTo: document.body,
    });
    const root = wrapper.find('.semi-overflow-list');
    expect(root.exists()).toBe(true);
    expect(root.attributes('direction')).toBeUndefined();
    expect(root.attributes('collapsemask')).toBeUndefined();
    expect((wrapper.vm as any).$props.collapseMask).toEqual({ a: 1 });
    wrapper.unmount();
  });

  it('scroll mode applies wrapperStyle and wrapperClassName on the scroll wrapper only', () => {
    const wrapper = mount(OverflowList, {
      props: { items: items(2), renderMode: 'scroll', visibleItemRenderer, overflowRenderer: () => [null, null], wrapperClassName: 'wc', wrapperStyle: { padding: '4px' } } as any,
      attachTo: document.body,
    });
    const w = wrapper.find('.semi-overflow-list-scroll-wrapper');
    expect(w.classes()).toContain('wc');
    expect((w.element as HTMLElement).style.padding).toBe('4px');
    expect(wrapper.find('.semi-overflow-list').classes()).not.toContain('wc');
    wrapper.unmount();
  });
});
