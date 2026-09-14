import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import Empty from './index';
import ConfigProvider from '../configProvider';
import { theme } from '../theme';

describe('Empty', () => {
  it('renders vertical layout with image/title/description/footer', () => {
    const w = mount(Empty, { props: { image: 'img.png', title: 'No data', description: 'desc', imageStyle: { width: '10px' } }, slots: { default: () => h('button', 'act') } });
    expect(w.classes()).toContain('semi-empty');
    expect(w.classes()).toContain('semi-empty-vertical');
    const img = w.find('.semi-empty-image img');
    expect(img.attributes('src')).toBe('img.png');
    expect(img.attributes('alt')).toBe('desc');
    expect(w.find('.semi-empty-image').attributes('style')).toContain('width: 10px');
    expect(w.find('h4.semi-empty-title').text()).toBe('No data');
    expect(w.find('.semi-empty-description').text()).toBe('desc');
    expect(w.find('.semi-empty-footer button').text()).toBe('act');
  });
  it('horizontal layout, title without image uses h6', () => {
    const w = mount(Empty, { props: { layout: 'horizontal', title: 'T' } });
    expect(w.classes()).toContain('semi-empty-horizontal');
    expect(w.find('h6.semi-empty-title').exists()).toBe(true);
    expect(w.find('.semi-empty-description').exists()).toBe(false);
    expect(w.find('.semi-empty-footer').exists()).toBe(false);
  });
  it('image as node / slot / svg id', () => {
    const w = mount(Empty, { props: { image: () => h('svg', { class: 'ill' }) } });
    expect(w.find('svg.ill').exists()).toBe(true);
    const w2 = mount(Empty, { slots: { image: () => h('i', { class: 'si' }), title: () => 'TT', description: () => h('b', 'DD') } });
    expect(w2.find('i.si').exists()).toBe(true);
    expect(w2.find('.semi-empty-title').text()).toBe('TT');
    expect(w2.find('.semi-empty-description b').text()).toBe('DD');
    const w3 = mount(Empty, { props: { image: { id: 'sym' } } });
    expect(w3.find('svg use').html()).toContain('xlink:href="#sym"');
  });
  it('darkModeImage follows body theme-mode and ConfigProvider dark theme', async () => {
    document.body.setAttribute('theme-mode', 'dark');
    const w = mount(Empty, { attachTo: document.body, props: { image: 'light.png', darkModeImage: 'dark.png' } });
    await nextTick();
    expect(w.find('img').attributes('src')).toBe('dark.png');
    document.body.removeAttribute('theme-mode');
    await new Promise((r) => setTimeout(r, 10));
    await nextTick();
    expect(w.find('img').attributes('src')).toBe('light.png');
    w.unmount();
    const w2 = mount(ConfigProvider, { attachTo: document.body, props: { theme: { algorithm: theme.darkAlgorithm } }, slots: { default: () => h(Empty, { image: 'light.png', darkModeImage: 'dark.png' }) } });
    await nextTick();
    expect(w2.find('img').attributes('src')).toBe('dark.png');
    w2.unmount();
  });
  it('class / style / data attrs', () => {
    const w = mount(Empty, { attrs: { class: 'c', style: 'color: red', 'data-x': '1' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('data-x')).toBe('1');
  });
});
