import { defineComponent, h, watch } from 'vue';
import type { PropType } from 'vue';
import classNames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/tag/constants';
import { handlePrevent } from '@douyinfe/semi-foundation/lib/es/utils/a11y';
import '@douyinfe/semi-foundation/lib/es/tag/tag.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, normalizeNode } from '../_utils';
import Avatar from '../avatar/Avatar';
import { IconClose } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;
const tagColors = strings.TAG_COLOR;
const tagSize = strings.TAG_SIZE;
const tagType = strings.TAG_TYPE;

export type TagColor = (typeof tagColors)[number];
export type TagSize = (typeof tagSize)[number];
export type TagType = (typeof tagType)[number];

export const tagProps = {
  size: { type: String as PropType<TagSize>, default: tagSize[0] },
  color: { type: String as PropType<TagColor>, default: tagColors[0] },
  type: { type: String as PropType<TagType>, default: tagType[0] },
  shape: { type: String as PropType<'circle' | 'square'>, default: 'square' },
  closable: { type: Boolean, default: false },
  visible: { type: Boolean, default: undefined },
  tagKey: { type: [String, Number], default: undefined },
  avatarSrc: { type: String, default: undefined },
  avatarShape: { type: String as PropType<'circle' | 'square'>, default: 'square' },
  prefixIcon: { type: [Object, Function] as PropType<any>, default: null },
  suffixIcon: { type: [Object, Function] as PropType<any>, default: null },
  colorful: { type: Boolean, default: false },
  gradient: { type: Boolean, default: false },
  tabIndex: { type: Number, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

const Tag = defineComponent({
  name: 'Tag',
  inheritAttrs: false,
  props: tagProps,
  emits: ['close', 'click', 'keydown'],
  setup(props, { slots, attrs, emit }) {
    const { state, propsView } = useBaseComponent(props as any, { visible: true });
    if ('visible' in propsView) state.visible = Boolean(props.visible);
    watch(
      () => props.visible,
      () => {
        if ('visible' in propsView) state.visible = Boolean(props.visible);
      }
    );
    const setVisible = (visible: boolean) => {
      if (!('visible' in propsView)) state.visible = visible;
    };

    const getChildrenText = () => {
      const children = flattenChildren(slots.default?.());
      if (children.length === 1 && typeof children[0].type === 'symbol' && typeof children[0].children === 'string') return children[0].children as string;
      return undefined;
    };

    const close = (e: Event, value: any, tagKey: any) => {
      e.stopPropagation();
      if (typeof (e as any).stopImmediatePropagation === 'function') (e as any).stopImmediatePropagation();
      emit('close', value, e, tagKey);
      if (e.defaultPrevented) return;
      setVisible(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const { closable } = props;
      switch (event.key) {
        case 'Backspace':
        case 'Delete':
          closable && close(event, getChildrenText() ?? slots.default?.(), props.tagKey);
          handlePrevent(event);
          break;
        case 'Enter':
          emit('click', event);
          (attrs as any).onClick?.(event);
          handlePrevent(event);
          break;
        case 'Escape':
          (event.target as HTMLElement).blur();
          break;
        default:
          break;
      }
      emit('keydown', event);
    };

    return () => {
      const { tagKey, size, color, closable, type, shape, avatarSrc, avatarShape, tabIndex, colorful, gradient } = props;
      const { visible: isVisible } = state;
      const { class: className, onClick, ...attr } = attrs as any;
      const clickable = Boolean(onClick) || closable;
      const children = slots.default?.();
      const stringChild = getChildrenText();
      const a11yProps = { role: 'button', tabindex: tabIndex || 0, onKeydown: handleKeyDown };
      const baseProps: Record<string, any> = {
        ...attr,
        onClick: (e: MouseEvent) => {
          onClick?.(e);
          emit('click', e);
        },
        tabindex: tabIndex,
        class: classNames(
          prefixCls,
          {
            [`${prefixCls}-default`]: size === 'default',
            [`${prefixCls}-small`]: size === 'small',
            [`${prefixCls}-large`]: size === 'large',
            [`${prefixCls}-square`]: shape === 'square',
            [`${prefixCls}-circle`]: shape === 'circle',
            [`${prefixCls}-${type}`]: type,
            [`${prefixCls}-${color}-${type}`]: color && type,
            [`${prefixCls}-closable`]: closable,
            [`${prefixCls}-invisible`]: !isVisible,
            [`${prefixCls}-avatar-${avatarShape}`]: avatarSrc,
            [`${prefixCls}-colorful`]: colorful,
            [`${prefixCls}-gradient`]: gradient,
          },
          className
        ),
      };
      const wrapProps = clickable ? { ...baseProps, ...a11yProps } : baseProps;
      const closeIcon = closable ? h('div', { class: `${prefixCls}-close`, onClick: (e: MouseEvent) => close(e, stringChild ?? children, tagKey) }, [h(IconClose, { size: 'small' })]) : null;
      const contentCls = classNames(`${prefixCls}-content`, `${prefixCls}-content-${stringChild !== undefined ? 'ellipsis' : 'center'}`);
      const prefixIcon = slots.prefixIcon ? slots.prefixIcon() : normalizeNode(props.prefixIcon);
      const suffixIcon = slots.suffixIcon ? slots.suffixIcon() : normalizeNode(props.suffixIcon);
      const ariaLabel = props.ariaLabel || (stringChild !== undefined ? `${closable ? 'Closable ' : ''}Tag: ${stringChild}` : '');
      return h('div', { 'aria-label': ariaLabel, ...wrapProps }, [
        prefixIcon ? h('div', { class: `${prefixCls}-prefix-icon` }, [prefixIcon]) : null,
        avatarSrc ? h(Avatar, { src: avatarSrc, shape: avatarShape }) : null,
        h('div', { class: contentCls }, children),
        suffixIcon ? h('div', { class: `${prefixCls}-suffix-icon` }, [suffixIcon]) : null,
        closeIcon,
      ]);
    };
  },
});
(Tag as any).elementType = 'Tag';

export default Tag;
