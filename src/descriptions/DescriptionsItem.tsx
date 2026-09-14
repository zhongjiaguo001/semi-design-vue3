import { defineComponent, h, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/descriptions/constants';
import '@douyinfe/semi-foundation/lib/es/descriptions/descriptions.css';
import { getDataAttr, renderNode, normalizeNode } from '../_utils';
import { useDescriptionsContext } from './context';

const prefixCls = cssClasses.PREFIX;
const keyCls = `${prefixCls}-key`;
const valCls = `${prefixCls}-value`;

export const descriptionsItemProps = {
  itemKey: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  hidden: { type: Boolean, default: false },
  span: { type: Number, default: undefined },
  keyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  /** value content (also the default slot); a function is invoked */
  value: { type: null as unknown as PropType<any>, default: undefined },
};

const DescriptionsItem = defineComponent({
  name: 'DescriptionsItem',
  inheritAttrs: false,
  props: descriptionsItemProps,
  setup(props, { slots, attrs }) {
    const context = useDescriptionsContext();
    return () => {
      const { hidden, span, keyStyle } = props;
      const { class: className, style, ...rest } = attrs as any;
      const { align, layout } = context;
      if (hidden) {
        return null;
      }
      const itemKey = renderNode(slots, 'itemKey', props.itemKey);
      const children = slots.default ? slots.default() : typeof props.value === 'function' ? props.value() : normalizeNode(props.value);
      const plainItem = h('td', { class: `${prefixCls}-item`, colspan: span || 1 }, [
        h('span', { class: keyCls, style: keyStyle }, [itemKey as any, ':']),
        h('span', { class: valCls }, children as any),
      ]);
      const alignItem = [
        h('th', { class: `${prefixCls}-item ${prefixCls}-item-th` }, [h('span', { class: keyCls, style: keyStyle }, itemKey as any)]),
        h('td', { class: `${prefixCls}-item ${prefixCls}-item-td`, colspan: span ? span * 2 - 1 : 1 }, [h('span', { class: valCls }, children as any)]),
      ];
      const item =
        align === 'plain'
          ? h('tr', { class: className, style, ...getDataAttr(rest) }, [plainItem])
          : h('tr', { class: className, style, ...getDataAttr(rest) }, alignItem);
      const horizontalItem = align === 'plain' ? plainItem : h(Fragment, alignItem);
      return layout === 'horizontal' ? horizontalItem : item;
    };
  },
});
(DescriptionsItem as any).elementType = 'Descriptions.Item';

export default DescriptionsItem;
