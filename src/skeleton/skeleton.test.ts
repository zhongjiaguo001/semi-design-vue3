import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Skeleton, { SkeletonAvatar, SkeletonImage, SkeletonTitle, SkeletonButton, SkeletonParagraph } from './index';

describe('Skeleton', () => {
  it('loading (default true) renders the placeholder inside semi-skeleton', () => {
    const w = mount(Skeleton, { props: { placeholder: h('i', { class: 'ph' }) }, slots: { default: () => h('b', 'real') } });
    expect(w.classes()).toContain('semi-skeleton');
    expect(w.classes()).not.toContain('semi-skeleton-active');
    expect(w.attributes('x-semi-prop')).toBe('placeholder');
    expect(w.find('.ph').exists()).toBe(true);
    expect(w.find('b').exists()).toBe(false);
  });

  it('loading=false renders children only', () => {
    const w = mount(Skeleton, { props: { loading: false, placeholder: h('i', { class: 'ph' }) }, slots: { default: () => h('b', 'real') } });
    expect(w.find('.semi-skeleton').exists()).toBe(false);
    expect(w.find('.ph').exists()).toBe(false);
    expect(w.find('b').text()).toBe('real');
  });

  it('toggling loading switches between placeholder and children', async () => {
    const w = mount(Skeleton, { props: { loading: true, placeholder: 'wait' }, slots: { default: () => 'done' } });
    expect(w.text()).toBe('wait');
    await w.setProps({ loading: false });
    expect(w.text()).toBe('done');
  });

  it('active adds semi-skeleton-active', () => {
    const w = mount(Skeleton, { props: { active: true, placeholder: 'x' } });
    expect(w.classes()).toContain('semi-skeleton-active');
  });

  it('placeholder slot wins over prop, and accepts render function / component prop', () => {
    const w = mount(Skeleton, { props: { placeholder: 'prop' }, slots: { placeholder: () => h('em', 'slot') } });
    expect(w.find('em').text()).toBe('slot');
    expect(w.text()).not.toContain('prop');
    const fn = mount(Skeleton, { props: { placeholder: () => h('u', 'fn') } });
    expect(fn.find('u').text()).toBe('fn');
    const comp = mount(Skeleton, { props: { placeholder: SkeletonTitle } });
    expect(comp.find('.semi-skeleton-title').exists()).toBe(true);
  });

  it('class / style / attrs pass through to the wrapper', () => {
    const w = mount(Skeleton, { props: { placeholder: 'p' }, attrs: { class: 'c', style: { width: '10px' }, id: 'sk', 'data-a': '1' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('width: 10px');
    expect(w.attributes('id')).toBe('sk');
    expect(w.attributes('data-a')).toBe('1');
  });

  it('static sub components are attached and exported', () => {
    expect(Skeleton.Avatar).toBe(SkeletonAvatar);
    expect(Skeleton.Image).toBe(SkeletonImage);
    expect(Skeleton.Title).toBe(SkeletonTitle);
    expect(Skeleton.Button).toBe(SkeletonButton);
    expect(Skeleton.Paragraph).toBe(SkeletonParagraph);
  });

  it('composes a typical placeholder', () => {
    const placeholder = h('div', [h(SkeletonAvatar), h(SkeletonTitle), h(SkeletonParagraph, { rows: 2 })]);
    const w = mount(Skeleton, { props: { placeholder, active: true } });
    expect(w.find('.semi-skeleton-avatar').exists()).toBe(true);
    expect(w.find('.semi-skeleton-title').exists()).toBe(true);
    expect(w.findAll('.semi-skeleton-paragraph li')).toHaveLength(2);
  });
});

describe('Skeleton generic items', () => {
  it('Avatar: default medium circle', () => {
    const w = mount(SkeletonAvatar);
    expect(w.element.tagName).toBe('DIV');
    expect(w.classes()).toContain('semi-skeleton-avatar');
    expect(w.classes()).toContain('semi-skeleton-avatar-medium');
    expect(w.classes()).toContain('semi-skeleton-avatar-circle');
  });

  it.each(['extra-extra-small', 'extra-small', 'small', 'medium', 'large', 'extra-large'] as const)('Avatar size=%s', (size) => {
    expect(mount(SkeletonAvatar, { props: { size } }).classes()).toContain(`semi-skeleton-avatar-${size}`);
  });

  it('Avatar shape=square', () => {
    const w = mount(SkeletonAvatar, { props: { shape: 'square' } });
    expect(w.classes()).toContain('semi-skeleton-avatar-square');
    expect(w.classes()).not.toContain('semi-skeleton-avatar-circle');
  });

  it.each([
    [SkeletonImage, 'image'],
    [SkeletonTitle, 'title'],
    [SkeletonButton, 'button'],
  ] as const)('%o renders semi-skeleton-%s without size/shape classes', (Comp, type) => {
    const w = mount(Comp as any, { props: { size: 'large', shape: 'square' } });
    expect(w.classes()).toContain(`semi-skeleton-${type}`);
    expect(w.classes()).not.toContain(`semi-skeleton-${type}-large`);
    expect(w.classes()).not.toContain(`semi-skeleton-${type}-square`);
  });

  it('class / style / attrs / prefixCls', () => {
    const w = mount(SkeletonButton, { props: { prefixCls: 'my' }, attrs: { class: 'c', style: { width: '5px' }, id: 'b' } });
    expect(w.classes()).toContain('my-button');
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('width: 5px');
    expect(w.attributes('id')).toBe('b');
  });
});

describe('Skeleton.Paragraph', () => {
  it('renders ul.semi-skeleton-paragraph with 4 rows by default', () => {
    const w = mount(SkeletonParagraph);
    expect(w.element.tagName).toBe('UL');
    expect(w.classes()).toContain('semi-skeleton-paragraph');
    expect(w.findAll('li')).toHaveLength(4);
  });

  it('rows prop', async () => {
    const w = mount(SkeletonParagraph, { props: { rows: 2 } });
    expect(w.findAll('li')).toHaveLength(2);
    await w.setProps({ rows: 6 });
    expect(w.findAll('li')).toHaveLength(6);
    await w.setProps({ rows: 0 });
    expect(w.findAll('li')).toHaveLength(0);
  });

  it('class / style / prefixCls; other attrs are not forwarded (React parity)', () => {
    const w = mount(SkeletonParagraph, { props: { prefixCls: 'my' }, attrs: { class: 'c', style: { width: '5px' }, id: 'p' } });
    expect(w.classes()).toContain('my-paragraph');
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('width: 5px');
    expect(w.attributes('id')).toBeUndefined();
  });
});
