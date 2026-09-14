import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _isNumber from 'lodash/isNumber';
import _isString from 'lodash/isString';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/badge/constants';
import '@douyinfe/semi-foundation/lib/es/badge/badge.css';
import { useConfigContext } from '../configProvider/context';
import { normalizeNode, flattenChildren } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type BadgeType = (typeof strings.TYPE_SET)[number];
export type BadgeTheme = (typeof strings.THEME_SET)[number];
export type BadgePosition = (typeof strings.POS_SET)[number];

export const badgeProps = {
  count: { type: [Number, String, Object, Function] as PropType<any>, default: undefined },
  dot: { type: Boolean, default: false },
  type: { type: String as PropType<BadgeType>, default: 'primary' },
  theme: { type: String as PropType<BadgeTheme>, default: 'solid' },
  position: { type: String as PropType<BadgePosition>, default: undefined },
  overflowCount: { type: Number, default: undefined },
  countClassName: { type: String, default: undefined },
  countStyle: { type: Object as PropType<CSSProperties>, default: undefined },
};

const Badge = defineComponent({
  name: 'Badge',
  inheritAttrs: false,
  props: badgeProps,
  setup(props, { slots, attrs }) {
    const context = useConfigContext();
    return () => {
      const defaultPosition = context.direction === 'rtl' ? 'leftTop' : 'rightTop';
      const { dot, type, countClassName, countStyle, theme, overflowCount } = props;
      const position = props.position || defaultPosition;
      const children = flattenChildren(slots.default?.());
      const hasChildren = children.length > 0;
      const count = slots.count ? slots.count() : props.count;
      const custom = count && !(_isNumber(count) || _isString(count));
      const showBadge = count !== null && typeof count !== 'undefined';
      const wrapper = cls(countClassName, {
        [`${prefixCls}-${type}`]: !custom,
        [`${prefixCls}-${theme}`]: !custom,
        [`${prefixCls}-${position}`]: Boolean(position) && hasChildren,
        [`${prefixCls}-block`]: !hasChildren,
        [`${prefixCls}-dot`]: dot,
        [`${prefixCls}-count`]: !dot && !custom && showBadge,
        [`${prefixCls}-custom`]: custom,
      });
      let content: any;
      if (_isNumber(count)) {
        content = overflowCount && overflowCount < count ? `${overflowCount}+` : `${count}`;
      } else {
        content = normalizeNode(count);
      }
      const { class: className, style, ...rest } = attrs as any;
      return h('span', { ...rest, class: cls(prefixCls, className) }, [
        ...children,
        h('span', { class: wrapper, style: style || countStyle, 'x-semi-prop': 'count' }, dot ? null : content),
      ]);
    };
  },
});

export { Badge, Badge as default };
