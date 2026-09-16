import { defineComponent, h, onMounted } from 'vue';
import type { PropType } from 'vue';
import _stubTrue from 'lodash/stubTrue';
import _get from 'lodash/get';
import _noop from 'lodash/noop';
import _each from 'lodash/each';
import classnames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import TableRowFoundation from '@douyinfe/semi-foundation/lib/es/table/tableRowFoundation';
import { isLastLeftFixed, arrayAdd, isFixedLeft, isFixedRight, isScrollbarColumn, isFirstFixedRight, isInnerColumnKey, isExpandedColumn } from '@douyinfe/semi-foundation/lib/es/table/utils';
import { useBaseComponent } from '../../_base/useBaseComponent';
import TableCell from '../TableCell';
import { useTableContext } from '../context';

const defaultComponents = { body: { row: 'tr', cell: 'td' } };

export const baseRowProps = {
  anyColumnFixed: { type: Boolean, default: undefined },
  cellWidths: { type: Array as PropType<number[]>, default: () => [] },
  className: { type: String, default: undefined },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  components: { type: Object as PropType<any>, default: () => defaultComponents },
  disabled: { type: Boolean, default: false },
  expandIcon: { type: null as unknown as PropType<any>, default: undefined },
  expandableRow: { type: Boolean, default: undefined },
  expanded: { type: Boolean, default: undefined },
  displayNone: { type: Boolean, default: false },
  expandedRow: { type: Boolean, default: false },
  fixed: { type: [String, Boolean], default: undefined },
  height: { type: [String, Number], default: undefined },
  hideExpandedColumn: { type: Boolean, default: undefined },
  hovered: { type: Boolean, default: false },
  indent: { type: Number, default: undefined },
  indentSize: { type: Number, default: undefined },
  index: { type: Number, default: undefined },
  isSection: { type: Boolean, default: false },
  level: { type: Number, default: undefined },
  onDidUpdate: { type: Function as PropType<(...args: any[]) => void>, default: _noop },
  onHover: { type: Function as PropType<(isHover: boolean, rowKey: any) => void>, default: _noop },
  onRow: { type: Function as PropType<(record: any, index: number, extra?: any) => any>, default: _noop },
  onRowClick: { type: Function as PropType<(rowKey: any, e: any, expanded: boolean) => void>, default: _noop },
  onRowContextMenu: { type: Function as PropType<(...args: any[]) => void>, default: undefined },
  onRowDoubleClick: { type: Function as PropType<(record: any, e: any) => void>, default: _noop },
  onRowMouseEnter: { type: Function as PropType<(record: any, e: any) => void>, default: _noop },
  onRowMouseLeave: { type: Function as PropType<(record: any, e: any) => void>, default: _noop },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  record: { type: Object as PropType<any>, default: undefined },
  renderExpandIcon: { type: Function as PropType<(record: any, isNested?: boolean) => any>, default: undefined },
  replaceClassName: { type: String, default: undefined },
  rowExpandable: { type: Function as PropType<(record: any) => boolean>, default: _stubTrue },
  rowKey: { type: [String, Number], default: undefined },
  selected: { type: Boolean, default: false },
  store: { type: Object as PropType<any>, default: undefined },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  virtualized: { type: [Object, Boolean] as PropType<any>, default: undefined },
  visible: { type: Boolean, default: true },
};

export const baseRowPropKeys = Object.keys(baseRowProps);

/**
 * Body row (React `BaseRow` / `TableRow`)
 */
