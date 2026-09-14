import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, cloneVNode, getCurrentInstance } from 'vue';
import type { PropType, CSSProperties, VNode } from 'vue';
import cls from 'classnames';
import _isNumber from 'lodash/isNumber';
import _isFunction from 'lodash/isFunction';
import AvatarFoundation from '@douyinfe/semi-foundation/lib/es/avatar/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/avatar/constants';
import { handlePrevent } from '@douyinfe/semi-foundation/lib/es/utils/a11y';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/avatar/avatar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type AvatarShape = (typeof strings.SHAPE)[number];
export type AvatarSize = (typeof strings.SIZE)[number] | string;
export type AvatarColor = (typeof strings.COLOR)[number];

export interface BottomSlot {
  render?: () => any;
  shape?: 'circle' | 'square';
  text?: any;
  bgColor?: string;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
}
export interface TopSlot {
  render?: () => any;
  gradientStart?: string;
  gradientEnd?: string;
  text?: any;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
}

const TopSlotSvg = defineComponent({
  name: 'AvatarTopSlotSvg',
  props: { gradientStart: String, gradientEnd: String },
  setup(props) {
    const id = getUuidShort();
    return () =>
      h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '51', height: '52', viewBox: '0 0 51 52', fill: 'none' }, [
        h('g', { filter: 'url(#filter0_d_6_2)' }, [
          h('path', {
            d: 'M40.4918 46.5592C44.6795 43.176 46.261 34.1333 47.5301 25.6141C49.5854 11.8168 39.6662 1 25.8097 1C11.2857 1 3 11.4279 3 25.3518C3 33.7866 6.29361 43.8947 10.4602 46.5592C12.5868 47.9192 12.5868 47.9051 25.8097 47.9192C38.3651 47.9282 38.5352 48.14 40.4918 46.5592Z',
            fill: `url(#${id})`,
          }),
        ]),
        h('defs', null, [
          h('filter', { id: 'filter0_d_6_2', x: '0.789215', y: '0.447304', width: '49.2216', height: '51.3549', filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, [
            h('feFlood', { 'flood-opacity': '0', result: 'BackgroundImageFix' }),
            h('feColorMatrix', { in: 'SourceAlpha', type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0', result: 'hardAlpha' }),
            h('feOffset', { dy: '1.65809' }),
            h('feGaussianBlur', { stdDeviation: '1.10539' }),
            h('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0' }),
            h('feBlend', { mode: 'normal', in2: 'BackgroundImageFix', result: 'effect1_dropShadow_6_2' }),
            h('feBlend', { mode: 'normal', in: 'SourceGraphic', in2: 'effect1_dropShadow_6_2', result: 'shape' }),
          ]),
          h('linearGradient', { id, x1: '17.671', y1: '31.7392', x2: '17.671', y2: '47.9333', gradientUnits: 'userSpaceOnUse' }, [
            h('stop', { 'stop-color': props.gradientStart }),
            h('stop', { offset: '1', 'stop-color': props.gradientEnd }),
          ]),
        ]),
      ]);
  },
});

export const avatarProps = {
  shape: { type: String as PropType<AvatarShape>, default: 'circle' },
  size: { type: String as PropType<AvatarSize>, default: 'medium' },
  color: { type: String as PropType<AvatarColor>, default: 'grey' },
  src: { type: String, default: undefined },
  srcSet: { type: String, default: undefined },
  alt: { type: String, default: undefined },
  hoverMask: { type: [String, Object, Function] as PropType<any>, default: undefined },
  imgAttr: { type: Object as PropType<Record<string, any>>, default: undefined },
  gap: { type: Number, default: 3 },
  bottomSlot: { type: Object as PropType<BottomSlot>, default: undefined },
  topSlot: { type: Object as PropType<TopSlot>, default: undefined },
  border: { type: [Boolean, Object] as PropType<boolean | { color?: string; motion?: boolean }>, default: undefined },
  contentMotion: { type: Boolean, default: false },
};

