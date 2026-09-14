import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, defineComponent } from 'vue';
import Icon, {
  convertIcon,
  getFillColor,
  IconHome,
  IconAIWandLevel2,
  IconAIBellLevel3,
  IconAIFilledLevel3,
  IconAILoading,
  IconAIWandLevel1,
} from './index';

const CustomSvg = defineComponent({
  name: 'CustomSvg',
  setup() {
    return () =>
      h('svg', { width: '1em', height: '1em', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' }, [
        h('circle', { cx: 12, cy: 12, r: 11, fill: '#FBCD2C' }),
      ]);
  },
});

describe('Icon', () => {
  it('renders a semi-icon span with role img and default size', () => {
    const w = mount(IconHome);
    const span = w.find('span');
    expect(span.classes()).toContain('semi-icon');
    expect(span.classes()).toContain('semi-icon-default');
    expect(span.classes()).toContain('semi-icon-home');
    expect(span.attributes('role')).toBe('img');
    expect(span.attributes('aria-label')).toBe('home');
    const svg = w.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
    expect(svg.attributes('width')).toBe('1em');
    expect(svg.html()).toContain('fill="currentColor"');
  });

  it('supports size classes including inherit', () => {
    for (const size of ['extra-small', 'small', 'default', 'large', 'extra-large'] as const) {
      const w = mount(IconHome, { props: { size } });
      expect(w.find('span').classes()).toContain(`semi-icon-${size}`);
    }
    const w = mount(IconHome, { props: { size: 'inherit' } });
    const classes = w.find('span').classes();
    expect(classes.filter((c) => /semi-icon-(extra-)?(small|large|default)/.test(c))).toHaveLength(0);
  });

  it('rotate sets transform and spin adds spinning class', () => {
    const w = mount(IconHome, { props: { rotate: 180, spin: true } });
    expect(w.find('span').attributes('style')).toContain('rotate(180deg)');
    expect(w.find('span').classes()).toContain('semi-icon-spinning');
    const w2 = mount(IconHome, { props: { rotate: 1.5 } });
    expect(w2.find('span').attributes('style') || '').not.toContain('rotate');
  });

  it('merges style / class / className and passes through attrs (aria-label, events)', async () => {
    let clicked = 0;
    const w = mount(IconHome, {
      props: { style: { color: 'red' }, className: 'a' } as any,
      attrs: {
        class: 'b',
        'aria-label': 'back to homepage',
        'data-x': '1',
        onClick: () => clicked++,
      },
    });
    const span = w.find('span');
    expect(span.classes()).toContain('a');
    expect(span.classes()).toContain('b');
    expect(span.attributes('style')).toContain('color: red');
    expect(span.attributes('aria-label')).toBe('back to homepage');
    expect(span.attributes('data-x')).toBe('1');
    await span.trigger('click');
    expect(clicked).toBe(1);
  });

  it('fires mouse events on the root span', async () => {
    const calls: string[] = [];
    const w = mount(IconHome, {
      attrs: {
        onMousedown: () => calls.push('down'),
        onMouseup: () => calls.push('up'),
        onMouseenter: () => calls.push('enter'),
        onMouseleave: () => calls.push('leave'),
        onMousemove: () => calls.push('move'),
      },
    });
    const span = w.find('span');
    for (const e of ['mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'mousemove']) await span.trigger(e);
    expect(calls).toEqual(['down', 'up', 'enter', 'leave', 'move']);
  });

  it('custom svg: component, render function and vnode, with rotate', () => {
    const w1 = mount(Icon, { props: { svg: CustomSvg, rotate: 180 } });
    expect(w1.find('circle').exists()).toBe(true);
    expect(w1.find('span').attributes('style')).toContain('rotate(180deg)');
    expect(w1.find('span').attributes('aria-label')).toBeUndefined();
    const w2 = mount(Icon, { props: { svg: () => h(CustomSvg) } });
    expect(w2.find('circle').exists()).toBe(true);
    const w3 = mount(Icon, { props: { svg: h('svg', [h('rect')]) } });
    expect(w3.find('rect').exists()).toBe(true);
  });

  it('the same VNode can be passed as svg to several icons and survives re-render', async () => {
    const node = h('svg', [h('rect')]);
    const w1 = mount(Icon, { props: { svg: node } });
    const w2 = mount(Icon, { props: { svg: node, size: 'small' } });
    expect(w1.find('rect').exists()).toBe(true);
    expect(w2.find('rect').exists()).toBe(true);
    await w1.setProps({ rotate: 90 });
    expect(w1.find('rect').exists()).toBe(true);
    expect(w1.find('span').attributes('style')).toContain('rotate(90deg)');
  });

  it('default slot overrides svg', () => {
    const w = mount(Icon, { slots: { default: () => h('i', { class: 'custom' }) } });
    expect(w.find('i.custom').exists()).toBe(true);
  });

  it('fill on custom svg clones the svg with fill attribute', () => {
    const w = mount(Icon, { props: { svg: h('svg', [h('path')]), fill: 'red' } });
    expect(w.find('svg').attributes('fill')).toBe('red');
  });

  it('convertIcon creates an Icon with elementType and type', () => {
    const MyIcon = convertIcon(
      { viewBox: '0 0 24 24', fill: 'none', inner: '<path d="M0 0" fill="currentColor" />' },
      'my_icon'
    );
    expect((MyIcon as any).elementType).toBe('Icon');
    expect((Icon as any).elementType).toBe('Icon');
    const w = mount(MyIcon, { props: { size: 'large' } });
    expect(w.find('span').classes()).toContain('semi-icon-my_icon');
    expect(w.find('span').classes()).toContain('semi-icon-large');
    expect(w.find('span').attributes('aria-label')).toBe('my_icon');
  });

  describe('AI icons', () => {
    it('level 1 icons are single color', () => {
      const w = mount(IconAIWandLevel1);
      expect(w.find('svg').html()).toContain('fill="currentColor"');
      expect(w.find('span').classes()).toContain('semi-icon-ai_wand_level_1');
    });

    it('level 2 icons default to two colors and no leftover placeholders', () => {
      const w = mount(IconAIWandLevel2);
      const html = w.find('svg').html();
      expect(html).toContain('fill="rgba(166,71,255)"');
      expect(html).toContain('fill="currentColor"');
      expect(html).not.toMatch(/primaryColor|secondColor|__fill/);
    });

    it('level 2 icons accept fill string and string[]', () => {
      const w = mount(IconAIWandLevel2, { props: { fill: ['red', 'green'] } });
      const html = w.find('svg').html();
      expect(html).toContain('fill="red"');
      expect(html).toContain('fill="green"');
      expect(html).not.toContain('rgba(166,71,255)');
      const w2 = mount(IconAIWandLevel2, { props: { fill: 'blue' } });
      const paths = w2.findAll('path');
      expect(paths.length).toBeGreaterThan(1);
      paths.forEach((p) => expect(p.attributes('fill')).toBe('blue'));
    });

    it('level 3 icons render a gradient with a unique id and 4 default stops', () => {
      const w = mount(IconAIBellLevel3);
      const html = w.find('svg').html();
      expect(html).not.toMatch(/__id__|__fill|stop1|\$\{/);
      const grad = w.find('linearGradient');
      const id = grad.attributes('id') as string;
      expect(id).toMatch(/^semi-ai-bell-level-3-/);
      expect(w.find('path').attributes('fill')).toBe(`url(#${id})`);
      const stops = w.findAll('stop').map((s) => s.attributes('stop-color'));
      expect(stops).toEqual(['rgba(233,69,255)', 'rgba(166,71,255)', 'rgba(107,97,255)', 'rgba(46,140,255)']);
      const w2 = mount(IconAIBellLevel3);
      expect(w2.find('linearGradient').attributes('id')).not.toBe(id);
    });

    it('level 3 icons apply fill array reversed (4 colors) and repeat shorter arrays', () => {
      const w = mount(IconAIFilledLevel3, { props: { fill: ['a', 'b', 'c', 'd'] } });
      expect(w.findAll('stop').map((s) => s.attributes('stop-color'))).toEqual(['d', 'c', 'b', 'a']);
      const w2 = mount(IconAIFilledLevel3, { props: { fill: ['a', 'b'] } });
      expect(w2.findAll('stop').map((s) => s.attributes('stop-color'))).toEqual(['a', 'b', 'a', 'b']);
      const w3 = mount(IconAIFilledLevel3, { props: { fill: 'x' } });
      expect(w3.findAll('stop').map((s) => s.attributes('stop-color'))).toEqual(['x', 'x', 'x', 'x']);
    });

    it('IconAILoading renders gradient stroke', () => {
      const w = mount(IconAILoading, { props: { spin: true } });
      const id = w.find('linearGradient').attributes('id');
      expect(w.find('path').attributes('stroke')).toBe(`url(#${id})`);
      expect(w.find('span').classes()).toContain('semi-icon-spinning');
    });
  });

  it('getFillColor matches semi-icons utils', () => {
    expect(getFillColor(undefined, 2)).toEqual(['rgba(166,71,255)', 'currentColor']);
    expect(getFillColor('r', 3)).toEqual(['r', 'r', 'r']);
    expect(getFillColor(['a', 'b', 'c', 'd', 'e'], 4)).toEqual(['d', 'c', 'b', 'a']);
    expect(getFillColor(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
});
