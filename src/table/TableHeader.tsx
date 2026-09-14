import { defineComponent, h, ref } from 'vue';
import type { PropType } from 'vue';
import _isFunction from 'lodash/isFunction';
import _noop from 'lodash/noop';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { shouldShowEllipsisTitle } from '@douyinfe/semi-foundation/lib/es/table/utils';
import TableHeaderRow from './TableHeaderRow';

const defaultComponents = { header: { wrapper: 'thead', row: 'tr', cell: 'th' } };

export function parseHeaderRows(columns: any[]) {
  const rows: any[][] = [];
  function fillRowCells(cols: any[], colIndex: number, parents: any[] = [], rowIndex = 0, level = 0): number[] {
    rows[rowIndex] = rows[rowIndex] || [];
    let currentColIndex = colIndex;
    const colSpans = cols.map((column) => {
      const cell: Record<string, any> = {
        key: column.key,
        className: column.className || '',
        children: _isFunction(column.title) && !column.title.setup && !column.title.render ? column.title() : column.title,
        column,
        colStart: currentColIndex,
        level,
        parents,
      };
      let colSpan = 1;
      const subColumns = column.children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(subColumns, currentColIndex, [...parents, cell], rowIndex + 1, level + 1).reduce((total, count) => total + count, 0);
        cell.hasSubColumns = true;
      }
      if ('colSpan' in column) {
        ({ colSpan } = column);
      }
      if ('rowSpan' in column) {
        cell.rowSpan = column.rowSpan;
      }
      if (column.key === strings.DEFAULT_KEY_COLUMN_SCROLLBAR) {
        cell['x-type'] = strings.DEFAULT_KEY_COLUMN_SCROLLBAR;
      }
      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart + colSpan - 1;
      rows[rowIndex].push(cell);
      currentColIndex += colSpan;
      const ellipsis = column?.ellipsis;
      const shouldShowTitle = shouldShowEllipsisTitle(ellipsis);
      if (shouldShowTitle && typeof cell.children === 'string') {
        cell.title = cell.children;
      }
      return colSpan;
    });
    return colSpans;
  }
  fillRowCells(columns, 0);
  const rowCount = rows.length;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows[rowIndex].forEach((cell) => {
      if (!('rowSpan' in cell) && !cell.hasSubColumns) {
        cell.rowSpan = rowCount - rowIndex;
      }
    });
  }
  return rows;
}

export const tableHeaderProps = {
  components: { type: Object as PropType<any>, default: () => defaultComponents },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  columnManager: { type: Object as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  onHeaderRow: { type: Function as PropType<(columns: any[], index: number) => any>, default: _noop },
  onDidUpdate: { type: Function as PropType<(...args: any[]) => void>, default: _noop },
  fixed: { type: [Boolean, String], default: undefined },
  selectedRowKeysSet: { type: Object as PropType<Set<any>>, default: () => new Set() },
};

/**
 * Render the header of the table header, and control the merging of the columns of the header
 */
const TableHeader = defineComponent({
  name: 'TableHeader',
  props: tableHeaderProps,
  setup(props, { expose }) {
    const theadRef = ref<HTMLElement | null>(null);
    expose({ getElement: () => theadRef.value });
    return () => {
      const { components, columns, prefixCls, fixed, onHeaderRow, selectedRowKeysSet } = props;
      const rows = parseHeaderRows(columns);
      const HeaderWrapper = components?.header?.wrapper || 'thead';
      return h(
        HeaderWrapper,
        { class: `${prefixCls}-thead`, ref: theadRef },
        rows.map((row, idx) => h(TableHeaderRow, { prefixCls, key: idx, index: idx, fixed, columns, row, components, onHeaderRow, selectedRowKeysSet }))
      );
    };
  },
});

export default TableHeader;
