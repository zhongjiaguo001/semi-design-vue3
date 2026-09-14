import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import DayCalendar from './DayCalendar';
import WeekCalendar from './WeekCalendar';
import MonthCalendar from './MonthCalendar';
import RangeCalendar from './RangeCalendar';
import { baseCalendarProps, calendarEmits } from './props';
import type { CalendarMode } from './props';

export const calendarProps = {
  ...baseCalendarProps,
  mode: { type: String as PropType<CalendarMode>, default: 'week' },
};

const Calendar = defineComponent({
  name: 'Calendar',
  inheritAttrs: false,
  props: calendarProps,
  emits: calendarEmits,
  setup(props, { slots, attrs, emit }) {
    const component: Record<CalendarMode, any> = {
      month: MonthCalendar,
      week: WeekCalendar,
      day: DayCalendar,
      range: RangeCalendar,
    };
    return () => {
      const { mode, ...rest } = props;
      const Comp = component[mode] || WeekCalendar;
      return h(
        Comp,
        {
          ...attrs,
          ...rest,
          onClick: (e: MouseEvent, value: Date) => emit('click', e, value),
          onClose: (e: any) => emit('close', e),
          onMoreClick: (e: MouseEvent, date: Date, remaining: number) => emit('moreClick', e, date, remaining),
        },
        slots
      );
    };
  },
});

(Calendar as any).elementType = 'Calendar';
export default Calendar;
