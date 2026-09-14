import { defineComponent, h, watch } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import cls from 'classnames';
import ColorPickerFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/colorPicker/constants';
import '@douyinfe/semi-foundation/lib/es/colorPicker/colorPicker.css';
import { hexToHsva, hexToRgba, hsvaStringToHsva, hsvaToHex, hsvaToRgba, rgbaStringToHsva, rgbaStringToRgba, rgbaToHex, rgbStringToHsva, rgbStringToRgba, hsvaToHslaString, hsvaToRgbaString, hsvaToHsvaString } from '@douyinfe/semi-foundation/lib/es/colorPicker/utils/convert';
import { useBaseComponent } from '../_base/useBaseComponent';
import { normalizeNode } from '../_utils';
import Popover from '../popover/Popover';
import ColorChooseArea from './ColorChooseArea';
import AlphaSlider from './AlphaSlider';
import ColorSlider from './ColorSlider';
import DataPart from './DataPart';
import type { ColorValue, ColorFormat } from './interface';

export const defaultColorValue: ColorValue = {
  hsva: { h: 176, s: 71, v: 77, a: 1 },
  rgba: { r: 57, g: 197, b: 187, a: 1 },
  hex: '#39c5bb',
};

export const colorPickerProps = {
  value: { type: Object as PropType<ColorValue>, default: undefined },
  modelValue: { type: Object as PropType<ColorValue>, default: undefined },
  defaultValue: { type: Object as PropType<ColorValue>, default: () => defaultColorValue },
  alpha: { type: Boolean, default: false },
  eyeDropper: { type: Boolean, default: true },
  usePopover: { type: Boolean, default: false },
  popoverProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  width: { type: Number, default: undefined },
  height: { type: Number, default: undefined },
  defaultFormat: { type: String as PropType<ColorFormat>, default: 'hex' },
  topSlot: { type: [Object, Function, String] as PropType<any>, default: undefined },
  bottomSlot: { type: [Object, Function, String] as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
};

export const colorPickerEmits = ['change', 'update:value', 'update:modelValue'];

const ColorPicker = defineComponent({
  name: 'ColorPicker',
  inheritAttrs: false,
  props: colorPickerProps,
  emits: colorPickerEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, { currentColor: ColorValue }>(props as any, { currentColor: defaultColorValue }, { modelProp: 'value' });
    const getValueProp = (): ColorValue | undefined => ('value' in propsView ? (propsView as any).value : undefined);
    state.currentColor = getValueProp() ?? props.defaultValue;

    const adapter = {
      ...baseAdapter,
      notifyChange: (value: ColorValue) => {
        emit('update:value', value);
        emit('update:modelValue', value);
        emit('change', value);
      },
    };
    const foundation = new (ColorPickerFoundation as any)(adapter);
    // React reads `value` through props; alias the v-model prop so `getProp('value')` sees it
    foundation._adapter.getProp = (key: string) => (key === 'value' ? getValueProp() : (props as any)[key]);

    watch(
      () => [props.value, props.modelValue],
      () => {
        const v = getValueProp();
        if (v) state.currentColor = v;
      },
      { deep: true }
    );

    expose({ foundation, getCurrentColor: () => foundation.getCurrentColor() });

    const renderPicker = () => {
      const className = cls(`${cssClasses.PREFIX}`, props.className, attrs.class as any);
      const currentColor: ColorValue = foundation.getCurrentColor();
      const width = props.width ?? 280;
      const height = props.height ?? 280;
      const topSlot: VNodeChild = slots.topSlot ? slots.topSlot() : normalizeNode(props.topSlot);
      const bottomSlot: VNodeChild = slots.bottomSlot ? slots.bottomSlot() : normalizeNode(props.bottomSlot);
      return h('div', { class: className, style: attrs.style as any }, [
        topSlot,
        h(ColorChooseArea, {
          hsva: currentColor.hsva,
          foundation,
          onChange: ({ s, v }: { s: number; v: number }) => {
            foundation.handleChange({ s, v, a: currentColor.hsva.a, h: currentColor.hsva.h }, 'hsva');
          },
          handleSize: 20,
          width,
          height,
        }),
        h(ColorSlider, { width, height: 10, handleSize: 18, hue: currentColor.hsva.h, className: 'colorSliderWrapper', foundation }),
        props.alpha ? h(AlphaSlider, { width, height: 10, handleSize: 18, hsva: currentColor.hsva, className: 'alphaSliderWrapper', foundation }) : null,
        h(DataPart, { currentColor, eyeDropper: props.eyeDropper, alpha: props.alpha, width, foundation, defaultFormat: props.defaultFormat }),
        bottomSlot,
      ]);
    };

    return () => {
      const currentColor: ColorValue = foundation.getCurrentColor();
      if (props.usePopover) {
        const { className: popClassName, ...restPopoverProps } = props.popoverProps || {};
        return h(
          Popover,
          {
            ...restPopoverProps,
            className: cls(`${cssClasses.PREFIX}-popover`, popClassName),
            content: renderPicker,
          } as any,
          {
            default: () => (slots.default ? slots.default() : h('div', { style: { backgroundColor: currentColor.hex }, class: cls(`${cssClasses.PREFIX}-popover-defaultChildren`) })),
          }
        );
      }
      return renderPicker();
    };
  },
});
(ColorPicker as any).__SemiComponentName__ = 'ColorPicker';
(ColorPicker as any).elementType = 'ColorPicker';

export const colorStringToValue = (raw: string): ColorValue => {
  if (raw.startsWith('#')) {
    return { hsva: hexToHsva(raw), rgba: hexToRgba(raw), hex: raw };
  } else if (raw.startsWith('rgba')) {
    const rgba = rgbaStringToRgba(raw);
    return { hsva: rgbaStringToHsva(raw), rgba, hex: rgbaToHex(rgba) };
  } else if (raw.startsWith('rgb')) {
    const rgba = rgbStringToRgba(raw);
    return { hsva: rgbStringToHsva(raw), rgba, hex: rgbaToHex(rgba) };
  } else if (raw.startsWith('hsv')) {
    const hsva = hsvaStringToHsva(raw);
    return { hsva, rgba: hsvaToRgba(hsva), hex: hsvaToHex(hsva) };
  }
  throw new Error('Semi ColorPicker: error on static colorStringToValue method, input value is invalid: ' + raw);
};

/** Inverse of `colorStringToValue`: format a ColorValue as a css color string */
export const colorValueToString = (value: ColorValue, format: ColorFormat = 'hex'): string => {
  if (format === 'rgba') return hsvaToRgbaString(value.hsva);
  if (format === 'hsva') return hsvaToHsvaString(value.hsva);
  return value.hex;
};
export const colorValueToHslaString = (value: ColorValue) => hsvaToHslaString(value.hsva);

(ColorPicker as any).colorStringToValue = colorStringToValue;
(ColorPicker as any).colorValueToString = colorValueToString;

export default ColorPicker;
