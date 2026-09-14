import { defineComponent, h, ref, reactive, watchEffect, cloneVNode, isVNode, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties, VNode } from 'vue';
import cls from 'classnames';
import { times, get } from 'lodash';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import SubNavFoundation from '@douyinfe/semi-foundation/lib/es/navigation/subNavFoundation';
import { strings, numbers, cssClasses } from '@douyinfe/semi-foundation/lib/es/navigation/constants';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, normalizeNode, isSemiIcon } from '../_utils';
import { IconChevronDown, IconChevronRight } from '../icons/generated';
import NavItem from './Item';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import Collapsible from '../collapsible/Collapsible';
import CSSAnimation from '../_cssAnimation';
import { provideNavContext, useNavContext, type NavContextValue } from './context';

export const subNavProps = {
  disabled: { type: Boolean, default: false },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  icon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  indent: { type: [Boolean, Number] as PropType<boolean | number>, default: false },
  isCollapsed: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false },
  itemKey: { type: [String, Number] as PropType<string | number>, default: undefined },
  level: { type: Number, default: 0 },
  maxHeight: { type: Number, default: numbers.DEFAULT_SUBNAV_MAX_HEIGHT },
  text: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  expandIcon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  dropdownProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  subDropdownProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
};

export const subNavEmits = ['mouseenter', 'mouseleave'];

const SubNavContextProvider = defineComponent({
  name: 'SubNavContextProvider',
  setup(_, { slots }) {
    const parent = useNavContext();
    const nested = reactive({ ...parent, isInSubNav: true }) as NavContextValue;
    watchEffect(() => {
      Object.assign(nested, parent);
      nested.isInSubNav = true;
    });
    provideNavContext(nested);
    return () => slots.default?.();
  },
});

