import { defineComponent, h, isVNode } from 'vue';
import type { PropType } from 'vue';
import _isSet from 'lodash/isSet';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { filterColumns } from '@douyinfe/semi-foundation/lib/es/table/utils';
import BaseRow from './BaseRow';
import { useTableContext } from '../context';

const defaultComponents = { body: { row: 'tr', cell: 'td' } };

export const sectionRowProps = {
  record: { type: Object as PropType<any>, default: undefined },
  index: { type: Number, default: undefined },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  group: { type: Object as PropType<Set<any>>, default: undefined },
  groupKey: { type: [String, Number], default: undefined },
  data: { type: Array as PropType<any[]>, default: undefined },
  renderGroupSection: { type: Function as PropType<(groupKey?: any, group?: any[]) => any>, default: undefined },
  onGroupedRow: { type: Function as PropType<(record?: any, index?: number) => any>, default: undefined },
  clickGroupedRowToExpand: { type: Boolean, default: undefined },
  components: { type: Object as PropType<any>, default: () => defaultComponents },
  expanded: { type: Boolean, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  onExpand: { type: Function as PropType<(expanded: boolean, groupKey: any, e: any) => void>, default: undefined },
  virtualized: { type: [Boolean, Object] as PropType<any>, default: undefined },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  renderExpandIcon: { type: Function as PropType<(record: any, isNested?: boolean, groupKey?: any) => any>, default: undefined },
  className: { type: String, default: undefined },
  store: { type: Object as PropType<any>, default: undefined },
  rowKey: { type: [String, Number, Function] as PropType<any>, default: undefined },
};

export const sectionRowPropKeys = Object.keys(sectionRowProps);

/**
 * Grouping component title row
 */
const SectionRow = defineComponent({
  name: 'TableSectionRow',
  props: sectionRowProps,
  setup(props) {
    const context = useTableContext();

    const onRow = (...args: any[]) => {
      const { onGroupedRow, clickGroupedRowToExpand, onExpand, groupKey, expanded } = props;
      const rowProps: Record<string, any> = {};
      if (typeof onGroupedRow === 'function') {
        Object.assign(rowProps, onGroupedRow(...(args as [any, number])));
      }
      return {
        ...rowProps,
        onClick: (e: any) => {
          if (typeof onExpand === 'function' && clickGroupedRowToExpand) {
            onExpand(!expanded, groupKey, e);
          }
          if (typeof rowProps.onClick === 'function') {
            rowProps.onClick(e);
          }
        },
      };
    };

    const collectGroupedData = () => {
      const { data, group, rowKey } = props;
      if (Array.isArray(data) && data.length && _isSet(group)) {
        return data.filter((record) => {
          const realRowKey = typeof rowKey === 'function' ? rowKey(record) : _get(record, rowKey);
          return realRowKey != null && realRowKey !== '' && group!.has(realRowKey);
        });
      }
      return [];
    };

    const renderExpandIcon = (record: any) => {
      const { renderExpandIcon: fn, groupKey } = props;
      if (typeof fn === 'function') {
        return fn(record, false, groupKey);
      }
      return null;
    };

    return () => {
      const { record, columns: propColumns = [], prefixCls, className, expanded, renderGroupSection, components, index, store, group, groupKey, virtualized, style } = props;
      const cellProps: Record<string, any> = {};
      let column: Record<string, any> = {};
      let children: any = null;
      const cell = typeof renderGroupSection === 'function' ? renderGroupSection(groupKey, group ? [...group] : []) : null;
      if (isVNode(cell) || typeof cell === 'string' || typeof cell === 'number' || Array.isArray(cell)) {
        children = cell;
      } else if (cell && Object.prototype.toString.call(cell) === '[object Object]') {
        const { children: cellChildren, ...restProps } = cell as any;
        children = cellChildren;
        column = { ...restProps };
      }
      cellProps.colSpan = filterColumns(propColumns).length;
      const columns = [{ render: () => ({ props: cellProps, children }), ...column }];
      const rowCls = classnames(className, `${prefixCls}-row-section`, { on: expanded });
      const { getCellWidths } = context;
      const baseRowCellWidths = getCellWidths ? getCellWidths(columns, null, true) : [];
      void collectGroupedData;
      return h(BaseRow, {
        components,
        virtualized,
        index,
        onRow,
        expanded,
        expandIcon: true,
        isSection: true,
        record,
        replaceClassName: rowCls,
        expandableRow: true,
        renderExpandIcon,
        rowKey: groupKey,
        columns,
        store,
        style,
        cellWidths: baseRowCellWidths,
      });
    };
  },
});

export default SectionRow;
