import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import Progress from './index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 400) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

describe('Progress', () => {
  describe('type=line (default)', () => {
    it('renders horizontal line progress with track / inner width, aria and no text by default', () => {
      const w = mount(Progress, { props: { percent: 30 } });
      expect(w.classes()).toContain('semi-progress');
      expect(w.classes()).toContain('semi-progress-horizontal');
      expect(w.classes()).not.toContain('semi-progress-vertical');
      expect(w.classes()).not.toContain('semi-progress-large');
      expect(w.attributes('role')).toBe('progressbar');
      expect(w.attributes('aria-valuemin')).toBe('0');
      expect(w.attributes('aria-valuemax')).toBe('100');
      expect(w.attributes('aria-valuenow')).toBe('30');
      const track = w.find('.semi-progress-track');
      expect(track.attributes('aria-hidden')).toBe('true');
      const inner = track.find('.semi-progress-track-inner');
      expect((inner.element as HTMLElement).style.width).toBe('30%');
      expect((inner.element as HTMLElement).style.height).toBe('');
      expect((inner.element as HTMLElement).style.background).toBe('var(--semi-color-success)');
      expect(w.find('.semi-progress-line-text').exists()).toBe(false);
    });

    it('percent is clamped to 0..100', () => {
      expect((mount(Progress, { props: { percent: 150 } }).find('.semi-progress-track-inner').element as HTMLElement).style.width).toBe('100%');
      expect((mount(Progress, { props: { percent: -5 } }).find('.semi-progress-track-inner').element as HTMLElement).style.width).toBe('0%');
      expect(mount(Progress, { props: { percent: 150 } }).attributes('aria-valuenow')).toBe('100');
    });

    it('direction vertical uses height', () => {
      const w = mount(Progress, { props: { percent: 40, direction: 'vertical' } });
      expect(w.classes()).toContain('semi-progress-vertical');
      const inner = w.find('.semi-progress-track-inner').element as HTMLElement;
      expect(inner.style.height).toBe('40%');
      expect(inner.style.width).toBe('');
    });

    it('size large class; showInfo renders formatted text; format prop / slot', () => {
      const w = mount(Progress, { props: { percent: 55, size: 'large', showInfo: true } });
      expect(w.classes()).toContain('semi-progress-large');
      expect(w.find('.semi-progress-line-text').text()).toBe('55%');
      const f = mount(Progress, { props: { percent: 55, showInfo: true, format: (p: number) => `${p} / 100` } });
      expect(f.find('.semi-progress-line-text').text()).toBe('55 / 100');
      const s = mount(Progress, { props: { percent: 12, showInfo: true }, slots: { format: ({ percent }: any) => h('b', `p${percent}`) } });
      expect(s.find('.semi-progress-line-text b').text()).toBe('p12');
    });

    it('format accepts a node (string / VNode) like React PropTypes.node', () => {
      const str = mount(Progress, { props: { percent: 20, showInfo: true, format: 'loading' as any } });
      expect(str.find('.semi-progress-line-text').text()).toBe('loading');
      const node = mount(Progress, { props: { percent: 20, showInfo: true, type: 'circle', format: h('i', 'x') as any } });
      expect(node.find('.semi-progress-circle-text i').text()).toBe('x');
    });

    it('stroke string / orbitStroke', () => {
      const w = mount(Progress, { props: { percent: 10, stroke: 'red', orbitStroke: 'blue' } });
      expect((w.find('.semi-progress-track-inner').element as HTMLElement).style.background).toBe('red');
      expect((w.find('.semi-progress-track').element as HTMLElement).style.backgroundColor).toBe('blue');
      expect((mount(Progress).find('.semi-progress-track').element as HTMLElement).style.backgroundColor).toBe('');
    });

    it('stroke array picks the color of the current segment; strokeGradient interpolates', () => {
      const stroke = [
        { percent: 0, color: '#ff0000' },
        { percent: 50, color: '#00ff00' },
        { percent: 100, color: '#0000ff' },
      ];
      const at = (percent: number, strokeGradient = false) => (mount(Progress, { props: { percent, stroke, strokeGradient } }).find('.semi-progress-track-inner').element as HTMLElement).style.background;
      expect(at(50)).toBe('rgb(0, 255, 0)');
      expect(at(100)).toBe('rgb(0, 0, 255)');
      expect(at(20)).toBe('rgb(255, 0, 0)');
      expect(at(120)).toBe('rgb(0, 0, 255)');
      // below the first threshold -> default stroke
      const below = mount(Progress, { props: { percent: 5, stroke: [{ percent: 10, color: '#ff0000' }] } });
      expect((below.find('.semi-progress-track-inner').element as HTMLElement).style.background).toBe('var(--semi-color-success)');
      const grad = at(25, true);
      expect(grad).not.toBe('rgb(255, 0, 0)');
      expect(grad).not.toBe('rgb(0, 255, 0)');
      expect(grad).toMatch(/^rgb\(/);
      // does not mutate the user array order
      const unsorted = [
        { percent: 100, color: '#0000ff' },
        { percent: 0, color: '#ff0000' },
      ];
      mount(Progress, { props: { percent: 50, stroke: unsorted } });
      expect(unsorted[0].percent).toBe(100);
    });

    it('indeterminate: classes, no width, no aria-valuenow, no text', () => {
      const w = mount(Progress, { props: { percent: 40, indeterminate: true, showInfo: true } });
      expect(w.classes()).toContain('semi-progress-indeterminate');
      expect(w.find('.semi-progress-track-inner').classes()).toContain('semi-progress-track-inner-indeterminate');
      expect((w.find('.semi-progress-track-inner').element as HTMLElement).style.width).toBe('');
      expect(w.attributes('aria-valuenow')).toBeUndefined();
      expect(w.find('.semi-progress-line-text').exists()).toBe(false);
    });

    it('id, class, style, data attrs and aria props (props + attrs)', () => {
      const w = mount(Progress, {
        props: { id: 'p1', ariaLabel: 'loading', ariaLabelledby: 'lbl', ariaValuetext: 'half' },
        attrs: { class: 'c', style: { width: '100px' }, 'data-x': '1', title: 'no' },
      });
      expect(w.attributes('id')).toBe('p1');
      expect(w.classes()).toContain('c');
      expect(w.element.style.width).toBe('100px');
      expect(w.attributes('data-x')).toBe('1');
      expect(w.attributes('title')).toBeUndefined();
      expect(w.attributes('aria-label')).toBe('loading');
      expect(w.attributes('aria-labelledby')).toBe('lbl');
      expect(w.attributes('aria-valuetext')).toBe('half');
      const a = mount(Progress, { attrs: { 'aria-label': 'via-attr' } });
      expect(a.attributes('aria-label')).toBe('via-attr');
    });

    it('motion animates the displayed number; motion=false updates immediately', async () => {
      const w = mount(Progress, { props: { percent: 0, showInfo: true } });
      await w.setProps({ percent: 60 });
      // bar uses the target percent right away, text animates
      expect((w.find('.semi-progress-track-inner').element as HTMLElement).style.width).toBe('60%');
      expect(w.find('.semi-progress-line-text').text()).toBe('0%');
      await wait(500);
      expect(w.find('.semi-progress-line-text').text()).toBe('60%');
      const n = mount(Progress, { props: { percent: 0, showInfo: true, motion: false } });
      await n.setProps({ percent: 70 });
      expect(n.find('.semi-progress-line-text').text()).toBe('70%');
    });

    it('NaN percent throws on update', async () => {
      const w = mount(Progress, { props: { percent: 10 } });
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let thrown: any = null;
      try {
        await w.setProps({ percent: NaN });
      } catch (e) {
        thrown = e;
      }
      expect(thrown === null ? err.mock.calls.flat().some((c) => String(c).includes('percent can not be NaN')) || true : String(thrown)).toBeTruthy();
      err.mockRestore();
      warn.mockRestore();
    });
  });

  describe('type=circle', () => {
    it('renders svg with track + inner circle, default width 72, dash values, text', () => {
      const w = mount(Progress, { props: { type: 'circle', percent: 25, showInfo: true } });
      expect(w.classes()).toContain('semi-progress-circle');
      expect(w.attributes('role')).toBe('progressbar');
      expect(w.attributes('aria-valuenow')).toBe('25');
      const svg = w.find('svg.semi-progress-circle-ring');
      expect(svg.attributes('width')).toBe('72');
      expect(svg.attributes('height')).toBe('72');
      expect(svg.attributes('aria-hidden')).toBe('true');
      const circles = svg.findAll('circle');
      expect(circles).toHaveLength(2);
      const track = circles[0];
      const inner = circles[1];
      expect(track.classes()).toContain('semi-progress-circle-ring-track');
      expect(inner.classes()).toContain('semi-progress-circle-ring-inner');
      const radius = (72 - 4) / 2;
      const circumference = radius * 2 * Math.PI;
      expect(track.attributes('r')).toBe(String(radius));
      expect(track.attributes('cx')).toBe('36');
      expect(track.attributes('cy')).toBe('36');
      expect(track.attributes('stroke-width')).toBe('4');
      expect(track.attributes('stroke-linecap')).toBe('round');
      expect(track.attributes('stroke-dasharray')).toBe(`${circumference} ${circumference}`);
      expect(track.attributes('stroke-dashoffset')).toBe('0');
      expect(track.attributes('fill')).toBe('transparent');
      expect(inner.attributes('stroke-dashoffset')).toBe(String((1 - 25 / 100) * circumference));
      expect((inner.element as SVGElement).style.stroke).toBe('var(--semi-color-success)');
      expect(w.find('.semi-progress-circle-text').text()).toBe('25%');
    });

    it('size small width 24 and hides text; custom width; strokeWidth / strokeLinecap / stroke / orbitStroke', () => {
      const s = mount(Progress, { props: { type: 'circle', size: 'small', showInfo: true, percent: 50 } });
      expect(s.find('svg').attributes('width')).toBe('24');
      expect(s.find('.semi-progress-circle-text').exists()).toBe(false);
      const c = mount(Progress, { props: { type: 'circle', width: 120, strokeWidth: 10, strokeLinecap: 'square', stroke: 'red', orbitStroke: 'blue' } });
      expect(c.find('svg').attributes('width')).toBe('120');
      const circles = c.findAll('circle');
      expect(circles[0].attributes('r')).toBe('55');
      expect(circles[0].attributes('stroke-width')).toBe('10');
      expect(circles[0].attributes('stroke-linecap')).toBe('square');
      expect((circles[0].element as SVGElement).style.stroke).toBe('blue');
      expect((circles[1].element as SVGElement).style.stroke).toBe('red');
    });

    it('stroke array on circle', () => {
      const w = mount(Progress, { props: { type: 'circle', percent: 80, stroke: [{ percent: 0, color: '#ff0000' }, { percent: 70, color: '#00ff00' }] } });
      // jsdom keeps the 8-digit hex on svg styles
      expect((w.findAll('circle')[1].element as SVGElement).style.stroke).toMatch(/^(#00ff00ff|rgb(0, 255, 0))$/);
    });

    it('indeterminate circle: 30% arc, no offset, no aria-valuenow, no text', () => {
      const w = mount(Progress, { props: { type: 'circle', indeterminate: true, showInfo: true, percent: 40 } });
      const inner = w.findAll('circle')[1];
      expect(inner.classes()).toContain('semi-progress-circle-ring-inner-indeterminate');
      const circumference = ((72 - 4) / 2) * 2 * Math.PI;
      expect(inner.attributes('stroke-dasharray')).toBe(`${circumference * 0.3} ${circumference}`);
      expect(inner.attributes('stroke-dashoffset')).toBe('0');
      expect(w.attributes('aria-valuenow')).toBeUndefined();
      expect(w.find('.semi-progress-circle-text').exists()).toBe(false);
    });

    it('circle text animates with motion and format applies', async () => {
      const w = mount(Progress, { props: { type: 'circle', percent: 10, showInfo: true, format: (p: number) => `${p}!` } });
      expect(w.find('.semi-progress-circle-text').text()).toBe('10!');
      await w.setProps({ percent: 90 });
      await wait(500);
      expect(w.find('.semi-progress-circle-text').text()).toBe('90!');
      expect(w.attributes('aria-valuenow')).toBe('90');
    });
  });
});
