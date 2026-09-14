import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Divider from './index';

describe('Divider', () => {
  it('renders horizontal by default', () => {
    const w = mount(Divider);
    expect(w.classes()).toContain('semi-divider');
    expect(w.classes()).toContain('semi-divider-horizontal');
    expect(w.classes()).not.toContain('semi-divider-with-text');
  });
  it('vertical / dashed', () => {
    const w = mount(Divider, { props: { layout: 'vertical', dashed: true } });
    expect(w.classes()).toContain('semi-divider-vertical');
    expect(w.classes()).toContain('semi-divider-dashed');
  });
  it('text children with align', () => {
    const w = mount(Divider, { props: { align: 'left' }, slots: { default: () => 'text' } });
    expect(w.classes()).toContain('semi-divider-with-text');
    expect(w.classes()).toContain('semi-divider-with-text-left');
    expect(w.find('.semi-divider_inner-text').text()).toBe('text');
    const w2 = mount(Divider, { slots: { default: () => h('b', 'node') } });
    expect(w2.find('.semi-divider_inner-text').exists()).toBe(false);
    expect(w2.find('b').text()).toBe('node');
    // vertical ignores children
    const w3 = mount(Divider, { props: { layout: 'vertical' }, slots: { default: () => 'x' } });
    expect(w3.text()).toBe('');
  });
  it('margin applies per layout', () => {
    expect(mount(Divider, { props: { margin: 12 } }).attributes('style')).toContain('margin-top: 12px');
    expect(mount(Divider, { props: { margin: 12 } }).attributes('style')).toContain('margin-bottom: 12px');
    expect(mount(Divider, { props: { margin: '1rem', layout: 'vertical' } }).attributes('style')).toContain('margin-left: 1rem');
  });
  it('class / style / attrs passthrough', () => {
    const w = mount(Divider, { attrs: { class: 'c', style: 'color: red', id: 'd' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('id')).toBe('d');
  });
});

describe('Divider (official examples parity)', () => {
  it('string margin like "12px" is applied verbatim', () => {
    const w = mount(Divider, { props: { margin: '12px' } });
    expect(w.attributes('style')).toContain('margin-top: 12px');
    expect(w.attributes('style')).toContain('margin-bottom: 12px');
    const v = mount(Divider, { props: { layout: 'vertical', margin: '12px' } });
    expect(v.attributes('style')).toContain('margin-left: 12px');
    expect(v.attributes('style')).toContain('margin-right: 12px');
  });
  it('component child (icon) renders without inner-text wrapper but with with-text classes', () => {
    const Icon = { name: 'Icon', render: () => h('svg', { class: 'ico' }) };
    const w = mount(Divider, { slots: { default: () => h(Icon) } });
    expect(w.classes()).toContain('semi-divider-with-text');
    expect(w.classes()).toContain('semi-divider-with-text-center');
    expect(w.find('.semi-divider_inner-text').exists()).toBe(false);
    expect(w.find('svg.ico').exists()).toBe(true);
  });
  it('align right / center classes', () => {
    expect(mount(Divider, { props: { align: 'right' }, slots: { default: () => 't' } }).classes()).toContain('semi-divider-with-text-right');
    expect(mount(Divider, { props: { align: 'center' }, slots: { default: () => 't' } }).classes()).toContain('semi-divider-with-text-center');
  });
  it('no margin prop -> no inline margin style', () => {
    const w = mount(Divider);
    expect(w.attributes('style') ?? '').not.toContain('margin');
  });
});
