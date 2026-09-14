import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/card/constants';
import { renderNode, hasSlotOrProp } from '../_utils';

const prefixcls = cssClasses.PREFIX;

export const metaProps = {
  avatar: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  description: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  title: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
};

const Meta = defineComponent({
  name: 'CardMeta',
  inheritAttrs: false,
  props: metaProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { class: className, style, ...others } = attrs as any;
      const metaCls = cls(`${prefixcls}-meta`, className);
      const hasAvatar = hasSlotOrProp(slots, 'avatar', props.avatar);
      const hasTitle = hasSlotOrProp(slots, 'title', props.title);
      const hasDescription = hasSlotOrProp(slots, 'description', props.description);
      const avatarNode = hasAvatar ? h('div', { class: `${prefixcls}-meta-avatar` }, renderNode(slots, 'avatar', props.avatar) as any) : null;
      const titleNode = hasTitle ? h('div', { class: `${prefixcls}-meta-wrapper-title` }, renderNode(slots, 'title', props.title) as any) : null;
      const descriptionNode = hasDescription
        ? h('div', { class: `${prefixcls}-meta-wrapper-description` }, renderNode(slots, 'description', props.description) as any)
        : null;
      const wrapper = hasTitle || hasDescription ? h('div', { class: `${prefixcls}-meta-wrapper` }, [titleNode, descriptionNode]) : null;
      return h('div', { ...others, class: metaCls, style }, [avatarNode, wrapper]);
    };
  },
});
(Meta as any).elementType = 'Card.Meta';

export default Meta;
