import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Calendar, { DayCalendar, WeekCalendar, MonthCalendar, RangeCalendar, CalendarDayCol, CalendarTimeCol } from './index';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const D = (y: number, m: number, d: number, hh = 0, mm = 0) => new Date(y, m, d, hh, mm);
// 2024-01-15 is a Monday
const displayValue = D(2024, 0, 15);
const events = [
  { key: 'a', start: D(2024, 0, 15, 9, 0), end: D(2024, 0, 15, 10, 30), children: h('span', { class: 'ev-a' }, 'A') },
  { key: 'b', start: D(2024, 0, 15), end: D(2024, 0, 16), allDay: true, children: 'B allday' },
  { key: 'c', start: D(2024, 0, 17, 13, 0), end: D(2024, 0, 17, 14, 0), children: 'C' },
];

describe('Calendar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('defaults to week mode and renders the week structure', () => {
    const wrapper = mount(Calendar, { props: { displayValue, showCurrTime: false } });
    expect(wrapper.classes()).toContain('semi-calendar-week');
    expect(wrapper.find('.semi-calendar-week-sticky-top').exists()).toBe(true);
    expect(wrapper.find('.semi-calendar-week-header').exists()).toBe(true);
    expect(wrapper.find('.semi-calendar-all-day').exists()).toBe(true);
    expect(wrapper.find('.semi-calendar-week-scroll').exists()).toBe(true);
    expect(wrapper.find('.semi-calendar-time').exists()).toBe(true);
    expect(wrapper.findAll('.semi-calendar-grid')).toHaveLength(7);
    expect((wrapper.element as HTMLElement).style.height).toBe('600px');
  });

  it.each([
    ['day', 'semi-calendar-day'],
    ['week', 'semi-calendar-week'],
    ['month', 'semi-calendar-month'],
  ] as const)('mode=%s renders %s', (mode, cls) => {
    const wrapper = mount(Calendar, { props: { mode, displayValue, showCurrTime: false } });
    expect(wrapper.classes()).toContain(cls);
  });

  it('mode=range renders the given range (end exclusive, 5 days)', () => {
    const wrapper = mount(Calendar, { props: { mode: 'range', range: [D(2024, 0, 15), D(2024, 0, 20)], showCurrTime: false } });
    expect(wrapper.classes()).toContain('semi-calendar-week');
    expect(wrapper.findAll('.semi-calendar-grid')).toHaveLength(5);
    expect(wrapper.findAll('.semi-calendar-week-grid-row li')).toHaveLength(5);
  });

  it('week header: month tag, 7 days with dayString / weekday, weekStartsOn, markWeekend, today', () => {
    const wrapper = mount(Calendar, { props: { displayValue, showCurrTime: false, markWeekend: true } });
    expect(wrapper.find('.semi-calendar-week-tag span').text()).toBe('1月');
    const days = wrapper.findAll('.semi-calendar-week-grid-row li');
    expect(days).toHaveLength(7);
    expect(days[0].find('.semi-calendar-today-date').text()).toBe('14');
    expect(days[0].classes()).toContain('semi-calendar-weekend');
    expect(days[1].classes()).not.toContain('semi-calendar-weekend');
    expect(days[6].classes()).toContain('semi-calendar-weekend');
    expect(wrapper.find('.semi-calendar-today').exists()).toBe(false);
    const w2 = mount(Calendar, { props: { displayValue, showCurrTime: false, weekStartsOn: 1 } });
    expect(w2.findAll('.semi-calendar-week-grid-row li')[0].find('.semi-calendar-today-date').text()).toBe('15');
    const w3 = mount(Calendar, { props: { displayValue: new Date(), showCurrTime: false } });
    expect(w3.find('.semi-calendar-week-grid-row li.semi-calendar-today').exists()).toBe(true);
  });

  it('LocaleProvider changes allDay text / time column texts', () => {
    const wrapper = mount(LocaleProvider, { props: { locale: en_US as any }, slots: { default: () => h(Calendar, { displayValue, showCurrTime: false }) } });
    expect(wrapper.find('.semi-calendar-all-day-tag span').text()).toBe('All Day');
    const times = wrapper.findAll('.semi-calendar-time-item span').map((s) => s.text());
    expect(times[0]).toBe('');
    expect(times[1]).toBe('1 AM');
    expect(times[12]).toBe('12 PM');
    expect(times[13]).toBe('1 PM');
    expect(wrapper.find('.semi-calendar-week-tag span').text()).toBe('Jan');
  });

  it('time column default zh_CN texts and renderTimeDisplay / timeDisplay slot', () => {
    const w1 = mount(Calendar, { props: { displayValue, showCurrTime: false } });
    const times = w1.findAll('.semi-calendar-time-item span').map((s) => s.text());
    expect(times).toHaveLength(24);
    expect(times[1]).toBe('上午1时');
    expect(times[13]).toBe('下午1时');
    const w2 = mount(Calendar, { props: { displayValue, showCurrTime: false, renderTimeDisplay: (t: number) => `T${t}` } });
    expect(w2.findAll('.semi-calendar-time-item span')[5].text()).toBe('T5');
    const w3 = mount(Calendar, { props: { displayValue, showCurrTime: false }, slots: { timeDisplay: ({ time }: any) => h('b', `S${time}`) } });
    expect(w3.findAll('.semi-calendar-time-item span b')[0].text()).toBe('S1');
  });

  it('renders day events into the right day column with positions, and allDay events in the all-day row', async () => {
    const wrapper = mount(Calendar, { props: { displayValue, events, showCurrTime: false } });
    await nextTick();
    const cols = wrapper.findAll('.semi-calendar-grid');
    // Monday column (index 1 when weekStartsOn=0)
    const monEvents = cols[1].findAll('.semi-calendar-event-day');
    expect(monEvents).toHaveLength(1);
    expect(monEvents[0].find('.ev-a').exists()).toBe(true);
    expect(cols[3].findAll('.semi-calendar-event-day')).toHaveLength(1);
    expect(cols[3].find('.semi-calendar-event-day').text()).toBe('C');
    expect(cols[0].findAll('.semi-calendar-event-day')).toHaveLength(0);
    const allDay = wrapper.findAll('.semi-calendar-all-day .semi-calendar-event-allday');
    expect(allDay).toHaveLength(1);
    expect(allDay[0].text()).toBe('B allday');
    const style = (allDay[0].element as HTMLElement).style;
    expect(parseFloat(style.left)).toBeCloseTo((1 / 7) * 100, 0);
    expect(parseFloat(style.width)).toBeCloseTo((2 / 7) * 100, 0);
    expect((wrapper.find('.semi-calendar-all-day').element as HTMLElement).style.height).toMatch(/^\d+em$/);
  });

  it('updating events re-parses', async () => {
    const wrapper = mount(Calendar, { props: { displayValue, events: [], showCurrTime: false } });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(0);
    await wrapper.setProps({ events });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(2);
    await wrapper.setProps({ displayValue: D(2024, 1, 15) });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(0);
  });

  it('allDayEventsRender prop and allDayEvents slot replace the all-day events', async () => {
    const allDayEventsRender = vi.fn((_events: any[]) => h('li', { class: 'custom-allday' }, 'custom'));
    const w1 = mount(Calendar, { props: { displayValue, events, showCurrTime: false, allDayEventsRender } });
    await nextTick();
    expect(w1.find('.custom-allday').exists()).toBe(true);
    expect(allDayEventsRender).toHaveBeenCalled();
    expect(allDayEventsRender.mock.calls[0][0]).toHaveLength(3);
    expect((w1.find('.semi-calendar-all-day').element as HTMLElement).style.height).toBe('');
    const w2 = mount(Calendar, { props: { displayValue, events, showCurrTime: false }, slots: { allDayEvents: () => h('li', { class: 'slot-allday' }) } });
    await nextTick();
    expect(w2.find('.slot-allday').exists()).toBe(true);
  });

  it('renderDateDisplay / dateDisplay slot customise the week header cells', () => {
    const w1 = mount(Calendar, { props: { displayValue, showCurrTime: false, renderDateDisplay: (d: Date) => h('i', { class: 'rdd' }, String(d.getDate())) } });
    expect(w1.findAll('.semi-calendar-week-grid-row li i.rdd')[1].text()).toBe('15');
    const w2 = mount(Calendar, { props: { displayValue, showCurrTime: false }, slots: { dateDisplay: ({ date }: any) => h('u', { class: 'sdd' }, String(date.getDate())) } });
    expect(w2.findAll('.semi-calendar-week-grid-row li u.sdd')[1].text()).toBe('15');
  });

  it('dateGridRender / dateGrid slot render inside each day column', () => {
    const dateGridRender = vi.fn((_s: string, d: Date) => h('div', { class: 'dg' }, String(d.getDate())));
    const w1 = mount(Calendar, { props: { displayValue, showCurrTime: false, dateGridRender } });
    expect(w1.findAll('.semi-calendar-grid-content .dg')).toHaveLength(7);
    expect(dateGridRender.mock.calls[1][0]).toBe(D(2024, 0, 15).toString());
    const w2 = mount(Calendar, { props: { displayValue, showCurrTime: false }, slots: { dateGrid: ({ date }: any) => h('div', { class: 'sdg' }, String(date.getDate())) } });
    expect(w2.findAll('.semi-calendar-grid-content .sdg')[1].text()).toBe('15');
  });

  it('click on a grid slot emits click with the time', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Calendar, { props: { displayValue, showCurrTime: false, onClick } });
    const cols = wrapper.findAll('.semi-calendar-grid');
    const rows = cols[1].findAll('.semi-calendar-grid-skeleton li');
    expect(rows).toHaveLength(50);
    expect(rows[0].attributes('data-time')).toBe('00:00:00');
    expect(rows[1].attributes('data-time')).toBe('00:30:00');
    expect(rows[0].classes()).toContain('semi-calendar-grid-skeleton-row-line');
    await rows[21].trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    const value: Date = onClick.mock.calls[0][1];
    expect(value.getFullYear()).toBe(2024);
    expect(value.getMonth()).toBe(0);
    expect(value.getDate()).toBe(15);
    expect(value.getHours()).toBe(10);
    expect(value.getMinutes()).toBe(30);
    expect(wrapper.emitted('click')![0][1]).toEqual(value);
  });

  it('showCurrTime renders the current-time line only for today', async () => {
    const w1 = mount(Calendar, { props: { displayValue, showCurrTime: true } });
    await wait(30);
    expect(w1.find('.semi-calendar-grid-curr-line').exists()).toBe(false);
    w1.unmount();
    const w2 = mount(Calendar, { props: { displayValue: new Date(), showCurrTime: true } });
    await wait(30);
    expect(w2.find('.semi-calendar-grid-curr-line').exists()).toBe(true);
    expect(w2.find('.semi-calendar-grid-curr-circle').exists()).toBe(true);
    w2.unmount();
    const w3 = mount(Calendar, { props: { displayValue: new Date(), showCurrTime: false } });
    await wait(30);
    expect(w3.find('.semi-calendar-grid-curr-line').exists()).toBe(false);
    w3.unmount();
  });

  it('header prop / slot, className / class / style / width / height / data attrs', () => {
    const w1 = mount(Calendar, {
      props: { displayValue, showCurrTime: false, header: h('div', { class: 'hd' }, 'H'), className: 'custom', style: { color: 'red' }, width: 800, height: '50vh' },
      attrs: { class: 'extra', 'data-foo': 'bar' },
    });
    expect(w1.find('.semi-calendar-week-sticky-top .hd').text()).toBe('H');
    expect(w1.classes()).toContain('custom');
    expect(w1.classes()).toContain('extra');
    const style = (w1.element as HTMLElement).style;
    expect(style.color).toBe('red');
    expect(style.width).toBe('800px');
    expect(style.height).toBe('50vh');
    expect(w1.attributes('data-foo')).toBe('bar');
    const w2 = mount(Calendar, { props: { displayValue, showCurrTime: false }, slots: { header: () => h('b', { class: 'sh' }, 'SH') } });
    expect(w2.find('.semi-calendar-week-sticky-top .sh').text()).toBe('SH');
  });

  it('minEventHeight enforces a minimum event height', async () => {
    const wrapper = mount(WeekCalendar, { props: { displayValue, events, showCurrTime: false, minEventHeight: 50 } });
    await nextTick();
    // jsdom scrollHeight is 0, so computed height is 0 -> min applies
    const ev = wrapper.find('.semi-calendar-event-day').element as HTMLElement;
    expect(ev.style.height).toBe('50px');
  });

  it('day mode: renders single column, allDay events, markWeekend, click', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Calendar, { props: { mode: 'day', displayValue: D(2024, 0, 14), events: [...events, { key: 'd', start: D(2024, 0, 14, 8), end: D(2024, 0, 14, 9), children: 'D' }], showCurrTime: false, markWeekend: true, onClick } });
    await nextTick();
    expect(wrapper.find('.semi-calendar-day-sticky-top').exists()).toBe(true);
    expect(wrapper.findAll('.semi-calendar-grid')).toHaveLength(1);
    expect(wrapper.find('.semi-calendar-grid-skeleton').classes()).toContain('semi-calendar-weekend');
    expect(wrapper.find('.semi-calendar-all-day-content').classes()).toContain('semi-calendar-weekend');
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(1);
    expect(wrapper.find('.semi-calendar-event-day').text()).toBe('D');
    expect(wrapper.find('.semi-calendar-all-day-tag span').text()).toBe('全天');
    await wrapper.findAll('.semi-calendar-grid-skeleton li')[2].trigger('click');
    expect(onClick.mock.calls[0][1].getHours()).toBe(1);
    expect(onClick.mock.calls[0][1].getDate()).toBe(14);
  });

  it('day mode: allDay event shown, allDayEventsRender, dateGridRender', async () => {
    const wrapper = mount(DayCalendar, { props: { displayValue, events, showCurrTime: false, dateGridRender: () => h('i', { class: 'dg' }) } });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-event-allday')).toHaveLength(1);
    expect(wrapper.find('.semi-calendar-event-allday').text()).toBe('B allday');
    expect(wrapper.find('.dg').exists()).toBe(true);
    await wrapper.setProps({ allDayEventsRender: () => h('li', { class: 'cad' }) });
    expect(wrapper.find('.cad').exists()).toBe(true);
  });

  it('month mode: header weekdays, 5 week rows, day cells, first-day label, today, markWeekend, click', async () => {
    const onClick = vi.fn();
    const wrapper = mount(Calendar, { props: { mode: 'month', displayValue, markWeekend: true, onClick } });
    await nextTick();
    expect(wrapper.attributes('role')).toBe('grid');
    const headers = wrapper.findAll('.semi-calendar-month-grid-row li');
    expect(headers).toHaveLength(7);
    expect(headers[0].text()).toBe('周日');
    expect(headers[0].classes()).toContain('semi-calendar-weekend');
    const rows = wrapper.findAll('.semi-calendar-month-weekrow');
    expect(rows).toHaveLength(5);
    const cells = wrapper.findAll('.semi-calendar-month-skeleton li');
    expect(cells).toHaveLength(35);
    // 2024-01-01 is a Monday -> index 1
    expect(cells[1].find('.semi-calendar-month-date').text()).toContain('1');
    expect(cells[1].find('.semi-calendar-month-date').text()).toContain('日');
    expect(cells[1].classes()).toContain('semi-calendar-month-same');
    expect(cells[0].classes()).not.toContain('semi-calendar-month-same');
    expect(cells[2].find('.semi-calendar-today-date').text()).toBe('2');
    expect(cells[0].classes()).toContain('semi-calendar-weekend');
    expect(cells[1].attributes('role')).toBe('gridcell');
    await cells[15].trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][1].getDate()).toBe(15);
    expect(onClick.mock.calls[0][1].getMonth()).toBe(0);
  });

  it('month mode: weekStartsOn, renderDateDisplay, dateGridRender, LocaleProvider weekday names', async () => {
    const w1 = mount(LocaleProvider, {
      props: { locale: en_US as any },
      slots: { default: () => h(Calendar, { mode: 'month', displayValue, weekStartsOn: 1, renderDateDisplay: (d: Date) => h('b', { class: 'rd' }, `${d.getDate()}`), dateGridRender: (_s: string, d: Date) => h('i', { class: 'dg' }, `${d.getDate()}`) }) },
    });
    await nextTick();
    const headers = w1.findAll('.semi-calendar-month-grid-row li');
    expect(headers[0].text()).toBe('Mon');
    const cells = w1.findAll('.semi-calendar-month-skeleton li');
    expect(cells[0].find('b.rd').text()).toBe('1');
    expect(cells[0].find('i.dg').text()).toBe('1');
  });

  it('month mode: events are placed in week rows; itemLimit 0 in jsdom shows "more" text, click opens card and emits moreClick/close', async () => {
    const onMoreClick = vi.fn();
    const onClose = vi.fn();
    const wrapper = mount(Calendar, { attachTo: document.body, props: { mode: 'month', displayValue, events, onMoreClick, onClose } });
    await nextTick();
    // jsdom: cell height 0 -> itemLimit 0 -> every event collapses into the "remaining" text
    const more = wrapper.findAll('.semi-calendar-month-event-card-wrapper');
    expect(more.length).toBeGreaterThan(0);
    expect(more[0].text()).toBe('还有2项');
    expect(wrapper.findAll('.semi-calendar-event-month')).toHaveLength(0);
    (more[0].element as HTMLElement).click();
    await wait();
    expect(onMoreClick).toHaveBeenCalledTimes(1);
    expect(onMoreClick.mock.calls[0][1].getDate()).toBe(15);
    expect(onMoreClick.mock.calls[0][2]).toBe(2);
    const card = document.querySelector('.semi-calendar-month-event-card') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.querySelector('.semi-calendar-month-event-card-header-info-date')!.textContent).toBe('15');
    expect(card.querySelectorAll('.semi-calendar-month-event-card-list li')).toHaveLength(2);
    (card.querySelector('.semi-calendar-month-event-card-close') as HTMLElement).click();
    await wait();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.semi-calendar-month-event-card')).toBeNull();
    wrapper.unmount();
  });

  it('month mode: click outside closes the card', async () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { mode: 'month', displayValue, events } });
    await nextTick();
    (wrapper.find('.semi-calendar-month-event-card-wrapper').element as HTMLElement).click();
    await wait();
    expect(document.querySelector('.semi-calendar-month-event-card')).toBeTruthy();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait();
    expect(document.querySelector('.semi-calendar-month-event-card')).toBeNull();
    wrapper.unmount();
  });

  it('month mode: re-parses when events / displayValue / height change', async () => {
    const wrapper = mount(MonthCalendar, { props: { displayValue, events: [] } });
    await nextTick();
    expect(wrapper.find('.semi-calendar-month-event-card-wrapper').exists()).toBe(false);
    await wrapper.setProps({ events });
    await nextTick();
    expect(wrapper.find('.semi-calendar-month-event-card-wrapper').exists()).toBe(true);
    await wrapper.setProps({ displayValue: D(2024, 3, 1) });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-month-weekrow')).toHaveLength(5);
    expect(wrapper.find('.semi-calendar-month-event-card-wrapper').exists()).toBe(false);
    await wrapper.setProps({ height: 900 });
    await nextTick();
    expect((wrapper.element as HTMLElement).style.height).toBe('900px');
  });

  it('range mode: header from range, events, click, re-parse on range change', async () => {
    const onClick = vi.fn();
    const wrapper = mount(RangeCalendar, { props: { range: [D(2024, 0, 15), D(2024, 0, 18)], events, showCurrTime: false, markWeekend: true, onClick } });
    await nextTick();
    expect(wrapper.find('.semi-calendar-week-tag span').text()).toBe('1月');
    const days = wrapper.findAll('.semi-calendar-week-grid-row li');
    expect(days).toHaveLength(3);
    expect(days[0].find('.semi-calendar-today-date').text()).toBe('15');
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(2);
    expect(wrapper.findAll('.semi-calendar-event-allday')).toHaveLength(1);
    await wrapper.findAll('.semi-calendar-grid')[2].findAll('.semi-calendar-grid-skeleton li')[4].trigger('click');
    expect(onClick.mock.calls[0][1].getDate()).toBe(17);
    expect(onClick.mock.calls[0][1].getHours()).toBe(2);
    await wrapper.setProps({ range: [D(2024, 0, 20), D(2024, 0, 22)] });
    await nextTick();
    expect(wrapper.findAll('.semi-calendar-week-grid-row li')).toHaveLength(2);
    expect(wrapper.findAll('.semi-calendar-event-day')).toHaveLength(0);
    expect(wrapper.findAll('.semi-calendar-week-grid-row li')[0].classes()).toContain('semi-calendar-weekend');
  });

  it('scrollTop is applied on mount', () => {
    const wrapper = mount(Calendar, { attachTo: document.body, props: { displayValue, showCurrTime: false, scrollTop: 0 } });
    expect(wrapper.element.scrollTop).toBe(0);
    wrapper.unmount();
  });

  it('DayCol standalone: events with positions, currPos, click handler prop and emit', async () => {
    const handleClick = vi.fn();
    const wrapper = mount(CalendarDayCol, {
      props: { displayValue, scrollHeight: 1000, showCurrTime: false, handleClick, events: [{ key: 'x', startPos: 0.25, endPos: 0.5, children: 'X', left: '50%' }] },
    });
    const ev = wrapper.find('.semi-calendar-event-day').element as HTMLElement;
    expect(ev.style.top).toBe('250px');
    expect(ev.style.height).toBe('250px');
    expect(ev.style.left).toBe('50%');
    await wrapper.findAll('li')[3].trigger('click');
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick.mock.calls[0][1]).toEqual([displayValue, 1, 30, 0]);
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('TimeCol standalone', () => {
    const wrapper = mount(CalendarTimeCol, { props: { className: 'tc' } });
    expect(wrapper.classes()).toContain('semi-calendar-time');
    expect(wrapper.classes()).toContain('tc');
    expect(wrapper.findAll('.semi-calendar-time-item')).toHaveLength(24);
  });
  it('dateGridRender may return an array of nodes or null (official custom-render demos)', async () => {
    const target = D(2024, 0, 15).toString();
    const dateGridRender = (ds?: string) => (ds === target ? [h('div', { class: 'multi' }, '1'), h('div', { class: 'multi' }, '2')] : null);
    const week = mount(Calendar, { props: { displayValue, showCurrTime: false, dateGridRender } });
    expect(week.findAll('.semi-calendar-grid-content .multi')).toHaveLength(2);
    const month = mount(Calendar, { props: { mode: 'month', displayValue, dateGridRender } });
    await wait();
    expect(month.findAll('.semi-calendar-month-skeleton .multi')).toHaveLength(2);
  });

  it('renderDateDisplay receives a Date and can render a component (Avatar demo)', () => {
    const renderDateDisplay = vi.fn((date: Date) => h('b', { class: 'rd' }, String(date.getDate())));
    const wrapper = mount(Calendar, { props: { displayValue: D(2023, 4, 14), showCurrTime: false, renderDateDisplay } });
    expect(renderDateDisplay).toHaveBeenCalledTimes(7);
    expect(renderDateDisplay.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(wrapper.findAll('.semi-calendar-week-grid-row .rd').map((n) => n.text())).toEqual(['14', '15', '16', '17', '18', '19', '20']);
  });

  it('range mode with an empty range array does not throw when mode switches (events demo)', async () => {
    const wrapper = mount(Calendar, { props: { mode: 'week', displayValue, range: [], events, showCurrTime: false } });
    await wrapper.setProps({ mode: 'range', range: [D(2019, 6, 23), D(2019, 6, 26)] });
    await wait();
    expect(wrapper.findAll('.semi-calendar-week-grid-row li')).toHaveLength(3);
    await wrapper.setProps({ mode: 'month', range: [] });
    await wait();
    expect(wrapper.find('.semi-calendar-month').exists()).toBe(true);
  });
});
