import { mount } from '@vue/test-utils';
import { h, nextTick, defineComponent, ref } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { Table, Column, getColumns, parseHeaderRows, mergeColumns, cloneDeep, getNextSortOrder, mergeComponents } from './index';
import { LocaleProvider } from '../locale';
import en_US_raw from '../locale/source/en_US.js';
const en_US: any = en_US_raw;

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];
const dataSource = [
  { key: '1', name: 'Alice', age: 32, address: 'NY' },
  { key: '2', name: 'Bob', age: 42, address: 'LA' },
  { key: '3', name: 'Carol', age: 21, address: 'SF' },
];

const rows = (w: any) => w.findAll('.semi-table-tbody .semi-table-row');
const heads = (w: any) => w.findAll('.semi-table-thead .semi-table-row-head');

describe('Table basics', () => {
  it('renders wrapper, container, header and body rows with default classes', async () => {
    const w = mount(Table, { props: { columns, dataSource } });
    await nextTick();
    expect(w.find('.semi-table-wrapper').exists()).toBe(true);
    expect(w.find('.semi-table-wrapper').classes()).toContain('semi-table-wrapper-ltr');
    expect(w.find('.semi-table-wrapper').attributes('data-column-fixed')).toBe('false');
    expect(w.find('.semi-table').exists()).toBe(true);
    expect(w.find('.semi-table-container').exists()).toBe(true);
    expect(w.find('.semi-table-thead').exists()).toBe(true);
    expect(w.find('.semi-table-tbody').exists()).toBe(true);
    expect(heads(w)).toHaveLength(3);
    expect(rows(w)).toHaveLength(3);
    expect(heads(w)[0].text()).toBe('Name');
    expect(rows(w)[0].findAll('.semi-table-row-cell')[0].text()).toBe('Alice');
    expect(rows(w)[0].attributes('data-row-key')).toBe('1');
    expect(rows(w)[0].attributes('role')).toBe('row');
    expect(rows(w)[0].attributes('aria-rowindex')).toBe('1');
    expect(w.find('table').attributes('role')).toBe('grid');
    expect(w.find('table').attributes('aria-rowcount')).toBe('3');
    expect(w.find('table').attributes('aria-colcount')).toBe('3');
    expect(w.find('.semi-table-colgroup').findAll('.semi-table-col')).toHaveLength(3);
    expect(w.find('.semi-spin').exists()).toBe(true);
    expect(w.find('.semi-spin').classes()).toContain('semi-spin-hidden');
  });

  it('applies class / style / id / data-* attrs on the wrapper', async () => {
    const w = mount(Table, { props: { columns, dataSource, id: 'tbl', 'data-foo': 'bar' } as any, attrs: { class: 'my-table', style: 'width: 300px' } });
    const wrap = w.find('.semi-table-wrapper');
    expect(wrap.classes()).toContain('my-table');
    expect(wrap.attributes('id')).toBe('tbl');
    expect(wrap.attributes('data-foo')).toBe('bar');
    expect(wrap.attributes('style')).toContain('width: 300px');
  });

  it.each([
    ['small', 'semi-table-small'],
    ['middle', 'semi-table-middle'],
  ] as const)('size=%s adds %s', async (size, cls) => {
    const w = mount(Table, { props: { columns, dataSource, size } });
    expect(w.find('.semi-table-container').element.parentElement!.classList.contains(cls)).toBe(true);
  });

  it('size=default adds no size class', () => {
    const w = mount(Table, { props: { columns, dataSource } });
    const inner = w.find('.semi-table-container').element.parentElement!;
    expect(inner.classList.contains('semi-table-small')).toBe(false);
    expect(inner.classList.contains('semi-table-middle')).toBe(false);
  });

  it('bordered / loading / showHeader=false', async () => {
    const w = mount(Table, { props: { columns, dataSource, bordered: true, loading: true, showHeader: false } });
    await nextTick();
    expect(w.find('.semi-table-bordered').exists()).toBe(true);
    expect(w.find('.semi-spin').classes()).not.toContain('semi-spin-hidden');
    expect(w.find('.semi-table-thead').exists()).toBe(false);
  });

  it('showHeader=false with fixed header renders a hidden header wrapper', () => {
    const w = mount(Table, { props: { columns, dataSource, showHeader: false, scroll: { y: 100 } } });
    expect(w.find('.semi-table-header').classes()).toContain('semi-table-header-hidden');
  });

  it('renders empty placeholder with locale text and custom empty (prop + slot)', async () => {
    const w = mount(Table, { props: { columns, dataSource: [] } });
    expect(w.find('.semi-table-placeholder').exists()).toBe(true);
    expect(w.find('.semi-table-empty').text()).toBe('暂无数据');
    expect(rows(w)).toHaveLength(0);
    const w2 = mount(Table, { props: { columns, dataSource: [], empty: 'Nothing' } });
    expect(w2.find('.semi-table-empty').text()).toBe('Nothing');
    const w3 = mount(Table, { props: { columns, dataSource: [] }, slots: { empty: () => h('i', { class: 'custom-empty' }, 'x') } });
    expect(w3.find('.semi-table-empty .custom-empty').exists()).toBe(true);
    const w4 = mount(LocaleProvider, { props: { locale: en_US }, slots: { default: () => h(Table, { columns, dataSource: [] }) } });
    expect(w4.find('.semi-table-empty').text()).toBe('No Result');
  });

  it('title / footer as string, function and slots', () => {
    const titleFn = vi.fn((ds: any[]) => `count ${ds.length}`);
    const footerFn = vi.fn((ds: any[]) => h('b', `f ${ds.length}`));
    const w = mount(Table, { props: { columns, dataSource, title: titleFn, footer: footerFn } });
    expect(w.find('.semi-table-title').text()).toBe('count 3');
    expect(w.find('.semi-table-title').attributes('x-semi-prop')).toBe('title');
    expect(w.find('.semi-table-footer b').text()).toBe('f 3');
    expect(titleFn).toHaveBeenCalledWith(expect.any(Array));
    const w2 = mount(Table, { props: { columns, dataSource, title: 'T', footer: 'F' } });
    expect(w2.find('.semi-table-title').text()).toBe('T');
    expect(w2.find('.semi-table-footer').text()).toBe('F');
    const w3 = mount(Table, { props: { columns, dataSource }, slots: { title: ({ dataSource: ds }: any) => `slot ${ds.length}`, footer: () => 'sf' } });
    expect(w3.find('.semi-table-title').text()).toBe('slot 3');
    expect(w3.find('.semi-table-footer').text()).toBe('sf');
    expect(mount(Table, { props: { columns, dataSource } }).find('.semi-table-title').exists()).toBe(false);
  });

  it('column.render receives (text, record, index, options) and supports colSpan / rowSpan via { children, props }', () => {
    const render = vi.fn((text: any, record: any, index: number) => h('span', { class: 'r' }, `${text}-${record.key}-${index}`));
    const cols = [
      { title: 'Name', dataIndex: 'name', render },
      {
        title: 'Age',
        dataIndex: 'age',
        render: (text: any, _r: any, index: number) => (index === 0 ? { children: text, props: { colSpan: 2 } } : index === 1 ? { children: text, props: { rowSpan: 2 } } : { children: text, props: { rowSpan: 0 } }),
      },
      { title: 'Address', dataIndex: 'address', render: (t: any, _r: any, index: number) => (index === 0 ? { children: t, props: { colSpan: 0 } } : t) },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource } });
    expect(render).toHaveBeenCalledTimes(3);
    expect((render.mock.calls[0] as any[])[3]).toEqual(expect.objectContaining({ isHovering: false }));
    expect(rows(w)[0].find('.r').text()).toBe('Alice-1-0');
    const firstRowCells = rows(w)[0].findAll('td');
    expect(firstRowCells).toHaveLength(2);
    expect(firstRowCells[1].attributes('colspan')).toBe('2');
    expect(rows(w)[1].findAll('td')[1].attributes('rowspan')).toBe('2');
    expect(rows(w)[2].findAll('td')).toHaveLength(2);
  });

  it('render can return { children, props } with style/className merged into the td', () => {
    const cols = [{ title: 'Name', dataIndex: 'name', render: (t: any) => ({ children: t, props: { style: { color: 'red' }, class: 'custom-td' } }) }];
    const w = mount(Table, { props: { columns: cols, dataSource } });
    const td = rows(w)[0].find('td');
    expect(td.attributes('style')).toContain('color: red');
    expect(td.classes()).toContain('custom-td');
  });

  it('dataIndex missing passes the record to render; nested dataIndex path works', () => {
    const cols = [
      { title: 'A', render: (rec: any) => rec.name },
      { title: 'B', dataIndex: 'meta.city' },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource: [{ key: 1, name: 'n', meta: { city: 'c' } }] } });
    const cells = rows(w)[0].findAll('td');
    expect(cells[0].text()).toBe('n');
    expect(cells[1].text()).toBe('c');
  });

  it('column.width / align / className / ellipsis', () => {
    const cols = [
      { title: 'Name', dataIndex: 'name', width: 120, align: 'center', className: 'col-name', ellipsis: true },
      { title: 'Age', dataIndex: 'age', width: '20%', align: 'right', ellipsis: { showTitle: false } },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource } });
    const colEls = w.findAll('col');
    expect(colEls[0].attributes('style')).toContain('width: 120px');
    expect(colEls[0].classes()).toContain('col-name');
    expect(colEls[1].attributes('style')).toContain('width: 20%');
    const th = heads(w)[0];
    expect(th.classes()).toContain('col-name');
    expect(th.classes()).toContain('semi-table-align-center');
    expect(th.classes()).toContain('semi-table-row-head-ellipsis');
    expect(th.attributes('style')).toContain('text-align: center');
    expect(heads(w)[1].attributes('style')).toContain('text-align: right');
    const td = rows(w)[0].findAll('td')[0];
    expect(td.classes()).toContain('col-name');
    expect(td.classes()).toContain('semi-table-row-cell-ellipsis');
    expect(td.attributes('style')).toContain('text-align: center');
    expect(td.attributes('title')).toBe('Alice');
    expect(rows(w)[0].findAll('td')[1].attributes('title')).toBeUndefined();
    // table-layout fixed when any column has ellipsis
    expect(w.find('table').classes()).toContain('semi-table-fixed');
  });

  it('ellipsis title on header when title is string', () => {
    const w = mount(Table, { props: { columns: [{ title: 'Long title', dataIndex: 'name', ellipsis: true }], dataSource } });
    expect(heads(w)[0].attributes('title')).toBe('Long title');
  });

  it('fixed columns: classes, data-column-fixed and sticky offsets from column widths', async () => {
    const cols = [
      { title: 'A', dataIndex: 'name', fixed: true, width: 100 },
      { title: 'B', dataIndex: 'age', width: 100 },
      { title: 'C', dataIndex: 'address', fixed: 'right', width: 80 },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, scroll: { x: 600 } }, attachTo: document.body });
    await nextTick();
    await nextTick();
    expect(w.find('.semi-table-wrapper').attributes('data-column-fixed')).toBe('true');
    const th = heads(w);
    expect(th[0].classes()).toContain('semi-table-cell-fixed-left');
    expect(th[0].classes()).toContain('semi-table-cell-fixed-left-last');
    expect(th[2].classes()).toContain('semi-table-cell-fixed-right');
    expect(th[2].classes()).toContain('semi-table-cell-fixed-right-first');
    expect(th[0].attributes('style')).toContain('position: sticky');
    expect(th[0].attributes('style')).toContain('left: 0px');
    expect(th[2].attributes('style')).toContain('right: 0px');
    const tds = rows(w)[0].findAll('td');
    expect(tds[0].classes()).toContain('semi-table-cell-fixed-left');
    expect(tds[0].classes()).toContain('semi-table-cell-fixed-left-last');
    expect(tds[0].attributes('style')).toContain('left: 0px');
    expect(tds[2].classes()).toContain('semi-table-cell-fixed-right');
    expect(tds[2].attributes('style')).toContain('right: 0px');
    expect(w.find('table').attributes('style')).toContain('width: 600px');
    expect(w.find('.semi-table-body').attributes('style')).toContain('overflow: auto');
    expect(w.find('.semi-table-container').element.parentElement!.classList.contains('semi-table-scroll-position-left')).toBe(true);
    w.unmount();
  });

  it('scroll.y renders a separate fixed header table and body maxHeight', () => {
    const w = mount(Table, { props: { columns, dataSource, scroll: { y: 200 } } });
    expect(w.find('.semi-table-fixed-header').exists()).toBe(true);
    expect(w.find('.semi-table-header').exists()).toBe(true);
    expect(w.find('.semi-table-header .semi-table-thead').exists()).toBe(true);
    expect(w.find('.semi-table-body .semi-table-thead').exists()).toBe(false);
    expect(w.find('.semi-table-body').attributes('style')).toContain('max-height: 200px');
    expect(w.findAll('table')).toHaveLength(2);
  });

  it('sticky renders sticky header with top offset', () => {
    const w = mount(Table, { props: { columns, dataSource, sticky: { top: 20 } } });
    const header = w.find('.semi-table-header');
    expect(header.classes()).toContain('semi-table-header-sticky');
    expect(header.attributes('style')).toContain('top: 20px');
    expect(mount(Table, { props: { columns, dataSource, sticky: true } }).find('.semi-table-header-sticky').exists()).toBe(true);
  });

  it('grouped header (column.children) renders multiple header rows with colspan/rowspan', () => {
    const cols = [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Info', children: [{ title: 'Age', dataIndex: 'age' }, { title: 'Address', dataIndex: 'address' }] },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource } });
    const headRows = w.findAll('.semi-table-thead .semi-table-row');
    expect(headRows).toHaveLength(2);
    const firstRowHeads = headRows[0].findAll('th');
    expect(firstRowHeads[0].attributes('rowspan')).toBe('2');
    expect(firstRowHeads[1].attributes('colspan')).toBe('2');
    expect(headRows[1].findAll('th')).toHaveLength(2);
    expect(rows(w)[0].findAll('td')).toHaveLength(3);
    expect(w.findAll('col')).toHaveLength(3);
    const parsed = parseHeaderRows(cols);
    expect(parsed[0][1].colSpan).toBe(2);
    expect(parsed[0][0].rowSpan).toBe(2);
  });

  it('column.colSpan / rowSpan on the header cell', () => {
    const cols = [
      { title: 'Name', dataIndex: 'name', colSpan: 2 },
      { title: 'Age', dataIndex: 'age', colSpan: 0 },
      { title: 'Address', dataIndex: 'address' },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource } });
    const th = heads(w);
    expect(th).toHaveLength(2);
    expect(th[0].attributes('colspan')).toBe('2');
  });

  it('Table.Column declarative children (props + title/cell slots + nesting)', () => {
    const w = mount(Table, {
      props: { dataSource },
      slots: {
        default: () => [
          h(Column, { title: 'Name', dataIndex: 'name', key: 'name', width: 100 }),
          h(Column, { dataIndex: 'age', key: 'age' }, { title: () => h('i', 'AgeTitle'), cell: ({ text, record }: any) => h('em', `${text}/${record.name}`) }),
          h(Column, { title: 'Group', key: 'g' }, { default: () => [h(Column, { title: 'Addr', dataIndex: 'address', key: 'address' })] }),
        ],
      },
    });
    const headRows = w.findAll('.semi-table-thead .semi-table-row');
    expect(headRows).toHaveLength(2);
    expect(headRows[0].findAll('th')[0].text()).toBe('Name');
    expect(headRows[0].find('i').text()).toBe('AgeTitle');
    expect(headRows[1].find('th').text()).toBe('Addr');
    expect(rows(w)[0].find('em').text()).toBe('32/Alice');
    expect(rows(w)[0].findAll('td')[2].text()).toBe('NY');
    expect(w.findAll('col')[0].attributes('style')).toContain('width: 100px');
    expect((Table as any).Column).toBe(Column);
  });

  it('getColumns converts Column vnodes, boolean attrs and nested children', () => {
    const cols = getColumns([h(Column, { title: 'A', dataIndex: 'a', key: 'a', sorter: '' } as any), h(Column, { title: 'B', key: 'b' }, { default: () => [h(Column, { title: 'C', dataIndex: 'c', key: 'c' })] }), h('div')]);
    expect(cols).toHaveLength(2);
    expect(cols[0]).toMatchObject({ title: 'A', dataIndex: 'a', key: 'a', sorter: true });
    expect(cols[1].children[0]).toMatchObject({ title: 'C', dataIndex: 'c' });
    expect(getColumns(null)).toEqual([]);
  });

  it('rowKey as string path and as function', () => {
    const w = mount(Table, { props: { columns, dataSource: [{ id: 'x', name: 'n' }], rowKey: 'id' } });
    expect(rows(w)[0].attributes('data-row-key')).toBe('x');
    const w2 = mount(Table, { props: { columns, dataSource: [{ id: 'y', name: 'n' }], rowKey: (r: any) => `k-${r.id}` } });
    expect(rows(w2)[0].attributes('data-row-key')).toBe('k-y');
  });

  it('onRow / onHeaderRow / onCell / onHeaderCell props merge attrs, class, style and handlers', async () => {
    const rowClick = vi.fn();
    const cellClick = vi.fn();
    const headerCellClick = vi.fn();
    const onRow = vi.fn((record: any, index: number) => ({ class: `row-${index}`, style: { color: 'red' }, 'data-x': record.key, onClick: rowClick }));
    const onHeaderRow = vi.fn(() => ({ className: 'hrow', 'data-h': '1' }));
    const cols = [
      { title: 'Name', dataIndex: 'name', onCell: (r: any, i: number) => ({ className: 'cell-cls', style: { fontWeight: 'bold' }, 'data-cell': `${r.key}-${i}`, onClick: cellClick }), onHeaderCell: () => ({ className: 'hcell', 'data-hc': 'y', onClick: headerCellClick }) },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, onRow, onHeaderRow } });
    expect(onRow).toHaveBeenCalledWith(dataSource[0], 0, { disabled: false, selected: false });
    expect(onHeaderRow).toHaveBeenCalledWith(expect.any(Array), 0);
    const r0 = rows(w)[0];
    expect(r0.classes()).toContain('row-0');
    expect(r0.attributes('style')).toContain('color: red');
    expect(r0.attributes('data-x')).toBe('1');
    await r0.trigger('click');
    expect(rowClick).toHaveBeenCalledTimes(1);
    const td = r0.find('td');
    expect(td.classes()).toContain('cell-cls');
    expect(td.attributes('style')).toContain('font-weight: bold');
    expect(td.attributes('data-cell')).toBe('1-0');
    await td.trigger('click');
    expect(cellClick).toHaveBeenCalledTimes(1);
    const headRow = w.find('.semi-table-thead .semi-table-row');
    expect(headRow.classes()).toContain('hrow');
    expect(headRow.attributes('data-h')).toBe('1');
    const th = heads(w)[0];
    expect(th.classes()).toContain('hcell');
    expect(th.attributes('data-hc')).toBe('y');
    await th.trigger('click');
    expect(headerCellClick).toHaveBeenCalledTimes(1);
  });

  it('rowClassName string / function', () => {
    const w = mount(Table, { props: { columns, dataSource, rowClassName: 'plain' } });
    expect(rows(w)[0].classes()).toContain('plain');
    const w2 = mount(Table, { props: { columns, dataSource, rowClassName: (_r: any, i: number) => `idx-${i}` } });
    expect(rows(w2)[1].classes()).toContain('idx-1');
  });

  it('headerStyle applies to header cells, onHeaderCell style overrides', () => {
    const cols = [{ title: 'A', dataIndex: 'name', onHeaderCell: () => ({ style: { color: 'blue' } }) }, { title: 'B', dataIndex: 'age' }];
    const w = mount(Table, { props: { columns: cols, dataSource, headerStyle: { color: 'green', fontSize: '10px' } } });
    expect(heads(w)[0].attributes('style')).toContain('color: blue');
    expect(heads(w)[0].attributes('style')).toContain('font-size: 10px');
    expect(heads(w)[1].attributes('style')).toContain('color: green');
  });

  it('hover: mouseenter adds row-hovered class and render receives isHovering', async () => {
    const render = vi.fn((t: any, _r: any, _i: number, opts: any) => `${t}:${opts.isHovering}`);
    const w = mount(Table, { props: { columns: [{ title: 'N', dataIndex: 'name', render }], dataSource } });
    const r0 = rows(w)[0];
    await r0.trigger('mouseenter');
    await nextTick();
    expect(rows(w)[0].classes()).toContain('semi-table-row-hovered');
    expect(rows(w)[0].text()).toBe('Alice:true');
    expect(rows(w)[1].classes()).not.toContain('semi-table-row-hovered');
    await rows(w)[0].trigger('mouseleave');
    await nextTick();
    expect(rows(w)[0].classes()).not.toContain('semi-table-row-hovered');
  });

  it('rowSpanHover highlights all rows covered by a rowspan cell', async () => {
    const cols = [{ title: 'N', dataIndex: 'name', render: (t: any, _r: any, i: number) => (i === 0 ? { children: t, props: { rowSpan: 2 } } : i === 1 ? { children: t, props: { rowSpan: 0 } } : t) }, { title: 'A', dataIndex: 'age' }];
    const w = mount(Table, { props: { columns: cols, dataSource, rowSpanHover: true }, attachTo: document.body });
    await rows(w)[1].trigger('mouseenter');
    await nextTick();
    expect(rows(w)[0].classes()).toContain('semi-table-row-hovered');
    expect(rows(w)[1].classes()).toContain('semi-table-row-hovered');
    expect(rows(w)[2].classes()).not.toContain('semi-table-row-hovered');
    await w.find('.semi-table-body').trigger('mouseleave');
    expect(rows(w)[0].classes()).not.toContain('semi-table-row-hovered');
    w.unmount();
  });

  it('components override: custom body row / cell / header cell tags', () => {
    const components = { body: { row: 'div', cell: 'span' }, header: { cell: 'div' } };
    const w = mount(Table, { props: { columns, dataSource, components } });
    expect(w.findAll('.semi-table-tbody > div.semi-table-row')).toHaveLength(3);
    expect(w.findAll('.semi-table-tbody span.semi-table-row-cell')).toHaveLength(9);
    expect(w.findAll('.semi-table-thead div.semi-table-row-head')).toHaveLength(3);
  });

  it('direction rtl: wrapper class, align swap and fixed side swap', () => {
    const cols = [{ title: 'A', dataIndex: 'name', align: 'left', fixed: true, width: 100 }, { title: 'B', dataIndex: 'age', width: 100 }];
    const w = mount(Table, { props: { columns: cols, dataSource, direction: 'rtl' } });
    expect(w.find('.semi-table-wrapper').classes()).toContain('semi-table-wrapper-rtl');
    expect(heads(w)[0].attributes('style')).toContain('text-align: right');
    expect(heads(w)[0].classes()).toContain('semi-table-cell-fixed-right');
    expect(rows(w)[0].findAll('td')[0].classes()).toContain('semi-table-cell-fixed-right');
    expect(rows(w)[0].findAll('td')[0].attributes('style')).toContain('right: 0px');
  });

  it('updates when dataSource / columns props change', async () => {
    const w = mount(Table, { props: { columns, dataSource } });
    await w.setProps({ dataSource: [...dataSource, { key: '4', name: 'Dan', age: 5, address: 'X' }] });
    await nextTick();
    expect(rows(w)).toHaveLength(4);
    await w.setProps({ columns: [{ title: 'Only', dataIndex: 'name' }] });
    await nextTick();
    expect(heads(w)).toHaveLength(1);
    expect(heads(w)[0].text()).toBe('Only');
    expect(rows(w)[0].findAll('td')).toHaveLength(1);
  });

  it('exposes getCurrentPageData', async () => {
    const w = mount(Table, { props: { columns, dataSource, pagination: { pageSize: 2 } } });
    await nextTick();
    const data = (w.vm as any).getCurrentPageData();
    expect(data.dataSource).toHaveLength(2);
    expect(data.dataSource[0].name).toBe('Alice');
    expect(data.dataSource).not.toBe(dataSource);
  });

  it('static keys on Table', () => {
    expect((Table as any).DEFAULT_KEY_COLUMN_SELECTION).toBe('column-selection');
    expect((Table as any).DEFAULT_KEY_COLUMN_EXPAND).toBe('column-expand');
  });

  it('utils: mergeColumns / cloneDeep / getNextSortOrder / mergeComponents', () => {
    const fn = () => 1;
    const merged = mergeColumns([{ key: 'a', width: 50 }], [{ key: 'a', title: 'A', render: fn }, { key: 'b' }]);
    expect(merged[0]).toMatchObject({ key: 'a', width: 50, title: 'A' });
    expect(merged[0].render).toBe(fn);
    expect(merged[1]).toEqual({ key: 'b' });
    const vnode = h('i');
    const cloned = cloneDeep({ a: [1, { b: 2 }], vnode, fn });
    expect(cloned.a).not.toBe(undefined);
    expect(cloned.vnode).toBe(vnode);
    expect(cloned.fn).toBe(fn);
    expect(getNextSortOrder(false)).toBe('ascend');
    expect(getNextSortOrder('ascend')).toBe('descend');
    expect(getNextSortOrder('descend')).toBe('cancelSort');
    expect(mergeComponents().body.row).toBe('tr');
    expect(mergeComponents(undefined, true).body.row).toBe('div');
    expect(mergeComponents({ body: { row: 'x' } }).body.cell).toBe('td');
  });

  it('virtualized body exposes VariableSizeList-like ref', async () => {
    const listRef: any = { current: null };
    const lots = Array.from({ length: 40 }, (_, i) => ({ key: String(i), name: `N${i}`, age: i, address: `A${i}` }));
    const w = mount(Table, {
      props: {
        columns,
        dataSource: lots,
        pagination: false,
        scroll: { y: 240 },
        virtualized: { itemSize: 56, overscanCount: 2 },
        getVirtualizedListRef: (r: any) => {
          listRef.current = r?.current ?? r;
        },
      },
    });
    await nextTick();
    await nextTick();
    expect(w.find('.semi-table-virtualized').exists()).toBe(true);
    expect(listRef.current).toBeTruthy();
    expect(typeof listRef.current.scrollTo).toBe('function');
    expect(typeof listRef.current.scrollToItem).toBe('function');
    expect(typeof listRef.current.resetAfterIndex).toBe('function');
    listRef.current.resetAfterIndex(0);
    listRef.current.scrollToItem(10);
    w.unmount();
  });

  it('warns when columns and children are both given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Parent = defineComponent({
      setup() {
        const cols = ref(columns);
        return () => h(Table, { columns: cols.value, dataSource }, () => [h(Column, { title: 'x', dataIndex: 'x' })]);
      },
    });
    const w = mount(Parent);
    w.vm.$forceUpdate();
    expect(heads(w)).toHaveLength(3);
    warn.mockRestore();
  });
});

