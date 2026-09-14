import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import Banner from './index';
import { IconSearch } from '../icons/generated';

describe('Banner', () => {
  it('renders defaults: info, full mode, role=alert, info icon, close button', () => {
    const w = mount(Banner);
    expect(w.classes()).toContain('semi-banner');
    expect(w.classes()).toContain('semi-banner-info');
    expect(w.classes()).toContain('semi-banner-full');
    expect(w.classes()).not.toContain('semi-banner-in-container');
    expect(w.classes()).not.toContain('semi-banner-bordered');
    expect(w.attributes('role')).toBe('alert');
    expect(w.find('.semi-banner-content-wrapper > .semi-banner-content').exists()).toBe(true);
    const icon = w.find('.semi-banner-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('x-semi-prop')).toBe('icon');
    expect(icon.find('.semi-icon-info_circle').exists()).toBe(true);
    expect(icon.find('.semi-icon-large').exists()).toBe(true);
    expect(icon.find('.semi-icon').attributes('aria-label')).toBe('info');
    expect(w.find('.semi-banner-content-body').exists()).toBe(true);
    expect(w.find('.semi-banner-title').exists()).toBe(false);
    expect(w.find('.semi-banner-description').exists()).toBe(false);
    expect(w.find('.semi-banner-extra').exists()).toBe(false);
    const close = w.find('button.semi-banner-close');
    expect(close.exists()).toBe(true);
    expect(close.classes()).toContain('semi-button-borderless');
    expect(close.classes()).toContain('semi-button-tertiary');
    expect(close.classes()).toContain('semi-button-size-small');
    expect(close.classes()).toContain('semi-button-with-icon-only');
    expect(close.attributes('aria-label')).toBe('Close');
    expect(close.find('.semi-icon-close').exists()).toBe(true);
    expect(close.find('.semi-icon-close').attributes('aria-hidden')).toBe('true');
  });

  it.each([
    ['info', 'info_circle'],
    ['success', 'tick_circle'],
    ['warning', 'alert_triangle'],
    ['danger', 'alert_circle'],
  ] as const)('type=%s renders class and %s icon', (type, iconName) => {
    const w = mount(Banner, { props: { type } });
    expect(w.classes()).toContain(`semi-banner-${type}`);
    expect(w.find(`.semi-banner-icon .semi-icon-${iconName}`).exists()).toBe(true);
    expect(w.find('.semi-banner-icon .semi-icon').attributes('aria-label')).toBe(type);
  });

  it('fullMode=false: in-container class; bordered only applies in container mode', () => {
    const w = mount(Banner, { props: { fullMode: false, bordered: true } });
    expect(w.classes()).toContain('semi-banner-in-container');
    expect(w.classes()).not.toContain('semi-banner-full');
    expect(w.classes()).toContain('semi-banner-bordered');
    expect(mount(Banner, { props: { fullMode: true, bordered: true } }).classes()).not.toContain('semi-banner-bordered');
    expect(mount(Banner, { props: { fullMode: false } }).classes()).not.toContain('semi-banner-bordered');
  });

  it('title / description props render typography-like divs', () => {
    const w = mount(Banner, { props: { title: 'Title', description: 'Desc' } });
    const title = w.find('.semi-banner-title');
    expect(title.exists()).toBe(true);
    expect(title.element.tagName).toBe('DIV');
    expect(title.text()).toBe('Title');
    expect(title.classes()).toContain('semi-typography');
    expect(title.classes()).toContain('semi-typography-h5');
    expect(title.attributes('x-semi-prop')).toBe('title');
    const desc = w.find('.semi-banner-description');
    expect(desc.exists()).toBe(true);
    expect(desc.text()).toBe('Desc');
    expect(desc.classes()).toContain('semi-typography');
    expect(desc.classes()).toContain('semi-typography-paragraph');
    expect(desc.attributes('x-semi-prop')).toBe('description');
    expect(w.find('.semi-banner-content-body').element.children).toHaveLength(2);
  });

  it('title / description as vnode / render fn / slot (slot wins)', () => {
    const w = mount(Banner, { props: { title: h('b', 'vt'), description: () => h('i', 'fd') } });
    expect(w.find('.semi-banner-title b').text()).toBe('vt');
    expect(w.find('.semi-banner-description i').text()).toBe('fd');
    const s = mount(Banner, { props: { title: 'prop', description: 'propd' }, slots: { title: () => h('u', 'st'), description: () => h('s', 'sd') } });
    expect(s.find('.semi-banner-title u').text()).toBe('st');
    expect(s.find('.semi-banner-description s').text()).toBe('sd');
    expect(s.text()).not.toContain('prop');
  });

  it('children render in the extra block', () => {
    const w = mount(Banner, { slots: { default: () => h('button', { class: 'act' }, 'go') } });
    const extra = w.find('.semi-banner-extra');
    expect(extra.exists()).toBe(true);
    expect(extra.attributes('x-semi-prop')).toBe('children');
    expect(extra.find('.act').text()).toBe('go');
    // extra is a sibling of the content wrapper
    expect(w.element.children[1]).toBe(extra.element);
  });

  it('custom icon prop (component / vnode / slot) replaces the type icon', () => {
    const w = mount(Banner, { props: { icon: IconSearch } });
    expect(w.find('.semi-banner-icon .semi-icon-search').exists()).toBe(true);
    expect(w.find('.semi-icon-info_circle').exists()).toBe(false);
    const v = mount(Banner, { props: { icon: h('i', { class: 'vi' }) } });
    expect(v.find('.semi-banner-icon .vi').exists()).toBe(true);
    const s = mount(Banner, { props: { icon: IconSearch }, slots: { icon: () => h('em', { class: 'si' }) } });
    expect(s.find('.semi-banner-icon .si').exists()).toBe(true);
    expect(s.find('.semi-icon-search').exists()).toBe(false);
  });

  it('icon=null hides the icon block', () => {
    const w = mount(Banner, { props: { icon: null } });
    expect(w.find('.semi-banner-icon').exists()).toBe(false);
  });

  it('custom closeIcon prop / slot', () => {
    const w = mount(Banner, { props: { closeIcon: IconSearch } });
    const close = w.find('.semi-banner-close');
    expect(close.find('.semi-icon-search').exists()).toBe(true);
    expect(close.find('.semi-icon-close').exists()).toBe(false);
    const v = mount(Banner, { props: { closeIcon: h('i', { class: 'ci' }) } });
    expect(v.find('.semi-banner-close .ci').exists()).toBe(true);
    const s = mount(Banner, { slots: { closeIcon: () => h('em', { class: 'sc' }) } });
    expect(s.find('.semi-banner-close .sc').exists()).toBe(true);
  });

  it('closeIcon=null removes the close button', () => {
    const w = mount(Banner, { props: { closeIcon: null } });
    expect(w.find('.semi-banner-close').exists()).toBe(false);
  });

  it('clicking close emits close with the event and unmounts the banner', async () => {
    const w = mount(Banner, { props: { title: 't' } });
    await w.find('.semi-banner-close').trigger('click');
    const ev = w.emitted('close')!;
    expect(ev).toHaveLength(1);
    expect(ev[0][0]).toBeInstanceOf(MouseEvent);
    await nextTick();
    expect(w.find('.semi-banner').exists()).toBe(false);
    expect(w.html()).toBe('');
  });

  it('close click does not propagate to parent', async () => {
    let bubbled = 0;
    const w = mount({ render: () => h('div', { onClick: () => bubbled++ }, [h(Banner)]) });
    await w.find('.semi-banner-close').trigger('click');
    expect(bubbled).toBe(0);
  });

  it('class / style / data attrs on root; other attrs dropped', () => {
    const w = mount(Banner, { attrs: { class: 'c', style: { margin: '1px' }, 'data-a': 'b', id: 'nope' } });
    expect(w.classes()).toContain('c');
    expect(w.classes()).toContain('semi-banner');
    expect(w.attributes('style')).toContain('margin: 1px');
    expect(w.attributes('data-a')).toBe('b');
    expect(w.attributes('id')).toBeUndefined();
  });

  it('elementType', () => {
    expect((Banner as any).elementType).toBe('Banner');
  });
});
