import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { strings } from '@douyinfe/semi-foundation/lib/es/timePicker/constants';
import InputFoundation from '@douyinfe/semi-foundation/lib/es/timePicker/inputFoundation';
import Input from '../input/Input';
import { useBaseComponent } from '../_base/useBaseComponent';
import { normalizeNode } from '../_utils';
import { IconClock } from '../icons/generated';

export const timeInputProps = {
  borderless: { type: Boolean, default: false },
  format: { type: String, default: strings.DEFAULT_FORMAT },
  prefixCls: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  clearText: { type: String, default: undefined },
  inputReadOnly: { type: Boolean, default: false },
  hourOptions: { type: Array as PropType<number[]>, default: undefined },
  minuteOptions: { type: Array as PropType<number[]>, default: undefined },
  secondOptions: { type: Array as PropType<number[]>, default: undefined },
  disabledHours: { type: Function as PropType<() => number[]>, default: undefined },
  disabledMinutes: { type: Function as PropType<(hour: number) => number[]>, default: undefined },
  disabledSeconds: { type: Function as PropType<(hour: number, minute: number) => number[]>, default: undefined },
  defaultOpenValue: { type: Object as PropType<any>, default: undefined },
  currentSelectPanel: { type: [String, Number] as PropType<string | number>, default: undefined },
  focusOnOpen: { type: Boolean, default: false },
  timeStampValue: { type: null as unknown as PropType<any>, default: undefined },
  locale: { type: Object as PropType<any>, default: undefined },
  localeCode: { type: String, default: undefined },
  insetLabel: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  prefix: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  insetLabelId: { type: String, default: undefined },
  validateStatus: { type: String as PropType<(typeof strings.STATUS)[number]>, default: undefined },
  preventScroll: { type: Boolean, default: false },
  value: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  type: { type: String as PropType<(typeof strings.TYPES)[number]>, default: undefined },
  invalid: { type: Boolean, default: undefined },
  showClear: { type: Boolean, default: undefined },
  size: { type: String as PropType<(typeof strings.SIZE)[number]>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  timeZone: { type: [String, Number] as PropType<string | number>, default: undefined },
  defaultOpen: { type: Boolean, default: undefined },
  dateFnsLocale: { type: Object as PropType<any>, default: undefined },
  clearIcon: { type: [Object, Function] as PropType<any>, default: undefined },
};

export const timeInputEmits = ['change', 'focus', 'blur', 'esc', 'click'];

const TimeInput = defineComponent({
  name: 'TimeInput',
  inheritAttrs: false,
  props: timeInputProps,
  emits: timeInputEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { adapter: baseAdapter, isControlled } = useBaseComponent(props as any, {});
    const inputRef = ref<any>(null);

    const adapter = {
      ...baseAdapter,
      notifyChange: (...args: any[]) => emit('change', ...args),
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyBlur: (...args: any[]) => emit('blur', ...args),
    };
    const foundation = new (InputFoundation as any)(adapter);

    // Vue calls function refs synchronously before the inner <input> ref is populated,
    // so resolve the native element on the next tick.
    const setRef = (node: any) => {
      inputRef.value = node;
      nextTick(() => {
        const el = node && typeof node.getInputElement === 'function' ? node.getInputElement() : node;
        baseAdapter.setCache('inputNode', el || null);
      });
    };

    onMounted(() => {
      foundation.init();
      const { focusOnOpen, preventScroll } = props;
      if (focusOnOpen) {
        const raf = window.requestAnimationFrame || window.setTimeout;
        raf(() => {
          const inputNode = baseAdapter.getCache('inputNode');
          if (inputNode) {
            inputNode.focus({ preventScroll });
            inputNode.select();
          }
        });
      }
    });
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => props.timeStampValue,
      () => {
        if (isControlled('timeStampValue')) {
          foundation.restoreCursor();
        }
      }
    );
    watch(
      () => props.value,
      () => foundation.restoreCursor()
    );

    expose({
      focus: () => inputRef.value?.focus(),
      blur: () => inputRef.value?.blur(),
      foundation,
    });

    return () => {
      const { prefixCls, placeholder, inputReadOnly, disabled, type, locale, insetLabel, prefix, insetLabelId, validateStatus, value, invalid, showClear, size, style, borderless, preventScroll, clearIcon } = props;
      const inputCls = classNames(`${prefixCls}-input`, {
        [`${prefixCls}-input-invalid`]: invalid,
        [`${prefixCls}-input-readonly`]: inputReadOnly,
      });
      const mergeValidateStatus = invalid ? 'error' : validateStatus;
      const { class: _c, style: _s, ...rest } = attrs as any;
      const insetLabelNode = slots.insetLabel ? slots.insetLabel() : normalizeNode(insetLabel);
      const prefixNode = slots.prefix ? slots.prefix() : normalizeNode(prefix);
      const hasNode = (n: any) => n !== null && n !== undefined && n !== '';
      return h('div', { class: `${prefixCls}-input-wrap` }, [
        h(
          Input,
          {
            ...rest,
            hideSuffix: true,
            class: inputCls,
            ref: setRef,
            value: value,
            placeholder: placeholder || (locale && locale.placeholder && type ? locale.placeholder[type] : undefined),
            readonly: Boolean(inputReadOnly),
            onChange: (v: string) => foundation.handleChange(v),
            onFocus: (e: FocusEvent) => foundation.handleFocus(e),
            onBlur: (e: FocusEvent) => foundation.handleBlur(e),
            validateStatus: mergeValidateStatus,
            disabled,
            size,
            showClear,
            borderless,
            preventScroll,
            clearIcon,
            inputStyle: style,
            insetLabelId,
          },
          {
            suffix: () => h(IconClock, { onClick: (e: MouseEvent) => emit('click', e) }),
            ...(hasNode(insetLabelNode) ? { insetLabel: () => insetLabelNode } : {}),
            ...(hasNode(prefixNode) ? { prefix: () => prefixNode } : {}),
          }
        ),
      ]);
    };
  },
});

export default TimeInput;
