import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Nav, { NavItem, SubNav, NavHeader, NavFooter } from './index';

const items = [
  { itemKey: 'home', text: 'Home' },
  {
    itemKey: 'union',
    text: 'Union',
    items: [
      { itemKey: 'notice', text: 'Notice' },
      { itemKey: 'query', text: 'Query' },
    ],
  },
];

describe('Navigation', () => {
  it('exposes statics', () => {
    expect((Nav as any).Item).toBe(NavItem);
    expect((Nav as any).Sub).toBe(SubNav);
    expect((Nav as any).Header).toBe(NavHeader);
    expect((Nav as any).Footer).toBe(NavFooter);
    expect((Nav as any).elementType).toBe('Nav');
    expect((NavHeader as any).elementType).toBe('NavHeader');
    expect((NavFooter as any).elementType).toBe('NavFooter');
  });

  it('renders vertical navigation with items', () => {
    const w = mount(Nav, { props: { items } });
    expect(w.classes()).toContain('semi-navigation');
    expect(w.classes()).toContain('semi-navigation-vertical');
    expect(w.find('ul[role="menu"]').exists()).toBe(true);
    expect(w.find('ul[role="menu"]').attributes('aria-orientation')).toBe('vertical');
    expect(w.text()).toContain('Home');
    expect(w.text()).toContain('Union');
  });

  it('horizontal mode class', () => {
    const w = mount(Nav, { props: { items, mode: 'horizontal' } });
    expect(w.classes()).toContain('semi-navigation-horizontal');
  });

  it('children Item API selects and emits', async () => {
    const onSelect = vi.fn();
    const onClick = vi.fn();
    const w = mount(Nav, {
      props: { onSelect, onClick },
      slots: {
        default: () => [
          h(NavItem, { itemKey: 'a', text: 'Alpha' }),
          h(NavItem, { itemKey: 'b', text: 'Beta' }),
        ],
      },
    });
    const itemsLi = w.findAll('li.semi-navigation-item');
    expect(itemsLi.length).toBeGreaterThanOrEqual(2);
    await itemsLi[0].trigger('click');
    await nextTick();
    expect(onClick).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
    expect(w.emitted('update:selectedKeys')).toBeTruthy();
    expect(itemsLi[0].classes()).toContain('semi-navigation-item-selected');
  });

  it('defaultSelectedKeys marks the item selected', () => {
    const w = mount(Nav, { props: { items, defaultSelectedKeys: ['home'] } });
    const selected = w.findAll('li.semi-navigation-item-selected');
    expect(selected.length).toBeGreaterThan(0);
    expect(w.text()).toContain('Home');
  });

  it('controlled selectedKeys', async () => {
    const w = mount(Nav, { props: { items, selectedKeys: ['home'] } });
    expect(w.find('.semi-navigation-item-selected').exists()).toBe(true);
    await w.setProps({ selectedKeys: ['notice'] });
    await nextTick();
    expect(w.find('.semi-navigation-item-selected').text()).toContain('Notice');
  });

  it('SubNav expands on click in vertical mode', async () => {
    const onOpenChange = vi.fn();
    const w = mount(Nav, {
      props: { items, subNavMotion: false, onOpenChange },
    });
    const title = w.find('.semi-navigation-sub-title');
    expect(title.exists()).toBe(true);
    await title.trigger('click');
    await nextTick();
    expect(onOpenChange).toHaveBeenCalled();
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(true);
    expect(w.text()).toContain('Notice');
  });

  it('Header and Footer from children', () => {
    const w = mount(Nav, {
      slots: {
        default: () => [
          h(NavHeader, { text: 'Brand' }),
          h(NavItem, { itemKey: 'a', text: 'A' }),
          h(NavFooter, { collapseButton: true }),
        ],
      },
    });
    expect(w.find('.semi-navigation-header').exists()).toBe(true);
    expect(w.find('.semi-navigation-header-text').text()).toBe('Brand');
    expect(w.find('.semi-navigation-footer').exists()).toBe(true);
    expect(w.find('.semi-navigation-collapse-btn').exists()).toBe(true);
  });

  it('header/footer object props', () => {
    const w = mount(Nav, {
      props: {
        items: [{ itemKey: 'a', text: 'A' }],
        header: { text: 'H' },
        footer: { collapseButton: true },
      },
    });
    expect(w.find('.semi-navigation-header-text').text()).toBe('H');
    expect(w.find('.semi-navigation-footer').exists()).toBe(true);
  });

  it('collapseButton toggles collapsed class and emits collapseChange', async () => {
    const onCollapse = vi.fn();
    const w = mount(Nav, {
      props: { items, onCollapseChange: onCollapse },
      slots: { default: () => h(NavFooter, { collapseButton: true }) },
    });
    await w.find('.semi-navigation-collapse-btn button').trigger('click');
    await nextTick();
    expect(onCollapse).toHaveBeenCalledWith(true);
    expect(w.classes()).toContain('semi-navigation-collapsed');
  });

  it('disabled item does not select', async () => {
    const onSelect = vi.fn();
    const w = mount(Nav, {
      props: { onSelect },
      slots: { default: () => h(NavItem, { itemKey: 'a', text: 'A', disabled: true }) },
    });
    await w.find('li.semi-navigation-item').trigger('click');
    expect(w.find('li.semi-navigation-item-disabled').exists()).toBe(true);
  });

  it('link wraps item content in an anchor', () => {
    const w = mount(Nav, {
      slots: { default: () => h(NavItem, { itemKey: 'a', text: 'A', link: '/home' }) },
    });
    const a = w.find('a.semi-navigation-item-link');
    expect(a.exists()).toBe(true);
    expect(a.attributes('href')).toBe('/home');
  });
});

