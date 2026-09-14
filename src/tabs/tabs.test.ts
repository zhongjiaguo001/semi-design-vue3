import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Tabs, { TabPane, TabBar, TabItem } from './index';
import { IconSearch } from '../icons';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

const threePanes = (extra: Record<string, any> = {}) => [
  h(TabPane, { tab: 'Tab 1', itemKey: '1', ...extra }, () => 'content 1'),
  h(TabPane, { tab: 'Tab 2', itemKey: '2' }, () => 'content 2'),
  h(TabPane, { tab: 'Tab 3', itemKey: '3', disabled: true }, () => 'content 3'),
];

describe('Tabs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper, bar, tabs and panes with defaults (line / top / large)', () => {
    const wrapper = mount(Tabs, { slots: { default: () => threePanes() } });
    expect(wrapper.classes()).toContain('semi-tabs');
    expect(wrapper.classes()).toContain('semi-tabs-top');
    const bar = wrapper.find('.semi-tabs-bar');
    expect(bar.classes()).toContain('semi-tabs-bar-line');
    expect(bar.classes()).toContain('semi-tabs-bar-top');
    expect(bar.attributes('role')).toBe('tablist');
    expect(bar.attributes('aria-orientation')).toBe('horizontal');
    const tabs = wrapper.findAll('.semi-tabs-tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].classes()).toContain('semi-tabs-tab-active');
    expect(tabs[0].classes()).toContain('semi-tabs-tab-line');
    expect(tabs[0].classes()).toContain('semi-tabs-tab-top');
    expect(tabs[0].classes()).toContain('semi-tabs-tab-single');
    expect(tabs[0].attributes('role')).toBe('tab');
    expect(tabs[0].attributes('id')).toBe('semiTab1');
    expect(tabs[0].attributes('aria-controls')).toBe('semiTabPanel1');
    expect(tabs[0].attributes('aria-selected')).toBe('true');
    expect(tabs[0].attributes('tabindex')).toBe('0');
    expect(tabs[1].attributes('tabindex')).toBe('-1');
    expect(tabs[2].classes()).toContain('semi-tabs-tab-disabled');
    expect(tabs[2].attributes('aria-disabled')).toBe('true');
    const content = wrapper.find('.semi-tabs-content');
    expect(content.classes()).toContain('semi-tabs-content-top');
    const panes = wrapper.findAll('.semi-tabs-pane');
    expect(panes).toHaveLength(3); // keepDOM defaults to true
    expect(panes[0].classes()).toContain('semi-tabs-pane-active');
    expect(panes[0].attributes('role')).toBe('tabpanel');
    expect(panes[0].attributes('id')).toBe('semiTabPanel1');
    expect(panes[0].attributes('aria-labelledby')).toBe('semiTab1');
    expect(panes[0].attributes('aria-hidden')).toBe('false');
    expect(panes[1].classes()).toContain('semi-tabs-pane-inactive');
    expect(panes[1].attributes('aria-hidden')).toBe('true');
    expect(panes[0].find('.semi-tabs-pane-motion-overlay').text()).toBe('content 1');
  });

  it.each(['line', 'card', 'button', 'slash'] as const)('type=%s', (type) => {
    const wrapper = mount(Tabs, { props: { type }, slots: { default: () => threePanes() } });
    expect(wrapper.find('.semi-tabs-bar').classes()).toContain(`semi-tabs-bar-${type}`);
    expect(wrapper.find('.semi-tabs-tab').classes()).toContain(`semi-tabs-tab-${type}`);
  });

  it.each([
    ['small', 'semi-tabs-tab-small'],
    ['medium', 'semi-tabs-tab-medium'],
  ] as const)('size=%s', (size, klass) => {
    const wrapper = mount(Tabs, { props: { size }, slots: { default: () => threePanes() } });
    expect(wrapper.find('.semi-tabs-tab').classes()).toContain(klass);
  });

  it('size=large has no size modifier', () => {
    const wrapper = mount(Tabs, { props: { size: 'large' }, slots: { default: () => threePanes() } });
    const c = wrapper.find('.semi-tabs-tab').classes();
    expect(c).not.toContain('semi-tabs-tab-small');
    expect(c).not.toContain('semi-tabs-tab-medium');
  });

  it('tabPosition=left', () => {
    const wrapper = mount(Tabs, { props: { tabPosition: 'left' }, slots: { default: () => threePanes() } });
    expect(wrapper.classes()).toContain('semi-tabs-left');
    expect(wrapper.find('.semi-tabs-bar').classes()).toContain('semi-tabs-bar-left');
    expect(wrapper.find('.semi-tabs-bar').attributes('aria-orientation')).toBe('vertical');
    expect(wrapper.find('.semi-tabs-tab').classes()).toContain('semi-tabs-tab-left');
    expect(wrapper.find('.semi-tabs-content').classes()).toContain('semi-tabs-content-left');
  });

  it('tabList renders the bar and default slot as content', () => {
    const wrapper = mount(Tabs, {
      props: { tabList: [{ tab: 'A', itemKey: 'a' }, { tab: 'B', itemKey: 'b', disabled: true }] },
      slots: { default: () => h('div', { class: 'custom-content' }, 'x') },
    });
    const tabs = wrapper.findAll('.semi-tabs-tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].text()).toBe('A');
    expect(tabs[0].classes()).toContain('semi-tabs-tab-active');
    expect(tabs[1].classes()).toContain('semi-tabs-tab-disabled');
    expect(wrapper.find('.semi-tabs-content .custom-content').exists()).toBe(true);
  });

  it('tabList change re-collects panes', async () => {
    const wrapper = mount(Tabs, { props: { tabList: [{ tab: 'A', itemKey: 'a' }] } });
    expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(1);
    await wrapper.setProps({ tabList: [{ tab: 'A', itemKey: 'a' }, { tab: 'B', itemKey: 'b' }] });
    expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(2);
  });

  it('defaultActiveKey selects initial tab; first non-disabled tab when omitted', () => {
    const wrapper = mount(Tabs, { props: { defaultActiveKey: '2' }, slots: { default: () => threePanes() } });
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
    const w2 = mount(Tabs, {
      slots: { default: () => [h(TabPane, { tab: 'd', itemKey: 'd', disabled: true }), h(TabPane, { tab: 'e', itemKey: 'e' })] },
    });
    expect(w2.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
  });

  it('uncontrolled click switches tab and emits change + tabClick + update:activeKey', async () => {
    const wrapper = mount(Tabs, { slots: { default: () => threePanes() } });
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
    expect(wrapper.findAll('.semi-tabs-pane')[1].classes()).toContain('semi-tabs-pane-active');
    expect(wrapper.emitted('change')![0]).toEqual(['2']);
    expect(wrapper.emitted('update:activeKey')![0]).toEqual(['2']);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2']);
    expect(wrapper.emitted('tabClick')![0][0]).toBe('2');
    expect(wrapper.emitted('tabClick')![0][1]).toBeInstanceOf(Event);
    // clicking the active tab again: tabClick but no change
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('tabClick')).toHaveLength(2);
  });

  it('disabled tab does not switch or emit', async () => {
    const wrapper = mount(Tabs, { slots: { default: () => threePanes() } });
    await wrapper.findAll('.semi-tabs-tab')[2].trigger('click');
    expect(wrapper.findAll('.semi-tabs-tab')[0].classes()).toContain('semi-tabs-tab-active');
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('tabClick')).toBeUndefined();
  });

  it('controlled activeKey: does not switch until parent updates', async () => {
    const wrapper = mount(Tabs, { props: { activeKey: '1' }, slots: { default: () => threePanes() } });
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual(['2']);
    expect(wrapper.findAll('.semi-tabs-tab')[0].classes()).toContain('semi-tabs-tab-active');
    await wrapper.setProps({ activeKey: '2' });
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
  });

  it('v-model:activeKey works', async () => {
    const Parent = defineComponent({
      setup() {
        const k = ref('1');
        return () => h('div', [h(Tabs, { activeKey: k.value, 'onUpdate:activeKey': (v: string) => (k.value = v) }, () => threePanes()), h('span', { id: 'out' }, k.value)]);
      },
    });
    const wrapper = mount(Parent);
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.find('#out').text()).toBe('2');
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
  });

  it('plain v-model (modelValue) aliases activeKey', async () => {
    const Parent = defineComponent({
      setup() {
        const k = ref('2');
        return () => h('div', [h(Tabs, { modelValue: k.value, 'onUpdate:modelValue': (v: string) => (k.value = v) }, () => threePanes()), h('span', { id: 'out' }, k.value)]);
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
    await wrapper.findAll('.semi-tabs-tab')[0].trigger('click');
    expect(wrapper.find('#out').text()).toBe('1');
  });

  it('keepDOM=false only renders the active pane', async () => {
    const wrapper = mount(Tabs, { props: { keepDOM: false }, slots: { default: () => threePanes() } });
    expect(wrapper.findAll('.semi-tabs-pane')).toHaveLength(1);
    expect(wrapper.find('.semi-tabs-pane').text()).toBe('content 1');
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.findAll('.semi-tabs-pane')).toHaveLength(1);
    expect(wrapper.find('.semi-tabs-pane').text()).toBe('content 2');
  });

  it('lazyRender only renders pane content once activated', async () => {
    const wrapper = mount(Tabs, { props: { lazyRender: true }, slots: { default: () => threePanes() } });
    const panes = wrapper.findAll('.semi-tabs-pane');
    expect(panes[0].text()).toBe('content 1');
    expect(panes[1].text()).toBe('');
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    expect(wrapper.findAll('.semi-tabs-pane')[1].text()).toBe('content 2');
    // stays rendered after switching back
    await wrapper.findAll('.semi-tabs-tab')[0].trigger('click');
    expect(wrapper.findAll('.semi-tabs-pane')[1].text()).toBe('content 2');
  });

  it('closable tabs render close icon and emit tabClose on click (without switching)', async () => {
    const wrapper = mount(Tabs, {
      slots: { default: () => [h(TabPane, { tab: 'A', itemKey: 'a', closable: true }), h(TabPane, { tab: 'B', itemKey: 'b', closable: true })] },
    });
    const icons = wrapper.findAll('.semi-tabs-tab-icon-close');
    expect(icons).toHaveLength(2);
    expect(icons[0].attributes('role')).toBe('button');
    expect(icons[0].attributes('aria-label')).toBe('Close');
    await icons[1].trigger('click');
    expect(wrapper.emitted('tabClose')![0]).toEqual(['b']);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('pane icon renders inside the tab', () => {
    const wrapper = mount(Tabs, { slots: { default: () => [h(TabPane, { tab: 'A', itemKey: 'a', icon: h(IconSearch) })] } });
    expect(wrapper.find('.semi-tabs-tab .semi-tabs-bar-icon .semi-icon-search').exists()).toBe(true);
  });

  it('tab can be a render function / vnode', () => {
    const wrapper = mount(Tabs, { slots: { default: () => [h(TabPane, { tab: () => h('b', 'bold'), itemKey: 'a' }), h(TabPane, { tab: h('i', 'it'), itemKey: 'b' })] } });
    expect(wrapper.find('.semi-tabs-tab b').text()).toBe('bold');
    expect(wrapper.findAll('.semi-tabs-tab')[1].find('i').text()).toBe('it');
  });

  it('tabBarExtraContent prop and slot', () => {
    const w1 = mount(Tabs, { props: { tabBarExtraContent: h('button', { class: 'extra' }, 'x'), type: 'card', size: 'small' }, slots: { default: () => threePanes() } });
    const extra = w1.find('.semi-tabs-bar-extra');
    expect(extra.exists()).toBe(true);
    expect(extra.classes()).toContain('semi-tabs-bar-card-extra');
    expect(extra.classes()).toContain('semi-tabs-bar-card-extra-small');
    expect(extra.attributes('x-semi-prop')).toBe('tabBarExtraContent');
    expect(extra.find('.extra').exists()).toBe(true);
    expect((extra.element as HTMLElement).style.float).toBe('right');
    const w2 = mount(Tabs, { slots: { default: () => threePanes(), tabBarExtraContent: () => h('em', 'slot extra') } });
    expect(w2.find('.semi-tabs-bar-extra em').text()).toBe('slot extra');
    const w3 = mount(Tabs, { slots: { default: () => threePanes() } });
    expect(w3.find('.semi-tabs-bar-extra').exists()).toBe(false);
  });

  it('renderTabBar prop receives tabBarProps and DefaultTabBar', () => {
    const renderTabBar = vi.fn((tabBarProps: any, DefaultTabBar: any) => h('div', { class: 'custom-bar' }, [h(DefaultTabBar, { ...tabBarProps, className: 'inner-bar' })]));
    const wrapper = mount(Tabs, { props: { renderTabBar }, slots: { default: () => threePanes() } });
    expect(renderTabBar).toHaveBeenCalled();
    expect(renderTabBar.mock.calls[0][1]).toBe(TabBar);
    expect(renderTabBar.mock.calls[0][0].list).toHaveLength(3);
    expect(renderTabBar.mock.calls[0][0].activeKey).toBe('1');
    expect(wrapper.find('.custom-bar .semi-tabs-bar.inner-bar').exists()).toBe(true);
    expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(3);
  });

  it('renderTabBar slot', () => {
    const wrapper = mount(Tabs, {
      slots: { default: () => threePanes(), renderTabBar: ({ tabBarProps, DefaultTabBar }: any) => h('div', { class: 'slot-bar' }, [h(DefaultTabBar, tabBarProps)]) },
    });
    expect(wrapper.find('.slot-bar .semi-tabs-bar').exists()).toBe(true);
  });

  it('tabBarClassName / tabBarStyle / contentStyle / class / style / data-* attrs', () => {
    const wrapper = mount(Tabs, {
      attrs: { class: 'my-tabs', style: 'width: 100px', 'data-foo': 'bar' },
      props: { tabBarClassName: 'my-bar', tabBarStyle: { color: 'red' }, contentStyle: { padding: '8px' }, className: 'cls-prop' },
      slots: { default: () => threePanes() },
    });
    expect(wrapper.classes()).toContain('my-tabs');
    expect(wrapper.classes()).toContain('cls-prop');
    expect((wrapper.element as HTMLElement).style.width).toBe('100px');
    expect(wrapper.attributes('data-foo')).toBe('bar');
    const bar = wrapper.find('.semi-tabs-bar');
    expect(bar.classes()).toContain('my-bar');
    expect((bar.element as HTMLElement).style.color).toBe('red');
    expect((wrapper.find('.semi-tabs-content').element as HTMLElement).style.padding).toBe('8px');
  });

  it('TabPane className / style / tabIndex / data attrs', () => {
    const wrapper = mount(Tabs, {
      slots: { default: () => [h(TabPane, { tab: 'A', itemKey: 'a', className: 'pane-cls', style: { color: 'blue' }, tabIndex: 3, 'data-x': 'y' })] },
    });
    const pane = wrapper.find('.semi-tabs-pane');
    expect(pane.classes()).toContain('pane-cls');
    expect((pane.element as HTMLElement).style.color).toBe('blue');
    expect(pane.attributes('tabindex')).toBe('3');
    expect(pane.attributes('data-x')).toBe('y');
    expect(pane.attributes('x-semi-prop')).toBe('children');
  });

  it('when the active pane is removed the first pane becomes active', async () => {
    const keys = ref(['1', '2', '3']);
    const Parent = defineComponent({
      setup() {
        return () => h(Tabs, { defaultActiveKey: '2' }, () => keys.value.map((k) => h(TabPane, { tab: `T${k}`, itemKey: k }, () => `c${k}`)));
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.findAll('.semi-tabs-tab')[1].classes()).toContain('semi-tabs-tab-active');
    keys.value = ['1', '3'];
    await nextTick();
    await nextTick();
    const tabs = wrapper.findAll('.semi-tabs-tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].classes()).toContain('semi-tabs-tab-active');
  });

  it('async added panes: first pane gets activated when none existed', async () => {
    const keys = ref<string[]>([]);
    const Parent = defineComponent({
      setup() {
        return () => h(Tabs, null, () => keys.value.map((k) => h(TabPane, { tab: `T${k}`, itemKey: k }, () => `c${k}`)));
      },
    });
    const wrapper = mount(Parent);
    expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(0);
    keys.value = ['x', 'y'];
    await nextTick();
    await nextTick();
    expect(wrapper.findAll('.semi-tabs-tab')[0].classes()).toContain('semi-tabs-tab-active');
    expect(wrapper.findAll('.semi-tabs-pane')[0].classes()).toContain('semi-tabs-pane-active');
  });

  it('tabPaneMotion=false disables animation classes', async () => {
    const wrapper = mount(Tabs, { props: { tabPaneMotion: false }, slots: { default: () => threePanes() } });
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    const overlay = wrapper.findAll('.semi-tabs-pane')[1].find('.semi-tabs-pane-motion-overlay');
    expect(overlay.classes()).not.toContain('semi-tabs-pane-animate-leftShow');
    expect(overlay.classes()).not.toContain('semi-tabs-pane-animate-rightShow');
  });

  it('tabPaneMotion applies direction class to the newly active pane', async () => {
    const wrapper = mount(Tabs, { slots: { default: () => threePanes() } });
    await wrapper.findAll('.semi-tabs-tab')[1].trigger('click');
    await nextTick();
    const overlay = wrapper.findAll('.semi-tabs-pane')[1].find('.semi-tabs-pane-motion-overlay');
    expect(overlay.classes()).toContain('semi-tabs-pane-animate-leftShow');
    await wrapper.findAll('.semi-tabs-tab')[0].trigger('click');
    await nextTick();
    expect(wrapper.findAll('.semi-tabs-pane')[0].find('.semi-tabs-pane-motion-overlay').classes()).toContain('semi-tabs-pane-animate-rightShow');
  });

  describe('keyboard', () => {
    it('ArrowRight / ArrowLeft move focus between enabled tabs (wrapping)', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, slots: { default: () => threePanes() } });
      const tabs = wrapper.findAll('.semi-tabs-tab');
      (tabs[0].element as HTMLElement).focus();
      await tabs[0].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tabs[1].element);
      // tab 3 is disabled so it is skipped -> wraps to first
      await tabs[1].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tabs[0].element);
      await tabs[0].trigger('keydown', { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tabs[1].element);
      wrapper.unmount();
    });

    it('ArrowUp / ArrowDown are used when tabPosition=left; Home / End jump', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { tabPosition: 'left' }, slots: { default: () => threePanes() } });
      const tabs = wrapper.findAll('.semi-tabs-tab');
      (tabs[0].element as HTMLElement).focus();
      await tabs[0].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tabs[0].element);
      await tabs[0].trigger('keydown', { key: 'ArrowDown' });
      expect(document.activeElement).toBe(tabs[1].element);
      await tabs[1].trigger('keydown', { key: 'Home' });
      expect(document.activeElement).toBe(tabs[0].element);
      await tabs[0].trigger('keydown', { key: 'End' });
      expect(document.activeElement).toBe(tabs[1].element);
      wrapper.unmount();
    });

    it('Enter / Space activate; Delete closes closable tab and moves focus', async () => {
      const wrapper = mount(Tabs, {
        attachTo: document.body,
        slots: { default: () => [h(TabPane, { tab: 'A', itemKey: 'a', closable: true }), h(TabPane, { tab: 'B', itemKey: 'b', closable: true })] },
      });
      const tabs = wrapper.findAll('.semi-tabs-tab');
      await tabs[1].trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('change')![0]).toEqual(['b']);
      await tabs[0].trigger('keydown', { key: ' ' });
      expect(wrapper.emitted('change')![1]).toEqual(['a']);
      (tabs[0].element as HTMLElement).focus();
      await tabs[0].trigger('keydown', { key: 'Delete' });
      expect(wrapper.emitted('tabClose')![0]).toEqual(['a']);
      expect(document.activeElement).toBe(tabs[1].element);
      wrapper.unmount();
    });

    it('preventScroll is passed to focus()', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { preventScroll: true }, slots: { default: () => threePanes() } });
      const tabs = wrapper.findAll('.semi-tabs-tab');
      const spy = vi.spyOn(tabs[1].element as HTMLElement, 'focus');
      await tabs[0].trigger('keydown', { key: 'ArrowRight' });
      expect(spy).toHaveBeenCalledWith({ preventScroll: true });
      wrapper.unmount();
    });
  });

  describe('collapsible', () => {
    let instances: any[] = [];
    const OriginalIO = (globalThis as any).IntersectionObserver;
    beforeEach(() => {
      instances = [];
      (globalThis as any).IntersectionObserver = class {
        cb: any;
        opts: any;
        targets: Element[] = [];
        constructor(cb: any, opts: any) {
          this.cb = cb;
          this.opts = opts;
          instances.push(this);
        }
        observe(el: Element) {
          this.targets.push(el);
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      };
    });
    afterEach(() => {
      (globalThis as any).IntersectionObserver = OriginalIO;
    });

    const manyPanes = () => ['1', '2', '3', '4', '5'].map((k) => h(TabPane, { tab: `Tab ${k}`, itemKey: k }, () => `c${k}`));

    it('renders the overflow list with scroll wrapper and disabled arrows (both) by default', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: true }, slots: { default: () => manyPanes() } });
      await nextTick();
      expect(wrapper.find('.semi-tabs-bar').classes()).toContain('semi-tabs-bar-collapse');
      const list = wrapper.find('.semi-overflow-list');
      expect(list.classes()).toContain('semi-tabs-bar-overflow-list');
      const children = Array.from(list.element.children);
      expect(children[0].classList.contains('semi-tabs-bar-arrow-start')).toBe(true);
      expect(children[1].classList.contains('semi-overflow-list-scroll-wrapper')).toBe(true);
      expect(children[2].classList.contains('semi-tabs-bar-arrow-end')).toBe(true);
      expect(wrapper.findAll('.semi-tabs-bar-arrow button.semi-button-disabled')).toHaveLength(2);
      const items = wrapper.findAll('.semi-overflow-list-scroll-wrapper .semi-tabs-tab');
      expect(items).toHaveLength(5);
      expect(items[0].attributes('data-scrollkey')).toBe('1-bar');
      expect(instances.length).toBeGreaterThan(0);
      expect(instances[instances.length - 1].targets).toHaveLength(5);
      wrapper.unmount();
    });

    it.each([
      ['start', ['semi-tabs-bar-arrow-start', 'semi-tabs-bar-arrow-end', 'semi-overflow-list-scroll-wrapper']],
      ['end', ['semi-overflow-list-scroll-wrapper', 'semi-tabs-bar-arrow-start', 'semi-tabs-bar-arrow-end']],
    ] as const)('arrowPosition=%s', async (arrowPosition, order) => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: true, arrowPosition }, slots: { default: () => manyPanes() } });
      await nextTick();
      const children = Array.from(wrapper.find('.semi-overflow-list').element.children);
      order.forEach((c, i) => expect(children[i].classList.contains(c)).toBe(true));
      wrapper.unmount();
    });

    it('visibleTabsStyle is applied to the scroll wrapper', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: true, visibleTabsStyle: { maxWidth: '200px' } }, slots: { default: () => manyPanes() } });
      await nextTick();
      expect((wrapper.find('.semi-overflow-list-scroll-wrapper').element as HTMLElement).style.maxWidth).toBe('200px');
      wrapper.unmount();
    });

    it('intersection updates enable arrows, emit visibleTabsChange and show the rest in a dropdown', async () => {
      const onVisibleTabsChange = vi.fn();
      const wrapper = mount(Tabs, {
        attachTo: document.body,
        props: { collapsible: true, onVisibleTabsChange, defaultActiveKey: '3' },
        slots: { default: () => manyPanes() },
      });
      await nextTick();
      const io = instances[instances.length - 1];
      const entries = io.targets.map((t: Element, i: number) => ({ target: t, isIntersecting: i >= 1 && i <= 3, boundingClientRect: { y: 0 } }));
      io.cb(entries);
      await nextTick();
      expect(onVisibleTabsChange).toHaveBeenCalled();
      const map: Map<string, boolean> = onVisibleTabsChange.mock.calls[0][0];
      expect(map.get('1')).toBe(false);
      expect(map.get('2')).toBe(true);
      expect(map.get('5')).toBe(false);
      expect(wrapper.emitted('visibleTabsChange')![0][0]).toBe(map);
      // arrows are now enabled, wrapped in dropdown triggers
      expect(wrapper.findAll('.semi-tabs-bar-arrow button.semi-button-disabled')).toHaveLength(0);
      const startArrow = wrapper.find('.semi-tabs-bar-arrow-start');
      expect(startArrow.exists()).toBe(true);
      // hover the start arrow -> dropdown with the hidden tab
      await startArrow.trigger('mouseenter');
      await wait();
      const dropdown = document.querySelector('.semi-dropdown') as HTMLElement;
      expect(dropdown).toBeTruthy();
      expect(document.querySelector('.semi-dropdown-wrapper.semi-tabs-bar-dropdown')).toBeTruthy();
      const items = dropdown.querySelectorAll('.semi-dropdown-item');
      expect(items).toHaveLength(1);
      expect(items[0].textContent).toBe('Tab 1');
      expect(items[0].classList.contains('semi-dropdown-item-withTick')).toBe(true);
      (items[0] as HTMLElement).click();
      await nextTick();
      expect(wrapper.emitted('change')![0]).toEqual(['1']);
      // arrow click scrolls the last hidden item into view
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
      await startArrow.trigger('click');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      wrapper.unmount();
    });

    it('showRestInDropdown=false renders arrows without dropdown', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: true, showRestInDropdown: false }, slots: { default: () => manyPanes() } });
      await nextTick();
      const io = instances[instances.length - 1];
      io.cb(io.targets.map((t: Element, i: number) => ({ target: t, isIntersecting: i >= 2, boundingClientRect: { y: 0 } })));
      await nextTick();
      const startArrow = wrapper.find('.semi-tabs-bar-arrow-start');
      expect(startArrow.find('button').classes()).not.toContain('semi-button-disabled');
      await startArrow.trigger('mouseenter');
      await wait();
      expect(document.querySelector('.semi-dropdown')).toBeNull();
      wrapper.unmount();
    });

    it('renderArrow customises the arrow node', async () => {
      const renderArrow = vi.fn((items: any[], pos: string, onClick: () => void, _defaultNode?: any) => h('span', { class: `arrow-${pos}`, onClick }, String(items.length)));
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: true, renderArrow }, slots: { default: () => manyPanes() } });
      await nextTick();
      expect(wrapper.find('.arrow-start').exists()).toBe(true);
      expect(wrapper.find('.arrow-end').exists()).toBe(true);
      expect(renderArrow.mock.calls[0][1]).toBe('start');
      expect(renderArrow.mock.calls[0][3]).toBeTruthy();
      wrapper.unmount();
    });

    it('dropdownProps are forwarded per side', async () => {
      const wrapper = mount(Tabs, {
        attachTo: document.body,
        props: { collapsible: true, dropdownProps: { start: { className: 'start-dd' }, end: { className: 'end-dd' } } },
        slots: { default: () => manyPanes() },
      });
      await nextTick();
      const io = instances[instances.length - 1];
      io.cb(io.targets.map((t: Element, i: number) => ({ target: t, isIntersecting: i === 2, boundingClientRect: { y: 0 } })));
      await nextTick();
      await wrapper.find('.semi-tabs-bar-arrow-end').trigger('mouseenter');
      await wait();
      expect(document.querySelector('.semi-dropdown-wrapper.end-dd')).toBeTruthy();
      wrapper.unmount();
    });

    it('collapsible=auto collapses when the bar overflows', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { collapsible: 'auto' }, slots: { default: () => manyPanes() } });
      await wait(50);
      expect(wrapper.find('.semi-tabs-bar').classes()).not.toContain('semi-tabs-bar-collapse');
      const bar = wrapper.find('.semi-tabs-bar').element as HTMLElement;
      Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 500 });
      Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 100 });
      await wrapper.setProps({ tabList: [{ tab: 'a', itemKey: 'a' }, { tab: 'b', itemKey: 'b' }] });
      await nextTick();
      expect(wrapper.find('.semi-tabs-bar').classes()).toContain('semi-tabs-bar-collapse');
      wrapper.unmount();
    });
  });

  describe('more', () => {
    const manyPanes = () => ['1', '2', '3', '4'].map((k) => h(TabPane, { tab: `Tab ${k}`, itemKey: k }, () => `c${k}`));

    it('more=number hides the last n tabs behind a "more" trigger with a dropdown', async () => {
      const wrapper = mount(Tabs, { attachTo: document.body, props: { more: 2, type: 'card' }, slots: { default: () => manyPanes() } });
      expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(2);
      const trigger = wrapper.find('.semi-tabs-bar-more-trigger');
      expect(trigger.exists()).toBe(true);
      expect(trigger.classes()).toContain('semi-tabs-bar-more-trigger-card');
      expect(trigger.find('.semi-tabs-bar-more-trigger-content').text()).toBe('更多');
      expect(trigger.find('.semi-tabs-bar-more-trigger-content-icon').exists()).toBe(true);
      await trigger.trigger('mouseenter');
      await wait();
      expect(document.querySelector('.semi-dropdown-wrapper.semi-tabs-bar-more-dropdown-card')).toBeTruthy();
      const items = document.querySelectorAll('.semi-dropdown-item');
      expect(items).toHaveLength(2);
      expect(items[0].textContent).toBe('Tab 3');
      (items[1] as HTMLElement).click();
      await nextTick();
      expect(wrapper.emitted('change')![0]).toEqual(['4']);
      expect(wrapper.emitted('tabClick')![0][0]).toBe('4');
      wrapper.unmount();
    });

    it('more=object with count, render and dropdownProps', async () => {
      const wrapper = mount(Tabs, {
        attachTo: document.body,
        props: { more: { count: 1, render: () => h('span', { class: 'my-more' }, 'MORE'), dropdownProps: { className: 'my-dd' } } },
        slots: { default: () => manyPanes() },
      });
      expect(wrapper.findAll('.semi-tabs-tab')).toHaveLength(3);
      expect(wrapper.find('.semi-tabs-bar-more-trigger').exists()).toBe(false);
      const trigger = wrapper.find('.my-more');
      expect(trigger.exists()).toBe(true);
      await trigger.trigger('mouseenter');
      await wait();
      expect(document.querySelector('.semi-dropdown-wrapper.my-dd')).toBeTruthy();
      expect(document.querySelectorAll('.semi-dropdown-item')).toHaveLength(1);
      wrapper.unmount();
    });
  });

  it('exposes foundation', () => {
    const wrapper = mount(Tabs, { slots: { default: () => threePanes() } });
    expect((wrapper.vm as any).foundation).toBeTruthy();
    expect(typeof (wrapper.vm as any).foundation.handleTabClick).toBe('function');
  });

  it('Tabs.TabPane static and elementType', () => {
    expect((Tabs as any).TabPane).toBe(TabPane);
    expect((TabPane as any).isTabPane).toBe(true);
    expect((Tabs as any).elementType).toBe('Tabs');
  });
});

