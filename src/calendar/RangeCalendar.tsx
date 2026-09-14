import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import _isEqual from 'lodash/isEqual';
import cls from 'classnames';
import CalendarFoundation from '@douyinfe/semi-foundation/lib/es/calendar/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/calendar/constants';
import { calcRowHeight } from '@douyinfe/semi-foundation/lib/es/calendar/eventUtil';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, toPx } from '../_utils';
import DayCol from './DayCol';
import TimeCol from './TimeCol';
import { baseCalendarProps, calendarEmits } from './props';

const toPercent = (num: number) => {
  const res = num < 1 ? num * 100 : 100;
  return `${res}%`;
};
const prefixCls = `${cssClasses.PREFIX}-week`;
const allDayCls = `${cssClasses.PREFIX}-all-day`;

export const rangeCalendarProps = {
  ...baseCalendarProps,
  mode: { type: String, default: 'range' },
};

const RangeCalendar = defineComponent({
  name: 'RangeCalendar',
  inheritAttrs: false,
  props: rangeCalendarProps,
  emits: calendarEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { locale, dateFnsLocale } = useLocale('Calendar');
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      scrollHeight: 0,
      parsedEvents: { day: new Map<string, any[]>(), allDay: new Map<string, any[]>() } as any,
      cachedKeys: [] as string[],
    });
    const dom = ref<HTMLElement | null>(null);
    const scrollDom = ref<HTMLElement | null>(null);
    let rangeData: any = { month: '', week: [] };

    const adapter = {
      ...baseAdapter,
      setRangeData: (data: any) => {
        rangeData = data;
      },
      getRangeData: () => rangeData,
      updateScrollHeight: (scrollHeight: number) => {
        state.scrollHeight = scrollHeight;
      },
      setParsedEvents: (parsedEvents: any) => {
        state.parsedEvents = parsedEvents;
      },
      cacheEventKeys: (cachedKeys: string[]) => {
        state.cachedKeys = cachedKeys;
      },
    };
    const foundation = new (CalendarFoundation as any)(adapter);

    onMounted(() => {
      foundation.init();
      const scrollHeight = scrollDom.value ? scrollDom.value.scrollHeight : 0;
      if (dom.value) dom.value.scrollTop = props.scrollTop;
      foundation.notifyScrollHeight(scrollHeight);
      foundation.parseRangeEvents();
    });
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => [props.events.map((e) => e.key), props.range] as const,
      ([keys, range], [, prevRange]) => {
        if (!_isEqual(state.cachedKeys, keys) || !_isEqual(prevRange, range)) {
          foundation.parseRangeEvents();
        }
      }
    );

    const handleClick = (e: MouseEvent, val: any) => {
      const value = foundation.formatCbValue(val);
      emit('click', e, value);
    };

    const renderDayGrid = () => {
      const { parsedEvents } = state;
      const events: Map<string, any[]> = parsedEvents.day;
      const { week } = rangeData;
      const { markWeekend, dateGridRender, minEventHeight } = props;
      return week.map((day: any) => {
        const dateString = day.date.toString();
        const dayEvents = events.has(dateString) ? events.get(dateString) : [];
        const parsed = foundation.getParseDailyEvents(dayEvents, day.date);
        return h(DayCol, {
          key: `${dateString}-weekday`,
          displayValue: day.date,
          scrollHeight: state.scrollHeight,
          handleClick,
          events: parsed.day,
          showCurrTime: props.showCurrTime,
          isWeekend: Boolean(markWeekend && day.isWeekend),
          dateGridRender: slots.dateGrid ? (ds: string, d: Date) => slots.dateGrid!({ dateString: ds, date: d }) : dateGridRender,
          minEventHeight: minEventHeight ?? Number.MIN_SAFE_INTEGER,
        });
      });
    };

    const renderHeader = () => {
      const { markWeekend, range, renderDateDisplay } = props;
      const { month, week } = foundation.getRangeData(range![0], dateFnsLocale.value);
      return h('div', { class: `${prefixCls}-header` }, [
        h('ul', { class: `${cssClasses.PREFIX}-tag ${prefixCls}-tag ${prefixCls}-sticky-left` }, [h('span', month)]),
        h('div', { role: 'gridcell', class: `${prefixCls}-grid` }, [
          h(
            'ul',
            { class: `${prefixCls}-grid-row` },
            week.map((day: any) => {
              const { date, dayString, weekday, isToday } = day;
              const listCls = cls({
                [`${cssClasses.PREFIX}-today`]: isToday,
                [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend,
              });
              const dateContent = slots.dateDisplay
                ? slots.dateDisplay({ date })
                : renderDateDisplay
                  ? normalizeNode(renderDateDisplay(date))
                  : [h('span', { class: `${cssClasses.PREFIX}-today-date` }, dayString), h('span', weekday)];
              return h('li', { key: `${date.toString()}-weekheader`, class: listCls }, dateContent as any);
            })
          ),
        ]),
      ]);
    };

    const renderAllDayEvents = (events: any[]) => {
      if (slots.allDayEvents) return slots.allDayEvents({ events: props.events });
      if (props.allDayEventsRender) return normalizeNode(props.allDayEventsRender(props.events));
      return events.map((event, ind) => {
        const { leftPos, width, topInd, children } = event;
        const style = { left: toPercent(leftPos), width: toPercent(width), top: `${topInd}em` };
        return h('li', { class: `${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`, key: `allDay-${ind}`, style }, [normalizeNode(children)]);
      });
    };

    const renderAllDay = () => {
      const { allDayEventsRender, markWeekend } = props;
      const { allDay } = state.parsedEvents;
      const parsed = foundation.parseRangeAllDayEvents(allDay);
      const style = allDayEventsRender || slots.allDayEvents ? null : { height: `${calcRowHeight(parsed)}em` };
      const { week } = rangeData;
      return h('div', { class: `${allDayCls}`, style }, [
        h('ul', { class: `${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left` }, [h('span', locale.value?.allDay)]),
        h('div', { role: 'gridcell', class: `${cssClasses.PREFIX}-content ${allDayCls}-content` }, [
          h(
            'ul',
            { class: `${allDayCls}-skeleton` },
            Object.keys(week).map((date) => {
              const listCls = cls({ [`${cssClasses.PREFIX}-weekend`]: markWeekend && week[date as any].isWeekend });
              return h('li', { key: `${date}-weekgrid`, class: listCls });
            })
          ),
          h('ul', { class: `${cssClasses.PREFIX}-event-items` }, renderAllDayEvents(parsed) as any),
        ]),
      ]);
    };

    expose({ foundation });

    return () => {
      const { renderTimeDisplay, className, height, width, style } = props;
      const weekCls = cls(prefixCls, className, attrs.class as any);
      const weekStyle = [{ height: toPx(height), width: toPx(width) }, style, attrs.style as any];
      const header = slots.header ? slots.header() : normalizeNode(props.header);
      const headerNode = renderHeader();
      return h('div', { class: weekCls, style: weekStyle, ref: dom, ...getDataAttr(attrs as any) }, [
        h('div', { class: `${prefixCls}-sticky-top` }, [header, headerNode, renderAllDay()]),
        h('div', { class: `${prefixCls}-scroll-wrapper` }, [
          h('div', { class: `${prefixCls}-scroll`, ref: scrollDom }, [
            h(TimeCol, { class: `${prefixCls}-sticky-left`, renderTimeDisplay }, slots.timeDisplay ? { timeDisplay: slots.timeDisplay } : undefined),
            renderDayGrid(),
          ]),
        ]),
      ]);
    };
  },
});

export default RangeCalendar;
