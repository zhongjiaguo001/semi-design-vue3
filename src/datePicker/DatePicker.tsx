import { defineComponent, h, ref, computed, watch, onMounted, onBeforeUnmount, toRaw } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import _pick from 'lodash/pick';
import _isEqual from 'lodash/isEqual';
import _isFunction from 'lodash/isFunction';
import _get from 'lodash/get';
import _isDate from 'lodash/isDate';
import classnames from 'classnames';
import DatePickerFoundation from '@douyinfe/semi-foundation/lib/es/datePicker/foundation';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import '@douyinfe/semi-foundation/lib/es/datePicker/datePicker.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { extendPropsView, getDataAttr, normalizeNode } from '../_utils';
import Popover from '../popover/Popover';
import DateInput, { resolveInputElement } from './DateInput';
import MonthsGrid from './MonthsGrid';
import QuickControl from './QuickControl';
import Footer from './Footer';
import YearAndMonth from './YearAndMonth';
import type { PresetType, PresetPosition } from './QuickControl';
import type { InsetInputValue } from './InsetInput';
import type { DayStatusType } from './Month';

export type DatePickerType = (typeof strings.TYPE_SET)[number];
export type DatePickerSize = (typeof strings.SIZE_SET)[number];
export type DatePickerDensity = (typeof strings.DENSITY_SET)[number];
export type DatePickerValidateStatus = (typeof strings.STATUS)[number];
export type BaseValueType = string | number | Date;
export type DatePickerValue = BaseValueType | BaseValueType[];
export type RangeType = 'rangeStart' | 'rangeEnd' | false;
export type DisabledDateOptions = { rangeStart?: string; rangeEnd?: string; rangeInputFocus?: RangeType };
export type { PresetType, PresetPosition, DayStatusType, InsetInputValue };

const noop = () => undefined;
const stubFalse = () => false;
const valueType = [String, Number, Date, Array] as PropType<DatePickerValue>;
const nodeType = [String, Number, Object, Function, Array] as PropType<any>;

