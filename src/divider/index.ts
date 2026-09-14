import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/divider/constants';
import '@douyinfe/semi-foundation/lib/es/divider/divider.css';
import { flattenChildren, toPx } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const dividerProps = {
  layout: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
  dashed: { type: Boolean, default: false },
  align: { type: String as PropType<'left' | 'right' | 'center'>, default: 'center' },
  margin: { type: [Number, String] as PropType<number | string>, default: undefined },
};

const Divider = defineComponent({
  name: 'Divider',
  inheritAttrs: false,
  props: dividerProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { layout, dashed, align, margin } = props;
      const children = flattenChildren(slots.default?.());
      const hasChildren = children.length > 0;
      const dividerClassNames = cls(`${prefixCls}-divider`, attrs.class as any, {
        [`${prefixCls}-divider-horizontal`]: layout === 'horizontal',
        [`${prefixCls}-divider-vertical`]: layout === 'vertical',
        [`${prefixCls}-divider-dashed`]: !!dashed,
        [`${prefixCls}-divider-with-text`]: hasChildren && layout === 'horizontal',
        [`${prefixCls}-divider-with-text-${align}`]: hasChildren && layout === 'horizontal',
      });
      let overrideDefaultStyle: Record<string, any> = {};
      if (margin !== undefined) {
        if (layout === 'vertical') {
          overrideDefaultStyle = { marginLeft: toPx(margin), marginRight: toPx(margin) };
        } else if (layout === 'horizontal') {
          overrideDefaultStyle = { marginTop: toPx(margin), marginBottom: toPx(margin) };
        }
      }
      const { class: _c, style, ...rest } = attrs as any;
      const isStringChild = hasChildren && children.length === 1 && typeof children[0].type === 'symbol';
      return h('div', { ...rest, class: dividerClassNames, style: [overrideDefaultStyle, style] }, [
        hasChildren && layout === 'horizontal' ? (isStringChild ? h('span', { class: `${prefixCls}-divider_inner-text`, 'x-semi-prop': 'children' }, children) : children) : null,
      ]);
    };
  },
});

export { Divider, Divider as default };
