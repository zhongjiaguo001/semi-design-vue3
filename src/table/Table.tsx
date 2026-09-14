import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, toRaw, markRaw } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import _isPlainObject from 'lodash/isPlainObject';
import _isObject from 'lodash/isObject';
import _isFunction from 'lodash/isFunction';
import _difference from 'lodash/difference';
import _omit from 'lodash/omit';
import _each from 'lodash/each';
import _flattenDeep from 'lodash/flattenDeep';
import _debounce from 'lodash/debounce';
import _some from 'lodash/some';
import _findIndex from 'lodash/findIndex';
import _find from 'lodash/find';
import _includes from 'lodash/includes';
import _get from 'lodash/get';
import classnames from 'classnames';
import { mergeQueries, equalWith, assignColumnKeys, flattenColumns, getAllDisabledRowKeys, shouldShowEllipsisTitle } from '@douyinfe/semi-foundation/lib/es/table/utils';
import TableFoundation from '@douyinfe/semi-foundation/lib/es/table/foundation';
import { strings, cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/table/constants';
import '@douyinfe/semi-foundation/lib/es/table/table.css';
import Spin from '../spin/Spin';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, flattenChildren, toPx } from '../_utils';
import getColumns from './getColumns';
import { provideTableContext } from './context';
import type { TableContextValue, TableStore } from './context';
import ColumnSelection from './ColumnSelection';
import TablePagination from './TablePagination';
import ColumnFilter from './ColumnFilter';
import ColumnSorter from './ColumnSorter';
import ExpandedIcon from './CustomExpandIcon';
import HeadTable from './HeadTable';
import BodyTable from './Body';
import { logger, cloneDeep, mergeComponents, mergeColumns, columnsEqual } from './utils';
import type { TableComponents } from './utils';

export type TableSize = (typeof strings.SIZES)[number];
export type Fixed = (typeof strings.FIXED_SET)[number];
export type SortOrder = 'ascend' | 'descend' | false;

export interface RowSelectionProps<RecordType = any> {
  className?: string;
  disabled?: boolean;
  fixed?: Fixed;
  getCheckboxProps?: (record: RecordType) => Record<string, any>;
  hidden?: boolean;
  selectedRowKeys?: Array<string | number>;
  defaultSelectedRowKeys?: Array<string | number>;
  title?: any;
  width?: string | number;
  checkRelation?: 'related' | 'unRelated';
  clickRow?: boolean;
  renderCell?: (opts: Record<string, any>) => any;
  onChange?: (selectedRowKeys: Array<string | number>, selectedRows: RecordType[]) => void;
  onSelect?: (record: RecordType, selected: boolean, selectedRows: RecordType[], nativeEvent: Event) => void;
  onSelectAll?: (selected: boolean, selectedRows: RecordType[], changedRows: RecordType[], e?: Event) => void;
  [key: string]: any;
}

export interface TablePaginationProps {
  total?: number;
  currentPage?: number;
  pageSize?: number;
  position?: 'bottom' | 'top' | 'both';
  defaultCurrentPage?: number;
  formatPageText?: boolean | ((info: { currentStart: number; currentEnd: number; total: number }) => any);
  onChange?: (currentPage: number, pageSize: number) => void;
  [key: string]: any;
}

export const tableProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  components: { type: Object as PropType<TableComponents>, default: undefined },
  bordered: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  size: { type: String as PropType<TableSize>, default: 'default' },
  tableLayout: { type: String as PropType<'' | 'auto' | 'fixed'>, default: '' },
  columns: { type: Array as PropType<any[]>, default: undefined },
  hideExpandedColumn: { type: Boolean, default: true },
  id: { type: String, default: undefined },
  expandIcon: { type: [Boolean, Function, Object, String] as PropType<any>, default: undefined },
  expandCellFixed: { type: [Boolean, String] as PropType<Fixed>, default: false },
  title: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  onHeaderRow: { type: Function as PropType<(columns: any[], index: number) => Record<string, any>>, default: undefined },
  showHeader: { type: Boolean, default: true },
  indentSize: { type: Number, default: numbers.DEFAULT_INDENT_WIDTH },
  rowKey: { type: [Function, String, Number] as PropType<string | number | ((record: any) => string | number)>, default: 'key' },
  onRow: { type: Function as PropType<(record: any, index: number, extra?: { disabled: boolean; selected: boolean }) => Record<string, any>>, default: undefined },
  rowExpandable: { type: Function as PropType<(record: any) => boolean>, default: undefined },
  expandedRowRender: { type: Function as PropType<(record: any, index: number, expanded: boolean) => any>, default: undefined },
  expandedRowKeys: { type: Array as PropType<Array<string | number>>, default: undefined },
  defaultExpandAllRows: { type: Boolean, default: false },
  expandAllRows: { type: Boolean, default: false },
  defaultExpandAllGroupRows: { type: Boolean, default: false },
  expandAllGroupRows: { type: Boolean, default: false },
  defaultExpandedRowKeys: { type: Array as PropType<Array<string | number>>, default: () => [] },
  pagination: { type: [Object, Boolean] as PropType<TablePaginationProps | boolean>, default: true },
  renderPagination: { type: Function as PropType<(pagination: any) => any>, default: undefined },
  footer: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  empty: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  dataSource: { type: Array as PropType<any[]>, default: () => [] },
  childrenRecordName: { type: String, default: 'children' },
  rowSelection: { type: [Object, Boolean] as PropType<RowSelectionProps | boolean | null>, default: null },
  scroll: { type: Object as PropType<{ x?: number | string | boolean; y?: number | string; scrollToFirstRowOnChange?: boolean }>, default: undefined },
  groupBy: { type: [String, Number, Function] as PropType<string | number | ((record: any) => string | number)>, default: undefined },
  headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  renderGroupSection: { type: Function as PropType<(groupKey?: any, group?: any[]) => any>, default: undefined },
  onGroupedRow: { type: Function as PropType<(record: any, index: number) => Record<string, any>>, default: undefined },
  clickGroupedRowToExpand: { type: Boolean, default: false },
  virtualized: { type: [Object, Boolean] as PropType<any>, default: undefined },
  dropdownPrefixCls: { type: String, default: undefined },
  expandRowByClick: { type: Boolean, default: false },
  getVirtualizedListRef: { type: Function as PropType<(ref: any) => void>, default: undefined },
  rowSpanHover: { type: Boolean, default: undefined },
  keepDOM: { type: Boolean, default: false },
  sticky: { type: [Boolean, Object] as PropType<boolean | { top?: number }>, default: undefined },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
  rowClassName: { type: [String, Function] as PropType<string | ((record: any, index: number) => string)>, default: undefined },
  /** Vue-only: hook to render the pagination with a real Pagination component (see TablePagination) */
  paginationComponent: { type: [Object, Function] as PropType<any>, default: undefined },
};

export const tableEmits = ['change', 'expand', 'expandedRowsChange', 'filterDropdownVisibleChange'];

/**
 * Normal (non resizable) Table
 */
