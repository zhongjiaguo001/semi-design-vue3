import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Breadcrumb, { BreadcrumbItem } from './index';
import { IconHome } from '../icons/generated';
import { Text as TypographyText } from '../typography/Typography';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 150) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

const items = (n: number) => () => Array.from({ length: n }, (_v, i) => h(BreadcrumbItem, { key: i }, () => `Item ${i + 1}`));

describe('Breadcrumb', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes Breadcrumb.Item', () => {
    expect(Breadcrumb.Item).toBe(BreadcrumbItem);
  });

  it('renders nav with compact wrapper, items, separators and active last item', () => {
    const w = mount(Breadcrumb, { slots: { default: items(3) } });
    expect(w.element.tagName).toBe('NAV');
    expect(w.attributes('aria-label')).toBe('Breadcrumb');
    expect(w.classes()).toContain('semi-breadcrumb-wrapper');
    expect(w.classes()).toContain('semi-breadcrumb-wrapper-compact');
    const wraps = w.findAll('.semi-breadcrumb-item-wrap');
    expect(wraps).toHaveLength(3);
    // string children go through Typography.Text with ellipsis
    const first = wraps[0].find('.semi-breadcrumb-item');
    expect(first.element.tagName).toBe('SPAN');
    expect(first.classes()).toContain('semi-breadcrumb-item-link');
    expect(first.classes()).not.toContain('semi-breadcrumb-item-active');
    const text = first.find('.semi-breadcrumb-item-title .semi-typography');
    expect(text.exists()).toBe(true);
    expect(text.classes()).toContain('semi-typography-ellipsis');
    expect(text.classes()).toContain('semi-typography-small');
    expect((text.element as HTMLElement).style.maxWidth).toBe('150px');
    expect(text.text()).toBe('Item 1');
    // separators: not after the last
    expect(wraps[0].find('.semi-breadcrumb-separator').text()).toBe('/');
    expect(wraps[2].find('.semi-breadcrumb-separator').exists()).toBe(false);
    // active
    expect(wraps[2].attributes('aria-current')).toBe('page');
    expect(wraps[2].find('.semi-breadcrumb-item').classes()).toContain('semi-breadcrumb-item-active');
    expect(wraps[0].attributes('aria-current')).toBeUndefined();
  });

  it('compact=false: loose class and normal typography size', () => {
    const w = mount(Breadcrumb, { props: { compact: false }, slots: { default: items(2) } });
    expect(w.classes()).toContain('semi-breadcrumb-wrapper-loose');
    expect(w.find('.semi-typography').classes()).toContain('semi-typography-normal');
  });

  it('separator prop (string / node) and slot; item-level separator override', () => {
    const w = mount(Breadcrumb, { props: { separator: '>' }, slots: { default: items(2) } });
    expect(w.find('.semi-breadcrumb-separator').text()).toBe('>');
    const n = mount(Breadcrumb, { props: { separator: h('i', { class: 'sep' }) }, slots: { default: items(2) } });
    expect(n.find('.semi-breadcrumb-separator .sep').exists()).toBe(true);
    const s = mount(Breadcrumb, { slots: { separator: () => h('b', { class: 'sslot' }, '|'), default: items(2) } });
    expect(s.find('.semi-breadcrumb-separator .sslot').exists()).toBe(true);
    const o = mount(Breadcrumb, { slots: { default: () => [h(BreadcrumbItem, { separator: h('em', { class: 'own' }, '-') }, () => 'a'), h(BreadcrumbItem, null, () => 'b')] } });
    expect(o.findAll('.semi-breadcrumb-item-wrap')[0].find('.own').exists()).toBe(true);
    expect(o.findAll('.semi-breadcrumb-item-wrap')[0].find('.semi-breadcrumb-separator').exists()).toBe(false);
  });

  it('activeIndex overrides active item', () => {
    const w = mount(Breadcrumb, { props: { activeIndex: 0 }, slots: { default: items(3) } });
    const wraps = w.findAll('.semi-breadcrumb-item-wrap');
    expect(wraps[0].find('.semi-breadcrumb-item').classes()).toContain('semi-breadcrumb-item-active');
    expect(wraps[2].find('.semi-breadcrumb-item').classes()).not.toContain('semi-breadcrumb-item-active');
  });

  it('href renders <a> unless active; noLink removes link class', () => {
    const w = mount(Breadcrumb, {
      slots: { default: () => [h(BreadcrumbItem, { href: '/a' }, () => 'a'), h(BreadcrumbItem, { href: '/b', noLink: true }, () => 'b'), h(BreadcrumbItem, { href: '/c' }, () => 'c')] },
    });
    const wraps = w.findAll('.semi-breadcrumb-item-wrap');
    expect(wraps[0].find('a.semi-breadcrumb-item').attributes('href')).toBe('/a');
    expect(wraps[1].find('.semi-breadcrumb-item').classes()).not.toContain('semi-breadcrumb-item-link');
    // active with href -> span
    expect(wraps[2].find('.semi-breadcrumb-item').element.tagName).toBe('SPAN');
  });

  it('icon prop (semi icon gets item-icon class + size) and icon slot; icon only item', () => {
    const w = mount(Breadcrumb, { slots: { default: () => [h(BreadcrumbItem, { icon: h(IconHome) }), h(BreadcrumbItem, { compact: false }, { icon: () => h('i', { class: 'ic' }), default: () => 'x' })] } });
    const wraps = w.findAll('.semi-breadcrumb-item-wrap');
    const icon = wraps[0].find('.semi-breadcrumb-item-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('semi-icon-small');
    expect(wraps[0].find('.semi-breadcrumb-item-title').exists()).toBe(false);
    expect(wraps[1].find('.ic').exists()).toBe(true);
    const loose = mount(Breadcrumb, { props: { compact: false }, slots: { default: () => h(BreadcrumbItem, { icon: IconHome }, () => 'x') } });
    expect(loose.find('.semi-breadcrumb-item-icon').classes()).toContain('semi-icon-default');
  });

  it('non-string children render inline title without Typography', () => {
    const w = mount(Breadcrumb, { slots: { default: () => h(BreadcrumbItem, null, () => h('b', 'bold')) } });
    const title = w.find('.semi-breadcrumb-item-title');
    expect(title.classes()).toContain('semi-breadcrumb-item-title-inline');
    expect(title.find('.semi-typography').exists()).toBe(false);
    expect(title.find('b').text()).toBe('bold');
  });

  it('click: item emits click then parent emits click with item info (children / href / route)', async () => {
    const onItemClick = vi.fn();
    const w = mount(Breadcrumb, {
      slots: {
        default: () => [
          h(BreadcrumbItem, { href: '/x', onClick: onItemClick }, () => 'first'),
          h(BreadcrumbItem, { route: { name: 'R', path: '/r', extra: 1 } }, () => 'second'),
        ],
      },
    });
    const wraps = w.findAll('.semi-breadcrumb-item-wrap');
    await wraps[0].find('.semi-breadcrumb-item').trigger('click');
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick.mock.calls[0][0]).toEqual({ name: 'first', href: '/x' });
    expect(w.emitted('click')![0][0]).toEqual({ name: 'first', href: '/x' });
    expect(w.emitted('click')![0][1]).toBeInstanceOf(Event);
    await wraps[1].find('.semi-breadcrumb-item').trigger('click');
    expect(w.emitted('click')![1][0]).toEqual({ name: 'R', path: '/r', extra: 1 });
  });

  describe('routes', () => {
    it('renders items from routes (string and object), href, icon, active last, click info = origin route', async () => {
      const w = mount(Breadcrumb, {
        props: { routes: ['Home', { path: '/l', href: '/l', name: 'Lvl', icon: h(IconHome) }, { name: 'Last', key: 'k' }] },
      });
      const wraps = w.findAll('.semi-breadcrumb-item-wrap');
      expect(wraps).toHaveLength(3);
      expect(wraps[0].text()).toContain('Home');
      expect(wraps[1].find('a.semi-breadcrumb-item').attributes('href')).toBe('/l');
      expect(wraps[1].find('.semi-breadcrumb-item-icon').exists()).toBe(true);
      expect(wraps[2].attributes('aria-current')).toBe('page');
      await wraps[0].find('.semi-breadcrumb-item').trigger('click');
      expect(w.emitted('click')![0][0]).toEqual({ name: 'Home' });
      await wraps[1].find('.semi-breadcrumb-item').trigger('click');
      expect(w.emitted('click')![1][0]).toEqual({ path: '/l', href: '/l', name: 'Lvl', icon: expect.anything() });
    });

    it('renderItem prop and item slot customise route content', () => {
      const w = mount(Breadcrumb, { props: { routes: [{ name: 'a' }, { name: 'b' }], renderItem: (r: any) => h('u', r.name.toUpperCase()) } });
      expect(w.findAll('u').map((u) => u.text())).toEqual(['A', 'B']);
      const s = mount(Breadcrumb, { props: { routes: [{ name: 'a' }] }, slots: { item: ({ route }: any) => h('s', `[${route.name}]`) } });
      expect(s.find('s').text()).toBe('[a]');
    });
  });

  describe('collapse', () => {
    it('autoCollapse with maxItemCount: shows first, "..." (IconMore) and last items; expand on click', async () => {
      const w = mount(Breadcrumb, { slots: { default: items(6) } });
      const wraps = w.findAll('.semi-breadcrumb-item-wrap');
      // first + more + last 3 = 5 wraps
      expect(wraps).toHaveLength(5);
      expect(w.find('.semi-breadcrumb-collapse').exists()).toBe(true);
      const more = w.find('.semi-breadcrumb-item-more');
      expect(more.classes()).toContain('semi-breadcrumb-item');
      expect(more.attributes('role')).toBe('button');
      expect(more.attributes('tabindex')).toBe('0');
      expect(more.attributes('aria-label')).toBe('Expand breadcrumb items');
      expect(more.find('.semi-icon-more').exists()).toBe(true);
      expect(w.find('.semi-breadcrumb-collapse .semi-breadcrumb-separator').attributes('x-semi-prop')).toBe('separator');
      expect(w.text()).not.toContain('Item 2');
      expect(w.text()).toContain('Item 6');
      await more.trigger('click');
      expect(w.findAll('.semi-breadcrumb-item-wrap')).toHaveLength(6);
      expect(w.find('.semi-breadcrumb-collapse').exists()).toBe(false);
      expect(w.text()).toContain('Item 2');
    });

    it('Enter key expands', async () => {
      const w = mount(Breadcrumb, { slots: { default: items(6) } });
      await w.find('.semi-breadcrumb-item-more').trigger('keypress', { key: 'a' });
      expect(w.find('.semi-breadcrumb-collapse').exists()).toBe(true);
      await w.find('.semi-breadcrumb-item-more').trigger('keypress', { key: 'Enter' });
      expect(w.find('.semi-breadcrumb-collapse').exists()).toBe(false);
    });

    it('maxItemCount and autoCollapse=false', () => {
      expect(mount(Breadcrumb, { props: { maxItemCount: 2 }, slots: { default: items(3) } }).findAll('.semi-breadcrumb-item-wrap')).toHaveLength(3);
      expect(mount(Breadcrumb, { props: { maxItemCount: 2 }, slots: { default: items(3) } }).find('.semi-breadcrumb-collapse').exists()).toBe(true);
      expect(mount(Breadcrumb, { props: { autoCollapse: false }, slots: { default: items(8) } }).findAll('.semi-breadcrumb-item-wrap')).toHaveLength(8);
      expect(mount(Breadcrumb, { slots: { default: items(4) } }).find('.semi-breadcrumb-collapse').exists()).toBe(false);
    });

    it('collapse also works with routes', () => {
      const w = mount(Breadcrumb, { props: { routes: ['a', 'b', 'c', 'd', 'e'] } });
      expect(w.find('.semi-breadcrumb-collapse').exists()).toBe(true);
      expect(w.text()).not.toContain('b');
      expect(w.text()).toContain('e');
    });

    it('renderMore prop receives the collapsed items; hidden items lose their separators; more slot', () => {
      const renderMore = vi.fn((rest: any[]) => h('span', { class: 'custom-more' }, `+${rest.length}`));
      const w = mount(Breadcrumb, { props: { renderMore }, slots: { default: items(6) } });
      expect(renderMore).toHaveBeenCalled();
      // 6 items, maxItemCount 4 -> items 2 and 3 are collapsed
      expect(renderMore.mock.calls[0][0]).toHaveLength(2);
      expect(w.find('.custom-more').text()).toBe('+2');
      expect(w.find('.semi-icon-more').exists()).toBe(false);
      const rest = mount(renderMore.mock.calls[0][0][0]);
      expect(rest.find('.semi-breadcrumb-separator').exists()).toBe(false);
      const s = mount(Breadcrumb, { slots: { more: ({ restItem }: any) => h('b', { class: 'more-slot' }, String(restItem.length)), default: items(6) } });
      expect(s.find('.more-slot').text()).toBe('2');
    });

    it('moreType=popover renders popover trigger and shows rest items with separators on hover', async () => {
      const w = mount(Breadcrumb, { attachTo: document.body, props: { moreType: 'popover' }, slots: { default: items(6) } });
      const more = w.find('.semi-breadcrumb-item-more');
      const trigger = more.find('.semi-icon-more');
      expect(trigger.exists()).toBe(true);
      expect(trigger.attributes('aria-describedby')).toBeDefined();
      await trigger.trigger('mouseenter');
      await more.trigger('mouseenter');
      let pop: HTMLElement | null = null;
      for (let i = 0; i < 12 && !pop; i++) {
        await wait(50);
        pop = document.querySelector('.semi-popover-wrapper .semi-popover-content, .semi-popover-content') as HTMLElement;
      }
      expect(pop).toBeTruthy();
      expect(pop.textContent).toContain('Item 2');
      expect(pop.textContent).toContain('Item 3');
      expect(pop.textContent).not.toContain('Item 4');
      expect(pop.querySelectorAll('.semi-breadcrumb-restItem')).toHaveLength(1);
      expect(pop.querySelectorAll('.semi-breadcrumb-item-wrap .semi-breadcrumb-separator')).toHaveLength(0);
      w.unmount();
    });
  });

  it('showTooltip=false disables typography tooltip; object merges width / pos', () => {
    const w = mount(Breadcrumb, { props: { showTooltip: { width: 80, ellipsisPos: 'middle' } }, slots: { default: items(1) } });
    const text = w.find('.semi-typography');
    expect((text.element as HTMLElement).style.maxWidth).toBe('80px');
    expect(text.classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
    const off = mount(Breadcrumb, { props: { showTooltip: false }, slots: { default: items(1) } });
    expect((off.find('.semi-typography').element as HTMLElement).style.maxWidth).toBe('150px');
  });

  it('showTooltip width string (auto) and opts are merged into Typography ellipsis config; routes with string names use Typography', () => {
    const w = mount(Breadcrumb, { props: { showTooltip: { width: 'auto' }, routes: ['a', 'b'] } });
    const texts = w.findAll('.semi-typography');
    expect(texts).toHaveLength(2);
    expect((texts[0].element as HTMLElement).style.maxWidth).toBe('auto');
    const o = mount(Breadcrumb, { props: { showTooltip: { opts: { position: 'topLeft' } } }, slots: { default: items(1) } });
    const text = o.findComponent(TypographyText as any) as any;
    expect(text.exists()).toBe(true);
    expect(text.props('ellipsis')).toEqual({ showTooltip: { opts: { autoAdjustOverflow: true, position: 'topLeft' } }, pos: 'end' });
    expect((text.element as HTMLElement).style.maxWidth).toBe('150px');
  });

  it('class/style/data attrs on wrapper and items; ariaLabel', () => {
    const w = mount(Breadcrumb, {
      props: { ariaLabel: 'crumbs' },
      attrs: { class: 'c', style: { color: 'red' }, 'data-x': '1' },
      slots: { default: () => h(BreadcrumbItem, { class: 'ic', 'data-y': '2' }, () => 'a') },
    });
    expect(w.attributes('aria-label')).toBe('crumbs');
    expect(w.classes()).toContain('c');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('data-x')).toBe('1');
    expect(w.find('.semi-breadcrumb-item-wrap').classes()).toContain('ic');
    expect(w.find('.semi-breadcrumb-item-wrap').attributes('data-y')).toBe('2');
  });

  it('warns when a non Breadcrumb.Item child is used', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(Breadcrumb, { slots: { default: () => h('span', 'x') } });
    expect(warn).not.toHaveBeenCalled(); // plain elements are not components: no warning (React checks item.type.isBreadcrumbItem)
    mount(Breadcrumb, { slots: { default: () => h({ name: 'Other', render: () => h('i') }) } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Only accepts Breadcrumb.Item'));
    warn.mockRestore();
  });
});

describe('Breadcrumb aria-label attr (React `aria-label` prop parity)', () => {
  it('plain aria-label attribute overrides the ariaLabel prop default', () => {
    const w = mount(Breadcrumb, { attrs: { 'aria-label': 'site nav' }, slots: { default: items(2) } });
    expect(w.attributes('aria-label')).toBe('site nav');
  });

  it('route objects may carry Breadcrumb.Item props (separator / noLink, v1.16.0)', () => {
    const w = mount(Breadcrumb, { props: { routes: [{ name: 'a', separator: h('em', { class: 'rsep' }, ':'), noLink: true }, 'b'] } });
    const first = w.findAll('.semi-breadcrumb-item-wrap')[0];
    expect(first.find('.rsep').exists()).toBe(true);
    expect(first.find('.semi-breadcrumb-item').classes()).not.toContain('semi-breadcrumb-item-link');
  });
});
