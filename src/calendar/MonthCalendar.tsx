import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import _isEqual from 'lodash/isEqual';
import cls from 'classnames';
import CalendarFoundation from '@douyinfe/semi-foundation/lib/es/calendar/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/calendar/constants';
import '@douyinfe/semi-foundation/lib/es/calendar/calendar.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, toPx } from '../_utils';
import Popover from '../popover/Popover';
import { IconButton } from '../button/Button';
import { IconClose } from '../icons/generated';
import { baseCalendarProps, calendarEmits } from './props';

const toPercent = (num: number) => {
  const res = num < 1 ? num * 100 : 100;
  return `${res}%`;
};
const prefixCls = `${cssClasses.PREFIX}-month`;
const contentPadding = 60;
const contentHeight = 24;

export const monthCalendarProps = {
  ...baseCalendarProps,
  mode: { type: String, default: 'month' },
};

const MonthCalendar = defineComponent({
  name: 'MonthCalendar',
  inheritAttrs: false,
  props: monthCalendarProps,
  emits: calendarEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { locale, dateFnsLocale } = useLocale('Calendar');
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      itemLimit: 0,
      showCard: {} as Record<string, [boolean, string?]>,
      parsedEvents: {} as Record<string, any>,
      cachedKeys: [] as string[],
    });
    const cellDom = ref<HTMLElement | null>(null);
    let monthlyData: Record<string, any[]> = {};
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    const optionContainerEl = new Map<string, HTMLElement | null>();
    let contentCellHeight = 0;

    const adapter = {
      ...baseAdapter,
      registerClickOutsideHandler: (key: string, cb: () => void) => {
        clickOutsideHandler = (e: MouseEvent) => {
          const cardDom = optionContainerEl.get(key);
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (cardDom && !cardDom.contains(target) && !path.includes(cardDom)) {
            cb();
          }
        };
        document.addEventListener('mousedown', clickOutsideHandler, false);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) {
          document.removeEventListener('mousedown', clickOutsideHandler, false);
          clickOutsideHandler = null;
        }
      },
      setMonthlyData: (data: any) => {
        monthlyData = data;
      },
      getMonthlyData: () => monthlyData,
      notifyClose: (e: any, key: string) => {
        state.showCard = { ...state.showCard, [key]: [false] };
        emit('close', e);
      },
      openCard: (key: string, spacing: boolean) => {
        const pos = spacing ? 'leftTopOver' : 'rightTopOver';
        state.showCard = { [key]: [true, pos] };
      },
      setParsedEvents: (parsedEvents: any) => {
        state.parsedEvents = parsedEvents;
      },
      setItemLimit: (itemLimit: number) => {
        state.itemLimit = itemLimit;
      },
      cacheEventKeys: (cachedKeys: string[]) => {
        state.cachedKeys = cachedKeys;
      },
    };
    const foundation = new (CalendarFoundation as any)(adapter);

    const calcItemLimit = () => {
      contentCellHeight = cellDom.value ? cellDom.value.getBoundingClientRect().height : 0;
      return Math.max(0, Math.ceil((contentCellHeight - contentPadding) / contentHeight));
    };

    onMounted(() => {
      foundation.init();
      const itemLimit = calcItemLimit();
      foundation.parseMonthlyEvents(itemLimit);
    });
    onBeforeUnmount(() => {
      adapter.unregisterClickOutsideHandler();
      foundation.destroy();
    });

    watch(
      () => [props.events.map((e) => e.key), props.displayValue, props.height] as const,
      ([keys, displayValue, height], [, prevDisplayValue, prevHeight]) => {
        let itemLimitUpdate = false;
        let { itemLimit } = state;
        if (prevHeight !== height) {
          itemLimit = calcItemLimit();
          if (state.itemLimit !== itemLimit) itemLimitUpdate = true;
        }
        if (!_isEqual(state.cachedKeys, keys) || itemLimitUpdate || !_isEqual(prevDisplayValue, displayValue)) {
          foundation.parseMonthlyEvents(itemLimit);
        }
      },
      { flush: 'post' }
    );

    const handleClick = (e: MouseEvent, val: any) => {
      const value = foundation.formatCbValue(val);
      emit('click', e, value);
    };
    const showCard = (e: any, key: string) => foundation.showCard(e, key);
    const closeCard = (e: any, key: string) => foundation.closeCard(e, key);
    const handleMoreClick = (e: MouseEvent, key: string, date: Date, remaining: number) => {
      e.stopPropagation();
      showCard(e, key);
      emit('moreClick', e, date, remaining);
    };

    const renderHeader = () => {
      const { markWeekend, displayValue } = props;
      monthlyData = foundation.getMonthlyData(displayValue, dateFnsLocale.value);
      return h('div', { class: `${prefixCls}-header`, role: 'presentation' }, [
        h('div', { role: 'presentation', class: `${prefixCls}-grid` }, [
          h(
            'ul',
            { role: 'row', class: `${prefixCls}-grid-row` },
            monthlyData[0].map((day: any) => {
              const { weekday } = day;
              const listCls = cls({ [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend });
              return h('li', { role: 'columnheader', 'aria-label': weekday, key: `${weekday}-monthheader`, class: listCls }, [h('span', weekday)]);
            })
          ),
        ]),
      ]);
    };

    const renderEvents = (events: any[]) => {
      const { itemLimit } = state;
      if (!events) return undefined;
      return events.map((event, ind) => {
        const { leftPos, width, topInd, key, children } = event;
        const style = { left: toPercent(leftPos), width: toPercent(width), top: `${topInd}em` };
        if (topInd < itemLimit) {
          return h('li', { class: `${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-month`, key: key || `${ind}-monthevent`, style }, [normalizeNode(children)]);
        }
        return null;
      });
    };

    const formatDayString = (dateObj: Date, month: string, date: string) => {
      if (slots.dateDisplay) return slots.dateDisplay({ date: dateObj });
      const { renderDateDisplay } = props;
      if (renderDateDisplay) return normalizeNode(renderDateDisplay(dateObj));
      if (date === '1') {
        return h('span', { class: `${prefixCls}-date` }, [month, h('span', { class: `${cssClasses.PREFIX}-today-date` }, [' ', date]), locale.value?.datestring]);
      }
      return h('span', { class: `${prefixCls}-date` }, [h('span', { class: `${cssClasses.PREFIX}-today-date` }, date)]);
    };

    const renderCusDateGrid = (date: Date) => {
      if (slots.dateGrid) return slots.dateGrid({ dateString: date.toString(), date });
      const { dateGridRender } = props;
      if (!dateGridRender) return null;
      return normalizeNode(dateGridRender(date.toString(), date));
    };

    const renderCollapsed = (events: any[], itemInfo: any, listCls: string, month: string) => {
      const { itemLimit, showCard: showCardState } = state;
      const { weekday, dayString, date } = itemInfo;
      const key = date.toString();
      const remained = events.filter((i) => Boolean(i)).length - itemLimit;
      const cardCls = `${prefixCls}-event-card`;
      const shouldRenderCard = remained > 0;
      const closer = h(IconButton, {
        class: `${cardCls}-close`,
        onClick: (e: MouseEvent) => closeCard(e, key),
        type: 'tertiary',
        icon: h(IconClose),
        theme: 'borderless',
        size: 'small',
      });
      const header = h('div', { class: `${cardCls}-header-info` }, [
        h('div', { class: `${cardCls}-header-info-weekday` }, weekday),
        h('div', { class: `${cardCls}-header-info-date` }, dayString),
      ]);
      const content = () =>
        h('div', { class: cardCls, ref: (el: any) => optionContainerEl.set(key, el) }, [
          h('div', { class: `${cardCls}-content` }, [
            h('div', { class: `${cardCls}-header` }, [header, closer]),
            h('div', { class: `${cardCls}-body` }, [
              h(
                'ul',
                { class: `${cardCls}-list` },
                events.map((item) => h('li', { key: item.key || `${item.start.toString()}-event` }, [normalizeNode(item.children)]))
              ),
            ]),
          ]),
        ]);
      const pos = showCardState && showCardState[key] ? showCardState[key][1] : 'leftTopOver';
      const text = h(
        'div',
        { class: `${cardCls}-wrapper`, style: { bottom: 0 }, onClick: (e: MouseEvent) => handleMoreClick(e, key, date, remained) },
        String(locale.value?.remaining || '').replace('${remained}', String(remained))
      );
      return h(
        Popover,
        {
          key: `${date.valueOf()}`,
          position: pos as any,
          trigger: 'custom',
          visible: Boolean(showCardState && showCardState[key] && showCardState[key][0]),
          motion: false,
        },
        {
          content,
          default: () =>
            h('li', { key: date, class: listCls, onClick: (e: MouseEvent) => handleClick(e, [date]) }, [formatDayString(date, month, dayString), shouldRenderCard ? text : null, renderCusDateGrid(date)]),
        }
      );
    };

    const renderWeekRow = (index: string, weekDay: any[], events: any = {}) => {
      const { markWeekend } = props;
      const { itemLimit } = state;
      const { display, day } = events;
      return h('div', { role: 'presentation', class: `${prefixCls}-weekrow`, ref: cellDom, key: `${index}-weekrow` }, [
        h(
          'ul',
          { role: 'row', class: `${prefixCls}-skeleton` },
          weekDay.map((each: any) => {
            const { date, dayString, isToday, isSameMonth, isWeekend, month, ind } = each;
            const listCls = cls({
              [`${cssClasses.PREFIX}-today`]: isToday,
              [`${cssClasses.PREFIX}-weekend`]: markWeekend && isWeekend,
              [`${prefixCls}-same`]: isSameMonth,
            });
            const shouldRenderCollapsed = Boolean(day && day[ind] && day[ind].length > itemLimit);
            if (!shouldRenderCollapsed) {
              return h(
                'li',
                {
                  role: 'gridcell',
                  'aria-label': date.toLocaleDateString(),
                  'aria-current': isToday ? 'date' : false,
                  key: `${date}-weeksk`,
                  class: listCls,
                  onClick: (e: MouseEvent) => handleClick(e, [date]),
                },
                [formatDayString(date, month, dayString), renderCusDateGrid(date)]
              );
            }
            return renderCollapsed(day[ind], each, listCls, month);
          })
        ),
        h('ul', { class: `${cssClasses.PREFIX}-event-items` }, display ? renderEvents(display) : null),
      ]);
    };

    const renderMonthGrid = () => {
      const { parsedEvents } = state;
      return h('div', { role: 'presentation', class: `${prefixCls}-week` }, [
        h(
          'ul',
          { role: 'presentation', class: `${prefixCls}-grid-col` },
          Object.keys(monthlyData).map((weekInd) => renderWeekRow(weekInd, monthlyData[weekInd], parsedEvents[weekInd]))
        ),
      ]);
    };

    expose({ foundation, closeCard, showCard });

    return () => {
      const { className, height, width, style } = props;
      const monthCls = cls(prefixCls, className, attrs.class as any);
      const monthStyle = [{ height: toPx(height), width: toPx(width) }, style, attrs.style as any];
      const header = slots.header ? slots.header() : normalizeNode(props.header);
      const headerNode = renderHeader();
      return h('div', { role: 'grid', class: monthCls, key: state.itemLimit, style: monthStyle, ...getDataAttr(attrs as any) }, [
        h('div', { role: 'presentation', class: `${prefixCls}-sticky-top` }, [header, headerNode]),
        h('div', { role: 'presentation', class: `${prefixCls}-grid-wrapper` }, [renderMonthGrid()]),
      ]);
    };
  },
});

export default MonthCalendar;
