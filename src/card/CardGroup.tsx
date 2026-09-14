import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/card/constants';
import Space from '../space';
import type { Spacing } from '../space';

const prefixcls = cssClasses.PREFIX;

export type CardGroupType = (typeof strings.TYPE)[number];

export const cardGroupProps = {
  spacing: { type: [Number, Array] as PropType<number | number[]>, default: 16 },
  type: { type: String as PropType<CardGroupType>, default: undefined },
};

const CardGroup = defineComponent({
  name: 'CardGroup',
  inheritAttrs: false,
  props: cardGroupProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { spacing, type } = props;
      const isGrid = type === 'grid';
      const { class: className, style, ...others } = attrs as any;
      const cardGroupCls = cls(`${prefixcls}-group`, className, { [`${prefixcls}-group-grid`]: isGrid });
      return h(Space, { ...others, spacing: (isGrid ? 0 : spacing) as Spacing, wrap: true, class: cardGroupCls, style }, { default: () => slots.default?.() });
    };
  },
});
(CardGroup as any).elementType = 'CardGroup';

export default CardGroup;
