import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { Highlight, getHighLightTextHTML, normalizeHighlightStyle } from './index';

describe('Highlight', () => {
  it('renders text with <mark> around matches', () => {
    const wrapper = mount(Highlight, { props: { sourceString: 'aaa do dollar aaa', searchWords: ['do'] } });
    expect(wrapper.element.textContent).toBe('aaa do dollar aaa');
    // 'do' matches both "do" and inside "dollar"
    expect(wrapper.findAll('mark')).toHaveLength(2);
    expect(wrapper.findAll('mark')[0].text()).toBe('do');
    expect(wrapper.findAll('mark')[0].classes()).toContain('semi-highlight-tag');
  });

  it('multiple words produce one chunk per match (overlaps merged per word run)', () => {
    const wrapper = mount(Highlight, { props: { sourceString: 'aaa do dollar aaa', searchWords: ['do', 'dollar'] } });
    expect(wrapper.element.textContent).toBe('aaa do dollar aaa');
    expect(wrapper.findAll('mark')).toHaveLength(2);
    expect(wrapper.findAll('mark')[0].text()).toBe('do');
    expect(wrapper.findAll('mark')[1].text()).toBe('dollar');
  });

  it('caseSensitive=false by default; caseSensitive=true only matches exact case', () => {
    const ci = mount(Highlight, { props: { sourceString: 'Abc abc', searchWords: ['abc'] } });
    expect(ci.findAll('mark')).toHaveLength(2);
    const cs = mount(Highlight, { props: { sourceString: 'Abc abc', searchWords: ['abc'], caseSensitive: true } });
    expect(cs.findAll('mark')).toHaveLength(1);
    expect(cs.element.textContent).toBe('Abc abc');
  });

  it('autoEscape=false treats search words as regex', () => {
    const escaped = mount(Highlight, { props: { sourceString: 'a.c aXc', searchWords: ['a.c'], autoEscape: true } });
    expect(escaped.findAll('mark')).toHaveLength(1);
    const regex = mount(Highlight, { props: { sourceString: 'a.c aXc', searchWords: ['a.c'], autoEscape: false } });
    expect(regex.findAll('mark')).toHaveLength(2);
    expect(regex.element.textContent).toBe('a.c aXc');
  });

  it('text prop is an alias of sourceString; searchWords as string; empty default', () => {
    const wrapper = mount(Highlight, { props: { text: 'hello world', searchWords: 'world' } });
    expect(wrapper.findAll('mark')).toHaveLength(1);
    expect(wrapper.find('mark').text()).toBe('world');
    expect(mount(Highlight).element.textContent).toBe('');
  });

  it('highlightClassName / highlightStyle / component', () => {
    const wrapper = mount(Highlight, {
      props: { sourceString: 'x y x', searchWords: ['x'], highlightClassName: 'extra', highlightStyle: { color: 'red' }, component: 'em' },
    });
    const marks = wrapper.findAll('em');
    expect(marks).toHaveLength(2);
    expect(marks[0].classes()).toContain('semi-highlight-tag');
    expect(marks[0].classes()).toContain('extra');
    expect(marks[0].attributes('style')).toContain('color: red');
  });

  it('complex search words with className / style', () => {
    const wrapper = mount(Highlight, {
      props: { sourceString: 'foo bar', searchWords: [{ text: 'foo', className: 'f', style: { background: 'yellow' } }, 'bar'] },
    });
    const marks = wrapper.findAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0].classes()).toContain('f');
    expect(marks[0].attributes('style')).toContain('background: yellow');
    expect(marks[1].classes()).toContain('semi-highlight-tag');
  });

  it('getHighLightTextHTML helper returns vnodes', () => {
    const nodes = getHighLightTextHTML({ sourceString: 'abc', searchWords: ['b'], option: { highlightTag: 'b' } });
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toBe('a');
    expect(nodes[2]).toBe('c');
    const mark = nodes[1] as any;
    expect(mark.type).toBe('b');
    expect(mark.children).toBe('b');
    expect(mark.props.style).toEqual({});
  });

  it('numeric style values get a px suffix like React (unitless props untouched)', () => {
    const wrapper = mount(Highlight, {
      props: { sourceString: 'x y', searchWords: ['x'], highlightStyle: { borderRadius: 6, opacity: 1, marginLeft: 0 } },
    });
    const style = wrapper.find('mark').attributes('style');
    expect(style).toContain('border-radius: 6px');
    expect(style).toContain('opacity: 1');
    expect(style).toContain('margin-left: 0');
    expect(normalizeHighlightStyle({ padding: 4, zIndex: 2, color: 'red', '--x': 3 })).toEqual({ padding: '4px', zIndex: 2, color: 'red', '--x': 3 });
    expect(normalizeHighlightStyle(undefined)).toEqual({});
  });

  it('complex search words: per-word numeric style also normalized', () => {
    const wrapper = mount(Highlight, {
      props: { sourceString: 'foo', searchWords: [{ text: 'foo', style: { padding: 4 } }] },
    });
    expect(wrapper.find('mark').attributes('style')).toContain('padding: 4px');
  });

  it('exposes getHighLightTextHTML on the component instance (React instance method parity)', () => {
    const wrapper = mount(Highlight, { props: { sourceString: 'abc', searchWords: ['b'] } });
    const fn = (wrapper.vm as any).getHighLightTextHTML;
    expect(typeof fn).toBe('function');
    const nodes = fn({ sourceString: 'abc', searchWords: ['c'] });
    expect(nodes).toHaveLength(2);
    expect((nodes[1] as any).type).toBe('mark');
  });
});
