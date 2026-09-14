import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Row, Col } from './index';
import ConfigProvider from '../configProvider';

/** install a controllable matchMedia: returns a helper to flip a query's match state */
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

describe('Row', () => {
  it('renders semi-row with children and x-semi-prop', () => {
    const w = mount(Row, { slots: { default: () => h('span', 'child') } });
    expect(w.classes()).toContain('semi-row');
    expect(w.classes()).not.toContain('semi-row-flex');
    expect(w.attributes('x-semi-prop')).toBe('children');
    expect(w.text()).toBe('child');
  });

  it('type=flex drops semi-row and adds flex / justify / align classes', () => {
    const w = mount(Row, { props: { type: 'flex', justify: 'space-between', align: 'middle' } });
    expect(w.classes()).not.toContain('semi-row');
    expect(w.classes()).toContain('semi-row-flex');
    expect(w.classes()).toContain('semi-row-flex-space-between');
    expect(w.classes()).toContain('semi-row-flex-middle');
  });

  it('justify / align without type=flex have no effect', () => {
    const w = mount(Row, { props: { justify: 'center', align: 'top' } });
    expect(w.classes()).toContain('semi-row');
    expect(w.classes()).not.toContain('semi-row-undefined-center');
    expect(w.attributes('class')).not.toMatch(/center|top/);
  });

  it('class / style / attrs pass through', () => {
    const w = mount(Row, { attrs: { class: 'custom', style: { color: 'red' }, id: 'row1', 'data-x': 'y' } });
    expect(w.classes()).toContain('custom');
    expect(w.classes()).toContain('semi-row');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('id')).toBe('row1');
    expect(w.attributes('data-x')).toBe('y');
  });

  it('prefixCls', () => {
    const w = mount(Row, { props: { prefixCls: 'my' } });
    expect(w.classes()).toContain('my-row');
  });

  it('numeric gutter sets negative horizontal margins and Col paddings', () => {
    const w = mount(Row, { props: { gutter: 16 }, slots: { default: () => [h(Col, { span: 12 }, () => 'a'), h(Col, { span: 12 }, () => 'b')] } });
    const style = w.attributes('style');
    expect(style).toContain('margin-left: -8px');
    expect(style).toContain('margin-right: -8px');
    expect(style).not.toContain('margin-top');
    const cols = w.findAll('.semi-col');
    expect(cols).toHaveLength(2);
    expect(cols[0].attributes('style')).toContain('padding-left: 8px');
    expect(cols[0].attributes('style')).toContain('padding-right: 8px');
    expect(cols[0].attributes('style')).not.toContain('padding-top');
  });

  it('array gutter [horizontal, vertical]', () => {
    const w = mount(Row, { props: { gutter: [16, 24] }, slots: { default: () => h(Col, { span: 6 }) } });
    const el = w.element as HTMLElement;
    expect(el.style.marginLeft).toBe('-8px');
    expect(el.style.marginTop).toBe('-12px');
    expect(el.style.marginBottom).toBe('-12px');
    const col = w.find('.semi-col').element as HTMLElement;
    expect(col.style.paddingTop).toBe('12px');
    expect(col.style.paddingBottom).toBe('12px');
    expect(col.style.paddingLeft).toBe('8px');
  });

  it('gutter 0 / undefined renders no margin', () => {
    const w = mount(Row, { slots: { default: () => h(Col, { span: 6 }) } });
    expect(w.attributes('style')).toBeUndefined();
    expect(w.find('.semi-col').attributes('style')).toBeUndefined();
  });

  it('gutter merges with user style', () => {
    const w = mount(Row, { props: { gutter: 10 }, attrs: { style: { background: 'blue' } } });
    expect(w.attributes('style')).toContain('margin-left: -5px');
    expect(w.attributes('style')).toContain('background: blue');
  });

  describe('responsive gutter', () => {
    let mm: ReturnType<typeof mockMatchMedia>;
    afterEach(() => mm?.restore());

    it('picks the largest matching breakpoint and reacts to media changes', async () => {
      mm = mockMatchMedia({ '(max-width: 575px)': true, '(min-width: 576px)': false, '(min-width: 768px)': false, '(min-width: 992px)': false, '(min-width: 1200px)': false, '(min-width: 1600px)': false });
      const w = mount(Row, { props: { gutter: { xs: 8, md: 16, xl: 32 } }, slots: { default: () => h(Col, { span: 6 }) } });
      await nextTick();
      // only xs matches
      expect(w.attributes('style')).toContain('margin-left: -4px');
      expect(w.find('.semi-col').attributes('style')).toContain('padding-left: 4px');
      // md kicks in
      mm.set('(min-width: 768px)', true);
      await nextTick();
      expect(w.attributes('style')).toContain('margin-left: -8px');
      // xl kicks in -> wins over md (largest first)
      mm.set('(min-width: 1200px)', true);
      await nextTick();
      expect(w.attributes('style')).toContain('margin-left: -16px');
      expect(w.find('.semi-col').attributes('style')).toContain('padding-left: 16px');
      // xl unmatched again -> falls back to md
      mm.set('(min-width: 1200px)', false);
      await nextTick();
      expect(w.attributes('style')).toContain('margin-left: -8px');
    });

    it('responsive vertical gutter in array form', async () => {
      mm = mockMatchMedia({ '(min-width: 992px)': true });
      const w = mount(Row, { props: { gutter: [8, { lg: 40, xs: 4 }] }, slots: { default: () => h(Col, { span: 6 }) } });
      await nextTick();
      // xs does not match, lg matches
      const el = w.element as HTMLElement;
      expect(el.style.marginTop).toBe('-20px');
      expect(el.style.marginLeft).toBe('-4px');
    });

    it('media query listeners are registered on mount and removed on unmount', async () => {
      mm = mockMatchMedia();
      const w = mount(Row, { props: { gutter: { md: 16 } } });
      await nextTick();
      expect(mm.listenerCount('(min-width: 768px)')).toBe(1);
      expect(mm.listenerCount('(max-width: 575px)')).toBe(1);
      w.unmount();
      expect(mm.listenerCount('(min-width: 768px)')).toBe(0);
    });

    it('non-object gutter ignores media changes (screens stay all true)', async () => {
      mm = mockMatchMedia();
      const w = mount(Row, { props: { gutter: 10 } });
      await nextTick();
      mm.set('(min-width: 768px)', true);
      await nextTick();
      expect(w.attributes('style')).toContain('margin-left: -5px');
      // switching to an object gutter afterwards uses the untouched screens (all true -> xxl first)
      await w.setProps({ gutter: { xs: 2, xxl: 50 } });
      expect(w.attributes('style')).toContain('margin-left: -25px');
    });

    it('uses ConfigProvider responsiveMap when provided', async () => {
      mm = mockMatchMedia({ '(min-width: 3000px)': true });
      const w = mount(ConfigProvider, {
        props: { responsiveMap: { xxl: '(min-width: 3000px)' } },
        slots: { default: () => h(Row, { gutter: { xs: 2, xxl: 60 } }, () => h(Col, { span: 6 })) },
      });
      await nextTick();
      expect(mm.listenerCount('(min-width: 3000px)')).toBeGreaterThan(0);
      expect(w.find('.semi-row').attributes('style')).toContain('margin-left: -30px');
    });
  });
});

