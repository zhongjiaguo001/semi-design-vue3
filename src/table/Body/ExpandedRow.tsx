import { defineComponent, h, isVNode } from 'vue';
import type { PropType } from 'vue';
import _isNull from 'lodash/isNull';
import _set from 'lodash/set';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { arrayAdd, filterColumns } from '@douyinfe/semi-foundation/lib/es/table/utils';
import { useTableContext } from '../context';
import BaseRow from './BaseRow';
import { amendTableWidth } from '../utils';
import { toPx } from '../../_utils';

export const expandedRowProps = {
  cellWidths: { type: Array as PropType<number[]>, default: () => [] },
  className: { type: String, default: undefined },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  components: { type: Object as PropType<any>, default: undefined },
  defaultExpandAllRows: { type: Boolean, default: undefined },
  defaultExpandedRowKeys: { type: Array as PropType<any[]>, default: undefined },
  expandIcon: { type: null as unknown as PropType<any>, default: undefined },
  expandRowByClick: { type: Boolean, default: undefined },
  expanded: { type: Boolean, default: undefined },
  expandedRowKeys: { type: Array as PropType<any[]>, default: undefined },
  expandedRowRender: { type: Function as PropType<(record: any, index: number, expanded: boolean) => any>, default: undefined },
  indentSize: { type: Number, default: undefined },
  index: { type: [String, Number], default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  record: { type: Object as PropType<any>, default: () => ({}) },
  renderExpandIcon: { type: Function as PropType<(record: any, isNested?: boolean) => any>, default: undefined },
  store: { type: Object as PropType<any>, default: undefined },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  virtualized: { type: [Boolean, Object] as PropType<any>, default: undefined },
  displayNone: { type: Boolean, default: false },
};

/**
 * Render expanded row
 */
const ExpandedRow = defineComponent({
  name: 'TableExpandedRow',
  props: expandedRowProps,
  setup(props) {
    const context = useTableContext();
    return () => {
      const { record, columns: propColumns = [], prefixCls, className, expanded, expandedRowRender, renderExpandIcon, index, store, components, style, virtualized, indentSize, cellWidths, displayNone } = props;
      const { tableWidth, anyColumnFixed, getCellWidths } = context;
      const cell = expandedRowRender ? expandedRowRender(record, index as number, Boolean(expanded)) : null;
      let children: any = null;
      const cellProps: Record<string, any> = {};
      let column: Record<string, any> = {};
      if (_isNull(cell) || cell === undefined) {
        return null;
      } else if (isVNode(cell) || typeof cell === 'string' || typeof cell === 'number' || Array.isArray(cell)) {
        children = cell;
      } else if (cell && Object.prototype.toString.call(cell) === '[object Object]') {
        const { children: cellChildren, fixed: _fixed, ...restProps } = cell as any;
        children = cellChildren;
        column = { ...restProps };
      }
      if (_get(components, 'body.cell') !== strings.DEFAULT_COMPONENTS.body.cell) {
        if (virtualized) {
          _set(cellProps, 'style.height', '100%');
        }
        _set(cellProps, 'style.display', 'block');
        _set(cellProps, 'style.width', toPx(arrayAdd(cellWidths, 0, propColumns.length)));
      } else {
        cellProps.colSpan = filterColumns(propColumns).length;
      }
      const columns = [
        {
          render: () => ({
            props: cellProps,
            children: h('div', { class: classnames(`${prefixCls}-expand-inner`), style: { width: anyColumnFixed ? toPx(amendTableWidth(tableWidth)) : undefined } }, [children]),
          }),
          ...column,
        },
      ];
      const rowCls = classnames(className, `${prefixCls}-row-expand`);
      const baseRowCellWidths = getCellWidths ? getCellWidths(columns) : [];
      return h(BaseRow, {
        style,
        components,
        className: rowCls,
        expandedRow: true,
        renderExpandIcon,
        rowKey: `${record.key}-expanded-row`,
        columns,
        store,
        virtualized,
        indentSize,
        cellWidths: baseRowCellWidths,
        displayNone,
      });
    };
  },
});

export default ExpandedRow;
