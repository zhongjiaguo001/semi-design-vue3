import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Timeline, { TimelineItem } from './index';

const items = () => [h(TimelineItem, { time: '2020-01-01' }, () => 'one'), h(TimelineItem, { time: '2020-01-02' }, () => 'two'), h(TimelineItem, { time: '2020-01-03' }, () => 'three')];

describe('Timeline', () => {
  it('exposes Timeline.Item', () => {
    expect(Timeline.Item).toBe(TimelineItem);
  });

  it('renders ul with default left mode and items', () => {
    const w = mount(Timeline, { slots: { default: items } });
    expect(w.element.tagName).toBe('UL');
    expect(w.classes()).toContain('semi-timeline');
    expect(w.classes()).toContain('semi-timeline-left');
    const lis = w.findAll('li.semi-timeline-item');
    expect(lis).toHaveLength(3);
    lis.forEach((li) => expect(li.classes()).toContain('semi-timeline-item-left'));
    expect(lis[0].find('.semi-timeline-item-tail').exists()).toBe(true);
    expect(lis[0].find('.semi-timeline-item-tail').attributes('aria-hidden')).toBe('true');
    const head = lis[0].find('.semi-timeline-item-head');
    expect(head.classes()).toContain('semi-timeline-item-head-default');
    expect(head.classes()).not.toContain('semi-timeline-item-head-custom');
    expect(head.attributes('aria-hidden')).toBe('true');
    expect(lis[0].find('.semi-timeline-item-content').text()).toContain('one');
    expect(lis[0].find('.semi-timeline-item-content-time').text()).toBe('2020-01-01');
  });

  it.each(['left', 'right', 'center', 'alternate'] as const)('mode=%s wrapper class', (mode) => {
    const w = mount(Timeline, { props: { mode }, slots: { default: items } });
    expect(w.classes()).toContain(`semi-timeline-${mode}`);
  });

  it('mode right: all items right', () => {
    const w = mount(Timeline, { props: { mode: 'right' }, slots: { default: items } });
    w.findAll('li').forEach((li) => expect(li.classes()).toContain('semi-timeline-item-right'));
  });

  it('mode alternate: even left / odd right, position overrides', () => {
    const w = mount(Timeline, {
      props: { mode: 'alternate' },
      slots: { default: () => [h(TimelineItem, null, () => 'a'), h(TimelineItem, null, () => 'b'), h(TimelineItem, { position: 'left' }, () => 'c')] },
    });
    const lis = w.findAll('li');
    expect(lis[0].classes()).toContain('semi-timeline-item-left');
    expect(lis[1].classes()).toContain('semi-timeline-item-right');
    expect(lis[2].classes()).toContain('semi-timeline-item-left');
  });

  it('mode center: default left, position right respected', () => {
    const w = mount(Timeline, {
      props: { mode: 'center' },
      slots: { default: () => [h(TimelineItem, null, () => 'a'), h(TimelineItem, { position: 'right' }, () => 'b')] },
    });
    const lis = w.findAll('li');
    expect(lis[0].classes()).toContain('semi-timeline-item-left');
    expect(lis[1].classes()).toContain('semi-timeline-item-right');
  });

  it('mode left ignores position', () => {
    const w = mount(Timeline, { slots: { default: () => h(TimelineItem, { position: 'right' }, () => 'a') } });
    expect(w.find('li').classes()).toContain('semi-timeline-item-left');
    expect(w.find('li').classes()).not.toContain('semi-timeline-item-right');
  });

  it('keeps user classes on items and wrapper, passes style, aria-label and data attrs', () => {
    const w = mount(Timeline, {
      attrs: { class: 'wrap', style: { color: 'red' }, 'aria-label': 'tl', 'data-x': '1', id: 'no' },
      slots: { default: () => h(TimelineItem, { class: 'mine', style: { margin: '1px' }, 'data-y': '2' }, () => 'a') },
    });
    expect(w.classes()).toContain('wrap');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('aria-label')).toBe('tl');
    expect(w.attributes('data-x')).toBe('1');
    expect(w.attributes('id')).toBeUndefined();
    const li = w.find('li');
    expect(li.classes()).toContain('mine');
    expect(li.classes()).toContain('semi-timeline-item-left');
    expect((li.element as HTMLElement).style.margin).toBe('1px');
    expect(li.attributes('data-y')).toBe('2');
  });

  describe('Item', () => {
    it.each(['ongoing', 'success', 'warning', 'error', 'default'] as const)('type=%s', (type) => {
      const w = mount(TimelineItem, { props: { type } });
      expect(w.find('.semi-timeline-item-head').classes()).toContain(`semi-timeline-item-head-${type}`);
    });

    it('color sets head background', () => {
      const w = mount(TimelineItem, { props: { color: 'pink' } });
      expect((w.find('.semi-timeline-item-head').element as HTMLElement).style.backgroundColor).toBe('pink');
    });

    it('dot prop / slot renders custom head', () => {
      const w = mount(TimelineItem, { props: { dot: h('i', { class: 'dot-p' }) } });
      const head = w.find('.semi-timeline-item-head');
      expect(head.classes()).toContain('semi-timeline-item-head-custom');
      expect(head.find('.dot-p').exists()).toBe(true);
      const s = mount(TimelineItem, { slots: { dot: () => h('b', { class: 'dot-s' }) } });
      expect(s.find('.semi-timeline-item-head-custom .dot-s').exists()).toBe(true);
    });

    it('extra prop / slot and time slot', () => {
      const w = mount(TimelineItem, { props: { extra: 'more', time: 'now' }, slots: { default: () => 'content' } });
      expect(w.find('.semi-timeline-item-content-extra').text()).toBe('more');
      expect(w.find('.semi-timeline-item-content-time').text()).toBe('now');
      const s = mount(TimelineItem, { slots: { extra: () => h('u', 'x'), time: () => h('em', 't') } });
      expect(s.find('.semi-timeline-item-content-extra u').text()).toBe('x');
      expect(s.find('.semi-timeline-item-content-time em').text()).toBe('t');
      const none = mount(TimelineItem);
      expect(none.find('.semi-timeline-item-content-extra').exists()).toBe(false);
      expect(none.find('.semi-timeline-item-content-time').exists()).toBe(false);
    });

    it('emits click', async () => {
      const w = mount(TimelineItem);
      await w.trigger('click');
      expect(w.emitted('click')).toHaveLength(1);
    });
  });

  it('dataSource renders items (content, time, type, dot, position, extra, color, className, onClick)', async () => {
    const onClick = vi.fn();
    const w = mount(Timeline, {
      props: {
        mode: 'alternate',
        dataSource: [
          { content: 'first', time: 't1', type: 'success', className: 'c1', onClick },
          { content: h('b', 'second'), time: 't2', position: 'left', dot: h('i', { class: 'dd' }), extra: 'ex', color: 'red' },
        ],
      },
      slots: { default: () => h(TimelineItem, null, () => 'ignored') },
    });
    const lis = w.findAll('li');
    expect(lis).toHaveLength(2);
    expect(lis[0].text()).toContain('first');
    expect(lis[0].classes()).toContain('c1');
    expect(lis[0].classes()).toContain('semi-timeline-item-left');
    expect(lis[0].find('.semi-timeline-item-head').classes()).toContain('semi-timeline-item-head-success');
    expect(lis[0].find('.semi-timeline-item-content-time').text()).toBe('t1');
    await lis[0].trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(lis[1].find('b').text()).toBe('second');
    expect(lis[1].classes()).toContain('semi-timeline-item-left');
    expect(lis[1].find('.dd').exists()).toBe(true);
    expect(lis[1].find('.semi-timeline-item-content-extra').text()).toBe('ex');
    expect((lis[1].find('.semi-timeline-item-head').element as HTMLElement).style.backgroundColor).toBe('red');
    expect(w.text()).not.toContain('ignored');
  });

  it('empty dataSource falls back to children', () => {
    const w = mount(Timeline, { props: { dataSource: [] }, slots: { default: items } });
    expect(w.findAll('li')).toHaveLength(3);
  });
});
