import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Space from './index';

describe('Space', () => {
  it('defaults: horizontal, center, tight', () => {
    const w = mount(Space, { slots: { default: () => [h('i', 'a'), h('i', 'b')] } });
    expect(w.classes()).toContain('semi-space');
    expect(w.classes()).toContain('semi-space-horizontal');
    expect(w.classes()).toContain('semi-space-align-center');
    expect(w.classes()).toContain('semi-space-tight-horizontal');
    expect(w.classes()).toContain('semi-space-tight-vertical');
    expect(w.findAll('i')).toHaveLength(2);
  });
  it('vertical disables wrap, align options', () => {
    const w = mount(Space, { props: { vertical: true, wrap: true, align: 'start' } });
    expect(w.classes()).toContain('semi-space-vertical');
    expect(w.classes()).not.toContain('semi-space-wrap');
    expect(w.classes()).toContain('semi-space-align-start');
    expect(mount(Space, { props: { wrap: true } }).classes()).toContain('semi-space-wrap');
  });
  it('spacing string / number / array', () => {
    expect(mount(Space, { props: { spacing: 'loose' } }).classes()).toContain('semi-space-loose-horizontal');
    expect(mount(Space, { props: { spacing: 'medium' } }).classes()).toContain('semi-space-medium-vertical');
    const n = mount(Space, { props: { spacing: 20 } });
    expect(n.attributes('style')).toContain('row-gap: 20px');
    expect(n.attributes('style')).toContain('column-gap: 20px');
    const arr = mount(Space, { props: { spacing: ['loose', 8] } });
    expect(arr.classes()).toContain('semi-space-loose-horizontal');
    expect(arr.attributes('style')).toContain('row-gap: 8px');
  });
  it('flattens fragments / arrays and keeps data attrs', () => {
    const w = mount(Space, { attrs: { 'data-x': '1', class: 'c', style: 'color: red' }, slots: { default: () => [[h('i'), h('i')], h('b')] } });
    expect(w.element.children.length).toBe(3);
    expect(w.attributes('data-x')).toBe('1');
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
  });
});

describe('Space (official parity)', () => {
  it('supports every align value from strings.ALIGN_SET', () => {
    for (const a of ['start', 'end', 'center', 'baseline'] as const) {
      expect(mount(Space, { props: { align: a } }).classes()).toContain(`semi-space-align-${a}`);
    }
  });
  it('array spacing with number horizontal + string vertical', () => {
    const w = mount(Space, { props: { spacing: [8, 'medium'] } });
    expect(w.attributes('style')).toContain('column-gap: 8px');
    expect(w.attributes('style')).not.toContain('row-gap');
    expect(w.classes()).toContain('semi-space-medium-vertical');
    expect(w.classes()).not.toContain('semi-space-tight-horizontal');
  });
  it('array of numbers sets column then row gap', () => {
    const w = mount(Space, { props: { spacing: [8, 16] } });
    expect(w.attributes('style')).toContain('column-gap: 8px');
    expect(w.attributes('style')).toContain('row-gap: 16px');
  });
  it('keeps x-semi-prop and does not forward non-data attrs', () => {
    const w = mount(Space, { attrs: { id: 'x', 'data-y': '2' } });
    expect(w.attributes('x-semi-prop')).toBe('children');
    expect(w.attributes('data-y')).toBe('2');
  });
});
