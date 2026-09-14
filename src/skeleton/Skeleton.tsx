import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/skeleton/constants';
import '@douyinfe/semi-foundation/lib/es/skeleton/skeleton.css';
import { normalizeNode } from '../_utils';
import { SkeletonAvatar, SkeletonImage, SkeletonTitle, SkeletonButton, SkeletonParagraph } from './item';

const prefixCls = cssClasses.PREFIX;

export const skeletonProps = {
  active: { type: Boolean, default: false },
  loading: { type: Boolean, default: true },
  /** placeholder node (also available as the `placeholder` slot) */
  placeholder: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
};

const Skeleton = defineComponent({
  name: 'Skeleton',
  inheritAttrs: false,
  props: skeletonProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { active, loading } = props;
      const { class: className, style, ...others } = attrs as any;
      const skCls = cls(prefixCls, { [`${prefixCls}-active`]: Boolean(active) }, className);
      if (loading) {
        const placeholder = slots.placeholder ? slots.placeholder() : normalizeNode(props.placeholder);
        return h('div', { class: skCls, style, ...others, 'x-semi-prop': 'placeholder' }, placeholder as any);
      }
      return slots.default?.();
    };
  },
});
(Skeleton as any).elementType = 'Skeleton';
(Skeleton as any).Avatar = SkeletonAvatar;
(Skeleton as any).Title = SkeletonTitle;
(Skeleton as any).Button = SkeletonButton;
(Skeleton as any).Paragraph = SkeletonParagraph;
(Skeleton as any).Image = SkeletonImage;

export default Skeleton as typeof Skeleton & {
  Avatar: typeof SkeletonAvatar;
  Title: typeof SkeletonTitle;
  Button: typeof SkeletonButton;
  Paragraph: typeof SkeletonParagraph;
  Image: typeof SkeletonImage;
};
