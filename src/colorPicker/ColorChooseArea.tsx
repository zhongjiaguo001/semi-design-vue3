import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { hsvaToHslString, hsvaToRgba } from '@douyinfe/semi-foundation/lib/es/colorPicker/utils/convert';
import { round } from '@douyinfe/semi-foundation/lib/es/colorPicker/utils/round';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/colorPicker/constants';
import ColorChooseAreaFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/ColorChooseAreaFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import type { HsvaColor } from './interface';

export const colorChooseAreaProps = {
  hsva: { type: Object as PropType<HsvaColor>, required: true as const },
  foundation: { type: Object as PropType<any>, required: true as const },
  onChange: { type: Function as PropType<(v: { s: number; v: number }) => void>, default: undefined },
  handleSize: { type: Number, default: 20 },
  width: { type: Number, default: 280 },
  height: { type: Number, default: 280 },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const ColorChooseArea = defineComponent({
  name: 'ColorChooseArea',
  inheritAttrs: false,
  props: colorChooseAreaProps,
  setup(props, { attrs, expose }) {
    const rootRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent<any, { handlePosition: { x: number; y: number }; isHandleGrabbing: boolean }>(props as any, {
      handlePosition: { x: 0, y: 0 },
      isHandleGrabbing: false,
    });
    let foundation: any;
    const adapter = {
      ...baseAdapter,
      getColorPickerFoundation: () => props.foundation,
      handleMouseDown: () => {
        state.isHandleGrabbing = true;
        rootRef.value?.addEventListener('mousemove', foundation.setHandlePositionByMousePosition);
        window.addEventListener('mouseup', foundation.handleMouseUp);
      },
      handleMouseUp: () => {
        rootRef.value?.removeEventListener('mousemove', foundation.setHandlePositionByMousePosition);
        window.removeEventListener('mouseup', foundation.handleMouseUp);
        state.isHandleGrabbing = false;
      },
      getDOM: () => rootRef.value,
      notifyChange: (newColor: { s: number; v: number }) => props.onChange && props.onChange(newColor),
    };
    foundation = new (ColorChooseAreaFoundation as any)(adapter);
    state.handlePosition = foundation.getHandlePositionByHSVA();

    watch(
      () => JSON.stringify(props.hsva),
      () => {
        state.handlePosition = foundation.getHandlePositionByHSVA();
      }
    );
    onBeforeUnmount(() => adapter.handleMouseUp());

    const handleClick = (e: MouseEvent) => {
      foundation.setHandlePositionByMousePosition(e);
      foundation.handleMouseDown(e);
    };
    expose({ foundation });

    return () => {
      const areaBgStyle = hsvaToHslString({ h: props.hsva.h, s: 100, v: 100, a: 1 });
      const currentColor = hsvaToRgba(props.hsva);
      return h(
        'div',
        {
          class: cls(`${cssClasses.PREFIX}-colorChooseArea`, props.className, attrs.class as any),
          style: [{ backgroundColor: areaBgStyle, width: `${props.width}px`, height: `${props.height}px`, cursor: state.isHandleGrabbing ? 'grabbing' : 'pointer' }, props.style, attrs.style as any],
          ref: rootRef,
          'aria-label': 'Color',
          onMousedown: handleClick,
          'aria-valuetext': `Saturation ${round(props.hsva.s)}%, Brightness ${round(props.hsva.v)}%`,
        },
        [
          h('div', {
            class: `${cssClasses.PREFIX}-handle`,
            style: {
              width: `${props.handleSize}px`,
              height: `${props.handleSize}px`,
              left: `${state.handlePosition.x}px`,
              top: `${state.handlePosition.y}px`,
              backgroundColor: `rgba(${currentColor.r},${currentColor.g},${currentColor.b},${currentColor.a})`,
            },
            onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
          }),
        ]
      );
    };
  },
});

export default ColorChooseArea;
