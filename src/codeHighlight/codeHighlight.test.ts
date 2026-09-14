import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { CodeHighlight } from './index';

describe('CodeHighlight', () => {
  it('renders wrapper / pre / code and highlights with prism classes', async () => {
    const wrapper = mount(CodeHighlight, { props: { code: 'const a = 1;', language: 'javascript' } });
    await flushPromises();
    expect(wrapper.classes()).toContain('semi-codeHighlight');
    expect(wrapper.classes()).toContain('semi-codeHighlight-defaultTheme');
    expect(wrapper.classes()).toContain('semi-light-scrollbar');
    const code = wrapper.find('pre > code');
    expect(code.exists()).toBe(true);
    expect(code.text()).toBe('const a = 1;');
    // prism adds the language class and token spans; the line-numbers plugin moves the
    // line-numbers class onto the <pre> and appends the rows span inside the code
    expect(code.classes()).toContain('language-javascript');
    expect(wrapper.find('pre').classes()).toContain('line-numbers');
    expect(code.find('span.token').exists()).toBe(true);
    expect(code.find('.line-numbers-rows').exists()).toBe(true);
  });

  it('lineNumber=false omits the line-numbers class', async () => {
    const wrapper = mount(CodeHighlight, { props: { code: 'x = 1', language: 'python', lineNumber: false } });
    await flushPromises();
    const code = wrapper.find('code');
    expect(code.classes()).toContain('language-python');
    expect(wrapper.find('pre').classes()).not.toContain('line-numbers');
    expect(code.find('.line-numbers-rows').exists()).toBe(false);
  });

  it('defaultTheme=false / className / class / style / data attrs', () => {
    const wrapper = mount(CodeHighlight, { props: { defaultTheme: false, className: 'a', class: 'b', style: { color: 'red' }, 'data-x': 'y', code: '' } });
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.classes()).not.toContain('semi-codeHighlight-defaultTheme');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.attributes('data-x')).toBe('y');
  });

  it('re-highlights when code / language change', async () => {
    const wrapper = mount(CodeHighlight, { props: { code: 'let a = 1;', language: 'javascript' } });
    await flushPromises();
    expect(wrapper.find('code').text()).toBe('let a = 1;');
    expect(wrapper.find('code').find('span.token').exists()).toBe(true);
    await wrapper.setProps({ code: 'a { color: red; }', language: 'css' });
    await flushPromises();
    const code = wrapper.find('code');
    expect(code.text()).toBe('a { color: red; }');
    expect(code.classes()).toContain('language-css');
    expect(code.classes()).not.toContain('language-javascript');
    expect(code.find('span.token').exists()).toBe(true);
  });

  it('statics', () => {
    expect((CodeHighlight as any).__SemiComponentName__).toBe('CodeHighlight');
    expect((CodeHighlight as any).elementType).toBe('CodeHighlight');
  });
});

describe('CodeHighlight - other languages', () => {
  it('highlights a manually registered prism language (vala)', async () => {
    await import('prismjs/components/prism-vala.js');
    const wrapper = mount(CodeHighlight, { props: { code: 'public class A {}', language: 'vala' } });
    await flushPromises();
    const code = wrapper.find('code');
    expect(code.classes()).toContain('language-vala');
    expect(code.find('span.token').exists()).toBe(true);
  });
});
