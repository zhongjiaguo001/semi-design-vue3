import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Layout, { Header, Footer, Content, Sider } from './index';
import ConfigProvider from '../configProvider';

function mockMatchMedia(initial: Record<string, boolean> = {}) {
  const lists = new Map<string, { matches: boolean; listeners: Set<(e: any) => void> }>();
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => {
    if (!lists.has(query)) lists.set(query, { matches: Boolean(initial[query]), listeners: new Set() });
    const entry = lists.get(query)!;
    return {
      get matches() {
        return entry.matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: any) => void) => entry.listeners.add(cb),
      removeEventListener: (_: string, cb: (e: any) => void) => entry.listeners.delete(cb),
      addListener: (cb: (e: any) => void) => entry.listeners.add(cb),
      removeListener: (cb: (e: any) => void) => entry.listeners.delete(cb),
      dispatchEvent: () => false,
    };
  }) as any;
  return {
    set(query: string, matches: boolean) {
      const entry = lists.get(query);
      if (!entry) return;
      entry.matches = matches;
      entry.listeners.forEach((cb) => cb({ matches, media: query }));
    },
    listenerCount(query: string) {
      return lists.get(query)?.listeners.size ?? 0;
    },
    queries() {
      return Array.from(lists.keys());
    },
    restore() {
      window.matchMedia = original;
    },
  };
}

