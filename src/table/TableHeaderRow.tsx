import { defineComponent, h, ref, onMounted, onUpdated, watch } from 'vue';
import type { PropType } from 'vue';
import _findIndex from 'lodash/findIndex';
import _omit from 'lodash/omit';
import _map from 'lodash/map';
import _noop from 'lodash/noop';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { arrayAdd, isFirstFixedRight, isLastLeftFixed, isFixedLeft, isFixedRight, sliceColumnsByLevel, getRTLAlign } from '@douyinfe/semi-foundation/lib/es/table/utils';
import { useTableContext } from './context';
import Tooltip from '../tooltip/Tooltip';
import { useLocale } from '../locale';
import { getNextSortOrder } from './utils';
import { normalizeNode, toPx } from '../_utils';
import ResizableHeaderCell from './ResizableHeaderCell';

const defaultComponents = { header: { wrapper: 'thead', row: 'tr', cell: 'th' } };

export const tableHeaderRowProps = {
  components: { type: Object as PropType<any>, default: () => defaultComponents },
  row: { type: Array as PropType<any[]>, default: () => [] },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  onHeaderRow: { type: Function as PropType<(columns: any[], index: number) => any>, default: _noop },
  index: { type: [String, Number] as PropType<number>, default: 0 },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  fixed: { type: [Boolean, String], default: undefined },
  selectedRowKeysSet: { type: Object as PropType<Set<any>>, default: () => new Set() },
};