const BaseRow = defineComponent({
  name: 'TableRow',
  props: baseRowProps,
  setup(props) {
    const context = useTableContext();
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const adapter = {
      ...baseAdapter,
      notifyClick: (...args: any[]) => props.onRowClick(...(args as [any, any, boolean])),
      notifyDoubleClick: (...args: any[]) => props.onRowDoubleClick(...(args as [any, any])),
      notifyMouseLeave: (...args: any[]) => {
        props.onHover(false, props.rowKey);
        props.onRowMouseLeave(...(args as [any, any]));
      },
      notifyMouseEnter: (...args: any[]) => {
        props.onHover(true, props.rowKey);
        props.onRowMouseEnter(...(args as [any, any]));
      },
    };
    const foundation = new (TableRowFoundation as any)(adapter);

    const renderExpandIcon = (record: any) => {
      const { renderExpandIcon: fn } = props;
      return fn ? fn(record, true) : null;
    };

    const handleMouseEnter = (e: any) => {
      foundation.handleMouseEnter(e);
      const customRowProps = adapter.getCache('customRowProps');
      if (typeof customRowProps?.onMouseEnter === 'function') customRowProps.onMouseEnter(e);
      if (typeof customRowProps?.onMouseenter === 'function') customRowProps.onMouseenter(e);
    };
    const handleMouseLeave = (e: any) => {
      foundation.handleMouseLeave(e);
      const customRowProps = adapter.getCache('customRowProps');
      if (typeof customRowProps?.onMouseLeave === 'function') customRowProps.onMouseLeave(e);
      if (typeof customRowProps?.onMouseleave === 'function') customRowProps.onMouseleave(e);
    };
    const handleClick = (e: any) => {
      foundation.handleClick(e);
      const customRowProps = adapter.getCache('customRowProps');
      if (customRowProps && typeof customRowProps.onClick === 'function') {
        customRowProps.onClick(e);
      }
      const { handleRowSelection } = context;
      const { rowKey, selected, disabled } = props;
      if (typeof handleRowSelection === 'function' && !disabled) {
        handleRowSelection(rowKey, !selected, e);
      }
    };
    const handleDoubleClick = (e: any) => {
      foundation.handleDoubleClick(e);
      const customRowProps = adapter.getCache('customRowProps');
      if (customRowProps && typeof customRowProps.onDblclick === 'function') customRowProps.onDblclick(e);
      if (customRowProps && typeof customRowProps.onDoubleClick === 'function') customRowProps.onDoubleClick(e);
    };
    const handleContextMenu = (e: any) => {
      if (typeof props.onRowContextMenu === 'function') props.onRowContextMenu(props.record, e);
      const customRowProps = adapter.getCache('customRowProps');
      if (customRowProps && typeof customRowProps.onContextmenu === 'function') customRowProps.onContextmenu(e);
      if (customRowProps && typeof customRowProps.onContextMenu === 'function') customRowProps.onContextMenu(e);
    };

    onMounted(() => {
      const { onRow, index, record, disabled, selected } = props;
      const customRowProps = adapter.getCache('customRowProps');
      if (typeof customRowProps === 'undefined') {
        const { className: _cn, class: _c, style: _s, ...rowProps } = onRow(record, index as number, { disabled, selected }) || {};
        adapter.setCache('customRowProps', { ...rowProps });
      }
    });

    const renderCells = () => {
      const { columns, record, index, prefixCls, fixed, components, expandableRow, level, expandIcon, rowExpandable, isSection, expandedRow, virtualized, indentSize, hideExpandedColumn, cellWidths, selected, expanded, disabled, onDidUpdate, hovered } = props;
      const BodyCell = _get(components, 'body.cell', strings.DEFAULT_COMPONENTS.body.cell);
      const cells: any[] = [];
      const displayExpandedColumn = rowExpandable(record);
      let firstIndex = 0;
      _each(columns, (column: any, columnIndex: number) => {
        const columnKey = _get(column, 'key');
        const expandableProps: Record<string, any> = {};
        if (fixed !== 'right') {
          if (isInnerColumnKey(columnKey)) {
            firstIndex++;
          }
          if (expandableRow && columnIndex === firstIndex) {
            expandableProps.renderExpandIcon = renderExpandIcon;
            if (hideExpandedColumn || isSection) {
              expandableProps.expandIcon = expandIcon != null ? expandIcon : true;
            }
          }
          if (level != null && columnIndex === firstIndex) {
            expandableProps.indent = level;
            const isBool = typeof expandIcon === 'boolean';
            const hasExpandIcon = expandIcon !== false || (!isBool && expandIcon !== null);
            if (!expandableRow && hideExpandedColumn && hasExpandIcon) {
              expandableProps.indent = level + 1;
            }
          }
        }
        if (isExpandedColumn(column) && !displayExpandedColumn) {
          cells.push(h(TableCell, { key: columnIndex, colIndex: columnIndex, isSection }));
        } else if (!isScrollbarColumn(column)) {
          const diyProps: Record<string, any> = {};
          if (BodyCell !== strings.DEFAULT_COMPONENTS.body.cell && virtualized && !expandedRow) {
            diyProps.width = _get(cellWidths, columnIndex);
          }
          cells.push(
            h(TableCell, {
              colIndex: columnIndex,
              ...expandableProps,
              ...diyProps,
              hideExpandedColumn,
              indentSize,
              isSection,
              prefixCls: `${prefixCls}`,
              column,
              key: columnIndex,
              index,
              record,
              component: BodyCell,
              fixedLeft: isFixedLeft(column) && arrayAdd(cellWidths, 0, columnIndex),
              lastFixedLeft: isLastLeftFixed(columns, column),
              fixedRight: isFixedRight(column) && arrayAdd(cellWidths, columnIndex + 1),
              firstFixedRight: isFirstFixedRight(columns, column),
              selected,
              expanded,
              disabled,
              onDidUpdate,
              hovered,
            })
          );
        }
      });
      return cells;
    };

    return () => {
      const { style, components, prefixCls, selected, disabled, onRow, index, className, replaceClassName, record, hovered, expanded, displayNone, expandableRow, level, expandedRow, isSection, rowKey } = props;
      const BodyRow = _get(components, 'body.row', 'tr');
      const { className: customClassName, class: customClass, style: customStyle, ...rowProps } = onRow(record, index as number, { disabled, selected }) || {};
      adapter.setCache('customRowProps', { ...rowProps });
      const baseRowStyle = { ...style, ...customStyle };
      const rowCls =
        typeof replaceClassName === 'string' && replaceClassName.length
          ? classnames(replaceClassName, customClassName, customClass)
          : classnames(
              className,
              `${prefixCls}-row`,
              {
                [`${prefixCls}-row-selected`]: selected,
                [`${prefixCls}-row-expanded`]: expanded,
                [`${prefixCls}-row-hovered`]: hovered,
                [`${prefixCls}-row-hidden`]: displayNone,
              },
              customClassName,
              customClass
            );
      const ariaProps: Record<string, any> = {};
      if (typeof index === 'number') {
        ariaProps['aria-rowindex'] = index + 1;
      }
      if (expandableRow) {
        ariaProps['aria-expanded'] = expanded;
      }
      if (expanded || expandedRow) {
        ariaProps['aria-level'] = 2;
      }
      if (typeof level === 'number') {
        ariaProps['aria-level'] = level + 1;
      }
      if (isSection) {
        ariaProps['aria-level'] = 1;
      }
      const { onClick: _oc, onMouseEnter: _ome, onMouseLeave: _oml, onMouseenter: _ome2, onMouseleave: _oml2, onDoubleClick: _odc, onDblclick: _odc2, onContextMenu: _ocm, onContextmenu: _ocm2, ...restRowProps } = rowProps;
      const cells = renderCells();
      return h(
        BodyRow,
        {
          role: 'row',
          ...ariaProps,
          ...restRowProps,
          style: baseRowStyle,
          class: rowCls,
          'data-row-key': rowKey,
          onMouseenter: handleMouseEnter,
          onMouseleave: handleMouseLeave,
          onClick: handleClick,
          onDblclick: handleDoubleClick,
          onContextmenu: handleContextMenu,
        },
        typeof BodyRow === 'string' ? cells : { default: () => cells }
      );
    };
  },
});

export default BaseRow;
