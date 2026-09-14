import { defineComponent, h, cloneVNode, isVNode, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties, VNode } from 'vue';
import cls from 'classnames';
import { noop, times } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import ItemFoundation from '@douyinfe/semi-foundation/lib/es/navigation/itemFoundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/navigation/constants';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, flattenChildren, normalizeNode, isSemiIcon } from '../_utils';
import Tooltip from '../tooltip';
import DropdownItem from '../dropdown/DropdownItem';
import { useNavContext } from './context';

const clsPrefix = `${cssClasses.PREFIX}-item`;

export const navItemProps = {
  disabled: { type: Boolean, default: false },
  forwardRef: { type: Function as PropType<(ele: HTMLElement | null) => void>, default: noop },
  icon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  itemKey: { type: [String, Number] as PropType<string | number>, default: undefined },
  level: { type: Number, default: 0 },
  link: { type: String, default: undefined },
  linkOptions: { type: Object as PropType<Record<string, any>>, default: undefined },
  tabIndex: { type: Number, default: 0 },
  text: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  tooltipHideDelay: { type: Number, default: undefined },
  tooltipShowDelay: { type: Number, default: undefined },
  toggleIcon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  indent: { type: [Boolean, Number] as PropType<boolean | number>, default: false },
  isCollapsed: { type: Boolean, default: false },
  isSubNav: { type: Boolean, default: false },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const navItemEmits = ['click', 'mouseenter', 'mouseleave'];

const NavItem = defineComponent({
  name: 'NavItem',
  inheritAttrs: false,
  props: navItemProps,
  emits: navItemEmits,
  setup(props, { slots, attrs, emit }) {
    const context = useNavContext();
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { tooltipShow: false }, { contexts: () => context });

    const invokeContext = (funcName: string, ...args: any[]) => {
      const fn = (context as any)[funcName];
      if (typeof fn === 'function') return fn(...args);
      return null;
    };

    const adapter = {
      ...baseAdapter,
      cloneDeep,
      updateTooltipShow: (tooltipShow: boolean) => {
        state.tooltipShow = tooltipShow;
      },
      updateSelected: () => {
        // React setState is async; keep getSelected() false for the rest of handleClick
        nextTick(() => invokeContext('updateSelectedKeys', [props.itemKey]));
      },
      updateGlobalSelectedKeys: (keys: (string | number)[]) => invokeContext('updateSelectedKeys', [...keys]),
      getSelectedKeys: () => context && context.selectedKeys,
      getSelectedKeysIsControlled: () => context && context.selectedKeysIsControlled,
      notifyGlobalOnSelect: (...args: any[]) => invokeContext('onSelect', ...args),
      notifyGlobalOnClick: (...args: any[]) => invokeContext('onClick', ...args),
      notifyClick: (...args: any[]) => emit('click', ...args),
      notifyMouseEnter: (...args: any[]) => emit('mouseenter', ...args),
      notifyMouseLeave: (...args: any[]) => emit('mouseleave', ...args),
      getIsCollapsed: () => props.isCollapsed || Boolean(context && context.isCollapsed) || false,
      getSelected: () => Boolean(context && context.selectedKeys && context.selectedKeys.includes(props.itemKey as any)),
      getIsOpen: () => Boolean(context && context.openKeys && context.openKeys.includes(props.itemKey as any)),
    };
    const foundation = new (ItemFoundation as any)(adapter);
    onBeforeUnmount(() => foundation.destroy?.());

    const renderIcon = (icon: any, pos: string, isToggleIcon = false, key: number | string = 0) => {
      if (props.isSubNav) return null;
      if (!icon && context.mode === strings.MODE_HORIZONTAL) return null;
      let iconSize: string = 'large';
      if (pos === strings.ICON_POS_RIGHT) iconSize = 'default';
      const className = cls(`${clsPrefix}-icon`, {
        [`${clsPrefix}-icon-toggle-${context.toggleIconPosition}`]: isToggleIcon,
        [`${clsPrefix}-icon-info`]: !isToggleIcon,
      });
      const iconNode = isVNode(icon) ? icon : Array.isArray(icon) ? flattenChildren(icon)[0] : normalizeNode(icon);
      const inner = isSemiIcon(iconNode)
        ? cloneVNode(iconNode as VNode, { size: (iconNode as VNode).props?.size || iconSize })
        : iconNode;
      return h('i', { class: className, key }, [inner]);
    };

    const setItemRef = (ref: any) => {
      props.forwardRef && props.forwardRef(ref);
    };

    const wrapTooltip = (node: any) => {
      const hideDelay = props.tooltipHideDelay ?? context.tooltipHideDelay;
      const showDelay = props.tooltipShowDelay ?? context.tooltipShowDelay;
      return h(
        Tooltip,
        {
          content: props.text,
          wrapWhenSpecial: false,
          position: 'right',
          trigger: 'hover',
          mouseEnterDelay: showDelay,
          mouseLeaveDelay: hideDelay,
        },
        () => node
      );
    };

    const handleClick = (e: MouseEvent) => foundation.handleClick(e);
    const handleKeyPress = (e: KeyboardEvent) => foundation.handleKeyPress(e);

    return () => {
      const { toggleIcon, className, isSubNav, style, indent, disabled, level = 0, tabIndex, link, linkOptions } = props;
      // node props are also accepted as same-named slots (slot wins)
      const icon = slots.icon ? slots.icon() : props.icon;
      const text = slots.text ? slots.text() : props.text;
      const { class: attrClass, style: attrStyle, onClick: attrClick, onMouseenter, onMouseleave, ...rest } = attrs as any;
      const { mode, isInSubNav, prefixCls, limitIndent } = context;
      const isCollapsed = adapter.getIsCollapsed();
      const selected = adapter.getSelected();

      const children = flattenChildren(slots.default?.());
      let itemChildren: any = null;
      if (children.length) {
        itemChildren = children;
      } else {
        let placeholderIcons: any = null;
        if (mode === strings.MODE_VERTICAL && !limitIndent && !isCollapsed) {
          const iconAmount = icon && !indent ? level : level - 1;
          placeholderIcons = times(Math.max(iconAmount, 0), (index) => renderIcon(null, strings.ICON_POS_RIGHT, false, index));
        }
        itemChildren = [
          placeholderIcons,
          context.toggleIconPosition === strings.TOGGLE_ICON_LEFT
            ? renderIcon(toggleIcon, strings.ICON_POS_RIGHT, true, 'key-toggle-pos-right')
            : null,
          icon || indent || isInSubNav ? renderIcon(icon, strings.ICON_POS_LEFT, false, 'key-position-left') : null,
          !isNullOrUndefined(text) ? h('span', { class: `${cssClasses.PREFIX}-item-text` }, [normalizeNode(text)]) : '',
          context.toggleIconPosition === strings.TOGGLE_ICON_RIGHT
            ? renderIcon(toggleIcon, strings.ICON_POS_RIGHT, true, 'key-toggle-pos-right')
            : null,
        ];
      }

      if (typeof link === 'string') {
        itemChildren = h('a', { class: `${prefixCls}-item-link`, href: link, tabIndex: -1, ...(linkOptions || {}) }, itemChildren);
      }

      const onMouseEnter = (e: MouseEvent) => {
        emit('mouseenter', e);
        onMouseenter?.(e);
      };
      const onMouseLeave = (e: MouseEvent) => {
        emit('mouseleave', e);
        onMouseleave?.(e);
      };
      const onItemClick = (e: MouseEvent) => {
        handleClick(e);
        attrClick?.(e);
      };

      let itemDom: any;
      if (isInSubNav && (isCollapsed || mode === strings.MODE_HORIZONTAL)) {
        const popoverItemCls = cls({
          [clsPrefix]: true,
          [`${clsPrefix}-sub`]: isSubNav,
          [`${clsPrefix}-selected`]: selected,
          [`${clsPrefix}-collapsed`]: isCollapsed,
          [`${clsPrefix}-disabled`]: disabled,
        });
        itemDom = h(
          DropdownItem,
          {
            selected,
            active: selected,
            forwardRef: setItemRef,
            class: popoverItemCls,
            disabled,
            onClick: onItemClick,
            onMouseenter: onMouseEnter,
            onMouseleave: onMouseLeave,
            onKeydown: handleKeyPress,
          },
          () => itemChildren
        );
      } else {
        const popoverItemCls = cls(`${className || attrClass || `${clsPrefix}-normal`}`, {
          [clsPrefix]: true,
          [`${clsPrefix}-sub`]: isSubNav,
          [`${clsPrefix}-selected`]: selected && !isSubNav,
          [`${clsPrefix}-collapsed`]: isCollapsed,
          [`${clsPrefix}-disabled`]: disabled,
          [`${clsPrefix}-has-link`]: typeof link === 'string',
        });
        const ariaProps: Record<string, any> = { 'aria-disabled': disabled };
        if (isSubNav) ariaProps['aria-expanded'] = adapter.getIsOpen();
        itemDom = h(
          'li',
          {
            role: isSubNav ? undefined : 'menuitem',
            tabIndex: isSubNav ? -1 : tabIndex,
            ...ariaProps,
            style: [style, attrStyle],
            ref: setItemRef,
            class: popoverItemCls,
            onClick: onItemClick,
            onMouseenter: onMouseEnter,
            onMouseleave: onMouseLeave,
            onKeypress: handleKeyPress,
            ...getDataAttr(rest),
          },
          itemChildren
        );
      }

      if ((isCollapsed && !isInSubNav && !isSubNav) || (isCollapsed && isSubNav && disabled)) {
        itemDom = wrapTooltip(itemDom);
      }
      if (typeof context.renderWrapper === 'function') {
        return context.renderWrapper({
          itemElement: itemDom,
          isSubNav,
          isInSubNav: Boolean(isInSubNav),
          props,
        });
      }
      return itemDom;
    };
  },
});

(NavItem as any).elementType = 'NavItem';
export default NavItem;
