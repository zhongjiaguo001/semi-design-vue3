import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ConfigProvider, { ConfigConsumer, defaultResponsiveMap, semiGlobal, getDefaultPropsFromGlobalConfig, useConfigContext } from './index';
import type { ContextValue } from './index';

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
    restore() {
      window.matchMedia = original;
    },
  };
}

/** child that renders the injected direction */
const Probe = defineComponent({
  setup() {
    const ctx = useConfigContext();
    return () => h('span', { class: 'probe' }, ctx.direction);
  },
});

let lastCtx: ContextValue | null = null;
const Capture = defineComponent({
  setup() {
    lastCtx = useConfigContext();
    return () => h('i');
  },
});

afterEach(() => {
  lastCtx = null;
  semiGlobal.config = {};
});

describe('ConfigProvider', () => {
  it('renders children without wrapper by default (direction ltr)', () => {
    const w = mount(ConfigProvider, { slots: { default: () => h(Probe) } });
    expect(w.find('.semi-rtl').exists()).toBe(false);
    expect(w.find('.probe').text()).toBe('ltr');
  });

  it('direction=rtl wraps children in .semi-rtl and passes direction through context', () => {
    const w = mount(ConfigProvider, { props: { direction: 'rtl' }, slots: { default: () => h(Probe) } });
    expect(w.find('.semi-rtl').exists()).toBe(true);
    expect(w.find('.probe').text()).toBe('rtl');
  });

  it('provides locale (default zh_CN), timeZone and getPopupContainer', () => {
    const container = () => document.body;
    mount(ConfigProvider, { props: { timeZone: 'GMT+08:00', getPopupContainer: container }, slots: { default: () => h(Capture) } });
    expect(lastCtx!.timeZone).toBe('GMT+08:00');
    expect(lastCtx!.getPopupContainer).toBe(container);
    expect(lastCtx!.locale?.code).toBe('zh-CN');
    expect(lastCtx!.responsiveMap).toEqual(defaultResponsiveMap);
    expect(typeof lastCtx!.onBreakpoint).toBe('function');
    expect(lastCtx!.screens).toEqual({ xs: false, sm: false, md: false, lg: false, xl: false, xxl: false });
  });

  it('custom locale is provided', () => {
    const locale = { code: 'en-US', Modal: { confirm: 'ok' } } as any;
    mount(ConfigProvider, { props: { locale }, slots: { default: () => h(Capture) } });
    expect(lastCtx!.locale).toEqual(locale);
  });

  it('context updates reactively when props change', async () => {
    const w = mount(ConfigProvider, { props: { timeZone: 1 }, slots: { default: () => h(Capture) } });
    expect(lastCtx!.timeZone).toBe(1);
    await w.setProps({ timeZone: 'Asia/Shanghai', direction: 'rtl' });
    await nextTick();
    expect(lastCtx!.timeZone).toBe('Asia/Shanghai');
    expect(lastCtx!.direction).toBe('rtl');
    expect(w.find('.semi-rtl').exists()).toBe(true);
  });

  it('nested providers inherit from parent', () => {
    mount(ConfigProvider, {
      props: { timeZone: 'GMT+08:00', direction: 'rtl' },
      slots: { default: () => h(ConfigProvider, { getPopupContainer: () => document.body }, { default: () => h(Capture) }) },
    });
    expect(lastCtx!.timeZone).toBe('GMT+08:00');
    expect(lastCtx!.direction).toBe('rtl');
    expect(typeof lastCtx!.getPopupContainer).toBe('function');
  });

  it('exposes static defaultResponsiveMap', () => {
    expect((ConfigProvider as any).defaultResponsiveMap).toBe(defaultResponsiveMap);
    expect(defaultResponsiveMap.md).toBe('(min-width: 768px)');
  });

  describe('responsive observing', () => {
    it('does not register matchMedia listeners when responsiveObserve is off and warns', () => {
      const mm = mockMatchMedia();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mount(ConfigProvider, { slots: { default: () => h(Capture) } });
      const cb = vi.fn();
      const unsub = lastCtx!.onBreakpoint!(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(0);
      expect(warn).toHaveBeenCalled();
      unsub();
      warn.mockRestore();
      mm.restore();
    });

    it('registers lazily on first subscription, calls back immediately with current screens, and notifies on change', async () => {
      const mm = mockMatchMedia({ [defaultResponsiveMap.md]: true });
      mount(ConfigProvider, { props: { responsiveObserve: true }, slots: { default: () => h(Capture) } });
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(0);
      const cb = vi.fn();
      const unsub = lastCtx!.onBreakpoint!(cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({ md: true, xs: false });
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(1);
      mm.set(defaultResponsiveMap.lg, true);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb.mock.calls[1][0]).toMatchObject({ md: true, lg: true });
      expect(lastCtx!.screens!.lg).toBe(true);
      unsub();
      // no subscribers -> listeners removed
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(0);
      mm.restore();
    });

    it('supports onBreakpoint(breakpoints, cb) signature', () => {
      const mm = mockMatchMedia({ [defaultResponsiveMap.md]: true });
      mount(ConfigProvider, { props: { responsiveObserve: true }, slots: { default: () => h(Capture) } });
      const cb = vi.fn();
      const unsub = lastCtx!.onBreakpoint!(['md', 'lg'], cb);
      expect(cb).toHaveBeenCalledWith('md', true);
      expect(cb).toHaveBeenCalledWith('lg', false);
      cb.mockClear();
      mm.set(defaultResponsiveMap.xl, true);
      expect(cb).not.toHaveBeenCalled();
      mm.set(defaultResponsiveMap.lg, true);
      expect(cb).toHaveBeenCalledWith('lg', true);
      unsub();
      mm.restore();
    });

    it('uses a custom responsiveMap and re-registers when it changes', async () => {
      const map1 = { ...defaultResponsiveMap, md: '(min-width: 700px)' };
      const map2 = { ...defaultResponsiveMap, md: '(min-width: 800px)' };
      const mm = mockMatchMedia();
      const w = mount(ConfigProvider, { props: { responsiveObserve: true, responsiveMap: map1 }, slots: { default: () => h(Capture) } });
      expect(lastCtx!.responsiveMap).toEqual(map1);
      const unsub = lastCtx!.onBreakpoint!(() => {});
      expect(mm.listenerCount(map1.md)).toBe(1);
      await w.setProps({ responsiveMap: map2 });
      await nextTick();
      expect(mm.listenerCount(map1.md)).toBe(0);
      expect(mm.listenerCount(map2.md)).toBe(1);
      expect(lastCtx!.responsiveMap).toEqual(map2);
      unsub();
      mm.restore();
    });

    it('unregisters when responsiveObserve toggles off and on unmount', async () => {
      const mm = mockMatchMedia();
      const w = mount(ConfigProvider, { props: { responsiveObserve: true }, slots: { default: () => h(Capture) } });
      lastCtx!.onBreakpoint!(() => {});
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(1);
      await w.setProps({ responsiveObserve: false });
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(0);
      await w.setProps({ responsiveObserve: true });
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(1);
      w.unmount();
      expect(mm.listenerCount(defaultResponsiveMap.md)).toBe(0);
      mm.restore();
    });
  });
});

describe('ConfigConsumer', () => {
  it('passes the context value to its default scoped slot', async () => {
    const tz = ref('GMT+08:00');
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(ConfigProvider, { timeZone: tz.value, direction: 'rtl' }, {
              default: () => h(ConfigConsumer, null, { default: (v: ContextValue) => h('b', v.timeZone + '|' + v.direction) }),
            });
        },
      })
    );
    expect(w.find('b').text()).toBe('GMT+08:00|rtl');
    tz.value = 'GMT+00:00';
    await nextTick();
    expect(w.find('b').text()).toBe('GMT+00:00|rtl');
  });

  it('works outside a provider (empty context)', () => {
    const w = mount(ConfigConsumer, { slots: { default: (v: ContextValue) => h('b', String(v.timeZone)) } });
    expect(w.find('b').text()).toBe('undefined');
  });
});

describe('semiGlobal', () => {
  it('is a singleton with a config object', () => {
    expect(semiGlobal.config).toEqual({});
  });

  it('getDefaultPropsFromGlobalConfig reads overrides lazily', () => {
    const defaults = getDefaultPropsFromGlobalConfig('Select', { zIndex: 1000, size: 'default' });
    expect(defaults.zIndex).toBe(1000);
    semiGlobal.config.overrideDefaultProps = { Select: { zIndex: 2000 } };
    expect(defaults.zIndex).toBe(2000);
    expect(defaults.size).toBe('default');
    expect('zIndex' in defaults).toBe(true);
    expect({ ...defaults }).toEqual({ zIndex: 2000, size: 'default' });
    semiGlobal.config.overrideDefaultProps = { Tooltip: { trigger: 'click' } };
    expect(defaults.zIndex).toBe(1000);
    expect(getDefaultPropsFromGlobalConfig('Tooltip').trigger).toBe('click');
  });
});
