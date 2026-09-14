import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import { IconCaretup, IconCaretdown } from '../icons/generated';
import Tooltip from '../tooltip/Tooltip';
import { useLocale } from '../locale';
import { getNextSortOrder } from './utils';
import { normalizeNode } from '../_utils';

export const columnSorterProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  onClick: { type: Function as PropType<(e: any) => void>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  sortOrder: { type: [String, Boolean] as PropType<'ascend' | 'descend' | boolean>, default: false },
  sortIcon: { type: Function as PropType<(props: { sortOrder: any }) => any>, default: undefined },
  showTooltip: { type: Boolean, default: false },
  title: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
};

const ColumnSorter = defineComponent({
  name: 'TableColumnSorter',
  props: columnSorterProps,
  setup(props, { slots }) {
    const { locale } = useLocale('Table');
    return () => {
      const { prefixCls, onClick, sortOrder, style, sortIcon, showTooltip } = props;
      const title = slots.title ? slots.title() : normalizeNode(props.title);
      const iconBtnSize = 'default';
      const upCls = cls(`${prefixCls}-column-sorter-up`, { on: sortOrder === strings.SORT_DIRECTIONS[0] });
      const downCls = cls(`${prefixCls}-column-sorter-down`, { on: sortOrder === strings.SORT_DIRECTIONS[1] });
      const ariaProps = {
        'aria-label': `Current sort order is ${sortOrder ? `${sortOrder}ing` : 'none'}`,
        'aria-roledescription': 'Sort data with this column',
      };
      const handleClick = (e: any) => {
        if (typeof onClick === 'function') onClick(e);
      };
      const renderSortIcon = () => {
        if (typeof sortIcon === 'function') {
          return sortIcon({ sortOrder });
        }
        const node = h('div', { style, class: `${prefixCls}-column-sorter` }, [
          h('span', { class: upCls }, [h(IconCaretup, { size: iconBtnSize })]),
          h('span', { class: downCls }, [h(IconCaretdown, { size: iconBtnSize })]),
        ]);
        if (showTooltip) {
          const content = getNextSortOrder(sortOrder);
          return h(Tooltip, { content: locale.value?.[content] }, { default: () => node });
        }
        return node;
      };
      return h(
        'div',
        {
          role: 'button',
          ...ariaProps,
          tabindex: -1,
          class: `${prefixCls}-column-sorter-wrapper`,
          onClick: handleClick,
          onKeypress: (e: KeyboardEvent) => isEnterPress(e) && handleClick(e),
        },
        [title, renderSortIcon()]
      );
    };
  },
});

export default ColumnSorter;
