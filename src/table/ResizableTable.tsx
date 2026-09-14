import { defineComponent, h, ref, watch, computed, markRaw, toRaw } from 'vue';
import _noop from 'lodash/noop';
import _find from 'lodash/find';
import _get from 'lodash/get';
import _merge from 'lodash/merge';
import { addClass, removeClass } from '@douyinfe/semi-foundation/lib/es/utils/classnames';
import { strings, numbers } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { assignColumnKeys, findColumn, withResizeWidth } from '@douyinfe/semi-foundation/lib/es/table/utils';
import NormalTable, { tableProps, tableEmits } from './Table';
import { cloneDeep, mergeColumns } from './utils';
import getColumns from './getColumns';
import ResizableHeaderCell from './ResizableHeaderCell';
import { flattenChildren } from '../_utils';

export const resizableTableProps = {
  ...tableProps,
  resizable: { type: [Boolean, Object] as any, default: undefined },
};

/**
 * Table with resizable header cells (React `ResizableTable`)
 */
const ResizableTable = defineComponent({
  name: 'ResizableTable',
  inheritAttrs: false,
  props: resizableTableProps,
  emits: tableEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const childrenColumnName = 'children';
    const tableRef = ref<any>(null);

    const getNewColumns = () => {
      const parsedColumns = Array.isArray(props.columns) && props.columns.length ? props.columns : getColumns(slots.default ? flattenChildren(slots.default()) : null);
      const rawColumns = assignColumnKeys(cloneDeep(parsedColumns), childrenColumnName as any);
      const newColumns = assignColumnKeys(cloneDeep(parsedColumns), childrenColumnName as any);
      if (typeof props.expandedRowRender === 'function' && !props.hideExpandedColumn && !_find(rawColumns, (item: any) => item.key === strings.DEFAULT_KEY_COLUMN_EXPAND)) {
        newColumns.unshift({ key: strings.DEFAULT_KEY_COLUMN_EXPAND, width: numbers.DEFAULT_WIDTH_COLUMN_EXPAND });
      }
      if (props.rowSelection && !_get(props.rowSelection, 'hidden') && !_find(rawColumns, (item: any) => item.key === strings.DEFAULT_KEY_COLUMN_SELECTION)) {
        newColumns.unshift({ width: _get(props, 'rowSelection.width', numbers.DEFAULT_WIDTH_COLUMN_SELECTION), key: strings.DEFAULT_KEY_COLUMN_SELECTION });
      }
      return newColumns;
    };

    const columns = ref<any[]>(getNewColumns());
    watch(
      () => [props.columns, props.expandedRowRender, props.hideExpandedColumn, props.rowSelection, slots.default ? slots.default() : null],
      () => {
        const newColumns = getNewColumns();
        const _newColumns = withResizeWidth(columns.value, newColumns);
        columns.value = mergeColumns(columns.value, _newColumns);
      }
    );

    const components = computed(() => _merge({ header: { cell: markRaw(ResizableHeaderCell) } }, props.components));

    const getResizable = () => (typeof props.resizable === 'object' ? props.resizable : {});
    const onResize = (...args: any[]) => (_get(getResizable(), 'onResize', _noop) as any)(...args);
    const onResizeStart = (...args: any[]) => (_get(getResizable(), 'onResizeStart', _noop) as any)(...args);
    const onResizeStop = (...args: any[]) => (_get(getResizable(), 'onResizeStop', _noop) as any)(...args);

    const handleResize = (column: any) => (_e: any, { size }: { size: { width: number } }) => {
      const nextColumns = cloneDeep(toRaw(columns.value));
      const curColumn =
        findColumn(nextColumns, column, childrenColumnName as any) ||
        nextColumns.find((item: any) => item && column && item.dataIndex != null && item.dataIndex === column.dataIndex);
      if (!curColumn) return;
      let nextColumn: any = { ...curColumn, width: size.width };
      const customProps = onResize(nextColumn) || {};
      nextColumn = { ...nextColumn, ...customProps };
      Object.assign(curColumn, nextColumn);
      columns.value = nextColumns;
    };
    const handleResizeStart = (column: any) => () => {
      if (typeof window !== 'undefined') {
        const selection = window.getSelection && window.getSelection();
        if (selection) selection.removeAllRanges();
      }
      const handlerClassName = _get(getResizable(), 'handlerClassName', 'resizing');
      const nextColumns = cloneDeep(columns.value);
      const curColumn = findColumn(nextColumns, column, childrenColumnName as any);
      if (!curColumn) return;
      let nextColumn: any = { ...curColumn, className: addClass(curColumn.className, handlerClassName) };
      const customProps = onResizeStart(nextColumn) || {};
      nextColumn = { ...nextColumn, ...customProps };
      Object.assign(curColumn, nextColumn);
      columns.value = nextColumns;
    };
    const handleResizeStop = (column: any) => () => {
      const handlerClassName = _get(getResizable(), 'handlerClassName', 'resizing');
      const nextColumns = cloneDeep(columns.value);
      const curColumn = findColumn(nextColumns, column, childrenColumnName as any);
      if (!curColumn) return;
      let nextColumn: any = { ...curColumn, className: removeClass(curColumn.className, handlerClassName) };
      const customProps = onResizeStop(nextColumn) || {};
      nextColumn = { ...nextColumn, ...customProps };
      Object.assign(curColumn, nextColumn);
      columns.value = nextColumns;
    };

    const resizableRender = (col: any, _index: number, _level = 0, originalHeaderCellProps?: any) => ({
      ...col,
      onHeaderCell: (column: any) => ({
        ...originalHeaderCellProps,
        width: column.width,
        onResize: handleResize(column),
        onResizeStart: handleResizeStart(column),
        onResizeStop: handleResizeStop(column),
      }),
    });
    const assignResizableRender = (cols: any[] = [], level = 0): any[] =>
      Array.isArray(cols) && cols.length
        ? cols.map((col, index) => {
            const originalHeaderCellProps = col.onHeaderCell?.(col, index, level) ?? {};
            Object.assign(col, resizableRender(col, index, level, originalHeaderCellProps));
            const children = col[childrenColumnName];
            if (Array.isArray(children) && children.length) {
              col[childrenColumnName] = assignResizableRender(children, level + 1);
            }
            return col;
          })
        : [];
    const finalColumns = computed(() => assignResizableRender(cloneDeep(columns.value)));

    expose({
      getCurrentPageData: () => tableRef.value && tableRef.value.getCurrentPageData(),
      tableRef,
    });

    return () => {
      const { components: _c, columns: _cols, resizable: _r, ...restProps } = props as any;
      return h(
        NormalTable,
        {
          ...attrs,
          ...restProps,
          columns: finalColumns.value,
          components: components.value,
          ref: tableRef,
          onChange: (...args: any[]) => emit('change', ...args),
          onExpand: (...args: any[]) => emit('expand', ...args),
          onExpandedRowsChange: (...args: any[]) => emit('expandedRowsChange', ...args),
          onFilterDropdownVisibleChange: (...args: any[]) => emit('filterDropdownVisibleChange', ...args),
        },
        { ...slots, default: undefined }
      );
    };
  },
});

export default ResizableTable;
