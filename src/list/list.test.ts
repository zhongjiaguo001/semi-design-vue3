import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import List, { ListItem } from './index';

describe('List', () => {
  it('exposes List.Item', () => {
    expect((List as any).Item).toBe(ListItem);
    expect((List as any).elementType).toBe('List');
    expect((ListItem as any).elementType).toBe('ListItem');
  });

  it('renders wrapper classes for size, split, bordered and horizontal layout', () => {
    const w = mount(List, {
      props: { size: 'small', bordered: true, split: true, layout: 'horizontal' },
      slots: { default: () => h(ListItem, null, () => 'a') },
    });
    expect(w.classes()).toContain('semi-list');
    expect(w.classes()).toContain('semi-list-small');
    expect(w.classes()).toContain('semi-list-split');
    expect(w.classes()).toContain('semi-list-bordered');
    expect(w.classes()).toContain('semi-list-flex');
    expect(w.find('ul.semi-list-items').exists()).toBe(true);
    expect(w.find('li.semi-list-item').text()).toBe('a');
  });

  it.each(['small', 'large', 'default'] as const)('size=%s class', (size) => {
    const w = mount(List, { props: { size }, slots: { default: () => h(ListItem, null, () => 'x') } });
    expect(w.classes()).toContain(`semi-list-${size}`);
  });

  it('renders header, footer and loadMore', () => {
    const w = mount(List, {
      props: { header: 'H', footer: 'F', loadMore: 'more' },
      slots: { default: () => h(ListItem, null, () => 'a') },
    });
    expect(w.find('.semi-list-header').text()).toBe('H');
    expect(w.find('.semi-list-footer').text()).toBe('F');
    expect(w.text()).toContain('more');
  });

  it('header/footer/emptyContent/loadMore slots win over props', () => {
    const w = mount(List, {
      props: { header: 'Hp', footer: 'Fp', emptyContent: 'Ep', loadMore: 'Mp' },
      slots: {
        header: () => 'Hs',
        footer: () => 'Fs',
        emptyContent: () => 'Es',
        loadMore: () => 'Ms',
      },
    });
    expect(w.find('.semi-list-header').text()).toBe('Hs');
    expect(w.find('.semi-list-footer').text()).toBe('Fs');
    expect(w.find('.semi-list-empty').text()).toBe('Es');
    expect(w.text()).toContain('Ms');
  });

  it('renders locale empty text when no children and no dataSource', () => {
    const w = mount(List);
    expect(w.find('.semi-list-empty').exists()).toBe(true);
    expect(w.find('.semi-list-empty').text()).toBe('暂无数据');
  });

  it('renders emptyContent instead of locale empty', () => {
    const w = mount(List, { props: { emptyContent: 'nothing' } });
    expect(w.find('.semi-list-empty').text()).toBe('nothing');
    expect(w.find('.semi-list-empty').attributes('x-semi-prop')).toBe('emptyContent');
  });

  it('dataSource + renderItem maps items', () => {
    const data = [{ name: 'a' }, { name: 'b' }];
    const w = mount(List, {
      props: {
        dataSource: data,
        renderItem: (item: any) => h(ListItem, null, () => item.name),
      },
    });
    const items = w.findAll('li.semi-list-item');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toBe('a');
    expect(items[1].text()).toBe('b');
  });

  it('grid layout wraps items in a row and item in a col', () => {
    const w = mount(List, {
      props: { grid: { span: 12, gutter: 8 } },
      slots: { default: () => h(ListItem, null, () => 'g') },
    });
    expect(w.classes()).toContain('semi-list-grid');
    expect(w.find('.semi-row-flex').exists()).toBe(true);
    expect(w.find('.semi-col').exists()).toBe(true);
    expect(w.find('li.semi-list-item').text()).toBe('g');
  });

  it('loading wraps body in spin', () => {
    const w = mount(List, {
      props: { loading: true },
      slots: { default: () => h(ListItem, null, () => 'a') },
    });
    expect(w.find('.semi-spin').exists()).toBe(true);
  });

  it('passes style, class and data attrs on the root', () => {
    const w = mount(List, {
      props: { style: { color: 'red' } },
      attrs: { class: 'mine', 'data-x': '1' },
      slots: { default: () => h(ListItem, null, () => 'a') },
    });
    expect(w.classes()).toContain('mine');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('data-x')).toBe('1');
  });

  it('ListItem renders header, main, extra and align class', () => {
    const w = mount(List, {
      slots: {
        default: () =>
          h(ListItem, { header: 'hd', main: 'mn', extra: 'ex', align: 'center', class: 'mine' }, () => 'kid'),
      },
    });
    const li = w.find('li.semi-list-item');
    expect(li.classes()).toContain('mine');
    expect(li.find('.semi-list-item-body').classes()).toContain('semi-list-item-body-center');
    expect(li.find('.semi-list-item-body-header').text()).toBe('hd');
    expect(li.find('.semi-list-item-body-main').text()).toBe('mn');
    expect(li.find('.semi-list-item-extra').text()).toBe('ex');
    expect(li.text()).toContain('kid');
  });

  it('ListItem emits click / rightClick / mouseenter / mouseleave', async () => {
    const onClick = vi.fn();
    const onRight = vi.fn();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const w = mount(List, {
      props: { onClick, onRightClick: onRight },
      slots: {
        default: () =>
          h(ListItem, { onMouseenter: onEnter, onMouseleave: onLeave }, () => 'a'),
      },
    });
    const li = w.find('li.semi-list-item');
    await li.trigger('click');
    await li.trigger('contextmenu');
    await li.trigger('mouseenter');
    await li.trigger('mouseleave');
    expect(onClick).toHaveBeenCalled();
    expect(onRight).toHaveBeenCalled();
    expect(onEnter).toHaveBeenCalled();
    expect(onLeave).toHaveBeenCalled();
  });

  it('split=false omits split class', () => {
    const w = mount(List, { props: { split: false }, slots: { default: () => h(ListItem, null, () => 'a') } });
    expect(w.classes()).not.toContain('semi-list-split');
  });
});

