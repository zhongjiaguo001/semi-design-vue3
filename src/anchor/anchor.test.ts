import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent, Fragment } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Anchor, { AnchorLink } from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 30) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

function addSections(ids: string[]) {
  for (const id of ids) {
    const el = document.createElement('div');
    el.id = id;
    el.style.height = '500px';
    document.body.appendChild(el);
  }
}

const links = () => [
  h(AnchorLink, { href: '#a', title: 'Section A' }),
  h(AnchorLink, { href: '#b', title: 'Section B' }, () => [h(AnchorLink, { href: '#b1', title: 'B-1' }), h(AnchorLink, { href: '#b2', title: 'B-2' }, () => h(AnchorLink, { href: '#b21', title: 'B-2-1' }))]),
  h(AnchorLink, { href: '#c', title: 'Section C' }),
];

describe('Anchor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exposes Anchor.Link', () => {
    expect(Anchor.Link).toBe(AnchorLink);
  });

  it('renders navigation wrapper, rail, link list with levels', async () => {
    const w = mount(Anchor, { slots: { default: links } });
    await wait();
    expect(w.attributes('role')).toBe('navigation');
    expect(w.attributes('aria-label')).toBe('Side navigation');
    expect(w.attributes('id')).toMatch(/^semi-anchor-/);
    expect(w.classes()).toContain('semi-anchor');
    expect(w.classes()).toContain('semi-anchor-size-default');
    expect(w.element.style.maxWidth).toBe('200px');
    expect(w.element.style.maxHeight).toBe('750px');
    const slide = w.find('.semi-anchor-slide');
    expect(slide.classes()).toContain('semi-anchor-slide-primary');
    expect(slide.attributes('aria-hidden')).toBe('true');
    const bar = slide.find('.semi-anchor-slide-bar');
    expect(bar.classes()).toContain('semi-anchor-slide-bar-default');
    expect(bar.classes()).toContain('semi-anchor-slide-bar-primary');
    expect(bar.classes()).not.toContain('semi-anchor-slide-bar-active');
    const wrapper = w.find('.semi-anchor-link-wrapper');
    expect(wrapper.attributes('role')).toBe('list');
    const items = w.findAll('.semi-anchor-link');
    expect(items).toHaveLength(6);
    expect(items[0].attributes('role')).toBe('listitem');
    const titles = w.findAll('.semi-anchor-link-title');
    expect(titles[0].text()).toBe('Section A');
    expect(titles[0].attributes('role')).toBe('link');
    expect(titles[0].attributes('tabindex')).toBe('0');
    expect(titles[0].attributes('title')).toBe('Section A');
    expect(titles[0].attributes('aria-disabled')).toBe('false');
    expect((titles[0].element as HTMLElement).style.paddingLeft).toBe('8px');
    // nested levels
    const b1 = titles.find((t) => t.text() === 'B-1')!;
    expect((b1.element as HTMLElement).style.paddingLeft).toBe('16px');
    const b21 = titles.find((t) => t.text() === 'B-2-1')!;
    expect((b21.element as HTMLElement).style.paddingLeft).toBe('24px');
    // nested list container
    expect(items[1].find('div[role="list"]').exists()).toBe(true);
    // all links registered (children mount before their parent, as in React)
    expect((w.vm as any).getLinks().slice().sort()).toEqual(['#a', '#b', '#b1', '#b2', '#b21', '#c']);
  });

  it('size small / railTheme / maxWidth maxHeight / class style data attrs / ariaLabel', () => {
    const w = mount(Anchor, {
      props: { size: 'small', railTheme: 'muted', maxWidth: 100, maxHeight: '50%', ariaLabel: 'toc' },
      attrs: { class: 'c', style: { color: 'red' }, 'data-t': '1' },
      slots: { default: links },
    });
    expect(w.classes()).toContain('semi-anchor-size-small');
    expect(w.classes()).toContain('c');
    expect(w.find('.semi-anchor-slide').classes()).toContain('semi-anchor-slide-muted');
    expect(w.find('.semi-anchor-slide-bar').classes()).toContain('semi-anchor-slide-bar-small');
    expect(w.find('.semi-anchor-slide-bar').classes()).toContain('semi-anchor-slide-bar-muted');
    expect(w.element.style.maxWidth).toBe('100px');
    expect(w.element.style.maxHeight).toBe('50%');
    expect(w.element.style.color).toBe('red');
    expect(w.attributes('data-t')).toBe('1');
    expect(w.attributes('aria-label')).toBe('toc');
  });

  it('click activates link, emits click + change, sets active classes and slide bar', async () => {
    addSections(['a', 'b', 'c']);
    const w = mount(Anchor, { attachTo: document.body, slots: { default: links } });
    await wait();
    const titles = w.findAll('.semi-anchor-link-title');
    await titles[0].trigger('click');
    await wait();
    expect(w.emitted('click')![0][1]).toBe('#a');
    expect(w.emitted('click')![0][0]).toBeInstanceOf(Event);
    expect(w.emitted('change')![0]).toEqual(['#a', '']);
    expect(titles[0].classes()).toContain('semi-anchor-link-title-active');
    expect(titles[0].attributes('aria-details')).toBe('active');
    expect(w.find('.semi-anchor-slide-bar').classes()).toContain('semi-anchor-slide-bar-active');
    expect((w.vm as any).getActiveLink()).toBe('#a');
    // clicking the active link again: click emitted, no change
    await titles[0].trigger('click');
    await wait();
    expect(w.emitted('click')).toHaveLength(2);
    expect(w.emitted('change')).toHaveLength(1);
    // keyboard
    await titles[5].trigger('keypress', { key: 'Enter' });
    await wait();
    expect(w.emitted('change')![1]).toEqual(['#c', '#a']);
    w.unmount();
  });

  it('resolves href ids that start with a digit via getElementById', async () => {
    addSections(['1安装']);
    const w = mount(Anchor, {
      attachTo: document.body,
      slots: { default: () => h(AnchorLink, { href: '#1安装', title: '安装' }) },
    });
    await wait();
    await w.find('.semi-anchor-link-title').trigger('click');
    await wait();
    expect(w.emitted('click')![0][1]).toBe('#1安装');
    expect((w.vm as any).getActiveLink()).toBe('#1安装');
    w.unmount();
  });

  it('disabled link does not respond to click', async () => {
    const w = mount(Anchor, { slots: { default: () => h(AnchorLink, { href: '#a', title: 'A', disabled: true }) } });
    await wait();
    const title = w.find('.semi-anchor-link-title');
    expect(title.classes()).toContain('semi-anchor-link-title-disabled');
    expect(title.attributes('aria-disabled')).toBe('true');
    await title.trigger('click');
    expect(w.emitted('click')).toBeUndefined();
    expect(w.emitted('change')).toBeUndefined();
  });

  it('defaultAnchor activates without notifying', async () => {
    addSections(['a', 'b']);
    const w = mount(Anchor, { attachTo: document.body, props: { defaultAnchor: '#b' }, slots: { default: links } });
    await wait();
    expect((w.vm as any).getActiveLink()).toBe('#b');
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('click')).toBeUndefined();
    expect(w.findAll('.semi-anchor-link-title')[1].classes()).toContain('semi-anchor-link-title-active');
    w.unmount();
  });

  it('scrolling activates the last section above the top (offsetTop), listens on getContainer', async () => {
    addSections(['a', 'b', 'c']);
    const container = document.createElement('div');
    container.id = 'scroller';
    document.body.appendChild(container);
    const tops: Record<string, number> = { a: -300, b: -50, c: 200 };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this.id in tops ? tops[this.id] : 0;
      return { top, left: 0, width: 100, height: 100, right: 100, bottom: top + 100, x: 0, y: top, toJSON() {} } as any;
    });
    const getContainer = vi.fn(() => container);
    const w = mount(Anchor, { attachTo: document.body, props: { getContainer, offsetTop: 10 }, slots: { default: links } });
    await wait();
    expect(getContainer).toHaveBeenCalled();
    container.dispatchEvent(new Event('scroll'));
    await wait(150);
    expect((w.vm as any).getActiveLink()).toBe('#b');
    expect(w.emitted('change')![0]).toEqual(['#b', '']);
    // offsetTop makes c (200 - 10) still positive, b (-50 - 10) negative -> b stays
    tops.b = 5; // now b is 5 - 10 = -5 -> still the closest negative
    container.dispatchEvent(new Event('scroll'));
    await wait(150);
    expect((w.vm as any).getActiveLink()).toBe('#b');
    tops.b = 20; // b positive -> a is the only negative
    container.dispatchEvent(new Event('scroll'));
    await wait(150);
    expect((w.vm as any).getActiveLink()).toBe('#a');
    expect(w.emitted('change')![1]).toEqual(['#a', '#b']);
    w.unmount();
    expect(() => container.dispatchEvent(new Event('scroll'))).not.toThrow();
  });

  it('window is the default scroll container', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const w = mount(Anchor, { slots: { default: links } });
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function));
    w.unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('clicking scrolls the target into view (scrollMotion smooth / targetOffset)', async () => {
    addSections(['a']);
    const scrollEl = document.getElementById('a')!;
    const w = mount(Anchor, { attachTo: document.body, props: { scrollMotion: true, targetOffset: 20 }, slots: { default: () => h(AnchorLink, { href: '#a', title: 'A' }) } });
    await wait();
    await w.find('.semi-anchor-link-title').trigger('click');
    await wait(150);
    expect(scrollEl.isConnected).toBe(true);
    expect((w.vm as any).getActiveLink()).toBe('#a');
    w.unmount();
  });

  it('autoCollapse: only children of the active branch are rendered', async () => {
    addSections(['a', 'b', 'b1', 'b2', 'b21', 'c']);
    const w = mount(Anchor, { attachTo: document.body, props: { autoCollapse: true }, slots: { default: links } });
    await wait();
    expect(w.findAll('.semi-anchor-link')).toHaveLength(3);
    expect(w.text()).not.toContain('B-1');
    await w.findAll('.semi-anchor-link-title')[1].trigger('click');
    await wait();
    expect(w.text()).toContain('B-1');
    expect(w.text()).toContain('B-2');
    expect(w.text()).not.toContain('B-2-1');
    // child map keeps the parent expanded when a descendant is active
    const childMap = (w.vm as any).getChildMap();
    expect(childMap['#b'].has('#b1')).toBe(true);
    expect(childMap['#b'].has('#b21')).toBe(true);
    expect(childMap['#b2'].has('#b21')).toBe(true);
    expect(childMap['#a'].size).toBe(0);
    const b2 = w.findAll('.semi-anchor-link-title').find((t) => t.text() === 'B-2')!;
    await b2.trigger('click');
    await wait();
    expect(w.text()).toContain('B-2-1');
    expect(w.text()).toContain('B-1');
    await w.findAll('.semi-anchor-link-title')[0].trigger('click');
    await wait();
    expect(w.text()).not.toContain('B-1');
    w.unmount();
  });

  it('showTooltip renders Typography.Text with ellipsis tooltip and position; title slot', async () => {
    const w = mount(Anchor, {
      props: { showTooltip: true, position: 'right', size: 'small' },
      slots: { default: () => [h(AnchorLink, { href: '#a', title: 'A title' }), h(AnchorLink, { href: '#b' }, { title: () => h('b', 'slot title') })] },
    });
    await wait();
    const titles = w.findAll('.semi-anchor-link-title');
    const text = titles[0].find('.semi-typography');
    expect(text.exists()).toBe(true);
    expect(text.classes()).toContain('semi-anchor-link-tooltip');
    expect(text.classes()).toContain('semi-anchor-link-tooltip-small');
    expect(text.classes()).toContain('semi-typography-tertiary');
    expect(text.classes()).toContain('semi-typography-small');
    expect(text.classes()).toContain('semi-typography-ellipsis');
    expect(titles[0].attributes('title')).toBeUndefined();
    expect(titles[1].find('b').text()).toBe('slot title');
    const plain = mount(Anchor, { slots: { default: () => h(AnchorLink, { href: '#a', title: 'A' }) } });
    expect(plain.find('.semi-typography').exists()).toBe(false);
    expect(plain.find('.semi-anchor-link-title').text()).toBe('A');
    const obj = mount(Anchor, { props: { showTooltip: { type: 'popover' } }, slots: { default: () => h(AnchorLink, { href: '#a', title: 'A' }) } });
    expect(obj.find('.semi-typography').classes()).toContain('semi-typography-normal');
  });

  it('rtl direction pads on the right', async () => {
    const w = mount(ConfigProvider, { props: { direction: 'rtl' }, slots: { default: () => h(Anchor, null, () => h(AnchorLink, { href: '#a', title: 'A' })) } });
    await wait();
    const title = w.find('.semi-anchor-link-title').element as HTMLElement;
    expect(title.style.paddingRight).toBe('8px');
    expect(title.style.paddingLeft).toBe('');
    const explicit = mount(Anchor, { slots: { default: () => h(AnchorLink, { href: '#a', title: 'A', direction: 'rtl', level: 3 }) } });
    expect((explicit.find('.semi-anchor-link-title').element as HTMLElement).style.paddingRight).toBe('24px');
  });

  it('href change re-registers the link; unmount removes it', async () => {
    const w = mount(Anchor, { props: {}, slots: { default: () => h(AnchorLink, { href: '#x', title: 'X' }) } });
    await wait();
    expect((w.vm as any).getLinks()).toEqual(['#x']);
    const Dyn = {
      props: { href: String, show: Boolean },
      render() {
        return h(Anchor, null, () => (this.show ? [h(AnchorLink, { href: this.href, title: 't' })] : []));
      },
    };
    const d = mount(Dyn as any, { props: { href: '#1', show: true } });
    await wait();
    const anchorVm = d.findComponent(Anchor).vm as any;
    expect(anchorVm.getLinks()).toEqual(['#1']);
    await d.setProps({ href: '#2' });
    await wait();
    expect(anchorVm.getLinks()).toEqual(['#2']);
    await d.setProps({ show: false });
    await wait();
    expect(anchorVm.getLinks()).toEqual([]);
  });

  it('link class / style / data attrs', () => {
    const w = mount(Anchor, { slots: { default: () => h(AnchorLink, { href: '#a', title: 'A', class: 'lc', style: { color: 'blue' }, 'data-l': '1' }) } });
    const link = w.find('.semi-anchor-link');
    expect(link.classes()).toContain('lc');
    expect((link.element as HTMLElement).style.color).toBe('blue');
    expect(link.attributes('data-l')).toBe('1');
  });

  it('exposed scrollTo activates link silently', async () => {
    const w = mount(Anchor, { slots: { default: links } });
    await wait();
    (w.vm as any).scrollTo('#c');
    await wait();
    expect((w.vm as any).getActiveLink()).toBe('#c');
    expect(w.emitted('change')).toBeUndefined();
  });
  it('showTooltip object form forwards type/opts to Typography ellipsis and merges position', async () => {
    const w = mount(Anchor, {
      props: { showTooltip: { type: 'popover', opts: { motion: false, className: 'my-pop' } }, position: 'left' },
      slots: { default: () => h(AnchorLink, { href: '#a', title: 'A very long title' }) },
    });
    await wait();
    const text = w.findComponent({ name: 'TypographyText' });
    expect(text.exists()).toBe(true);
    const ellipsis = text.props('ellipsis') as any;
    expect(ellipsis.showTooltip.type).toBe('popover');
    expect(ellipsis.showTooltip.opts).toEqual({ motion: false, className: 'my-pop', position: 'left' });
    // boolean form: only position is injected
    const b = mount(Anchor, { props: { showTooltip: true, position: 'top' }, slots: { default: () => h(AnchorLink, { href: '#a', title: 'A' }) } });
    expect((b.findComponent({ name: 'TypographyText' }).props('ellipsis') as any).showTooltip.opts).toEqual({ position: 'top' });
  });

  it('Anchor.Link static + link level padding for nested links', async () => {
    const w = mount(Anchor, { slots: { default: () => h(Anchor.Link, { href: '#p', title: 'P' }, () => h(Anchor.Link, { href: '#c', title: 'C' })) } });
    await wait();
    const titles = w.findAll('.semi-anchor-link-title');
    expect((titles[0].element as HTMLElement).style.paddingLeft).toBe('8px');
    expect((titles[1].element as HTMLElement).style.paddingLeft).toBe('16px');
    expect((w.vm as any).getChildMap()['#p'].has('#c')).toBe(true);
  });

  it('childMap also includes links rendered through wrapper components / fragments (registry merge)', async () => {
    const Wrapper = defineComponent({
      props: { items: { type: Array as any, default: () => [] } },
      setup(props: any, { slots }) {
        return () => h(Fragment, props.items.map((id: string) => h(Anchor.Link, { href: `#${id}`, title: id }, slots.default)));
      },
    });
    const w = mount(Anchor, {
      slots: {
        default: () => [h(Anchor.Link, { href: '#top', title: 'Top' }), h(Wrapper, { items: ['w1', 'w2'] }, () => h(Anchor.Link, { href: '#deep', title: 'Deep' }))],
      },
    });
    await wait();
    const map = (w.vm as any).getChildMap();
    expect(map['#top'].size).toBe(0);
    expect(map['#w1'].has('#deep')).toBe(true);
    expect(map['#w2'].has('#deep')).toBe(true);
    expect(map['#deep'].size).toBe(0);
    expect([...(w.vm as any).getLinks()].sort()).toEqual(['#deep', '#deep', '#top', '#w1', '#w2']);
    w.unmount();
  });

  it('autoCollapse with wrapper-rendered links: children appear once the parent becomes active and are mapped', async () => {
    const Wrapper = defineComponent({
      setup(_: any, { slots }) {
        return () => h(Fragment, [h(Anchor.Link, { href: '#w1', title: 'W1' }, slots.default)]);
      },
    });
    const w = mount(Anchor, {
      props: { autoCollapse: true },
      slots: { default: () => [h(Anchor.Link, { href: '#top', title: 'Top' }), h(Wrapper, null, () => h(Anchor.Link, { href: '#deep', title: 'Deep' }))] },
    });
    await wait();
    expect(w.text()).not.toContain('Deep');
    (w.vm as any).scrollTo('#w1');
    await wait();
    expect(w.text()).toContain('Deep');
    expect((w.vm as any).getChildMap()['#w1'].has('#deep')).toBe(true);
    // a deep active link keeps its wrapper-rendered parent expanded
    (w.vm as any).scrollTo('#deep');
    await wait();
    expect(w.text()).toContain('Deep');
    expect((w.vm as any).getActiveLink()).toBe('#deep');
    w.unmount();
  });
});
