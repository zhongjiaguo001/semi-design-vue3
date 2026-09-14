import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, nextTick, cloneVNode, isVNode } from 'vue';
import type { PropType } from 'vue';
import _isFunction from 'lodash/isFunction';
import _isNull from 'lodash/isNull';
import _pick from 'lodash/pick';
import _isEqual from 'lodash/isEqual';
import _each from 'lodash/each';
import _isMap from 'lodash/isMap';
import _size from 'lodash/size';
import _get from 'lodash/get';
import classnames from 'classnames';
import { arrayAdd, getRecordKey, isExpanded, isSelected, isDisabled, getRecord, genExpandedRowKey, getDefaultVirtualizedRowConfig, isTreeTable } from '@douyinfe/semi-foundation/lib/es/table/utils';
import BodyFoundation from '@douyinfe/semi-foundation/lib/es/table/bodyFoundation';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { useBaseComponent } from '../../_base/useBaseComponent';
import { logger } from '../utils';
import ColGroup from '../ColGroup';
import BaseRow, { baseRowPropKeys } from './BaseRow';
import ExpandedRow from './ExpandedRow';
import SectionRow, { sectionRowPropKeys } from './SectionRow';
import TableHeader from '../TableHeader';
import { useTableContext } from '../context';
import { toPx } from '../../_utils';

/** Vue `reactive()` wraps Map as a Proxy; lodash `isMap` then returns false. */
const isMapLike = (v: any) => _isMap(v) || (typeof Map !== 'undefined' && v instanceof Map);

