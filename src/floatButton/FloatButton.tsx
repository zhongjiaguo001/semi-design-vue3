import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/floatButton/constants';
import '@douyinfe/semi-foundation/lib/es/floatButton/floatButton.css';
import Badge from '../badge';
import { normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type FloatButtonShape = (typeof strings.SHAPE)[number];
export type FloatButtonSize = (typeof strings.SIZE)[number];

export const floatButtonProps = {
  shape: { type: String as PropType<FloatButtonShape>, default: 'round' },
  colorful: { type: Boolean, default: false },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  icon: { type: [Object, Function, String] as PropType<any>, default: undefined },
  href: { type: String, default: undefined },
  target: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<FloatButtonSize>, default: 'default' },
  badge: { type: Object as PropType<Record<string, any>>, default: undefined },
};

export const floatButtonEmits = ['click'];

const FloatButton = defineComponent({
  name: 'FloatButton',
  inheritAttrs: false,
  props: floatButtonProps,
  emits: floatButtonEmits,
  setup(props, { slots, attrs, emit }) {
    const handleClick = (e: MouseEvent) => {
      const { href, target, disabled } = props;
      if (disabled) return;
      if (href) {
        if (target === '_blank') {
          window.open(href, '_blank');
        } else {
          window.location.href = href;
        }
      }
      emit('click', e);
    };
    return () => {
      const { className, style, colorful, size, shape, disabled, badge } = props;
      const icon = slots.icon ? slots.icon() : normalizeNode(props.icon);
      const body = h(
        'div',
        {
          class: cls(`${prefixCls}-body`, {
            [`${prefixCls}-${shape}`]: shape,
            [`${prefixCls}-colorful`]: colorful,
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-${size}`]: size,
          }),
        },
        [icon, slots.default?.()]
      );
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      return h(
        'div',
        {
          ...rest,
          style: [style, attrStyle],
          class: cls(prefixCls, className, attrClass, { [`${prefixCls}-${size}`]: size, [`${prefixCls}-${shape}`]: shape }),
          onClick: handleClick,
        },
        [badge ? h(Badge, { ...badge }, { default: () => body }) : body]
      );
    };
  },
});
(FloatButton as any).elementType = 'FloatButton';

export default FloatButton;
