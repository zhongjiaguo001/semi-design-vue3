import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/scrollList/constants';
import Foundation from '@douyinfe/semi-foundation/lib/es/scrollList/foundation';
import '@douyinfe/semi-foundation/lib/es/scrollList/scrollList.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode, toPx } from '../_utils';
import ScrollItem from './ScrollItem';

export const scrollListProps = {
  header: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  footer: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: undefined },
  bodyHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  xSemiHeaderAlias: { type: String, default: undefined },
  xSemiFooterAlias: { type: String, default: undefined },
};

const ScrollList = defineComponent({
  name: 'ScrollList',
  inheritAttrs: false,
  props: scrollListProps,
  setup(props, { slots, attrs }) {
    const { adapter } = useBaseComponent(props as any, {});
    // the foundation has no logic, but is created for parity with React
    const foundation = new (Foundation as any)(adapter);
    void foundation;

    return () => {
      const { prefixCls, bodyHeight, className, style } = props;
      const prefix = prefixCls || cssClasses.PREFIX;
      const clsWrapper = classnames(className, attrs.class as any, { [prefix]: true });
      const clsHeader = classnames({ [`${prefix}-header`]: true });
      const header = slots.header ? slots.header() : normalizeNode(props.header);
      const footer = slots.footer ? slots.footer() : normalizeNode(props.footer);
      const hasHeader = slots.header ? true : Boolean(props.header);
      const hasFooter = slots.footer ? true : Boolean(props.footer);
      return h(
        'div',
        {
          class: clsWrapper,
          style: [style, attrs.style as any],
          ...getDataAttr(attrs as any),
        },
        [
          hasHeader
            ? h('div', { class: clsHeader }, [
                h('div', { class: `${clsHeader}-title`, 'x-semi-prop': props.xSemiHeaderAlias || 'header' }, header as any),
                h('div', { class: `${prefix}-line` }),
              ])
            : null,
          h(
            'div',
            {
              class: `${prefix}-body`,
              style: { height: bodyHeight ? toPx(bodyHeight) : '' },
              'x-semi-prop': 'children',
            },
            slots.default?.()
          ),
          hasFooter ? h('div', { class: `${prefix}-footer`, 'x-semi-prop': props.xSemiFooterAlias || 'footer' }, footer as any) : null,
        ]
      );
    };
  },
});

(ScrollList as any).Item = ScrollItem;
(ScrollList as any).elementType = 'ScrollList';
export default ScrollList;