describe('Tabs parity additions', () => {
  it('TabPane tab / icon can be given as same-named slots (slot wins over prop)', () => {
    const wrapper = mount(Tabs, {
      slots: {
        default: () => [
          h(TabPane, { itemKey: 'a', tab: 'prop tab' }, { default: () => 'content a', tab: () => h('b', 'slot tab'), icon: () => h(IconSearch) }),
          h(TabPane, { itemKey: 'b', tab: 'B' }, { default: () => 'content b' }),
        ],
      },
    });
    const first = wrapper.findAll('.semi-tabs-tab')[0];
    expect(first.find('b').text()).toBe('slot tab');
    expect(first.text()).not.toContain('prop tab');
    expect(first.find('.semi-tabs-bar-icon .semi-icon-search').exists()).toBe(true);
  });

  it('tabBarExtraContent style is merged into the extra wrapper (React parity)', () => {
    const wrapper = mount(Tabs, {
      props: { tabBarExtraContent: h('button', { style: { marginRight: '8px' } }, 'x') },
      slots: { default: () => threePanes() },
    });
    const extra = wrapper.find('.semi-tabs-bar-extra').element as HTMLElement;
    expect(extra.style.float).toBe('right');
    expect(extra.style.marginRight).toBe('8px');
  });

  it('TabItem forwards extra attrs (draggable / data-*) to its root for custom tab bars', () => {
    const wrapper = mount(TabItem, { props: { itemKey: 'x', tab: 'X' }, attrs: { draggable: 'true', 'data-id': 'x', style: { opacity: '0.5' } } });
    expect(wrapper.attributes('draggable')).toBe('true');
    expect(wrapper.attributes('data-id')).toBe('x');
    expect((wrapper.element as HTMLElement).style.opacity).toBe('0.5');
  });
});