export const bodyProps = {
  anyColumnFixed: { type: Boolean, default: undefined },
  childrenRecordName: { type: String, default: 'children' },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  components: { type: Object as PropType<any>, default: undefined },
  dataSource: { type: Array as PropType<any[]>, default: () => [] },
  disabledRowKeysSet: { type: Object as PropType<Set<any>>, default: () => new Set() },
  emptySlot: { type: null as unknown as PropType<any>, default: undefined },
  expandRowByClick: { type: Boolean, default: undefined },
  expandedRowKeys: { type: Array as PropType<any[]>, default: () => [] },
  expandedRowRender: { type: Function as PropType<(record: any, index: number, expanded: boolean) => any>, default: undefined },
  fixed: { type: [String, Boolean], default: undefined },
  groups: { type: Object as PropType<Map<any, Set<any>>>, default: undefined },
  handleBodyScroll: { type: Function as PropType<(e: any) => void>, default: undefined },
  handleWheel: { type: Function as PropType<(e: any) => void>, default: undefined },
  headerRef: { type: Function as PropType<(node: any) => void>, default: undefined },
  includeHeader: { type: Boolean, default: undefined },
  onScroll: { type: Function as PropType<(e: any) => void>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  renderExpandIcon: { type: Function as PropType<(record: any, isNested?: boolean, groupKey?: any) => any>, default: undefined },
  rowExpandable: { type: Function as PropType<(record: any) => boolean>, default: undefined },
  rowKey: { type: [String, Boolean, Function] as PropType<any>, default: 'key' },
  scroll: { type: Object as PropType<{ x?: any; y?: any }>, default: undefined },
  selectedRowKeysSet: { type: Object as PropType<Set<any>>, default: () => new Set() },
  showHeader: { type: Boolean, default: undefined },
  size: { type: String, default: undefined },
  store: { type: Object as PropType<any>, default: undefined },
  virtualized: { type: [Boolean, Object] as PropType<any>, default: undefined },
  tableLayout: { type: String, default: undefined },
  // passthrough props used by rows
  keepDOM: { type: Boolean, default: undefined },
  hideExpandedColumn: { type: Boolean, default: undefined },
  expandIcon: { type: null as unknown as PropType<any>, default: undefined },
  indentSize: { type: Number, default: undefined },
  onRow: { type: Function as PropType<any>, default: undefined },
  onHeaderRow: { type: Function as PropType<any>, default: undefined },
  renderGroupSection: { type: Function as PropType<any>, default: undefined },
  onGroupedRow: { type: Function as PropType<any>, default: undefined },
  clickGroupedRowToExpand: { type: Boolean, default: undefined },
  rowClassName: { type: [String, Function] as PropType<string | ((record: any, index: number) => string)>, default: undefined },
};

const Body = defineComponent({
  name: 'TableBody',
  props: bodyProps,
  setup(props, { expose }) {
    const context = useTableContext();
    const bodyRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      virtualizedData: [] as any[],
      cache: { virtualizedScrollTop: null as number | null, virtualizedScrollLeft: null as number | null },
      cachedExpandBtnShouldInRow: null as boolean | null,
      cachedExpandRelatedProps: [] as any[],
      hoveredRowKey: null as any,
    });
    let observer: ResizeObserver | null = null;
    let hoveredRowKeySet = new Set<string>();
    let cachedFlattenedColumns: any = null;
    let cachedCellWidths: number[] = [];
    // virtualized window; listKey is bumped by resetAfterIndex (react-window VariableSizeList)
    const vState = reactive({ scrollTop: 0, listKey: 0, visibleStart: 0, visibleStop: 0 });

    const adapter = {
      ...baseAdapter,
      setVirtualizedData: (virtualizedData: any[], cb?: () => void) => {
        state.virtualizedData = virtualizedData;
        cb && nextTick(cb);
      },
      setCachedExpandBtnShouldInRow: (cachedExpandBtnShouldInRow: boolean) => {
        state.cachedExpandBtnShouldInRow = cachedExpandBtnShouldInRow;
      },
      setCachedExpandRelatedProps: (cachedExpandRelatedProps: any[]) => {
        state.cachedExpandRelatedProps = cachedExpandRelatedProps;
      },
      observeBodyResize: (bodyWrapDOM: HTMLElement | null) => {
        const { setBodyHasScrollbar } = context;
        const resizeCallback = () => {
          const update = () => {
            if (!bodyWrapDOM) return;
            const { offsetWidth, clientWidth } = bodyWrapDOM;
            const bodyHasScrollBar = clientWidth < offsetWidth;
            setBodyHasScrollbar && setBodyHasScrollbar(bodyHasScrollBar);
          };
          const raf = window.requestAnimationFrame || window.setTimeout;
          raf(update);
        };
        if (bodyWrapDOM) {
          if (_get(window, 'ResizeObserver')) {
            if (observer) {
              observer.unobserve(bodyWrapDOM);
              observer = null;
            }
            observer = new ResizeObserver(resizeCallback);
            observer.observe(bodyWrapDOM);
          } else {
            logger.warn('The current browser does not support ResizeObserver,' + 'and the table may be misaligned after plugging and unplugging the mouse and keyboard.' + 'You can try to refresh it.');
          }
        }
      },
      unobserveBodyResize: () => {
        const bodyWrapDOM = bodyRef.value;
        if (observer) {
          bodyWrapDOM && observer.unobserve(bodyWrapDOM);
          observer = null;
        }
      },
    };
    const foundation = new (BodyFoundation as any)(adapter);

    const cssEscape = (value: string) => {
      const cssAny = (globalThis as any).CSS;
      if (cssAny && typeof cssAny.escape === 'function') {
        return cssAny.escape(value);
      }
      return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    };

    const updateRowHoverClass = (nextKeys: string[]) => {
      const bodyNode = bodyRef.value;
      if (!bodyNode) {
        hoveredRowKeySet.clear();
        return;
      }
      const root = (bodyNode.closest && bodyNode.closest(`.${props.prefixCls}-wrapper`)) || bodyNode;
      const nextSet = new Set(nextKeys);
      for (const key of hoveredRowKeySet) {
        if (!nextSet.has(key)) {
          root.querySelectorAll(`tr[data-row-key="${cssEscape(key)}"]`).forEach((r) => r.classList.remove(`${props.prefixCls}-row-hovered`));
        }
      }
      for (const key of nextSet) {
        if (!hoveredRowKeySet.has(key)) {
          root.querySelectorAll(`tr[data-row-key="${cssEscape(key)}"]`).forEach((r) => r.classList.add(`${props.prefixCls}-row-hovered`));
        }
      }
      hoveredRowKeySet = nextSet;
    };

    const getHoveredRowKeysFromDOM = (currentRowKey: string) => {
      const keys = new Set<string>();
      keys.add(currentRowKey);
      const root = bodyRef.value;
      const tbody = root?.querySelector('.semi-table-tbody') ?? root;
      if (!tbody) return Array.from(keys);
      const currentRow = tbody.querySelector(`tr[data-row-key="${cssEscape(currentRowKey)}"]`);
      if (!currentRow) return Array.from(keys);
      const allRows = Array.from(tbody.querySelectorAll('tr[data-row-key]'));
      const currentRowIndex = allRows.indexOf(currentRow);
      if (currentRowIndex === -1) return Array.from(keys);
      allRows.forEach((row, rowIndex) => {
        row.querySelectorAll('td[rowspan]').forEach((cell) => {
          const rowSpan = parseInt(cell.getAttribute('rowspan') || '1', 10);
          if (rowSpan > 1) {
            const spanEndIndex = rowIndex + rowSpan - 1;
            if (currentRowIndex >= rowIndex && currentRowIndex <= spanEndIndex) {
              for (let i = rowIndex; i <= spanEndIndex && i < allRows.length; i++) {
                const rowKeyAttr = allRows[i].getAttribute('data-row-key');
                if (rowKeyAttr) keys.add(rowKeyAttr);
              }
            }
          }
        });
      });
      return Array.from(keys);
    };

    /**
     * Handle row hover event. Updates hoveredRowKey in the store for the isHovering API and,
     * when rowSpanHover is enabled, highlights all rows covered by rowSpan cells.
     */
    const onRowHover = (isHover: boolean, rowKey: any) => {
      const { store } = props;
      const { rowSpanHover } = context;
      if (store) {
        const hoveredRowKey = isHover ? rowKey : null;
        if (store.hoveredRowKey !== hoveredRowKey) {
          store.hoveredRowKey = hoveredRowKey;
        }
      }
      if (rowSpanHover) {
        const rowKeyStr = String(rowKey);
        if (isHover) {
          updateRowHoverClass(getHoveredRowKeysFromDOM(rowKeyStr));
        } else {
          updateRowHoverClass([]);
        }
      }
    };

    // store subscription (React: componentDidMount subscribe)
    watch(
      () => props.store && props.store.hoveredRowKey,
      (hoveredRowKey) => {
        if (hoveredRowKey !== state.hoveredRowKey) state.hoveredRowKey = hoveredRowKey ?? null;
      },
      { immediate: true }
    );

    onMounted(() => {
      foundation.init();
      foundation.observeBodyResize(bodyRef.value);
    });
    onBeforeUnmount(() => foundation.destroy());

    // componentDidUpdate
    watch(
      () => [props.dataSource, props.expandedRowKeys, props.columns],
      () => {
        if (props.virtualized) foundation.initVirtualizedData();
      }
    );
    watch(
      () => strings.EXPAND_RELATED_PROPS.map((key) => _get(props, key, undefined)),
      (newExpandRelatedProps) => {
        if (!_isEqual(newExpandRelatedProps, state.cachedExpandRelatedProps)) {
          foundation.initExpandBtnShouldInRow(newExpandRelatedProps);
        }
      }
    );
    watch(
      () => _get(props.scroll, 'y'),
      (scrollY, prev) => {
        if (scrollY && scrollY !== prev) foundation.observeBodyResize(bodyRef.value);
      }
    );
    watch(
      () => [props.virtualized, props.groups],
      () => {
        if (props.virtualized) foundation.initVirtualizedData();
      }
    );

    const handleRowClick = (rowKey: any, e: any, expand: boolean) => {
      const { handleRowExpanded } = context;
      handleRowExpanded && handleRowExpanded(!expand, rowKey, e);
    };

    const getRowClassName = (record: any, index: number) => {
      const { rowClassName } = props;
      if (typeof rowClassName === 'function') return rowClassName(record, index);
      return rowClassName;
    };

    const renderSectionRow = (sectionProps: Record<string, any> = { groupKey: undefined }) => {
      const { dataSource, rowKey, group, groupKey, index } = sectionProps;
      const sectionRowProps = _pick(sectionProps, sectionRowPropKeys);
      const { handleRowExpanded } = context;
      return h(SectionRow, {
        ...sectionRowProps,
        record: { groupKey, records: [...group].map((recordKey: any) => getRecord(dataSource, recordKey, rowKey)) },
        index,
        onExpand: handleRowExpanded,
        data: dataSource,
        key: groupKey || index,
      });
    };

    const renderExpandedRow = (rowProps: Record<string, any> = { renderExpandIcon: () => null }) => {
      const { style, components, renderExpandIcon, expandedRowRender, record, columns, expanded, index, rowKey, virtualized, displayNone } = rowProps;
      let key = getRecordKey(record, rowKey);
      if (key == null) key = index;
      const { flattenedColumns, getCellWidths } = context;
      if (flattenedColumns !== cachedFlattenedColumns) {
        cachedFlattenedColumns = flattenedColumns;
        cachedCellWidths = getCellWidths ? getCellWidths(flattenedColumns || []) : [];
      }
      return h(ExpandedRow, {
        style,
        components,
        renderExpandIcon,
        expandedRowRender,
        record,
        columns,
        expanded,
        index,
        virtualized,
        key: genExpandedRowKey(key),
        cellWidths: cachedCellWidths,
        displayNone,
        prefixCls: props.prefixCls,
        indentSize: props.indentSize,
      });
    };

    const renderBaseRow = (rowProps: Record<string, any> = {}) => {
      const { rowKey, columns, expandedRowKeys, rowExpandable, record, index, level, expandBtnShouldInRow, selectedRowKeysSet, disabledRowKeysSet, expandRowByClick } = rowProps;
      const baseRowProps = _pick(rowProps, baseRowPropKeys);
      let key = getRecordKey(record, rowKey);
      if (key == null) key = index;
      const expanded = isExpanded(expandedRowKeys, key);
      const expandable = rowExpandable && rowExpandable(record);
      const expandableProps: Record<string, any> = { level: undefined, expanded };
      if (expandable || expandBtnShouldInRow) {
        expandableProps.level = level;
        expandableProps.expandableRow = expandable;
        if (expandRowByClick) {
          expandableProps.onRowClick = handleRowClick;
        }
      }
      const selectionProps = {
        selected: isSelected(selectedRowKeysSet, key),
        disabled: isDisabled(disabledRowKeysSet, key),
      };
      const { getCellWidths } = context;
      const cellWidths = getCellWidths ? getCellWidths(columns, null, true) : [];
      const hovered = state.hoveredRowKey === key;
      return h(BaseRow, {
        ...baseRowProps,
        className: classnames(baseRowProps.className, getRowClassName(record, index)),
        ...expandableProps,
        ...selectionProps,
        key,
        rowKey: key,
        cellWidths,
        hovered,
        onHover: onRowHover,
      });
    };

    const renderBodyRows = (data: any[] = [], level = 0, renderedRows: any[] = [], displayNone = false): any[] => {
      const { rowKey, expandedRowRender, expandedRowKeys, childrenRecordName, rowExpandable, keepDOM } = props;
      const hasExpandedRowRender = typeof expandedRowRender === 'function';
      const expandBtnShouldInRow = state.cachedExpandBtnShouldInRow;
      const { flattenedColumns } = context;
      _each(data, (record: any, index: number) => {
        let key = getRecordKey(record, rowKey);
        if (key == null) key = index;
        const recordChildren = _get(record, childrenRecordName);
        const recordHasChildren = Boolean(Array.isArray(recordChildren) && recordChildren.length);
        renderedRows.push(renderBaseRow({ ...props, columns: flattenedColumns, expandBtnShouldInRow, displayNone, record, key, level, index }));
        const expanded = isExpanded(expandedRowKeys, key);
        const shouldRenderExpandedRows = expanded || keepDOM;
        if (hasExpandedRowRender && rowExpandable && rowExpandable(record) && shouldRenderExpandedRows) {
          const currentExpandRow = renderExpandedRow({ ...props, columns: flattenedColumns, level, index, record, expanded, displayNone: displayNone || !expanded });
          if (!_isNull(currentExpandRow)) {
            renderedRows.push(currentExpandRow);
          }
        }
        if (recordHasChildren && shouldRenderExpandedRows) {
          const nestedRows = renderBodyRows(recordChildren, level + 1, [], displayNone || !expanded);
          renderedRows.push(...nestedRows);
        }
      });
      return renderedRows;
    };

    const renderGroupedRows = () => {
      const { groups, dataSource: data, rowKey, expandedRowKeys, keepDOM } = props;
      const { flattenedColumns } = context;
      const groupsInData = new Map<any, Set<any>>();
      const renderedRows: any[] = [];
      if (groups != null && Array.isArray(data) && data.length) {
        data.forEach((record) => {
          const recordKey = getRecordKey(record, rowKey);
          groups.forEach((group, key) => {
            if (group.has(recordKey)) {
              if (!groupsInData.has(key)) {
                groupsInData.set(key, new Set([]));
              }
              groupsInData.get(key)!.add(recordKey);
              return false;
            }
            return undefined;
          });
        });
      }
      let index = -1;
      groupsInData.forEach((group, groupKey) => {
        const expanded = isExpanded(expandedRowKeys, groupKey);
        renderedRows.push(renderSectionRow({ ...props, columns: flattenedColumns, index: ++index, group, groupKey, expanded }));
        if (expanded || keepDOM) {
          const dataInGroup: any[] = [];
          group.forEach((recordKey) => {
            const record = getRecord(data, recordKey, rowKey);
            if (record != null) dataInGroup.push(record);
          });
          renderedRows.push(...renderBodyRows(dataInGroup, undefined, [], !expanded));
        }
      });
      return renderedRows;
    };

    /* ---------------- virtualized fallback (simple window over flattened data) ---------------- */
    const itemSize = (index: number) => {
      const { virtualized, size: tableSize } = props;
      const virtualizedItem = _get(state.virtualizedData, index, {});
      const defaultConfig = getDefaultVirtualizedRowConfig(tableSize, virtualizedItem.sectionRow);
      const configured = _get(virtualized, 'itemSize', defaultConfig.height);
      let realSize = configured;
      if (typeof configured === 'function') {
        realSize = configured(index, { expandedRow: _get(virtualizedItem, 'expandedRow', false), sectionRow: _get(virtualizedItem, 'sectionRow', false) });
      }
      if (realSize < defaultConfig.minHeight) {
        logger.warn(`The computed real \`itemSize\` cannot be less than ${defaultConfig.minHeight}`);
      }
      return realSize;
    };

    const getVirtualizedRowWidth = () => {
      const { getCellWidths } = context;
      const { columns } = props;
      const cellWidths = getCellWidths ? getCellWidths(columns) : [];
      return arrayAdd(cellWidths, 0, _size(columns));
    };

    const renderVirtualizedRow = (index: number, style: Record<string, any>) => {
      const { flattenedColumns } = context;
      const virtualizedItem = _get(state.virtualizedData, [index], {});
      const { key: _key, parentKeys: _pk, expandedRow, sectionRow, ...rest } = virtualizedItem;
      const rowWidth = getVirtualizedRowWidth();
      const rowProps = { ...props, style: { ...style, width: toPx(rowWidth) }, ...rest, columns: flattenedColumns, index, expandBtnShouldInRow: state.cachedExpandBtnShouldInRow };
      return sectionRow ? renderSectionRow(rowProps) : expandedRow ? renderExpandedRow(rowProps) : renderBaseRow(rowProps);
    };

    const handleVirtualizedScroll = (e: any) => {
      const target = e.target as HTMLElement;
      const newScrollTop = target.scrollTop;
      const newScrollLeft = target.scrollLeft;
      const onScroll = _get(props.virtualized, 'onScroll');
      if (newScrollTop === state.cache.virtualizedScrollTop && typeof onScroll === 'function') {
        onScroll({ horizontalScrolling: true });
      } else if (typeof onScroll === 'function') {
        onScroll({ scrollOffset: newScrollTop, scrollDirection: newScrollTop > (state.cache.virtualizedScrollTop || 0) ? 'forward' : 'backward', scrollUpdateWasRequested: false });
      }
      state.cache.virtualizedScrollLeft = newScrollLeft;
      state.cache.virtualizedScrollTop = newScrollTop;
      vState.scrollTop = newScrollTop;
      if (typeof props.handleBodyScroll === 'function') props.handleBodyScroll(e);
    };

    const listApi: any = {
      scrollTo: (offset: number | { scrollTop?: number; scrollLeft?: number }) => {
        if (!bodyRef.value) return;
        if (offset && typeof offset === 'object') {
          if (offset.scrollTop != null) bodyRef.value.scrollTop = offset.scrollTop;
          if (offset.scrollLeft != null) bodyRef.value.scrollLeft = offset.scrollLeft;
          return;
        }
        bodyRef.value.scrollTop = offset as number;
      },
      scrollToItem: (index: number, align: string = 'auto') => {
        let offset = 0;
        for (let i = 0; i < index; i++) offset += itemSize(i);
        if (align === 'center') {
          offset -= Number(_get(props.scroll, 'y', 0)) / 2 - itemSize(index) / 2;
        } else if (align === 'end') {
          offset -= Number(_get(props.scroll, 'y', 0)) - itemSize(index);
        }
        if (bodyRef.value) bodyRef.value.scrollTop = Math.max(0, offset);
      },
      resetAfterIndex: (_index?: number, _shouldForceUpdate = true) => {
        vState.listKey += 1;
      },
    };
    watch(
      () => props.virtualized,
      (v) => {
        const { getVirtualizedListRef } = context;
        if (getVirtualizedListRef) {
          if (v) getVirtualizedListRef({ current: listApi });
          else console.warn('getVirtualizedListRef only works with virtualized. ' + 'See https://semi.design/en-US/show/table for more information.');
        }
      },
      { immediate: true }
    );

    const renderVirtualizedBody = (direction?: string) => {
      const { scroll, prefixCls, columns, emptySlot, dataSource, handleWheel } = props;
      const { virtualizedData } = state;
      const { getCellWidths } = context;
      const cellWidths = getCellWidths ? getCellWidths(columns) : [];
      const rawY = _get(scroll, 'y');
      const yIsNumber = typeof rawY === 'number';
      const y = yIsNumber ? rawY : 600;
      if (!yIsNumber) {
        logger.warn('You have to specific "scroll.y" which must be a number for table virtualization!');
      }
      const tableWidth = arrayAdd(cellWidths, 0, _size(columns));
      const count = virtualizedData.length;
      // compute window
      const offsets: number[] = [];
      let total = 0;
      for (let i = 0; i < count; i++) {
        offsets.push(total);
        total += itemSize(i);
      }
      const virtualizedCfg = typeof props.virtualized === 'object' && props.virtualized ? props.virtualized : {};
      const overscan = _get(virtualizedCfg, 'overscanCount', 2);
      let start = 0;
      while (start < count - 1 && offsets[start + 1] <= vState.scrollTop) start++;
      let end = start;
      while (end < count - 1 && offsets[end] < vState.scrollTop + y) end++;
      const visibleStart = start;
      const visibleStop = end;
      start = Math.max(0, start - overscan);
      end = Math.min(count - 1, end + overscan);
      const itemKeyFn = typeof virtualizedCfg.itemKey === 'function' ? virtualizedCfg.itemKey : (index: number) => _get(virtualizedData, [index, 'key'], index);
      void vState.listKey;
      if (vState.visibleStart !== visibleStart || vState.visibleStop !== visibleStop) {
        const onItemsRendered = virtualizedCfg.onItemsRendered;
        nextTick(() => {
          vState.visibleStart = visibleStart;
          vState.visibleStop = visibleStop;
          if (typeof onItemsRendered === 'function') {
            onItemsRendered({
              overscanStartIndex: start,
              overscanStopIndex: end,
              visibleStartIndex: visibleStart,
              visibleStopIndex: visibleStop,
            });
          }
        });
      }
      const rows: any[] = [];
      for (let i = start; i <= end && i < count; i++) {
        const row = renderVirtualizedRow(i, { position: 'absolute', top: toPx(offsets[i]), height: toPx(itemSize(i)), left: 0 });
        rows.push(isVNode(row) ? cloneVNode(row, { key: itemKeyFn(i) }) : row);
      }
      const listStyle: Record<string, any> = {
        width: '100%',
        height: count ? toPx(y) : undefined,
        overflowX: 'auto',
        overflowY: 'auto',
        direction,
        position: 'relative',
        willChange: virtualizedCfg.style?.willChange ?? 'transform',
        ...(virtualizedCfg.style || {}),
      };
      return h(
        'div',
        {
          class: classnames(`${prefixCls}-body`, virtualizedCfg.className),
          style: listStyle,
          ref: bodyRef,
          onScroll: handleVirtualizedScroll,
          onWheel: handleWheel,
        },
        [
          h('div', { style: { width: cellWidths.length ? toPx(tableWidth) : undefined }, class: classnames(prefixCls, `${prefixCls}-fixed`) }, [
            h('div', { class: `${prefixCls}-tbody`, style: { height: toPx(total), width: '100%', position: 'relative' } }, rows),
          ]),
          _size(dataSource) === 0 ? emptySlot : null,
        ]
      );
    };

    const renderBody = () => {
      const { scroll, prefixCls, columns, components, fixed, handleWheel, handleBodyScroll, anyColumnFixed, showHeader, emptySlot, includeHeader, dataSource, onScroll, groups, expandedRowRender, tableLayout } = props;
      const x = _get(scroll, 'x');
      const y = _get(scroll, 'y');
      const bodyStyle: Record<string, any> = {};
      const tableStyle: Record<string, any> = {};
      const TableTag = _get(components, 'body.outer', 'table');
      const BodyWrapper = _get(components, 'body.wrapper') || 'tbody';
      if (y) {
        bodyStyle.maxHeight = toPx(y);
      }
      if (x) {
        tableStyle.width = toPx(x);
      }
      if (anyColumnFixed && _size(dataSource)) {
        bodyStyle.overflow = 'auto';
        bodyStyle.WebkitTransform = 'translate3d (0, 0, 0)';
      }
      const colgroup = h(ColGroup, { components: _get(components, 'body'), columns, prefixCls });
      const wrapCls = `${prefixCls}-body`;
      const baseTable = h(
        'div',
        {
          key: 'bodyTable',
          class: wrapCls,
          style: bodyStyle,
          ref: bodyRef,
          onMouseleave: () => {
            if (context.rowSpanHover) updateRowHoverClass([]);
          },
          onWheel: handleWheel,
          onScroll: handleBodyScroll,
        },
        [
          h(
            TableTag,
            {
              role: isMapLike(groups) || _isFunction(expandedRowRender) || isTreeTable({ dataSource } as any) ? 'treegrid' : 'grid',
              'aria-rowcount': dataSource && dataSource.length,
              'aria-colcount': columns && columns.length,
              style: tableStyle,
              class: classnames(prefixCls, { [`${prefixCls}-fixed`]: tableLayout === 'fixed' }),
            },
            [
              colgroup,
              includeHeader && showHeader ? h(TableHeader, { ref: (node: any) => props.headerRef && props.headerRef(node), components, columns, prefixCls, fixed, onHeaderRow: props.onHeaderRow, selectedRowKeysSet: props.selectedRowKeysSet }) : null,
              h(BodyWrapper, { class: `${prefixCls}-tbody`, onScroll }, isMapLike(groups) ? renderGroupedRows() : renderBodyRows(dataSource)),
            ]
          ),
          emptySlot,
        ]
      );
      if (fixed && columns.length) {
        return h('div', { key: 'bodyTable', class: `${prefixCls}-body-outer` }, [baseTable]);
      }
      return baseTable;
    };

    expose({ getElement: () => bodyRef.value, bodyRef, listApi });

    return () => {
      const { virtualized } = props;
      const { direction } = context;
      return virtualized ? renderVirtualizedBody(direction) : renderBody();
    };
  },
});

export default Body;
