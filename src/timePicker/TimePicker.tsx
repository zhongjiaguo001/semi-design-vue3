import { defineComponent, h, ref, computed, watch, onBeforeUnmount, toRaw } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import _get from 'lodash/get';
import classNames from 'classnames';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/timePicker/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import TimePickerFoundation from '@douyinfe/semi-foundation/lib/es/timePicker/foundation';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import '@douyinfe/semi-foundation/lib/es/timePicker/timePicker.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { extendPropsView, normalizeNode } from '../_utils';
import Popover from '../popover/Popover';
import Combobox from './Combobox';
import type { ComboboxChangeResult } from './Combobox';
import TimeInput from './TimeInput';

export type TimePickerType = (typeof strings.TYPES)[number];
export type TimePickerSize = (typeof strings.SIZE)[number];
export type TimePickerValidateStatus = (typeof strings.STATUS)[number];
export type BaseValueType = string | number | Date;
export type TimePickerValue = BaseValueType | BaseValueType[];
export type TimePanelType = 'left' | 'right';

export interface TimePanelProps {
  panelHeader?: any;
  panelFooter?: any;
}

export interface DisabledTimeResult {
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
}

const valueType = [String, Number, Date, Array] as PropType<TimePickerValue>;

export const timePickerProps = {
  // aria-* attributes are passed through `attrs` to the inner Input (React: `...rest`)
  prefixCls: { type: String, default: cssClasses.PREFIX },
  borderless: { type: Boolean, default: false },
  clearText: { type: String, default: 'clear' },
  clearIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  value: { type: valueType, default: undefined },
  modelValue: { type: valueType, default: undefined },
  defaultValue: { type: valueType, default: undefined },
  inputReadOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showClear: { type: Boolean, default: true },
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: undefined },
  position: { type: String as PropType<any>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  placeholder: { type: String, default: undefined },
  format: { type: String, default: undefined },
  className: { type: String, default: '' },
  popupClassName: { type: String, default: '' },
  popupStyle: { type: Object as PropType<CSSProperties>, default: () => ({ left: '0px', top: '0px' }) },
  disabledHours: { type: Function as PropType<() => number[]>, default: () => [] },
  disabledMinutes: { type: Function as PropType<(hour: number) => number[]>, default: () => [] },
  disabledSeconds: { type: Function as PropType<(hour: number, minute: number) => number[]>, default: () => [] },
  disabledTime: { type: Function as PropType<(value: Date[], panelType: TimePanelType) => DisabledTimeResult>, default: undefined },
  dropdownMargin: { type: [Number, Object] as PropType<number | Record<string, number>>, default: undefined },
  hideDisabledOptions: { type: Boolean, default: false },
  use12Hours: { type: Boolean, default: false },
  hourStep: { type: Number, default: undefined },
  minuteStep: { type: Number, default: undefined },
  secondStep: { type: Number, default: undefined },
  focusOnOpen: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: false },
  size: { type: String as PropType<TimePickerSize>, default: 'default' },
  stopPropagation: { type: Boolean, default: true },
  panels: { type: Array as PropType<TimePanelProps[]>, default: undefined },
  locale: { type: Object as PropType<any>, default: undefined },
  localeCode: { type: String, default: undefined },
  dateFnsLocale: { type: Object as PropType<any>, default: undefined },
  zIndex: { type: [Number, String] as PropType<number | string>, default: popoverNumbers.DEFAULT_Z_INDEX },
  insetLabel: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  prefix: { type: [String, Number, Object, Function] as PropType<any>, default: undefined },
  insetLabelId: { type: String, default: undefined },
  validateStatus: { type: String as PropType<TimePickerValidateStatus>, default: undefined },
  type: { type: String as PropType<TimePickerType>, default: strings.DEFAULT_TYPE },
  rangeSeparator: { type: String, default: strings.DEFAULT_RANGE_SEPARATOR },
  triggerRender: { type: Function as PropType<(props: Record<string, any>) => any>, default: undefined },
  timeZone: { type: [String, Number] as PropType<string | number>, default: undefined },
  scrollItemProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  motion: { type: [Boolean, Function, Object] as PropType<boolean | ((...args: any[]) => any) | Record<string, any>>, default: true },
  autoAdjustOverflow: { type: Boolean, default: true },
  panelHeader: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  panelFooter: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  inputStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  preventScroll: { type: Boolean, default: false },
  onChangeWithDateFirst: { type: Boolean, default: true },
};

