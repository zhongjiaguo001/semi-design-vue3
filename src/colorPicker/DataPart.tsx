import { defineComponent, h, watch, onMounted } from 'vue';
import type { PropType } from 'vue';
import _isEqual from 'lodash/isEqual';
import ColorPickerFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/colorPicker/constants';
import DataPartFoundation from '@douyinfe/semi-foundation/lib/es/colorPicker/DataPartFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import Input from '../input/Input';
import InputGroup from '../input/InputGroup';
import InputNumber from '../inputNumber/InputNumber';
import Button from '../button/Button';
import Select from '../select/Select';
import { IconEyedropper } from '../icons/generated';
import type { ColorValue, ColorFormat } from './interface';

export const dataPartProps = {
  currentColor: { type: Object as PropType<ColorValue>, required: true as const },
  foundation: { type: Object as PropType<any>, required: true as const },
  eyeDropper: { type: Boolean, default: true },
  alpha: { type: Boolean, default: false },
  width: { type: Number, default: 280 },
  defaultFormat: { type: String as PropType<ColorFormat>, default: 'hex' },
};

const formats: ColorFormat[] = ['hex', 'rgba', 'hsva'];

const DataPart = defineComponent({
  name: 'ColorPickerDataPart',
  props: dataPartProps,
  setup(props, { expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent<any, { format: ColorFormat; inputValue: string }>(props as any, {
      format: props.defaultFormat,
      inputValue: '',
    });
    const adapter = {
      ...baseAdapter,
      getColorPickerFoundation: () => props.foundation,
    };
    const foundation = new (DataPartFoundation as any)(adapter);
    const handleChange = (newColor: any) => props.foundation.handleChange(newColor, state.format);

    onMounted(() => foundation.handleInputValueChange(foundation.getInputValue()));
    watch(
      () => [props.currentColor, state.format] as const,
      ([color, format], [prevColor, prevFormat]) => {
        if (!_isEqual(prevColor, color) || prevFormat !== format) {
          foundation.handleInputValueChange(foundation.getInputValue());
        }
      },
      { deep: true }
    );

    expose({ foundation, state });

    return () => {
      const rgba = props.currentColor.rgba;
      return h('div', { class: `${cssClasses.PREFIX}-dataPart`, style: { width: `${props.width}px` } }, [
        h('div', { class: `${cssClasses.PREFIX}-colorDemoBlock`, style: { minWidth: '20px', minHeight: '20px', backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})` } }),
        h(
          InputGroup,
          { size: 'small', class: `${cssClasses.PREFIX}-inputGroup` },
          {
            default: () => [
              h(Input, {
                class: `${cssClasses.PREFIX}-colorPickerInput`,
                value: state.inputValue,
                onChange: (v: string) => {
                  const value = foundation.getValueByInputValue(v);
                  if (value) {
                    handleChange(value);
                  }
                  foundation.handleInputValueChange(v);
                },
              }),
              props.alpha
                ? h(InputNumber, {
                    min: 0,
                    max: 100,
                    class: `${cssClasses.PREFIX}-colorPickerInputNumber`,
                    value: Number(Math.round(props.currentColor.rgba.a * 100)),
                    onNumberChange: (v: number) => {
                      const a = Number((v / 100).toFixed(2));
                      if (state.format === 'rgba') {
                        handleChange({ ...props.currentColor.rgba, a });
                      } else if (state.format === 'hex') {
                        handleChange((ColorPickerFoundation as any).rgbaToHex({ ...props.currentColor.rgba, a }));
                      } else if (state.format === 'hsva') {
                        handleChange({ ...props.currentColor.hsva, a });
                      }
                    },
                    suffix: h('span', { class: `${cssClasses.PREFIX}-inputNumberSuffix` }, '%'),
                    hideButtons: true,
                  })
                : null,
              h(Select, {
                class: `${cssClasses.PREFIX}-formatSelect`,
                size: 'small',
                value: state.format,
                motion: false,
                onSelect: (v: any) => foundation.handleFormatChange(v),
                optionList: formats.map((type) => ({ label: type, value: type })),
              }),
            ],
          }
        ),
        props.eyeDropper
          ? h(Button, { type: 'tertiary', theme: 'light', size: 'small', class: `${cssClasses.PREFIX}-eyeDropper`, onClick: () => foundation.handlePickValueWithStraw(), icon: h(IconEyedropper) })
          : null,
      ]);
    };
  },
});

export default DataPart;
