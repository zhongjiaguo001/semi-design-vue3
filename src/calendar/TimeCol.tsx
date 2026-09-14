import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/calendar/constants';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import { useLocale } from '../locale';

const prefixCls = `${cssClasses.PREFIX}-time`;

export const timeColProps = {
  className: { type: String, default: undefined },
  renderTimeDisplay: { type: Function as PropType<(time: number) => any>, default: undefined },
};

const TimeCol = defineComponent({
  name: 'CalendarTimeCol',
  inheritAttrs: false,
  props: timeColProps,
  setup(props, { slots, attrs }) {
    const { locale } = useLocale('Calendar');

    const formatTime = (item: number) => {
      const { renderTimeDisplay } = props;
      if (slots.timeDisplay) return slots.timeDisplay({ time: item });
      if (typeof renderTimeDisplay === 'function') {
        return renderTimeDisplay(item);
      }
      const replaceTime = (template: string, time: number) => String(template || '').replace('${time}', String(time));
      const l = locale.value || {};
      let time = item < 12 ? replaceTime(l.AM, item) : replaceTime(l.PM, item - 12);
      if (item === 12) {
        time = replaceTime(l.PM, item);
      }
      return time;
    };

    return () => {
      const wrapperCls = cls(props.className, attrs.class as any, `${prefixCls}`);
      const list: any[] = [...Array(24).keys()].map((item) => formatTime(item));
      list.splice(0, 1, '');
      const inner = list.map((item, index) => h('li', { key: `time-${index}`, class: `${prefixCls}-item` }, [h('span', item)]));
      return h('div', { class: wrapperCls }, [h('ul', { class: `${prefixCls}-items` }, inner)]);
    };
  },
});

export default TimeCol;