describe('Col', () => {
  const mountCol = (props: any = {}, attrs: any = {}, rowProps: any = {}) =>
    mount(Row, { props: rowProps, slots: { default: () => h(Col, { ...props, ...attrs }, () => 'content') } }).find('.semi-col');

  it('renders semi-col with span and x-semi-prop', () => {
    const col = mountCol({ span: 8 });
    expect(col.classes()).toContain('semi-col');
    expect(col.classes()).toContain('semi-col-8');
    expect(col.attributes('x-semi-prop')).toBe('children');
    expect(col.text()).toBe('content');
  });

  it('order / offset / push / pull classes', () => {
    const col = mountCol({ span: 6, order: 2, offset: 3, push: 4, pull: 1 });
    expect(col.classes()).toContain('semi-col-order-2');
    expect(col.classes()).toContain('semi-col-offset-3');
    expect(col.classes()).toContain('semi-col-push-4');
    expect(col.classes()).toContain('semi-col-pull-1');
  });

  it('order / offset / push / pull 0 are not rendered (React truthiness)', () => {
    const col = mountCol({ span: 6, order: 0, offset: 0, push: 0, pull: 0 });
    expect(col.classes()).not.toContain('semi-col-order-0');
    expect(col.classes()).not.toContain('semi-col-offset-0');
    expect(col.classes()).not.toContain('semi-col-push-0');
    expect(col.classes()).not.toContain('semi-col-pull-0');
  });

  it('no span -> no semi-col-N class', () => {
    const col = mountCol({});
    expect(col.classes()).toEqual(['semi-col']);
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const)('responsive %s as number', (size) => {
    const col = mountCol({ [size]: 12 });
    expect(col.classes()).toContain(`semi-col-${size}-12`);
  });

  it('responsive object form with span/order/offset/push/pull (0 allowed)', () => {
    const col = mountCol({ md: { span: 10, order: 0, offset: 2, push: 0, pull: 3 } });
    expect(col.classes()).toContain('semi-col-md-10');
    expect(col.classes()).toContain('semi-col-md-order-0');
    expect(col.classes()).toContain('semi-col-md-offset-2');
    expect(col.classes()).toContain('semi-col-md-push-0');
    expect(col.classes()).toContain('semi-col-md-pull-3');
  });

  it('responsive object without span omits span class', () => {
    const col = mountCol({ lg: { offset: 4 } });
    expect(col.classes()).toContain('semi-col-lg-offset-4');
    expect(col.attributes('class')).not.toMatch(/semi-col-lg-undefined/);
  });

  it('class / style / attrs pass through and merge with gutter padding', () => {
    const col = mountCol({ span: 4 }, { class: 'c', style: { color: 'red' }, id: 'col1', 'data-a': '1' }, { gutter: 20 });
    expect(col.classes()).toContain('c');
    expect(col.attributes('id')).toBe('col1');
    expect(col.attributes('data-a')).toBe('1');
    expect(col.attributes('style')).toContain('color: red');
    expect(col.attributes('style')).toContain('padding-left: 10px');
  });

  it('prefixCls', () => {
    const col = mount(Row, { slots: { default: () => h(Col, { span: 4, prefixCls: 'my' }) } }).find('.my-col');
    expect(col.exists()).toBe(true);
    expect(col.classes()).toContain('my-col-4');
  });

  it('throws when rendered outside a Row', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => mount(Col, { props: { span: 2 } })).toThrow('please make sure <Col> inside <Row>');
    spy.mockRestore();
  });

  it('gutter change on Row updates Col paddings', async () => {
    const w = mount(Row, { props: { gutter: 8 }, slots: { default: () => h(Col, { span: 6 }) } });
    expect(w.find('.semi-col').attributes('style')).toContain('padding-left: 4px');
    await w.setProps({ gutter: [0, 12] });
    expect(w.find('.semi-col').attributes('style')).not.toContain('padding-left');
    expect(w.find('.semi-col').attributes('style')).toContain('padding-top: 6px');
  });
});