const NormalTable = defineComponent({
  name: 'NormalTable',
  inheritAttrs: false,
  props: tableProps,
  emits: tableEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const configContext = useConfigContext();
    const { locale } = useLocale('Table');

    const getColumnsFrom = (columns: any, children: any) => (!Array.isArray(columns) || !columns || !columns.length ? getColumns(children) : columns);
    let currentChildren: any[] | null = slots.default ? flattenChildren(slots.default()) : null;
    const getChildren = () => currentChildren;

    /* ------------------------------------------------------------------ */
    /* state                                                                */
    /* ------------------------------------------------------------------ */
    const initialChildren = currentChildren;
    const initialColumns = getColumnsFrom(props.columns, initialChildren);
    const cachedFlattenColumns = flattenColumns(initialColumns);
    const initialQueries = (TableFoundation as any).initColumnsFilteredValueAndSorterOrder(cloneDeep(cachedFlattenColumns));

    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      cachedColumns: initialColumns as any[],
      cachedChildren: initialChildren as any,
      flattenColumns: cachedFlattenColumns as any[],
      components: markRaw(mergeComponents(props.components, props.virtualized)),
      queries: initialQueries as any[],
      dataSource: [] as any[],
      flattenData: [] as any[],
      expandedRowKeys: [...(props.expandedRowKeys || []), ...(props.defaultExpandedRowKeys || [])] as any[],
      rowSelection: (props.rowSelection ? (_isObject(props.rowSelection) ? { ...(props.rowSelection as any) } : {}) : null) as any,
      pagination: (_isPlainObject(props.pagination) ? { ...(props.pagination as any) } : {}) as any,
      groups: null as Map<any, Set<any>> | null,
      allRowKeys: [] as any[],
      disabledRowKeys: [] as any[],
      disabledRowKeysSet: new Set<any>(),
      allDisabledRowKeys: [] as any[],
      allDisabledRowKeysSet: new Set<any>(),
      headWidths: [] as any[],
      bodyHasScrollBar: false,
      prePropRowSelection: undefined as any,
      prePagination: undefined as any,
      halfCheckedRowKeys: [] as any[],
      halfCheckedRowKeysSet: new Set<any>(),
      keyEntities: {} as Record<string, any>,
      tableWidth: undefined as number | undefined,
    });

    const rootWrapRef = ref<HTMLElement | null>(null);
    const wrapRef = ref<HTMLElement | null>(null);
    const bodyWrapRef = ref<HTMLElement | null>(null);
    const headerWrapRef = ref<HTMLElement | null>(null);
    const bodyCompRef = ref<any>(null);
    const headCompRef = ref<any>(null);
    const store = reactive<TableStore>({ hoveredRowKey: null, hoveredRowKeys: [] });
    let cachedFilteredSortedDataSource: any[] = [];
    let cachedFilteredSortedRowKeys: any[] = [];
    let cachedFilteredSortedRowKeysSet = new Set<any>();
    let resizeObserver: ResizeObserver | null = null;
    let hasBindWindowResize = false;
    let lastScrollLeft = 0;
    let lastScrollTop = 0;
    let scrollPosition: string | undefined;
    const position = ref<string | undefined>(undefined);

    const getDirection = () => props.direction ?? configContext.direction ?? 'ltr';

    /* ------------------------------------------------------------------ */
    /* adapter                                                              */
    /* ------------------------------------------------------------------ */
    const getBodyDOM = (): HTMLElement | null => bodyWrapRef.value || (bodyCompRef.value && bodyCompRef.value.getElement && bodyCompRef.value.getElement()) || null;
    const getHeadDOM = (): HTMLElement | null => headerWrapRef.value || (headCompRef.value && headCompRef.value.getElement && headCompRef.value.getElement()) || null;

    const adapter: Record<string, any> = {
      ...baseAdapter,
      getProps: () => propsWithChildren,
      getProp: (key: string) => (propsWithChildren as any)[key],
      resetScrollY: () => {
        const scroll = props.scroll || {};
        const hasScrollY = Boolean(_get(scroll, 'y'));
        if (hasScrollY) {
          const body = getBodyDOM();
          if (body) body.scrollTop = 0;
        } else if (wrapRef.value) {
          wrapRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      setSelectedRowKeys: (selectedRowKeys: any[]) => {
        state.rowSelection = { ...state.rowSelection, selectedRowKeys: [...selectedRowKeys], selectedRowKeysSet: new Set(selectedRowKeys) };
      },
      setDisabledRowKeys: (disabledRowKeys: any[]) => {
        state.disabledRowKeys = disabledRowKeys;
        state.disabledRowKeysSet = new Set(disabledRowKeys);
      },
      setCurrentPage: (currentPage: number) => {
        const { pagination } = state;
        if (typeof pagination === 'object') {
          state.pagination = { ...pagination, currentPage };
        } else {
          state.pagination = { currentPage };
        }
      },
      setPagination: (pagination: any) => {
        state.pagination = pagination;
      },
      setGroups: (groups: any) => {
        state.groups = groups ? markRaw(groups) : null;
      },
      setDataSource: (dataSource: any[]) => {
        state.dataSource = dataSource;
      },
      setExpandedRowKeys: (expandedRowKeys: any[]) => {
        state.expandedRowKeys = [...expandedRowKeys];
      },
      setQuery: (query: any = {}) => {
        let queries = [...state.queries];
        queries = mergeQueries(query, queries);
        state.queries = queries;
      },
      setQueries: (queries: any[]) => {
        state.queries = queries;
      },
      setFlattenData: (flattenData: any[]) => {
        state.flattenData = flattenData;
      },
      setAllRowKeys: (allRowKeys: any[]) => {
        state.allRowKeys = allRowKeys;
      },
      setHoveredRowKey: (hoveredRowKey: any) => {
        store.hoveredRowKey = hoveredRowKey;
      },
      setHoveredRowKeys: (hoveredRowKeys: any[]) => {
        store.hoveredRowKeys = hoveredRowKeys;
      },
      setCachedFilteredSortedDataSource: (filteredSortedDataSource: any[]) => {
        cachedFilteredSortedDataSource = filteredSortedDataSource;
      },
      setCachedFilteredSortedRowKeys: (filteredSortedRowKeys: any[]) => {
        cachedFilteredSortedRowKeys = filteredSortedRowKeys;
        cachedFilteredSortedRowKeysSet = new Set(filteredSortedRowKeys);
      },
      setAllDisabledRowKeys: (allDisabledRowKeys: any[]) => {
        state.allDisabledRowKeys = allDisabledRowKeys;
        state.allDisabledRowKeysSet = new Set(allDisabledRowKeys);
      },
      getCurrentPage: () => _get(state, 'pagination.currentPage', 1),
      getCurrentPageSize: () => _get(state, 'pagination.pageSize', numbers.DEFAULT_PAGE_SIZE),
      getCachedFilteredSortedDataSource: () => cachedFilteredSortedDataSource,
      getCachedFilteredSortedRowKeys: () => cachedFilteredSortedRowKeys,
      getCachedFilteredSortedRowKeysSet: () => cachedFilteredSortedRowKeysSet,
      getAllDisabledRowKeys: () => state.allDisabledRowKeys,
      getAllDisabledRowKeysSet: () => state.allDisabledRowKeysSet,
      getHalfCheckedRowKeys: () => state.halfCheckedRowKeys || [],
      getHalfCheckedRowKeysSet: () => state.halfCheckedRowKeysSet || new Set(),
      setHalfCheckedRowKeys: (halfCheckedRowKeys: any[]) => {
        state.halfCheckedRowKeys = halfCheckedRowKeys;
        state.halfCheckedRowKeysSet = new Set(halfCheckedRowKeys);
      },
      getKeyEntities: () => state.keyEntities || {},
      setKeyEntities: (keyEntities: any) => {
        state.keyEntities = keyEntities;
      },
      getCheckRelation: () => {
        const { rowSelection } = state;
        if (rowSelection && typeof rowSelection === 'object') {
          return _get(rowSelection, 'checkRelation', 'unRelated');
        }
        return 'unRelated';
      },
      notifyFilterDropdownVisibleChange: (visible: boolean, dataIndex: string) => {
        invokeColumnFn(dataIndex, 'onFilterDropdownVisibleChange', visible);
        emit('filterDropdownVisibleChange', visible, dataIndex);
      },
      notifyChange: (...args: any[]) => emit('change', ...args),
      notifyExpand: (...args: any[]) => emit('expand', ...args),
      notifyExpandedRowsChange: (...args: any[]) => emit('expandedRowsChange', ...args),
      notifySelect: (...args: any[]) => invokeRowSelection('onSelect', ...args),
      notifySelectAll: (...args: any[]) => invokeRowSelection('onSelectAll', ...args),
      notifySelectInvert: (...args: any[]) => invokeRowSelection('onSelectInvert', ...args),
      notifySelectionChange: (...args: any[]) => invokeRowSelection('onChange', ...args),
      isAnyColumnFixed: (columns?: any[]) => _some(getColumnsFrom(columns || props.columns, getChildren()), (column: any) => Boolean(column.fixed)),
      useFixedHeader: () => {
        const { scroll, sticky } = props;
        if (_get(scroll, 'y')) return true;
        if (sticky) return true;
        return false;
      },
      getTableLayout: () => {
        let isFixed = false;
        const { flattenColumns: fc } = state;
        if (Array.isArray(fc)) {
          isFixed = fc.some((column: any) => Boolean(column.ellipsis) || Boolean(column.fixed));
        }
        if (adapter.useFixedHeader()) {
          isFixed = true;
        }
        return isFixed ? 'fixed' : 'auto';
      },
      setHeadWidths: (headWidths: any[], index = 0) => {
        if (!equalWith(state.headWidths[index], headWidths)) {
          const newHeadWidths = [...state.headWidths];
          newHeadWidths[index] = [...headWidths];
          state.headWidths = newHeadWidths;
        }
      },
      getHeadWidths: (index = 0) => {
        if (state.headWidths.length && typeof index === 'number') {
          const configs = state.headWidths[index] || [];
          return configs.map((item: any) => item.width);
        }
        return [];
      },
      getCellWidths: (flattenedColumns: any[], flattenedWidths: any[] | null = null, ignoreScrollBarKey = false) => {
        if (Array.isArray(flattenedColumns) && flattenedColumns.length) {
          flattenedWidths = flattenedWidths == null && state.headWidths.length ? _flattenDeep(state.headWidths) : [];
          if (Array.isArray(flattenedWidths) && flattenedWidths.length) {
            return flattenedColumns.reduce((result: number[], column: any) => {
              const found = column.key === strings.DEFAULT_KEY_COLUMN_SCROLLBAR && ignoreScrollBarKey ? null : _find(flattenedWidths as any[], (item: any) => item && item.key != null && item.key === column.key);
              if (found) {
                result.push(found.width);
              }
              return result;
            }, []);
          }
        }
        return [];
      },
      mergedRowExpandable: (record: any) => {
        const { expandedRowRender, childrenRecordName, rowExpandable } = props;
        const children = _get(record, childrenRecordName);
        const hasExpandedRowRender = typeof expandedRowRender === 'function';
        const hasRowExpandable = typeof rowExpandable === 'function';
        const hasChildren = Array.isArray(children) && children.length;
        const strictExpandableResult = hasRowExpandable && rowExpandable!(record);
        const looseExpandableResult = !hasRowExpandable || strictExpandableResult;
        return ((hasExpandedRowRender || hasChildren) && looseExpandableResult) || (!(hasExpandedRowRender || hasChildren) && strictExpandableResult);
      },
      isAnyColumnUseFullRender: (columns: any[]) => _some(columns, (column: any) => Boolean(column.useFullRender)),
      getNormalizeColumns: () => normalizeColumns,
      getHandleColumns: () => handleColumns,
      getMergePagination: () => mergePagination,
      setBodyHasScrollbar: (bodyHasScrollBar: boolean) => {
        if (bodyHasScrollBar !== state.bodyHasScrollBar) {
          state.bodyHasScrollBar = bodyHasScrollBar;
        }
      },
      stopPropagation(e: any) {
        if (e && typeof e === 'object') {
          if (typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
          if (e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
            e.nativeEvent.stopPropagation();
          } else if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
          }
        }
      },
    };

    /** props view with a React-like `children` and default callbacks */
    const propsWithChildren: any = new Proxy(propsView, {
      get(t, k) {
        if (k === 'children') return getChildren();
        if (k === 'onChange' || k === 'onExpand' || k === 'onExpandedRowsChange') return () => undefined;
        return Reflect.get(t, k);
      },
      has(t, k) {
        if (k === 'children') return Boolean(slots.default);
        return Reflect.has(t, k);
      },
    });

    const invokeRowSelection = (funcName: string, ...args: any[]) => {
      const func = _get(state, ['rowSelection', funcName]);
      if (typeof func === 'function') {
        func(...args);
      }
    };
    const invokeColumnFn = (key: string, funcName: string, ...args: any[]) => {
      if (key && funcName) {
        const column = foundation.getQuery(key);
        const func = _get(column, funcName, null);
        if (typeof func === 'function') {
          func(...args);
        }
      }
    };

    /* ------------------------------------------------------------------ */
    /* column helpers                                                       */
    /* ------------------------------------------------------------------ */
    const normalizeColumns = (columns: any[], children: any) => cloneDeep(getColumnsFrom(columns, children));

    const mergePagination = (pagination: any) => {
      const userOnChange = pagination?.onChange;
      const { scroll } = props;
      const scrollToFirstRowOnChange = _get(scroll, 'scrollToFirstRowOnChange');
      if (scrollToFirstRowOnChange) {
        return {
          ...pagination,
          onChange: (currentPage: number, pageSize: number) => {
            foundation.setPage(currentPage, pageSize);
            if (typeof userOnChange === 'function') {
              userOnChange(currentPage, pageSize);
            }
          },
        };
      }
      return { onChange: foundation.setPage, ...pagination };
    };

    const renderSelection = (record: any = {}, inHeader = false, index?: number) => {
      const { rowSelection, allDisabledRowKeysSet, halfCheckedRowKeysSet } = state;
      if (rowSelection && typeof rowSelection === 'object') {
        const { selectedRowKeys = [], selectedRowKeysSet = new Set(), getCheckboxProps, disabled, renderCell, checkRelation = 'unRelated' } = rowSelection;
        const allRowKeys = cachedFilteredSortedRowKeys;
        const allRowKeysSet = cachedFilteredSortedRowKeysSet;
        const allIsSelected = foundation.allIsSelected(selectedRowKeysSet, allDisabledRowKeysSet, allRowKeys);
        const hasRowSelected = foundation.hasRowSelected(selectedRowKeys, allRowKeysSet);
        const indeterminate = hasRowSelected && !allIsSelected;
        if (inHeader) {
          const columnKey = _get(rowSelection, 'key', strings.DEFAULT_KEY_COLUMN_SELECTION);
          const originNode = h(ColumnSelection, {
            'aria-label': `${allIsSelected ? 'Deselect' : 'Select'} all rows`,
            disabled,
            key: columnKey,
            selected: allIsSelected,
            indeterminate,
            onChange: (selected: boolean, e: any) => toggleSelectAllRow(selected, e),
          });
          const selectAll = (selected: boolean, e: any) => toggleSelectAllRow(selected, e);
          return _isFunction(renderCell) ? renderCell({ selected: allIsSelected, record, originNode, inHeader, disabled, indeterminate, selectAll }) : originNode;
        }
        const key = foundation.getRecordKey(record);
        const selected = selectedRowKeysSet.has(key);
        const halfChecked = checkRelation === 'related' && halfCheckedRowKeysSet && halfCheckedRowKeysSet.has(key);
        const checkboxPropsFn = () => (typeof getCheckboxProps === 'function' ? getCheckboxProps(record) : {});
        const originNode = h(ColumnSelection, {
          'aria-label': `${selected ? 'Deselect' : 'Select'} this row`,
          getCheckboxProps: checkboxPropsFn,
          selected,
          indeterminate: halfChecked,
          onChange: (status: boolean, e: any) => toggleSelectRow(status, key, e),
        });
        const selectRow = (sel: boolean, e: any) => toggleSelectRow(sel, key, e);
        return _isFunction(renderCell) ? renderCell({ selected, record, index, originNode, inHeader: false, disabled, indeterminate: halfChecked, selectRow }) : originNode;
      }
      return null;
    };

    const renderRowSelectionCallback = (_text: any, record: any = {}, index?: number) => renderSelection(record, false, index);
    const renderTitleSelectionCallback = () => renderSelection(undefined, true);

    const normalizeSelectionColumn = (opts: { rowSelection?: any; prefixCls?: string } = {}) => {
      const { rowSelection, prefixCls } = opts;
      let column: Record<string, any> = {};
      if (rowSelection) {
        const needOmitSelectionKey = ['selectedRowKeys', 'selectedRowKeysSet'];
        column = { key: strings.DEFAULT_KEY_COLUMN_SELECTION };
        if (_isObject(rowSelection)) {
          column = { ...column, ..._omit(rowSelection as any, needOmitSelectionKey) };
        }
        column.className = classnames(column.className, `${prefixCls}-column-selection`);
        column.title = renderTitleSelectionCallback;
        column.render = renderRowSelectionCallback;
      }
      return column;
    };

    const renderExpandIcon = (record: any = {}, isNested = false, groupKey: any = null) => {
      const { expandedRowKeys } = state;
      const { expandIcon } = props;
      const key = typeof groupKey === 'string' || typeof groupKey === 'number' ? groupKey : foundation.getRecordKey(record);
      return h(ExpandedIcon, {
        key,
        componentType: isNested ? 'tree' : 'expand',
        expanded: _includes(expandedRowKeys, key),
        expandIcon: slots.expandIcon ? slots.expandIcon : expandIcon,
        onClick: (expanded: boolean, e: any) => handleRowExpanded(expanded, key, e),
      });
    };

    const handleRowExpanded = (...args: any[]) => foundation.handleRowExpanded(...args);

    const normalizeExpandColumn = (opts: { prefixCls?: string; expandCellFixed?: any; expandIcon?: any } = {}) => {
      const { prefixCls, expandCellFixed, expandIcon } = opts;
      const column: Record<string, any> = { fixed: expandCellFixed, key: strings.DEFAULT_KEY_COLUMN_EXPAND };
      column.className = classnames(column.className, `${prefixCls}-column-expand`);
      column.render = expandIcon !== false ? (_text = '', record: any) => (adapter.mergedRowExpandable(record) ? renderExpandIcon(record) : null) : () => null;
      return column;
    };

    const isRenderFn = (v: any) => typeof v === 'function' && !v.setup && !v.render && !v.__vccOpts;

    /**
     * Add sorting, filtering, and rendering functions to columns, and add column event handling
     * Title support function, passing parameters as {filter: node, sorter: node, selection: node}
     */
    const addFnsInColumn = (column: any = {}) => {
      const { prefixCls } = props;
      if (column && (column.sorter || column.filters || column.onFilter || column.useFullRender || column.renderFilterDropdown || column.filterDropdown)) {
        const hasSorter = typeof column.sorter === 'function' || column.sorter === true;
        const hasFilter = (Array.isArray(column.filters) && column.filters.length) || Boolean(column.filterDropdown) || typeof column.renderFilterDropdown === 'function';
        let hasSorterOrFilter = false;
        const sortOrderNotControlled = !('sortOrder' in column);
        const showSortTip = sortOrderNotControlled && column.showSortTip === true;
        const { dataIndex, title: rawTitle, useFullRender } = column;
        const clickColumnToSorter = hasSorter && !hasFilter && !Boolean(useFullRender);
        const curQuery = foundation.getQuery(dataIndex);
        const titleMap: Record<string, any> = {};
        const titleArr: any[] = [];
        if (useFullRender) {
          titleMap.selection = renderSelection(null, true);
        }
        const stateSortOrder = _get(curQuery, 'sortOrder');
        const defaultSortOrder = _get(curQuery, 'defaultSortOrder', false);
        const sortOrder = foundation.isSortOrderValid(stateSortOrder) ? stateSortOrder : defaultSortOrder;
        const showEllipsisTitle = shouldShowEllipsisTitle(column.ellipsis);
        const titleIsFn = isRenderFn(rawTitle) && !column.__titleIsSlot;
        const TitleNode = !titleIsFn
          ? h('span', { class: `${prefixCls}-row-head-title`, key: strings.DEFAULT_KEY_COLUMN_TITLE, title: showEllipsisTitle && typeof rawTitle === 'string' ? rawTitle : undefined }, [normalizeNode(column.__titleIsSlot ? rawTitle() : rawTitle)])
          : null;
        if (hasSorter) {
          const sorter = h(ColumnSorter, {
            key: strings.DEFAULT_KEY_COLUMN_SORTER,
            sortOrder,
            sortIcon: column.sortIcon,
            onClick: useFullRender || hasFilter ? (e: any) => foundation.handleSort(column, e) : undefined,
            title: TitleNode,
            showTooltip: !clickColumnToSorter && showSortTip,
          });
          useFullRender && (titleMap.sorter = sorter);
          hasSorterOrFilter = true;
          titleArr.push(sorter);
        } else {
          titleArr.push(TitleNode);
        }
        const stateFilteredValue = _get(curQuery, 'filteredValue');
        const defaultFilteredValue = _get(curQuery, 'defaultFilteredValue');
        const filteredValue = stateFilteredValue ? stateFilteredValue : defaultFilteredValue;
        if (hasFilter) {
          const filterColumnProps = _omit(curQuery || column, ['children', 'title', 'render']);
          const filter = h(ColumnFilter, {
            key: strings.DEFAULT_KEY_COLUMN_FILTER,
            column: filterColumnProps,
            filters: filterColumnProps.filters,
            filterMultiple: filterColumnProps.filterMultiple !== false,
            filterIcon: filterColumnProps.filterIcon ?? 'filter',
            filterDropdown: filterColumnProps.filterDropdown ?? null,
            filterDropdownProps: filterColumnProps.filterDropdownProps,
            filterDropdownVisible: filterColumnProps.filterDropdownVisible,
            renderFilterDropdown: filterColumnProps.renderFilterDropdown,
            renderFilterDropdownItem: filterColumnProps.renderFilterDropdownItem,
            filterConfirmMode: filterColumnProps.filterConfirmMode ?? 'immediate',
            prefixCls,
            filteredValue,
            onFilterDropdownVisibleChange: (visible: boolean) => foundation.toggleShowFilter(dataIndex, visible),
            onSelect: (data: any) => foundation.handleFilterSelect(dataIndex, data),
          });
          useFullRender && (titleMap.filter = filter);
          hasSorterOrFilter = true;
          titleArr.push(filter);
        }
        const newTitle = titleIsFn ? () => rawTitle(titleMap) : hasSorterOrFilter ? h('div', { class: `${prefixCls}-operate-wrapper` }, titleArr) : titleArr;
        column = { ...column, title: newTitle, __titleIsSlot: false };
        if (clickColumnToSorter) {
          column.clickToSort = (e: any) => {
            foundation.handleSort(column, e, true);
          };
          column.mouseDown = foundation.handleMouseDown;
          column.sortOrder = sortOrder;
          column.showSortTip = showSortTip;
        }
      }
      return column;
    };

    const handleColumns = (queries: any[], cachedColumns: any[]) => {
      const { hideExpandedColumn, prefixCls, expandCellFixed, expandIcon, rowSelection } = props;
      const childrenColumnName = 'children';
      let columns = cloneDeep(cachedColumns);
      const addFns = (cols: any[] = []) => {
        if (Array.isArray(cols) && cols.length) {
          _each(cols, (column, index, originColumns) => {
            const newColumn = addFnsInColumn(column);
            const children = column[childrenColumnName];
            if (Array.isArray(children) && children.length) {
              const newChildren = [...children];
              addFns(newChildren);
              newColumn[childrenColumnName] = newChildren;
            }
            originColumns[index] = newColumn;
          });
        }
      };
      addFns(columns);
      if (!hideExpandedColumn) {
        const column = normalizeExpandColumn({ prefixCls, expandCellFixed, expandIcon });
        const destIndex = _findIndex(columns, (item: any) => item.key === strings.DEFAULT_KEY_COLUMN_EXPAND);
        if (column) {
          if (destIndex > -1) {
            columns[destIndex] = { ...column, ...columns[destIndex] };
          } else if (column.fixed === 'right') {
            columns = [...columns, column];
          } else {
            columns = [column, ...columns];
          }
        }
      }
      if (rowSelection && !_get(rowSelection, 'hidden')) {
        const destIndex = _findIndex(columns, (item: any) => item.key === strings.DEFAULT_KEY_COLUMN_SELECTION);
        const column = normalizeSelectionColumn({ rowSelection, prefixCls });
        if (destIndex > -1) {
          columns[destIndex] = { ...column, ...columns[destIndex] };
        } else if (column.fixed === 'right') {
          columns = [...columns, column];
        } else {
          columns = [column, ...columns];
        }
      }
      assignColumnKeys(columns);
      return columns;
    };

    const foundation = new (TableFoundation as any)(adapter);

    // initial page data (React constructor)
    {
      const filteredSortedDataSource = foundation.getFilteredSortedDataSource([...props.dataSource], initialQueries);
      const newPagination = _isPlainObject(props.pagination) ? props.pagination : {};
      const pageData = foundation.getCurrentPageData(filteredSortedDataSource, newPagination, initialQueries);
      state.dataSource = pageData.dataSource;
      state.pagination = pageData.pagination;
      state.groups = pageData.groups ? markRaw(pageData.groups) : null;
      if (Array.isArray(pageData.allRowKeys)) state.allRowKeys = pageData.allRowKeys;
      if (Array.isArray(pageData.disabledRowKeys)) {
        state.disabledRowKeys = pageData.disabledRowKeys;
        state.disabledRowKeysSet = new Set(pageData.disabledRowKeys);
      }
    }

    /* ------------------------------------------------------------------ */
    /* selection / expand handlers                                          */
    /* ------------------------------------------------------------------ */
    const toggleSelectRow = (selected: boolean, realKey: any, e: any) => {
      foundation.handleSelectRow(realKey, selected, e);
    };
    const toggleSelectAllRow = (selected: boolean, e: any) => {
      foundation.handleSelectAllRow(selected, e);
    };
    const handleRowClickSelection = (rowKey: any, selected: boolean, e: any) => {
      const { rowSelection } = state;
      const clickRowEnabled = _get(rowSelection, 'clickRow', false);
      if (clickRowEnabled && rowSelection) {
        const disabled = _get(rowSelection, 'disabled', false);
        const getCheckboxProps = _get(rowSelection, 'getCheckboxProps');
        if (disabled) return;
        const record = cachedFilteredSortedDataSource.find((r) => foundation.getRecordKey(r) === rowKey);
        if (record && typeof getCheckboxProps === 'function') {
          const checkboxProps = getCheckboxProps(record);
          if (checkboxProps && checkboxProps.disabled) return;
        }
        foundation.handleSelectRow(rowKey, selected, e);
      }
    };

    const warnIfNoKey = () => {
      if ((props.rowSelection || props.expandedRowRender) && _some(props.dataSource, (record) => foundation.getRecordKey(record) == null)) {
        logger.error('You must specify a key for each element in the dataSource or use "rowKey" to specify an attribute name as the primary key!');
      }
    };

    /* ------------------------------------------------------------------ */
    /* scroll / resize                                                      */
    /* ------------------------------------------------------------------ */
    const handleWheel = (event: WheelEvent) => {
      const scroll = props.scroll || {};
      if (window.navigator.userAgent.match(/Trident\/7\./) && scroll.y) {
        event.preventDefault();
        const wd = event.deltaY;
        const { target } = event;
        const bodyTable = getBodyDOM();
        let scrollTop = 0;
        if (lastScrollTop) {
          scrollTop = lastScrollTop + wd;
        } else {
          scrollTop = wd;
        }
        if (bodyTable && target !== bodyTable) {
          bodyTable.scrollTop = scrollTop;
        }
      }
    };
    const setScrollPosition = (pos: string) => {
      const { prefixCls } = props;
      const positionAll = [`${prefixCls}-scroll-position-both`, `${prefixCls}-scroll-position-middle`, `${prefixCls}-scroll-position-left`, `${prefixCls}-scroll-position-right`];
      position.value = pos;
      scrollPosition = pos;
      const tableNode = wrapRef.value;
      if (tableNode && tableNode.nodeType) {
        if (pos === 'both') {
          const acceptPosition = [`${prefixCls}-scroll-position-left`, `${prefixCls}-scroll-position-right`];
          tableNode.classList.remove(..._difference(positionAll, acceptPosition));
          tableNode.classList.add(...acceptPosition);
        } else {
          const acceptPosition = [`${prefixCls}-scroll-position-${pos}`];
          tableNode.classList.remove(..._difference(positionAll, acceptPosition));
          tableNode.classList.add(...acceptPosition);
        }
      }
    };
    const setScrollPositionClassName = () => {
      const node = getBodyDOM();
      if (node && node.children && node.children.length) {
        const scrollToLeft = node.scrollLeft === 0;
        const scrollToRight = Math.abs(node.scrollLeft) + 1 >= node.children[0].getBoundingClientRect().width - node.getBoundingClientRect().width;
        if (scrollToLeft && scrollToRight) {
          setScrollPosition('both');
        } else if (scrollToLeft) {
          setScrollPosition('left');
        } else if (scrollToRight) {
          setScrollPosition('right');
        } else if (scrollPosition !== 'middle') {
          setScrollPosition('middle');
        }
      }
    };
    const handleBodyScrollLeft = (e: any) => {
      if (e.currentTarget !== e.target) return;
      const { target } = e;
      const headTable = getHeadDOM();
      const bodyTable = getBodyDOM();
      if (target.scrollLeft !== lastScrollLeft) {
        if (target === bodyTable && headTable) {
          headTable.scrollLeft = target.scrollLeft;
        } else if (target === headTable && bodyTable) {
          bodyTable.scrollLeft = target.scrollLeft;
        }
        setScrollPositionClassName();
      }
      lastScrollLeft = target.scrollLeft;
    };
    const handleBodyScrollTop = (e: any) => {
      const { target } = e;
      if (e.currentTarget !== target) return;
      const scroll = props.scroll || {};
      const headTable = getHeadDOM();
      const bodyTable = getBodyDOM();
      if (target.scrollTop !== lastScrollTop && scroll.y && target !== headTable) {
        const { scrollTop } = target;
        if (bodyTable && target !== bodyTable) {
          bodyTable.scrollTop = scrollTop;
        }
      }
      lastScrollTop = target.scrollTop;
    };
    const handleBodyScroll = (e: any) => {
      handleBodyScrollLeft(e);
      handleBodyScrollTop(e);
    };
    const syncTableWidth = () => {
      const wrapper = rootWrapRef.value;
      if (!wrapper) return;
      const nextWidth = wrapper.getBoundingClientRect().width;
      const prevWidth = state.tableWidth;
      if (typeof prevWidth === 'number' && Math.abs(prevWidth - nextWidth) < 0.5) return;
      state.tableWidth = nextWidth;
    };
    const handleWindowResize = () => {
      syncTableWidth();
      setScrollPositionClassName();
    };
    const debouncedWindowResize = _debounce(handleWindowResize, 150);
    const observeTableWrapperResize = () => {
      const tableWrapperDOM = rootWrapRef.value;
      if (!tableWrapperDOM) return;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      const RO = _get(window, 'ResizeObserver');
      if (!RO) return;
      resizeObserver = new RO(() => {
        const cb = () => {
          syncTableWidth();
          setScrollPositionClassName();
        };
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(cb);
        } else {
          window.setTimeout(cb, 0);
        }
      });
      resizeObserver!.observe(tableWrapperDOM);
    };
    const needSyncTableWidth = () => adapter.isAnyColumnFixed() || (props.showHeader && adapter.useFixedHeader());
    const bindWindowResize = () => {
      if (hasBindWindowResize) return;
      window.addEventListener('resize', debouncedWindowResize);
      hasBindWindowResize = true;
    };
    const unbindWindowResize = () => {
      if (!hasBindWindowResize) return;
      window.removeEventListener('resize', debouncedWindowResize);
      hasBindWindowResize = false;
    };
    const syncResizeListeners = () => {
      const needSync = needSyncTableWidth();
      if (needSync) {
        const wasBound = hasBindWindowResize;
        bindWindowResize();
        if (!resizeObserver) {
          observeTableWrapperResize();
        }
        if (!wasBound) {
          handleWindowResize();
        }
      } else {
        unbindWindowResize();
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
      }
    };

    /* ------------------------------------------------------------------ */
    /* lifecycle                                                            */
    /* ------------------------------------------------------------------ */
    onMounted(() => {
      foundation.init();
      setScrollPosition('left');
      const { dataSource } = props;
      const checkRelation = _get(state.rowSelection, 'checkRelation', 'unRelated');
      if (checkRelation === 'related' && dataSource && dataSource.length) {
        adapter.setKeyEntities(foundation.buildKeyEntities(dataSource));
      }
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => setScrollPositionClassName());
      } else {
        setTimeout(() => setScrollPositionClassName(), 0);
      }
      syncResizeListeners();
      warnIfNoKey();
    });
    onBeforeUnmount(() => {
      foundation.destroy();
      unbindWindowResize();
      debouncedWindowResize.cancel();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });

    /* getDerivedStateFromProps */
    const deriveFromColumns = (children: any[] | null) => {
      const columns = props.columns;
      columns && columns.length && children && children.length && logger.warn('columns should not given by object and children at the same time');
      if (columns && columns.length && toRaw(columns) !== toRaw(state.cachedColumns)) {
        const newFlattenColumns = flattenColumns(columns);
        state.flattenColumns = newFlattenColumns;
        state.queries = mergeColumns(state.queries, newFlattenColumns, null, false);
        state.cachedColumns = columns;
        state.cachedChildren = null;
      } else if (children && children.length && (!columns || !columns.length)) {
        const newNestedColumns = getColumns(children);
        if (columnsEqual(newNestedColumns, state.cachedColumns)) return;
        const newFlattenColumns = flattenColumns(newNestedColumns);
        const merged = mergeColumns(state.queries, newFlattenColumns, null, false);
        state.flattenColumns = newFlattenColumns;
        state.queries = [...merged];
        state.cachedColumns = [...newNestedColumns];
        state.cachedChildren = children;
      }
    };
    const deriveRowSelection = () => {
      const { rowSelection, dataSource, childrenRecordName, rowKey } = props;
      let newSelectionStates: Record<string, any> = {};
      if (_isObject(state.rowSelection)) {
        newSelectionStates = { ...newSelectionStates, ...state.rowSelection };
      }
      if (_isObject(rowSelection)) {
        newSelectionStates = { ...newSelectionStates, ...(rowSelection as any) };
      }
      const selectedRowKeys = _get(rowSelection, 'selectedRowKeys');
      const getCheckboxProps = _get(rowSelection, 'getCheckboxProps');
      if (selectedRowKeys && Array.isArray(selectedRowKeys)) {
        newSelectionStates.selectedRowKeysSet = new Set(selectedRowKeys);
      }
      if (_isFunction(getCheckboxProps)) {
        const disabledRowKeys = getAllDisabledRowKeys({ dataSource, getCheckboxProps, childrenRecordName, rowKey } as any);
        const disabledRowKeysSet = new Set(disabledRowKeys);
        state.disabledRowKeys = disabledRowKeys;
        state.disabledRowKeysSet = disabledRowKeysSet;
        state.allDisabledRowKeys = disabledRowKeys;
        state.allDisabledRowKeysSet = disabledRowKeysSet;
      }
      state.rowSelection = rowSelection ? newSelectionStates : null;
      state.prePropRowSelection = rowSelection;
    };
    const derivePagination = () => {
      const { pagination } = props;
      let newPagination: Record<string, any> = {};
      if (_isObject(state.pagination)) {
        newPagination = { ...newPagination, ...state.pagination };
      }
      if (_isObject(pagination)) {
        newPagination = { ...newPagination, ...(pagination as any) };
      }
      state.pagination = newPagination;
      state.prePagination = pagination;
    };
    // run the initial derive (React runs getDerivedStateFromProps before first render)
    deriveRowSelection();
    derivePagination();

    watch(
      () => props.rowSelection,
      () => {
        deriveRowSelection();
        recalc({ getCheckboxPropsChanged: true });
      },
      { deep: true }
    );
    watch(
      () => props.pagination,
      () => derivePagination(),
      { deep: true }
    );
    watch(
      () => props.columns,
      () => deriveFromColumns(currentChildren)
    );
    watch(
      () => (Array.isArray(props.columns) ? props.columns.map((c: any) => c && c.width).join(',') : ''),
      () => deriveFromColumns(currentChildren)
    );

    let columnsCache: { sig: string; columns: any[] } | null = null;

    /* componentDidUpdate: recompute cache / page data */
    let mounted = false;
    onMounted(() => {
      mounted = true;
    });
    const recalc = (opts: { dataSourceChanged?: boolean; queriesChanged?: boolean; getCheckboxPropsChanged?: boolean } = {}) => {
      if (!mounted) return;
      const { dataSource, defaultExpandAllRows, expandAllRows, expandAllGroupRows, pagination: propsPagination } = props;
      const states: Record<string, any> = {};
      if (opts.dataSourceChanged || opts.queriesChanged || opts.getCheckboxPropsChanged) {
        const _dataSource = [...dataSource];
        const filteredSortedDataSource = foundation.getFilteredSortedDataSource(_dataSource, state.queries);
        const allDataDisabledRowKeys = foundation.getAllDisabledRowKeys(filteredSortedDataSource);
        foundation.setCachedFilteredSortedDataSource(filteredSortedDataSource);
        foundation.setAllDisabledRowKeys(allDataDisabledRowKeys);
        states.dataSource = filteredSortedDataSource;
        const checkRelation = _get(state.rowSelection, 'checkRelation', 'unRelated');
        if (checkRelation === 'related') {
          adapter.setKeyEntities(foundation.buildKeyEntities(_dataSource));
        }
        if (props.groupBy) {
          states.groups = null;
        }
      }
      if (opts.dataSourceChanged) {
        states.pagination = _isObject(state.pagination) ? { ...state.pagination, currentPage: _isObject(propsPagination) && (propsPagination as any).currentPage ? (propsPagination as any).currentPage : 1 } : state.pagination;
      }
      if (Object.keys(states).length) {
        const { pagination: mergedStatePagination = null, queries: stateQueries = null, dataSource: stateDataSource = null } = states;
        const handledProps = foundation.getCurrentPageData(stateDataSource, mergedStatePagination, stateQueries);
        adapter.setAllRowKeys(handledProps.allRowKeys);
        adapter.setDisabledRowKeys(handledProps.disabledRowKeys);
        if ('dataSource' in states) {
          if ((defaultExpandAllRows && handledProps.groups && handledProps.groups.size) || expandAllRows || expandAllGroupRows) {
            foundation.initExpandedRowKeys(handledProps);
          }
          states.pagination = handledProps.pagination;
        }
        for (const k of Object.keys(states)) {
          (state as any)[k] = k === 'groups' && handledProps[k] ? markRaw(handledProps[k]) : handledProps[k];
        }
      }
      syncResizeListeners();
    };

    watch(
      () => props.dataSource,
      () => {
        warnIfNoKey();
        recalc({ dataSourceChanged: true });
      }
    );
    watch(
      () => state.queries,
      () => recalc({ queriesChanged: true })
    );
    watch(
      () => props.expandedRowKeys,
      (keys) => {
        if (Array.isArray(keys)) state.expandedRowKeys = [...keys];
      }
    );
    watch(
      () => [props.components, props.virtualized],
      () => {
        state.components = markRaw(mergeComponents(props.components, props.virtualized));
      }
    );
    watch(
      () => [props.expandAllRows, props.expandAllGroupRows],
      () => foundation.initExpandedRowKeys({ groups: state.groups })
    );
    watch(
      () => [props.scroll, props.sticky, props.showHeader],
      () => syncResizeListeners(),
      { deep: true }
    );

    /* ------------------------------------------------------------------ */
    /* render helpers                                                       */
    /* ------------------------------------------------------------------ */
    const getCurrentPageData = () => {
      const pageData = foundation.getCurrentPageData();
      const retObj = ['dataSource', 'groups'].reduce((result: Record<string, any>, key) => {
        if (pageData[key]) result[key] = pageData[key];
        return result;
      }, {});
      return cloneDeep(retObj);
    };

    const renderPagination = (pagination: any, propRenderPagination: any) => {
      if (!pagination) return null;
      const mergedPagination = foundation.memoizedPagination(pagination);
      const info = foundation.formatPaginationInfo(mergedPagination, locale.value?.pageText);
      return h(TablePagination, { info, pagination: mergedPagination, renderPagination: slots.renderPagination ? (p: any) => slots.renderPagination!(p) : propRenderPagination, prefixCls: props.prefixCls, paginationComponent: props.paginationComponent });
    };

    const renderTitle = (p: { title?: any; prefixCls: string; dataSource: any[] }) => {
      let { title } = p;
      const { prefixCls, dataSource } = p;
      if (slots.title) {
        title = slots.title({ dataSource });
      } else if (isRenderFn(title)) {
        title = title(dataSource);
      }
      const node = normalizeNode(title);
      return node !== null && node !== undefined && node !== '' && !(Array.isArray(node) && !node.length) ? h('div', { class: `${prefixCls}-title`, 'x-semi-prop': 'title' }, [node]) : null;
    };
    const renderEmpty = (p: { prefixCls: string; empty?: any; dataSource: any[] }) => {
      const { prefixCls, empty, dataSource } = p;
      const wrapCls = `${prefixCls}-placeholder`;
      const isEmpty = foundation.isEmpty(dataSource);
      if (!isEmpty) return null;
      const emptyNode = slots.empty ? slots.empty() : normalizeNode(empty);
      return h('div', { class: wrapCls, key: 'emptyText' }, [h('div', { class: `${prefixCls}-empty`, 'x-semi-prop': 'empty' }, [emptyNode || locale.value?.emptyText])]);
    };
    const renderFooter = (p: { footer?: any; prefixCls: string; dataSource: any[] }) => {
      let { footer } = p;
      const { prefixCls, dataSource } = p;
      if (slots.footer) {
        footer = slots.footer({ dataSource });
      } else if (isRenderFn(footer)) {
        footer = footer(dataSource);
      }
      const node = normalizeNode(footer);
      return node !== null && node !== undefined && node !== '' && !(Array.isArray(node) && !node.length) ? h('div', { class: `${prefixCls}-footer`, key: 'footer', 'x-semi-prop': 'footer' }, [node]) : null;
    };

    const renderTable = (p: Record<string, any>) => {
      const { columns, filteredColumns, fixed, useFixedHeader, scroll, prefixCls, anyColumnFixed, includeHeader, showHeader, components, onHeaderRow, rowSelection, dataSource, bodyHasScrollBar, disabledRowKeysSet, sticky } = p;
      const selectedRowKeysSet = _get(rowSelection, 'selectedRowKeysSet', new Set());
      const tableLayout = adapter.getTableLayout();
      const headTable =
        fixed || useFixedHeader
          ? h(HeadTable, {
              key: 'head',
              tableLayout,
              ref: headCompRef,
              columns: filteredColumns,
              prefixCls,
              fixed,
              handleBodyScroll: handleBodyScrollLeft,
              components,
              scroll,
              showHeader,
              selectedRowKeysSet,
              onHeaderRow,
              dataSource,
              bodyHasScrollBar,
              sticky,
            })
          : null;
      const bodyTable = h(BodyTable, {
        ..._omit(p, ['rowSelection', 'headWidths', 'columns', 'filteredColumns', 'title', 'footer', 'empty', 'pagination', 'renderPagination', 'class', 'style', 'id', 'bordered', 'loading']),
        key: 'body',
        ref: bodyCompRef,
        columns: filteredColumns,
        fixed,
        prefixCls,
        handleWheel,
        handleBodyScroll,
        anyColumnFixed,
        tableLayout,
        includeHeader,
        showHeader,
        scroll,
        components,
        store,
        selectedRowKeysSet,
        disabledRowKeysSet,
        headerRef: (node: any) => {
          headerWrapRef.value = node && node.getElement ? node.getElement() : node;
        },
      });
      void columns;
      return [headTable, bodyTable];
    };

    const renderMainTable = (p: Record<string, any>) => {
      const useFixedHeader = adapter.useFixedHeader();
      const emptySlot = renderEmpty(p as any);
      return [renderTable({ ...p, fixed: false, useFixedHeader, includeHeader: !useFixedHeader, emptySlot }), renderFooter(p as any)];
    };

    /* ------------------------------------------------------------------ */
    /* context                                                              */
    /* ------------------------------------------------------------------ */
    const tableContext = reactive<TableContextValue>({
      headWidths: [],
      tableWidth: undefined,
      anyColumnFixed: false,
      flattenedColumns: [],
      renderExpandIcon,
      renderSelection,
      setHeadWidths: (...args: any[]) => foundation.setHeadWidths(...args),
      getHeadWidths: (...args: any[]) => foundation.getHeadWidths(...args),
      getCellWidths: (...args: any[]) => foundation.getCellWidths(...args),
      handleRowExpanded,
      getVirtualizedListRef: props.getVirtualizedListRef,
      setBodyHasScrollbar: (...args: any[]) => foundation.setBodyHasScrollbar(...args),
      handleRowSelection: handleRowClickSelection,
      headerStyle: props.headerStyle,
      rowSpanHover: props.rowSpanHover,
      direction: getDirection(),
      store,
    });
    provideTableContext(tableContext);

    expose({
      getCurrentPageData,
      foundation,
      state,
      store,
      rootWrapRef,
      wrapRef,
      getBodyElement: getBodyDOM,
    });

    /* ------------------------------------------------------------------ */
    /* render                                                               */
    /* ------------------------------------------------------------------ */
    return () => {
      const { scroll, prefixCls, bordered, id, pagination: propPagination, virtualized, size, renderPagination: propRenderPagination, getVirtualizedListRef, loading, hideExpandedColumn, rowSelection: propRowSelection } = props;
      const { rowSelection, expandedRowKeys, headWidths, tableWidth, pagination, dataSource, queries, cachedColumns, bodyHasScrollBar } = state;
      const { class: className, style: styleAttr, ...restAttrs } = attrs as any;
      const extraStyle: Record<string, any> = {};
      currentChildren = slots.default ? flattenChildren(slots.default()) : null;
      deriveFromColumns(currentChildren);
      const latestCached = state.cachedColumns;
      const latestQueries = state.queries;
      const widthSig = (latestCached || [])
        .filter((c: any) => c && c.key !== strings.DEFAULT_KEY_COLUMN_SCROLLBAR)
        .map((c: any) => `${c.dataIndex || ''}:${c.width}`)
        .join('|');
      const querySig = (latestQueries || [])
        .map((c: any) => `${c.dataIndex || ''}:${c.sortOrder}:${JSON.stringify(c.filteredValue)}`)
        .join('|');
      const cacheSig = `${widthSig}#${querySig}#${bodyHasScrollBar ? 1 : 0}#${adapter.isAnyColumnUseFullRender(latestQueries) ? 1 : 0}`;
      if (!columnsCache || columnsCache.sig !== cacheSig) {
        columnsCache = { sig: cacheSig, columns: handleColumns(latestQueries, latestCached) };
      }
      const columns = columnsCache.columns;
      const filteredColumns = foundation.memoizedFilterColumns(columns);
      const flattenFnsColumns = foundation.memoizedFlattenFnsColumns(columns);
      const anyColumnFixed = adapter.isAnyColumnFixed(columns);
      const direction = getDirection();

      // keep context in sync
      tableContext.headWidths = headWidths;
      tableContext.tableWidth = tableWidth;
      tableContext.anyColumnFixed = anyColumnFixed;
      tableContext.flattenedColumns = flattenFnsColumns;
      tableContext.getVirtualizedListRef = getVirtualizedListRef;
      tableContext.headerStyle = props.headerStyle;
      tableContext.rowSpanHover = props.rowSpanHover;
      tableContext.direction = direction;

      const p: Record<string, any> = {
        ...props,
        ...state,
        virtualized,
        scroll,
        prefixCls,
        size,
        hideExpandedColumn,
        columns,
        anyColumnFixed,
        rowExpandable: adapter.mergedRowExpandable,
        pagination,
        dataSource,
        rowSelection,
        expandedRowKeys,
        renderExpandIcon,
        filteredColumns,
        direction,
      };
      const x = _get(scroll, 'x');
      const y = _get(scroll, 'y');
      if (virtualized) {
        const userWidth = typeof styleAttr === 'object' && styleAttr && !Array.isArray(styleAttr) ? (styleAttr as any).width : undefined;
        if (userWidth === undefined) {
          extraStyle.width = toPx(x as any);
        }
      }
      const wrapStyle = [styleAttr, extraStyle];
      const wrapCls = classnames({
        [`${prefixCls}-${strings.SIZE_SMALL}`]: size === strings.SIZE_SMALL,
        [`${prefixCls}-${strings.SIZE_MIDDLE}`]: size === strings.SIZE_MIDDLE,
        [`${prefixCls}-virtualized`]: Boolean(virtualized),
        [`${prefixCls}-bordered`]: bordered,
        [`${prefixCls}-fixed-header`]: Boolean(y),
        [`${prefixCls}-scroll-position-left`]: ['both', 'left'].includes(position.value as string),
        [`${prefixCls}-scroll-position-right`]: ['both', 'right'].includes(position.value as string),
      });
      const tablePagination = pagination && propPagination ? renderPagination(pagination, propRenderPagination) : null;
      const paginationPosition = _get(propPagination, 'position', 'bottom');
      const dataAttr = getDataAttr(restAttrs);
      return h(
        'div',
        {
          ref: rootWrapRef,
          class: classnames(className, `${prefixCls}-wrapper`, `${prefixCls}-wrapper-${direction}`),
          'data-column-fixed': anyColumnFixed,
          style: wrapStyle,
          id,
          ...dataAttr,
        },
        [
          h(Spin, { spinning: loading, size: 'large' }, () => [
            h('div', { ref: wrapRef, class: wrapCls }, [
              ['top', 'both'].includes(paginationPosition) ? tablePagination : null,
              renderTitle({ title: props.title, dataSource: p.dataSource, prefixCls }),
              h('div', { class: `${prefixCls}-container` }, renderMainTable({ ...p })),
              ['bottom', 'both'].includes(paginationPosition) ? tablePagination : null,
            ]),
          ]),
        ]
      );
    };
  },
});

export default NormalTable;
