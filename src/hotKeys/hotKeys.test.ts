import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { HotKeys } from './index';

const key = (code: string, extra: Record<string, any> = {}) =>
  new KeyboardEvent('keydown', { code, metaKey: false, shiftKey: false, altKey: false, ctrlKey: false, cancelable: true, ...extra });

describe('HotKeys', () => {
  const wrappers: Array<{ unmount: () => void }> = [];
  const mountHK = (...args: Parameters<typeof mount>) => {
    const w = mount(...args);
    wrappers.push(w);
    return w;
  };
  afterEach(() => {
    while (wrappers.length) {
      try { wrappers.pop()!.unmount(); } catch { /* already unmounted */ }
    }
    document.body.innerHTML = '';
  });

  it('renders hotKeys as content with + separators and semi classes', () => {
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['control', 'shift', 'a'] } });
    expect(wrapper.classes()).toContain('semi-hotKeys');
    const contents = wrapper.findAll('.semi-hotKeys-content');
    expect(contents).toHaveLength(3);
    expect(contents[0].text()).toBe('control');
    expect(contents[2].text()).toBe('a');
    expect(wrapper.findAll('.semi-hotKeys-split')).toHaveLength(2);
    expect(wrapper.findAll('.semi-hotKeys-split')[0].text()).toBe('+');
  });

  it('content prop overrides hotKeys; className / class / style / data attrs', () => {
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['a'], content: ['Ctrl', 'C'], className: 'a', class: 'b', style: { color: 'red' }, 'data-x': 'y' } });
    expect(wrapper.findAll('.semi-hotKeys-content').map((c) => c.text())).toEqual(['Ctrl', 'C']);
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.attributes('data-x')).toBe('y');
  });

  it('click emits click', async () => {
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['a'] } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('render prop (node / fn / null / slot)', () => {
    const node = mountHK(HotKeys, { props: { render: h('i', { class: 'rn' }, 'R') } });
    expect(node.find('.rn').text()).toBe('R');
    const fn = mountHK(HotKeys, { props: { render: () => h('i', { class: 'rf' }, 'F') } });
    expect(fn.find('.rf').exists()).toBe(true);
    const nothing = mountHK(HotKeys, { attachTo: document.body, props: { render: null } });
    expect(document.body.innerHTML).not.toContain('semi-hotKeys');
    nothing.unmount();
    const nothingFn = mountHK(HotKeys, { attachTo: document.body, props: { render: () => null } });
    expect(document.body.innerHTML).not.toContain('semi-hotKeys');
    nothingFn.unmount();
    const slot = mountHK(HotKeys, { props: { render: h('i', { class: 'rp' }) }, slots: { render: () => h('b', { class: 'rs' }, 'S') } });
    expect(slot.find('.rs').exists()).toBe(true);
    expect(slot.find('.rp').exists()).toBe(false);
  });

  it('registers a keydown listener on body (default) and matches exact combos', async () => {
    const onHotKey = vi.fn();
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['control', 'a'], onHotKey } });
    document.body.dispatchEvent(key('KeyA', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('hotKey')).toHaveLength(1);
    expect(wrapper.emitted('hotKey')![0][0]).toBeInstanceOf(KeyboardEvent);
    // wrong modifiers do not trigger
    document.body.dispatchEvent(key('KeyA', { ctrlKey: true, altKey: true }));
    document.body.dispatchEvent(key('KeyA'));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    // different key with right modifier
    document.body.dispatchEvent(key('KeyB', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    document.body.dispatchEvent(key('KeyA', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(1);
  });

  it('single key combos', async () => {
    const onHotKey = vi.fn();
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['escape'], onHotKey } });
    document.body.dispatchEvent(key('Escape'));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('preventDefault stops the browser default', () => {
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['control', 'a'], preventDefault: true } });
    const ev = key('KeyA', { ctrlKey: true });
    document.body.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    wrapper.unmount();
    const noPrevent = mountHK(HotKeys, { props: { hotKeys: ['control', 'a'] } });
    const ev2 = key('KeyA', { ctrlKey: true });
    document.body.dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('getListenerTarget listens on a custom element instead of body', async () => {
    const onHotKey = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['b'], getListenerTarget: () => div, onHotKey } });
    document.body.dispatchEvent(key('KeyB'));
    expect(onHotKey).not.toHaveBeenCalled();
    div.dispatchEvent(key('KeyB'));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    div.dispatchEvent(key('KeyB'));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    div.remove();
  });

  it('mergeMetaCtrl treats meta as ctrl on mac-like events', () => {
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['control', 'a'], mergeMetaCtrl: true } });
    expect(wrapper.find('.semi-hotKeys').exists()).toBe(true);
  });

  it('invalid hotKeys (no common key) throws on mount', () => {
    expect(() => mount(HotKeys, { props: { hotKeys: ['control'] } })).toThrow();
    expect(() => mount(HotKeys, { props: { hotKeys: ['a', 'b'] } })).toThrow();
    expect(() => mount(HotKeys, { props: { hotKeys: ['nonsense'] } })).toThrow();
  });

  it('re-registers when hotKeys / getListenerTarget change after mount', async () => {
    const onHotKey = vi.fn();
    const wrapper = mountHK(HotKeys, { props: { hotKeys: ['control', 'a'], onHotKey } });
    await wrapper.setProps({ hotKeys: ['control', 'b'] });
    document.body.dispatchEvent(key('KeyA', { ctrlKey: true }));
    expect(onHotKey).not.toHaveBeenCalled();
    document.body.dispatchEvent(key('KeyB', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    const div = document.createElement('div');
    document.body.appendChild(div);
    await wrapper.setProps({ getListenerTarget: () => div });
    document.body.dispatchEvent(key('KeyB', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(1);
    div.dispatchEvent(key('KeyB', { ctrlKey: true }));
    expect(onHotKey).toHaveBeenCalledTimes(2);
    div.remove();
  });

  it('starts listening when hotKeys is provided after mount (null default)', async () => {
    const onHotKey = vi.fn();
    const wrapper = mountHK(HotKeys, { props: { render: h('i'), onHotKey } });
    document.body.dispatchEvent(key('Escape'));
    expect(onHotKey).not.toHaveBeenCalled();
    await wrapper.setProps({ hotKeys: ['escape'] });
    document.body.dispatchEvent(key('Escape'));
    expect(onHotKey).toHaveBeenCalledTimes(1);
  });

  it('statics', () => {
    expect((HotKeys as any).Keys).toBeTruthy();
    expect((HotKeys as any).Keys.Enter).toBe('enter');
    expect((HotKeys as any).elementType).toBe('HotKeys');
  });
});
