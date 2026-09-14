import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses as dropdownClasses, numbers as dropdownNumbers } from '@douyinfe/semi-foundation/lib/es/dropdown/constants';
import '@douyinfe/semi-foundation/lib/es/dropdown/dropdown.css';
import Tooltip, { tooltipProps } from '../tooltip/Tooltip';
import type { Position } from '../tooltip/Tooltip';
import { IconTick } from '../icons/generated';

export interface TabsDropdownMenuItem {
  key: string;
  name: any;
  icon?: any;
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
}

/**
 * Minimal dropdown used by the Tabs bar (collapsed / "more" tabs).
 * It renders the Semi dropdown markup (`semi-dropdown`, `semi-dropdown-menu`, `semi-dropdown-item`)
 * on top of Tooltip, so it is class-compatible with the full Dropdown component.
 */
export const tabsDropdownProps = {
  ...tooltipProps,
  prefixCls: { type: String, default: dropdownClasses.PREFIX },
  position: { type: String as PropType<Position>, default: 'bottom' },
  trigger: { type: String as PropType<any>, default: 'hover' },
  showTick: { type: Boolean, default: false },
  menu: { type: Array as PropType<TabsDropdownMenuItem[]>, default: () => [] },
  render: { type: [Object, Function] as PropType<any>, default: undefined },
  contentClassName: { type: String, default: undefined },
  spacing: { type: [Number, Object] as PropType<number | { x?: number; y?: number }>, default: dropdownNumbers.SPACING },
  disableFocusListener: { type: Boolean, default: true },
  showArrow: { type: Boolean, default: false },
  motion: { type: Boolean, default: true },
  mouseLeaveDelay: { type: Number, default: 100 },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
};

const TabsDropdown = defineComponent({
  name: 'TabsDropdown',
  inheritAttrs: false,
  props: tabsDropdownProps,
  emits: ['visibleChange', 'clickOutSide', 'escKeyDown', 'afterClose'],
  setup(props, { slots, attrs, emit }) {
    const renderMenu = () => {
      const { prefixCls, showTick, menu } = props;
      return h(
        'ul',
        { role: 'menu', 'aria-orientation': 'vertical', class: `${prefixCls}-menu` },
        menu.map((item) => {
          let tick: any = null;
          if (showTick && item.active) tick = h(IconTick);
          else if (showTick) tick = h(IconTick, { style: { color: 'transparent' } });
          const itemCls = cls({
            [`${prefixCls}-item`]: true,
            [`${prefixCls}-item-disabled`]: item.disabled,
            [`${prefixCls}-item-withTick`]: showTick,
            [`${prefixCls}-item-active`]: item.active,
          });
          const icon = item.icon ? h('div', { class: `${prefixCls}-item-icon` }, [typeof item.icon === 'function' ? item.icon() : item.icon]) : null;
          return h(
            'li',
            {
              key: item.key,
              role: 'menuitem',
              tabindex: -1,
              'aria-disabled': item.disabled,
              class: itemCls,
              onClick: item.disabled ? undefined : item.onClick,
            },
            [tick, icon, typeof item.name === 'function' ? item.name() : item.name]
          );
        })
      );
    };
    const renderPopCard = () => {
      const { prefixCls, contentClassName, dropdownStyle } = props;
      const content = slots.render ? slots.render() : props.render ? (typeof props.render === 'function' ? props.render() : props.render) : renderMenu();
      return h('div', { class: cls(prefixCls, contentClassName), style: dropdownStyle }, [h('div', { class: `${prefixCls}-content` }, [content])]);
    };
    return () => {
      const { menu: _m, render: _r, showTick: _t, contentClassName: _c, dropdownStyle: _d, ...rest } = props as any;
      return h(
        Tooltip,
        {
          ...attrs,
          ...rest,
          role: props.trigger === 'click' || props.trigger === 'custom' ? 'dialog' : 'tooltip',
          onVisibleChange: (v: boolean) => emit('visibleChange', v),
          onClickOutSide: (e: any) => emit('clickOutSide', e),
          onEscKeyDown: (e: any) => emit('escKeyDown', e),
          onAfterClose: () => emit('afterClose'),
        },
        { default: slots.default, content: renderPopCard }
      );
    };
  },
});

export default TabsDropdown;