export const datePickerProps = {
  'aria-describedby': { type: String, default: undefined },
  'aria-errormessage': { type: String, default: undefined },
  'aria-invalid': { type: Boolean, default: undefined },
  'aria-labelledby': { type: String, default: undefined },
  'aria-required': { type: Boolean, default: undefined },
  borderless: { type: Boolean, default: false },
  type: { type: String as PropType<DatePickerType>, default: 'date' },
  size: { type: String as PropType<DatePickerSize>, default: 'default' },
  clearIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  density: { type: String as PropType<DatePickerDensity>, default: 'default' },
  defaultValue: { type: valueType, default: undefined },
  value: { type: valueType, default: undefined },
  modelValue: { type: valueType, default: undefined },
  defaultPickerValue: { type: valueType, default: undefined },
  disabledTime: { type: Function as PropType<(date?: Date | Date[], panelType?: string) => any>, default: stubFalse },
  disabledTimePicker: { type: Boolean, default: undefined },
  hideDisabledOptions: { type: Boolean, default: false },
  format: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  max: { type: Number, default: undefined },
  placeholder: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  presets: { type: Array as PropType<Array<PresetType | (() => PresetType)>>, default: undefined },
  presetPosition: { type: String as PropType<PresetPosition>, default: 'bottom' },
  onChangeWithDateFirst: { type: Boolean, default: true },
  weekStartsOn: { type: Number, default: numbers.WEEK_START_ON },
  disabledDate: { type: Function as PropType<(date?: Date, options?: DisabledDateOptions) => boolean>, default: stubFalse },
  timePickerOpts: { type: Object as PropType<Record<string, any>>, default: undefined },
  showClear: { type: Boolean, default: true },
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  motion: { type: [Boolean, Function, Object] as PropType<boolean | ((...args: any[]) => any) | Record<string, any>>, default: true },
  className: { type: String, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  prefix: { type: nodeType, default: undefined },
  insetLabel: { type: nodeType, default: undefined },
  insetLabelId: { type: String, default: undefined },
  zIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
  position: { type: String as PropType<any>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  needConfirm: { type: Boolean, default: undefined },
  inputStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  timeZone: { type: [String, Number] as PropType<string | number>, default: undefined },
  triggerRender: { type: Function as PropType<(props: Record<string, any>) => any>, default: undefined },
  stopPropagation: { type: [Boolean, String] as PropType<boolean | string>, default: true },
  autoAdjustOverflow: { type: Boolean, default: true },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  autoFocus: { type: Boolean, default: undefined },
  inputReadOnly: { type: Boolean, default: false },
  validateStatus: { type: String as PropType<DatePickerValidateStatus>, default: undefined },
  renderDate: { type: Function as PropType<(dayNumber?: number | string, fullDate?: string) => any>, default: undefined },
  renderFullDate: { type: Function as PropType<(dayNumber?: number | string, fullDate?: string, dayStatus?: DayStatusType) => any>, default: undefined },
  spacing: { type: [Number, Object] as PropType<number | Record<string, number>>, default: numbers.SPACING },
  startDateOffset: { type: Function as PropType<(selectedDate?: Date) => Date>, default: undefined },
  endDateOffset: { type: Function as PropType<(selectedDate?: Date) => Date>, default: undefined },
  autoSwitchDate: { type: Boolean, default: true },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMargin: { type: [Number, Object] as PropType<number | Record<string, number>>, default: undefined },
  topSlot: { type: nodeType, default: undefined },
  bottomSlot: { type: nodeType, default: undefined },
  leftSlot: { type: nodeType, default: undefined },
  rightSlot: { type: nodeType, default: undefined },
  dateFnsLocale: { type: Object as PropType<any>, default: undefined },
  locale: { type: Object as PropType<any>, default: undefined },
  localeCode: { type: String, default: undefined },
  syncSwitchMonth: { type: Boolean, default: false },
  rangeSeparator: { type: String, default: strings.DEFAULT_SEPARATOR_RANGE },
  rangeSeparatorNode: { type: nodeType, default: undefined },
  preventScroll: { type: Boolean, default: undefined },
  yearAndMonthOpts: { type: Object as PropType<Record<string, any>>, default: undefined },
  startYear: { type: Number, default: undefined },
  endYear: { type: Number, default: undefined },
  insetInput: { type: [Boolean, Object] as PropType<boolean | { placeholder?: Record<string, string> }>, default: false },
};

export const datePickerEmits = [
  'update:modelValue',
  'update:value',
  'update:open',
  'change',
  'openChange',
  'panelChange',
  'presetClick',
  'focus',
  'blur',
  'clear',
  'confirm',
  'cancel',
  'clickOutSide',
];

interface DatePickerState {
  panelShow: boolean;
  isRange: boolean;
  inputValue: string | null;
  value: Date[];
  cachedSelectedValue: (Date | null)[];
  prevTimeZone: string | number | null;
  rangeInputFocus: RangeType | undefined;
  autofocus: boolean;
  insetInputValue: InsetInputValue | null;
  triggerDisabled: boolean | undefined;
}

const DatePicker = defineComponent({
  name: 'DatePicker',
  inheritAttrs: false,
  props: datePickerProps,
  emits: datePickerEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { locale: localeSlice, localeCode: localeCodeC, dateFnsLocale: dateFnsLocaleC } = useLocale('DatePicker');

    /* ---------- React `index.js` wrapper normalisations ---------- */
    const normalizedType = computed<DatePickerType>(() => {
      const { type, format } = props;
      if (typeof format === 'string' && format && !/[Hhms]+/.test(format)) {
        if (type === 'dateTime') return 'date';
        if (type === 'dateTimeRange') return 'dateRange';
      }
      return type;
    });
    const normalizedRangeSeparator = computed(() => {
      const { rangeSeparator } = props;
      if (rangeSeparator && typeof rangeSeparator === 'string') return ` ${rangeSeparator.trim()} `;
      return rangeSeparator;
    });
    const normalizedPosition = computed(() => {
      if (props.insetInput && !props.position) return strings.POSITION_INLINE_INPUT;
      return props.position;
    });
    const normalizedSpacing = computed(() => {
      if (props.insetInput && String(normalizedPosition.value || '').includes('Over') && !props.spacing) return numbers.SPACING_INSET_INPUT;
      return props.spacing;
    });

    const isRangeType = (type: string, triggerRender: any) => /range/i.test(type) && !_isFunction(triggerRender);

    const { state, adapter: baseAdapter, propsView, isControlled } = useBaseComponent<any, DatePickerState>(
      props as any,
      {
        panelShow: Boolean(props.open || props.defaultOpen),
        isRange: false,
        inputValue: null,
        value: [],
        cachedSelectedValue: [],
        prevTimeZone: null,
        rangeInputFocus: undefined,
        autofocus: Boolean(props.autoFocus || (isRangeType(props.type, props.triggerRender) && (props.open || props.defaultOpen))),
        insetInputValue: null,
        triggerDisabled: undefined,
      },
      { modelProp: 'value' }
    );

    const getLocale = () => props.locale || localeSlice.value;
    const getLocaleCode = () => props.localeCode || localeCodeC.value;
    const getDateFnsLocale = () => props.dateFnsLocale || dateFnsLocaleC.value;
    const getTimeZone = () => (props.timeZone !== undefined && props.timeZone !== null ? props.timeZone : context.timeZone);

    // React injects locale/timeZone as props (LocaleConsumer / ConfigContext.Consumer) and the
    // index.js wrapper overrides type / rangeSeparator / position / spacing.
    const fullProps = extendPropsView(propsView, () => ({
      locale: getLocale(),
      localeCode: getLocaleCode(),
      dateFnsLocale: getDateFnsLocale(),
      timeZone: getTimeZone(),
      type: normalizedType.value,
      rangeSeparator: normalizedRangeSeparator.value,
      position: normalizedPosition.value,
      spacing: normalizedSpacing.value,
    }));
    const getProp = (key: string) => (fullProps as any)[key];

    const triggerElRef = ref<HTMLElement | null>(null);
    const panelRef = ref<HTMLElement | null>(null);
    const monthGrid = ref<any>(null);
    const inputRef = ref<any>(null);
    const rangeInputStartRef = ref<any>(null);
    const rangeInputEndRef = ref<any>(null);
    const focusRecordsRef = { current: { rangeStart: false, rangeEnd: false } };
    let clickOutSideHandler: ((e: MouseEvent) => void) | null = null;
    let mounted = false;

    const unwrap = (v: any) => (Array.isArray(v) ? [...toRaw(v)] : v);
    const inputEl = () => resolveInputElement(inputRef.value);
    const rangeStartEl = () => resolveInputElement(rangeInputStartRef.value);
    const rangeEndEl = () => resolveInputElement(rangeInputEndRef.value);
    /**
     * React's setState is async, so the foundation may compare `getStates().value` against the
     * value from *before* an `updateValue` call within the same handler (handleInputComplete).
     * While `staleValue` is set, state reads of `value` return that snapshot.
     */
    let staleValue: Date[] | null = null;

    const adapter = {
      ...baseAdapter,
      getProp,
      getProps: () => fullProps,
      getState: (key: string) => (staleValue && key === 'value' ? staleValue : (state as any)[key]),
      getStates: () => (staleValue ? new Proxy(state, { get: (t, k) => (k === 'value' ? staleValue : (t as any)[k]) }) : state),
      togglePanel: (panelShow: boolean, cb?: () => void) => {
        baseAdapter.setState({ panelShow } as any, cb);
        if (!panelShow) {
          focusRecordsRef.current.rangeEnd = false;
          focusRecordsRef.current.rangeStart = false;
        }
      },
      registerClickOutSide: () => {
        if (clickOutSideHandler) {
          adapter.unregisterClickOutSide();
          clickOutSideHandler = null;
        }
        clickOutSideHandler = (e: MouseEvent) => {
          const triggerEl = triggerElRef.value;
          const panelEl = panelRef.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (!(triggerEl && triggerEl.contains(target)) && !(panelEl && panelEl.contains(target)) && !(path.includes(triggerEl as any) || path.includes(panelEl as any))) {
            emit('clickOutSide', e);
            if (!adapter.needConfirm()) {
              foundation.closePanel();
            }
          }
        };
        document.addEventListener('mousedown', clickOutSideHandler);
      },
      unregisterClickOutSide: () => {
        if (clickOutSideHandler) {
          document.removeEventListener('mousedown', clickOutSideHandler);
          clickOutSideHandler = null;
        }
      },
      notifyBlur: (...args: any[]) => emit('blur', ...args),
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyClear: (...args: any[]) => emit('clear', ...args),
      notifyChange: (arg1: any, arg2: any) => {
        const a = unwrap(arg1);
        const b = unwrap(arg2);
        const dateValue = props.onChangeWithDateFirst ? a : b;
        emit('update:modelValue', dateValue);
        emit('update:value', dateValue);
        emit('change', a, b);
      },
      notifyCancel: (...args: any[]) => emit('cancel', ...args.map(unwrap)),
      notifyConfirm: (...args: any[]) => emit('confirm', ...args.map(unwrap)),
      notifyOpenChange: (open: boolean) => {
        emit('update:open', open);
        emit('openChange', open);
      },
      notifyPresetsClick: (...args: any[]) => emit('presetClick', ...args),
      updateValue: (value: Date[]) => {
        state.value = value;
      },
      updatePrevTimezone: (prevTimeZone: any) => {
        state.prevTimeZone = prevTimeZone;
      },
      updateCachedSelectedValue: (cachedSelectedValue: any) => {
        let _cachedSelectedValue = cachedSelectedValue;
        if (cachedSelectedValue && !Array.isArray(cachedSelectedValue)) {
          _cachedSelectedValue = [...cachedSelectedValue];
        }
        state.cachedSelectedValue = _cachedSelectedValue;
      },
      updateInputValue: (inputValue: string | null) => {
        state.inputValue = inputValue;
      },
      updateInsetInputValue: (insetInputValue: InsetInputValue | null) => {
        if (props.insetInput && !_isEqual(insetInputValue, state.insetInputValue)) {
          state.insetInputValue = insetInputValue;
        }
      },
      needConfirm: () => ['dateTime', 'dateTimeRange'].includes(normalizedType.value) && props.needConfirm === true,
      typeIsYearOrMonth: () => ['month', 'year', 'monthRange'].includes(normalizedType.value),
      setRangeInputFocus: (rangeInputFocus: RangeType) => {
        const { preventScroll } = props;
        if (rangeInputFocus !== state.rangeInputFocus) {
          state.rangeInputFocus = rangeInputFocus;
        }
        switch (rangeInputFocus) {
          case 'rangeStart': {
            const inputStartNode = rangeStartEl();
            inputStartNode && inputStartNode.focus({ preventScroll });
            setTimeout(() => {
              focusRecordsRef.current.rangeStart = true;
            }, 0);
            break;
          }
          case 'rangeEnd': {
            const inputEndNode = rangeEndEl();
            inputEndNode && inputEndNode.focus({ preventScroll });
            setTimeout(() => {
              focusRecordsRef.current.rangeEnd = true;
            }, 0);
            break;
          }
          default:
            return;
        }
      },
      couldPanelClosed: () => focusRecordsRef.current.rangeStart && focusRecordsRef.current.rangeEnd,
      isEventTarget: (e: any) => e && e.target === e.currentTarget,
      setInsetInputFocus: () => {
        const { preventScroll } = props;
        const { rangeInputFocus } = state;
        switch (rangeInputFocus) {
          case 'rangeEnd':
            if (document.activeElement !== rangeEndEl()) {
              const inputEndNode = rangeEndEl();
              inputEndNode && inputEndNode.focus({ preventScroll });
            }
            break;
          case 'rangeStart':
          default:
            if (document.activeElement !== rangeStartEl()) {
              const inputStartNode = rangeStartEl();
              inputStartNode && inputStartNode.focus({ preventScroll });
            }
            break;
        }
      },
      setInputFocus: () => {
        const inputNode = inputEl();
        inputNode && inputNode.focus({ preventScroll: props.preventScroll });
      },
      setInputBlur: () => {
        const inputNode = inputEl();
        inputNode && inputNode.blur();
      },
      setRangeInputBlur: () => {
        const { rangeInputFocus } = state;
        if (rangeInputFocus === 'rangeStart') {
          const el = rangeStartEl();
          el && el.blur();
        } else if (rangeInputFocus === 'rangeEnd') {
          const el = rangeEndEl();
          el && el.blur();
        }
        adapter.setRangeInputFocus(false);
      },
      setTriggerDisabled: (disabled: boolean) => {
        state.triggerDisabled = disabled;
      },
    };
    const foundation = new (DatePickerFoundation as any)(adapter);
    foundation.init();

    onMounted(() => {
      mounted = true;
    });
    onBeforeUnmount(() => {
      mounted = false;
      foundation.destroy();
    });

    /* ---------- componentDidUpdate ---------- */
    const getValueProp = () => getProp('value');
    watch(
      () => [getValueProp(), (props as any).modelValue],
      ([value], [prevValue]) => {
        if (!_isEqual(prevValue, value)) {
          foundation.initFromProps({ ...(fullProps as any), value });
        }
      }
    );
    watch(
      () => getTimeZone(),
      (timeZone, prevTimeZone) => {
        if (timeZone !== prevTimeZone) {
          foundation.initFromProps({ value: state.value, timeZone, prevTimeZone });
        }
      }
    );
    watch(
      () => props.open,
      (open, prevOpen) => {
        if (prevOpen !== open) {
          foundation.initPanelOpenStatus();
          if (!open) foundation.clearRangeInputFocus();
        }
      }
    );

    /* ---------- handlers ---------- */
    const handleSelectedChange = (v: any, options?: any) => foundation.handleSelectedChange(v, options);
    const handleYMSelectedChange = (item: any) => foundation.handleYMSelectedChange(item);
    const disabledDisposeDate = (date: any, ...rest: any[]) => foundation.disabledDisposeDate(date, ...rest);
    const disabledDisposeTime = (date: any, ...rest: any[]) => foundation.disabledDisposeTime(date, ...rest);
    const handleOpenPanel = () => foundation.openPanel();
    const handleInputChange = (...args: any[]) => foundation.handleInputChange(...args);
    const handleInsetInputChange = (options: any) => foundation.handleInsetInputChange(options);
    const handleInputComplete = (v: any) => {
      staleValue = [...state.value];
      try {
        foundation.handleInputComplete(v);
      } finally {
        staleValue = null;
      }
    };
    const handleInputBlur = (e: any) => foundation.handleInputBlur(_get(e, 'target.value'), e);
    const handleInputFocus = (...args: any[]) => foundation.handleInputFocus(...args);
    const handleInputClear = (e: any) => foundation.handleInputClear(e);
    const handleTriggerWrapperClick = (e: any) => foundation.handleTriggerWrapperClick(e);
    const handleSetRangeFocus = (rangeInputFocus: any) => foundation.handleSetRangeFocus(rangeInputFocus);
    const handleRangeInputBlur = (value: any, e: any) => foundation.handleRangeInputBlur(value, e);
    const handleRangeInputClear = (e: any) => foundation.handleRangeInputClear(e);
    const handleRangeEndTabPress = (e: any) => foundation.handleRangeEndTabPress(e);
    const isAnotherPanelHasOpened = (currentRangeInput: 'rangeStart' | 'rangeEnd') =>
      currentRangeInput === 'rangeStart' ? focusRecordsRef.current.rangeEnd : focusRecordsRef.current.rangeStart;
    const handleInsetDateFocus = (e: any, rangeType: any) => {
      const monthGridFoundation = _get(monthGrid.value, 'foundation');
      if (monthGridFoundation) {
        monthGridFoundation.showDatePanel(strings.PANEL_TYPE_LEFT);
        monthGridFoundation.showDatePanel(strings.PANEL_TYPE_RIGHT);
      }
      handleInputFocus(e, rangeType);
    };
    const handleInsetTimeFocus = () => {
      const monthGridFoundation = _get(monthGrid.value, 'foundation');
      if (monthGridFoundation) {
        monthGridFoundation.showTimePicker(strings.PANEL_TYPE_LEFT);
        monthGridFoundation.showTimePicker(strings.PANEL_TYPE_RIGHT);
      }
    };
    const handlePanelVisibleChange = (visible: boolean) => foundation.handlePanelVisibleChange(visible);
    const handleConfirm = () => foundation.handleConfirm();
    const handleCancel = () => foundation.handleCancel();

    const slotOrProp = (name: string) => (slots[name] ? slots[name]!() : normalizeNode((props as any)[name]));
    const hasNode = (name: string) => Boolean(slots[name]) || ((props as any)[name] !== undefined && (props as any)[name] !== null && (props as any)[name] !== false);

    /* ---------- render helpers ---------- */
    const renderFooter = (locale: any, localeCode: string) => {
      if (adapter.needConfirm()) {
        const { cachedSelectedValue } = state;
        const rangeType = /range/i.test(normalizedType.value ?? '');
        const isRangeComplete = Array.isArray(cachedSelectedValue) && (cachedSelectedValue.length === 0 || (cachedSelectedValue.length === 2 && cachedSelectedValue.every((v) => v !== null && v !== undefined)));
        const disabledConfirm = rangeType ? !isRangeComplete : false;
        return h(Footer, {
          prefixCls: props.prefixCls,
          locale,
          localeCode,
          onConfirmClick: handleConfirm,
          onCancelClick: handleCancel,
          disabledConfirm,
        });
      }
      return null;
    };

    const renderQuickControls = () => {
      const { presets, presetPosition, insetInput } = props;
      return h(QuickControl, {
        type: normalizedType.value,
        presets: presets || [],
        insetInput,
        presetPosition,
        onPresetClick: (item: PresetType, e: any) => foundation.handlePresetClick(item, e),
        locale: getLocale(),
      });
    };
    /** React passes `null` when there are no presets; QuickControl itself renders null then. */
    const quickControlsNode = () => (props.presets && props.presets.length ? renderQuickControls() : null);

    const renderDateInput = () => {
      const { insetInput, density, format, defaultPickerValue } = props;
      const { insetInputValue, value } = state;
      if (!insetInput) return null;
      return h(DateInput, {
        dateFnsLocale: getDateFnsLocale(),
        format,
        insetInputValue,
        rangeSeparator: normalizedRangeSeparator.value,
        rangeSeparatorNode: props.rangeSeparatorNode,
        type: normalizedType.value,
        value,
        handleInsetDateFocus,
        handleInsetTimeFocus,
        onInsetInputChange: handleInsetInputChange,
        rangeInputStartRef,
        rangeInputEndRef,
        density,
        defaultPickerValue,
        insetInput,
      });
    };

    const renderMonthGrid = (locale: any, localeCode: string, dateFnsLocale: any) => {
      const { multiple, max, weekStartsOn, timePickerOpts, defaultPickerValue, format, hideDisabledOptions, disabledTimePicker, renderDate, renderFullDate, startDateOffset, endDateOffset, autoSwitchDate, density, syncSwitchMonth, triggerRender, insetInput, presetPosition, yearAndMonthOpts, startYear, endYear } = props;
      const { cachedSelectedValue, rangeInputFocus } = state;
      return h(MonthsGrid, {
        ref: monthGrid,
        locale,
        localeCode,
        dateFnsLocale,
        weekStartsOn,
        type: normalizedType.value,
        multiple,
        max,
        format,
        disabledDate: disabledDisposeDate,
        hideDisabledOptions,
        disabledTimePicker,
        disabledTime: disabledDisposeTime,
        defaultValue: cachedSelectedValue as any,
        defaultPickerValue,
        timePickerOpts,
        isControlledComponent: !adapter.needConfirm() && isControlled('value'),
        onChange: handleSelectedChange,
        renderDate,
        renderFullDate,
        startDateOffset,
        endDateOffset,
        autoSwitchDate,
        density,
        rangeInputFocus,
        setRangeInputFocus: handleSetRangeFocus,
        isAnotherPanelHasOpened,
        syncSwitchMonth,
        onPanelChange: (date: any, dateStr: any) => emit('panelChange', unwrap(date), unwrap(dateStr)),
        timeZone: getTimeZone(),
        focusRecordsRef,
        triggerRender,
        insetInput,
        presetPosition,
        renderQuickControls: quickControlsNode(),
        renderDateInput: renderDateInput(),
        yearAndMonthOpts,
        startYear,
        endYear,
      });
    };

    const renderYearMonthPanel = (locale: any, localeCode: string) => {
      const { density, presetPosition, yearAndMonthOpts, startYear, endYear } = props;
      const type = normalizedType.value;
      const date = state.value[0];
      const year = { left: 0, right: 0 };
      const month = { left: 0, right: 0 };
      if (_isDate(date)) {
        year.left = date.getFullYear();
        month.left = date.getMonth() + 1;
      }
      if (type === 'monthRange') {
        const dateRight = state.value[1];
        if (_isDate(dateRight)) {
          year.right = dateRight.getFullYear();
          month.right = dateRight.getMonth() + 1;
        }
      }
      return h(YearAndMonth, {
        locale,
        localeCode,
        disabledDate: disabledDisposeDate,
        noBackBtn: true,
        monthCycled: true,
        onSelect: handleYMSelectedChange,
        currentYear: year,
        currentMonth: month,
        density,
        presetPosition,
        renderQuickControls: quickControlsNode(),
        renderDateInput: renderDateInput(),
        type,
        yearAndMonthOpts,
        startYear,
        endYear,
      });
    };

    const renderPanel = (locale: any, localeCode: string, dateFnsLocale: any) => {
      const { dropdownClassName, dropdownStyle, density, presetPosition } = props;
      const type = normalizedType.value;
      const wrapCls = classnames(
        cssClasses.PREFIX,
        {
          [cssClasses.PANEL_YAM]: adapter.typeIsYearOrMonth(),
          [`${cssClasses.PREFIX}-compact`]: density === 'compact',
        },
        dropdownClassName
      );
      const hasLeft = hasNode('leftSlot');
      const hasRight = hasNode('rightSlot');
      const hasTop = hasNode('topSlot');
      const hasBottom = hasNode('bottomSlot');
      return h('div', { ref: panelRef, class: wrapCls, style: dropdownStyle, 'x-type': type }, [
        h('div', { class: `${cssClasses.PREFIX}-container` }, [
          hasLeft ? h('div', { class: `${cssClasses.PREFIX}-leftSlot`, 'x-semi-prop': 'leftSlot' }, [slotOrProp('leftSlot')]) : null,
          h('div', [
            hasTop ? h('div', { class: `${cssClasses.PREFIX}-topSlot`, 'x-semi-prop': 'topSlot' }, [slotOrProp('topSlot')]) : null,
            presetPosition === 'top' && type !== 'monthRange' ? renderQuickControls() : null,
            adapter.typeIsYearOrMonth() ? renderYearMonthPanel(locale, localeCode) : renderMonthGrid(locale, localeCode, dateFnsLocale),
            presetPosition === 'bottom' && type !== 'monthRange' ? renderQuickControls() : null,
            hasBottom ? h('div', { class: `${cssClasses.PREFIX}-bottomSlot`, 'x-semi-prop': 'bottomSlot' }, [slotOrProp('bottomSlot')]) : null,
          ]),
          hasRight ? h('div', { class: `${cssClasses.PREFIX}-rightSlot`, 'x-semi-prop': 'rightSlot' }, [slotOrProp('rightSlot')]) : null,
        ]),
        renderFooter(locale, localeCode),
      ]);
    };

    const renderInner = (extraProps: Record<string, any>) => {
      const { clearIcon, format, multiple, disabled, showClear, insetLabelId, placeholder, validateStatus, inputStyle, triggerRender, size, inputReadOnly, rangeSeparatorNode, insetInput, defaultPickerValue, borderless } = props;
      const type = normalizedType.value;
      const locale = getLocale();
      const { value, inputValue, rangeInputFocus, triggerDisabled } = state;
      const rangeType = isRangeType(type, triggerRender);
      const inputDisabled = disabled || (Boolean(insetInput) && Boolean(triggerDisabled));
      const inputCls = classnames(`${cssClasses.PREFIX}-input`, {
        [`${cssClasses.PREFIX}-range-input`]: rangeType,
        [`${cssClasses.PREFIX}-range-input-${size}`]: rangeType && size,
        [`${cssClasses.PREFIX}-range-input-active`]: rangeType && rangeInputFocus && !inputDisabled,
        [`${cssClasses.PREFIX}-range-input-disabled`]: rangeType && inputDisabled,
        [`${cssClasses.PREFIX}-range-input-${validateStatus}`]: rangeType && validateStatus,
        [`${cssClasses.PREFIX}-borderless`]: borderless,
      });
      const phText = placeholder || _get(locale, ['placeholder', type]);
      const inputProps: Record<string, any> = {
        ...extraProps,
        showClearIgnoreDisabled: Boolean(insetInput),
        placeholder: phText,
        clearIcon,
        disabled: inputDisabled,
        inputValue,
        value,
        defaultPickerValue,
        onChange: handleInputChange,
        onEnterPress: handleInputComplete,
        block: true,
        inputStyle,
        showClear,
        insetLabel: props.insetLabel,
        insetLabelId,
        type,
        format,
        multiple,
        validateStatus,
        inputReadOnly: inputReadOnly || Boolean(insetInput),
        onBlur: handleInputBlur,
        onFocus: handleInputFocus,
        onClear: handleInputClear,
        prefix: props.prefix,
        size,
        autofocus: state.autofocus,
        dateFnsLocale: getDateFnsLocale(),
        rangeInputFocus,
        rangeSeparator: normalizedRangeSeparator.value,
        rangeSeparatorNode,
        onRangeBlur: handleRangeInputBlur,
        onRangeClear: handleRangeInputClear,
        onRangeEndTabPress: handleRangeEndTabPress,
        rangeInputStartRef: insetInput ? null : rangeInputStartRef,
        rangeInputEndRef: insetInput ? null : rangeInputEndRef,
        inputRef,
      };
      const inputSlots: Record<string, any> = {};
      ['prefix', 'insetLabel', 'rangeSeparatorNode', 'clearIcon'].forEach((name) => {
        if (slots[name]) inputSlots[name] = slots[name];
      });
      return h(
        'div',
        {
          role: 'combobox',
          'aria-label': Array.isArray(value) && value.length ? 'Change date' : 'Choose date',
          'aria-disabled': disabled,
          onClick: handleTriggerWrapperClick,
          class: inputCls,
        },
        [
          typeof triggerRender === 'function'
            ? triggerRender({ ...inputProps, value: [...value], componentName: 'DatePicker', componentProps: { ...props, type, rangeSeparator: normalizedRangeSeparator.value } })
            : h(DateInput, inputProps, inputSlots),
        ]
      );
    };

    const wrapPopover = (children: any) => {
      const { panelShow } = state;
      const { direction } = context;
      const defaultPosition = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
      const { motion, zIndex, getPopupContainer, stopPropagation, autoAdjustOverflow, dropdownMargin } = props;
      const position = normalizedPosition.value || defaultPosition;
      return h(
        Popover,
        {
          getPopupContainer,
          autoAdjustOverflow,
          zIndex,
          motion: Boolean(motion),
          margin: dropdownMargin as any,
          trigger: 'custom',
          position,
          visible: panelShow,
          stopPropagation: Boolean(stopPropagation),
          spacing: normalizedSpacing.value as any,
          onVisibleChange: handlePanelVisibleChange,
        },
        {
          default: () => children,
          content: () => renderPanel(getLocale(), getLocaleCode(), getDateFnsLocale()),
        }
      );
    };

    expose({
      open: () => foundation.open(),
      close: () => foundation.close(),
      focus: (focusType?: 'rangeStart' | 'rangeEnd') => foundation.focus(focusType),
      blur: () => foundation.blur(),
      foundation,
      monthGrid,
    });

    return () => {
      const { style, className, prefixCls } = props;
      const type = normalizedType.value;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const outerProps: Record<string, any> = {
        style: [style, attrStyle],
        class: classnames(className, attrClass, { [prefixCls]: true }),
        ref: triggerElRef,
        // Vue camelizes hyphenated prop names
        'aria-invalid': (props as any).ariaInvalid,
        'aria-errormessage': (props as any).ariaErrormessage,
        'aria-labelledby': (props as any).ariaLabelledby,
        'aria-describedby': (props as any).ariaDescribedby,
        'aria-required': (props as any).ariaRequired,
        ...getDataAttr(restAttrs),
      };
      const innerPropKeys: string[] = [];
      if (!type.toLowerCase().includes('range')) innerPropKeys.push('borderless');
      const inner = renderInner(_pick(props, innerPropKeys));
      void mounted;
      return h('div', outerProps, [wrapPopover(inner)]);
    };
  },
});

(DatePicker as any).elementType = 'DatePicker';
export default DatePicker;