export const timePickerEmits = ['update:modelValue', 'update:value', 'update:open', 'change', 'openChange', 'focus', 'blur', 'keydown'];

interface TimePickerState {
  open: boolean;
  value: Date[];
  inputValue: string;
  currentSelectPanel: number | string;
  isAM: [boolean, boolean];
  showHour: boolean;
  showMinute: boolean;
  showSecond: boolean;
  invalid: boolean | undefined;
}

const TimePicker = defineComponent({
  name: 'TimePicker',
  inheritAttrs: false,
  props: timePickerProps,
  emits: timePickerEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { locale: localeSlice, localeCode: localeCodeC, dateFnsLocale: dateFnsLocaleC } = useLocale('TimePicker');

    const format0 = props.format ?? strings.DEFAULT_FORMAT;
    const { state, adapter: baseAdapter, propsView, isControlled } = useBaseComponent<any, TimePickerState>(
      props as any,
      {
        open: props.open || props.defaultOpen || false,
        value: [],
        inputValue: '',
        currentSelectPanel: 0,
        isAM: [true, false],
        showHour: Boolean(format0.match(/HH|hh|H|h/g)),
        showMinute: Boolean(format0.match(/mm/g)),
        showSecond: Boolean(format0.match(/ss/g)),
        invalid: undefined,
      },
      { modelProp: 'value' }
    );

    const getLocale = () => props.locale || localeSlice.value;
    const getLocaleCode = () => props.localeCode || localeCodeC.value;
    const getDateFnsLocale = () => props.dateFnsLocale || dateFnsLocaleC.value;
    const getTimeZone = () => (props.timeZone !== undefined && props.timeZone !== null ? props.timeZone : context.timeZone);
    const getPlaceholder = () => (props.placeholder !== undefined ? props.placeholder : _get(getLocale(), ['placeholder', props.type]));

    // React wraps TimePicker in LocaleConsumer / ConfigContext.Consumer and injects these as props
    const fullProps = extendPropsView(propsView, () => ({
      locale: getLocale(),
      localeCode: getLocaleCode(),
      dateFnsLocale: getDateFnsLocale(),
      timeZone: getTimeZone(),
      placeholder: getPlaceholder(),
    }));

    const timePickerRef = ref<HTMLElement | null>(null);
    const panelRef = ref<HTMLElement | null>(null);
    let clickOutSideHandler: ((e: MouseEvent) => void) | null = null;

    const isRangePicker = () => props.type === strings.TYPE_TIME_RANGE_PICKER;
    const unwrap = (v: any) => (Array.isArray(v) ? [...toRaw(v)] : v);

    const adapter = {
      ...baseAdapter,
      getProp: (key: string) => (fullProps as any)[key],
      getProps: () => fullProps,
      togglePanel: (show: boolean) => {
        state.open = show;
      },
      registerClickOutSide: () => {
        if (clickOutSideHandler) {
          adapter.unregisterClickOutSide();
        }
        clickOutSideHandler = (e: MouseEvent) => {
          const panel = panelRef.value;
          const trigger = timePickerRef.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (!(panel && panel.contains(target)) && !(trigger && trigger.contains(target)) && !(path.includes(trigger as any) || path.includes(panel as any))) {
            foundation.handlePanelClose(true, e);
          }
        };
        document.addEventListener('mousedown', clickOutSideHandler);
      },
      setInputValue: (inputValue: string, cb?: () => void) => baseAdapter.setState({ inputValue } as any, cb),
      unregisterClickOutSide: () => {
        if (clickOutSideHandler) {
          document.removeEventListener('mousedown', clickOutSideHandler);
          clickOutSideHandler = null;
        }
      },
      notifyOpenChange: (open: boolean) => {
        emit('update:open', open);
        emit('openChange', open);
      },
      notifyChange: (arg1: any, arg2: any) => {
        const a = unwrap(arg1);
        const b = unwrap(arg2);
        const dateValue = props.onChangeWithDateFirst ? a : b;
        emit('update:modelValue', dateValue);
        emit('update:value', dateValue);
        emit('change', a, b);
      },
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyBlur: (...args: any[]) => emit('blur', ...args),
      isRangePicker,
    };
    const foundation = new (TimePickerFoundation as any)(adapter);
    const useCustomTrigger = () => typeof props.triggerRender === 'function';

    foundation.init();
    onBeforeUnmount(() => foundation.destroy());

    // getDerivedStateFromProps: controlled open
    watch(
      () => props.open,
      (open) => {
        if (isControlled('open') && open !== state.open) {
          state.open = Boolean(open);
        }
      }
    );
    // componentDidUpdate: controlled value / timeZone
    const getValueProp = () => (fullProps as any).value;
    watch(
      () => [getValueProp(), (props as any).modelValue],
      ([value], [prevValue]) => {
        if (isControlled('value') && value !== prevValue) {
          foundation.refreshProps({ ...(fullProps as any), value });
        }
      }
    );
    watch(
      () => getTimeZone(),
      (timeZone, prevTimeZone) => {
        if (timeZone !== prevTimeZone) {
          foundation.refreshProps({ timeZone, __prevTimeZone: prevTimeZone, value: state.value });
        }
      }
    );

    const onCurrentSelectPanelChange = (currentSelectPanel: any) => {
      state.currentSelectPanel = currentSelectPanel;
    };
    const handlePanelChange = (value: ComboboxChangeResult, index: number) => foundation.handlePanelChange(value, index);
    const handleInput = (value: string) => foundation.handleInputChange(value);
    const openPanel = () => foundation.handlePanelOpen();
    const handleFocus = (e: FocusEvent) => foundation.handleFocus(e);
    const handleBlur = (e: FocusEvent) => foundation.handleInputBlur(e);

    const resolvePanelNode = (name: 'panelHeader' | 'panelFooter', index: number) => {
      const slot = slots[name];
      if (slot) return slot({ index });
      const prop = (props as any)[name];
      if (Array.isArray(prop) && isRangePicker()) return normalizeNode(prop[index]);
      return normalizeNode(prop);
    };
    const hasPanelNode = (name: 'panelHeader' | 'panelFooter') => Boolean(slots[name]) || !isNullOrUndefined((props as any)[name]);

    const createPanelProps = (index = 0) => {
      const { panels } = props;
      const locale = getLocale();
      const panelProps: Record<string, any> = {};
      if (hasPanelNode('panelHeader')) panelProps.panelHeader = resolvePanelNode('panelHeader', index);
      if (hasPanelNode('panelFooter')) panelProps.panelFooter = resolvePanelNode('panelFooter', index);
      if (isRangePicker()) {
        const defaultHeaderMap: Record<number, any> = { 0: locale && locale.begin, 1: locale && locale.end };
        const fromPanels = _get(panels, index);
        if (fromPanels) {
          panelProps.panelHeader = normalizeNode(fromPanels.panelHeader);
          panelProps.panelFooter = normalizeNode(fromPanels.panelFooter);
        } else if (!hasPanelNode('panelHeader')) {
          panelProps.panelHeader = _get(defaultHeaderMap, index, null);
        }
      }
      return panelProps;
    };

    const getDisabledTimeOptions = (panelType: TimePanelType): DisabledTimeResult | undefined => {
      const { disabledTime } = props;
      const { value } = state;
      if (typeof disabledTime !== 'function') return undefined;
      if (!isRangePicker()) return undefined;
      return disabledTime([...value], panelType);
    };

    const getPanelElement = () => {
      const { prefixCls, type, disabledHours, disabledMinutes, disabledSeconds, use12Hours, hideDisabledOptions, hourStep, minuteStep, secondStep, scrollItemProps } = props;
      const { isAM, value } = state;
      const format = foundation.getDefaultFormatIfNeed();
      const leftDisabled = getDisabledTimeOptions('left') || {};
      const rightDisabled = getDisabledTimeOptions('right') || {};
      const common = { format, use12Hours, hideDisabledOptions, hourStep, minuteStep, secondStep, scrollItemProps, prefixCls: `${prefixCls}-panel`, onCurrentSelectPanelChange };
      const timePanels = [
        h(Combobox, {
          ...common,
          key: 0,
          isAM: isAM[0],
          timeStampValue: value[0],
          onChange: (v: ComboboxChangeResult) => handlePanelChange(v, 0),
          disabledHours: leftDisabled.disabledHours || disabledHours,
          disabledMinutes: leftDisabled.disabledMinutes || disabledMinutes,
          disabledSeconds: leftDisabled.disabledSeconds || disabledSeconds,
          ...createPanelProps(0),
        }),
      ];
      if (type === strings.TYPE_TIME_RANGE_PICKER) {
        timePanels.push(
          h(Combobox, {
            ...common,
            key: 1,
            isAM: isAM[1],
            timeStampValue: value[1],
            onChange: (v: ComboboxChangeResult) => handlePanelChange(v, 1),
            disabledHours: rightDisabled.disabledHours || disabledHours,
            disabledMinutes: rightDisabled.disabledMinutes || disabledMinutes,
            disabledSeconds: rightDisabled.disabledSeconds || disabledSeconds,
            ...createPanelProps(1),
          })
        );
      }
      const wrapCls = classNames({ [cssClasses.RANGE_PANEL_LISTS]: isRangePicker() });
      return h('div', { ref: panelRef, class: wrapCls }, timePanels);
    };

    const getPopupClassName = () => {
      const { use12Hours, prefixCls, popupClassName } = props;
      const { showHour, showMinute, showSecond } = state;
      let selectColumnCount = 0;
      if (showHour) selectColumnCount += 1;
      if (showMinute) selectColumnCount += 1;
      if (showSecond) selectColumnCount += 1;
      if (use12Hours) selectColumnCount += 1;
      return classNames(
        `${prefixCls}-panel`,
        popupClassName,
        {
          [`${prefixCls}-panel-narrow`]: (!showHour || !showMinute || !showSecond) && !use12Hours,
          [cssClasses.RANGE_PICKER]: isRangePicker(),
        },
        `${prefixCls}-panel-column-${selectColumnCount}`
      );
    };

    const timeInputRef = ref<any>(null);

    expose({
      focus: () => timeInputRef.value?.focus(),
      blur: () => timeInputRef.value?.blur(),
      open: () => foundation.handlePanelOpen(),
      close: (e?: any) => foundation.handlePanelClose(false, e),
      foundation,
    });

    return () => {
      const {
        prefixCls,
        disabled,
        dropdownMargin,
        popupStyle,
        size,
        zIndex,
        getPopupContainer,
        insetLabel,
        prefix,
        insetLabelId,
        inputStyle,
        showClear,
        triggerRender,
        motion,
        autoAdjustOverflow,
        stopPropagation,
        borderless,
        inputReadOnly,
        validateStatus,
        type,
        clearText,
        focusOnOpen,
        preventScroll,
        clearIcon,
        className,
      } = props;
      const format = foundation.getDefaultFormatIfNeed();
      const position = foundation.getPosition();
      const { open, inputValue, invalid, value } = state;
      const popupClassName = getPopupClassName();
      const headerPrefix = classNames({ [`${prefixCls}-header`]: true });
      const panelPrefix = classNames({
        [`${prefixCls}-panel`]: true,
        [`${prefixCls}-panel-${size}`]: size,
      });
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const placeholder = getPlaceholder();
      const locale = getLocale();

      const inputProps: Record<string, any> = {
        ...restAttrs,
        disabled,
        prefixCls,
        size,
        showClear: disabled ? false : showClear,
        style: inputStyle,
        value: inputValue,
        onFocus: handleFocus,
        insetLabel,
        prefix,
        insetLabelId,
        format,
        locale,
        localeCode: getLocaleCode(),
        invalid,
        placeholder,
        onChange: handleInput,
        onBlur: handleBlur,
        borderless,
        inputReadOnly,
        validateStatus,
        type,
        clearText,
        focusOnOpen,
        preventScroll,
        clearIcon,
        autofocus: props.autoFocus || undefined,
        ref: timeInputRef,
      };

      const outerProps: Record<string, any> = {};
      if (useCustomTrigger()) {
        outerProps.onClick = openPanel;
      }

      const renderTrigger = () => {
        if (useCustomTrigger()) {
          return triggerRender!({
            disabled,
            value: [...value],
            inputValue,
            onChange: handleInput,
            placeholder,
            componentName: 'TimePicker',
            componentProps: { ...props },
          });
        }
        return h('span', { class: headerPrefix }, [h(TimeInput, inputProps, { ...(slots.insetLabel ? { insetLabel: slots.insetLabel } : {}), ...(slots.prefix ? { prefix: slots.prefix } : {}) })]);
      };

      return h(
        'div',
        {
          ref: timePickerRef,
          class: classNames({ [prefixCls]: true }, className, attrClass),
          style: attrStyle,
          ...outerProps,
        },
        [
          h(
            Popover,
            {
              getPopupContainer,
              zIndex: Number(zIndex),
              prefixCls: panelPrefix,
              contentClassName: popupClassName,
              style: popupStyle,
              trigger: 'custom',
              position,
              visible: disabled ? false : Boolean(open),
              motion: Boolean(motion),
              margin: dropdownMargin as any,
              autoAdjustOverflow,
              stopPropagation,
            },
            {
              default: renderTrigger,
              content: () => getPanelElement(),
            }
          ),
        ]
      );
    };
  },
});

(TimePicker as any).elementType = 'TimePicker';
export default TimePicker;
