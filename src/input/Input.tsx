import { defineComponent, h, ref, watch, onMounted, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _isString from 'lodash/isString';
import _isFunction from 'lodash/isFunction';
import InputFoundation from '@douyinfe/semi-foundation/lib/es/input/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/input/constants';
import '@douyinfe/semi-foundation/lib/es/input/input.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { isSemiIcon, normalizeNode, flattenChildren } from '../_utils';
import { IconClear, IconEyeClosedSolid, IconEyeOpened } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export type InputSize = (typeof strings.SIZE)[number];
export type ValidateStatus = (typeof strings.STATUS)[number];
export type InputMode = (typeof strings.MODE)[number];

export const inputProps = {
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  modelValue: { type: [String, Number] as PropType<string | number>, default: undefined },
  defaultValue: { type: [String, Number] as PropType<string | number>, default: undefined },
  addonBefore: { type: [String, Object, Function] as PropType<any>, default: '' },
  addonAfter: { type: [String, Object, Function] as PropType<any>, default: '' },
  prefix: { type: [String, Object, Function] as PropType<any>, default: '' },
  suffix: { type: [String, Object, Function] as PropType<any>, default: '' },
  clearIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  mode: { type: String as PropType<InputMode>, default: undefined },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  showClear: { type: Boolean, default: false },
  showClearIgnoreDisabled: { type: Boolean, default: false },
  hideSuffix: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  size: { type: String as PropType<InputSize>, default: 'default' },
  validateStatus: { type: String as PropType<ValidateStatus>, default: 'default' },
  insetLabel: { type: [String, Object, Function] as PropType<any>, default: undefined },
  insetLabelId: { type: String, default: undefined },
  inputStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  maxLength: { type: Number, default: undefined },
  minLength: { type: Number, default: undefined },
  getValueLength: { type: Function as PropType<(value: string) => number>, default: undefined },
  preventScroll: { type: Boolean, default: false },
  borderless: { type: Boolean, default: false },
  onlyBorder: { type: Number, default: undefined },
  composition: { type: Boolean, default: false },
};

export const inputEmits = [
  'update:modelValue',
  'update:value',
  'change',
  'clear',
  'blur',
  'focus',
  'input',
  'keydown',
  'keyup',
  'keypress',
  'enterPress',
  'compositionStart',
  'compositionEnd',
  'compositionUpdate',
];

const Input = defineComponent({
  name: 'Input',
  inheritAttrs: false,
  props: inputProps,
  emits: inputEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, isControlled, propsView } = useBaseComponent(props as any, {
      value: undefined as any,
      cachedValue: undefined as any,
      disabled: false,
      isFocus: false,
      isHovering: false,
      eyeClosed: props.mode === 'password',
      minLength: props.minLength,
    }, { modelProp: 'value' });

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    const initValue = 'value' in propsView ? getValueProp() : props.defaultValue;
    state.value = initValue;
    state.cachedValue = getValueProp();

    const inputRef = ref<HTMLInputElement | null>(null);

    const adapter = {
      ...baseAdapter,
      setValue: (value: any) => {
        state.value = value;
      },
      setEyeClosed: (value: boolean) => {
        state.eyeClosed = value;
      },
      toggleFocusing: (isFocus: boolean) => {
        state.isFocus = isFocus;
      },
      focusInput: () => {
        inputRef.value && inputRef.value.focus({ preventScroll: props.preventScroll });
      },
      toggleHovering: (isHovering: boolean) => {
        state.isHovering = isHovering;
      },
      getIfFocusing: () => state.isFocus,
      notifyChange: (cbValue: any, e: any) => {
        emit('update:modelValue', cbValue);
        emit('update:value', cbValue);
        emit('change', cbValue, e);
      },
      notifyBlur: (_val: any, e: any) => emit('blur', e),
      notifyFocus: (_val: any, e: any) => emit('focus', e),
      notifyInput: (e: any) => emit('input', e),
      notifyKeyPress: (e: any) => emit('keypress', e),
      notifyKeyDown: (e: any) => emit('keydown', e),
      notifyKeyUp: (e: any) => emit('keyup', e),
      notifyEnterPress: (e: any) => emit('enterPress', e),
      notifyClear: (e: any) => emit('clear', e),
      notifyCompositionStart: (e: any) => emit('compositionStart', e),
      notifyCompositionEnd: (e: any) => emit('compositionEnd', e),
      notifyCompositionUpdate: (e: any) => emit('compositionUpdate', e),
      setMinLength: (minLength: number) => {
        state.minLength = minLength;
      },
      isEventTarget: (e: any) => e && e.target === e.currentTarget,
    };
    const foundation = new (InputFoundation as any)(adapter);

    // getDerivedStateFromProps: sync controlled value
    watch(
      () => [getValueProp(), (props as any).modelValue],
      () => {
        const v = getValueProp();
        if (v !== state.cachedValue) {
          state.value = v;
          state.cachedValue = v;
        }
      }
    );
    watch(
      () => props.mode,
      (mode) => foundation.handleModeChange(mode)
    );

    onMounted(() => {
      if (!props.disabled && (props.autoFocus || (attrs as any).autofocus !== undefined)) {
        inputRef.value?.focus({ preventScroll: props.preventScroll });
      }
    });

    /**
     * React re-renders controlled inputs and forces the DOM value back to props.value.
     * Vue only patches the DOM when the vnode prop changes, so after every input event we
     * re-align the DOM with the (possibly unchanged) state value.
     */
    const syncDomValue = () => {
      nextTick(() => {
        const el = inputRef.value;
        if (!el) return;
        const v = state.value === null || state.value === undefined ? '' : String(state.value);
        if (el.value !== v) el.value = v;
      });
    };

    const handleMouseOver = () => {
      state.isHovering = true;
    };
    const handleMouseLeave = () => {
      state.isHovering = false;
    };

    const slotOrProp = (name: string) => (slots[name] ? flattenChildren(slots[name]!()) : normalizeNode((props as any)[name]));
    const isText = (node: any) => _isString(node) || (Array.isArray(node) && node.length === 1 && typeof node[0]?.children === 'string' && typeof node[0].type === 'symbol');
    const isIcon = (node: any) => (Array.isArray(node) ? node.length === 1 && isSemiIcon(node[0]) : isSemiIcon(node));

    const renderPrepend = () => {
      const addonBefore = slotOrProp('addonBefore');
      if (addonBefore && (!Array.isArray(addonBefore) || addonBefore.length)) {
        const wrapperCls = cls({
          [`${prefixCls}-prepend`]: true,
          [`${prefixCls}-prepend-text`]: isText(addonBefore),
          [`${prefixCls}-prepend-icon`]: isIcon(addonBefore),
        });
        return h('div', { class: wrapperCls, 'x-semi-prop': 'addonBefore' }, [addonBefore]);
      }
      return null;
    };
    const renderAppend = () => {
      const addonAfter = slotOrProp('addonAfter');
      if (addonAfter && (!Array.isArray(addonAfter) || addonAfter.length)) {
        const wrapperCls = cls({
          [`${prefixCls}-append`]: true,
          [`${prefixCls}-append-text`]: isText(addonAfter),
          [`${prefixCls}-append-icon`]: isIcon(addonAfter),
        });
        return h('div', { class: wrapperCls, 'x-semi-prop': 'addonAfter' }, [addonAfter]);
      }
      return null;
    };
    const renderClearBtn = () => {
      const allowClear = foundation.isAllowClear();
      if (allowClear) {
        const clearIcon = slots.clearIcon ? slots.clearIcon() : normalizeNode(props.clearIcon);
        return h('div', { class: cls(`${prefixCls}-clearbtn`), onMousedown: (e: MouseEvent) => foundation.handleClear(e) }, [clearIcon ? clearIcon : h(IconClear)]);
      }
      return null;
    };
    const renderModeBtn = () => {
      const { mode, disabled } = props;
      const showModeBtn = mode === 'password' && !disabled;
      if (!showModeBtn) return null;
      const modeIcon = state.eyeClosed ? h(IconEyeClosedSolid) : h(IconEyeOpened);
      const ariaLabel = state.eyeClosed ? 'Show password' : 'Hidden password';
      return h(
        'div',
        {
          role: 'button',
          tabindex: 0,
          'aria-label': ariaLabel,
          class: cls(`${prefixCls}-modebtn`),
          onClick: (e: MouseEvent) => foundation.handleClickEye(e),
          onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
          onMouseup: (e: MouseEvent) => foundation.handleMouseUp(e),
          onKeypress: (e: KeyboardEvent) => foundation.handleModeEnterPress(e),
        },
        [modeIcon]
      );
    };
    const renderPrefix = () => {
      const prefix = slotOrProp('prefix');
      const insetLabel = slotOrProp('insetLabel');
      const hasPrefix = prefix && (!Array.isArray(prefix) || prefix.length);
      const hasInset = insetLabel && (!Array.isArray(insetLabel) || insetLabel.length);
      const labelNode = hasPrefix ? prefix : hasInset ? insetLabel : null;
      if (!labelNode) return null;
      const wrapperCls = cls({
        [`${prefixCls}-prefix`]: true,
        [`${prefixCls}-inset-label`]: hasInset && !hasPrefix,
        [`${prefixCls}-prefix-text`]: isText(labelNode),
        [`${prefixCls}-prefix-icon`]: isIcon(labelNode),
      });
      return h(
        'div',
        {
          class: wrapperCls,
          onMousedown: (e: MouseEvent) => foundation.handlePreventMouseDown(e),
          onClick: (e: MouseEvent) => foundation.handleClickPrefixOrSuffix(e),
          id: props.insetLabelId,
          'x-semi-prop': 'prefix,insetLabel',
        },
        [labelNode]
      );
    };
    const renderSuffix = (suffixAllowClear: boolean) => {
      const suffix = slotOrProp('suffix');
      if (!suffix || (Array.isArray(suffix) && !suffix.length)) return null;
      const wrapperCls = cls({
        [`${prefixCls}-suffix`]: true,
        [`${prefixCls}-suffix-text`]: isText(suffix),
        [`${prefixCls}-suffix-icon`]: isIcon(suffix),
        [`${prefixCls}-suffix-hidden`]: suffixAllowClear && Boolean(props.hideSuffix),
      });
      return h(
        'div',
        {
          class: wrapperCls,
          onMousedown: (e: MouseEvent) => foundation.handlePreventMouseDown(e),
          onClick: (e: MouseEvent) => foundation.handleClickPrefixOrSuffix(e),
          'x-semi-prop': 'suffix',
        },
        [suffix]
      );
    };

    expose({
      focus: (opts?: FocusOptions) => inputRef.value?.focus(opts),
      blur: () => inputRef.value?.blur(),
      select: () => inputRef.value?.select(),
      getInputElement: () => inputRef.value,
      inputRef,
    });

    return () => {
      const { disabled, placeholder, mode, validateStatus, type, readonly, size, showClear, inputStyle, maxLength, getValueLength, borderless, onlyBorder } = props;
      const { value, isFocus, minLength: stateMinLength } = state;
      const suffixAllowClear = foundation.isAllowClear();
      const suffixNode = slotOrProp('suffix');
      const suffixIsIcon = isIcon(suffixNode);
      const hasPrefix = Boolean(slots.prefix || props.prefix || slots.insetLabel || props.insetLabel);
      const hasSuffix = Boolean(slots.suffix || props.suffix);
      const hasBefore = Boolean(slots.addonBefore || props.addonBefore);
      const hasAfter = Boolean(slots.addonAfter || props.addonAfter);
      const wrapperPrefix = `${prefixCls}-wrapper`;
      const wrapperCls = cls(wrapperPrefix, attrs.class as any, {
        [`${prefixCls}-wrapper__with-prefix`]: hasPrefix,
        [`${prefixCls}-wrapper__with-suffix`]: hasSuffix,
        [`${prefixCls}-wrapper__with-suffix-hidden`]: suffixAllowClear && Boolean(props.hideSuffix),
        [`${prefixCls}-wrapper__with-suffix-icon`]: suffixIsIcon,
        [`${prefixCls}-wrapper__with-append`]: hasBefore,
        [`${prefixCls}-wrapper__with-prepend`]: hasAfter,
        [`${prefixCls}-wrapper__with-append-only`]: hasBefore && !hasAfter,
        [`${prefixCls}-wrapper__with-prepend-only`]: !hasBefore && hasAfter,
        [`${wrapperPrefix}-readonly`]: readonly,
        [`${wrapperPrefix}-disabled`]: disabled,
        [`${wrapperPrefix}-warning`]: validateStatus === 'warning',
        [`${wrapperPrefix}-error`]: validateStatus === 'error',
        [`${wrapperPrefix}-focus`]: isFocus,
        [`${wrapperPrefix}-clearable`]: showClear,
        [`${wrapperPrefix}-modebtn`]: mode === 'password',
        [`${wrapperPrefix}-hidden`]: type === 'hidden',
        [`${wrapperPrefix}-${size}`]: size,
        [`${prefixCls}-borderless`]: borderless,
        [`${prefixCls}-only_border`]: onlyBorder !== undefined && onlyBorder !== null,
      });
      const inputCls = cls(prefixCls, {
        [`${prefixCls}-${size}`]: size,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-sibling-clearbtn`]: suffixAllowClear,
        [`${prefixCls}-sibling-modebtn`]: mode === 'password',
      });
      const inputValue = value === null || value === undefined ? '' : value;
      const { class: _c, style: wrapperStyleAttr, ...rest } = attrs as any;
      const inputProps: Record<string, any> = {
        ...rest,
        style: inputStyle,
        class: inputCls,
        disabled,
        readonly,
        type: foundation.handleInputType(type),
        placeholder,
        onInput: (e: Event) => {
          foundation.handleInput(e);
          foundation.handleChange((e.target as HTMLInputElement).value, e);
          syncDomValue();
        },
        onFocus: (e: FocusEvent) => foundation.handleFocus(e),
        onBlur: (e: FocusEvent) => foundation.handleBlur(e),
        onKeyup: (e: KeyboardEvent) => foundation.handleKeyUp(e),
        onKeydown: (e: KeyboardEvent) => foundation.handleKeyDown(e),
        onKeypress: (e: KeyboardEvent) => foundation.handleKeyPress(e),
        onCompositionstart: (e: CompositionEvent) => foundation.handleCompositionStart(e),
        onCompositionend: (e: CompositionEvent) => foundation.handleCompositionEnd(e),
        onCompositionupdate: (e: CompositionEvent) => foundation.handleCompositionUpdate(e),
        value: inputValue,
        ref: inputRef,
      };
      if (!_isFunction(getValueLength)) inputProps.maxlength = maxLength;
      if (stateMinLength) inputProps.minlength = stateMinLength;
      if (validateStatus === 'error') inputProps['aria-invalid'] = 'true';
      let wrapperStyle: any = wrapperStyleAttr;
      if (onlyBorder !== undefined) {
        wrapperStyle = [{ borderWidth: `${onlyBorder}px` }, wrapperStyleAttr];
      }
      return h(
        'div',
        {
          class: wrapperCls,
          style: wrapperStyle,
          onMouseenter: handleMouseOver,
          onMouseleave: handleMouseLeave,
          onClick: (e: MouseEvent) => foundation.handleClick(e),
        },
        [renderPrepend(), renderPrefix(), h('input', inputProps), renderClearBtn(), renderSuffix(suffixAllowClear), renderModeBtn(), renderAppend()]
      );
    };
  },
});
(Input as any).elementType = 'Input';

export default Input;
