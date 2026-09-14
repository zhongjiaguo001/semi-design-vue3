import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import { Avatar, AvatarGroup } from './index';

describe('Avatar', () => {
  it('renders string child with defaults', () => {
    const w = mount(Avatar, { slots: { default: () => 'AB' } });
    expect(w.classes()).toContain('semi-avatar');
    expect(w.classes()).toContain('semi-avatar-circle');
    expect(w.classes()).toContain('semi-avatar-medium');
    expect(w.classes()).toContain('semi-avatar-grey');
    expect(w.attributes('role')).toBe('listitem');
    const label = w.find('.semi-avatar-label');
    expect(label.text()).toBe('AB');
    expect(label.attributes('role')).toBe('img');
    expect(label.attributes('aria-label')).toBe('AB');
    expect(w.find('.semi-avatar-content').attributes('style')).toContain('scale(1)');
  });
  it.each(['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'] as const)('size=%s', (size) => {
    expect(mount(Avatar, { props: { size } }).classes()).toContain(`semi-avatar-${size}`);
  });
  it('custom size string sets width/height', () => {
    const w = mount(Avatar, { props: { size: '100px' } });
    expect(w.attributes('style')).toContain('width: 100px');
    expect(w.attributes('style')).toContain('height: 100px');
  });
  it('square shape and color', () => {
    const w = mount(Avatar, { props: { shape: 'square', color: 'red' } });
    expect(w.classes()).toContain('semi-avatar-square');
    expect(w.classes()).toContain('semi-avatar-red');
  });
  it('image src renders img and falls back on error', async () => {
    const w = mount(Avatar, { props: { src: 'a.png', alt: 'photo', imgAttr: { 'data-t': '1' } }, slots: { default: () => 'F' } });
    expect(w.classes()).toContain('semi-avatar-img');
    expect(w.classes()).not.toContain('semi-avatar-grey');
    const img = w.find('img');
    expect(img.attributes('src')).toBe('a.png');
    expect(img.attributes('alt')).toBe('photo');
    expect(img.attributes('data-t')).toBe('1');
    await img.trigger('error');
    expect(w.find('img').exists()).toBe(false);
    expect(w.find('.semi-avatar-label').text()).toBe('F');
  });
  it('clickable: emits click, a11y props, Enter key', async () => {
    const onClick = vi.fn();
    const w = mount(Avatar, { attrs: { onClick }, slots: { default: () => 'A' } });
    const label = w.find('.semi-avatar-label');
    expect(label.attributes('tabindex')).toBe('0');
    expect(label.attributes('aria-label')).toBe('clickable Avatar: A');
    expect(label.classes()).toContain('semi-avatar-no-focus-visible');
    await w.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(w.emitted('click')).toHaveLength(1);
    await label.trigger('keydown', { key: 'Enter' });
    expect(w.emitted('click')).toHaveLength(2);
  });
  it('hoverMask shows on mouseenter and emits enter/leave', async () => {
    const w = mount(Avatar, { props: { hoverMask: 'HM' }, slots: { default: () => 'A' } });
    await w.trigger('mouseenter');
    expect(w.find('.semi-avatar-hover').text()).toBe('HM');
    expect(w.emitted('mouseenter')).toHaveLength(1);
    await w.trigger('mouseleave');
    expect(w.find('.semi-avatar-hover').exists()).toBe(false);
    expect(w.emitted('mouseleave')).toHaveLength(1);
  });
  it('bottomSlot / topSlot / border wrap the avatar', () => {
    const w = mount(Avatar, { props: { size: 'large', bottomSlot: { shape: 'circle', text: 'B', bgColor: 'red' }, topSlot: { text: 'T' }, border: { color: 'blue', motion: true }, contentMotion: true }, slots: { default: () => 'A' } });
    expect(w.classes()).toContain('semi-avatar-wrapper');
    expect(w.find('.semi-avatar-bottom_slot').exists()).toBe(true);
    expect(w.find('.semi-avatar-bottom_slot-shape_circle').attributes('style')).toContain('background-color: red');
    expect(w.find('.semi-avatar-top_slot-content').text()).toBe('T');
    expect(w.find('.semi-avatar-top_slot-bg-svg svg').exists()).toBe(true);
    const borders = w.findAll('.semi-avatar-additionalBorder');
    expect(borders.length).toBe(2);
    expect(borders[0].attributes('style')).toContain('border-color: blue');
    expect(borders[1].classes()).toContain('semi-avatar-additionalBorder-animated');
    expect(w.find('.semi-avatar').classes()).toContain('semi-avatar-animated');
    // custom render slots
    const w2 = mount(Avatar, { props: { bottomSlot: { render: () => h('i', { class: 'bs' }) }, topSlot: { render: () => h('i', { class: 'ts' }) } }, slots: { default: () => 'A' } });
    expect(w2.find('.bs').exists()).toBe(true);
    expect(w2.find('.ts').exists()).toBe(true);
  });
  it('non-string children render as-is', () => {
    const w = mount(Avatar, { slots: { default: () => h('svg', { class: 'ic' }) } });
    expect(w.find('svg.ic').exists()).toBe(true);
    expect(w.find('.semi-avatar-label').exists()).toBe(false);
  });
});

describe('AvatarGroup', () => {
  it('propagates size/shape and overlap classes', () => {
    const w = mount(AvatarGroup, { props: { size: 'small', shape: 'square' }, slots: { default: () => [h(Avatar, null, () => 'A'), h(Avatar, null, () => 'B')] } });
    expect(w.attributes('role')).toBe('list');
    expect(w.classes()).toContain('semi-avatar-group');
    const items = w.findAll('.semi-avatar');
    expect(items).toHaveLength(2);
    expect(items[0].classes()).toContain('semi-avatar-small');
    expect(items[0].classes()).toContain('semi-avatar-square');
    expect(items[0].classes()).toContain('semi-avatar-item-start-0');
    expect(items[1].classes()).toContain('semi-avatar-item-start-1');
    const w2 = mount(AvatarGroup, { props: { overlapFrom: 'end' }, slots: { default: () => h(Avatar, null, () => 'A') } });
    expect(w2.find('.semi-avatar').classes()).toContain('semi-avatar-item-end-0');
  });
  it('maxCount collapses extra avatars into +n and supports renderMore', () => {
    const avatars = () => [h(Avatar, null, () => 'A'), h(Avatar, null, () => 'B'), h(Avatar, { alt: 'Cc' }, () => 'C'), h(Avatar, null, () => 'D')];
    const w = mount(AvatarGroup, { props: { maxCount: 2 }, slots: { default: avatars } });
    const items = w.findAll('.semi-avatar');
    expect(items).toHaveLength(3);
    expect(items[2].classes()).toContain('semi-avatar-item-more');
    expect(items[2].text()).toBe('+2');
    expect(items[2].find('.semi-avatar-label').attributes('aria-label')).toContain('Number of remaining Avatars：2');
    const w2 = mount(AvatarGroup, { props: { maxCount: 1, renderMore: (n: number) => h('b', { class: 'more' }, `more ${n}`) }, slots: { default: avatars } });
    expect(w2.find('b.more').text()).toBe('more 3');
  });
});
