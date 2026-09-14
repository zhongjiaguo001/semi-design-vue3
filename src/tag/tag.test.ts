import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Tag, { TagGroup, SplitTagGroup } from './index';
import { IconSearch } from '../icons';

describe('Tag', () => {
  it('renders defaults', () => {
    const w = mount(Tag, { slots: { default: () => 'hello' } });
    expect(w.classes()).toContain('semi-tag');
    expect(w.classes()).toContain('semi-tag-default');
    expect(w.classes()).toContain('semi-tag-square');
    expect(w.classes()).toContain('semi-tag-light');
    expect(w.classes()).toContain('semi-tag-grey-light');
    expect(w.classes()).not.toContain('semi-tag-closable');
    expect(w.classes()).not.toContain('semi-tag-invisible');
    expect(w.attributes('aria-label')).toBe('Tag: hello');
    expect(w.attributes('role')).toBeUndefined();
    const content = w.find('.semi-tag-content');
    expect(content.text()).toBe('hello');
    expect(content.classes()).toContain('semi-tag-content-ellipsis');
  });
  it('size / color / type / shape / colorful / gradient', () => {
    const w = mount(Tag, { props: { size: 'large', color: 'red', type: 'solid', shape: 'circle', colorful: true, gradient: true } });
    expect(w.classes()).toContain('semi-tag-large');
    expect(w.classes()).toContain('semi-tag-solid');
    expect(w.classes()).toContain('semi-tag-red-solid');
    expect(w.classes()).toContain('semi-tag-circle');
    expect(w.classes()).toContain('semi-tag-colorful');
    expect(w.classes()).toContain('semi-tag-gradient');
    expect(mount(Tag, { props: { size: 'small', type: 'ghost' } }).classes()).toContain('semi-tag-small');
  });
  it('closable: close icon, emits close with children and key, hides', async () => {
    const w = mount(Tag, { props: { closable: true, tagKey: 'k1' }, slots: { default: () => 'txt' } });
    expect(w.classes()).toContain('semi-tag-closable');
    expect(w.attributes('role')).toBe('button');
    expect(w.attributes('tabindex')).toBe('0');
    expect(w.attributes('aria-label')).toBe('Closable Tag: txt');
    const close = w.find('.semi-tag-close');
    expect(close.find('.semi-icon-close').exists()).toBe(true);
    await close.trigger('click');
    const ev = w.emitted('close')![0];
    expect(ev[0]).toBe('txt');
    expect(ev[2]).toBe('k1');
    expect(w.classes()).toContain('semi-tag-invisible');
  });
  it('preventDefault in close handler keeps tag visible', async () => {
    const w = mount(Tag, { props: { closable: true, onClose: (_v: any, e: Event) => e.preventDefault() }, slots: { default: () => 'x' } });
    await w.find('.semi-tag-close').trigger('click');
    expect(w.classes()).not.toContain('semi-tag-invisible');
  });
  it('controlled visible', async () => {
    const w = mount(Tag, { props: { visible: false, closable: true } });
    expect(w.classes()).toContain('semi-tag-invisible');
    await w.setProps({ visible: true });
    expect(w.classes()).not.toContain('semi-tag-invisible');
    await w.find('.semi-tag-close').trigger('click');
    expect(w.classes()).not.toContain('semi-tag-invisible');
  });
  it('click emits and keyboard handling', async () => {
    const onClick = vi.fn();
    const w = mount(Tag, { props: { closable: true }, attrs: { onClick }, slots: { default: () => 'x' } });
    await w.trigger('click');
    expect(onClick).toHaveBeenCalled();
    expect(w.emitted('click')).toHaveLength(1);
    await w.trigger('keydown', { key: 'Enter' });
    expect(w.emitted('click')).toHaveLength(2);
    expect(w.emitted('keydown')).toHaveLength(1);
    await w.trigger('keydown', { key: 'Delete' });
    expect(w.emitted('close')).toHaveLength(1);
    expect(w.classes()).toContain('semi-tag-invisible');
  });
  it('prefixIcon / suffixIcon (prop + slot) and avatar', () => {
    const w = mount(Tag, { props: { prefixIcon: IconSearch, avatarSrc: 'a.png', avatarShape: 'circle' }, slots: { suffixIcon: () => h('b', 'S'), default: () => 'x' } });
    expect(w.find('.semi-tag-prefix-icon .semi-icon-search').exists()).toBe(true);
    expect(w.find('.semi-tag-suffix-icon b').text()).toBe('S');
    expect(w.find('.semi-avatar img').attributes('src')).toBe('a.png');
    expect(w.classes()).toContain('semi-tag-avatar-circle');
  });
  it('node children use center content class and attrs passthrough', () => {
    const w = mount(Tag, { attrs: { class: 'c', style: 'color: red', id: 't' }, slots: { default: () => h('i', 'n') } });
    expect(w.find('.semi-tag-content').classes()).toContain('semi-tag-content-center');
    expect(w.attributes('aria-label')).toBe('');
    expect(w.classes()).toContain('c');
    expect(w.attributes('id')).toBe('t');
    expect(w.attributes('style')).toContain('color: red');
  });
});

