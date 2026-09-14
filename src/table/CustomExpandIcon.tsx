import { defineComponent, h, cloneVNode, isVNode } from 'vue';
import type { PropType } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import { IconChevronRight, IconChevronDown, IconTreeTriangleDown, IconTreeTriangleRight } from '../icons/generated';
import CSSAnimation from '../_cssAnimation';
import { normalizeNode, flattenChildren } from '../_utils';

export const customExpandIconProps = {
  expanded: { type: Boolean, default: false },
  componentType: { type: String as PropType<'expand' | 'tree'>, default: 'expand' },
  onClick: { type: Function as PropType<(expanded: boolean, e: any) => void>, default: undefined },
  onMouseEnter: { type: Function as PropType<(e: any) => void>, default: undefined },
  onMouseLeave: { type: Function as PropType<(e: any) => void>, default: undefined },
  expandIcon: { type: [Boolean, Object, Function, String] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  motion: { type: Boolean, default: true },
};

/**
 * render expand icon
 */
const CustomExpandIcon = defineComponent({
  name: 'TableExpandIcon',
  props: customExpandIconProps,
  setup(props) {
    return () => {
      const { expanded, componentType, onClick, onMouseEnter, onMouseLeave, expandIcon, prefixCls, motion } = props;
      let icon: any;
      if (isVNode(expandIcon)) {
        icon = expandIcon;
      } else if (typeof expandIcon === 'function' && !(expandIcon as any).setup && !(expandIcon as any).render && !(expandIcon as any).__vccOpts) {
        icon = expandIcon(expanded);
      } else if (expandIcon && typeof expandIcon !== 'boolean') {
        icon = normalizeNode(expandIcon);
      } else if (componentType === 'tree') {
        icon = expanded && !motion ? h(IconTreeTriangleDown, { size: 'small' }) : h(IconTreeTriangleRight, { size: 'small' });
      } else {
        icon = expanded && !motion ? h(IconChevronDown) : h(IconChevronRight);
      }
      const handleClick = (e: any) => {
        if (typeof onClick === 'function') {
          onClick(!expanded, e);
        }
      };
      let iconNode: any = icon;
      if (motion) {
        const originIcon = flattenChildren(icon)[0] || icon;
        iconNode = h(
          CSSAnimation,
          {
            animationState: expanded ? 'enter' : 'leave',
            startClassName: `${cssClasses.PREFIX}-expandedIcon-${expanded ? 'show' : 'hide'}`,
          },
          {
            default: ({ animationClassName }: any) => (isVNode(originIcon) ? cloneVNode(originIcon, { class: animationClassName }) : originIcon),
          }
        );
      }
      return h(
        'span',
        {
          role: 'button',
          'aria-label': 'Expand this row',
          tabindex: -1,
          onClick: handleClick,
          onMouseenter: onMouseEnter,
          onMouseleave: onMouseLeave,
          class: `${prefixCls}-expand-icon`,
          onKeypress: (e: KeyboardEvent) => isEnterPress(e) && handleClick(e),
        },
        [iconNode]
      );
    };
  },
});

export default CustomExpandIcon;