describe('Layout', () => {
  it('renders a section.semi-layout with children', () => {
    const w = mount(Layout, { slots: { default: () => h('span', 'body') } });
    expect(w.element.tagName).toBe('SECTION');
    expect(w.classes()).toContain('semi-layout');
    expect(w.classes()).not.toContain('semi-layout-has-sider');
    expect(w.text()).toBe('body');
  });

  it('tagName prop changes the root tag', () => {
    const w = mount(Layout, { props: { tagName: 'div' } });
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain('semi-layout');
  });

  it('class / style / attrs pass through', () => {
    const w = mount(Layout, { attrs: { class: 'c', style: { height: '100px' }, id: 'l1', 'data-a': 'b' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('height: 100px');
    expect(w.attributes('id')).toBe('l1');
    expect(w.attributes('data-a')).toBe('b');
  });

  it('prefixCls', () => {
    const w = mount(Layout, { props: { prefixCls: 'my', hasSider: true } });
    expect(w.classes()).toContain('my');
    expect(w.classes()).toContain('my-has-sider');
  });

  it('hasSider prop forces has-sider class', () => {
    expect(mount(Layout, { props: { hasSider: true } }).classes()).toContain('semi-layout-has-sider');
    expect(mount(Layout, { props: { hasSider: false } }).classes()).not.toContain('semi-layout-has-sider');
  });

  it('detects a direct Sider child (elementType) synchronously', () => {
    const w = mount(Layout, { slots: { default: () => [h(Sider, null, () => 'side'), h(Content, null, () => 'c')] } });
    expect(w.classes()).toContain('semi-layout-has-sider');
  });

  it('detects a nested Sider through the sider hook and updates on unmount', async () => {
    const show = ref(true);
    const Parent = defineComponent({
      setup() {
        return () => h(Layout, null, () => [h('div', [show.value ? h(Sider, null, () => 'side') : null]), h(Content)]);
      },
    });
    const w = mount(Parent);
    await nextTick();
    expect(w.find('.semi-layout').classes()).toContain('semi-layout-has-sider');
    show.value = false;
    await nextTick();
    await nextTick();
    expect(w.find('.semi-layout').classes()).not.toContain('semi-layout-has-sider');
  });

  it('exposes static sub components', () => {
    expect(Layout.Header).toBe(Header);
    expect(Layout.Footer).toBe(Footer);
    expect(Layout.Content).toBe(Content);
    expect(Layout.Sider).toBe(Sider);
    expect((Layout as any).elementType).toBe('Layout');
  });
});

describe('Header / Footer / Content', () => {
  it.each([
    [Header, 'HEADER', 'semi-layout-header', 'Layout.Header'],
    [Footer, 'FOOTER', 'semi-layout-footer', 'Layout.Footer'],
    [Content, 'MAIN', 'semi-layout-content', 'Layout.Content'],
  ] as const)('%o renders %s.%s', (Comp, tag, cls, elementType) => {
    const w = mount(Comp as any, { slots: { default: () => 'txt' } });
    expect(w.element.tagName).toBe(tag);
    expect(w.classes()).toContain(cls);
    expect(w.text()).toBe('txt');
    expect((Comp as any).elementType).toBe(elementType);
  });

  it('role / aria-label props and attrs pass through', () => {
    const w = mount(Header, { props: { role: 'banner', ariaLabel: 'top' }, attrs: { class: 'x', style: { color: 'red' }, id: 'h', 'data-k': 'v' } });
    expect(w.attributes('role')).toBe('banner');
    expect(w.attributes('aria-label')).toBe('top');
    expect(w.classes()).toContain('x');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('id')).toBe('h');
    expect(w.attributes('data-k')).toBe('v');
    const w2 = mount(Footer, { attrs: { role: 'contentinfo', 'aria-label': 'bottom' } });
    expect(w2.attributes('role')).toBe('contentinfo');
    expect(w2.attributes('aria-label')).toBe('bottom');
  });

  it('prefixCls', () => {
    expect(mount(Content, { props: { prefixCls: 'my' } }).classes()).toContain('my-content');
  });
});

describe('Sider', () => {
  let mm: ReturnType<typeof mockMatchMedia> | undefined;
  afterEach(() => {
    mm?.restore();
    mm = undefined;
  });

  it('renders aside.semi-layout-sider with children wrapper', () => {
    const w = mount(Sider, { slots: { default: () => 'menu' } });
    expect(w.element.tagName).toBe('ASIDE');
    expect(w.classes()).toContain('semi-layout-sider');
    const inner = w.find('.semi-layout-sider-children');
    expect(inner.exists()).toBe(true);
    expect(inner.text()).toBe('menu');
    expect((Sider as any).elementType).toBe('Layout.Sider');
  });

  it('class / style / aria-label / role / data attrs; other attrs are dropped', () => {
    const w = mount(Sider, { props: { ariaLabel: 'nav', role: 'navigation' }, attrs: { class: 'c', style: { width: '200px' }, 'data-a': '1', id: 'nope' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('width: 200px');
    expect(w.attributes('aria-label')).toBe('nav');
    expect(w.attributes('role')).toBe('navigation');
    expect(w.attributes('data-a')).toBe('1');
    expect(w.attributes('id')).toBeUndefined();
    const w2 = mount(Sider, { attrs: { 'aria-label': 'x', role: 'complementary' } });
    expect(w2.attributes('aria-label')).toBe('x');
    expect(w2.attributes('role')).toBe('complementary');
  });

  it('prefixCls', () => {
    const w = mount(Sider, { props: { prefixCls: 'my' } });
    expect(w.classes()).toContain('my-sider');
    expect(w.find('.my-sider-children').exists()).toBe(true);
  });

  it('breakpoint: registers only listed media queries and emits breakpoint on init and change', async () => {
    mm = mockMatchMedia({ '(min-width: 992px)': true });
    const w = mount(Sider, { props: { breakpoint: ['lg', 'md'] } });
    await nextTick();
    expect(mm.queries().sort()).toEqual(['(min-width: 768px)', '(min-width: 992px)']);
    // callInInit -> immediate emits
    const emitted = w.emitted('breakpoint')!;
    expect(emitted).toContainEqual(['md', false]);
    expect(emitted).toContainEqual(['lg', true]);
    mm.set('(min-width: 768px)', true);
    expect(w.emitted('breakpoint')!.at(-1)).toEqual(['md', true]);
    mm.set('(min-width: 992px)', false);
    expect(w.emitted('breakpoint')!.at(-1)).toEqual(['lg', false]);
    w.unmount();
    expect(mm.listenerCount('(min-width: 992px)')).toBe(0);
    expect(mm.listenerCount('(min-width: 768px)')).toBe(0);
  });

  it('no breakpoint prop registers nothing', async () => {
    mm = mockMatchMedia();
    mount(Sider);
    await nextTick();
    expect(mm.queries()).toEqual([]);
  });

  it('uses ConfigProvider responsiveMap for breakpoints', async () => {
    mm = mockMatchMedia({ '(min-width: 5000px)': true });
    const hits: any[] = [];
    mount(ConfigProvider, {
      props: { responsiveMap: { xl: '(min-width: 5000px)' } },
      slots: { default: () => h(Sider, { breakpoint: ['xl'], onBreakpoint: (s: string, m: boolean) => hits.push([s, m]) }) },
    });
    await nextTick();
    expect(mm.queries()).toEqual(['(min-width: 5000px)']);
    expect(hits).toEqual([['xl', true]]);
  });

  it('registers itself in a wrapping Layout', async () => {
    const w = mount(Layout, { slots: { default: () => h('div', [h(Sider)]) } });
    await nextTick();
    expect(w.classes()).toContain('semi-layout-has-sider');
  });

  it('works without a Layout (default noop hook)', () => {
    expect(() => mount(Sider)).not.toThrow();
  });
});
