import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect } from 'vitest';
import Card, { CardGroup, Meta } from './index';

describe('Card', () => {
  it('renders defaults: bordered, no header/cover/footer, body with children', () => {
    const w = mount(Card, { slots: { default: () => h('p', 'content') } });
    expect(w.classes()).toContain('semi-card');
    expect(w.classes()).toContain('semi-card-bordered');
    expect(w.classes()).not.toContain('semi-card-shadows');
    expect(w.attributes('aria-busy')).toBe('false');
    expect(w.find('.semi-card-header').exists()).toBe(false);
    expect(w.find('.semi-card-cover').exists()).toBe(false);
    expect(w.find('.semi-card-footer').exists()).toBe(false);
    const body = w.find('.semi-card-body');
    expect(body.exists()).toBe(true);
    expect(body.find('p').text()).toBe('content');
    expect(w.find('.semi-skeleton').exists()).toBe(false);
    expect(w.find('.semi-card-body-actions').exists()).toBe(false);
  });

  it('bordered=false / shadows', () => {
    expect(mount(Card, { props: { bordered: false } }).classes()).not.toContain('semi-card-bordered');
    const hover = mount(Card, { props: { shadows: 'hover' } });
    expect(hover.classes()).toContain('semi-card-shadows');
    expect(hover.classes()).toContain('semi-card-shadows-hover');
    expect(mount(Card, { props: { shadows: 'always' } }).classes()).toContain('semi-card-shadows-always');
  });

  it('class / style / attrs / ariaLabel pass through', () => {
    const w = mount(Card, { props: { ariaLabel: 'card' }, attrs: { class: 'c', style: { width: '1px' }, id: 'x', 'data-a': '1' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('width: 1px');
    expect(w.attributes('id')).toBe('x');
    expect(w.attributes('data-a')).toBe('1');
    expect(w.attributes('aria-label')).toBe('card');
    expect(mount(Card, { attrs: { 'aria-label': 'attr' } }).attributes('aria-label')).toBe('attr');
  });

  it('title (string) renders a typography-like h6 inside header wrapper', () => {
    const w = mount(Card, { props: { title: 'Hello' } });
    const header = w.find('.semi-card-header');
    expect(header.exists()).toBe(true);
    expect(header.classes()).toContain('semi-card-header-bordered');
    const wrapper = header.find('.semi-card-header-wrapper');
    expect(wrapper.exists()).toBe(true);
    const title = wrapper.find('.semi-card-header-wrapper-title');
    expect(title.exists()).toBe(true);
    expect(title.classes()).not.toContain('semi-card-header-wrapper-spacing');
    const h6 = title.find('h6');
    expect(h6.exists()).toBe(true);
    expect(h6.text()).toBe('Hello');
    expect(h6.classes()).toContain('semi-typography');
    expect(h6.classes()).toContain('semi-typography-h6');
    expect(h6.classes()).toContain('semi-typography-ellipsis-single-line');
    expect(h6.attributes('x-semi-prop')).toBe('title');
    expect(w.find('.semi-card-header-wrapper-extra').exists()).toBe(false);
  });

  it('string title is a real Typography.Title (heading 6, single-line ellipsis with tooltip)', async () => {
    const w = mount(Card, { props: { title: 'Hello' } });
    const title = w.findComponent({ name: 'TypographyTitle' });
    expect(title.exists()).toBe(true);
    expect(title.props('heading')).toBe(6);
    expect(title.props('ellipsis')).toEqual({ showTooltip: true, rows: 1 });
    expect(w.find('h6.semi-typography-ellipsis-overflow-ellipsis').exists()).toBe(true);
    await w.setProps({ title: 'Changed' });
    expect(w.find('h6').text()).toBe('Changed');
  });

  it('title as node / slot is rendered as-is', () => {
    const w = mount(Card, { props: { title: h('b', 'node') } });
    expect(w.find('.semi-card-header-wrapper-title b').text()).toBe('node');
    expect(w.find('h6').exists()).toBe(false);
    const s = mount(Card, { props: { title: 'prop' }, slots: { title: () => h('i', 'slot') } });
    expect(s.find('.semi-card-header-wrapper-title i').text()).toBe('slot');
    expect(s.text()).not.toContain('prop');
  });

  it('headerExtraContent adds extra block and spacing class on title', () => {
    const w = mount(Card, { props: { title: 't', headerExtraContent: h('a', 'more') } });
    const extra = w.find('.semi-card-header-wrapper-extra');
    expect(extra.exists()).toBe(true);
    expect(extra.attributes('x-semi-prop')).toBe('headerExtraContent');
    expect(extra.find('a').text()).toBe('more');
    expect(w.find('.semi-card-header-wrapper-title').classes()).toContain('semi-card-header-wrapper-spacing');
    const only = mount(Card, { slots: { headerExtraContent: () => 'x' } });
    expect(only.find('.semi-card-header').exists()).toBe(true);
    expect(only.find('.semi-card-header-wrapper-title').exists()).toBe(false);
  });

  it('header has priority over title / headerExtraContent', () => {
    const w = mount(Card, { props: { header: h('div', { class: 'custom-h' }, 'H'), title: 'T', headerExtraContent: 'E' } });
    expect(w.find('.semi-card-header .custom-h').exists()).toBe(true);
    expect(w.find('.semi-card-header-wrapper').exists()).toBe(false);
    expect(w.text()).not.toContain('T');
    const s = mount(Card, { slots: { header: () => h('u', 'slot header') } });
    expect(s.find('.semi-card-header u').text()).toBe('slot header');
  });

  it('headerLine=false / headerStyle', () => {
    const w = mount(Card, { props: { title: 't', headerLine: false, headerStyle: { padding: '0px' } } });
    const header = w.find('.semi-card-header');
    expect(header.classes()).not.toContain('semi-card-header-bordered');
    expect(header.attributes('style')).toContain('padding: 0px');
  });

  it('cover prop / slot', () => {
    const w = mount(Card, { props: { cover: h('img', { src: 'a.png' }) } });
    const cover = w.find('.semi-card-cover');
    expect(cover.exists()).toBe(true);
    expect(cover.attributes('x-semi-prop')).toBe('cover');
    expect(cover.find('img').exists()).toBe(true);
    expect(mount(Card, { slots: { cover: () => h('video') } }).find('.semi-card-cover video').exists()).toBe(true);
  });

  it('footer prop / slot, footerLine, footerStyle', () => {
    const w = mount(Card, { props: { footer: 'foot', footerStyle: { margin: '1px' } } });
    const footer = w.find('.semi-card-footer');
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toBe('foot');
    expect(footer.attributes('x-semi-prop')).toBe('footer');
    expect(footer.classes()).not.toContain('semi-card-footer-bordered');
    expect(footer.attributes('style')).toContain('margin: 1px');
    const lined = mount(Card, { props: { footerLine: true }, slots: { footer: () => h('s', 'sf') } });
    expect(lined.find('.semi-card-footer').classes()).toContain('semi-card-footer-bordered');
    expect(lined.find('.semi-card-footer s').text()).toBe('sf');
  });

  it('bodyStyle', () => {
    const w = mount(Card, { props: { bodyStyle: { padding: '2px' } } });
    expect(w.find('.semi-card-body').attributes('style')).toContain('padding: 2px');
  });

  it('loading renders skeleton placeholder (title + 3 paragraph rows) instead of children', async () => {
    const w = mount(Card, { props: { loading: true }, slots: { default: () => h('p', 'content') } });
    expect(w.attributes('aria-busy')).toBe('true');
    const sk = w.find('.semi-card-body .semi-skeleton');
    expect(sk.exists()).toBe(true);
    expect(sk.classes()).toContain('semi-skeleton-active');
    expect(sk.find('.semi-skeleton-title').exists()).toBe(true);
    expect(sk.findAll('.semi-skeleton-paragraph li')).toHaveLength(3);
    expect(w.find('p').exists()).toBe(false);
    await w.setProps({ loading: false });
    expect(w.find('.semi-skeleton').exists()).toBe(false);
    expect(w.find('p').text()).toBe('content');
  });

  it('loading without children renders no skeleton', () => {
    const w = mount(Card, { props: { loading: true } });
    expect(w.find('.semi-skeleton').exists()).toBe(false);
  });

  it('actions prop renders a Space with items', () => {
    const w = mount(Card, { props: { actions: [h('button', 'a'), h('button', 'b')] } });
    const actions = w.find('.semi-card-body-actions');
    expect(actions.exists()).toBe(true);
    expect(actions.find('.semi-space').exists()).toBe(true);
    const items = actions.findAll('.semi-card-body-actions-item');
    expect(items).toHaveLength(2);
    expect(items[0].attributes('x-semi-prop')).toBe('actions.0');
    expect(items[1].attributes('x-semi-prop')).toBe('actions.1');
    expect(items[1].find('button').text()).toBe('b');
  });

  it('actions slot', () => {
    const w = mount(Card, { slots: { actions: () => [h('a', '1'), h('a', '2'), h('a', '3')] } });
    expect(w.findAll('.semi-card-body-actions-item')).toHaveLength(3);
  });

  it('exposes Card.Meta', () => {
    expect(Card.Meta).toBe(Meta);
  });
});

describe('Card.Meta', () => {
  it('renders nothing but wrapper when empty', () => {
    const w = mount(Meta);
    expect(w.classes()).toContain('semi-card-meta');
    expect(w.find('.semi-card-meta-avatar').exists()).toBe(false);
    expect(w.find('.semi-card-meta-wrapper').exists()).toBe(false);
  });

  it('avatar / title / description props', () => {
    const w = mount(Meta, { props: { avatar: h('img'), title: 'T', description: 'D' } });
    expect(w.find('.semi-card-meta-avatar img').exists()).toBe(true);
    const wrapper = w.find('.semi-card-meta-wrapper');
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.semi-card-meta-wrapper-title').text()).toBe('T');
    expect(wrapper.find('.semi-card-meta-wrapper-description').text()).toBe('D');
  });

  it('only description still renders the wrapper', () => {
    const w = mount(Meta, { props: { description: 'D' } });
    expect(w.find('.semi-card-meta-wrapper').exists()).toBe(true);
    expect(w.find('.semi-card-meta-wrapper-title').exists()).toBe(false);
  });

  it('slots win over props', () => {
    const w = mount(Meta, { props: { title: 'p' }, slots: { title: () => h('i', 's'), avatar: () => h('b', 'av'), description: () => 'sd' } });
    expect(w.find('.semi-card-meta-wrapper-title i').text()).toBe('s');
    expect(w.find('.semi-card-meta-avatar b').text()).toBe('av');
    expect(w.find('.semi-card-meta-wrapper-description').text()).toBe('sd');
  });

  it('class / style / attrs', () => {
    const w = mount(Meta, { attrs: { class: 'c', style: { color: 'red' }, id: 'm' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('id')).toBe('m');
  });
});

describe('CardGroup', () => {
  it('renders a wrapping Space with spacing 16 and wrap', () => {
    const w = mount(CardGroup, { slots: { default: () => [h(Card), h(Card)] } });
    expect(w.classes()).toContain('semi-space');
    expect(w.classes()).toContain('semi-space-wrap');
    expect(w.classes()).toContain('semi-card-group');
    expect(w.classes()).not.toContain('semi-card-group-grid');
    expect(w.attributes('style')).toContain('column-gap: 16px');
    expect(w.attributes('style')).toContain('row-gap: 16px');
    expect(w.findAll('.semi-card')).toHaveLength(2);
  });

  it('spacing number / array', () => {
    expect(mount(CardGroup, { props: { spacing: 8 } }).attributes('style')).toContain('column-gap: 8px');
    const arr = mount(CardGroup, { props: { spacing: [4, 20] } });
    expect(arr.attributes('style')).toContain('column-gap: 4px');
    expect(arr.attributes('style')).toContain('row-gap: 20px');
  });

  it('type=grid forces spacing 0 and grid class', () => {
    const w = mount(CardGroup, { props: { type: 'grid', spacing: 30 } });
    expect(w.classes()).toContain('semi-card-group-grid');
    expect(w.attributes('style')).toContain('column-gap: 0px');
    expect(w.attributes('style')).not.toContain('30px');
  });

  it('class / style / data attrs pass through', () => {
    const w = mount(CardGroup, { attrs: { class: 'c', style: { color: 'red' }, 'data-a': '1' } });
    expect(w.classes()).toContain('c');
    expect(w.attributes('style')).toContain('color: red');
    expect(w.attributes('data-a')).toBe('1');
  });
});
