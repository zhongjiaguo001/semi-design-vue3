import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, defineComponent, Fragment, Text as VText } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Typography, { Text, Title, Paragraph, Numeral, Copyable } from './index';
import { IconCopy, IconTick, IconLink } from '../icons/generated';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 50) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
const LINE = { style: { lineHeight: '20px' } };
/**
 * jsdom has no layout: emulate a 100px wide, 20px line-height box whose scroll width
 * grows 10px per character so the JS truncation binary search finds a fitting slice.
 */
function mockLayout() {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(20);
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
    return (this.textContent || '').length * 10;
  });
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(20);
}

describe('Typography', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Typography root', () => {
    it('renders an article with semi-typography class and passes attrs', () => {
      const w = mount(Typography, { attrs: { class: 'x', id: 'root', style: { color: 'red' } }, slots: { default: () => 'hello' } });
      expect(w.element.tagName).toBe('ARTICLE');
      expect(w.classes()).toContain('semi-typography');
      expect(w.classes()).toContain('x');
      expect(w.attributes('id')).toBe('root');
      expect(w.element.style.color).toBe('red');
      expect(w.text()).toBe('hello');
    });
    it('component prop changes the tag', () => {
      const w = mount(Typography, { props: { component: 'section' } });
      expect(w.element.tagName).toBe('SECTION');
    });
    it('exposes sub components', () => {
      expect(Typography.Text).toBe(Text);
      expect(Typography.Title).toBe(Title);
      expect(Typography.Paragraph).toBe(Paragraph);
      expect(Typography.Numeral).toBe(Numeral);
    });
  });

  describe('Text', () => {
    it('renders span with default classes', () => {
      const w = mount(Text, { slots: { default: () => 'text' } });
      expect(w.element.tagName).toBe('SPAN');
      expect(w.classes()).toContain('semi-typography');
      expect(w.classes()).toContain('semi-typography-primary');
      expect(w.classes()).toContain('semi-typography-normal');
      expect(w.classes()).not.toContain('semi-typography-link');
      expect(w.text()).toBe('text');
    });

    it.each(['primary', 'secondary', 'tertiary', 'quaternary', 'warning', 'danger', 'success'] as const)('type=%s', (type) => {
      const w = mount(Text, { props: { type }, slots: { default: () => 't' } });
      expect(w.classes()).toContain(`semi-typography-${type}`);
    });

    it('size small / normal', () => {
      expect(mount(Text, { props: { size: 'small' } }).classes()).toContain('semi-typography-small');
      expect(mount(Text, { props: { size: 'normal' } }).classes()).toContain('semi-typography-normal');
    });

    it('size inherit reads parent typography size context (default normal)', () => {
      const w = mount(Text, { props: { size: 'small' }, slots: { default: () => h(Text, { size: 'inherit', class: 'inner' }, () => 'in') } });
      expect(w.find('.inner').classes()).toContain('semi-typography-small');
      const alone = mount(Text, { props: { size: 'inherit' } });
      expect(alone.classes()).toContain('semi-typography-normal');
    });

    it('spacing extended', () => {
      expect(mount(Text, { props: { spacing: 'extended' } }).classes()).toContain('semi-typography-extended');
    });

    it('disabled', () => {
      expect(mount(Text, { props: { disabled: true } }).classes()).toContain('semi-typography-disabled');
    });

    it('strong / underline / delete / mark / code wrappers (nesting order)', () => {
      const w = mount(Text, { props: { strong: true, underline: true, delete: true, mark: true, code: true }, slots: { default: () => 'deco' } });
      // wrap order: mark -> code -> u -> strong -> del => del is outermost
      const del = w.find('span > del');
      expect(del.exists()).toBe(true);
      expect(del.find('strong > u > code > mark').exists()).toBe(true);
      expect(w.text()).toBe('deco');
    });

    it('link=true renders <a> wrapper and link classes; underline with link uses link-underline', () => {
      const w = mount(Text, { props: { link: true, underline: true }, slots: { default: () => 'lnk' } });
      expect(w.classes()).toContain('semi-typography-link');
      expect(w.classes()).not.toContain('semi-typography-primary');
      const a = w.find('a');
      expect(a.exists()).toBe(true);
      expect(w.find('u').exists()).toBe(false);
      const inner = a.find('.semi-typography-link-text');
      expect(inner.exists()).toBe(true);
      expect(inner.classes()).toContain('semi-typography-link-underline');
    });

    it('link object passes anchor attrs; disabled link renders span', () => {
      const w = mount(Text, { props: { link: { href: 'https://semi.design', target: '_blank' } }, slots: { default: () => 'lnk' } });
      const a = w.find('a');
      expect(a.attributes('href')).toBe('https://semi.design');
      expect(a.attributes('target')).toBe('_blank');
      const d = mount(Text, { props: { link: { href: '/x' }, disabled: true }, slots: { default: () => 'lnk' } });
      expect(d.find('a').exists()).toBe(false);
      expect(d.find('span > span').exists()).toBe(true);
      expect(d.classes()).toContain('semi-typography-disabled');
    });

    it('icon prop (semi icon gets size by typography size) and icon slot', () => {
      const w = mount(Text, { props: { icon: h(IconLink) }, slots: { default: () => 'with icon' } });
      const iconWrap = w.find('.semi-typography-icon');
      expect(iconWrap.exists()).toBe(true);
      expect(iconWrap.attributes('x-semi-prop')).toBe('icon');
      expect(iconWrap.find('.semi-icon-default').exists()).toBe(true);
      const small = mount(Text, { props: { icon: IconLink, size: 'small' } });
      expect(small.find('.semi-typography-icon .semi-icon-small').exists()).toBe(true);
      const slotted = mount(Text, { slots: { icon: () => h('i', { class: 'custom-i' }), default: () => 'x' } });
      expect(slotted.find('.semi-typography-icon .custom-i').exists()).toBe(true);
      expect(mount(Text).find('.semi-typography-icon').exists()).toBe(false);
    });

    it('component prop overrides tag, attrs/style/class are forwarded', () => {
      const w = mount(Text, { props: { component: 'div' }, attrs: { class: 'cls', 'data-x': '1', style: { color: 'blue' } } });
      expect(w.element.tagName).toBe('DIV');
      expect(w.classes()).toContain('cls');
      expect(w.attributes('data-x')).toBe('1');
      expect(w.element.style.color).toBe('blue');
    });

    it('numeric weight becomes inline font-weight, no heading weight class on Text', () => {
      const w = mount(Text, { props: { weight: 600 } });
      expect(w.element.style.fontWeight).toBe('600');
    });
  });

  describe('Title', () => {
    it.each([1, 2, 3, 4, 5, 6])('heading=%s renders h tag + class', (heading) => {
      const w = mount(Title, { props: { heading }, slots: { default: () => 'T' } });
      expect(w.element.tagName).toBe(`H${heading}`);
      expect(w.classes()).toContain(`semi-typography-h${heading}`);
      expect(w.classes()).toContain('semi-typography');
    });
    it('defaults to h1, invalid heading falls back to h1', () => {
      expect(mount(Title).element.tagName).toBe('H1');
      expect(mount(Title, { props: { heading: 9 as any } }).element.tagName).toBe('H1');
    });
    it('custom component keeps heading class', () => {
      const w = mount(Title, { props: { heading: 3, component: 'div' } });
      expect(w.element.tagName).toBe('DIV');
      expect(w.classes()).toContain('semi-typography-h3');
    });
    it('string weight adds weight class, numeric weight sets style', () => {
      const w = mount(Title, { props: { heading: 2, weight: 'semibold' } });
      expect(w.classes()).toContain('semi-typography-h2-weight-semibold');
      const n = mount(Title, { props: { heading: 2, weight: 700 } });
      expect(n.element.style.fontWeight).toBe('700');
      expect(n.classes().some((c) => c.includes('-weight-'))).toBe(false);
    });
    it('type/link/mark etc. also apply to Title', () => {
      const w = mount(Title, { props: { type: 'danger', mark: true }, slots: { default: () => 'x' } });
      expect(w.classes()).toContain('semi-typography-danger');
      expect(w.find('mark').exists()).toBe(true);
    });
  });

  describe('Paragraph', () => {
    it('renders <p> with paragraph class and keeps user class', () => {
      const w = mount(Paragraph, { attrs: { class: 'mine' }, slots: { default: () => 'p' } });
      expect(w.element.tagName).toBe('P');
      expect(w.classes()).toContain('semi-typography-paragraph');
      expect(w.classes()).toContain('mine');
      expect(w.classes()).toContain('semi-typography-normal');
    });
    it('spacing / size / component', () => {
      const w = mount(Paragraph, { props: { spacing: 'extended', size: 'small', component: 'div' } });
      expect(w.element.tagName).toBe('DIV');
      expect(w.classes()).toContain('semi-typography-extended');
      expect(w.classes()).toContain('semi-typography-small');
    });
  });

  describe('Numeral', () => {
    it('rule=text formats numbers inside text with precision/truncate', () => {
      const w = mount(Numeral, { props: { precision: 2 }, slots: { default: () => 'Score 3.14159 and 2.5' } });
      expect(w.text()).toBe('Score 3.14 and 2.50');
      const f = mount(Numeral, { props: { precision: 1, truncate: 'floor' }, slots: { default: () => '1.99' } });
      expect(f.text()).toBe('1.9');
      const c = mount(Numeral, { props: { precision: 1, truncate: 'ceil' }, slots: { default: () => '1.91' } });
      expect(c.text()).toBe('2.0');
    });
    it('rule=percentages / bytes-decimal / bytes-binary / exponential / numbers', () => {
      expect(mount(Numeral, { props: { rule: 'percentages', precision: 1 }, slots: { default: () => '0.256' } }).text()).toBe('25.6%');
      expect(mount(Numeral, { props: { rule: 'bytes-decimal', precision: 1 }, slots: { default: () => '1500' } }).text()).toBe('1.5 KB');
      expect(mount(Numeral, { props: { rule: 'bytes-binary', precision: 1 }, slots: { default: () => '1536' } }).text()).toBe('1.5 KiB');
      expect(mount(Numeral, { props: { rule: 'exponential', precision: 2 }, slots: { default: () => '1234' } }).text()).toBe('1.23e+3');
      expect(mount(Numeral, { props: { rule: 'numbers', precision: 1 }, slots: { default: () => 'a1.26b' } }).text()).toBe('1.3');
    });
    it('parser overrides formatting', () => {
      const parser = (v: string) => v.replace(/\d+/g, (m) => `[${m}]`);
      const w = mount(Numeral, { props: { parser }, slots: { default: () => 'n 12 m' } });
      expect(w.text()).toBe('n [12] m');
    });
    it('formats nested element text (DFS)', () => {
      const w = mount(Numeral, { props: { precision: 1 }, slots: { default: () => [h('b', 'v 2.345'), ' and 1'] } });
      expect(w.find('b').text()).toBe('v 2.3');
      expect(w.text()).toBe('v 2.3 and 1.0');
    });
    it('formats nested Text vnodes, Fragments (v-for) and component default slots (DFS)', () => {
      const Infos = defineComponent({ setup: (_, { slots }) => () => h('div', { class: 'infos' }, slots.default?.()) });
      const w = mount(Numeral, {
        props: { precision: 1 },
        slots: {
          default: () => [
            h('p', [h(VText, 'a 1.26'), h('b', '2.71828')]),
            h(Fragment, ['3.14159', h('i', '9.99')]),
            h(Infos, null, { default: () => [h('p', ['x ', h('b', '7100.55')])] }),
          ],
        },
      });
      expect(w.find('p').text()).toBe('a 1.32.7');
      expect(w.find('i').text()).toBe('10.0');
      expect(w.find('.infos b').text()).toBe('7100.6');
      expect(w.text()).toContain('3.1');
    });
    it('parser applies to component children (official Infos example)', () => {
      const parserTCH = (oldVal: string) =>
        oldVal
          .split(' ')
          .map((item) => (Number(item) ? `${item.replace(/(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')}+` : item))
          .join(' ');
      const Infos = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) });
      const w = mount(Numeral, {
        props: { parser: parserTCH, component: 'div' },
        slots: { default: () => ['Stars ', h(Infos, null, { default: () => h('b', '5000000') })] },
      });
      expect(w.element.tagName).toBe('DIV');
      expect(w.find('b').text()).toBe('5,000,000+');
    });
    it('is a span with base decorations', () => {
      const w = mount(Numeral, { props: { strong: true, type: 'success' }, slots: { default: () => '1' } });
      expect(w.element.tagName).toBe('SPAN');
      expect(w.classes()).toContain('semi-typography-success');
      expect(w.find('strong').exists()).toBe(true);
    });
  });

  describe('ellipsis', () => {
    it('ellipsis=true single line css ellipsis classes on Text', () => {
      const w = mount(Text, { props: { ellipsis: true }, slots: { default: () => 'long text' } });
      expect(w.classes()).toContain('semi-typography-ellipsis');
      expect(w.classes()).toContain('semi-typography-ellipsis-single-line');
      expect(w.classes()).toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect(w.classes()).toContain('semi-typography-ellipsis-overflow-ellipsis-text');
      expect(w.classes()).not.toContain('semi-typography-ellipsis-multiple-line');
      // content is wrapped in a hover span
      expect(w.find('span > span').text()).toBe('long text');
    });

    it('rows > 1 css ellipsis: multiple-line classes + line clamp style', () => {
      const w = mount(Paragraph, { props: { ellipsis: { rows: 3 } }, slots: { default: () => 'long' } });
      expect(w.classes()).toContain('semi-typography-ellipsis-multiple-line');
      expect(w.classes()).not.toContain('semi-typography-ellipsis-multiple-line-text');
      expect(w.classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect((w.element as HTMLElement).style.getPropertyValue('-webkit-line-clamp')).toBe('3');
      const t = mount(Text, { props: { ellipsis: { rows: 2 } } });
      expect(t.classes()).toContain('semi-typography-ellipsis-multiple-line-text');
    });

    it('js ellipsis (expandable / suffix / pos middle / copyable) drops css overflow classes', () => {
      expect(mount(Text, { props: { ellipsis: { expandable: true } } }).classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect(mount(Text, { props: { ellipsis: { suffix: '-s' } } }).classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect(mount(Text, { props: { ellipsis: { pos: 'middle' } } }).classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect(mount(Text, { props: { ellipsis: true, copyable: true } }).classes()).not.toContain('semi-typography-ellipsis-overflow-ellipsis');
      expect(mount(Text, { props: { ellipsis: { rows: 2, expandable: true } } }).element.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    });

    it('suffix is rendered after the text', async () => {
      const w = mount(Text, { props: { ellipsis: { suffix: '--end' } }, slots: { default: () => 'abc' } });
      await wait();
      expect(w.text()).toBe('abc--end');
    });

    it('no layout (jsdom): text is not truncated, no expand button rendered', async () => {
      const w = mount(Text, { attachTo: document.body, props: { ellipsis: { expandable: true } }, slots: { default: () => 'some long content' } });
      await wait();
      expect(w.text()).toBe('some long content');
      expect(w.find('.semi-typography-ellipsis-expand').exists()).toBe(false);
      w.unmount();
    });

    it('expand / collapse toggles with locale texts, onExpand + emit expand, aria-label, Enter key', async () => {
      // Force truncation by mocking layout
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(20);
      // scrollWidth > offsetWidth => not in range
      vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500);
      vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(20);
      const onExpand = vi.fn();
      const w = mount(Text, {
        attachTo: document.body,
        attrs: LINE,
        props: { ellipsis: { expandable: true, collapsible: true, onExpand } },
        slots: { default: () => 'this is a very long piece of text that will be truncated' },
      });
      await wait();
      const expand = w.find('.semi-typography-ellipsis-expand');
      expect(expand.exists()).toBe(true);
      expect(expand.element.tagName).toBe('A');
      expect(expand.attributes('role')).toBe('button');
      expect(expand.attributes('tabindex')).toBe('0');
      expect(expand.text()).toBe('展开');
      expect(expand.attributes('aria-label')).toBe('展开');
      // truncated content ends with ...
      const content = w.find('span > span').text();
      expect(content.endsWith('...')).toBe(true);
      expect(content.length).toBeLessThan('this is a very long piece of text that will be truncated'.length);

      await expand.trigger('click');
      expect(onExpand).toHaveBeenCalledWith(true, expect.anything());
      expect(w.emitted('expand')![0][0]).toBe(true);
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('收起');
      expect(w.find('span > span').text()).toBe('this is a very long piece of text that will be truncated');
      // expanded -> no css ellipsis class either
      expect(w.classes()).toContain('semi-typography-ellipsis');

      await w.find('.semi-typography-ellipsis-expand').trigger('keypress', { key: 'Enter' });
      expect(onExpand).toHaveBeenLastCalledWith(false, expect.anything());
      expect(w.emitted('expand')![1][0]).toBe(false);
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('展开');
      w.unmount();
    });

    it('custom expandText / collapseText, non collapsible keeps expanded', async () => {
      mockLayout();
      const w = mount(Text, {
        attachTo: document.body,
        attrs: LINE,
        props: { ellipsis: { expandable: true, expandText: 'more', collapseText: 'less' } },
        slots: { default: () => 'this is a very long piece of text that will be truncated' },
      });
      await wait();
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('more');
      await w.find('.semi-typography-ellipsis-expand').trigger('click');
      // collapsible=false but collapseText given => button shows collapseText
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('less');
      await w.find('.semi-typography-ellipsis-expand').trigger('click');
      // not collapsible -> stays expanded
      expect(w.emitted('expand')![1][0]).toBe(false);
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('less');
      w.unmount();
    });

    it('uses LocaleProvider texts for expand/collapse', async () => {
      mockLayout();
      const w = mount(LocaleProvider, {
        attachTo: document.body,
        props: { locale: en_US as any },
        slots: { default: () => h(Text, { ...LINE, ellipsis: { expandable: true } }, () => 'this is a very long piece of text that will be truncated') },
      });
      await wait();
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe(en_US.Typography.expand);
      w.unmount();
    });

    it('pos=middle truncates in the middle', async () => {
      mockLayout();
      const text = 'abcdefghijklmnopqrstuvwxyz';
      const w = mount(Text, { attachTo: document.body, attrs: LINE, props: { ellipsis: { pos: 'middle', expandable: true } }, slots: { default: () => text } });
      await wait();
      const content = w.find('span > span').text();
      expect(content).toContain('...');
      expect(content.endsWith('...')).toBe(false);
      expect(content.startsWith('a')).toBe(true);
      expect(content.endsWith('z')).toBe(true);
      expect(content.length).toBeLessThan(text.length);
      w.unmount();
    });

    it('showTooltip: css ellipsis overflow shows Tooltip with full content', async () => {
      // css path: shouldTruncated -> compareSingleRow uses Range.getBoundingClientRect (missing in jsdom) => mock it
      (Range.prototype as any).getBoundingClientRect = () => ({ width: 500, height: 20, top: 0, left: 0, right: 500, bottom: 20 });
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON() {} } as any);
      const w = mount(Text, {
        attachTo: document.body,
        attrs: LINE,
        props: { ellipsis: { showTooltip: { opts: { motion: false, mouseEnterDelay: 0 } } } },
        slots: { default: () => 'overflowing content' },
      });
      await wait();
      // tooltip wraps the element: trigger gets aria-describedby
      const el = w.find('.semi-typography');
      expect(el.attributes('aria-describedby')).toBeDefined();
      await el.trigger('mouseenter');
      await wait(120);
      const portal = document.querySelector('.semi-tooltip-content');
      expect(portal).toBeTruthy();
      expect(portal!.textContent).toBe('overflowing content');
      w.unmount();
      delete (Range.prototype as any).getBoundingClientRect;
    });

    it('showTooltip type=popover renders Popover with ellipsis-popover class', async () => {
      (Range.prototype as any).getBoundingClientRect = () => ({ width: 500, height: 20, top: 0, left: 0, right: 500, bottom: 20 });
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON() {} } as any);
      const w = mount(Text, {
        attachTo: document.body,
        attrs: LINE,
        props: { ellipsis: { showTooltip: { type: 'popover', opts: { motion: false, mouseEnterDelay: 0, className: 'my-pop' } } } },
        slots: { default: () => 'overflowing content' },
      });
      await wait();
      await w.find('.semi-typography').trigger('mouseenter');
      await wait(120);
      const wrapper = document.querySelector('.semi-popover-wrapper') as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper.classList.contains('semi-typography-ellipsis-popover')).toBe(true);
      expect(wrapper.classList.contains('my-pop')).toBe(true);
      expect(document.querySelector('.semi-popover-content')!.textContent).toBe('overflowing content');
      w.unmount();
      delete (Range.prototype as any).getBoundingClientRect;
    });

    it('showTooltip renderTooltip custom renderer', async () => {
      (Range.prototype as any).getBoundingClientRect = () => ({ width: 500, height: 20, top: 0, left: 0, right: 500, bottom: 20 });
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON() {} } as any);
      const renderTooltip = vi.fn((content: any, children: any) => h('div', { class: 'custom-tip', 'data-content': String(content) }, [children]));
      const w = mount(Text, {
        attachTo: document.body,
        attrs: LINE,
        props: { ellipsis: { showTooltip: { renderTooltip } } },
        slots: { default: () => 'overflowing content' },
      });
      await wait();
      expect(w.find('.custom-tip').exists()).toBe(true);
      expect(w.find('.custom-tip').attributes('data-content')).toBe('overflowing content');
      expect(w.find('.custom-tip .semi-typography').exists()).toBe(true);
      w.unmount();
      delete (Range.prototype as any).getBoundingClientRect;
    });

    it('showTooltip is not used when not overflowing', async () => {
      const w = mount(Text, { attachTo: document.body, props: { ellipsis: { showTooltip: true } }, slots: { default: () => 'short' } });
      await wait();
      expect(w.find('.semi-typography').attributes('aria-describedby')).toBeUndefined();
      w.unmount();
    });

    it('children change resets ellipsis state', async () => {
      mockLayout();
      const Parent = defineComponent({
        props: { txt: String },
        setup(p) {
          return () => h(Text, { ...LINE, ellipsis: { expandable: true } }, () => p.txt);
        },
      });
      const w = mount(Parent, { attachTo: document.body, props: { txt: 'this is a very long piece of text that will be truncated' } });
      await wait();
      await w.find('.semi-typography-ellipsis-expand').trigger('click');
      expect(w.find('span > span').text()).toBe('this is a very long piece of text that will be truncated');
      await w.setProps({ txt: 'another very long piece of text that will also be truncated' });
      await wait();
      // collapsed again + re-measured
      expect(w.find('.semi-typography-ellipsis-expand').text()).toBe('展开');
      expect(w.find('span > span').text().endsWith('...')).toBe(true);
      w.unmount();
    });

    it('exposes getElement / toggleOverflow', async () => {
      const w = mount(Text, { props: { ellipsis: { expandable: true, collapsible: true } }, slots: { default: () => 'x' } });
      expect((w.vm as any).getElement()).toBe(w.element);
      (w.vm as any).toggleOverflow(new Event('click'));
      expect(w.emitted('expand')![0][0]).toBe(true);
    });
  });

  describe('copyable', () => {
    it('renders copy action with tooltip; clicking copies children text and emits copy', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const onCopy = vi.fn();
      const w = mount(Text, { attachTo: document.body, props: { copyable: { onCopy } }, slots: { default: () => 'copy me' } });
      const action = w.find('.semi-typography-action-copy');
      expect(action.exists()).toBe(true);
      expect((action.element as HTMLElement).style.marginLeft).toBe('4px');
      const icon = action.find('.semi-typography-action-copy-icon');
      expect(icon.exists()).toBe(true);
      const iconEl = icon.find('[role="button"]');
      expect(iconEl.attributes('tabindex')).toBe('0');
      await iconEl.trigger('click');
      expect(writeText).toHaveBeenCalledWith('copy me');
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onCopy.mock.calls[0][1]).toBe('copy me');
      expect(onCopy.mock.calls[0][2]).toBe(true);
      expect(w.emitted('copy')![0][1]).toBe('copy me');
      await nextTick();
      const copied = w.find('.semi-typography-action-copied');
      expect(copied.exists()).toBe(true);
      expect(copied.text()).toContain('复制成功');
      expect(copied.find('.semi-icon-tick').exists()).toBe(true);
      w.unmount();
    });

    it('copyable.content overrides, duration resets copied state, successTip/copyTip', async () => {
      vi.useFakeTimers();
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const w = mount(Text, {
        attachTo: document.body,
        props: { copyable: { content: 'custom', duration: 1, successTip: h('b', { class: 'ok' }, 'done'), copyTip: 'tip!' } },
        slots: { default: () => 'text' },
      });
      await w.find('.semi-typography-action-copy [role="button"]').trigger('click');
      expect(writeText).toHaveBeenCalledWith('custom');
      await nextTick();
      expect(w.find('.semi-typography-action-copied .ok').text()).toBe('done');
      vi.advanceTimersByTime(1100);
      await nextTick();
      expect(w.find('.semi-typography-action-copied').exists()).toBe(false);
      expect(w.find('.semi-typography-action-copy').exists()).toBe(true);
      vi.useRealTimers();
      w.unmount();
    });

    it('copyable custom icon receives click handler; keyboard Enter copies', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const w = mount(Text, { attachTo: document.body, props: { copyable: { icon: h('i', { class: 'my-icon' }) } }, slots: { default: () => 'k' } });
      const icon = w.find('.my-icon');
      expect(icon.exists()).toBe(true);
      expect(icon.attributes('role')).toBe('button');
      await icon.trigger('keypress', { key: 'Enter' });
      expect(writeText).toHaveBeenCalledWith('k');
      w.unmount();
    });

    it('copyable render function', () => {
      const render = vi.fn((copied: boolean, doCopy: any) => h('button', { class: 'r', onClick: doCopy }, copied ? 'yes' : 'no'));
      const w = mount(Text, { props: { copyable: { render } }, slots: { default: () => 'r' } });
      expect(w.find('button.r').text()).toBe('no');
      expect(render).toHaveBeenCalled();
    });

    it('Copyable standalone: locale copy tip & english locale', async () => {
      const w = mount(LocaleProvider, {
        attachTo: document.body,
        props: { locale: en_US as any },
        slots: { default: () => h(Copyable, { content: 'abc' }) },
      });
      await w.find('.semi-typography-action-copy-icon').trigger('mouseenter');
      await wait(200);
      expect(document.querySelector('.semi-tooltip-content')!.textContent).toBe(en_US.Typography.copy);
      w.unmount();
    });
  });
});
