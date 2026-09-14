import { defineComponent, h, ref } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses as css, strings } from '@douyinfe/semi-foundation/lib/es/dropdown/constants';
import { useDropdownContext } from './context';
import { IconTick } from '../icons/generated';
import { getDataAttr, normalizeNode } from '../_utils';

const prefixCls = css.PREFIX;

export type DropdownItemType = (typeof strings.ITEM_TYPE)[number];

export const dropdownItemProps = {
  name: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  divided: { type: Boolean, default: false },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  type: { type: String as PropType<DropdownItemType>, default: undefined },
  active: { type: Boolean, default: false },
  hover: { type: Boolean, default: false },
  showTick: { type: Boolean, default: undefined },
  icon: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
  /** React `forwardRef`: receives the li element */
  forwardRef: { type: Function as PropType<(node: HTMLElement | null) => void>, default: undefined },
};

export const dropdownItemEmits = ['click', 'mouseenter', 'mouseleave', 'contextmenu', 'keydown'];

const DropdownItem = defineComponent({
  name: 'DropdownItem',
  inheritAttrs: false,
  props: dropdownItemProps,
  emits: dropdownItemEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useDropdownContext();
    const liRef = ref<HTMLElement | null>(null);

    expose({ getElement: () => liRef.value });

    return () => {
      const { disabled, className, style, type, active, showTick, hover } = props;
      const realShowTick = context.showTick ?? showTick;
      const itemclass = cls(className, attrs.class as any, {
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-item-disabled`]: disabled,
        [`${prefixCls}-item-hover`]: hover,
        [`${prefixCls}-item-withTick`]: realShowTick,
        [`${prefixCls}-item-${type}`]: type,
        [`${prefixCls}-item-active`]: active,
      });
      const events: Record<string, any> = {};
      if (!disabled) {
        const isInAnotherDropdown = context.level !== 1;
        if (isInAnotherDropdown) {
          // nested dropdown: fire click on mousedown so the outer popup's click-outside handling doesn't swallow it
          events.onMousedown = (e: MouseEvent) => {
            if (e.button === 0) emit('click', e);
          };
        } else {
          events.onClick = (e: MouseEvent) => emit('click', e);
        }
        events.onMouseenter = (e: MouseEvent) => emit('mouseenter', e);
        events.onMouseleave = (e: MouseEvent) => emit('mouseleave', e);
        events.onContextmenu = (e: MouseEvent) => emit('contextmenu', e);
      }
      let tick = null;
      if (realShowTick && active) {
        tick = h(IconTick);
      } else if (realShowTick && !active) {
        tick = h(IconTick, { style: { color: 'transparent' } });
      }
      const iconNode = slots.icon ? slots.icon() : normalizeNode(props.icon);
      const iconContent = iconNode ? h('div', { class: `${prefixCls}-item-icon` }, [iconNode]) : null;
      const { class: _c, style: _s, ...restAttrs } = attrs as any;
      return h(
        'li',
        {
          role: 'menuitem',
          tabindex: -1,
          'aria-disabled': disabled,
          ...restAttrs,
          ...events,
          onKeydown: (e: KeyboardEvent) => emit('keydown', e),
          ref: (node: any) => {
            liRef.value = node;
            props.forwardRef && props.forwardRef(node);
          },
          class: itemclass,
          style,
          ...getDataAttr(attrs as any),
        },
        [tick, iconContent, slots.default?.()]
      );
    };
  },
});

(DropdownItem as any).elementType = 'Dropdown.Item';

export default DropdownItem;
