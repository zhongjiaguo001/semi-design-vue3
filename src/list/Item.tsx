import { defineComponent, h, getCurrentInstance } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/list/constants';
import { Col } from '../grid';
import { getDataAttr, flattenChildren, normalizeNode, renderSlotOrProp } from '../_utils';
import { useListContext } from './context';

const prefixCls = cssClasses.PREFIX;

export const listItemProps = {
  extra: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  header: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  main: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  align: { type: String as PropType<(typeof strings.ALIGN)[number]>, default: 'flex-start' },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const listItemEmits = ['click', 'rightClick', 'mouseenter', 'mouseleave'];

const ListItem = defineComponent({
  name: 'ListItem',
  inheritAttrs: false,
  props: listItemProps,
  emits: listItemEmits,
  setup(props, { slots, attrs, emit }) {
    const context = useListContext();
    const instance = getCurrentInstance();
    // listeners of declared emits are stripped from attrs; read the raw vnode props (React `onClick ? onClick : contextOnClick`)
    const hasListener = (name: string) => Boolean(instance?.vnode.props && (instance.vnode.props as any)[name]);

    return () => {
      const { class: attrClass, style: attrStyle, onClick: attrClick, onContextmenu, onMouseenter, onMouseleave, ...rest } = attrs as any;
      const extra = renderSlotOrProp(slots, 'extra', props.extra);
      const header = renderSlotOrProp(slots, 'header', props.header);
      const main = renderSlotOrProp(slots, 'main', props.main);
      const children = flattenChildren(slots.default?.());
      const handleClick = (e: MouseEvent) => {
        emit('click', e);
        if (attrClick) attrClick(e);
        if (!attrClick && !hasListener('onClick')) context.onClick?.(e);
      };
      const handleContextMenu = (e: MouseEvent) => {
        emit('rightClick', e);
        if (onContextmenu) onContextmenu(e);
        if (!onContextmenu && !hasListener('onRightClick')) context.onRightClick?.(e);
      };
      const itemCls = cls(`${prefixCls}-item`, props.className, attrClass);
      const bodyCls = cls(`${prefixCls}-item-body`, { [`${prefixCls}-item-body-${props.align}`]: props.align });
      const body =
        header || main
          ? h('div', { class: bodyCls }, [
              header ? h('div', { class: `${prefixCls}-item-body-header` }, [normalizeNode(header)]) : null,
              main ? h('div', { class: `${prefixCls}-item-body-main` }, [normalizeNode(main)]) : null,
            ])
          : null;
      const li = h(
        'li',
        {
          class: itemCls,
          style: [props.style, attrStyle],
          onClick: handleClick,
          onContextmenu: handleContextMenu,
          onMouseenter: (e: MouseEvent) => {
            emit('mouseenter', e);
            onMouseenter?.(e);
          },
          onMouseleave: (e: MouseEvent) => {
            emit('mouseleave', e);
            onMouseleave?.(e);
          },
          ...getDataAttr(rest),
        },
        [body, children, extra ? h('div', { class: `${prefixCls}-item-extra` }, [normalizeNode(extra)]) : null]
      );
      if (context?.grid) {
        const { gutter: _g, justify: _j, type: _t, align: _a, ...colRest } = context.grid as any;
        return h(Col, colRest, () => li);
      }
      return li;
    };
  },
});

(ListItem as any).elementType = 'ListItem';
export default ListItem;
