import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import TableSelectionCellFoundation from '@douyinfe/semi-foundation/lib/es/table/tableSelectionCellFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { Checkbox } from '../checkbox';

export const columnSelectionProps = {
  columnTitle: { type: String, default: undefined },
  getCheckboxProps: { type: Function as PropType<() => Record<string, any>>, default: undefined },
  type: { type: String, default: undefined },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  className: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

/**
 * render selection cell
 */
const ColumnSelection = defineComponent({
  name: 'TableSelectionCell',
  inheritAttrs: false,
  props: columnSelectionProps,
  emits: ['change'],
  setup(props, { emit, attrs }) {
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const adapter = {
      ...baseAdapter,
      notifyChange: (...args: any[]) => emit('change', ...args),
    };
    const foundation = new (TableSelectionCellFoundation as any)(adapter);
    const handleChange = (e: any) => foundation.handleChange(e);
    return () => {
      const { selected, getCheckboxProps, indeterminate, disabled, prefixCls, className } = props;
      const ariaLabel = props.ariaLabel ?? (attrs['aria-label'] as string);
      let checkboxProps: Record<string, any> = {
        onChange: handleChange,
        disabled,
        indeterminate,
        checked: selected,
      };
      if (typeof getCheckboxProps === 'function') {
        checkboxProps = { ...checkboxProps, ...getCheckboxProps() };
      }
      const wrapCls = classnames(`${prefixCls}-selection-wrap`, { [`${prefixCls}-selection-disabled`]: disabled }, className, attrs.class as any);
      return h('span', { class: wrapCls }, [h(Checkbox, { 'aria-label': ariaLabel, ...checkboxProps })]);
    };
  },
});

export default ColumnSelection;
