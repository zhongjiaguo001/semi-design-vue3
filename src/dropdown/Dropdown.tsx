import { defineComponent, h, ref, reactive, watch, cloneVNode } from 'vue';
import type { PropType, VNode } from 'vue';
import classnames from 'classnames';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/dropdown/constants';
import { numbers as tooltipNumbers } from '@douyinfe/semi-foundation/lib/es/tooltip/constants';
import Foundation from '@douyinfe/semi-foundation/lib/es/dropdown/foundation';
import '@douyinfe/semi-foundation/lib/es/dropdown/dropdown.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import Tooltip, { tooltipProps, tooltipEmits } from '../tooltip/Tooltip';
import type { Position } from '../tooltip/Tooltip';
import DropdownMenu from './DropdownMenu';
import DropdownItem from './DropdownItem';
import { DropdownDivider, DropdownTitle } from './DropdownDividerTitle';
import { provideDropdownContext, useDropdownContext } from './context';
import { flattenChildren, normalizeNode, isVNode } from '../_utils';

export type DropdownTrigger = (typeof strings.TRIGGER_SET)[number];

export interface DropDownMenuItemItem {
  node: 'item';
  name?: string;
  [key: string]: any;
}
export interface DropDownMenuItemDivider {
  node: 'divider';
  [key: string]: any;
}
export interface DropDownMenuItemTitle {
  node: 'title';
  name?: string;
  [key: string]: any;
}
export type DropDownMenuItem = DropDownMenuItemItem | DropDownMenuItemDivider | DropDownMenuItemTitle;

const { content: _c, showArrow: _sa, returnFocusOnClose: _rf, ...restTooltipProps } = tooltipProps;

export const dropdownProps = {
  ...restTooltipProps,
  render: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
  menu: { type: Array as PropType<DropDownMenuItem[]>, default: undefined },
  contentClassName: { type: [String, Array] as PropType<string | any[]>, default: undefined },
  showTick: { type: Boolean, default: false },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  zIndex: { type: Number, default: tooltipNumbers.DEFAULT_Z_INDEX },
  motion: { type: Boolean, default: true },
  trigger: { type: String as PropType<DropdownTrigger>, default: 'hover' },
  position: { type: String as PropType<Position>, default: 'bottom' },
  mouseLeaveDelay: { type: Number, default: strings.DEFAULT_LEAVE_DELAY },
  closeOnEsc: { type: Boolean, default: true },
  spacing: { type: [Number, Object] as PropType<number | { x?: number; y?: number }>, default: undefined },
};

export const dropdownEmits = tooltipEmits;

const Dropdown = defineComponent({
  name: 'Dropdown',
  inheritAttrs: false,
  props: dropdownProps,
  emits: dropdownEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const parentContext = useDropdownContext();
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      popVisible: Boolean(props.visible),
    });
    const tooltipRef = ref<any>(null);

    const adapter = {
      ...baseAdapter,
      setPopVisible: (popVisible: boolean) => {
        state.popVisible = popVisible;
      },
      notifyVisibleChange: (visible: boolean) => emit('visibleChange', visible),
      getPopupId: () => tooltipRef.value?.getPopupId(),
    };
    const foundation = new (Foundation as any)(adapter);
    const handleVisibleChange = (visible: boolean) => foundation.handleVisibleChange(visible);

    const contextValue = reactive({
      showTick: props.showTick,
      level: (parentContext.level || 0) + 1,
      trigger: props.trigger,
    });
    watch(
      () => [props.showTick, props.trigger, parentContext.level] as const,
      ([showTick, trigger, level]) => {
        contextValue.showTick = showTick;
        contextValue.trigger = trigger;
        contextValue.level = (level || 0) + 1;
      }
    );
    provideDropdownContext(contextValue);

    const renderMenu = () => {
      const { menu = [] } = props;
      const content = menu.map((m, index) => {
        switch (m.node) {
          case 'title': {
            const { name, node, ...rest } = m;
            return h(DropdownTitle, { ...rest, key: node + name + index }, () => name);
          }
          case 'item': {
            const { node, name, ...rest } = m;
            return h(DropdownItem, { ...rest, key: node + name + index }, () => name);
          }
          case 'divider': {
            return h(DropdownDivider, { key: m.node + index });
          }
          default:
            return null;
        }
      });
      return h(DropdownMenu, null, () => content);
    };

    const renderContent = () => {
      const { contentClassName, style, prefixCls } = props;
      const className = classnames(prefixCls, contentClassName as any);
      let content: any = null;
      if (slots.render) {
        content = slots.render();
      } else if (props.render !== undefined && props.render !== null) {
        content = normalizeNode(props.render);
      } else if (Array.isArray(props.menu)) {
        content = renderMenu();
      }
      return h('div', { class: className, style }, [h('div', { class: `${prefixCls}-content`, 'x-semi-prop': 'render' }, [content])]);
    };

    expose({
      foundation,
      focusTrigger: () => tooltipRef.value?.focusTrigger(),
      rePosition: () => tooltipRef.value?.rePosition(),
      getPopupId: () => tooltipRef.value?.getPopupId(),
    });

    return () => {
      const {
        position,
        trigger,
        zIndex,
        className,
        motion,
        margin,
        style: _style,
        prefixCls,
        render: _r,
        menu: _m,
        contentClassName: _cc,
        showTick: _st,
        ...attr
      } = props as any;
      let { spacing } = props;
      const { level } = parentContext;
      const { popVisible } = state;
      if (level > 0) {
        spacing = typeof spacing === 'number' ? spacing : numbers.NESTED_SPACING;
      } else if (spacing === null || typeof spacing === 'undefined') {
        spacing = numbers.SPACING;
      }
      const children = flattenChildren(slots.default?.());
      let child: VNode | undefined = children[0];
      if (child && isVNode(child)) {
        child = cloneVNode(
          child,
          {
            class: classnames({ [`${prefixCls}-showing`]: popVisible }),
            'aria-haspopup': true,
            'aria-expanded': popVisible,
            // the child's own onKeydown is preserved by cloneVNode's prop merging
            onKeydown: (e: KeyboardEvent) => foundation.handleKeyDown(e),
          },
          true
        );
      }
      return h(
        Tooltip,
        {
          ...attrs,
          ...attr,
          zIndex,
          motion,
          margin,
          className,
          prefixCls,
          spacing,
          position,
          trigger,
          showArrow: false,
          returnFocusOnClose: true,
          ref: tooltipRef,
          onVisibleChange: handleVisibleChange,
          onClickOutSide: (e: any) => emit('clickOutSide', e),
          onEscKeyDown: (e: any) => emit('escKeyDown', e),
          onAfterClose: () => emit('afterClose'),
        },
        {
          default: () => (child ? [child, ...children.slice(1)] : children),
          content: () => renderContent(),
        }
      );
    };
  },
});

(Dropdown as any).elementType = 'Dropdown';
(Dropdown as any).Menu = DropdownMenu;
(Dropdown as any).Item = DropdownItem;
(Dropdown as any).Divider = DropdownDivider;
(Dropdown as any).Title = DropdownTitle;

export default Dropdown;
