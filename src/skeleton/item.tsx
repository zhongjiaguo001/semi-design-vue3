import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/skeleton/constants';
import { strings } from '@douyinfe/semi-foundation/lib/es/avatar/constants';
import '@douyinfe/semi-foundation/lib/es/skeleton/skeleton.css';

export type SkeletonAvatarSize = (typeof strings.SIZE)[number];
export type SkeletonAvatarShape = (typeof strings.SHAPE)[number];

export const genericProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  size: { type: String as PropType<SkeletonAvatarSize>, default: 'medium' },
  shape: { type: String as PropType<SkeletonAvatarShape>, default: 'circle' },
};

/** The React `Generic` + `generator(type)`: `<div class="semi-skeleton-<type>">` */
function generator(type: 'avatar' | 'image' | 'title' | 'button', name: string) {
  const Comp = defineComponent({
    name,
    inheritAttrs: false,
    props: genericProps,
    setup(props, { attrs }) {
      return () => {
        const { prefixCls, size, shape } = props;
        const { class: className, ...others } = attrs as any;
        const classString = cls(
          className,
          `${prefixCls}-${type}`,
          { [`${prefixCls}-${type}-${size}`]: type.toUpperCase() === 'AVATAR' },
          { [`${prefixCls}-${type}-${shape}`]: type.toUpperCase() === 'AVATAR' }
        );
        return h('div', { ...others, class: classString });
      };
    },
  });
  (Comp as any).elementType = `Skeleton.${name.replace('Skeleton', '')}`;
  return Comp;
}

export const SkeletonAvatar = generator('avatar', 'SkeletonAvatar');
export const SkeletonImage = generator('image', 'SkeletonImage');
export const SkeletonTitle = generator('title', 'SkeletonTitle');
export const SkeletonButton = generator('button', 'SkeletonButton');

export const paragraphProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  rows: { type: Number, default: 4 },
};

export const SkeletonParagraph = defineComponent({
  name: 'SkeletonParagraph',
  inheritAttrs: false,
  props: paragraphProps,
  setup(props, { attrs }) {
    return () => {
      const { prefixCls, rows } = props;
      const { class: className, style } = attrs as any;
      const classString = cls(className, `${prefixCls}-paragraph`);
      return h(
        'ul',
        { class: classString, style },
        [...Array(Math.max(0, rows || 0))].map((_e, i) => h('li', { key: i }))
      );
    };
  },
});
(SkeletonParagraph as any).elementType = 'Skeleton.Paragraph';