const Avatar = defineComponent({
  name: 'Avatar',
  inheritAttrs: false,
  props: avatarProps,
  emits: ['click', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      isImgExist: true,
      hoverContent: '' as any,
      focusVisible: false,
      scale: 1,
    });
    const avatarRef = ref<HTMLElement | null>(null);
    const adapter = {
      ...baseAdapter,
      notifyImgState: (isImgExist: boolean) => {
        state.isImgExist = isImgExist;
      },
      notifyEnter: (e: any) => {
        state.hoverContent = slots.hoverMask ? slots.hoverMask() : props.hoverMask;
        emit('mouseenter', e);
      },
      notifyLeave: (e: any) => {
        state.hoverContent = '';
        emit('mouseleave', e);
      },
      setFocusVisible: (focusVisible: boolean) => {
        state.focusVisible = focusVisible;
      },
      setScale: (scale: number) => {
        state.scale = scale;
      },
      getAvatarNode: () => avatarRef.value,
    };
    const foundation = new (AvatarFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => props.src,
      (src) => {
        if (!src) return;
        const image = new Image(0, 0);
        image.src = src;
        image.onload = () => {
          state.isImgExist = true;
        };
        image.onerror = () => {
          state.isImgExist = false;
        };
        image.onabort = () => {
          state.isImgExist = false;
        };
      }
    );

    const getStringChild = () => {
      const children = flattenChildren(slots.default?.());
      if (children.length === 1 && typeof children[0].type === 'symbol' && typeof children[0].children === 'string') {
        return children[0].children as string;
      }
      return undefined;
    };
    let lastStringChild: string | undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          emit('click', event);
          handlePrevent(event);
          break;
        case 'Escape':
          (event.target as HTMLElement).blur();
          break;
        default:
          break;
      }
    };

    const instance = getCurrentInstance();
    const isClickable = () => Boolean(instance?.vnode.props && (instance.vnode.props as any).onClick);

    const getContent = () => {
      const { imgAttr, src, srcSet, alt } = props;
      const { isImgExist } = state;
      const children = slots.default?.();
      const stringChild = getStringChild();
      const clickable = isClickable();
      const isImg = src && isImgExist;
      const a11yFocusProps = {
        tabindex: 0,
        onKeydown: handleKeyDown,
        onFocus: (e: FocusEvent) => foundation.handleFocusVisible(e),
        onBlur: () => foundation.handleBlur(),
      };
      if (isImg) {
        const finalAlt = clickable ? `clickable Avatar: ${alt}` : alt;
        const imgBasicProps: Record<string, any> = {
          src,
          srcset: srcSet,
          onError: () => foundation.handleImgLoadError(),
          ...imgAttr,
          class: cls({ [`${prefixCls}-no-focus-visible`]: clickable }),
        };
        return h('img', { alt: finalAlt, ...imgBasicProps, ...(clickable ? a11yFocusProps : {}) });
      }
      if (stringChild !== undefined) {
        const tempAlt = alt ?? stringChild;
        const finalAlt = clickable ? `clickable Avatar: ${tempAlt}` : tempAlt;
        const p: Record<string, any> = {
          role: 'img',
          'aria-label': finalAlt,
          class: cls(`${prefixCls}-label`, { [`${prefixCls}-no-focus-visible`]: clickable }),
          ...(clickable ? a11yFocusProps : {}),
          'x-semi-prop': 'children',
        };
        return h('span', { class: `${prefixCls}-content`, style: { transform: `scale(${state.scale})` } }, [h('span', p, stringChild)]);
      }
      return children;
    };

    const renderBottomSlot = () => {
      const bs = props.bottomSlot;
      if (!bs) return null;
      if (bs.render) return bs.render();
      const style: CSSProperties = {};
      if (bs.bgColor) style.backgroundColor = bs.bgColor;
      if (bs.textColor) style.color = bs.textColor;
      return h('div', { class: cls([`${prefixCls}-bottom_slot`]), style: bs.style ?? {} }, [
        h('span', { style, class: cls(`${prefixCls}-bottom_slot-shape_${bs.shape}`, `${prefixCls}-bottom_slot-shape_${bs.shape}-${props.size}`, bs.className ?? '') }, [normalizeNode(bs.text)]),
      ]);
    };
    const renderTopSlot = () => {
      const ts = props.topSlot;
      if (!ts) return null;
      if (ts.render) return ts.render();
      const textStyle: CSSProperties = {};
      if (ts.textColor) textStyle.color = ts.textColor;
      return h('div', { style: ts.style ?? {}, class: cls([`${prefixCls}-top_slot-wrapper`, ts.className ?? '', { [`${prefixCls}-animated`]: props.contentMotion }]) }, [
        h('div', { class: cls([`${prefixCls}-top_slot-bg`, `${prefixCls}-top_slot-bg-${props.size}`]) }, [
          h('div', { class: cls([`${prefixCls}-top_slot-bg-svg`, `${prefixCls}-top_slot-bg-svg-${props.size}`]) }, [
            h(TopSlotSvg, { gradientStart: ts.gradientStart ?? 'var(--semi-color-primary)', gradientEnd: ts.gradientEnd ?? 'var(--semi-color-primary)' }),
          ]),
        ]),
        h('div', { class: cls([`${prefixCls}-top_slot`]) }, [h('div', { style: textStyle, class: cls([`${prefixCls}-top_slot-content`, `${prefixCls}-top_slot-content-${props.size}`]) }, [normalizeNode(ts.text)])]),
      ]);
    };

    return () => {
      const { shape, size, color, src, bottomSlot, topSlot, border, contentMotion } = props;
      const { isImgExist, hoverContent, focusVisible } = state;
      const stringChild = getStringChild();
      if (stringChild !== lastStringChild) {
        lastStringChild = stringChild;
        if (stringChild !== undefined && avatarRef.value) Promise.resolve().then(() => foundation.changeScale());
      }
      let customStyle: Record<string, any> = {};
      if (!strings.SIZE.includes(size as any)) {
        customStyle = { width: size, height: size };
      }
      const { class: className, style, ...others } = attrs as any;
      customStyle = { ...customStyle, ...(typeof style === 'object' ? style : {}) };
      const shouldWrap = bottomSlot || topSlot || border;
      const mouseEvent = {
        onClick: (e: MouseEvent) => emit('click', e),
        onMouseenter: (e: MouseEvent) => foundation.handleEnter(e),
        onMouseleave: (e: MouseEvent) => foundation.handleLeave(e),
      };
      const isImg = src && isImgExist;
      const avatarCls = cls(
        prefixCls,
        {
          [`${prefixCls}-${shape}`]: shape,
          [`${prefixCls}-${size}`]: size,
          [`${prefixCls}-${color}`]: color && !isImg,
          [`${prefixCls}-img`]: isImg,
          [`${prefixCls}-focus`]: focusVisible,
          [`${prefixCls}-animated`]: contentMotion,
        },
        className
      );
      const hoverRender = hoverContent ? h('div', { class: `${prefixCls}-hover`, 'x-semi-prop': 'hoverContent' }, [normalizeNode(hoverContent)]) : null;
      let avatar: VNode = h(
        'span',
        {
          ...others,
          style: shouldWrap ? {} : customStyle,
          class: avatarCls,
          ...(shouldWrap ? {} : mouseEvent),
          role: 'listitem',
          ref: avatarRef,
        },
        [getContent(), hoverRender]
      );
      if (border) {
        const borderStyle: CSSProperties = {};
        if (typeof border === 'object' && border.color) borderStyle.borderColor = border.color;
        avatar = h('div', { style: { position: 'relative', ...customStyle } }, [
          avatar,
          h('span', { style: borderStyle, class: cls([`${prefixCls}-additionalBorder`, `${prefixCls}-additionalBorder-${size}`, { [`${prefixCls}-${shape}`]: shape }]) }),
          typeof border === 'object' && border.motion
            ? h('span', { style: borderStyle, class: cls([`${prefixCls}-additionalBorder`, `${prefixCls}-additionalBorder-${size}`, { [`${prefixCls}-${shape}`]: shape, [`${prefixCls}-additionalBorder-animated`]: true }]) })
            : null,
        ]);
      }
      if (shouldWrap) {
        const slotSizes = ['extra-small', 'small', 'default', 'medium', 'large', 'extra-large'];
        return h('span', { class: cls([`${prefixCls}-wrapper`]), style: customStyle, ...mouseEvent }, [
          avatar,
          topSlot && slotSizes.includes(size) && shape === 'circle' ? renderTopSlot() : null,
          bottomSlot && slotSizes.includes(size) ? renderBottomSlot() : null,
        ]);
      }
      return avatar;
    };
  },
});
(Avatar as any).elementType = 'Avatar';