const TableHeaderRow = defineComponent({
  name: 'TableHeaderRow',
  props: tableHeaderRowProps,
  setup(props) {
    const context = useTableContext();
    const { locale } = useLocale('Table');
    const headerNode = ref<HTMLElement | null>(null);

    const cacheRef = () => {
      const node = headerNode.value;
      if (node && context.setHeadWidths) {
        const { prefixCls, row, index } = props;
        const cellSelector = `.${prefixCls}-row-head`;
        const heads = node.querySelectorAll ? node.querySelectorAll(cellSelector) : [];
        context.setHeadWidths(
          _map(heads as any, (head: any, headIndex: number) => {
            let configWidth = _get(row, [headIndex, 'column', 'width']);
            const key = _get(row, [headIndex, 'column', 'key']);
            if (typeof configWidth !== 'number') {
              configWidth = (head && head.getBoundingClientRect().width) || 0;
            }
            return { width: configWidth, key };
          }),
          index as number
        );
      }
    };
    onMounted(cacheRef);
    watch(
      () => props.columns,
      () => {
        if (headerNode.value) cacheRef();
      }
    );
    onUpdated(() => {
      // widths may change after column re-render (e.g. resize)
      cacheRef();
    });

    return () => {
      const { components, row, prefixCls, onHeaderRow, index, style, columns } = props;
      const { getCellWidths, direction, headerStyle } = context;
      const isRTL = direction === 'rtl';
      const slicedColumns = sliceColumnsByLevel(columns, index as number);
      const headWidths = getCellWidths ? getCellWidths(slicedColumns) : [];
      const HeaderRow = _get(components, 'header.row', 'tr');
      const HeaderCell = _get(components, 'header.cell', 'th');
      const rowProps: Record<string, any> = onHeaderRow(columns, index as number) || {};
      const rowClass = classnames(_get(rowProps, 'className'), _get(rowProps, 'class'), `${prefixCls}-row`);
      const cells = _map(row, (cell: any, cellIndex: number) => {
        const { column, ...cellProps } = cell;
        const customProps: Record<string, any> = typeof column.onHeaderCell === 'function' ? { ...column.onHeaderCell(column, cellIndex, index) } : {};
        let cellStyle: Record<string, any> = { ...headerStyle, ...customProps.style };
        if (column.align) {
          const textAlign = getRTLAlign(column.align, direction);
          cellStyle = { ...cellStyle, textAlign };
          customProps.className = classnames(customProps.className, column.className, { [`${prefixCls}-align-${textAlign}`]: Boolean(textAlign) });
        }
        let fixedLeft: boolean;
        let fixedRight: boolean;
        let fixedLeftLast: boolean;
        let fixedRightFirst: boolean;
        if (isRTL) {
          fixedLeft = isFixedRight(column);
          fixedRight = isFixedLeft(column);
          fixedLeftLast = isFirstFixedRight(slicedColumns, column);
          fixedRightFirst = isLastLeftFixed(slicedColumns, column);
        } else {
          fixedLeft = isFixedLeft(column);
          fixedRight = isFixedRight(column);
          fixedLeftLast = isLastLeftFixed(slicedColumns, column);
          fixedRightFirst = isFirstFixedRight(slicedColumns, column);
        }
        customProps.className = classnames(`${prefixCls}-row-head`, column.className, customProps.className, customProps.class, {
          [`${prefixCls}-cell-fixed-left`]: fixedLeft,
          [`${prefixCls}-cell-fixed-left-last`]: fixedLeftLast,
          [`${prefixCls}-cell-fixed-right`]: fixedRight,
          [`${prefixCls}-cell-fixed-right-first`]: fixedRightFirst,
          [`${prefixCls}-row-head-ellipsis`]: column.ellipsis,
          [`${prefixCls}-row-head-clickSort`]: column.clickToSort,
        });
        delete customProps.class;
        if (headWidths.length && slicedColumns.length) {
          const indexOfSlicedColumns = _findIndex(slicedColumns, (item: any) => item && item.key != null && item.key === column.key);
          if (indexOfSlicedColumns > -1) {
            if (isFixedLeft(column)) {
              const xPositionKey = isRTL ? 'right' : 'left';
              cellStyle = { ...cellStyle, position: 'sticky', [xPositionKey]: toPx(arrayAdd(headWidths, 0, indexOfSlicedColumns)) };
            } else if (isFixedRight(column)) {
              const xPositionKey = isRTL ? 'left' : 'right';
              cellStyle = { ...cellStyle, position: 'sticky', [xPositionKey]: toPx(arrayAdd(headWidths, indexOfSlicedColumns + 1)) };
            }
          }
        }
        Object.assign(cellProps, { resize: column.resize });
        const merged: Record<string, any> = _omit({ ...cellProps, ...customProps }, ['colStart', 'colEnd', 'hasSubColumns', 'parents', 'level', 'style']);
        const { rowSpan, colSpan, className, children, title, key: _k, ...restProps } = merged;
        if (rowSpan === 0 || colSpan === 0) {
          return null;
        }
        if (typeof column.clickToSort === 'function') {
          if (restProps.onClick) {
            const onClick = restProps.onClick;
            restProps.onClick = (e: any) => {
              onClick(e);
              column.clickToSort(e);
            };
          } else {
            restProps.onClick = column.clickToSort;
          }
        }
        if (typeof column.mouseDown === 'function') {
          if (restProps.onMousedown || restProps.onMouseDown) {
            const onMouseDown = restProps.onMousedown || restProps.onMouseDown;
            delete restProps.onMouseDown;
            restProps.onMousedown = (e: any) => {
              onMouseDown(e);
              column.mouseDown(e);
            };
          } else {
            restProps.onMousedown = column.mouseDown;
          }
        }
        const isResizable = HeaderCell === ResizableHeaderCell || (HeaderCell && HeaderCell.name === 'TableResizableHeaderCell');
        const headerCellProps: Record<string, any> = {
          role: 'columnheader',
          'aria-colindex': cellIndex + 1,
          ...restProps,
          class: className,
          style: cellStyle,
          key: column.key || column.dataIndex || cellIndex,
        };
        if (rowSpan != null) headerCellProps.rowspan = rowSpan;
        if (colSpan != null) headerCellProps.colspan = colSpan;
        if (title != null) headerCellProps.title = title;
        if (!isResizable && typeof HeaderCell === 'string') {
          // plain DOM tag: strip resizable-only props
          delete headerCellProps.onResize;
          delete headerCellProps.onResizeStart;
          delete headerCellProps.onResizeStop;
          delete headerCellProps.width;
          delete headerCellProps.resize;
        }
        const content = normalizeNode(children);
        const headerCellNode = typeof HeaderCell === 'string' ? h(HeaderCell, headerCellProps, Array.isArray(content) ? content : [content]) : h(HeaderCell, headerCellProps, { default: () => (Array.isArray(content) ? content : [content]) });
        if (typeof column.clickToSort === 'function' && column.showSortTip === true) {
          const contentKey = getNextSortOrder(column.sortOrder);
          return h(Tooltip, { content: locale.value?.[contentKey], key: column.key || column.dataIndex || cellIndex }, { default: () => headerCellNode });
        }
        return headerCellNode;
      });
      const { className: _cn, class: _c, ...restRowProps } = rowProps;
      return h(HeaderRow, { role: 'row', 'aria-rowindex': (index as number) + 1, ...restRowProps, class: rowClass, style, ref: headerNode }, cells);
    };
  },
});

export default TableHeaderRow;
