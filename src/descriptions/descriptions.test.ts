import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Descriptions, { DescriptionsItem } from './index';

const data = [
  { key: 'Name', value: 'Semi' },
  { key: 'Age', value: () => h('b', '3') },
  { key: 'Hidden', value: 'no', hidden: true },
  { key: 'City', value: 'Beijing', span: 2, className: 'city', style: { color: 'red' }, keyStyle: { width: '10px' } },
];

const children = () => [
  h(DescriptionsItem, { itemKey: 'A' }, () => 'a'),
  h(DescriptionsItem, { itemKey: 'B' }, () => h('i', 'b')),
  h(DescriptionsItem, { itemKey: 'C', hidden: true }, () => 'c'),
  h(DescriptionsItem, { itemKey: 'D', span: 2 }, () => 'd'),
];

describe('Descriptions', () => {
  it('defaults: center align, vertical layout, table/tbody', () => {
    const w = mount(Descriptions);
    expect(w.classes()).toContain('semi-descriptions');
    expect(w.classes()).toContain('semi-descriptions-center');
    expect(w.classes()).toContain('semi-descriptions-vertical');
    expect(w.classes()).not.toContain('semi-descriptions-double');
    expect(w.classes()).not.toContain('semi-descriptions-horizontal');
    expect(w.find('table > tbody').exists()).toBe(true);
  });

  it.each(['left', 'justify', 'plain', 'center'] as const)('align=%s', (align) => {
    expect(mount(Descriptions, { props: { align } }).classes()).toContain(`semi-descriptions-${align}`);
  });

  it('row + size switch to double classes and drop align class', () => {
    const w = mount(Descriptions, { props: { row: true, size: 'small', align: 'left' } });
    expect(w.classes()).toContain('semi-descriptions-double');
    expect(w.classes()).toContain('semi-descriptions-double-small');
    expect(w.classes()).not.toContain('semi-descriptions-left');
    expect(mount(Descriptions, { props: { row: true } }).classes()).toContain('semi-descriptions-double-medium');
    expect(mount(Descriptions, { props: { row: true, size: 'large' } }).classes()).toContain('semi-descriptions-double-large');
  });

  it('class / style / data attrs on root; other attrs dropped', () => {
    const w = mount(Descriptions, { attrs: { class: 'c', style: { margin: '1px' }, 'data-a': 'b', id: 'nope' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('margin: 1px');
    expect(w.attributes('data-a')).toBe('b');
    expect(w.attributes('id')).toBeUndefined();
  });

  it('vertical layout with data renders one tr per visible item (th key + td value)', () => {
    const w = mount(Descriptions, { props: { data } });
    const rows = w.findAll('tbody > tr');
    expect(rows).toHaveLength(3);
    const first = rows[0];
    const th = first.find('th');
    expect(th.classes()).toContain('semi-descriptions-item');
    expect(th.classes()).toContain('semi-descriptions-item-th');
    expect(th.find('.semi-descriptions-key').text()).toBe('Name');
    const td = first.find('td');
    expect(td.classes()).toContain('semi-descriptions-item-td');
    expect(td.attributes('colspan')).toBe('1');
    expect(td.find('.semi-descriptions-value').text()).toBe('Semi');
    // function value
    expect(rows[1].find('.semi-descriptions-value b').text()).toBe('3');
    // span / className / style / keyStyle
    const city = rows[2];
    expect(city.classes()).toContain('city');
    expect(city.attributes('style')).toContain('color: red');
    expect(city.find('td').attributes('colspan')).toBe('3');
    expect(city.find('.semi-descriptions-key').attributes('style')).toContain('width: 10px');
    expect(w.text()).not.toContain('Hidden');
  });

  it('vertical layout with children renders Items directly', () => {
    const w = mount(Descriptions, { slots: { default: children } });
    const rows = w.findAll('tbody > tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].find('.semi-descriptions-key').text()).toBe('A');
    expect(rows[1].find('.semi-descriptions-value i').text()).toBe('b');
    expect(rows[2].find('td').attributes('colspan')).toBe('3');
  });

  it('data wins over children', () => {
    const w = mount(Descriptions, { props: { data: [{ key: 'K', value: 'V' }] }, slots: { default: children } });
    expect(w.findAll('tbody > tr')).toHaveLength(1);
    expect(w.text()).toContain('K');
    expect(w.text()).not.toContain('A');
  });

  it('align=plain renders a single td with "key:" and value', () => {
    const w = mount(Descriptions, { props: { align: 'plain', data: [{ key: 'K', value: 'V', span: 2 }] } });
    const tr = w.find('tbody > tr');
    expect(tr.find('th').exists()).toBe(false);
    const td = tr.find('td');
    expect(td.classes()).toContain('semi-descriptions-item');
    expect(td.attributes('colspan')).toBe('2');
    expect(td.find('.semi-descriptions-key').text()).toBe('K:');
    expect(td.find('.semi-descriptions-value').text()).toBe('V');
  });

  it('horizontal layout with data groups items into rows by column, last span stretches', () => {
    const w = mount(Descriptions, { props: { layout: 'horizontal', column: 2, data: [{ key: 'a', value: 1 }, { key: 'b', value: 2 }, { key: 'c', value: 3 }] } });
    expect(w.classes()).toContain('semi-descriptions-horizontal');
    expect(w.classes()).not.toContain('semi-descriptions-vertical');
    const rows = w.findAll('tbody > tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].findAll('th')).toHaveLength(2);
    expect(rows[0].findAll('td')).toHaveLength(2);
    expect(rows[0].findAll('.semi-descriptions-key').map((k) => k.text())).toEqual(['a', 'b']);
    // last row: single item stretched to fill (span = column - total + 1 = 2 -> colspan 3)
    expect(rows[1].findAll('th')).toHaveLength(1);
    expect(rows[1].find('td').attributes('colspan')).toBe('3');
  });

  it('horizontal layout with children (Descriptions.Item) and hidden items filtered', () => {
    const w = mount(Descriptions, { props: { layout: 'horizontal', column: 3 }, slots: { default: children } });
    const rows = w.findAll('tbody > tr');
    // A(1) + B(1) + D(2) = 4 >= 3 after D -> one row of 3 items; C hidden
    expect(rows).toHaveLength(1);
    expect(rows[0].findAll('th').map((t) => t.text())).toEqual(['A', 'B', 'D']);
    expect(rows[0].findAll('td')[2].attributes('colspan')).toBe('3');
    expect(w.text()).not.toContain('C');
  });

  it('horizontal + plain renders td cells only inside rows', () => {
    const w = mount(Descriptions, { props: { layout: 'horizontal', align: 'plain', column: 2, data: [{ key: 'a', value: 1 }, { key: 'b', value: 2 }] } });
    const row = w.find('tbody > tr');
    expect(row.findAll('th')).toHaveLength(0);
    expect(row.findAll('td')).toHaveLength(2);
    expect(row.findAll('.semi-descriptions-key').map((k) => k.text())).toEqual(['a:', 'b:']);
  });

  it('column prop reflows rows', () => {
    const items = [1, 2, 3, 4].map((n) => ({ key: `k${n}`, value: n }));
    expect(mount(Descriptions, { props: { layout: 'horizontal', column: 4, data: items } }).findAll('tbody > tr')).toHaveLength(1);
    expect(mount(Descriptions, { props: { layout: 'horizontal', column: 1, data: items } }).findAll('tbody > tr')).toHaveLength(4);
  });

  it('non plain-object data entries are skipped', () => {
    const w = mount(Descriptions, { props: { data: [{ key: 'a', value: 1 }, null as any, 'x' as any] } });
    expect(w.findAll('tbody > tr')).toHaveLength(1);
  });

  it('reacts to align / layout changes (context)', async () => {
    const w = mount(Descriptions, { props: { data: [{ key: 'a', value: 1 }] } });
    expect(w.find('th').exists()).toBe(true);
    await w.setProps({ align: 'plain' });
    expect(w.find('th').exists()).toBe(false);
    await w.setProps({ layout: 'horizontal', align: 'center' });
    expect(w.find('th').exists()).toBe(true);
  });

  it('horizontal layout with data: hidden items filtered, function values invoked, keyStyle/className applied', () => {
    const w = mount(Descriptions, {
      props: {
        layout: 'horizontal',
        column: 2,
        data: [
          { key: 'a', value: () => h('b', 'fa'), keyStyle: { width: '7px' }, className: 'ca' },
          { key: 'h', value: 'hidden', hidden: true },
          { key: 'b', value: 'vb' },
        ],
      },
    });
    const rows = w.findAll('tbody > tr');
    expect(rows).toHaveLength(1);
    expect(w.text()).not.toContain('hidden');
    expect(rows[0].find('.semi-descriptions-value b').text()).toBe('fa');
    expect(rows[0].find('.semi-descriptions-key').attributes('style')).toContain('width: 7px');
    expect(rows[0].findAll('.semi-descriptions-key').map((k) => k.text())).toEqual(['a', 'b']);
  });

  it('vertical layout: explicit span on data item is respected (no stretch) and row mode keeps layout class', () => {
    const w = mount(Descriptions, { props: { row: true, data: [{ key: 'a', value: 1, span: 3 }] } });
    expect(w.classes()).toContain('semi-descriptions-vertical');
    expect(w.find('td').attributes('colspan')).toBe('5');
  });

  it('exposes Descriptions.Item', () => {
    expect(Descriptions.Item).toBe(DescriptionsItem);
    expect((DescriptionsItem as any).elementType).toBe('Descriptions.Item');
  });
});

describe('Descriptions.Item', () => {
  const mountItem = (props: any = {}, slots: any = {}, parentProps: any = {}) =>
    mount(Descriptions, { props: parentProps, slots: { default: () => h(DescriptionsItem, props, slots) } });

  it('itemKey as node / slot, value via default slot / value prop / function', () => {
    const w = mountItem({ itemKey: h('b', 'K') }, { default: () => 'v' });
    expect(w.find('.semi-descriptions-key b').text()).toBe('K');
    expect(w.find('.semi-descriptions-value').text()).toBe('v');
    const s = mountItem({ itemKey: 'prop' }, { itemKey: () => h('i', 'slot') });
    expect(s.find('.semi-descriptions-key i').text()).toBe('slot');
    expect(mountItem({ itemKey: 'k', value: 'pv' }).find('.semi-descriptions-value').text()).toBe('pv');
    expect(mountItem({ itemKey: 'k', value: () => h('u', 'fn') }).find('.semi-descriptions-value u').text()).toBe('fn');
  });

  it('hidden renders nothing', () => {
    const w = mountItem({ itemKey: 'k', hidden: true }, { default: () => 'v' });
    expect(w.findAll('tbody > tr')).toHaveLength(0);
  });

  it('span -> colspan (span*2-1 for aligned, span for plain)', () => {
    expect(mountItem({ itemKey: 'k', span: 3 }).find('td').attributes('colspan')).toBe('5');
    expect(mountItem({ itemKey: 'k', span: 3 }, {}, { align: 'plain' }).find('td').attributes('colspan')).toBe('3');
    expect(mountItem({ itemKey: 'k' }).find('td').attributes('colspan')).toBe('1');
  });

  it('keyStyle / class / style / data attrs on the tr', () => {
    const w = mountItem({ itemKey: 'k', keyStyle: { width: '1px' }, class: 'c', style: { color: 'red' }, 'data-a': '1', id: 'nope' });
    const tr = w.find('tbody > tr');
    expect(tr.classes()).toContain('c');
    expect(tr.attributes('style')).toContain('color: red');
    expect(tr.attributes('data-a')).toBe('1');
    expect(tr.attributes('id')).toBeUndefined();
    expect(tr.find('.semi-descriptions-key').attributes('style')).toContain('width: 1px');
  });

  it('renders outside a Descriptions as a plain tr (default context)', () => {
    const w = mount({ render: () => h('table', [h('tbody', [h(DescriptionsItem, { itemKey: 'k' }, () => 'v')])]) });
    expect(w.find('tr th .semi-descriptions-key').text()).toBe('k');
  });
});
