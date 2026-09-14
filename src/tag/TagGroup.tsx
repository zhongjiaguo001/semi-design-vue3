import { defineComponent, h, Fragment } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import classNames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/tag/constants';
import '@douyinfe/semi-foundation/lib/es/tag/tag.css';
import Tag from './Tag';
import Popover from '../popover/Popover';
import { normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;
const tagSize = strings.TAG_SIZE;

export interface TagGroupItem {
  tagKey?: string | number;
  children?: VNodeChild | (() => VNodeChild);
  size?: string;
  color?: string;
  type?: string;
  shape?: string;
  closable?: boolean;
  visible?: boolean;
  avatarSrc?: string;
  avatarShape?: 'circle' | 'square';
  prefixIcon?: any;
  suffixIcon?: any;
  colorful?: boolean;
  gradient?: boolean;
  style?: any;
  class?: any;
  className?: any;
  onClose?: (tagChildren: any, e: Event, tagKey: string | number) => void;
  onClick?: (e: MouseEvent) => void;
  [key: string]: any;
}

export const tagGroupProps = {
  maxTagCount: { type: Number, default: undefined },
  restCount: { type: Number, default: undefined },
  tagList: { type: Array as PropType<TagGroupItem[] | any[]>, default: () => [] },
  size: { type: String as PropType<'small' | 'large' | 'default'>, default: tagSize[0] },
  showPopover: { type: Boolean, default: false },
  popoverProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  avatarShape: { type: String as PropType<'circle' | 'square'>, default: 'square' },
  mode: { type: String, default: undefined },
};

const TagGroup = defineComponent({
  name: 'TagGroup',
  inheritAttrs: false,
  props: tagGroupProps,
  emits: ['tagClose', 'plusNMouseEnter'],
  setup(props, { attrs, emit, slots }) {
    const renderNTag = (n: number, restTags: VNodeChild[]) => {
      const { size, showPopover, popoverProps } = props;
      const plusTag: VNodeChild = h(
        Tag,
        {
          closable: false,
          size,
          color: 'grey',
          style: { backgroundColor: 'transparent' },
          key: '_+n',
          onMouseenter: () => emit('plusNMouseEnter'),
        },
        { default: () => `+${n}` }
      );
      if (showPopover) {
        return h(
          Popover,
          {
            showArrow: true,
            content: () => h(Fragment, restTags),
            trigger: 'hover',
            position: 'top',
            autoAdjustOverflow: true,
            className: `${prefixCls}-rest-group-popover`,
            ...popoverProps,
            key: '_+n_Popover',
          },
          { default: () => plusTag }
        );
      }
      return plusTag;
    };

    const renderMergeTags = (tags: VNodeChild[]) => {
      const { maxTagCount, tagList, restCount } = props;
      const n = restCount ? restCount : tagList.length - (maxTagCount as number);
      let renderTags = tags;
      const normalTags = tags.slice(0, maxTagCount);
      const restTags = tags.slice(maxTagCount);
      if (n > 0) {
        normalTags.push(renderNTag(n, restTags));
        renderTags = normalTags;
      }
      return renderTags;
    };

    const renderAllTags = (): VNodeChild[] => {
      const { tagList, size, mode, avatarShape } = props;
      return tagList.map((tag: any) => {
        if (mode === 'custom') return normalizeNode(tag);
        const { children, className, class: cls, onClose, tagKey: rawKey, ...rest } = tag || {};
        let tagKey = rawKey;
        if (tagKey === undefined || tagKey === null || tagKey === '') {
          tagKey = typeof children === 'string' || typeof children === 'number' ? children : Math.random();
        }
        const tagProps: Record<string, any> = {
          ...rest,
          tagKey,
          key: tagKey,
          class: classNames(className, cls),
          onClose: (tagChildren: any, e: Event, key: string | number) => {
            onClose?.(tagChildren, e, key);
            emit('tagClose', tagChildren, e, key);
          },
        };
        if (!tagProps.size) tagProps.size = size;
        if (!tagProps.avatarShape) tagProps.avatarShape = avatarShape;
        return h(Tag, tagProps, { default: () => (typeof children === 'function' ? children() : normalizeNode(children)) });
      });
    };

    return () => {
      const { maxTagCount, size } = props;
      const { class: className, ...rest } = attrs as any;
      const groupCls = classNames(
        {
          [`${prefixCls}-group`]: true,
          [`${prefixCls}-group-max`]: maxTagCount,
          [`${prefixCls}-group-small`]: size === 'small',
          [`${prefixCls}-group-large`]: size === 'large',
        },
        className
      );
      const tags = props.tagList.length ? renderAllTags() : slots.default ? slots.default() : [];
      const tagContents = typeof maxTagCount === 'undefined' ? tags : renderMergeTags(tags);
      return h('div', { ...rest, class: groupCls }, tagContents);
    };
  },
});

export default TagGroup;
