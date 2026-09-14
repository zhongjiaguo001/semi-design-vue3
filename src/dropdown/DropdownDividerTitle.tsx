import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/dropdown/constants';
import { useDropdownContext } from './context';

const prefixCls = cssClasses.PREFIX;

export const dropdownDividerProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const DropdownDivider = defineComponent({
  name: 'DropdownDivider',
  inheritAttrs: false,
  props: dropdownDividerProps,
  setup(props, { attrs }) {
    return () => h('div', { ...attrs, class: classnames(`${prefixCls}-divider`, props.className, attrs.class as any), style: props.style });
  },
});
(DropdownDivider as any).elementType = 'Dropdown.Divider';

export const dropdownTitleProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const DropdownTitle = defineComponent({
  name: 'DropdownTitle',
  inheritAttrs: false,
  props: dropdownTitleProps,
  setup(props, { attrs, slots }) {
    const context = useDropdownContext();
    return () => {
      const titleCls = classnames(
        {
          [`${prefixCls}-title`]: true,
          [`${prefixCls}-title-withTick`]: context.showTick,
        },
        props.className,
        attrs.class as any
      );
      return h('div', { ...attrs, class: titleCls, style: props.style }, slots.default?.());
    };
  },
});
(DropdownTitle as any).elementType = 'Dropdown.Title';
