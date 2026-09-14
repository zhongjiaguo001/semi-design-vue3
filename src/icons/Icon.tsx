import { defineComponent, h, computed, isVNode, cloneVNode } from 'vue';
import type { PropType, CSSProperties, VNode, Component } from 'vue';
import cls from 'classnames';
import { BASE_CLASS_PREFIX } from '@douyinfe/semi-foundation/lib/es/base/constants';
import '@douyinfe/semi-icons/lib/es/styles/icons.css';

export type IconSize = 'inherit' | 'extra-small' | 'small' | 'default' | 'large' | 'extra-large';

/**
 * Static svg definition produced by scripts/gen-icons.mjs.
 * `inner` may contain the placeholders `__fill1__` .. `__fill4__` (two-color / multi-color AI icons)
 * and `__id__` (gradient id), which are substituted at render time.
 */
export interface SvgDefinition {
  viewBox: string;
  fill: string;
  inner: string;
}

export type IconSvg = SvgDefinition | VNode | Component | (() => VNode);

export const iconProps = {
  svg: { type: [Object, Function] as PropType<IconSvg>, default: undefined },
  size: { type: String as PropType<IconSize>, default: 'default' },
  spin: { type: Boolean, default: false },
  rotate: { type: Number, default: undefined },
  prefixCls: { type: String, default: BASE_CLASS_PREFIX },
  type: { type: String, default: undefined },
  /** fill color(s) of two-color / multi-color (AI) icons; string or string[] */
  fill: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
};

/** same as @douyinfe/semi-icons utils.getUuidShort */
export function getUuidShort(options: { prefix?: string; length?: number } = {}) {
  const { prefix = '', length = 7 } = options;
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ';
  let randomId = '';
  for (let i = 0; i < length; i++) {
    randomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return prefix ? `${prefix}-${randomId}` : randomId;
}

/** same as @douyinfe/semi-icons utils.getFillColor */
export function getFillColor(fill: string | string[] | undefined, num: number): string[] {
  if (typeof fill === 'string') {
    return new Array(num).fill(fill);
  } else if (Array.isArray(fill) && fill.length > 0) {
    const fillLength = fill.length;
    let result = fill;
    if (fillLength < num) {
      result = [];
      let i = 0;
      while (i < num) {
        result.push(fill[i % fillLength]);
        i++;
      }
      return result;
    } else if (fillLength > num) {
      result = fill.slice(0, num);
    }
    if (num === 4) {
      return [...result].reverse();
    }
    return result;
  }
  if (num === 2) {
    return ['rgba(166,71,255)', 'currentColor'];
  }
  return ['rgba(233,69,255)', 'rgba(166,71,255)', 'rgba(107,97,255)', 'rgba(46,140,255)'];
}

function isSvgDefinition(svg: any): svg is SvgDefinition {
  return !!svg && typeof svg === 'object' && !isVNode(svg) && typeof svg.inner === 'string';
}

function renderSvg(svg: IconSvg | undefined, fill: string | string[] | undefined, id: string) {
  if (!svg) return null;
  if (isSvgDefinition(svg)) {
    let inner = svg.inner;
    const attrs: Record<string, any> = {
      viewBox: svg.viewBox,
      fill: svg.fill,
      xmlns: 'http://www.w3.org/2000/svg',
      width: '1em',
      height: '1em',
      focusable: 'false',
      'aria-hidden': 'true',
    };
    if (inner.includes('__fill1__')) {
      const num = inner.includes('__fill3__') ? 4 : 2;
      const colors = getFillColor(fill, num);
      inner = inner.replace(/__fill([1-4])__/g, (_m, n) => colors[Number(n) - 1]);
      inner = inner.replace(/__id__/g, id);
    } else if (fill) {
      // single-color icon: React clones the svg element with a `fill` attribute
      attrs.fill = Array.isArray(fill) ? fill.join(',') : fill;
    }
    return h('svg', { ...attrs, innerHTML: inner });
  }
  let node: any = typeof svg === 'function' ? (svg as () => VNode)() : svg;
  if (!isVNode(node)) node = h(node as Component);
  // always clone: a VNode passed through props may be rendered by several instances / re-renders
  return fill ? cloneVNode(node, { fill }, true) : cloneVNode(node);
}

const Icon = defineComponent({
  name: 'Icon',
  inheritAttrs: false,
  props: iconProps,
  setup(props, { attrs, slots }) {
    const gradientId = getUuidShort({ prefix: `${props.prefixCls}-${(props.type || 'icon').replace(/_/g, '-')}` });
    const classes = computed(() =>
      cls(
        `${props.prefixCls}-icon`,
        {
          [`${props.prefixCls}-icon-extra-small`]: props.size === 'extra-small',
          [`${props.prefixCls}-icon-small`]: props.size === 'small',
          [`${props.prefixCls}-icon-default`]: props.size === 'default',
          [`${props.prefixCls}-icon-large`]: props.size === 'large',
          [`${props.prefixCls}-icon-extra-large`]: props.size === 'extra-large',
          [`${props.prefixCls}-icon-spinning`]: props.spin === true,
          [`${props.prefixCls}-icon-${props.type}`]: Boolean(props.type),
        },
        props.className,
        attrs.class as any
      )
    );
    return () => {
      const outerStyle: CSSProperties = {};
      if (Number.isSafeInteger(props.rotate)) {
        outerStyle.transform = `rotate(${props.rotate}deg)`;
      }
      Object.assign(outerStyle, props.style, attrs.style as any);
      const { class: _c, style: _s, ...rest } = attrs;
      const children = slots.default ? slots.default() : renderSvg(props.svg, props.fill, gradientId);
      return h(
        'span',
        {
          role: 'img',
          'aria-label': props.type,
          ...rest,
          class: classes.value,
          style: outerStyle,
        },
        children
      );
    };
  },
});
// used by semi components to detect built-in icons
(Icon as any).elementType = 'Icon';

/**
 * Create an icon component from an svg definition (same idea as semi-icons' convertIcon)
 */
export function convertIcon(svg: IconSvg, iconType: string, name?: string) {
  const { svg: _svg, type: _type, ...restProps } = iconProps;
  const comp = defineComponent({
    name: name || `Icon${iconType}`,
    inheritAttrs: false,
    props: restProps,
    setup(props, { attrs }) {
      return () => h(Icon, { ...attrs, ...props, svg, type: iconType });
    },
  });
  (comp as any).elementType = 'Icon';
  return comp;
}

export default Icon;