describe('TagGroup', () => {
  const list = [
    { color: 'light-blue', children: '抖音', closable: true, tagKey: 'a' },
    { color: 'cyan', children: '火山' },
    { color: 'violet', children: '剪映' },
    { color: 'white', children: '醒图' },
  ];
  it('renders all tags with size/avatarShape defaults and group classes', () => {
    const w = mount(TagGroup, {
      props: { tagList: list.map(t => ({ ...t, avatarSrc: 'a.png' })), size: 'large', avatarShape: 'circle' },
      attrs: { class: 'g', style: 'width: 10px' },
    });
    expect(w.classes()).toContain('semi-tag-group');
    expect(w.classes()).toContain('semi-tag-group-large');
    expect(w.classes()).toContain('g');
    expect(w.attributes('style')).toContain('width: 10px');
    const tags = w.findAll('.semi-tag');
    expect(tags).toHaveLength(4);
    expect(tags[0].classes()).toContain('semi-tag-large');
    expect(tags[0].classes()).toContain('semi-tag-avatar-circle');
    expect(tags[1].text()).toBe('火山');
  });
  it('maxTagCount renders +N and emits tagClose', async () => {
    const onTagClose = vi.fn();
    const w = mount(TagGroup, { props: { tagList: list, maxTagCount: 2, onTagClose } });
    expect(w.classes()).toContain('semi-tag-group-max');
    const tags = w.findAll('.semi-tag');
    expect(tags).toHaveLength(3);
    expect(tags[2].text()).toBe('+2');
    await tags[0].find('.semi-tag-close').trigger('click');
    expect(w.emitted('tagClose')![0][0]).toBe('抖音');
    expect(w.emitted('tagClose')![0][2]).toBe('a');
    expect(onTagClose).toHaveBeenCalled();
  });
  it('restCount overrides N and showPopover wraps +N in Popover', async () => {
    const w = mount(TagGroup, {
      props: { tagList: list, maxTagCount: 1, restCount: 9, showPopover: true, popoverProps: { motion: false, mouseEnterDelay: 0 } },
      attachTo: document.body,
    });
    const tags = w.findAll('.semi-tag');
    expect(tags[1].text()).toBe('+9');
    await tags[1].trigger('mouseenter');
    expect(w.emitted('plusNMouseEnter')).toHaveLength(1);
    await new Promise(r => setTimeout(r, 200));
    await flushPromises();
    await nextTick();
    const pop = document.querySelector('.semi-tag-rest-group-popover');
    expect(pop).not.toBeNull();
    expect(pop!.querySelectorAll('.semi-tag').length).toBe(3);
    w.unmount();
  });
  it('mode custom renders nodes as-is', () => {
    const w = mount(TagGroup, { props: { mode: 'custom', tagList: [h('span', { class: 'x' }, '1'), h('span', { class: 'x' }, '2')] } });
    expect(w.findAll('.x')).toHaveLength(2);
    expect(w.findAll('.semi-tag')).toHaveLength(0);
  });
});

describe('SplitTagGroup', () => {
  it('adds first/last classes and role group', () => {
    const w = mount(SplitTagGroup, {
      props: { ariaLabel: 'grp' },
      attrs: { class: 'c' },
      slots: { default: () => [h(Tag, { color: 'blue' }, () => 'a'), h(Tag, { color: 'cyan' }, () => 'b'), h(Tag, { color: 'teal' }, () => 'c')] },
    });
    expect(w.classes()).toContain('semi-tag-split');
    expect(w.classes()).toContain('c');
    expect(w.attributes('role')).toBe('group');
    expect(w.attributes('aria-label')).toBe('grp');
    const tags = w.findAll('.semi-tag');
    expect(tags[0].classes()).toContain('semi-tag-first');
    expect(tags[0].classes()).not.toContain('semi-tag-last');
    expect(tags[1].classes()).not.toContain('semi-tag-first');
    expect(tags[2].classes()).toContain('semi-tag-last');
  });
});
