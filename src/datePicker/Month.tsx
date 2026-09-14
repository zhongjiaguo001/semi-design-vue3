import { defineComponent, h, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import _isFunction from 'lodash/isFunction';
import classNames from 'classnames';
import MonthFoundation from '@douyinfe/semi-foundation/lib/es/datePicker/monthFoundation';
import { cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import { isBefore, isAfter, isBetween, isSameDay } from '@douyinfe/semi-foundation/lib/es/datePicker/_utils/index';
import { parseISO } from 'date-fns';
import { useBaseComponent } from '../_base/useBaseComponent';

const prefixCls = cssClasses.PREFIX;

export interface MonthDayInfo {
  dayNumber: number | string;
  dayNumberFull?: string;
  fullDate: string;
}

export interface DayStatusType {
  isToday?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isSelectedStart?: boolean;
  isSelectedEnd?: boolean;
  isInRange?: boolean;
  isHover?: boolean;
  isOffsetRangeStart?: boolean;
  isOffsetRangeEnd?: boolean;
  isHoverInOffsetRange?: boolean;
  [key: string]: any;
}

const stubFalse = () => false;

export const monthProps = {
  month: { type: Date as PropType<Date>, default: () => new Date() },
  selected: { type: Object as PropType<Set<string>>, default: () => new Set<string>() },
  rangeStart: { type: String, default: '' },
  rangeEnd: { type: String, default: '' },
  offsetRangeStart: { type: String, default: '' },
  offsetRangeEnd: { type: String, default: '' },
  weekStartsOn: { type: Number, default: numbers.WEEK_START_ON },
  disabledDate: { type: Function as PropType<(date: Date, options?: any) => boolean>, default: stubFalse },
  weeksRowNum: { type: Number, default: 0 },
  renderDate: { type: Function as PropType<(dayNumber?: number | string, fullDate?: string) => any>, default: undefined },
  renderFullDate: { type: Function as PropType<(dayNumber?: number | string, fullDate?: string, dayStatus?: DayStatusType) => any>, default: undefined },
  hoverDay: { type: String, default: '' },
  startDateOffset: { type: Function as PropType<(d?: Date) => Date>, default: undefined },
  endDateOffset: { type: Function as PropType<(d?: Date) => Date>, default: undefined },
  rangeInputFocus: { type: [String, Boolean] as PropType<'rangeStart' | 'rangeEnd' | false>, default: undefined },
  focusRecordsRef: { type: Object as PropType<{ current: { rangeStart: boolean; rangeEnd: boolean } }>, default: undefined },
  locale: { type: Object as PropType<any>, default: () => ({}) },
  localeCode: { type: String, default: undefined },
  multiple: { type: Boolean, default: false },
  forwardRef: { type: Function as PropType<(el: HTMLElement | null) => void>, default: undefined },
};

export const monthEmits = ['dayClick', 'dayHover', 'weeksRowNumChange'];

const Month = defineComponent({
  name: 'DatePickerMonth',
  inheritAttrs: false,
  props: monthProps,
  emits: monthEmits,
  setup(props, { emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      weekdays: [] as string[],
      month: { weeks: [] as MonthDayInfo[][], monthText: '' } as any,
      todayText: '',
      weeksRowNum: props.weeksRowNum as number | undefined,
    });

    const adapter = {
      ...baseAdapter,
      updateToday: (todayText: string) => {
        state.todayText = todayText;
      },
      setWeekDays: (weekdays: string[]) => {
        state.weekdays = weekdays;
      },
      setWeeksRowNum: (weeksRowNum: number, callback?: () => void) => baseAdapter.setState({ weeksRowNum } as any, callback),
      updateMonthTable: (month: any) => {
        state.month = month;
      },
      notifyDayClick: (day: MonthDayInfo) => emit('dayClick', day),
      notifyDayHover: (day?: MonthDayInfo) => emit('dayHover', day),
      notifyWeeksRowNumChange: (weeksRowNum: number) => emit('weeksRowNumChange', weeksRowNum),
    };
    const foundation = new (MonthFoundation as any)(adapter);
    // React inits the foundation in componentDidMount; we init synchronously so the
    // first render already contains the month table (same visible result).
    foundation.init();
    onMounted(() => undefined);
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => [props.month, props.weekStartsOn],
      ([month], [prevMonth]) => {
        if (prevMonth !== month) foundation.getMonthTable();
      }
    );

    const getSingleDayStatus = (options: any) => {
      const { rangeInputFocus } = props;
      const { fullDate, todayText, selected, disabledDate, rangeStart, rangeEnd } = options;
      const disabledOptions = { rangeStart, rangeEnd, rangeInputFocus };
      const isToday = fullDate === todayText;
      const isSelected = selected.has(fullDate);
      let isDisabled = disabledDate && disabledDate(parseISO(fullDate), disabledOptions);
      if (!isDisabled && props.rangeInputFocus === 'rangeStart' && rangeEnd && props.focusRecordsRef && props.focusRecordsRef.current.rangeEnd) {
        isDisabled = isAfter(fullDate, rangeEnd.trim().split(/\s+/)[0]);
      }
      if (!isDisabled && props.rangeInputFocus === 'rangeEnd' && rangeStart && props.focusRecordsRef && props.focusRecordsRef.current.rangeStart) {
        isDisabled = isBefore(fullDate, rangeStart.trim().split(/\s+/)[0]);
      }
      return { isToday, isSelected, isDisabled };
    };

    const getDateRangeStatus = (options: any) => {
      const { rangeStart, rangeEnd, fullDate, hoverDay, offsetRangeStart, offsetRangeEnd, rangeInputFocus } = options;
      const _isDateRangeAnySelected = Boolean(rangeStart || rangeEnd);
      const _isDateRangeSelected = Boolean(rangeStart && rangeEnd);
      const _isOffsetDateRangeAnyExist = offsetRangeStart || offsetRangeEnd;
      if (!_isDateRangeAnySelected) return {};
      const _isHoverDay = isSameDay(hoverDay, fullDate);
      let _isHoverAfterStart: any, _isHoverBeforeEnd: any, isSelectedStart: any, isSelectedEnd: any, isHoverDayAroundOneSelected: any;
      if (rangeStart) {
        isSelectedStart = isSameDay(fullDate, rangeStart);
        if (rangeInputFocus === 'rangeEnd') {
          _isHoverAfterStart = isBetween(fullDate, { start: rangeStart, end: hoverDay });
        }
      }
      if (rangeEnd) {
        isSelectedEnd = isSameDay(fullDate, rangeEnd);
        if (rangeInputFocus === 'rangeStart') {
          _isHoverBeforeEnd = isBetween(fullDate, { start: hoverDay, end: rangeEnd });
        }
      }
      if (!_isDateRangeSelected && _isDateRangeAnySelected) {
        isHoverDayAroundOneSelected = _isHoverDay;
      }
      let isHover: any;
      if (!_isOffsetDateRangeAnyExist) {
        isHover = _isHoverAfterStart || _isHoverBeforeEnd || _isHoverDay;
      }
      let isInRange: any, isSelectedStartAfterHover: any, isSelectedEndBeforeHover: any, isHoverDayInStartSelection: any, isHoverDayInEndSelection: any, isHoverDayInRange: any;
      if (_isDateRangeSelected) {
        isInRange = isBetween(fullDate, { start: rangeStart, end: rangeEnd });
        if (!_isOffsetDateRangeAnyExist) {
          isSelectedStartAfterHover = isSelectedStart && isAfter(rangeStart, hoverDay);
          isSelectedEndBeforeHover = isSelectedEnd && isBefore(rangeEnd, hoverDay);
          isHoverDayInStartSelection = _isHoverDay && rangeInputFocus === 'rangeStart';
          isHoverDayInEndSelection = _isHoverDay && rangeInputFocus === 'rangeEnd';
          isHoverDayInRange = _isHoverDay && isBetween(hoverDay, { start: rangeStart, end: rangeEnd });
        }
      }
      return {
        isHoverDay: _isHoverDay,
        isSelectedStart,
        isSelectedEnd,
        isInRange,
        isHover,
        isSelectedStartAfterHover,
        isSelectedEndBeforeHover,
        isHoverDayInRange,
        isHoverDayInStartSelection,
        isHoverDayInEndSelection,
        isHoverDayAroundOneSelected,
      };
    };

    const getOffsetDateStatus = (options: any) => {
      const { offsetRangeStart, offsetRangeEnd, rangeStart, rangeEnd, fullDate, hoverDay } = options;
      const _isOffsetDateRangeNull = !(offsetRangeStart || offsetRangeEnd);
      if (_isOffsetDateRangeNull) return {};
      const _isInRange = isBetween(fullDate, { start: rangeStart, end: rangeEnd });
      const _isHoverDay = isSameDay(hoverDay, fullDate);
      const _isSelectedStart = rangeStart && isSameDay(fullDate, rangeStart);
      const _isSelectedEnd = rangeEnd && isSameDay(fullDate, rangeEnd);
      const _isDateRangeSelected = Boolean(rangeStart && rangeEnd);
      const isOffsetRangeStart = isSameDay(fullDate, offsetRangeStart);
      const isOffsetRangeEnd = isSameDay(fullDate, offsetRangeEnd);
      const isHoverDayOffset = _isHoverDay;
      let isHoverInOffsetRange: any, isInOffsetRange: any;
      if (_isDateRangeSelected) {
        isHoverInOffsetRange = _isInRange && _isHoverDay;
      }
      const _isOffsetDateRangeSelected = Boolean(offsetRangeStart && offsetRangeEnd);
      if (_isOffsetDateRangeSelected) {
        isInOffsetRange = _isSelectedStart || isBetween(fullDate, { start: offsetRangeStart, end: offsetRangeEnd }) || _isSelectedEnd;
      }
      return { isOffsetRangeStart, isOffsetRangeEnd, isHoverInOffsetRange, isHoverDayOffset, isInOffsetRange };
    };

    const getDayStatus = (currentDay: MonthDayInfo, options: any): DayStatusType => {
      const { fullDate } = currentDay;
      const { hoverDay, rangeStart, rangeEnd, todayText, offsetRangeStart, offsetRangeEnd, disabledDate, selected, rangeInputFocus } = options;
      const singleDayStatus = getSingleDayStatus({ fullDate, todayText, hoverDay, selected, disabledDate, rangeStart, rangeEnd });
      const dateRangeStatus = getDateRangeStatus({ fullDate, rangeStart, rangeEnd, hoverDay, offsetRangeStart, offsetRangeEnd, rangeInputFocus, ...singleDayStatus });
      const offsetDataStatus = getOffsetDateStatus({ offsetRangeStart, offsetRangeEnd, rangeStart, rangeEnd, fullDate, hoverDay, ...singleDayStatus, ...dateRangeStatus });
      return { ...singleDayStatus, ...dateRangeStatus, ...offsetDataStatus };
    };

    const renderDayOfWeek = () => {
      const { locale } = props;
      const weekdayCls = classNames(cssClasses.WEEKDAY);
      const weekdayItemCls = classNames(`${prefixCls}-weekday-item`);
      const { weekdays } = state;
      const weeksLocale = (locale && locale.weeks) || {};
      const weekdaysText = weekdays.map((key) => weeksLocale[key]);
      return h(
        'div',
        { role: 'row', class: weekdayCls },
        weekdaysText.map((E: string, i: number) => h('div', { role: 'columnheader', key: E + i, class: weekdayItemCls }, E))
      );
    };

    const renderDay = (day: MonthDayInfo, dayIndex: number) => {
      const { todayText } = state;
      const { renderFullDate, renderDate } = props;
      const { fullDate, dayNumber } = day;
      if (!fullDate) {
        return h('div', { role: 'gridcell', tabindex: -1, key: `${dayNumber}${dayIndex}`, class: cssClasses.DAY }, [h('span')]);
      }
      const dayStatus = getDayStatus(day, { todayText, ...props });
      const dayCls = classNames(cssClasses.DAY, {
        [cssClasses.DAY_TODAY]: dayStatus.isToday,
        [cssClasses.DAY_IN_RANGE]: dayStatus.isInRange,
        [cssClasses.DAY_HOVER]: dayStatus.isHover,
        [cssClasses.DAY_SELECTED]: dayStatus.isSelected,
        [cssClasses.DAY_SELECTED_START]: dayStatus.isSelectedStart,
        [cssClasses.DAY_SELECTED_END]: dayStatus.isSelectedEnd,
        [cssClasses.DAY_DISABLED]: dayStatus.isDisabled,
        [cssClasses.DAY_HOVER_DAY]: dayStatus.isHoverDayOffset,
        [cssClasses.DAY_IN_OFFSET_RANGE]: dayStatus.isInOffsetRange,
        [cssClasses.DAY_SELECTED_RANGE_HOVER]: dayStatus.isHoverInOffsetRange,
        [cssClasses.DAY_OFFSET_RANGE_START]: dayStatus.isOffsetRangeStart,
        [cssClasses.DAY_OFFSET_RANGE_END]: dayStatus.isOffsetRangeEnd,
        [cssClasses.DAY_SELECTED_START_AFTER_HOVER]: dayStatus.isSelectedStartAfterHover,
        [cssClasses.DAY_SELECTED_END_BEFORE_HOVER]: dayStatus.isSelectedEndBeforeHover,
        [cssClasses.DAY_HOVER_DAY_BEFORE_RANGE]: dayStatus.isHoverDayInStartSelection,
        [cssClasses.DAY_HOVER_DAY_AFTER_RANGE]: dayStatus.isHoverDayInEndSelection,
        [cssClasses.DAY_HOVER_DAY_AROUND_SINGLE_SELECTED]: dayStatus.isHoverDayAroundOneSelected,
      });
      const dayMainCls = classNames({ [`${cssClasses.DAY}-main`]: true });
      const customRender = _isFunction(renderFullDate);
      return h(
        'div',
        {
          role: 'gridcell',
          tabindex: dayStatus.isDisabled ? -1 : 0,
          'aria-disabled': dayStatus.isDisabled,
          'aria-selected': dayStatus.isSelected,
          'aria-label': fullDate,
          class: !customRender ? dayCls : cssClasses.DAY,
          title: fullDate,
          key: `${dayNumber}${dayIndex}`,
          onClick: () => !dayStatus.isDisabled && foundation.handleClick(day),
          onMouseenter: () => foundation.handleHover(day),
          onMouseleave: () => foundation.handleHover(),
        },
        customRender ? [renderFullDate!(dayNumber, fullDate, dayStatus)] : [h('div', { class: dayMainCls }, [_isFunction(renderDate) ? renderDate!(dayNumber, fullDate) : h('span', dayNumber as any)])]
      );
    };

    const renderWeek = (week: MonthDayInfo[], weekIndex: number) =>
      h('div', { role: 'row', class: cssClasses.WEEK, key: weekIndex }, week.map((day, dayIndex) => renderDay(day, dayIndex)));

    const renderWeeks = () => {
      const { month } = state;
      const { weeks } = month;
      const { weeksRowNum } = props;
      let style: any = {};
      if (weeksRowNum) {
        style = { height: `${weeksRowNum * numbers.WEEK_HEIGHT}px` };
      }
      return h('div', { class: classNames(cssClasses.WEEKS), style }, (weeks || []).map((week: MonthDayInfo[], i: number) => renderWeek(week, i)));
    };

    expose({ foundation, getDayStatus });

    return () => {
      const { forwardRef, multiple } = props;
      return h(
        'div',
        { role: 'grid', 'aria-multiselectable': multiple, ref: (el: any) => forwardRef && forwardRef(el), class: classNames(cssClasses.MONTH) },
        [renderDayOfWeek(), renderWeeks()]
      );
    };
  },
});

export default Month;
