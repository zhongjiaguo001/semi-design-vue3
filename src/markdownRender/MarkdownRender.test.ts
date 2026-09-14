import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { h } from 'vue';
import MarkdownRender from './index';

describe('MarkdownRender', () => {
  it('renders container with className', () => {
    const w = mount(MarkdownRender, { props: { raw: '', className: 'mine' } });
    expect(w.classes()).toContain('semi-markdownRender');
    expect(w.classes()).toContain('mine');
  });

  it('empty raw does not render fallback pre', () => {
    const w = mount(MarkdownRender, { props: { raw: '' } });
    expect(w.find('.semi-markdownRender-fallback').exists()).toBe(false);
  });

  it('renders markdown heading after evaluate, or falls back to pre', async () => {
    const w = mount(MarkdownRender, { props: { raw: '# Hello MD', format: 'md' } });
    await flushPromises();
    const text = w.text();
    expect(text.includes('Hello MD') || w.find('pre').exists() || w.find('.semi-typography').exists()).toBe(true);
  });

  it('exposes defaultComponents', () => {
    expect((MarkdownRender as any).defaultComponents).toBeTruthy();
    expect((MarkdownRender as any).defaultComponents.h1).toBeTruthy();
    expect((MarkdownRender as any).elementType).toBe('MarkdownRender');
  });
});

const wait = async () => {
  await flushPromises();
  await new Promise(r => setTimeout(r, 50));
  await flushPromises();
};

describe('MarkdownRender parity', () => {
  it('renders md format headings, paragraphs, inline code once, code block and table', async () => {
    const raw = '# Hello MD\n\nsome `inline` code\n\n```js\nconst a = 1;\n```\n\n| a | b |\n| - | - |\n| 1 | 2 |';
    const w = mount(MarkdownRender, { props: { raw, format: 'md' } });
    await wait();
    expect(w.find('h1.semi-markdownRender-component-header').text()).toBe('Hello MD');
    expect(w.find('p.semi-markdownRender-component-p').exists()).toBe(true);
    expect(w.find('.semi-markdownRender-simple-code').text()).toBe('inline');
    expect(w.find('.semi-codeHighlight').exists()).toBe(true);
    expect(w.find('.semi-table').exists()).toBe(true);
    expect(w.findAll('th.semi-table-row-head').map(n => n.text())).toEqual(['a', 'b']);
  });

  it('md format does not require escaping special chars', async () => {
    const w = mount(MarkdownRender, { props: { raw: '无需转义的符号{}<> ...', format: 'md' } });
    await wait();
    expect(w.text()).toContain('无需转义的符号{}<> ...');
  });

  it('components prop overrides default elements', async () => {
    const h2 = (_p: any, { slots }: any) => h('h2', { class: 'custom-h2' }, slots.default?.());
    const w = mount(MarkdownRender, { props: { raw: '## 从 Semi Design', components: { h2 } } });
    await wait();
    expect(w.find('h2.custom-h2').text()).toBe('从 Semi Design');
  });

  it('mdx custom components receive JSX event handlers', async () => {
    let clicked = 0;
    (window as any).__mdClick = () => clicked++;
    const MyButton = (props: any, { slots }: any) => h('button', { class: 'my-btn', onClick: props.onClick }, slots.default?.());
    const w = mount(MarkdownRender, {
      props: {
        raw: '#### title\n<MyButton onClick={()=>window.__mdClick()}>MyButton 点我</MyButton>',
        components: { ...(MarkdownRender as any).defaultComponents, MyButton },
      },
    });
    await wait();
    expect(w.find('.my-btn').text()).toBe('MyButton 点我');
    await w.find('.my-btn').trigger('click');
    expect(clicked).toBe(1);
  });

  it('re-evaluates when raw changes', async () => {
    const w = mount(MarkdownRender, { props: { raw: '# one', format: 'md' } });
    await wait();
    expect(w.text()).toContain('one');
    await w.setProps({ raw: '# two' });
    await wait();
    expect(w.text()).toContain('two');
    expect(w.text()).not.toContain('one');
  });

  it('emits error on invalid mdx and renders fallback', async () => {
    const w = mount(MarkdownRender, { props: { raw: 'bad {{{ jsx <' } });
    await wait();
    expect(w.emitted('error')).toBeTruthy();
    expect(w.find('.semi-markdownRender-fallback').exists()).toBe(true);
  });

  it('applies style prop, attrs.class and data attributes', async () => {
    const w = mount(MarkdownRender, { props: { raw: '', style: { color: 'red' } }, attrs: { class: 'x', 'data-foo': 'bar' } });
    expect(w.attributes('style')).toContain('color: red');
    expect(w.classes()).toContain('x');
    expect(w.attributes('data-foo')).toBe('bar');
  });

  it('remarkGfm=false disables table parsing', async () => {
    const raw = '| a | b |\n| - | - |\n| 1 | 2 |';
    const w = mount(MarkdownRender, { props: { raw, format: 'md', remarkGfm: false } });
    await wait();
    expect(w.find('.semi-table').exists()).toBe(false);
  });

  it('remarkPlugins / rehypePlugins are passed to the compiler', async () => {
    const calls: string[] = [];
    const remark = () => (tree: any) => { calls.push('remark:' + tree.type); };
    const rehype = () => (tree: any) => { calls.push('rehype:' + tree.type); };
    mount(MarkdownRender, { props: { raw: '# x', format: 'md', remarkPlugins: [remark], rehypePlugins: [rehype] } });
    await wait();
    expect(calls).toContain('remark:root');
    expect(calls).toContain('rehype:root');
  });
});
