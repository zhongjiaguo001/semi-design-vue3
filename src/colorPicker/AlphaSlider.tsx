import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { hsvaToHslaString, hsvaToRgbaString } from '@douyinfe/semi-foundation/lib/es/colorPicker/utils/convert';
import { round } from '@douyinfe/semi-foundation/lib/es/colorPicker/utils/round';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/colorPicker/constants';
import AlphaSliderFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/AlphaSliderFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import type { HsvaColor } from './interface';

export const alphaSliderProps = {
  hsva: { type: Object as PropType<HsvaColor>, required: true as const },
  foundation: { type: Object as PropType<any>, required: true as const },
  width: { type: Number, default: 280 },
  height: { type: Number, default: 10 },
  handleSize: { type: Number, default: 18 },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const AlphaSlider = defineComponent({
  name: 'AlphaSlider',
  inheritAttrs: false,
  props: alphaSliderProps,
  setup(props, { attrs, expose }) {
    const rootRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent<any, { handlePosition: number; isHandleGrabbing: boolean }>(props as any, {
      handlePosition: props.hsva.a * props.width - props.handleSize / 2,
      isHandleGrabbing: false,
    });
    let foundation: any;
    const adapter = {
      ...baseAdapter,
      handleMouseDown: () => {
        state.isHandleGrabbing = true;
        window.addEventListener('mousemove', foundation.setHandlePositionByMousePosition);
        window.addEventListener('mouseup', foundation.handleMouseUp);
      },
      handleMouseUp: () => {
        state.isHandleGrabbing = false;
        window.removeEventListener('mousemove', foundation.setHandlePositionByMousePosition);
        window.removeEventListener('mouseup', foundation.handleMouseUp);
      },
      getColorPickerFoundation: () => props.foundation,
      getDOM: () => rootRef.value,
    };
    foundation = new (AlphaSliderFoundation as any)(adapter);

    watch(
      () => props.hsva.a,
      () => {
        state.handlePosition = props.hsva.a * props.width - props.handleSize / 2;
      }
    );
    onBeforeUnmount(() => adapter.handleMouseUp());

    const handleClick = (e: MouseEvent) => {
      foundation.setHandlePositionByMousePosition(e);
      foundation.handleMouseDown(e);
    };
    expose({ foundation });

    return () => {
      const colorFrom = hsvaToHslaString({ ...props.hsva, a: 0 });
      const colorTo = hsvaToHslaString({ ...props.hsva, a: 1 });
      const alphaSliderBackground = `linear-gradient(90deg, ${colorFrom}, ${colorTo})`;
      return h(
        'div',
        {
          class: cls(`${cssClasses.PREFIX}-alphaSlider`, props.className, attrs.class as any),
          ref: rootRef,
          'aria-label': 'Alpha',
          'aria-valuetext': `${round(props.hsva.a * 100)}%`,
          onMousedown: handleClick,
          style: [{ width: `${props.width}px`, height: `${props.height}px` }, props.style, attrs.style as any],
        },
        [
          h('div', { class: `${cssClasses.PREFIX}-alphaSliderInner`, style: { background: alphaSliderBackground } }, [
            h('div', {
              class: `${cssClasses.PREFIX}-alphaHandle`,
              style: {
                width: `${props.handleSize}px`,
                height: `${props.handleSize}px`,
                left: `${state.handlePosition}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: hsvaToRgbaString(props.hsva),
              },
              onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
            }),
          ]),
        ]
      );
    };
  },
});

export default AlphaSlider;
