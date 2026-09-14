import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import { flattenChildren, normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

export const sectionProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  text: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
};

const Section = defineComponent({
  name: 'FormSection',
  inheritAttrs: false,
  props: sectionProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { text, className, style } = props;
      const cls = classNames({ [`${prefix}-section`]: true }, className, attrs.class as any);
      return h('section', { class: cls, style: [style, (attrs as any).style] }, [
        h('h5', { class: `${prefix}-section-text` }, [text !== undefined ? normalizeNode(text) : null]),
        flattenChildren(slots.default?.()),
      ]);
    };
  },
});

export default Section;
