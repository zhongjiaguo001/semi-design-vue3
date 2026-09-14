import { defineComponent, h, ref, watch, onBeforeUnmount, onUpdated, nextTick } from 'vue';
import type { PropType } from 'vue';
import classnames from 'classnames';
import _noop from 'lodash/noop';
import _isString from 'lodash/isString';
import _isNaN from 'lodash/isNaN';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import isBothNaN from '@douyinfe/semi-foundation/lib/es/utils/isBothNaN';
import InputNumberFoundation from '@douyinfe/semi-foundation/lib/es/inputNumber/foundation';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/inputNumber/constants';
import '@douyinfe/semi-foundation/lib/es/inputNumber/inputNumber.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { normalizeNode } from '../_utils';
import Input, { inputProps, inputEmits } from '../input/Input';
import type { InputSize } from '../input/Input';
import { IconChevronUp, IconChevronDown } from '../icons/generated';

export interface ScientificNotationConfig {
  /** Number of digits threshold to trigger scientific notation display */
  threshold?: number;
}

const { value: _v, modelValue: _mv, defaultValue: _dv, size: _s, suffix: _sf, ...restInputProps } = inputProps;

export const inputNumberProps = {
  ...restInputProps,
  value: { type: [Number, String] as PropType<number | string>, default: undefined },
  modelValue: { type: [Number, String] as PropType<number | string>, default: undefined },
  defaultValue: { type: [Number, String] as PropType<number | string>, default: undefined },
  autofocus: { type: Boolean, default: false },
  currency: { type: [String, Boolean] as PropType<string | boolean>, default: undefined },
  currencyDisplay: { type: String as PropType<'code' | 'symbol' | 'name'>, default: undefined },
  defaultCurrency: { type: String, default: undefined },
  formatter: { type: Function as PropType<(value: number | string) => string>, default: undefined },
  hideButtons: { type: Boolean, default: false },
  innerButtons: { type: Boolean, default: false },
  keepFocus: { type: Boolean, default: false },
  localeCode: { type: String, default: undefined },
  max: { type: Number, default: Infinity },
  min: { type: Number, default: -Infinity },
  minimumFractionDigits: { type: Number, default: undefined },
  maximumFractionDigits: { type: Number, default: undefined },
  parser: { type: Function as PropType<(value: string) => string>, default: undefined },
  precision: { type: Number, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  pressInterval: { type: Number, default: numbers.DEFAULT_PRESS_TIMEOUT },
  pressTimeout: { type: Number, default: numbers.DEFAULT_PRESS_TIMEOUT },
  shiftStep: { type: Number, default: numbers.DEFAULT_SHIFT_STEP },
  showCurrencySymbol: { type: Boolean, default: true },
  size: { type: String as PropType<InputSize>, default: strings.DEFAULT_SIZE },
  step: { type: Number, default: numbers.DEFAULT_STEP },
  suffix: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  scientificNotation: { type: [Boolean, Object] as PropType<boolean | ScientificNotationConfig>, default: undefined },
};

export const inputNumberEmits = [
  'update:modelValue',
  'update:value',
  'change',
  'numberChange',
  'blur',
  'focus',
  'upClick',
  'downClick',
  'keydown',
  // forwarded from Input
  'clear',
  'input',
  'keyup',
  'keypress',
  'enterPress',
  'compositionStart',
  'compositionEnd',
  'compositionUpdate',
];

const passThroughInputSlots = ['prefix', 'insetLabel', 'addonBefore', 'addonAfter', 'clearIcon'];

const InputNumber = defineComponent({
  name: 'InputNumber',
  inheritAttrs: false,
  props: inputNumberProps,
  emits: inputNumberEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { localeCode: ctxLocaleCode, currency: ctxCurrency } = useLocale('InputNumber');
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      value: '' as number | string,
      number: null as number | null,
      focusing: Boolean(props.autofocus || props.autoFocus) || false,
      hovering: false,
    }, { modelProp: 'value' });

    const inputRef = ref<any>(null);
    const getInputNode = (): HTMLInputElement | null => {
      const comp = inputRef.value;
      if (!comp) return null;
      if (typeof comp.getInputElement === 'function') return comp.getInputElement();
      return comp.inputRef?.value ?? null;
    };

    let clickUpOrDown = false;
    /**
     * React batches setState inside a handler, so `getStates().number` inside
     * foundation.notifyNumberChange is still the number *before* the handler ran.
     * Vue's setState is synchronous, so we keep a "committed" copy that is only
     * refreshed on the next tick and compare against it.
     */
    let committedNumber: number | null = null;
    let cursorStart: number | null = null;
    let cursorEnd: number | null = null;
    let currentValue: string | undefined;
    let cursorBefore: string | undefined;
    let cursorAfter: string | undefined;

    // props that React resolves through LocaleConsumer (props win over locale)
    const overrides: Record<string, () => any> = {
      localeCode: () => ('localeCode' in propsView ? props.localeCode : ctxLocaleCode.value),
      defaultCurrency: () => ('defaultCurrency' in propsView ? props.defaultCurrency : ctxCurrency.value),
    };
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (typeof key === 'string' && key in overrides) return overrides[key]();
        return Reflect.get(target, key);
      },
    });

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);

    const adapter = {
      ...baseAdapter,
      getProp: (key: string) => (key in overrides ? overrides[key]() : baseAdapter.getProp(key)),
      getProps: () => propsProxy,
      setValue: (value: any, cb?: () => void) => baseAdapter.setState({ value }, cb),
      setNumber: (number: number | null, cb?: () => void) => {
        baseAdapter.setState({ number }, cb);
        scheduleCommit();
      },
      setFocusing: (focusing: boolean, cb?: () => void) => baseAdapter.setState({ focusing }, cb),
      setHovering: (hovering: boolean) => baseAdapter.setState({ hovering }),
      notifyChange: (value: any, e?: any) => {
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value, e);
      },
      notifyNumberChange: (value: number, e?: any) => emit('numberChange', value, e),
      notifyBlur: (e: any) => emit('blur', e),
      notifyFocus: (e: any) => emit('focus', e),
      notifyUpClick: (value: string, e: any) => emit('upClick', value, e),
      notifyDownClick: (value: string, e: any) => emit('downClick', value, e),
      notifyKeyDown: (e: any) => emit('keydown', e),
      registerGlobalEvent: (eventName: string, handler: (...args: any[]) => void) => {
        if (eventName && typeof handler === 'function') {
          adapter.unregisterGlobalEvent(eventName);
          baseAdapter.setCache(eventName, handler);
          document.addEventListener(eventName, handler);
        }
      },
      unregisterGlobalEvent: (eventName: string) => {
        if (eventName) {
          const handler = baseAdapter.getCache(eventName);
          if (handler) document.removeEventListener(eventName, handler);
          baseAdapter.setCache(eventName, null);
        }
      },
      getInputCharacter: (index: number) => {
        const node = getInputNode();
        return node ? node.value[index] : undefined;
      },
      recordCursorPosition: () => {
        try {
          const node = getInputNode();
          if (node) {
            cursorStart = node.selectionStart;
            cursorEnd = node.selectionEnd;
            currentValue = node.value;
            cursorBefore = node.value.substring(0, cursorStart as number);
            cursorAfter = node.value.substring(cursorEnd as number);
          }
        } catch (e) {
          console.warn(e);
        }
      },
      restoreByAfter: (str?: string) => {
        if (isNullOrUndefined(str)) return false;
        const node = getInputNode();
        if (!node) return false;
        const fullStr = node.value;
        const index = fullStr.lastIndexOf(str as string);
        if (index === -1) return false;
        if (index + (str as string).length === fullStr.length) {
          adapter.fixCaret(index, index);
          return true;
        }
        return false;
      },
      restoreCursor: (str: string | undefined = cursorAfter) => {
        if (isNullOrUndefined(str)) return false;
        return Array.prototype.some.call(str, (_: any, start: number) => {
          const partStr = (str as string).substring(start);
          return adapter.restoreByAfter(partStr);
        });
      },
      fixCaret: (start: number, end: number) => {
        const node = getInputNode();
        if (start === undefined || end === undefined || !node || !node.value) return;
        try {
          const currentStart = node.selectionStart;
          const currentEnd = node.selectionEnd;
          if (start !== currentStart || end !== currentEnd) {
            node.setSelectionRange(start, end);
          }
        } catch (e) {
          /* ignore */
        }
      },
      setClickUpOrDown: (value: boolean) => {
        clickUpOrDown = value;
      },
      updateStates: (states: any, callback?: () => void) => {
        baseAdapter.setState(states, callback);
        if (states && 'number' in states) scheduleCommit();
      },
    };
    let commitScheduled = false;
    const scheduleCommit = () => {
      if (commitScheduled) return;
      commitScheduled = true;
      nextTick(() => {
        commitScheduled = false;
        committedNumber = state.number;
      });
    };

    const foundation = new (InputNumberFoundation as any)(adapter);
    foundation.notifyNumberChange = (value: number, e: any) => {
      if (foundation.isValidNumber(value) && value !== committedNumber) {
        adapter.notifyNumberChange(value, e);
      }
    };
    // React computes the initial (formatted) state in the constructor and re-formats in init();
    // running init() synchronously here yields the same first render.
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());

    // componentDidUpdate: controlled value changes
    watch(
      () => getValueProp(),
      (value, prevValue) => {
        const { preventScroll: _ps } = props;
        const { focusing } = state;
        let newValue: any;
        if (value !== prevValue && !isBothNaN(value, prevValue)) {
          if (isNullOrUndefined(value) || value === '') {
            newValue = '';
            foundation.updateStates({ value: newValue, number: null });
          } else {
            let valueStr: any = value;
            if (typeof value === 'number') {
              valueStr = foundation.doFormat(value);
            }
            const parsedNum = foundation.doParse(valueStr, false, true, true);
            const toNum = typeof value === 'number' ? value : foundation.doParse(valueStr, false, false, false);
            if (focusing) {
              if (foundation.isValidNumber(parsedNum) && parsedNum !== state.number) {
                const obj: any = { number: parsedNum };
                if (clickUpOrDown) {
                  obj.value = foundation.doFormat(obj.number, true);
                  newValue = obj.value;
                }
                foundation.updateStates(obj, () => adapter.restoreCursor());
              } else if (!_isNaN(toNum)) {
                newValue = foundation.doFormat(toNum, false);
                foundation.updateStates({ value: newValue });
              } else {
                foundation.updateStates({ value: valueStr });
              }
            } else if (foundation.isValidNumber(parsedNum)) {
              newValue = foundation.doFormat(parsedNum, true, true);
              foundation.updateStates({ number: parsedNum, value: newValue });
            } else {
              newValue = '';
              foundation.updateStates({ number: null, value: newValue });
            }
          }
          if (newValue && _isString(newValue) && newValue !== String(value)) {
            if (foundation._isCurrency()) {
              const parsedNewValue = foundation.doParse(newValue);
              const parsedPropValue = typeof value === 'string' ? foundation.doParse(value) : value;
              if (parsedNewValue !== parsedPropValue) {
                foundation.notifyChange(newValue, null);
              }
            } else {
              foundation.notifyChange(newValue, null);
            }
          }
        }
      }
    );

    onUpdated(() => {
      if (!clickUpOrDown) return;
      if (props.keepFocus && state.focusing) {
        const node = getInputNode();
        if (node && document.activeElement !== node) {
          node.focus({ preventScroll: props.preventScroll });
        }
      }
    });

    const handleInputFocus = (e: FocusEvent) => foundation.handleInputFocus(e);
    const handleInputChange = (value: string, event: any) => foundation.handleInputChange(value, event);
    const handleInputBlur = (e: FocusEvent) => foundation.handleInputBlur(e);
    const handleInputKeyDown = (e: KeyboardEvent) => foundation.handleInputKeyDown(e);
    const handleInputMouseEnter = (e: MouseEvent) => foundation.handleInputMouseEnter(e);
    const handleInputMouseLeave = (e: MouseEvent) => foundation.handleInputMouseLeave(e);
    const handleInputMouseMove = (e: MouseEvent) => foundation.handleInputMouseMove(e);
    const handleUpClick = (e: MouseEvent) => foundation.handleUpClick(e);
    const handleDownClick = (e: MouseEvent) => foundation.handleDownClick(e);
    const handleMouseUp = (e: MouseEvent) => foundation.handleMouseUp(e);
    const handleMouseLeave = (e: MouseEvent) => foundation.handleMouseLeave(e);

    const renderButtons = () => {
      const { prefixCls, disabled, innerButtons, max, min } = props;
      const { hovering, focusing, number } = state;
      const notAllowedUp = disabled ? disabled : number === max;
      const notAllowedDown = disabled ? disabled : number === min;
      const suffixChildrenCls = classnames(`${prefixCls}-number-suffix-btns`, {
        [`${prefixCls}-number-suffix-btns-inner`]: innerButtons,
        [`${prefixCls}-number-suffix-btns-inner-hover`]: innerButtons && hovering && !focusing,
      });
      const upClassName = classnames(`${prefixCls}-number-button`, `${prefixCls}-number-button-up`, {
        [`${prefixCls}-number-button-up-disabled`]: disabled,
        [`${prefixCls}-number-button-up-not-allowed`]: notAllowedUp,
      });
      const downClassName = classnames(`${prefixCls}-number-button`, `${prefixCls}-number-button-down`, {
        [`${prefixCls}-number-button-down-disabled`]: disabled,
        [`${prefixCls}-number-button-down-not-allowed`]: notAllowedDown,
      });
      return h('div', { class: suffixChildrenCls }, [
        h(
          'span',
          {
            class: upClassName,
            onMousedown: notAllowedUp ? _noop : handleUpClick,
            onMouseup: handleMouseUp,
            onMouseleave: handleMouseLeave,
          },
          [h(IconChevronUp, { size: 'extra-small' })]
        ),
        h(
          'span',
          {
            class: downClassName,
            onMousedown: notAllowedDown ? _noop : handleDownClick,
            onMouseup: handleMouseUp,
            onMouseleave: handleMouseLeave,
          },
          [h(IconChevronDown, { size: 'extra-small' })]
        ),
      ]);
    };

    const renderSuffix = () => {
      const { innerButtons } = props;
      const { hovering, focusing } = state;
      if (innerButtons && (hovering || focusing)) {
        return renderButtons();
      }
      if (slots.suffix) return slots.suffix();
      return normalizeNode(props.suffix);
    };

    expose({
      focus: (opts?: FocusOptions) => getInputNode()?.focus(opts),
      blur: () => getInputNode()?.blur(),
      select: () => getInputNode()?.select(),
      getInputElement: () => getInputNode(),
      foundation,
    });

    const inputPassKeys = Object.keys(restInputProps).filter((k) => k !== 'autoFocus');

    return () => {
      const { disabled, prefixCls, min, max, step, size, hideButtons, innerButtons } = props;
      const { value, number } = state;
      const { class: className, style, ...restAttrs } = attrs as any;
      const inputNumberCls = classnames(className, `${prefixCls}-number`, {
        [`${prefixCls}-number-size-${size}`]: size,
      });
      const buttons = renderButtons();
      const ariaProps: Record<string, any> = { 'aria-disabled': disabled, step };
      if (number) ariaProps['aria-valuenow'] = number;
      if (max !== Infinity) ariaProps['aria-valuemax'] = max;
      if (min !== -Infinity) ariaProps['aria-valuemin'] = min;

      const passProps: Record<string, any> = {};
      for (const key of inputPassKeys) {
        if ((props as any)[key] !== undefined) passProps[key] = (props as any)[key];
      }
      const inputSlots: Record<string, any> = {};
      for (const name of passThroughInputSlots) {
        if (slots[name]) inputSlots[name] = slots[name];
      }
      const suffix = renderSuffix();
      if (suffix !== null && suffix !== undefined && suffix !== '') {
        inputSlots.suffix = () => suffix;
      }

      return h(
        'div',
        {
          class: inputNumberCls,
          style,
          onMousemove: handleInputMouseMove,
          onMouseenter: handleInputMouseEnter,
          onMouseleave: handleInputMouseLeave,
        },
        [
          h(
            Input,
            {
              role: 'spinbutton',
              ...ariaProps,
              ...restAttrs,
              ...passProps,
              autoFocus: props.autoFocus || props.autofocus,
              size,
              disabled,
              ref: inputRef,
              value,
              onFocus: handleInputFocus,
              onChange: handleInputChange,
              onBlur: handleInputBlur,
              onKeydown: handleInputKeyDown,
              onClear: (e: any) => emit('clear', e),
              onInput: (e: any) => emit('input', e),
              onKeyup: (e: any) => emit('keyup', e),
              onKeypress: (e: any) => emit('keypress', e),
              onEnterPress: (e: any) => emit('enterPress', e),
              onCompositionStart: (e: any) => emit('compositionStart', e),
              onCompositionEnd: (e: any) => emit('compositionEnd', e),
              onCompositionUpdate: (e: any) => emit('compositionUpdate', e),
            },
            inputSlots
          ),
          hideButtons || innerButtons ? null : buttons,
        ]
      );
    };
  },
});
(InputNumber as any).elementType = 'InputNumber';

export { inputEmits as baseInputEmits };
export default InputNumber;