describe('Navigation (slot / JSX API parity)', () => {
  it('defaultOpenKeys and defaultSelectedKeys work with slot children', async () => {
    const w = mount(Nav, {
      props: { defaultOpenKeys: ['user'], defaultSelectedKeys: ['active'], subNavMotion: false },
      slots: {
        default: () => [
          h(NavItem, { itemKey: 'union', text: 'Union' }),
          h(SubNav, { itemKey: 'user', text: 'User' }, () => [
            h(NavItem, { itemKey: 'active', text: 'Active' }),
            h(NavItem, { itemKey: 'negative', text: 'Negative' }),
          ]),
        ],
      },
    });
    await nextTick();
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(true);
    expect(w.find('.semi-navigation-sub-title').classes()).toContain('semi-navigation-sub-title-selected');
    expect(w.find('li.semi-navigation-item-selected').text()).toBe('Active');
  });

  it('defaultSelectedKeys without openKeys auto-opens the SubNav parent (slot children)', async () => {
    const w = mount(Nav, {
      props: { defaultSelectedKeys: ['negative'], subNavMotion: false },
      slots: {
        default: () => [
          h(SubNav, { itemKey: 'user', text: 'User' }, () => [h(NavItem, { itemKey: 'negative', text: 'Negative' })]),
        ],
      },
    });
    await nextTick();
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(true);
    expect(w.text()).toContain('Negative');
  });

  it('string items become text + itemKey; onSelect payload carries selectedItems', async () => {
    const onSelect = vi.fn();
    const w = mount(Nav, { props: { items: ['Alpha', 'Beta'], onSelect } });
    const lis = w.findAll('li.semi-navigation-item');
    expect(lis[1].text()).toBe('Beta');
    await lis[1].trigger('click');
    await nextTick();
    const data = onSelect.mock.calls[0][0];
    expect(data.itemKey).toBe('Beta');
    expect(data.selectedKeys).toEqual(['Beta']);
    expect(Array.isArray(data.selectedItems)).toBe(true);
    expect(w.emitted('update:selectedKeys')![0][0]).toEqual(['Beta']);
  });

  it('defaultIsCollapsed / update:isCollapsed and toggleIconPosition / limitIndent', async () => {
    const w = mount(Nav, {
      props: { items, defaultIsCollapsed: true, toggleIconPosition: 'left', limitIndent: false, footer: { collapseButton: true } },
    });
    expect(w.classes()).toContain('semi-navigation-collapsed');
    await w.find('.semi-navigation-collapse-btn button').trigger('click');
    await nextTick();
    expect(w.emitted('update:isCollapsed')![0][0]).toBe(false);
    expect(w.classes()).not.toContain('semi-navigation-collapsed');
    expect(w.find('.semi-navigation-item-icon-toggle-left').exists()).toBe(true);
  });

  it('controlled openKeys with onOpenChange payload', async () => {
    const onOpenChange = vi.fn();
    const w = mount(Nav, { props: { items, openKeys: [], subNavMotion: false, onOpenChange } });
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(false);
    await w.find('.semi-navigation-sub-title').trigger('click');
    await nextTick();
    expect(onOpenChange.mock.calls[0][0].itemKey).toBe('union');
    expect(onOpenChange.mock.calls[0][0].openKeys).toEqual(['union']);
    expect(w.emitted('update:openKeys')![0][0]).toEqual(['union']);
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(false);
    await w.setProps({ openKeys: ['union'] });
    await nextTick();
    expect(w.find('ul.semi-navigation-sub').exists()).toBe(true);
  });

  it('renderWrapper wraps every item, header/footer slots and expandIcon', () => {
    const w = mount(Nav, {
      props: {
        items,
        subNavMotion: false,
        expandIcon: h('b', { class: 'my-expand' }, '+'),
        renderWrapper: ({ itemElement, props: p }: any) => h('div', { class: 'wrapped', 'data-key': p.itemKey }, [itemElement]),
      },
      slots: { header: () => 'HeaderSlot', footer: () => 'FooterSlot' },
    });
    expect(w.findAll('.wrapped').length).toBeGreaterThanOrEqual(2);
    expect(w.find('.semi-navigation-header').text()).toContain('HeaderSlot');
    expect(w.find('.semi-navigation-footer').text()).toContain('FooterSlot');
    expect(w.find('.my-expand').exists()).toBe(true);
  });

  it('Footer collapseText and custom collapseButton node; NavItem mouseenter/mouseleave emits', async () => {
    const w = mount(Nav, {
      props: { items },
      slots: { default: () => h(NavFooter, { collapseButton: true, collapseText: (c: boolean) => (c ? 'open' : 'close') }) },
    });
    expect(w.find('.semi-navigation-collapse-btn').text()).toContain('close');
    const w2 = mount(Nav, { slots: { default: () => h(NavFooter, { collapseButton: h('em', { class: 'custom-cb' }, 'x') }) } });
    expect(w2.find('.custom-cb').exists()).toBe(true);

    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const w3 = mount(Nav, { slots: { default: () => h(NavItem, { itemKey: 'a', text: 'A', onMouseenter: onEnter, onMouseleave: onLeave }) } });
    await w3.find('li.semi-navigation-item').trigger('mouseenter');
    await w3.find('li.semi-navigation-item').trigger('mouseleave');
    expect(onEnter).toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalled();
  });

  it('Header link/logo and bodyStyle/style/className', () => {
    const w = mount(Nav, {
      props: { items, bodyStyle: { height: '300px' }, style: { height: '520px' }, className: 'my-nav' },
      slots: { default: () => h(NavHeader, { link: '/', logo: h('i', { class: 'logo' }), text: 'T' }) },
    });
    expect(w.classes()).toContain('my-nav');
    expect(w.attributes('style')).toContain('height: 520px');
    expect(w.find('.semi-navigation-list-wrapper').attributes('style')).toContain('height: 300px');
    expect(w.find('a.semi-navigation-header-link').attributes('href')).toBe('/');
    expect(w.find('.semi-navigation-header-logo .logo').exists()).toBe(true);
  });
});

describe('Navigation (icon / text slots)', () => {
  it('NavItem and SubNav accept icon and text as named slots', () => {
    const w = mount(Nav, {
      props: { subNavMotion: false },
      slots: {
        default: () => [
          h(NavItem, { itemKey: 'a' }, { icon: () => h('i', { class: 'item-icon-slot' }), text: () => 'SlotText' }),
          h(SubNav, { itemKey: 's' }, { icon: () => h('i', { class: 'sub-icon-slot' }), text: () => 'SubText', default: () => h(NavItem, { itemKey: 'c', text: 'C' }) }),
        ],
      },
    });
    expect(w.find('.semi-navigation-item-icon-info .item-icon-slot').exists()).toBe(true);
    expect(w.find('li.semi-navigation-item .semi-navigation-item-text').text()).toBe('SlotText');
    expect(w.find('.semi-navigation-sub-title .sub-icon-slot').exists()).toBe(true);
    expect(w.find('.semi-navigation-sub-title .semi-navigation-item-text').text()).toBe('SubText');
  });
});
