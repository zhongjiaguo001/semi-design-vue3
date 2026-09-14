import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/select/constants';
import { getDataAttr, normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX_GROUP;

export const optionGroupProps = {
  label: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const OptionGroup = defineComponent({
  name: 'SelectOptionGroup',
  inheritAttrs: false,
  props: optionGroupProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { label, className, style } = props;
      const groupCls = cls(className, attrs.class as any, { [prefixCls]: true });
      if (!label && typeof label !== 'number') return null;
      const labelNode = slots.label ? slots.label() : normalizeNode(label);
      return h('div', { class: groupCls, style, ...getDataAttr(attrs as any) }, [labelNode]);
    };
  },
});
(OptionGroup as any).elementType = 'SelectOptionGroup';
(OptionGroup as any).isSelectOptionGroup = true;

export default OptionGroup;
