import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import _get from 'lodash/get';
import cls from 'classnames';
import DateInputFoundation from '@douyinfe/semi-foundation/lib/es/datePicker/inputFoundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import { useBaseComponent } from '../_base/useBaseComponent';
import { normalizeNode } from '../_utils';
import Input from '../input/Input';
import { IconCalendar, IconCalendarClock, IconClear } from '../icons/generated';
import { InsetDateInput, InsetTimeInput } from './InsetInput';
import type { InsetInputValue } from './InsetInput';

const noop = () => undefined;

/** Resolve an Input component instance (or element) to its native <input> element */
export const resolveInputElement = (r: any): HTMLInputElement | null => {
  if (!r) return null;
  if (typeof r.getInputElement === 'function') return r.getInputElement();
  return r;
};

export type DateInputType = (typeof strings.TYPE_SET)[number];
export type RangeType = 'rangeStart' | 'rangeEnd';

export const dateInputProps = {
  borderless: { type: Boolean, default: false },
  value: { type: Array as PropType<Date[]>, default: undefined },
  inputValue: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  type: { type: String as PropType<DateInputType>, default: 'date' },
  showClear: { type: Boolean, default: true },
  showClearIgnoreDisabled: { type: Boolean, default: false },
  format: { type: String, default: undefined },
  inputStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  inputReadOnly: { type: Boolean, default: false },
  insetLabel: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  insetLabelId: { type: String, default: undefined },
  validateStatus: { type: String, default: undefined },
  prefix: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  dateFnsLocale: { type: Object as PropType<any>, default: undefined },
  placeholder: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  rangeInputFocus: { type: [String, Boolean] as PropType<RangeType | false>, default: undefined },
  rangeInputStartRef: { type: Object as PropType<{ value: any } | null>, default: undefined },
  rangeInputEndRef: { type: Object as PropType<{ value: any } | null>, default: undefined },
  inputRef: { type: Object as PropType<{ value: any } | null>, default: undefined },
  rangeSeparator: { type: String, default: strings.DEFAULT_SEPARATOR_RANGE },
  rangeSeparatorNode: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  insetInput: { type: [Boolean, Object] as PropType<boolean | { placeholder?: { dateStart?: string; dateEnd?: string; timeStart?: string; timeEnd?: string } }>, default: undefined },
  insetInputValue: { type: Object as PropType<InsetInputValue | null>, default: undefined },
  defaultPickerValue: { type: [String, Number, Date, Array] as PropType<any>, default: undefined },
  density: { type: String, default: undefined },
  multiple: { type: Boolean, default: undefined },
  autofocus: { type: Boolean, default: undefined },
  size: { type: String, default: undefined },
  block: { type: Boolean, default: undefined },
  clearIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  handleInsetDateFocus: { type: Function as PropType<(e: any, rangeType: RangeType) => void>, default: noop },
  handleInsetTimeFocus: { type: Function as PropType<(e: any) => void>, default: noop },
};

export const dateInputEmits = ['click', 'change', 'enterPress', 'blur', 'clear', 'focus', 'rangeClear', 'rangeBlur', 'rangeEndTabPress', 'insetInputChange'];

