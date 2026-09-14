import { defineComponent, h, ref } from 'vue';
import type { PropType } from 'vue';
import _noop from 'lodash/noop';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import ColGroup from './ColGroup';
import TableHeader from './TableHeader';
import { toPx } from '../_utils';

export const headTableProps = {
  tableLayout: { type: String, default: undefined },
  bodyHasScrollBar: { type: Boolean, default: false },
  columns: { type: Array as PropType<any[]>, default: () => [] },
  components: { type: Object as PropType<any>, default: undefined },
  dataSource: { type: Array as PropType<any[]>, default: undefined },
  fixed: { type: [Boolean, String], default: undefined },
  handleBodyScroll: { type: Function as PropType<(e: any) => void>, default: _noop },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  scroll: { type: Object as PropType<{ x?: number | string | boolean; y?: number | string }>, default: undefined },
  selectedRowKeysSet: { type: Object as PropType<Set<any>>, default: () => new Set() },
  showHeader: { type: Boolean, default: true },
  onDidUpdate: { type: Function as PropType<(...args: any[]) => void>, default: _noop },
  onHeaderRow: { type: Function as PropType<(columns: any[], index: number) => any>, default: undefined },
  sticky: { type: [Boolean, Object] as PropType<boolean | { top?: number }>, default: undefined },
};

/**
 * When there are fixed columns / fixed header, the header is rendered as a separate Table
 */
const HeadTable = defineComponent({
  name: 'TableHeadTable',
  props: headTableProps,
  setup(props, { expose }) {
    const wrapRef = ref<HTMLElement | null>(null);
    expose({ getElement: () => wrapRef.value });
    return () => {
      const { scroll, prefixCls, fixed, handleBodyScroll, columns, components, onDidUpdate, showHeader, tableLayout, bodyHasScrollBar, sticky, onHeaderRow, selectedRowKeysSet } = props;
      const TableTag = _get(components, 'header.outer', 'table');
      const x = _get(scroll, 'x');
      const headStyle: Record<string, any> = {};
      const tableStyle: Record<string, any> = {};
      if (x && !fixed) {
        tableStyle.width = toPx(x as any);
      }
      if (bodyHasScrollBar) {
        headStyle.overflowY = 'scroll';
      }
      const headTableCls = classnames(`${prefixCls}-header`, {
        [`${prefixCls}-header-sticky`]: sticky,
        [`${prefixCls}-header-hidden`]: !showHeader,
      });
      const stickyTop = _get(sticky, 'top', 0);
      if (typeof stickyTop === 'number') {
        headStyle.top = toPx(stickyTop);
      }
      return h('div', { key: 'headTable', style: headStyle, class: headTableCls, ref: wrapRef, onScroll: handleBodyScroll }, [
        h(TableTag, { style: tableStyle, class: classnames(prefixCls, { [`${prefixCls}-fixed`]: tableLayout === 'fixed' }) }, [
          h(ColGroup, { columns, prefixCls }),
          h(TableHeader, { columns, components, onDidUpdate, prefixCls, fixed, onHeaderRow: onHeaderRow || _noop, selectedRowKeysSet }),
        ]),
      ]);
    };
  },
});

export default HeadTable;
