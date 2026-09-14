import type { PropType, CSSProperties } from 'vue';
import { strings } from '@douyinfe/semi-foundation/lib/es/calendar/constants';

export type CalendarMode = (typeof strings.MODE)[number];
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EventObject {
  [x: string]: any;
  key: string;
  allDay?: boolean;
  start?: Date;
  end?: Date;
  children?: any;
}

const nodeType = [String, Number, Object, Function, Array] as PropType<any>;

/** Props shared by every calendar mode (React Calendar.propTypes + sub calendars) */
export const baseCalendarProps = {
  displayValue: { type: Date as PropType<Date>, default: () => new Date() },
  header: { type: nodeType, default: undefined },
  events: { type: Array as PropType<EventObject[]>, default: () => [] },
  showCurrTime: { type: Boolean, default: true },
  weekStartsOn: { type: Number as PropType<WeekStartsOn>, default: 0 },
  scrollTop: { type: Number, default: 400 },
  renderTimeDisplay: { type: Function as PropType<(time: number) => any>, default: undefined },
  renderDateDisplay: { type: Function as PropType<(date: Date) => any>, default: undefined },
  dateGridRender: { type: Function as PropType<(dateString?: string, date?: Date) => any>, default: undefined },
  allDayEventsRender: { type: Function as PropType<(events: EventObject[]) => any>, default: undefined },
  markWeekend: { type: Boolean, default: false },
  minEventHeight: { type: Number, default: undefined },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  height: { type: [Number, String] as PropType<number | string>, default: 600 },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  range: { type: Array as PropType<Date[]>, default: undefined },
};

export const calendarEmits = ['click', 'close', 'moreClick'];
