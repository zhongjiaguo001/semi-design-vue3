import { defineComponent, h, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType } from 'vue';
import classnames from 'classnames';
import { format as formatFn, isSameDay } from 'date-fns';
import MonthsGridFoundation from '@douyinfe/semi-foundation/lib/es/datePicker/monthsGridFoundation';
import { strings, numbers, cssClasses } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import { compatibleParse } from '@douyinfe/semi-foundation/lib/es/datePicker/_utils/parser';
import { getDefaultFormatTokenByType } from '@douyinfe/semi-foundation/lib/es/datePicker/_utils/getDefaultFormatToken';
import getDefaultPickerDate from '@douyinfe/semi-foundation/lib/es/datePicker/_utils/getDefaultPickerDate';
import { useBaseComponent } from '../_base/useBaseComponent';
import Navigation from './Navigation';
import Month from './Month';
import Combobox from '../timePicker/Combobox';
import YearAndMonth from './YearAndMonth';
import { IconClock, IconCalendar } from '../icons/generated';
import type { PresetPosition } from './QuickControl';

const prefixCls = cssClasses.PREFIX;
const stubFalse = () => false;
const noop = () => undefined;

export type PanelType = 'left' | 'right';

export interface MonthInfo {
  pickerDate: Date;
  showDate: Date;
  isTimePickerOpen: boolean;
  isYearPickerOpen: boolean;
}

export const monthsGridProps = {
  type: { type: String as PropType<(typeof strings.TYPE_SET)[number]>, default: 'date' },
  defaultValue: { type: Array as PropType<(Date | null)[]>, default: undefined },
  defaultPickerValue: { type: [String, Number, Date, Array] as PropType<any>, default: undefined },
  multiple: { type: Boolean, default: false },
  max: { type: Number, default: undefined },
  weekStartsOn: { type: Number, default: numbers.WEEK_START_ON },
  disabledDate: { type: Function as PropType<(date: Date, options?: any) => boolean>, default: stubFalse },
  disabledTime: { type: Function as PropType<(date: Date | Date[], panelType: PanelType) => any>, default: undefined },
  disabledTimePicker: { type: Boolean, default: undefined },
  hideDisabledOptions: { type: Boolean, default: undefined },
  navPrev: { type: [Object, Function] as PropType<any>, default: undefined },
  navNext: { type: [Object, Function] as PropType<any>, default: undefined },
  onMaxSelect: { type: Function as PropType<(v?: any) => void>, default: noop },
  timePickerOpts: { type: Object as PropType<Record<string, any>>, default: undefined },
  isControlledComponent: { type: Boolean, default: undefined },
  rangeStart: { type: String, default: '' },
  rangeInputFocus: { type: [Boolean, String] as PropType<boolean | string>, default: undefined },
  locale: { type: Object as PropType<any>, default: () => ({}) },
  localeCode: { type: String, default: undefined },
  format: { type: String, default: undefined },
  renderDate: { type: Function as PropType<(...args: any[]) => any>, default: undefined },
  renderFullDate: { type: Function as PropType<(...args: any[]) => any>, default: undefined },
  startDateOffset: { type: Function as PropType<(d?: Date) => Date>, default: undefined },
  endDateOffset: { type: Function as PropType<(d?: Date) => Date>, default: undefined },
  autoSwitchDate: { type: Boolean, default: undefined },
  density: { type: String, default: undefined },
  dateFnsLocale: { type: Object as PropType<any>, default: undefined },
  timeZone: { type: [String, Number] as PropType<string | number>, default: undefined },
  syncSwitchMonth: { type: Boolean, default: undefined },
  focusRecordsRef: { type: Object as PropType<{ current: { rangeStart: boolean; rangeEnd: boolean } }>, default: undefined },
  triggerRender: { type: Function as PropType<(props: Record<string, any>) => any>, default: undefined },
  insetInput: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: undefined },
  presetPosition: { type: String as PropType<PresetPosition>, default: undefined },
  renderQuickControls: { type: null as unknown as PropType<any>, default: undefined },
  renderDateInput: { type: null as unknown as PropType<any>, default: undefined },
  yearAndMonthOpts: { type: Object as PropType<Record<string, any>>, default: undefined },
  startYear: { type: Number, default: undefined },
  endYear: { type: Number, default: undefined },
  setRangeInputFocus: { type: Function as PropType<(rangeInputFocus: 'rangeStart' | 'rangeEnd') => void>, default: noop },
  isAnotherPanelHasOpened: { type: Function as PropType<(currentRangeInput: 'rangeStart' | 'rangeEnd') => boolean>, default: stubFalse },
};

