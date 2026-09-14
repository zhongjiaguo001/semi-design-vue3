import { defineComponent, h, cloneVNode } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/tag/constants';
import '@douyinfe/semi-foundation/lib/es/tag/tag.css';
import { flattenChildren } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const splitTagGroupProps = {
  ariaLabel: { type: String, default: undefined },
};

/**
 * SplitTagGroup renders its Tag children as one connected group: the first
 * child gets `semi-tag-first`, the last `semi-tag-last` (inner children get zero radius via CSS).
 */
const SplitTagGroup = defineComponent({
  name: 'SplitTagGroup',
  inheritAttrs: false,
  props: splitTagGroupProps,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, 'aria-label': ariaLabelAttr, ...rest } = attrs as any;
      const children = flattenChildren(slots.default?.());
      const lastIndex = children.length - 1;
      const decorated = children.map((child, index) =>
        cloneVNode(
          child,
          {
            class: classNames({
              [`${prefixCls}-first`]: index === 0,
              [`${prefixCls}-last`]: index === lastIndex,
            }),
          },
          true
        )
      );
      return h(
        'div',
        { ...rest, class: classNames(`${prefixCls}-split`, className), role: 'group', 'aria-label': props.ariaLabel ?? ariaLabelAttr },
        decorated
      );
    };
  },
});

export default SplitTagGroup;