describe('List parity details', () => {
  it('renderItem receives (item, index) and vnode keys are preserved / generated', () => {
    const renderItem = vi.fn((item: string, index: number) =>
      h(ListItem, { key: index === 0 ? 'custom' : undefined }, () => `${item}-${index}`)
    );
    const w = mount(List, { props: { dataSource: ['a', 'b'], renderItem } });
    expect(renderItem).toHaveBeenCalledWith('a', 0);
    expect(renderItem).toHaveBeenCalledWith('b', 1);
    const items = w.findAll('li.semi-list-item');
    expect(items[1].text()).toBe('b-1');
    expect(items[0].text()).toBe('a-0');
  });

  it('renderItem may return plain elements (non ListItem)', () => {
    const w = mount(List, {
      props: { dataSource: ['x'], renderItem: (item: string) => h('div', { class: 'plain' }, item) },
    });
    expect(w.find('ul.semi-list-items .plain').text()).toBe('x');
    expect(w.find('.semi-list-empty').exists()).toBe(false);
  });

  it('grid row props (align/justify/gutter/type) are forwarded to Row and the rest to Col', () => {
    const w = mount(List, {
      props: { grid: { gutter: 12, span: 6, justify: 'center', align: 'middle', xs: 24 } },
      slots: { default: () => h(ListItem, null, () => 'g') },
    });
    const row = w.find('.semi-row-flex');
    expect(row.classes()).toContain('semi-row-flex-center');
    expect(row.classes()).toContain('semi-row-flex-middle');
    const col = w.find('.semi-col');
    expect(col.classes()).toContain('semi-col-6');
    expect(col.classes()).toContain('semi-col-xs-24');
  });

  it('item-level onClick / onRightClick take precedence over the List-level ones', async () => {
    const listClick = vi.fn();
    const listRight = vi.fn();
    const itemClick = vi.fn();
    const itemRight = vi.fn();
    const w = mount(List, {
      props: { onClick: listClick, onRightClick: listRight },
      slots: { default: () => h(ListItem, { onClick: itemClick, onRightClick: itemRight }, () => 'a') },
    });
    const li = w.find('li.semi-list-item');
    await li.trigger('click');
    await li.trigger('contextmenu');
    expect(itemClick).toHaveBeenCalledTimes(1);
    expect(itemRight).toHaveBeenCalledTimes(1);
    expect(listClick).not.toHaveBeenCalled();
    expect(listRight).not.toHaveBeenCalled();
  });

  it('ListItem slots (header/main/extra) win over props and support data attrs / style', () => {
    const w = mount(List, {
      slots: {
        default: () =>
          h(
            ListItem,
            { header: 'hp', main: 'mp', extra: 'ep', style: { color: 'red' }, 'data-id': '7' },
            { default: () => 'kid', header: () => 'hs', main: () => 'ms', extra: () => 'es' }
          ),
      },
    });
    const li = w.find('li.semi-list-item');
    expect(li.find('.semi-list-item-body-header').text()).toBe('hs');
    expect(li.find('.semi-list-item-body-main').text()).toBe('ms');
    expect(li.find('.semi-list-item-extra').text()).toBe('es');
    expect(li.attributes('data-id')).toBe('7');
    expect((li.element as HTMLElement).style.color).toBe('red');
  });

  it.each(['flex-start', 'flex-end', 'center', 'baseline', 'stretch'] as const)('align=%s class', (align) => {
    const w = mount(List, { slots: { default: () => h(ListItem, { header: 'h', align }, () => 'a') } });
    expect(w.find('.semi-list-item-body').classes()).toContain(`semi-list-item-body-${align}`);
  });

  it('does not render body wrapper when neither header nor main is given', () => {
    const w = mount(List, { slots: { default: () => h(ListItem, null, () => 'a') } });
    expect(w.find('.semi-list-item-body').exists()).toBe(false);
  });

  it('dataSource items and slot children render together; empty dataSource with children shows no empty', () => {
    const w = mount(List, {
      props: { dataSource: ['d'], renderItem: (i: string) => h(ListItem, null, () => i) },
      slots: { default: () => h(ListItem, null, () => 'c') },
    });
    const items = w.findAll('li.semi-list-item');
    expect(items.map((i) => i.text())).toEqual(['d', 'c']);
    const w2 = mount(List, { props: { dataSource: [] }, slots: { default: () => h(ListItem, null, () => 'c') } });
    expect(w2.find('.semi-list-empty').exists()).toBe(false);
  });

  it('layout vertical (default) has no flex class', () => {
    const w = mount(List, { slots: { default: () => h(ListItem, null, () => 'a') } });
    expect(w.classes()).not.toContain('semi-list-flex');
    expect(w.classes()).toContain('semi-list-default');
  });
});
