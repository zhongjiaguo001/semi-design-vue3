import { defineComponent, h, ref } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/audioPlayer/constants';
import Tooltip from '../tooltip/Tooltip';
import { formatTime } from './utils';
import { toCssStyle } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const audioSliderProps = {
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  vertical: { type: Boolean, default: false },
  width: { type: [Number, String] as PropType<number | string>, default: '100%' },
  height: { type: [Number, String] as PropType<number | string>, default: 4 },
  showTooltip: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  theme: { type: String as PropType<'dark' | 'light'>, default: 'dark' },
};

export const audioSliderEmits = ['change'];

const AudioSlider = defineComponent({
  name: 'AudioSlider',
  inheritAttrs: false,
  props: audioSliderProps,
  emits: audioSliderEmits,
  setup(props, { emit }) {
    const sliderRef = ref<HTMLDivElement | null>(null);
    let isDragging = false;
    const isHovering = ref(false);
    const movingInfo = ref<{ progress: number; offset: number } | null>(null);

    const handleMouseEvent = (e: MouseEvent, shouldSetValue = true) => {
      if (!sliderRef.value || props.disabled) return;
      const rect = sliderRef.value.getBoundingClientRect();
      const offset = props.vertical ? rect.bottom - e.clientY : e.clientX - rect.left;
      const total = props.vertical ? rect.height : rect.width;
      const percentage = Math.min(Math.max(offset / total, 0), 1);
      const value = percentage * (props.max || 0);
      if (shouldSetValue && (isDragging || e.type === 'mousedown')) emit('change', value);
      movingInfo.value = {
        progress: percentage,
        offset: props.vertical ? offset - rect.height / 2 : offset - rect.width / 2,
      };
    };

    const sliderContent = () => {
      const { vertical, width, height, max, value: currentValue, theme } = props;
      return h(
        'div',
        {
          onMousedown: (e: MouseEvent) => {
            isDragging = true;
            handleMouseEvent(e, true);
          },
          onMouseup: () => {
            isDragging = false;
          },
          onMouseenter: (e: MouseEvent) => {
            isHovering.value = true;
            handleMouseEvent(e, false);
          },
          onMouseleave: () => {
            isHovering.value = false;
            isDragging = false;
          },
          onMousemove: (e: MouseEvent) => handleMouseEvent(e, true),
          class: cls(`${prefixCls}-slider-wrapper`, {
            [`${prefixCls}-slider-wrapper-vertical`]: vertical,
            [`${prefixCls}-slider-wrapper-horizontal`]: !vertical,
          }),
        },
        [
          h(
            'div',
            {
              ref: sliderRef,
              class: cls(`${prefixCls}-slider`, `${prefixCls}-slider-${theme}`, {
                [`${prefixCls}-slider-vertical`]: vertical,
                [`${prefixCls}-slider-horizontal`]: !vertical,
              }),
              style: toCssStyle({
                width: vertical ? (isHovering.value ? 8 : 4) : width,
                height: vertical ? height : isHovering.value ? 8 : 4,
              }) as CSSProperties,
            },
            [
              h('div', {
                class: cls(`${prefixCls}-slider-progress`, {
                  [`${prefixCls}-slider-progress-vertical`]: vertical,
                  [`${prefixCls}-slider-progress-horizontal`]: !vertical,
                }),
                style: {
                  height: vertical ? `${((currentValue || 0) / (max || 1)) * 100}%` : '100%',
                  width: vertical ? '100%' : `${((currentValue || 0) / (max || 1)) * 100}%`,
                },
              }),
              h('div', {
                class: cls(`${prefixCls}-slider-dot`),
                style: {
                  left: vertical ? '50%' : `calc(${((currentValue || 0) / (max || 1)) * 100}% - 8px)`,
                  bottom: vertical ? `calc(${((currentValue || 0) / (max || 1)) * 100}% - 8px)` : undefined,
                  top: vertical ? undefined : '50%',
                  transform: vertical ? 'translateX(-50%)' : 'translateY(-50%)',
                  opacity: isHovering.value ? 1 : 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none',
                },
              }),
            ]
          ),
        ]
      );
    };

    return () =>
      props.showTooltip
        ? h(
            Tooltip,
            {
              position: props.vertical ? 'right' : 'top',
              autoAdjustOverflow: true,
              content: formatTime((movingInfo.value?.progress || 0) * (props.max || 0)),
              style: toCssStyle({ [props.vertical ? 'top' : 'left']: movingInfo.value?.offset }),
            },
            () => sliderContent()
          )
        : sliderContent();
  },
});

export default AudioSlider;
