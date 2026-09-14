import { defineComponent, h, watch, onBeforeUnmount } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/progress/constants';
import { generateColor } from '@douyinfe/semi-foundation/lib/es/progress/generates';
import '@douyinfe/semi-foundation/lib/es/progress/progress.css';
import { Animation } from '@douyinfe/semi-animation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type ProgressType = (typeof strings.types)[number];
export type ProgressSize = (typeof strings.sizes)[number];
export type ProgressDirection = (typeof strings.directions)[number];
export type ProgressStrokeLinecap = (typeof strings.strokeLineCap)[number];
export interface StrokeItem {
  percent: number;
  color: string;
}
export type StrokeArr = StrokeItem[];

const defaultFormat = (text: number) => `${text}%`;

export const progressProps = {
  direction: { type: String as PropType<ProgressDirection>, default: strings.DEFAULT_DIRECTION },
  // (type list is not Function-only, so the default is a factory returning the formatter)
  // React: PropTypes.oneOfType([func, node]) -> a function receives the (animated) percent, any other value is rendered as-is
  format: { type: [Function, String, Number, Object] as PropType<((percent: number) => VNodeChild) | VNodeChild>, default: () => defaultFormat },
  id: { type: String, default: undefined },
  indeterminate: { type: Boolean, default: false },
  motion: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: true },
  orbitStroke: { type: String, default: undefined },
  percent: { type: Number, default: 0 },
  showInfo: { type: Boolean, default: false },
  size: { type: String as PropType<ProgressSize>, default: strings.DEFAULT_SIZE },
  stroke: { type: [String, Array] as PropType<string | StrokeArr>, default: strings.STROKE_DEFAULT },
  strokeGradient: { type: Boolean, default: false },
  strokeLinecap: { type: String as PropType<ProgressStrokeLinecap>, default: strings.DEFAULT_LINECAP },
  strokeWidth: { type: Number, default: 4 },
  type: { type: String as PropType<ProgressType>, default: strings.DEFAULT_TYPE },
  width: { type: Number, default: undefined },
  ariaLabel: { type: String, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaValuetext: { type: String, default: undefined },
};

