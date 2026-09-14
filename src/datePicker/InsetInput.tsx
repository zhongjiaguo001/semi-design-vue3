import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import _get from 'lodash/get';
import Input from '../input/Input';

export interface InsetInputValue {
  monthLeft: { dateInput: string; timeInput: string };
  monthRight: { dateInput: string; timeInput: string };
}

export interface InsetInputChangeFoundationProps {
  value: string;
  insetInputValue: InsetInputValue;
  event: any;
  valuePath: string;
}

export const insetDateInputProps = {
  insetInputValue: { type: Object as PropType<InsetInputValue>, default: undefined },
  valuePath: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  forwardRef: { type: Function as PropType<(el: any) => void>, default: undefined },
};

export const InsetDateInput = defineComponent({
  name: 'DatePickerInsetDateInput',
  inheritAttrs: false,
  props: insetDateInputProps,
  emits: ['change', 'focus'],
  setup(props, { emit }) {
    return () => {
      const { insetInputValue, valuePath, placeholder, forwardRef } = props;
      const value = _get(insetInputValue, valuePath as string);
      return h(Input, {
        value,
        onChange: (v: string, event: any) => emit('change', { value: v, event, insetInputValue, valuePath }),
        onFocus: (e: FocusEvent) => emit('focus', e),
        placeholder,
        ref: (r: any) => forwardRef && forwardRef(r),
      });
    };
  },
});

export const insetTimeInputProps = {
  ...insetDateInputProps,
  type: { type: String, default: 'date' },
  disabled: { type: Boolean, default: false },
};

export const InsetTimeInput = defineComponent({
  name: 'DatePickerInsetTimeInput',
  inheritAttrs: false,
  props: insetTimeInputProps,
  emits: ['change', 'focus'],
  setup(props, { emit }) {
    return () => {
      const { insetInputValue, valuePath, type, placeholder, disabled } = props;
      const _isTimeType = type.includes('Time');
      if (!_isTimeType) return null;
      const value = _get(insetInputValue, valuePath as string);
      return h(Input, {
        value,
        onChange: (v: string, event: any) => emit('change', { value: v, event, insetInputValue, valuePath }),
        onFocus: (e: FocusEvent) => emit('focus', e),
        placeholder,
        disabled,
      });
    };
  },
});
