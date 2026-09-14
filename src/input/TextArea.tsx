import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _isFunction from 'lodash/isFunction';
import _isObject from 'lodash/isObject';
import _isUndefined from 'lodash/isUndefined';
import _throttle from 'lodash/throttle';
import TextAreaFoundation from '@douyinfe/semi-foundation/lib/es/input/textareaFoundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/input/constants';
import '@douyinfe/semi-foundation/lib/es/input/textarea.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { IconClear } from '../icons/generated';
import type { ValidateStatus } from './Input';

const prefixCls = cssClasses.PREFIX;

export type AutosizeRow = { minRows?: number; maxRows?: number };

export const textAreaProps = {
  value: { type: String, default: undefined },
  modelValue: { type: String, default: undefined },
  defaultValue: { type: String, default: undefined },
  autosize: { type: [Boolean, Object] as PropType<boolean | AutosizeRow>, default: false },
  borderless: { type: Boolean, default: false },
  placeholder: { type: String, default: undefined },
  maxCount: { type: Number, default: undefined },
  maxLength: { type: Number, default: undefined },
  minLength: { type: Number, default: undefined },
  rows: { type: Number, default: 4 },
  cols: { type: Number, default: 20 },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: false },
  showCounter: { type: Boolean, default: false },
  showClear: { type: Boolean, default: false },
  validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
  textareaStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  getValueLength: { type: Function as PropType<(value: string) => number>, default: undefined },
  resize: { type: String as PropType<'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline'>, default: undefined },
  composition: { type: Boolean, default: false },
  disabledEnterStartNewLine: { type: Boolean, default: false },
  showLineNumber: { type: Boolean, default: false },
  lineNumberStart: { type: Number, default: 1 },
  lineNumberClassName: { type: String, default: undefined },
  lineNumberStyle: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const textAreaEmits = ['update:modelValue', 'update:value', 'change', 'clear', 'blur', 'focus', 'keydown', 'keyup', 'keypress', 'enterPress', 'resize', 'compositionStart', 'compositionEnd', 'compositionUpdate'];

