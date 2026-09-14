import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import _isEqual from 'lodash/isEqual';
import cls from 'classnames';
import CalendarFoundation from '@douyinfe/semi-foundation/lib/es/calendar/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/calendar/constants';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, toPx } from '../_utils';
import DayCol from './DayCol';
import TimeCol from './TimeCol';
import { baseCalendarProps, calendarEmits } from './props';

const prefixCls = `${cssClasses.PREFIX}-day`;

export const dayCalendarProps = {
  ...baseCalendarProps,
  mode: { type: String, default: 'day' },
};

const DayCalendar = defineComponent({
  name: 'DayCalendar',
  inheritAttrs: false,
  props: dayCalendarProps,
  emits: calendarEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { locale } = useLocale('Calendar');
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      scrollHeight: 0,
      parsedEvents: { day: [] as any[], allDay: [] as any[] },
      cachedKeys: [] as string[],
    });
    const dom = ref<HTMLElement | null>(null);
    const scrollDom = ref<HTMLElement | null>(null);
    let isWeekend = false;

    const adapter = {
      ...baseAdapter,
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
      foundation.parseDailyEvents();
    });
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => [props.events.map((e) => e.key), props.displayValue] as const,
      ([keys, displayValue], [, prevDisplayValue]) => {
        if (!_isEqual(state.cachedKeys, keys) || !_isEqual(prevDisplayValue, displayValue)) {
          foundation.parseDailyEvents();
        }
      }
    );

    const checkWeekend = (val: Date) => foundation.checkWeekend(val);
    const handleClick = (e: MouseEvent, val: any) => {
      const value = foundation.formatCbValue(val);
      emit('click', e, value);
    };

    const renderAllDayEvents = (events: any[]) => {
      if (slots.allDayEvents) return slots.allDayEvents({ events: props.events });
      if (props.allDayEventsRender) return normalizeNode(props.allDayEventsRender(props.events));
      return events.map((event, ind) => {
        const { children, key } = event;
        return h('li', { class: `${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`, key: key || `allDay-${ind}` }, [normalizeNode(children)]);
      });
    };

    const renderAllDay = (events: any[]) => {
      const allDayCls = `${cssClasses.PREFIX}-all-day`;
      const contentCls = cls(`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend });
      return h('div', { class: `${allDayCls}` }, [
        h('ul', { class: `${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left` }, [h('span', locale.value?.allDay)]),
        h('div', { role: 'gridcell', class: contentCls }, [h('ul', { class: `${cssClasses.PREFIX}-event-items` }, renderAllDayEvents(events) as any)]),
      ]);
    };

    expose({ foundation });

    return () => {
      const { dateGridRender, displayValue, showCurrTime, renderTimeDisplay, markWeekend, className, height, width, style, minEventHeight } = props;
      const dayCls = cls(prefixCls, className, attrs.class as any);
      const dayStyle = [{ height: toPx(height), width: toPx(width) }, style, attrs.style as any];
      const { parsedEvents, scrollHeight } = state;
      isWeekend = Boolean(markWeekend && checkWeekend(displayValue));
      const header = slots.header ? slots.header() : normalizeNode(props.header);
      return h('div', { class: dayCls, style: dayStyle, ref: dom, ...getDataAttr(attrs as any) }, [
        h('div', { class: `${prefixCls}-sticky-top` }, [header, renderAllDay(parsedEvents.allDay)]),
        h('div', { class: `${prefixCls}-scroll-wrapper` }, [
          h('div', { class: `${prefixCls}-scroll`, ref: scrollDom }, [
            h(TimeCol, { class: `${prefixCls}-sticky-left`, renderTimeDisplay }, slots.timeDisplay ? { timeDisplay: slots.timeDisplay } : undefined),
            h(DayCol, {
              events: parsedEvents.day,
              displayValue,
              scrollHeight,
              handleClick,
              showCurrTime,
              isWeekend,
              minEventHeight: minEventHeight ?? Number.MIN_SAFE_INTEGER,
              dateGridRender: slots.dateGrid ? (dateString: string, date: Date) => slots.dateGrid!({ dateString, date }) : dateGridRender,
            }),
          ]),
        ]),
      ]);
    };
  },
});

export default DayCalendar;
