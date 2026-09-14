import { defineComponent, h, ref, onUpdated, Fragment } from 'vue';
import type { PropType } from 'vue';
import _merge from 'lodash/merge';
import _omit from 'lodash/omit';
import _set from 'lodash/set';
import _noop from 'lodash/noop';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/table/constants';
import TableCellFoundation from '@douyinfe/semi-foundation/lib/es/table/cellFoundation';
import { getRTLAlign, shouldShowEllipsisTitle, getRTLFlexAlign } from '@douyinfe/semi-foundation/lib/es/table/utils';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useTableContext } from './context';
import { amendTableWidth, isInvalidRenderCellText } from './utils';
import { normalizeNode, toPx } from '../_utils';

export const tableCellProps = {
  record: { type: Object as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  index: { type: Number, default: undefined },
  fixedLeft: { type: [Boolean, Number], default: undefined },
  lastFixedLeft: { type: Boolean, default: false },
  fixedRight: { type: [Boolean, Number], default: undefined },
  firstFixedRight: { type: Boolean, default: false },
  indent: { type: Number, default: 0 },
  indentSize: { type: Number, default: numbers.DEFAULT_INDENT_WIDTH },
  column: { type: Object as PropType<any>, default: () => ({}) },
  expandIcon: { type: null as unknown as PropType<any>, default: undefined },
  renderExpandIcon: { type: Function as PropType<(record: any) => any>, default: undefined },
  hideExpandedColumn: { type: Boolean, default: undefined },
  component: { type: [String, Object, Function] as PropType<any>, default: 'td' },
  onClick: { type: Function as PropType<(record: any, e: any) => void>, default: _noop },
  onDidUpdate: { type: Function as PropType<(ref: any) => void>, default: _noop },
  isSection: { type: Boolean, default: false },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  selected: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  colIndex: { type: Number, default: undefined },
  hovered: { type: Boolean, default: false },
};

const TableCell = defineComponent({
  name: 'TableCell',
  props: tableCellProps,
  setup(props) {
    const context = useTableContext();
    const cellRef = ref<HTMLElement | null>(null);
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const adapter = {
      ...baseAdapter,
      notifyClick: (...args: any[]) => {
        const { onClick } = props;
        if (typeof onClick === 'function') {
          onClick(...(args as [any, any]));
        }
      },
    };
    const foundation = new (TableCellFoundation as any)(adapter);

    const handleClick = (e: any) => {
      foundation.handleClick(e);
      const customCellProps = adapter.getCache('customCellProps');
      if (customCellProps && typeof customCellProps.onClick === 'function') {
        customCellProps.onClick(e);
      }
    };

    onUpdated(() => {
      props.onDidUpdate(cellRef);
    });

    const getTdProps = () => {
      const { record, index, column = {}, fixedLeft, fixedRight, width, height } = props;
      let tdProps: Record<string, any> = {};
      let customCellProps: Record<string, any> = {};
      const { direction } = context;
      const isRTL = direction === 'rtl';
      const fixedLeftFlag = fixedLeft || typeof fixedLeft === 'number';
      const fixedRightFlag = fixedRight || typeof fixedRight === 'number';
      if (fixedLeftFlag) {
        _set(tdProps, isRTL ? 'style.right' : 'style.left', toPx(typeof fixedLeft === 'number' ? fixedLeft : 0));
      } else if (fixedRightFlag) {
        _set(tdProps, isRTL ? 'style.left' : 'style.right', toPx(typeof fixedRight === 'number' ? fixedRight : 0));
      }
      if (width != null) {
        _set(tdProps, 'style.width', toPx(width));
      }
      if (height != null) {
        _set(tdProps, 'style.height', toPx(height));
      }
      if (column.onCell) {
        customCellProps = column.onCell(record, index) || {};
        adapter.setCache('customCellProps', { ...customCellProps });
        tdProps = { ...tdProps, ..._omit(customCellProps, ['style', 'className', 'class', 'onClick']) };
        const customCellStyle = _get(customCellProps, 'style') || {};
        tdProps.style = { ...tdProps.style, ...customCellStyle };
      }
      if (column.align) {
        const textAlign = getRTLAlign(column.align, direction);
        const justifyContent = getRTLFlexAlign(column.align, direction);
        tdProps.style = { ...tdProps.style, textAlign, justifyContent };
      }
      return { tdProps, customCellProps };
    };

    const renderText = (tdProps: Record<string, any>) => {
      const { record, indentSize, prefixCls, indent, index, expandIcon, renderExpandIcon, column = {}, hovered } = props;
      const { dataIndex, render, useFullRender } = column;
      let text: any;
      let colSpan: any;
      let rowSpan: any;
      if (typeof dataIndex === 'number') {
        text = _get(record, dataIndex);
      } else if (!dataIndex || dataIndex.length === 0) {
        text = record;
      } else {
        text = _get(record, dataIndex);
      }
      const indentText = indent && indentSize ? h('span', { style: { paddingLeft: `${indentSize * indent}px` }, class: `${prefixCls}-row-indent indent-level-${indent}` }) : null;
      const realExpandIcon = typeof renderExpandIcon === 'function' ? renderExpandIcon(record) : expandIcon;
      if (render) {
        const renderOptions: Record<string, any> = { expandIcon: realExpandIcon, isHovering: hovered };
        if (useFullRender) {
          const { renderSelection } = context;
          const realSelection = typeof renderSelection === 'function' ? renderSelection(record) : null;
          Object.assign(renderOptions, { selection: realSelection, indentText });
        }
        text = render(text, record, index, renderOptions);
        if (isInvalidRenderCellText(text)) {
          tdProps = text.props ? _merge(tdProps, text.props) : tdProps;
          colSpan = tdProps.colSpan;
          rowSpan = tdProps.rowSpan;
          text = text.children;
        }
      }
      return { text, indentText, rowSpan, colSpan, realExpandIcon, tdProps };
    };

    const renderInner = (text: any, indentText: any, realExpandIcon: any) => {
      const { prefixCls, isSection, expandIcon, column = {} } = props;
      const { tableWidth, anyColumnFixed } = context;
      const { useFullRender } = column;
      let inner: any = null;
      if (useFullRender) {
        inner = normalizeNode(text);
      } else {
        inner = [h(Fragment, { key: 'indentText' }, [indentText]), h(Fragment, { key: 'expandIcon' }, [expandIcon ? realExpandIcon : null]), h(Fragment, { key: 'text' }, [normalizeNode(text)])];
      }
      if (isSection) {
        inner = h('div', { class: classnames(`${prefixCls}-section-inner`), style: { width: anyColumnFixed ? toPx(amendTableWidth(tableWidth)) : undefined } }, [inner]);
      }
      return inner;
    };

    return () => {
      const { prefixCls, column = {}, component: BodyCell, fixedLeft, fixedRight, lastFixedLeft, firstFixedRight, colIndex } = props;
      const { direction } = context;
      const isRTL = direction === 'rtl';
      const { className, ellipsis } = column;
      const fixedLeftFlag = fixedLeft || typeof fixedLeft === 'number';
      const fixedRightFlag = fixedRight || typeof fixedRight === 'number';
      const { tdProps, customCellProps } = getTdProps();
      const renderTextResult = renderText(tdProps);
      let { text } = renderTextResult;
      const { indentText, rowSpan, colSpan, realExpandIcon, tdProps: newTdProps } = renderTextResult;
      let title: string | undefined;
      const shouldShowTitle = shouldShowEllipsisTitle(ellipsis);
      if (shouldShowTitle) {
        if (typeof text === 'string') {
          title = text;
        }
      }
      if (rowSpan === 0 || colSpan === 0) {
        return null;
      }
      if (isInvalidRenderCellText(text)) {
        text = null;
      }
      const inner = renderInner(text, indentText, realExpandIcon);
      let isFixedLeft: any;
      let isFixedLeftLast: any;
      let isFixedRight: any;
      let isFixedRightFirst: any;
      if (isRTL) {
        isFixedLeft = fixedRightFlag;
        isFixedLeftLast = firstFixedRight;
        isFixedRight = fixedLeftFlag;
        isFixedRightFirst = lastFixedLeft;
      } else {
        isFixedLeft = fixedLeftFlag;
        isFixedLeftLast = lastFixedLeft;
        isFixedRight = fixedRightFlag;
        isFixedRightFirst = firstFixedRight;
      }
      const columnCls = classnames(className, `${prefixCls}-row-cell`, _get(customCellProps, 'className'), _get(customCellProps, 'class'), {
        [`${prefixCls}-cell-fixed-left`]: isFixedLeft,
        [`${prefixCls}-cell-fixed-left-last`]: isFixedLeftLast,
        [`${prefixCls}-cell-fixed-right`]: isFixedRight,
        [`${prefixCls}-cell-fixed-right-first`]: isFixedRightFirst,
        [`${prefixCls}-row-cell-ellipsis`]: ellipsis,
      });
      const { colSpan: cs, rowSpan: rs, ...restTd } = newTdProps;
      const finalProps: Record<string, any> = {
        role: 'gridcell',
        'aria-colindex': (colIndex ?? 0) + 1,
        class: columnCls,
        onClick: handleClick,
        title,
        ...restTd,
        ref: cellRef,
      };
      if (cs != null) finalProps.colspan = cs;
      if (rs != null) finalProps.rowspan = rs;
      return h(BodyCell, finalProps, Array.isArray(inner) ? inner : [inner]);
    };
  },
});

export default TableCell;