describe('Table official features', () => {
  it('rowSelection renders header/row checkboxes and fires onChange / onSelect', async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const w = mount(Table, {
      props: { columns, dataSource, pagination: false, rowSelection: { onChange, onSelect } },
      attachTo: document.body,
    });
    await nextTick();
    const boxes = w.findAll('.semi-checkbox');
    expect(boxes.length).toBe(4);
    await boxes[1].trigger('click');
    await nextTick();
    expect(onSelect).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toEqual(['1']);
    expect(rows(w)[0].classes()).toContain('semi-table-row-selected');
    w.unmount();
  });

  it('rowSelection.getCheckboxProps disables a row; clickRow toggles selection', async () => {
    const onChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns,
        dataSource,
        pagination: false,
        rowSelection: {
          clickRow: true,
          onChange,
          getCheckboxProps: (record: any) => ({ disabled: record.name === 'Bob' }),
        },
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(w.findAll('.semi-checkbox-disabled')).toHaveLength(1);
    await rows(w)[0].trigger('click');
    await nextTick();
    expect(onChange.mock.calls[0][0]).toEqual(['1']);
    onChange.mockClear();
    await rows(w)[1].trigger('click');
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
    w.unmount();
  });

  it('pagination pageSize slices rows and next page shows remaining', async () => {
    const w = mount(Table, { props: { columns, dataSource, pagination: { pageSize: 2 } }, attachTo: document.body });
    await nextTick();
    expect(rows(w)).toHaveLength(2);
    expect(rows(w)[0].text()).toContain('Alice');
    const pageItems = w.findAll('li.semi-page-item').filter((li: any) => !li.classes().includes('semi-page-prev') && !li.classes().includes('semi-page-next'));
    expect(pageItems.length).toBeGreaterThanOrEqual(2);
    await pageItems[1].trigger('click');
    await nextTick();
    expect(rows(w)).toHaveLength(1);
    expect(rows(w)[0].text()).toContain('Carol');
    w.unmount();
  });

  it('sorter click reorders rows', async () => {
    const cols = [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Age', dataIndex: 'age', sorter: (a: any, b: any) => a.age - b.age },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, pagination: false } });
    await nextTick();
    expect(rows(w)[0].text()).toContain('Alice');
    await w.find('.semi-table-column-sorter-wrapper').trigger('click');
    await nextTick();
    expect(rows(w)[0].text()).toContain('Carol');
    expect(w.find('.semi-table-column-sorter-up').classes()).toContain('on');
    await w.find('.semi-table-column-sorter-wrapper').trigger('click');
    await nextTick();
    expect(rows(w)[0].text()).toContain('Bob');
  });

  it('filteredValue + onFilter filters locally', async () => {
    const cols = [
      {
        title: 'Name',
        dataIndex: 'name',
        filters: [{ text: 'Alice', value: 'Alice' }],
        onFilter: (value: string, record: any) => record.name === value,
        filteredValue: ['Alice'],
      },
      { title: 'Age', dataIndex: 'age' },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, pagination: false } });
    await nextTick();
    expect(rows(w)).toHaveLength(1);
    expect(rows(w)[0].text()).toContain('Alice');
    expect(w.find('.semi-table-column-filter').exists()).toBe(true);
  });

  it('filterConfirmMode=confirm shows OK / Reset in the dropdown', async () => {
    const cols = [
      {
        title: 'Name',
        dataIndex: 'name',
        filterConfirmMode: 'confirm' as const,
        filters: [{ text: 'Alice', value: 'Alice' }, { text: 'Bob', value: 'Bob' }],
        onFilter: (value: string, record: any) => record.name === value,
      },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, pagination: false }, attachTo: document.body });
    await nextTick();
    await w.find('.semi-table-column-filter').trigger('click');
    await nextTick();
    await new Promise((r) => setTimeout(r, 80));
    const confirm = document.querySelector('.semi-table-column-filter-confirm');
    expect(confirm).toBeTruthy();
    expect(confirm!.textContent).toMatch(/确定|OK|Reset|重置/);
    w.unmount();
  });

  it('expandedRowRender + expand icon; rowExpandable hides one icon', async () => {
    const w = mount(Table, {
      props: {
        columns,
        dataSource,
        pagination: false,
        expandedRowRender: (record: any) => h('div', { class: 'exp' }, record.name),
        rowExpandable: (record: any) => record.name !== 'Bob',
      },
    });
    await nextTick();
    const icons = w.findAll('.semi-table-expand-icon');
    expect(icons).toHaveLength(2);
    await icons[0].trigger('click');
    await nextTick();
    expect(w.find('.exp').text()).toBe('Alice');
    expect(rows(w)[0].attributes('aria-expanded')).toBe('true');
  });

  it('hideExpandedColumn=false renders a dedicated expand column', async () => {
    const w = mount(Table, {
      props: { columns, dataSource, pagination: false, expandedRowRender: () => 'x', hideExpandedColumn: false },
    });
    await nextTick();
    expect(heads(w).length).toBeGreaterThanOrEqual(4);
    expect(w.find('.semi-table-expand-icon').exists()).toBe(true);
  });

  it('tree data with children + defaultExpandAllRows', async () => {
    const tree = [
      { key: '0', name: 'Parent', age: 1, address: 'A', children: [{ key: '0-0', name: 'Child', age: 2, address: 'B' }] },
    ];
    const w = mount(Table, { props: { columns, dataSource: tree, pagination: false, defaultExpandAllRows: true } });
    await nextTick();
    expect(rows(w).length).toBeGreaterThanOrEqual(2);
    expect(w.find('table').attributes('role')).toBe('treegrid');
    expect(rows(w)[0].attributes('aria-level')).toBe('1');
    expect(rows(w)[1].attributes('aria-level')).toBe('2');
    expect(rows(w)[1].text()).toContain('Child');
  });

  it('groupBy + renderGroupSection renders section rows', async () => {
    const w = mount(Table, {
      props: {
        columns,
        dataSource,
        pagination: false,
        groupBy: 'address',
        renderGroupSection: (key: any) => `g-${key}`,
        defaultExpandAllGroupRows: true,
      },
    });
    await nextTick();
    await nextTick();
    const sections = w.findAll('.semi-table-row-section');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].text()).toMatch(/g-/);
    expect(rows(w).length).toBeGreaterThanOrEqual(3);
  });

  it('resizable adds react-resizable handles on columns with numeric width', async () => {
    const cols = [
      { title: 'Name', dataIndex: 'name', width: 120 },
      { title: 'Age', dataIndex: 'age', width: 80, resize: false },
      { title: 'Address', dataIndex: 'address' },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, pagination: false, resizable: true, bordered: true } });
    await nextTick();
    expect(w.findAll('.react-resizable').length).toBeGreaterThanOrEqual(1);
    expect(w.find('.react-resizable-handle').exists()).toBe(true);
  });

  it('resizable drag updates column width on ColGroup', async () => {
    const cols = [
      { title: 'Name', dataIndex: 'name', width: 120 },
      { title: 'Age', dataIndex: 'age', width: 80 },
    ];
    const w = mount(Table, { props: { columns: cols, dataSource, pagination: false, resizable: true, bordered: true } });
    await nextTick();
    const handle = w.find('.react-resizable-handle');
    expect(handle.exists()).toBe(true);
    const th = handle.element.parentElement as HTMLElement;
    const inst: any = (th as any).__vueParentComponent;
    expect(typeof inst?.props?.onResize).toBe('function');
    inst.props.onResize(new Event('mousemove'), { size: { width: 200, height: 0 } });
    await nextTick();
    await nextTick();
    const colStyles = w.findAll('col').map((c: any) => c.attributes('style') || '');
    expect(colStyles.some((s: string) => s.includes('200px'))).toBe(true);
  });

  it('checkRelation=related selects children when parent is checked', async () => {
    const onChange = vi.fn();
    const tree = [{ key: '0', name: 'P', age: 1, address: 'A', children: [{ key: '0-0', name: 'C', age: 2, address: 'B' }] }];
    const w = mount(Table, {
      props: {
        columns,
        dataSource: tree,
        pagination: false,
        defaultExpandAllRows: true,
        rowSelection: { checkRelation: 'related', onChange },
      },
      attachTo: document.body,
    });
    await nextTick();
    await w.findAll('.semi-checkbox')[1].trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    const keys = onChange.mock.calls[0][0] as Array<string | number>;
    expect(keys).toEqual(expect.arrayContaining(['0', '0-0']));
    w.unmount();
  });
});

