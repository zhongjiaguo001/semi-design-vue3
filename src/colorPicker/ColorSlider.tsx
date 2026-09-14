import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import ColorPickerFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/colorPicker/constants';
import ColorSliderFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/ColorSliderFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';

export const colorSliderProps = {
  hue: { type: Number, required: true as const },
  foundation: { type: Object as PropType<any>, required: true as const },
  width: { type: Number, default: 280 },
  height: { type: Number, default: 10 },
  handleSize: { type: Number, default: 18 },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const ColorSlider = defineComponent({
  name: 'ColorSlider',
  inheritAttrs: false,
  props: colorSliderProps,
  setup(props, { attrs, expose }) {
    const rootRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent<any, { handlePosition: number; isHandleGrabbing: boolean }>(props as any, {
      handlePosition: (props.hue / 360) * props.width - props.handleSize / 2,
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
    foundation = new (ColorSliderFoundation as any)(adapter);

    watch(
      () => props.hue,
      () => {
        state.handlePosition = (props.hue / 360) * props.width - props.handleSize / 2;
      }
    );
    onBeforeUnmount(() => adapter.handleMouseUp());

    const handleClick = (e: MouseEvent) => {
      foundation.setHandlePositionByMousePosition(e);
      foundation.handleMouseDown(e);
    };
    expose({ foundation });

    return () =>
      h(
        'div',
        {
          class: cls(`${cssClasses.PREFIX}-colorSlider`, props.className, attrs.class as any),
          ref: rootRef,
          onMousedown: handleClick,
          style: [{ width: `${props.width}px`, height: `${props.height}px` }, props.style, attrs.style as any],
        },
        [
          h('div', {
            class: `${cssClasses.PREFIX}-handle`,
            style: {
              width: `${props.handleSize}px`,
              height: `${props.handleSize}px`,
              left: `${state.handlePosition}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: (ColorPickerFoundation as any).hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 }),
            },
            onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
          }),
        ]
      );
  },
});

export default ColorSlider;