const TextArea = defineComponent({
  name: 'TextArea',
  inheritAttrs: false,
  props: textAreaProps,
  emits: textAreaEmits,
  setup(props, { attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      value: undefined as any,
      isFocus: false,
      isHover: false,
      height: 0,
      minLength: props.minLength,
      cachedValue: undefined as any,
      textareaWidth: 0,
      textareaHeight: 0,
    }, { modelProp: 'value' });
    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    state.value = 'value' in propsView ? getValueProp() : props.defaultValue;
    state.cachedValue = getValueProp();

    const libRef = ref<HTMLTextAreaElement | null>(null);
    const lineNumberRef = ref<HTMLElement | null>(null);
    let lineNumberResizeObserver: ResizeObserver | null = null;
    let nativeResizeObserver: ResizeObserver | null = null;
    let nativeResizeObservedOnce = false;
    let lastNativeSize: { width: number; height: number } | null = null;

    const adapter = {
      ...baseAdapter,
      setValue: (value: any) => {
        state.value = value;
        if (props.autosize) {
          // wait for DOM to reflect the new value
          Promise.resolve().then(() => foundation.resizeTextarea());
        }
      },
      getRef: () => libRef.value,
      toggleFocusing: (focusing: boolean) => {
        state.isFocus = focusing;
      },
      toggleHovering: (hovering: boolean) => {
        state.isHover = hovering;
      },
      notifyChange: (val: any, e: any) => {
        emit('update:modelValue', val);
        emit('update:value', val);
        emit('change', val, e);
      },
      notifyClear: (e: any) => emit('clear', e),
      notifyBlur: (_val: any, e: any) => emit('blur', e),
      notifyFocus: (_val: any, e: any) => emit('focus', e),
      notifyKeyDown: (e: any) => emit('keydown', e),
      notifyHeightUpdate: (height: number) => {
        state.height = height;
        emit('resize', { height });
      },
      notifyPressEnter: (e: any) => emit('enterPress', e),
      notifyCompositionStart: (e: any) => emit('compositionStart', e),
      notifyCompositionEnd: (e: any) => emit('compositionEnd', e),
      notifyCompositionUpdate: (e: any) => emit('compositionUpdate', e),
      setMinLength: (minLength: number) => {
        state.minLength = minLength;
      },
      focusInput: () => libRef.value && libRef.value.focus(),
      isEventTarget: (e: any) => e && e.target === e.currentTarget,
    };
    const foundation = new (TextAreaFoundation as any)(adapter);
    const throttledResizeTextarea = _throttle(() => foundation.resizeTextarea(), 10);

    const handleNativeResize = (entries: ResizeObserverEntry[]) => {
      if (props.autosize) return;
      const rect = entries && entries[0] && entries[0].contentRect;
      if (!rect) return;
      const { width, height } = rect;
      if (!nativeResizeObservedOnce) {
        nativeResizeObservedOnce = true;
        lastNativeSize = { width, height };
        return;
      }
      if (lastNativeSize && lastNativeSize.width === width && lastNativeSize.height === height) return;
      lastNativeSize = { width, height };
      emit('resize', { height, width });
    };
    const throttledNotifyNativeResize = _throttle(handleNativeResize, 10);

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
      () => [props.value, (props as any).modelValue, props.placeholder],
      () => {
        if (props.autosize) Promise.resolve().then(() => foundation.resizeTextarea());
      }
    );

    const setupLineNumberObserver = () => {
      if (props.showLineNumber && libRef.value && typeof ResizeObserver !== 'undefined') {
        const textarea = libRef.value;
        state.textareaWidth = textarea.clientWidth;
        state.textareaHeight = textarea.clientHeight;
        if (!lineNumberResizeObserver) {
          lineNumberResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              state.textareaWidth = entry.contentRect.width;
              state.textareaHeight = entry.contentRect.height;
            }
          });
        }
        lineNumberResizeObserver.observe(textarea);
      } else if (lineNumberResizeObserver) {
        lineNumberResizeObserver.disconnect();
        lineNumberResizeObserver = null;
      }
    };

    const setupSizeObserver = () => {
      nativeResizeObserver?.disconnect();
      nativeResizeObserver = null;
      if (!libRef.value || typeof ResizeObserver === 'undefined') return;
      const hasResizeProp = !_isUndefined(props.resize);
      const shouldObserveNativeResize = !props.autosize && hasResizeProp && props.resize && props.resize !== 'none';
      if (props.autosize) {
        nativeResizeObserver = new ResizeObserver(() => throttledResizeTextarea());
        nativeResizeObserver.observe(libRef.value);
      } else if (shouldObserveNativeResize) {
        nativeResizeObserver = new ResizeObserver((entries) => throttledNotifyNativeResize(entries));
        nativeResizeObserver.observe(libRef.value);
      }
    };

    onMounted(() => {
      setupLineNumberObserver();
      setupSizeObserver();
      if (props.autosize) foundation.resizeTextarea();
      if ((props.autoFocus || (attrs as any).autofocus !== undefined) && !props.disabled) {
        libRef.value?.focus();
      }
    });
    watch(() => props.showLineNumber, setupLineNumberObserver);
    watch(() => [props.autosize, props.resize], setupSizeObserver);
    onBeforeUnmount(() => {
      throttledResizeTextarea.cancel();
      throttledNotifyNativeResize.cancel();
      lineNumberResizeObserver?.disconnect();
      nativeResizeObserver?.disconnect();
      foundation.destroy();
    });

    const syncDomValue = () => {
      nextTick(() => {
        const el = libRef.value;
        if (!el) return;
        const v = state.value === null || state.value === undefined ? '' : String(state.value);
        if (el.value !== v) el.value = v;
      });
    };

    const handleTextAreaScroll = (e: Event) => {
      if (props.showLineNumber && lineNumberRef.value) {
        requestAnimationFrame(() => {
          const panel = lineNumberRef.value;
          if (panel) panel.scrollTop = (e.target as HTMLElement).scrollTop;
        });
      }
    };

    const getTextareaLineHeightPx = (textarea: HTMLTextAreaElement) => {
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeightStr = computedStyle.lineHeight;
      const fontSize = parseFloat(computedStyle.fontSize) || 14;
      if (!lineHeightStr || lineHeightStr === 'normal') return fontSize * 1.5;
      const parsed = parseFloat(lineHeightStr);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fontSize * 1.5;
    };
    const calculateWrappedLines = (line: string, textarea: HTMLTextAreaElement) => {
      if (!line) return 1;
      const computedStyle = window.getComputedStyle(textarea);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return 1;
      ctx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const textareaWidth = textarea.clientWidth - paddingLeft - paddingRight;
      if (textareaWidth <= 0) return 1;
      const textWidth = ctx.measureText(line).width;
      return Math.max(1, Math.ceil(textWidth / textareaWidth));
    };

    const renderClearBtn = () => {
      const displayClearBtn = foundation.isAllowClear();
      const clearCls = cls(`${prefixCls}-clearbtn`, { [`${prefixCls}-clearbtn-hidden`]: !displayClearBtn });
      if (props.showClear) {
        return h('div', { class: clearCls, onClick: (e: MouseEvent) => foundation.handleClear(e) }, [h(IconClear)]);
      }
      return null;
    };
    const renderCounter = () => {
      const { showCounter, maxCount, getValueLength } = props;
      if (showCounter || maxCount) {
        const { value } = state;
        const current = value ? (_isFunction(getValueLength) ? getValueLength(value) : value.length) : 0;
        const total = maxCount || null;
        const countCls = cls(`${prefixCls}-textarea-counter`, { [`${prefixCls}-textarea-counter-exceed`]: total !== null && current > total });
        return h('div', { class: countCls, onClick: (e: MouseEvent) => foundation.handleCounterClick(e) }, [String(current), total ? '/' : null, total ? String(total) : null]);
      }
      return null;
    };
    const renderLineNumbers = () => {
      const { showLineNumber, lineNumberStart = 1, lineNumberClassName, lineNumberStyle } = props;
      if (!showLineNumber) return null;
      const { value, textareaHeight } = state;
      const textarea = libRef.value;
      const lines = value ? String(value).split('\n') : [''];
      const lineNumberCls = cls(`${prefixCls}-textarea-lineNumber`, lineNumberClassName);
      const lineHeightPx = textarea ? getTextareaLineHeightPx(textarea) : 21;
      const mergedStyle: CSSProperties = {
        ...(lineNumberStyle || {}),
        height: textareaHeight ? `${textareaHeight}px` : undefined,
        maxHeight: textareaHeight ? `${textareaHeight}px` : undefined,
      };
      return h(
        'div',
        { ref: lineNumberRef, class: lineNumberCls, style: mergedStyle },
        lines.map((line, i) => {
          const wrappedLineCount = textarea ? calculateWrappedLines(line, textarea) : 1;
          return h('div', { key: i, class: `${prefixCls}-textarea-lineNumber-item`, style: { minHeight: `${wrappedLineCount * lineHeightPx}px`, lineHeight: `${lineHeightPx}px` } }, String(lineNumberStart + i));
        })
      );
    };

    expose({
      focus: () => libRef.value?.focus(),
      blur: () => libRef.value?.blur(),
      getTextareaElement: () => libRef.value,
      resize: () => foundation.resizeTextarea(),
    });

    return () => {
      const { autosize, placeholder, resize, disabled, readonly, showCounter: _sc, validateStatus, maxCount: _mc, textareaStyle, getValueLength, maxLength, showClear, borderless, showLineNumber, rows, cols } = props;
      const { isFocus, value, minLength: stateMinLength } = state;
      const hasResizeProp = !_isUndefined(resize);
      const isResizableX = !autosize && hasResizeProp && ['horizontal', 'both', 'inline'].includes(resize as string);
      const isResizableY = !autosize && hasResizeProp && ['vertical', 'both', 'block'].includes(resize as string);
      const wrapperCls = cls(attrs.class as any, `${prefixCls}-textarea-wrapper`, {
        [`${prefixCls}-textarea-borderless`]: borderless,
        [`${prefixCls}-textarea-wrapper-disabled`]: disabled,
        [`${prefixCls}-textarea-wrapper-readonly`]: readonly,
        [`${prefixCls}-textarea-wrapper-${validateStatus}`]: Boolean(validateStatus),
        [`${prefixCls}-textarea-wrapper-focus`]: isFocus,
        [`${prefixCls}-textarea-wrapper-withLineNumber`]: showLineNumber,
        [`${prefixCls}-textarea-wrapper-resizeX`]: isResizableX,
        [`${prefixCls}-textarea-wrapper-resizeY`]: isResizableY,
      });
      const itemCls = cls(`${prefixCls}-textarea`, {
        [`${prefixCls}-textarea-disabled`]: disabled,
        [`${prefixCls}-textarea-readonly`]: readonly,
        [`${prefixCls}-textarea-autosize`]: _isObject(autosize) ? _isUndefined((autosize as AutosizeRow).maxRows) : autosize,
        [`${prefixCls}-textarea-showClear`]: showClear,
      });
      const mergedTextareaStyle: CSSProperties = { ...(textareaStyle || {}) };
      if (autosize) mergedTextareaStyle.resize = 'none';
      else if (hasResizeProp) mergedTextareaStyle.resize = resize as any;
      const { class: _c, style, ...rest } = attrs as any;
      const itemProps: Record<string, any> = {
        ...rest,
        rows,
        cols,
        style: mergedTextareaStyle,
        class: itemCls,
        disabled,
        readonly,
        placeholder: !placeholder ? null : placeholder,
        onInput: (e: Event) => {
          foundation.handleChange((e.target as HTMLTextAreaElement).value, e);
          syncDomValue();
        },
        onFocus: (e: FocusEvent) => foundation.handleFocus(e),
        onBlur: (e: FocusEvent) => foundation.handleBlur(e),
        onKeydown: (e: KeyboardEvent) => foundation.handleKeyDown(e),
        onKeyup: (e: KeyboardEvent) => emit('keyup', e),
        onKeypress: (e: KeyboardEvent) => emit('keypress', e),
        onScroll: handleTextAreaScroll,
        value: value === null || value === undefined ? '' : value,
        onCompositionstart: (e: CompositionEvent) => foundation.handleCompositionStart(e),
        onCompositionend: (e: CompositionEvent) => foundation.handleCompositionEnd(e),
        onCompositionupdate: (e: CompositionEvent) => foundation.handleCompositionUpdate(e),
        ref: libRef,
      };
      if (!_isFunction(getValueLength)) itemProps.maxlength = maxLength;
      if (stateMinLength) itemProps.minlength = stateMinLength;
      const textarea = h('textarea', itemProps);
      return h(
        'div',
        {
          class: wrapperCls,
          style,
          onMouseenter: (e: MouseEvent) => foundation.handleMouseEnter(e),
          onMouseleave: (e: MouseEvent) => foundation.handleMouseLeave(e),
          onClick: (e: MouseEvent) => foundation.handleClick(e),
        },
        [renderLineNumbers(), showLineNumber ? h('div', { class: `${prefixCls}-textarea-content` }, [textarea]) : textarea, renderClearBtn(), renderCounter()]
      );
    };
  },
});
(TextArea as any).elementType = 'TextArea';

export default TextArea;