export const avatarGroupProps = {
  size: { type: String as PropType<AvatarSize>, default: 'medium' },
  shape: { type: String as PropType<AvatarShape>, default: 'circle' },
  overlapFrom: { type: String as PropType<'start' | 'end'>, default: 'start' },
  maxCount: { type: Number, default: undefined },
  renderMore: { type: Function as PropType<(restNumber: number, restAvatars: VNode[]) => any>, default: undefined },
};

export const AvatarGroup = defineComponent({
  name: 'AvatarGroup',
  props: avatarGroupProps,
  setup(props, { slots }) {
    const renderMoreAvatar = (restNumber: number, restAvatars: VNode[]) => {
      const moreCls = cls(`${prefixCls}-item-more`);
      const restAvatarAlt = restAvatars.reduce((pre, cur) => {
        const p: any = cur.props || {};
        const childText = (() => {
          const c = flattenChildren(typeof cur.children === 'object' && cur.children && (cur.children as any).default ? (cur.children as any).default() : []);
          return c.length === 1 && typeof c[0].type === 'symbol' ? (c[0].children as string) : '';
        })();
        const avatarInfo = p.alt ?? childText;
        if (!avatarInfo || avatarInfo.length === 0) return pre;
        return pre.length > 0 ? `${pre},${avatarInfo}` : avatarInfo;
      }, '');
      const finalAlt = ` Number of remaining Avatars：${restNumber},${restAvatarAlt}`;
      if (_isFunction(props.renderMore)) {
        return props.renderMore(restNumber, restAvatars);
      }
      return h(Avatar, { class: moreCls, key: '_+n', alt: finalAlt }, () => `+${restNumber}`);
    };
    return () => {
      const { maxCount, overlapFrom, size, shape } = props;
      const avatars = flattenChildren(slots.default?.());
      let renderAvatars: any[] = avatars;
      if (_isNumber(maxCount)) {
        const restNumber = avatars.length - maxCount;
        if (restNumber > 0) {
          const normal = avatars.slice(0, maxCount);
          normal.push(renderMoreAvatar(restNumber, avatars.slice(maxCount)) as any);
          renderAvatars = normal;
        }
      }
      const inner = renderAvatars.map((itm, index) => {
        if (typeof itm.type !== 'object') return itm;
        const className = cls((itm.props || {}).class, {
          [`${prefixCls}-item-start-${index}`]: overlapFrom === 'start',
          [`${prefixCls}-item-end-${index}`]: overlapFrom === 'end',
        });
        return cloneVNode(itm, { class: className, size, shape, key: index }, true);
      });
      return h('div', { class: cls({ [`${prefixCls}-group`]: true }), role: 'list' }, inner);
    };
  },
});

export default Avatar;