const DateInput = defineComponent({
  name: 'DateInput',
  inheritAttrs: false,
  props: dateInputProps,
  emits: dateInputEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { isFocusing: false });

    const adapter = {
      ...baseAdapter,
      updateIsFocusing: (isFocusing: boolean) => {
        state.isFocusing = isFocusing;
      },
      notifyClick: (...args: any[]) => emit('click', ...args),
      notifyChange: (...args: any[]) => emit('change', ...args),
      notifyEnter: (...args: any[]) => emit('enterPress', ...args),
      notifyBlur: (...args: any[]) => emit('blur', ...args),
      notifyClear: (...args: any[]) => emit('clear', ...args),
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyRangeInputClear: (...args: any[]) => emit('rangeClear', ...args),
      notifyRangeInputFocus: (...args: any[]) => emit('focus', ...args),
      notifyTabPress: (...args: any[]) => emit('rangeEndTabPress', ...args),
      notifyInsetInputChange: (options: any) => emit('insetInputChange', options),
    };
    const foundation = new (DateInputFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const handleChange = (value: string, e: any) => foundation.handleChange(value, e);
    const handleEnterPress = (e: any) => foundation.handleInputComplete(e);
    const handleInputClear = (e: any) => foundation.handleInputClear(e);
    const getRangeInputValue = (rangeStart: string, rangeEnd: string) => `${rangeStart}${props.rangeSeparator}${rangeEnd}`;
    const handleRangeInputChange = (rangeStart: string, rangeEnd: string, e: any) => foundation.handleChange(getRangeInputValue(rangeStart, rangeEnd), e);
    const handleRangeInputClear = (e: any) => foundation.handleRangeInputClear(e);
    const handleRangeInputEnterPress = (e: any, rangeStart: string, rangeEnd: string) => foundation.handleRangeInputEnterPress(e, getRangeInputValue(rangeStart, rangeEnd));
    const handleRangeInputEndKeyPress = (e: any) => foundation.handleRangeInputEndKeyPress(e);
    const handleRangeInputFocus = (e: any, rangeType: RangeType) => foundation.handleRangeInputFocus(e, rangeType);
    const handleRangeStartFocus = (e: any) => handleRangeInputFocus(e, 'rangeStart');
    const handleInsetInputChange = (options: any) => foundation.handleInsetInputChange(options);

    const formatText = (value: Date[]) => (value && value.length ? foundation.formatShowText(value) : '');

    const slotOrProp = (name: 'prefix' | 'insetLabel' | 'rangeSeparatorNode' | 'clearIcon') => (slots[name] ? slots[name]!() : normalizeNode((props as any)[name]));
    const hasNode = (name: 'prefix' | 'insetLabel' | 'rangeSeparatorNode' | 'clearIcon') => Boolean(slots[name]) || !isNullOrUndefined((props as any)[name]);

    // Vue calls function refs synchronously at patch time, before the inner <input> ref
    // object of Input is populated, so we store the Input component and let the consumer
    // resolve the DOM element lazily via `resolveInputElement`.
    const setInputRef = (r: any) => {
      if (props.inputRef) props.inputRef.value = r;
    };
    const setRangeStartRef = (r: any) => {
      if (props.rangeInputStartRef) props.rangeInputStartRef.value = r;
    };
    const setRangeEndRef = (r: any) => {
      if (props.rangeInputEndRef) props.rangeInputEndRef.value = r;
    };

    const renderRangePrefix = () => {
      const { prefixCls, disabled, rangeInputFocus } = props;
      const labelNode = hasNode('prefix') ? slotOrProp('prefix') : hasNode('insetLabel') ? slotOrProp('insetLabel') : null;
      return labelNode
        ? h('div', { class: `${prefixCls}-range-input-prefix`, onClick: (e: MouseEvent) => !disabled && !rangeInputFocus && handleRangeStartFocus(e), 'x-semi-prop': 'prefix,insetLabel' }, [labelNode])
        : null;
    };

    const renderRangeSeparator = (rangeStart: string, rangeEnd: string) => {
      const { disabled, rangeSeparator } = props;
      const separatorCls = cls({
        [`${cssClasses.PREFIX}-range-input-separator`]: true,
        [`${cssClasses.PREFIX}-range-input-separator-active`]: (rangeStart || rangeEnd) && !disabled,
      });
      return h('span', { onClick: (e: MouseEvent) => !disabled && handleRangeStartFocus(e), class: separatorCls }, [hasNode('rangeSeparatorNode') ? slotOrProp('rangeSeparatorNode') : rangeSeparator]);
    };

    const renderRangeClearBtn = (rangeStart: string, rangeEnd: string) => {
      const { showClear, prefixCls, disabled, showClearIgnoreDisabled } = props;
      const isRealDisabled = disabled && !showClearIgnoreDisabled;
      const allowClear = (rangeStart || rangeEnd) && showClear && !isRealDisabled;
      return allowClear
        ? h('div', { role: 'button', tabindex: 0, 'aria-label': 'Clear range input value', class: `${prefixCls}-range-input-clearbtn`, onMousedown: (e: MouseEvent) => handleRangeInputClear(e) }, [
            hasNode('clearIcon') ? slotOrProp('clearIcon') : h(IconClear, { 'aria-hidden': true }),
          ])
        : null;
    };

    const renderRangeSuffix = (suffix: any) => {
      const { prefixCls, disabled, rangeInputFocus } = props;
      return suffix ? h('div', { class: `${prefixCls}-range-input-suffix`, onClick: (e: MouseEvent) => !disabled && !rangeInputFocus && handleRangeStartFocus(e) }, [suffix]) : null;
    };

    const renderRangeInput = (rangeProps: any) => {
      const { placeholder, inputStyle, disabled, inputReadOnly, autofocus, size, text, suffix, inputCls, rangeInputFocus, prefixCls, rangeSeparator, borderless } = rangeProps;
      const [rangeStart, rangeEnd = ''] = (text as string).split(rangeSeparator) || [];
      const rangeSize = size === 'large' ? 'default' : 'small';
      const rangePlaceholder = Array.isArray(placeholder) ? placeholder : [placeholder, placeholder];
      const [rangeStartPlaceholder, rangeEndPlaceholder] = rangePlaceholder;
      const inputLeftWrapperCls = cls(`${prefixCls}-range-input-wrapper-start`, `${prefixCls}-range-input-wrapper`, {
        [`${prefixCls}-range-input-wrapper-active`]: rangeInputFocus === 'rangeStart' && !disabled,
        [`${prefixCls}-range-input-wrapper-start-with-prefix`]: hasNode('prefix') || hasNode('insetLabel'),
        [`${prefixCls}-borderless`]: borderless,
      });
      const inputRightWrapperCls = cls(`${prefixCls}-range-input-wrapper-end`, `${prefixCls}-range-input-wrapper`, {
        [`${prefixCls}-range-input-wrapper-active`]: rangeInputFocus === 'rangeEnd' && !disabled,
        [`${prefixCls}-borderless`]: borderless,
      });
      return [
        renderRangePrefix(),
        h('div', { onClick: (e: MouseEvent) => !disabled && handleRangeInputFocus(e, 'rangeStart'), class: `${inputCls} ${inputLeftWrapperCls}` }, [
          h(Input, {
            borderless,
            size: rangeSize,
            inputStyle,
            disabled,
            readonly: inputReadOnly,
            placeholder: rangeStartPlaceholder,
            value: rangeStart,
            onChange: (rangeStartValue: string, e: any) => handleRangeInputChange(rangeStartValue, rangeEnd, e),
            onEnterPress: (e: any) => handleRangeInputEnterPress(e, rangeStart, rangeEnd),
            onFocus: (e: any) => handleRangeInputFocus(e, 'rangeStart'),
            autoFocus: Boolean(autofocus),
            ref: setRangeStartRef,
          }),
        ]),
        renderRangeSeparator(rangeStart, rangeEnd),
        h('div', { class: `${inputCls} ${inputRightWrapperCls}`, onClick: (e: MouseEvent) => !disabled && handleRangeInputFocus(e, 'rangeEnd') }, [
          h(Input, {
            borderless,
            size: rangeSize,
            inputStyle,
            disabled,
            readonly: inputReadOnly,
            placeholder: rangeEndPlaceholder,
            value: rangeEnd,
            onChange: (rangeEndValue: string, e: any) => handleRangeInputChange(rangeStart, rangeEndValue, e),
            onEnterPress: (e: any) => handleRangeInputEnterPress(e, rangeStart, rangeEnd),
            onFocus: (e: any) => handleRangeInputFocus(e, 'rangeEnd'),
            onKeydown: handleRangeInputEndKeyPress,
            ref: setRangeEndRef,
          }),
        ]),
        renderRangeClearBtn(rangeStart, rangeEnd),
        renderRangeSuffix(suffix),
      ];
    };

    const isRenderMultipleInputs = () => {
      const { type } = props;
      return type.includes('Range') && type !== 'monthRange';
    };

    const renderInputInset = () => {
      const { type, handleInsetDateFocus, handleInsetTimeFocus, value, insetInputValue, prefixCls, density, insetInput } = props;
      const newInsetInputValue = foundation.getInsetInputValue({ value, insetInputValue });
      const { dateStart, dateEnd, timeStart, timeEnd } = _get(insetInput, 'placeholder', {}) as any;
      const { datePlaceholder, timePlaceholder } = foundation.getInsetInputPlaceholder();
      const insetInputWrapperCls = `${prefixCls}-inset-input-wrapper`;
      const separatorCls = `${prefixCls}-inset-input-separator`;
      return h('div', { class: insetInputWrapperCls, 'x-type': type }, [
        h(InsetDateInput, {
          forwardRef: setRangeStartRef,
          insetInputValue: newInsetInputValue,
          placeholder: dateStart ?? datePlaceholder,
          valuePath: 'monthLeft.dateInput',
          onChange: handleInsetInputChange,
          onFocus: (e: any) => handleInsetDateFocus(e, 'rangeStart'),
        }),
        h(InsetTimeInput, {
          disabled: !newInsetInputValue.monthLeft.dateInput,
          insetInputValue: newInsetInputValue,
          placeholder: timeStart ?? timePlaceholder,
          type,
          valuePath: 'monthLeft.timeInput',
          onChange: handleInsetInputChange,
          onFocus: handleInsetTimeFocus,
        }),
        isRenderMultipleInputs()
          ? [
              h('div', { class: separatorCls }, density === 'compact' ? null : '-'),
              h(InsetDateInput, {
                forwardRef: setRangeEndRef,
                insetInputValue: newInsetInputValue,
                placeholder: dateEnd ?? datePlaceholder,
                valuePath: 'monthRight.dateInput',
                onChange: handleInsetInputChange,
                onFocus: (e: any) => handleInsetDateFocus(e, 'rangeEnd'),
              }),
              h(InsetTimeInput, {
                disabled: !newInsetInputValue.monthRight.dateInput,
                insetInputValue: newInsetInputValue,
                placeholder: timeEnd ?? timePlaceholder,
                type,
                valuePath: 'monthRight.timeInput',
                onChange: handleInsetInputChange,
                onFocus: handleInsetTimeFocus,
              }),
            ]
          : null,
      ]);
    };

    const renderTriggerInput = () => {
      const { placeholder, type, value, inputValue, inputStyle, disabled, showClear, inputReadOnly, validateStatus, prefixCls, autofocus, size, rangeSeparator, showClearIgnoreDisabled, insetLabelId, borderless, clearIcon } = props;
      const dateIcon = h(IconCalendar, { 'aria-hidden': true });
      const dateTimeIcon = h(IconCalendarClock, { 'aria-hidden': true });
      const suffix = type.includes('Time') ? dateTimeIcon : dateIcon;
      let text = '';
      if (!isNullOrUndefined(inputValue)) {
        text = inputValue as string;
      } else if (value) {
        text = formatText(value);
      }
      const inputCls = cls({
        [`${prefixCls}-input-readonly`]: inputReadOnly,
        [`${prefixCls}-monthRange-input`]: type === 'monthRange',
      });
      const rangeProps = { ...props, text, suffix, inputCls };
      if (isRenderMultipleInputs()) return renderRangeInput(rangeProps);
      const { class: _c, style: _s, ...rest } = attrs as any;
      const prefixNode = hasNode('prefix') ? slotOrProp('prefix') : null;
      const insetLabelNode = hasNode('insetLabel') ? slotOrProp('insetLabel') : null;
      const inputSlots: Record<string, any> = { suffix: () => suffix };
      if (prefixNode) inputSlots.prefix = () => prefixNode;
      if (insetLabelNode) inputSlots.insetLabel = () => insetLabelNode;
      return h(
        Input,
        {
          ...rest,
          ref: setInputRef,
          disabled,
          showClearIgnoreDisabled,
          readonly: inputReadOnly,
          class: inputCls,
          inputStyle,
          hideSuffix: showClear,
          placeholder: type === 'monthRange' && Array.isArray(placeholder) ? placeholder[0] + rangeSeparator + placeholder[1] : (placeholder as string),
          onEnterPress: handleEnterPress,
          onChange: handleChange,
          onClear: handleInputClear,
          showClear,
          value: text,
          validateStatus,
          autoFocus: Boolean(autofocus),
          size,
          insetLabelId,
          borderless,
          clearIcon,
          onBlur: (e: any) => emit('blur', e),
          onFocus: (e: any) => emit('focus', e),
        },
        inputSlots
      );
    };

    expose({ foundation, formatText });

    return () => (props.insetInput ? renderInputInset() : renderTriggerInput());
  },
});

export default DateInput;