const SubNav = defineComponent({
  name: 'SubNav',
  inheritAttrs: false,
  props: subNavProps,
  emits: subNavEmits,
  setup(props, { slots, emit }) {
    const context = useNavContext();
    const titleRef = ref<HTMLElement | null>(null);
    const itemRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { isHovered: false }, { contexts: () => context });
    baseAdapter.setCache('firstMounted', true);

    const invokeContext = (funcName: string, ...args: any[]) => {
      const fn = (context as any)[funcName];
      if (typeof fn === 'function') return fn(...args);
      return null;
    };

    const adapter = {
      ...baseAdapter,
      updateIsHovered: (isHovered: boolean) => {
        state.isHovered = isHovered;
      },
      getOpenKeys: () => context && context.openKeys,
      getOpenKeysIsControlled: () => context && context.openKeysIsControlled,
      getCanUpdateOpenKeys: () => context && context.canUpdateOpenKeys,
      updateOpen: (isOpen: boolean) => invokeContext(isOpen ? 'addOpenKeys' : 'removeOpenKeys', props.itemKey),
      notifyGlobalOpenChange: (...args: any[]) => invokeContext('onOpenChange', ...args),
      notifyGlobalOnSelect: (...args: any[]) => invokeContext('onSelect', ...args),
      notifyGlobalOnClick: (...args: any[]) => invokeContext('onClick', ...args),
      getIsSelected: (itemKey: any) =>
        Boolean(!isNullOrUndefined(itemKey) && get(context, 'selectedKeys', []).includes(String(itemKey))),
      getIsOpen: () => Boolean(context && context.openKeys && context.openKeys.includes(props.itemKey as any)),
    };
    const foundation = new (SubNavFoundation as any)(adapter);
    onBeforeUnmount(() => foundation.destroy?.());

    const setItemRef = (ref: any) => {
      itemRef.value = ref && ref.current ? ref.current : ref;
    };
    const setTitleRef = (ref: any) => {
      titleRef.value = ref && ref.current ? ref.current : ref;
    };

    const handleClick = (e: MouseEvent) => foundation.handleClick(e, titleRef.value);
    const handleKeyPress = (e: KeyboardEvent) => foundation.handleKeyPress(e, titleRef.value);
    const handleDropdownVisible = (visible: boolean) => foundation.handleDropdownVisibleChange(visible);

    const renderIcon = (icon: any, pos: string, withTransition?: boolean, isToggleIcon = false, key: number | string = 0) => {
      const { prefixCls } = context;
      let iconSize: string = 'large';
      if (pos === strings.ICON_POS_RIGHT) iconSize = 'default';
      const className = cls(`${prefixCls}-item-icon`, {
        [`${prefixCls}-item-icon-toggle-${context.toggleIconPosition}`]: isToggleIcon,
        [`${prefixCls}-item-icon-info`]: !isToggleIcon,
      });
      const isOpen = adapter.getIsOpen();
      let iconElem: any = null;
      const iconNode = isVNode(icon) ? icon : Array.isArray(icon) ? flattenChildren(icon)[0] : icon ? normalizeNode(icon) : null;
      if (iconNode) {
        if (withTransition && isVNode(iconNode)) {
          iconElem = h(
            CSSAnimation,
            {
              animationState: isOpen ? 'enter' : 'leave',
              startClassName: `${cssClasses.PREFIX}-icon-rotate-${isOpen ? '180' : '0'}`,
            },
            {
              default: ({ animationClassName }: { animationClassName: string }) =>
                cloneVNode(iconNode as VNode, { size: iconSize, class: animationClassName }),
            }
          );
        } else if (isVNode(iconNode) && isSemiIcon(iconNode)) {
          iconElem = cloneVNode(iconNode as VNode, { size: iconSize });
        } else {
          iconElem = iconNode;
        }
      }
      return h('i', { key, class: className }, [iconElem]);
    };

    const renderTitleDiv = () => {
      const { itemKey, indent, disabled, level, expandIcon } = props;
      // node props are also accepted as same-named slots (slot wins)
      const icon = slots.icon ? slots.icon() : props.icon;
      const text = slots.text ? slots.text() : props.text;
      const { mode, isInSubNav, isCollapsed, prefixCls, subNavMotion, limitIndent } = context;
      const isOpen = adapter.getIsOpen();
      const titleCls = cls(`${prefixCls}-sub-title`, {
        [`${prefixCls}-sub-title-selected`]: adapter.getIsSelected(itemKey),
        [`${prefixCls}-sub-title-disabled`]: disabled,
      });
      let withTransition = false;
      let toggleIconType: any = '';
      if (isCollapsed) {
        toggleIconType = isInSubNav ? h(IconChevronRight) : null;
      } else if (mode === strings.MODE_HORIZONTAL) {
        toggleIconType = isInSubNav
          ? h(IconChevronRight, { 'aria-hidden': true } as any)
          : expandIcon
            ? expandIcon
            : h(IconChevronDown, { 'aria-hidden': true } as any);
      } else {
        if (subNavMotion) withTransition = true;
        toggleIconType = expandIcon ? expandIcon : h(IconChevronDown, { 'aria-hidden': true } as any);
      }
      let placeholderIcons: any = null;
      if (mode === strings.MODE_VERTICAL && !limitIndent && !isCollapsed) {
        const iconAmount = icon && !indent ? level : level - 1;
        placeholderIcons = times(Math.max(iconAmount, 0), (index) => renderIcon(null, strings.ICON_POS_RIGHT, false, false, index));
      }
      const isIconChevronRightShow =
        (!isCollapsed && isInSubNav && mode === strings.MODE_HORIZONTAL) || (isCollapsed && isInSubNav);
      return h(
        'div',
        {
          role: 'menuitem',
          tabIndex: isIconChevronRightShow ? -1 : 0,
          ref: setTitleRef,
          class: titleCls,
          onClick: handleClick,
          onKeypress: handleKeyPress,
          'aria-expanded': isOpen ? 'true' : 'false',
        },
        [
          h('div', { class: `${prefixCls}-item-inner` }, [
            placeholderIcons,
            context.toggleIconPosition === strings.TOGGLE_ICON_LEFT
              ? renderIcon(toggleIconType, strings.ICON_POS_RIGHT, withTransition, true, 'key-toggle-position-left')
              : null,
            icon || indent || (isInSubNav && mode !== strings.MODE_HORIZONTAL)
              ? renderIcon(icon, strings.ICON_POS_LEFT, false, false, 'key-inSubNav-position-left')
              : null,
            h('span', { class: `${prefixCls}-item-text` }, [normalizeNode(text)]),
            context.toggleIconPosition === strings.TOGGLE_ICON_RIGHT
              ? renderIcon(toggleIconType, strings.ICON_POS_RIGHT, withTransition, true, 'key-toggle-position-right')
              : null,
          ]),
        ]
      );
    };

    const renderSubUl = () => {
      const { mode, isCollapsed, subNavMotion, prefixCls } = context;
      const isOpen = adapter.getIsOpen();
      const isHorizontal = mode === strings.MODE_HORIZONTAL;
      const subNavCls = cls(`${prefixCls}-sub`, {
        [`${prefixCls}-sub-open`]: isOpen,
        [`${prefixCls}-sub-popover`]: isCollapsed || isHorizontal,
      });
      const children = () => flattenChildren(slots.default?.());
      if (isHorizontal) return null;
      if (subNavMotion) {
        return h(Collapsible, { motion: Boolean(subNavMotion), isOpen, keepDOM: false, fade: true }, () =>
          !isCollapsed ? h('ul', { class: subNavCls }, children()) : null
        );
      }
      return isOpen && !isCollapsed ? h('ul', { class: subNavCls }, children()) : null;
    };

    const wrapDropdown = (elem: any) => {
      const { disabled, dropdownStyle, subDropdownProps, dropdownProps: userDropdownProps } = props;
      const { mode, isInSubNav, isCollapsed, subNavCloseDelay, subNavOpenDelay, prefixCls, getPopupContainer } = context;
      const isOpen = adapter.getIsOpen();
      const openKeysIsControlled = adapter.getOpenKeysIsControlled();
      const subNavCls = cls({ [`${prefixCls}-popover`]: isCollapsed });
      const dropdownProps: Record<string, any> = { trigger: 'hover', style: dropdownStyle };
      if (openKeysIsControlled) {
        dropdownProps.trigger = 'custom';
        dropdownProps.visible = isOpen;
      }
      if (getPopupContainer) dropdownProps.getPopupContainer = getPopupContainer;
      if (isCollapsed || mode === strings.MODE_HORIZONTAL) {
        if (disabled) return elem;
        return h(
          Dropdown,
          {
            className: subNavCls,
            position: mode === strings.MODE_HORIZONTAL && !isInSubNav ? 'bottomLeft' : 'rightTop',
            mouseEnterDelay: subNavOpenDelay,
            mouseLeaveDelay: subNavCloseDelay,
            onVisibleChange: handleDropdownVisible,
            ...(userDropdownProps ? userDropdownProps : subDropdownProps || {}),
            ...dropdownProps,
          },
          {
            default: () => elem,
            render: () => h(DropdownMenu, null, () => flattenChildren(slots.default?.())),
          }
        );
      }
      return elem;
    };

    return () => {
      const { itemKey, style, disabled, text, isCollapsed: propCollapsed } = props;
      const { mode, isCollapsed, prefixCls } = context;
      let titleDiv: any = renderTitleDiv();
      const subUl = renderSubUl();
      if (isCollapsed || mode === strings.MODE_HORIZONTAL) {
        titleDiv = wrapDropdown(titleDiv);
      }
      return h(
        NavItem,
        {
          style,
          isSubNav: true,
          itemKey,
          forwardRef: setItemRef,
          isCollapsed: propCollapsed || isCollapsed,
          className: `${prefixCls}-sub-wrap`,
          disabled,
          text,
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
        },
        () => h(SubNavContextProvider, null, () => [titleDiv, subUl])
      );
    };
  },
});

(SubNav as any).elementType = 'SubNav';
export default SubNav;
