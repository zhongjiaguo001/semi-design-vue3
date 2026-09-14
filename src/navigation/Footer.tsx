import { defineComponent, h, isVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/navigation/constants';
import { getDataAttr, flattenChildren, normalizeNode } from '../_utils';
import CollapseButton from './CollapseButton';
import { useNavContext } from './context';

export const navFooterProps = {
  collapseButton: { type: [Boolean, Object, Function] as PropType<any>, default: false },
  collapseText: { type: Function as PropType<(collapsed?: boolean) => any>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
};

const NavFooter = defineComponent({
  name: 'NavFooter',
  inheritAttrs: false,
  props: navFooterProps,
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const context = useNavContext();

    const renderCollapseButton = () => {
      if (isVNode(props.collapseButton) || (props.collapseButton && typeof props.collapseButton === 'object' && props.collapseButton !== true)) {
        return normalizeNode(props.collapseButton);
      }
      const { onCollapseChange, prefixCls, locale, isCollapsed } = context;
      return h(CollapseButton, {
        prefixCls,
        isCollapsed,
        locale,
        collapseText: props.collapseText,
        onClick: () => onCollapseChange?.(!isCollapsed),
      });
    };

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { isCollapsed, mode } = context;
      const slotChildren = flattenChildren(slots.default?.());
      let children: any = slotChildren.length ? slotChildren : null;
      if (!children && props.collapseButton && mode !== strings.MODE_HORIZONTAL) {
        children = renderCollapseButton();
      }
      const wrapCls = cls(props.className, attrClass, `${cssClasses.PREFIX}-footer`, {
        [`${cssClasses.PREFIX}-footer-collapsed`]: isCollapsed,
      });
      return h(
        'div',
        {
          class: wrapCls,
          style: [props.style, attrStyle],
          onClick: (e: MouseEvent) => emit('click', e),
          ...getDataAttr(rest),
        },
        children
      );
    };
  },
});

(NavFooter as any).elementType = 'NavFooter';
export default NavFooter;
