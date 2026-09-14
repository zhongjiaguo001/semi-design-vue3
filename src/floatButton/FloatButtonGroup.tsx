import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClassesGroup } from '@douyinfe/semi-foundation/lib/es/floatButton/constants';
import '@douyinfe/semi-foundation/lib/es/floatButton/floatButton.css';
import Badge from '../badge';
import { normalizeNode } from '../_utils';
import type { FloatButtonShape, FloatButtonSize } from './FloatButton';

const prefixCls = cssClassesGroup.PREFIX;

export interface FloatButtonGroupItem {
  value?: string;
  content?: any;
  icon?: any;
  badge?: Record<string, any>;
  shape?: FloatButtonShape;
  colorful?: boolean;
  style?: CSSProperties;
  className?: string;
  href?: string;
  target?: string;
  disabled?: boolean;
  size?: FloatButtonSize;
  onClick?: (e: MouseEvent) => void;
}

export const floatButtonGroupProps = {
  disabled: { type: Boolean, default: false },
  items: { type: Array as PropType<FloatButtonGroupItem[]>, default: () => [] },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  shape: { type: String as PropType<FloatButtonShape>, default: 'round' },
  type: { type: String, default: 'default' },
  size: { type: String, default: 'medium' },
};

export const floatButtonGroupEmits = ['click'];

const FloatButtonGroup = defineComponent({
  name: 'FloatButtonGroup',
  inheritAttrs: false,
  props: floatButtonGroupProps,
  emits: floatButtonGroupEmits,
  setup(props, { slots, attrs, emit }) {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // React reads e.target.dataset.value; also resolve clicks landing on the icon / content inside an item.
      const itemEl = target?.dataset?.value !== undefined ? target : target?.closest?.(`.${prefixCls}-item`) as HTMLElement | null;
      const value = itemEl?.dataset?.value;
      emit('click', value, e);
    };
    return () => {
      const { className, style, disabled, items } = props;
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const renderItem = (item: FloatButtonGroupItem, index: number): VNodeChild => {
        const inner = h('div', { key: index, class: cls(`${prefixCls}-item`), 'data-value': item.value }, [normalizeNode(item.icon), normalizeNode(item.content)]);
        if (item.badge) {
          return h(Badge, { key: index, ...item.badge }, { default: () => inner });
        }
        return inner;
      };
      return h(
        'div',
        {
          ...rest,
          class: cls(prefixCls, className, attrClass, { [`${prefixCls}-disabled`]: disabled }),
          style: [style, attrStyle],
          onClick: handleClick,
        },
        [...items.map(renderItem), slots.default?.()]
      );
    };
  },
});
(FloatButtonGroup as any).elementType = 'FloatButtonGroup';

export default FloatButtonGroup;