const Progress = defineComponent({
  name: 'Progress',
  inheritAttrs: false,
  props: progressProps,
  setup(props, { slots, attrs }) {
    const { state } = useBaseComponent(props as any, { percentNumber: props.percent });
    let animation: any = null;
    let mounted = true;

    // componentDidUpdate: animate the displayed number
    watch(
      () => props.percent,
      (percent, prevPercent) => {
        if (isNaN(percent) || isNaN(prevPercent as number)) {
          throw new Error('[Semi Progress]:percent can not be NaN');
        }
        if (prevPercent === percent) return;
        if (!props.motion) {
          state.percentNumber = percent;
          return;
        }
        if (animation && animation.destroy) animation.destroy();
        animation = new (Animation as any)({ from: { value: prevPercent }, to: { value: percent } }, { easing: 'linear', duration: 300 });
        animation.on('frame', (p: any) => {
          if (!mounted) return;
          state.percentNumber = parseInt(p.value);
        });
        animation.on('rest', () => {
          if (!mounted) return;
          state.percentNumber = props.percent;
        });
        animation.start();
      }
    );
    onBeforeUnmount(() => {
      animation && animation.destroy();
      mounted = false;
    });

    const calcPercent = (percent: number) => {
      if (percent > 100) return 100;
      if (percent < 0) return 0;
      return percent;
    };

    const selectStroke = (stroke: string | StrokeArr, percent: number, strokeGradient: boolean) => {
      if (typeof stroke === 'string') return stroke;
      const color = generateColor(stroke.map((s) => ({ ...s })), percent, strokeGradient);
      if (typeof color !== 'undefined') return color as string;
      return null;
    };

    const formatText = (percNumber: number) => {
      if (slots.format) return slots.format({ percent: percNumber });
      const { format } = props;
      return typeof format === 'function' ? (format as (p: number) => VNodeChild)(percNumber) : normalizeNode(format);
    };

    const ariaAttrs = (rest: Record<string, any>) => ({
      'aria-labelledby': props.ariaLabelledby ?? rest['aria-labelledby'],
      'aria-label': props.ariaLabel ?? rest['aria-label'],
      'aria-valuetext': props.ariaValuetext ?? rest['aria-valuetext'],
    });

    const renderCircleProgress = () => {
      const { strokeLinecap, strokeWidth, size, stroke, strokeGradient, showInfo, percent, orbitStroke, id, indeterminate } = props;
      const { class: className, style, ...rest } = attrs as any;
      const { percentNumber } = state;
      const classNames = {
        wrapper: cls(`${prefixCls}-circle`, className),
        svg: cls(`${prefixCls}-circle-ring`),
        circle: cls(`${prefixCls}-circle-ring-inner`, { [`${prefixCls}-circle-ring-inner-indeterminate`]: indeterminate }),
        track: cls(`${prefixCls}-circle-ring-track`),
      };
      const perc = calcPercent(percent);
      const percNumber = calcPercent(percentNumber);
      let width: number;
      if (props.width) {
        width = props.width;
      } else {
        width = size === strings.DEFAULT_SIZE ? 72 : 24;
      }
      const _stroke = selectStroke(stroke, percent, strokeGradient);
      const cy = width / 2;
      const cx = width / 2;
      const radius = (width - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      // indeterminate: fixed arc length (30% of circumference) driven by CSS animation; percent is ignored
      const strokeDashoffset = indeterminate ? 0 : (1 - perc / 100) * circumference;
      const strokeDasharray = indeterminate ? `${circumference * 0.3} ${circumference}` : `${circumference} ${circumference}`;
      const trackStrokeDasharray = `${circumference} ${circumference}`;
      const text = formatText(percNumber);
      return h(
        'div',
        {
          id,
          class: classNames.wrapper,
          style,
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': indeterminate ? undefined : percNumber,
          ...ariaAttrs(rest),
          ...getDataAttr(rest),
        },
        [
          h('svg', { key: size, class: classNames.svg, height: width, width, 'aria-hidden': true }, [
            h('circle', {
              class: classNames.track,
              'stroke-dashoffset': 0,
              'stroke-width': strokeWidth,
              'stroke-dasharray': trackStrokeDasharray,
              'stroke-linecap': strokeLinecap,
              fill: 'transparent',
              style: { stroke: orbitStroke },
              r: radius,
              cx,
              cy,
              'aria-hidden': true,
            }),
            h('circle', {
              class: classNames.circle,
              'stroke-dashoffset': strokeDashoffset,
              'stroke-width': strokeWidth,
              'stroke-dasharray': strokeDasharray,
              'stroke-linecap': strokeLinecap,
              fill: 'transparent',
              style: { stroke: _stroke },
              r: radius,
              cx,
              cy,
              'aria-hidden': true,
            }),
          ]),
          showInfo && size !== 'small' && !indeterminate ? h('span', { class: `${prefixCls}-circle-text` }, [text]) : null,
        ]
      );
    };

    const renderLineProgress = () => {
      const { stroke, strokeGradient, direction, showInfo, size, percent, orbitStroke, id, indeterminate } = props;
      const { class: className, style, ...rest } = attrs as any;
      const { percentNumber } = state;
      const progressWrapperCls = cls(prefixCls, className, {
        [`${prefixCls}-horizontal`]: direction === strings.DEFAULT_DIRECTION,
        [`${prefixCls}-vertical`]: direction !== strings.DEFAULT_DIRECTION,
        [`${prefixCls}-large`]: size === 'large',
        [`${prefixCls}-indeterminate`]: indeterminate,
      });
      const progressTrackCls = cls({ [`${prefixCls}-track`]: true });
      const innerCls = cls(`${prefixCls}-track-inner`, { [`${prefixCls}-track-inner-indeterminate`]: indeterminate });
      const perc = calcPercent(percent);
      const percNumber = calcPercent(percentNumber);
      const _stroke = selectStroke(stroke, percent, strokeGradient);
      const innerStyle: Record<string, any> = { background: _stroke };
      // indeterminate: the sliding block is driven by CSS animation; percent is ignored
      if (!indeterminate) {
        if (direction === strings.DEFAULT_DIRECTION) {
          innerStyle.width = `${perc}%`;
        } else {
          innerStyle.height = `${perc}%`;
        }
      }
      const text = formatText(percNumber);
      return h(
        'div',
        {
          id,
          class: progressWrapperCls,
          style,
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': indeterminate ? undefined : perc,
          ...ariaAttrs(rest),
          ...getDataAttr(rest),
        },
        [
          h('div', { class: progressTrackCls, style: orbitStroke ? { backgroundColor: orbitStroke } : {}, 'aria-hidden': true }, [
            h('div', { class: innerCls, style: innerStyle, 'aria-hidden': true }),
          ]),
          showInfo && !indeterminate ? h('div', { class: `${prefixCls}-line-text` }, [text]) : null,
        ]
      );
    };

    return () => (props.type === 'line' ? renderLineProgress() : renderCircleProgress());
  },
});
(Progress as any).elementType = 'Progress';

export default Progress;