export const monthsGridEmits = ['change', 'panelChange', 'maxSelect'];

const MonthsGrid = defineComponent({
  name: 'DatePickerMonthsGrid',
  inheritAttrs: false,
  props: monthsGridProps,
  emits: monthsGridEmits,
  setup(props, { emit, expose }) {
    const validFormat = props.format || getDefaultFormatTokenByType(props.type);
    const { nowDate, nextDate } = getDefaultPickerDate({ defaultPickerValue: props.defaultPickerValue, format: validFormat, dateFnsLocale: props.dateFnsLocale });

    const { state, adapter: baseAdapter, cache } = useBaseComponent(props as any, {
      selected: new Set<string>(),
      monthLeft: { pickerDate: nowDate, showDate: nowDate, isTimePickerOpen: false, isYearPickerOpen: false } as MonthInfo,
      monthRight: { pickerDate: nextDate, showDate: nextDate, isTimePickerOpen: false, isYearPickerOpen: false } as MonthInfo,
      maxWeekNum: 0,
      hoverDay: '',
      rangeStart: props.rangeStart,
      rangeEnd: '',
      currentPanelHeight: 0,
      offsetRangeStart: '',
      offsetRangeEnd: '',
      weeksRowNum: undefined as number | undefined,
    });

    const cacheRefCurrent = (key: string, current: any) => {
      if (typeof key === 'string' && key.length) baseAdapter.setCache(key, current);
    };

    const adapter = {
      ...baseAdapter,
      updateDaySelected: (selected: Set<string>) => {
        state.selected = selected;
      },
      setRangeStart: (rangeStart: string) => {
        state.rangeStart = rangeStart;
      },
      setRangeEnd: (rangeEnd: string) => {
        state.rangeEnd = rangeEnd;
      },
      setHoverDay: (hoverDay: string) => {
        state.hoverDay = hoverDay;
      },
      setWeeksHeight: (maxWeekNum: number) => {
        state.maxWeekNum = maxWeekNum;
      },
      setOffsetRangeStart: (offsetRangeStart: string) => {
        state.offsetRangeStart = offsetRangeStart;
      },
      setOffsetRangeEnd: (offsetRangeEnd: string) => {
        state.offsetRangeEnd = offsetRangeEnd;
      },
      updateMonthOnLeft: (v: MonthInfo) => {
        state.monthLeft = v;
      },
      updateMonthOnRight: (v: MonthInfo) => {
        state.monthRight = v;
      },
      notifySelectedChange: (value: any, options?: any) => emit('change', value, options),
      notifyMaxLimit: (v?: any) => {
        props.onMaxSelect && props.onMaxSelect(v);
        emit('maxSelect', v);
      },
      notifyPanelChange: (date: any, dateString: any) => emit('panelChange', date, dateString),
      setRangeInputFocus: (rangeInputFocus: 'rangeStart' | 'rangeEnd') => props.setRangeInputFocus(rangeInputFocus),
      isAnotherPanelHasOpened: (currentRangeInput: 'rangeStart' | 'rangeEnd') => props.isAnotherPanelHasOpened(currentRangeInput),
    };
    const foundation = new (MonthsGridFoundation as any)(adapter);
    // React calls foundation.init() in componentDidMount; init synchronously so the
    // first render reflects the selected value.
    foundation.init();
    onMounted(() => undefined);
    onBeforeUnmount(() => foundation.destroy());

    const leftIsYearOrTime = (s?: any) => {
      const { monthLeft } = s || state;
      return Boolean(monthLeft && (monthLeft.isTimePickerOpen || monthLeft.isYearPickerOpen));
    };
    const rightIsYearOrTime = (s?: any) => {
      const { monthRight } = s || state;
      return Boolean(monthRight && (monthRight.isTimePickerOpen || monthRight.isYearPickerOpen));
    };

    const calcScrollListHeight = () => {
      const wrapLeft = baseAdapter.getCache(`wrap-${strings.PANEL_TYPE_LEFT}`);
      const wrapRight = baseAdapter.getCache(`wrap-${strings.PANEL_TYPE_RIGHT}`);
      const switchLeft = baseAdapter.getCache(`switch-${strings.PANEL_TYPE_LEFT}`);
      const switchRight = baseAdapter.getCache(`switch-${strings.PANEL_TYPE_RIGHT}`);
      const leftRect = wrapLeft && wrapLeft.getBoundingClientRect();
      const rightRect = wrapRight && wrapRight.getBoundingClientRect();
      let leftHeight = (leftRect && leftRect.height) || 0;
      let rightHeight = (rightRect && rightRect.height) || 0;
      if (switchLeft) leftHeight += switchLeft.getBoundingClientRect().height;
      if (switchRight) rightHeight += switchRight.getBoundingClientRect().height;
      return Math.max(leftHeight, rightHeight);
    };

    const reselect = () => {
      const refKeys = [`timepicker-${strings.PANEL_TYPE_LEFT}`, `timepicker-${strings.PANEL_TYPE_RIGHT}`, `yam-${strings.PANEL_TYPE_LEFT}`, `yam-${strings.PANEL_TYPE_RIGHT}`];
      refKeys.forEach((key) => {
        const current = baseAdapter.getCache(key);
        if (current && typeof current.reselect === 'function') current.reselect();
      });
    };

    const handleWeeksRowNumChange = (weeksRowNum: number, panelType: PanelType) => {
      const isLeft = panelType === strings.PANEL_TYPE_RIGHT;
      const isRight = panelType === strings.PANEL_TYPE_RIGHT;
      const allIsYearOrTime = leftIsYearOrTime() && rightIsYearOrTime();
      if (foundation.isRangeType() && !allIsYearOrTime) {
        baseAdapter.setState({ weeksRowNum, currentPanelHeight: calcScrollListHeight() } as any, () => {
          if ((leftIsYearOrTime() && isRight) || (rightIsYearOrTime() && isLeft)) reselect();
        });
      }
    };

    // componentDidUpdate
    watch(
      () => props.defaultValue,
      (defaultValue, prev) => {
        if (prev !== defaultValue) foundation.updateSelectedFromProps(defaultValue);
      }
    );
    watch(
      () => props.defaultPickerValue,
      () => foundation.initDefaultPickerValue()
    );
    watch(
      () => [state.monthLeft, state.monthRight],
      ([monthLeft, monthRight], [prevLeft, prevRight]) => {
        if (!foundation.isRangeType()) return;
        const prevState = { monthLeft: prevLeft, monthRight: prevRight };
        const prevAll = leftIsYearOrTime(prevState) && rightIsYearOrTime(prevState);
        const prevSome = (leftIsYearOrTime(prevState) && !rightIsYearOrTime(prevState)) || (!leftIsYearOrTime(prevState) && rightIsYearOrTime(prevState));
        const nowAll = leftIsYearOrTime() && rightIsYearOrTime();
        const nowSome = (leftIsYearOrTime() && !rightIsYearOrTime()) || (!leftIsYearOrTime() && rightIsYearOrTime());
        if (prevSome && nowAll) {
          baseAdapter.setState({ currentPanelHeight: calcScrollListHeight() } as any, reselect);
        } else if (prevAll && nowSome) {
          nextTick(reselect);
        }
        void monthLeft;
        void monthRight;
      },
      { flush: 'post' }
    );

    const showYearPicker = (panelType: PanelType, e: MouseEvent) => {
      e && e.stopImmediatePropagation && e.stopImmediatePropagation();
      foundation.showYearPicker(panelType);
    };

    const renderMonth = (month: Date, panelType: PanelType) => {
      const { selected, rangeStart, rangeEnd, hoverDay, maxWeekNum, offsetRangeStart, offsetRangeEnd } = state;
      const { weekStartsOn, disabledDate, locale, localeCode, renderDate, renderFullDate, startDateOffset, endDateOffset, density, rangeInputFocus, syncSwitchMonth, multiple } = props;
      let monthText = '';
      if (month) {
        const yearNumber = formatFn(month, 'yyyy');
        const monthNumber = formatFn(month, 'L');
        const mText = locale && locale.months ? locale.months[monthNumber] : monthNumber;
        const monthFormatToken = (locale && locale.monthText) || '${year}-${month}';
        monthText = monthFormatToken.replace('${year}', yearNumber).replace('${month}', mText);
      }
      let style: any = {};
      const detail = panelType === strings.PANEL_TYPE_RIGHT ? state.monthRight : state.monthLeft;
      const isRangeType = foundation.isRangeType();
      const shouldBimonthSwitch = isRangeType && syncSwitchMonth;
      if (isRangeType && detail && (detail.isYearPickerOpen || detail.isTimePickerOpen)) {
        style = { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' };
      }
      return h('div', { ref: (el: any) => cacheRefCurrent(`wrap-${panelType}`, el), style }, [
        h(Navigation, {
          forwardRef: (el: any) => cacheRefCurrent(`nav-${panelType}`, el),
          monthText,
          density,
          onMonthClick: (e: MouseEvent) => showYearPicker(panelType, e),
          onPrevMonth: () => foundation.prevMonth(panelType),
          onNextMonth: () => foundation.nextMonth(panelType),
          onNextYear: () => foundation.nextYear(panelType),
          onPrevYear: () => foundation.prevYear(panelType),
          shouldBimonthSwitch: Boolean(shouldBimonthSwitch),
          panelType,
        }),
        h(Month, {
          locale,
          localeCode,
          forwardRef: (el: any) => cacheRefCurrent(`month-${panelType}`, el),
          disabledDate,
          weekStartsOn,
          month,
          selected,
          rangeStart,
          rangeEnd,
          rangeInputFocus: rangeInputFocus as any,
          offsetRangeStart,
          offsetRangeEnd,
          hoverDay,
          weeksRowNum: maxWeekNum,
          renderDate,
          renderFullDate,
          onDayClick: (day: any) => foundation.handleDayClick(day, panelType),
          onDayHover: (day: any) => foundation.handleDayHover(day, panelType),
          onWeeksRowNumChange: (weeksRowNum: number) => handleWeeksRowNumChange(weeksRowNum, panelType),
          startDateOffset,
          endDateOffset,
          focusRecordsRef: props.focusRecordsRef,
          multiple,
        }),
      ]);
    };

    const renderTimePicker = (panelType: PanelType, panelDetail: MonthInfo) => {
      const { type, locale, format, hideDisabledOptions, timePickerOpts, dateFnsLocale } = props;
      const { pickerDate } = panelDetail;
      const timePanelCls = classnames(`${prefixCls}-time`);
      const restProps: Record<string, any> = { ...timePickerOpts, hideDisabledOptions };
      const disabledOptions = foundation.calcDisabledTime(panelType);
      if (disabledOptions) {
        ['disabledHours', 'disabledMinutes', 'disabledSeconds'].forEach((key) => {
          if (disabledOptions[key]) restProps[key] = disabledOptions[key];
        });
      }
      const { rangeStart, rangeEnd } = state;
      const dateFormat = foundation.getValidDateFormat();
      let startDate: Date, endDate: Date;
      if (
        type === 'dateTimeRange' &&
        rangeStart &&
        rangeEnd &&
        isSameDay((startDate = compatibleParse(rangeStart, dateFormat, undefined, dateFnsLocale)), (endDate = compatibleParse(rangeEnd, dateFormat, undefined, dateFnsLocale)))
      ) {
        if (panelType === strings.PANEL_TYPE_RIGHT) {
          rangeStart && (restProps.startDate = startDate);
        } else {
          rangeEnd && (restProps.endDate = endDate);
        }
      }
      const placeholder = locale && locale.selectTime;
      return h('div', { class: timePanelCls }, [
        h(Combobox, {
          ref: (current: any) => cacheRefCurrent(`timepicker-${panelType}`, current),
          panelHeader: placeholder,
          format: format || strings.FORMAT_TIME_PICKER,
          timeStampValue: pickerDate,
          onChange: (newTime: any) => foundation.handleTimeChange(newTime, panelType),
          ...restProps,
        }),
      ]);
    };

    const renderYearAndMonth = (panelType: PanelType, panelDetail: MonthInfo) => {
      const { pickerDate } = panelDetail;
      const { locale, localeCode, density, yearAndMonthOpts, startYear, endYear } = props;
      const y = pickerDate.getFullYear();
      const m = pickerDate.getMonth() + 1;
      return h(YearAndMonth, {
        ref: (current: any) => cacheRefCurrent(`yam-${panelType}`, current),
        locale,
        localeCode,
        currentYear: { left: y, right: 0 },
        currentMonth: { left: m, right: 0 },
        onSelect: (item: any) => foundation.toYearMonth(panelType, new Date(item.currentYear.left, item.currentMonth.left - 1)),
        onBackToMain: () => {
          foundation.showDatePanel(panelType);
          const wrapCurrent = baseAdapter.getCache(`wrap-${panelType}`);
          if (wrapCurrent) wrapCurrent.style.height = 'auto';
        },
        density,
        yearAndMonthOpts,
        startYear,
        endYear,
      });
    };

    const renderSwitch = (panelType: PanelType) => {
      const { rangeStart, rangeEnd, monthLeft, monthRight } = state;
      const { type, locale, disabledTimePicker, density, dateFnsLocale, insetInput } = props;
      if (!type.includes('Time') || insetInput) return null;
      const FORMAT_SWITCH_DATE = (locale && locale.localeFormatToken && locale.localeFormatToken.FORMAT_SWITCH_DATE) || 'yyyy-MM-dd';
      const formatTimePicker = foundation.getValidTimeFormat();
      const dateFormat = foundation.getValidDateFormat();
      let panelDetail: MonthInfo;
      let dateText: string;
      if (panelType === strings.PANEL_TYPE_LEFT) {
        panelDetail = monthLeft;
        dateText = rangeStart ? formatFn(compatibleParse(rangeStart, dateFormat, undefined, dateFnsLocale), FORMAT_SWITCH_DATE) : '';
      } else {
        panelDetail = monthRight;
        dateText = rangeEnd ? formatFn(compatibleParse(rangeEnd, dateFormat, undefined, dateFnsLocale), FORMAT_SWITCH_DATE) : '';
      }
      const { isTimePickerOpen, showDate } = panelDetail;
      const monthText = showDate ? formatFn(showDate, FORMAT_SWITCH_DATE) : '';
      const timeText = showDate ? formatFn(showDate, formatTimePicker) : '';
      const showSwitchIcon = ['default'].includes(density as string);
      const switchCls = classnames(`${prefixCls}-switch`);
      const dateCls = classnames({ [`${prefixCls}-switch-date`]: true, [`${prefixCls}-switch-date-active`]: !isTimePickerOpen });
      const timeCls = classnames({
        [`${prefixCls}-switch-time`]: true,
        [`${prefixCls}-switch-time-disabled`]: disabledTimePicker,
        [`${prefixCls}-switch-date-active`]: isTimePickerOpen,
      });
      const textCls = classnames(`${prefixCls}-switch-text`);
      return h('div', { class: switchCls, ref: (el: any) => baseAdapter.setCache(`switch-${panelType}`, el) }, [
        h('div', { role: 'button', 'aria-label': 'Switch to date panel', class: dateCls, onClick: () => foundation.showDatePanel(panelType) }, [
          showSwitchIcon ? h(IconCalendar, { 'aria-hidden': true }) : null,
          h('span', { class: textCls }, dateText || monthText),
        ]),
        h('div', { role: 'button', 'aria-label': 'Switch to time panel', class: timeCls, onClick: () => foundation.showTimePicker(panelType, true) }, [
          showSwitchIcon ? h(IconClock, { 'aria-hidden': true }) : null,
          h('span', { class: textCls }, timeText),
        ]),
      ]);
    };

    const renderPanel = (month: Date, panelType: PanelType) => {
      let monthCls = classnames(`${prefixCls}-month-grid-${panelType}`);
      const { monthLeft, monthRight, currentPanelHeight } = state;
      const { insetInput } = props;
      const panelDetail = panelType === strings.PANEL_TYPE_RIGHT ? monthRight : monthLeft;
      const { isTimePickerOpen, isYearPickerOpen } = panelDetail;
      const panelContent = renderMonth(month, panelType);
      const yearAndMonthLayer = isYearPickerOpen ? h('div', { class: `${prefixCls}-yam` }, [renderYearAndMonth(panelType, panelDetail)]) : null;
      const timePickerLayer = isTimePickerOpen ? h('div', { class: `${prefixCls}-tpk` }, [renderTimePicker(panelType, panelDetail)]) : null;
      const style: any = {};
      const wrapLeft = baseAdapter.getCache(`wrap-${strings.PANEL_TYPE_LEFT}`);
      const wrapRight = baseAdapter.getCache(`wrap-${strings.PANEL_TYPE_RIGHT}`);
      const wrap = panelType === strings.PANEL_TYPE_RIGHT ? wrapRight : wrapLeft;
      if (foundation.isRangeType()) {
        if ((isYearPickerOpen || isTimePickerOpen) && wrap) {
          style.minWidth = `${wrap.getBoundingClientRect().width}px`;
        }
        if (leftIsYearOrTime() && rightIsYearOrTime() && !insetInput) {
          const mh = currentPanelHeight ? currentPanelHeight : calcScrollListHeight();
          style.minHeight = `${mh}px`;
        }
      } else if (props.type !== 'year' && props.type !== 'month' && (isTimePickerOpen || isYearPickerOpen)) {
        monthCls = classnames(monthCls, `${prefixCls}-yam-showing`);
      }
      const _isDatePanelOpen = !(isYearPickerOpen || isTimePickerOpen);
      const xOpenType = _isDatePanelOpen ? 'date' : isYearPickerOpen ? 'year' : 'time';
      return h('div', { class: monthCls, key: panelType, style, 'x-open-type': xOpenType }, [
        yearAndMonthLayer,
        timePickerLayer,
        foundation.isRangeType() ? panelContent : isYearPickerOpen || isTimePickerOpen ? null : panelContent,
        renderSwitch(panelType),
      ]);
    };

    expose({ foundation, reselect, state, cache });

    return () => {
      const { monthLeft, monthRight } = state;
      const { type, insetInput, presetPosition, renderQuickControls, renderDateInput } = props;
      const monthGridCls = classnames({ [`${prefixCls}-month-grid`]: true });
      const panelTypeLeft = strings.PANEL_TYPE_LEFT as PanelType;
      const panelTypeRight = strings.PANEL_TYPE_RIGHT as PanelType;
      let content: any = null;
      if (type === 'date' || type === 'dateTime') {
        content = renderPanel(monthLeft.pickerDate, panelTypeLeft);
      } else if (type === 'dateRange' || type === 'dateTimeRange') {
        content = [renderPanel(monthLeft.pickerDate, panelTypeLeft), renderPanel(monthRight.pickerDate, panelTypeRight)];
      } else if (type === 'year' || type === 'month') {
        content = 'year month';
      }
      const yearOpenType = foundation.getYAMOpenType();
      const quick = typeof renderQuickControls === 'function' ? renderQuickControls() : renderQuickControls;
      const dateInput = typeof renderDateInput === 'function' ? renderDateInput() : renderDateInput;
      return h('div', { style: { display: 'flex' } }, [
        presetPosition === 'left' ? quick : null,
        h('div', [
          dateInput,
          h(
            'div',
            {
              class: monthGridCls,
              'x-type': type,
              'x-panel-yearandmonth-open-type': yearOpenType,
              'x-insetinput': insetInput ? 'true' : 'false',
              'x-preset-position': quick === null || quick === undefined ? 'null' : presetPosition,
              ref: (el: any) => cacheRefCurrent('monthGrid', el),
            },
            content
          ),
        ]),
        presetPosition === 'right' ? quick : null,
      ]);
    };
  },
});

export default MonthsGrid;
