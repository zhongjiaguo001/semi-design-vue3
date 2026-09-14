import { defineComponent, h, isVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/navigation/constants';
import { getDataAttr, flattenChildren, normalizeNode } from '../_utils';
import { useNavContext } from './context';

export const navHeaderProps = {
  link: { type: String, default: undefined },
  linkOptions: { type: Object as PropType<Record<string, any>>, default: undefined },
  logo: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  text: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
};

const NavHeader = defineComponent({
  name: 'NavHeader',
  inheritAttrs: false,
  props: navHeaderProps,
  setup(props, { slots, attrs }) {
    const context = useNavContext();

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { isCollapsed } = context;
      const wrapCls = cls(props.className, attrClass, `${cssClasses.PREFIX}-header`, {
        [`${cssClasses.PREFIX}-header-collapsed`]: isCollapsed,
      });
      const logo = slots.logo ? slots.logo() : isVNode(props.logo) || props.logo ? normalizeNode(props.logo) : null;
      const text = slots.text ? slots.text() : props.text;
      let wrappedChildren: any[] = [
        logo ? h('i', { class: `${cssClasses.PREFIX}-header-logo` }, [logo]) : null,
        !isNullOrUndefined(text) && !isCollapsed
          ? h('span', { class: `${cssClasses.PREFIX}-header-text` }, [normalizeNode(text)])
          : null,
        flattenChildren(slots.default?.()),
      ];
      if (typeof props.link === 'string') {
        wrappedChildren = [
          h('a', { class: `${props.prefixCls}-header-link`, href: props.link, ...(props.linkOptions || {}) }, wrappedChildren),
        ];
      }
      return h('div', { class: wrapCls, style: [props.style, attrStyle], ...getDataAttr(rest) }, wrappedChildren);
    };
  },
});

(NavHeader as any).elementType = 'NavHeader';
export default NavHeader;
