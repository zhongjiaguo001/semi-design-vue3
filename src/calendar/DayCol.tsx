import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import CalendarFoundation from '@douyinfe/semi-foundation/lib/es/calendar/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/calendar/constants';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { normalizeNode } from '../_utils';

const prefixCls = `${cssClasses.PREFIX}-grid`;

function pad(d: number) {
  return d < 10 ? `0${d.toString()}` : d.toString();
}

export interface DayColEvent {
  [x: string]: any;
  key?: string;
  startPos: number;
  endPos: number;
  left?: number | string;
  children?: any;
}

export const dayColProps = {
  events: { type: Array as PropType<DayColEvent[]>, default: () => [] },
  displayValue: { type: Date as PropType<Date>, default: undefined },
  showCurrTime: { type: Boolean, default: true },
  scrollHeight: { type: Number, default: 0 },
  currPos: { type: Number, default: 0 },
  handleClick: { type: Function as PropType<(e: MouseEvent, val: [Date, number, number, number]) => void>, default: undefined },
  mode: { type: String, default: 'dayCol' },
  minEventHeight: { type: Number, default: Number.MIN_SAFE_INTEGER },
  isWeekend: { type: Boolean, default: false },
  dateGridRender: { type: Function as PropType<(dateString?: string, date?: Date) => any>, default: undefined },
};

export const dayColEmits = ['click'];

const DayCol = defineComponent({
  name: 'CalendarDayCol',
  inheritAttrs: false,
  props: dayColProps,
  emits: dayColEmits,
  setup(props, { emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      currPos: 0,
      showCurrTime: false,
    });

    const adapter = {
      ...baseAdapter,
      updateCurrPos: (currPos: number) => {
        state.currPos = currPos;
      },
      updateShowCurrTime: () => {
        state.showCurrTime = true;
      },
    };
    const foundation = new (CalendarFoundation as any)(adapter);

    onMounted(() => {
      foundation.init();
      foundation.initCurrTime();
    });
    onBeforeUnmount(() => foundation.destroy());

    const handleClick = (e: MouseEvent, val: [Date, number, number, number]) => {
      props.handleClick && props.handleClick(e, val);
      emit('click', e, val);
    };

    const renderEvents = () => {
      const { events, scrollHeight, minEventHeight } = props;
      return events.map((event, ind) => {
        const { startPos, endPos, children, key, left = 0 } = event;
        const top = startPos * scrollHeight;
        const height = (endPos - startPos) * scrollHeight;
        const style = {
          top: `${top}px`,
          height: `${Math.max(minEventHeight, height)}px`,
          left: typeof left === 'number' ? `${left}px` : left,
        };
        return h('li', { class: `${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-day`, style, key: key || `${top}-${ind}` }, [normalizeNode(children)]);
      });
    };

    const renderCurrTime = () => {
      const { currPos } = state;
      const { scrollHeight } = props;
      const top = `${currPos * scrollHeight}px`;
      const style = { top };
      return [h('div', { class: `${prefixCls}-curr-circle`, style, key: `circle-${currPos}` }), h('div', { class: `${prefixCls}-curr-line`, style, key: `line-${currPos}` })];
    };

    expose({ foundation });

    return () => {
      const showCurrTime = props.showCurrTime ? state.showCurrTime : false;
      const { displayValue, isWeekend, dateGridRender } = props;
      const skCls = cls(`${prefixCls}-skeleton`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend });
      return h('div', { class: `${prefixCls}`, role: 'presentation' }, [
        h('div', { role: 'gridcell', class: `${prefixCls}-content` }, [
          showCurrTime ? renderCurrTime() : null,
          h(
            'ul',
            { role: 'row', class: skCls },
            [...Array(25).keys()].map((item) => {
              const line = cls({ [`${prefixCls}-skeleton-row-line`]: true });
              return [
                h('li', { key: `${item}-daycol-0`, 'data-time': `${pad(item)}:00:00`, class: line, onClick: (e: MouseEvent) => handleClick(e, [displayValue as Date, item, 0, 0]) }),
                h('li', { key: `${item}-daycol-30`, 'data-time': `${pad(item)}:30:00`, onClick: (e: MouseEvent) => handleClick(e, [displayValue as Date, item, 30, 0]) }),
              ];
            })
          ),
          dateGridRender && displayValue ? normalizeNode(dateGridRender(displayValue.toString(), displayValue)) : null,
          h('ul', { class: `${cssClasses.PREFIX}-event-items` }, renderEvents()),
        ]),
      ]);
    };
  },
});

export default DayCol;
