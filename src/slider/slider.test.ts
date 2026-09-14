import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slider } from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitPopup(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}
/** the handle tooltips animate (motion=true like React); jsdom never fires animationend, so we do */
async function finishLeaveAnimation() {
  document.querySelectorAll('.semi-tooltip-wrapper').forEach((el) => el.dispatchEvent(new Event('animationend')));
  await waitPopup();
}

/**
 * jsdom has no layout: give the slider wrapper a 200px wide / 200px tall box at (0,0)
 * so that a clientX of N maps to N/200 of the range.
 */
function mockLayout(wrapper: any, { width = 200, height = 200 } = {}) {
  const el = wrapper.find('.semi-slider-wrapper').element as HTMLElement;
  const rect = { left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON() {} };
  el.getBoundingClientRect = () => rect as DOMRect;
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  Object.defineProperty(el, 'offsetParent', { value: null, configurable: true });
  return el;
}

function mockHandleRect(handleEl: HTMLElement, center: number) {
  handleEl.getBoundingClientRect = () => ({ left: center - 5, top: center - 5, width: 10, height: 10, right: center + 5, bottom: center + 5, x: center - 5, y: center - 5, toJSON() {} } as DOMRect);
}

describe('Slider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders horizontal structure with defaults', () => {
    const wrapper = mount(Slider);
    expect(wrapper.classes()).toContain('semi-slider');
    const inner = wrapper.find('.semi-slider-wrapper');
    expect(inner.exists()).toBe(true);
    expect(wrapper.find('.semi-slider-rail').exists()).toBe(true);
    expect(wrapper.find('.semi-slider-track').exists()).toBe(true);
    const handles = wrapper.findAll('.semi-slider-handle');
    expect(handles).toHaveLength(1);
    const handle = handles[0];
    expect(handle.attributes('role')).toBe('slider');
    expect(handle.attributes('tabindex')).toBe('0');
    expect(handle.attributes('aria-valuenow')).toBe('0');
    expect(handle.attributes('aria-valuemin')).toBe('0');
    expect(handle.attributes('aria-valuemax')).toBe('100');
    expect(handle.attributes('aria-disabled')).toBe('false');
    expect(handle.attributes('style')).toContain('left: 0%');
    expect(wrapper.find('.semi-slider-boundary').exists()).toBe(true);
    expect(wrapper.find('.semi-slider-boundary-min').text()).toBe('0');
    expect(wrapper.find('.semi-slider-boundary-max').text()).toBe('100');
    expect(wrapper.find('.semi-slider-marks').exists()).toBe(false);
  });

  it('defaultValue positions handle and track', () => {
    const wrapper = mount(Slider, { props: { defaultValue: 30 } });
    expect(wrapper.find('.semi-slider-handle').attributes('style')).toContain('left: 30%');
    expect(wrapper.find('.semi-slider-track').attributes('style')).toContain('width: 30%');
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('30');
  });

  it('min / max change the boundary and percent', () => {
    const wrapper = mount(Slider, { props: { min: 10, max: 20, defaultValue: 15 } });
    expect(wrapper.find('.semi-slider-boundary-min').text()).toBe('10');
    expect(wrapper.find('.semi-slider-boundary-max').text()).toBe('20');
    expect(wrapper.find('.semi-slider-handle').attributes('style')).toContain('left: 50%');
  });

  it('value out of range is clamped on init', async () => {
    const wrapper = mount(Slider, { props: { defaultValue: 500 } });
    await nextTick();
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('100');
    const w2 = mount(Slider, { props: { range: true, defaultValue: [-5, 500] } });
    await nextTick();
    const hs = w2.findAll('.semi-slider-handle');
    expect(hs[0].attributes('aria-valuenow')).toBe('0');
    expect(hs[1].attributes('aria-valuenow')).toBe('100');
  });

  it('range renders two handles with the correct aria bounds and label', () => {
    const wrapper = mount(Slider, { props: { range: true, defaultValue: [20, 60] } });
    const handles = wrapper.findAll('.semi-slider-handle');
    expect(handles).toHaveLength(2);
    expect(handles[0].attributes('aria-valuenow')).toBe('20');
    expect(handles[0].attributes('aria-valuemax')).toBe('60');
    expect(handles[0].attributes('aria-valuemin')).toBe('0');
    expect(handles[1].attributes('aria-valuenow')).toBe('60');
    expect(handles[1].attributes('aria-valuemin')).toBe('20');
    expect(handles[1].attributes('aria-valuemax')).toBe('100');
    expect(handles[0].attributes('style')).toContain('left: 20%');
    expect(handles[1].attributes('style')).toContain('left: 60%');
    const track = wrapper.find('.semi-slider-track');
    expect(track.attributes('style')).toContain('width: 40%');
    expect(track.attributes('style')).toContain('left: 20%');
    expect(wrapper.find('.semi-slider-wrapper').attributes('aria-label')).toBe('Range: 20 to 60');
  });

  it('getAriaValueText / aria-label / aria-labelledby / aria-valuetext', () => {
    const wrapper = mount(Slider, {
      props: { range: true, defaultValue: [1, 2], getAriaValueText: (v: number, i?: number) => `v${v}i${i}` },
    });
    expect(wrapper.find('.semi-slider-wrapper').attributes('aria-label')).toBe('Range: v1i0 to v2i1');
    const handles = wrapper.findAll('.semi-slider-handle');
    expect(handles[0].attributes('aria-valuetext')).toBe('v1i0');
    expect(handles[1].attributes('aria-valuetext')).toBe('v2i1');
    const w2 = mount(Slider, { attrs: { 'aria-label': 'vol', 'aria-labelledby': 'lbl', 'aria-valuetext': 'loud' } });
    const handle = w2.find('.semi-slider-handle');
    expect(handle.attributes('aria-label')).toBe('vol');
    expect(handle.attributes('aria-labelledby')).toBe('lbl');
    expect(handle.attributes('aria-valuetext')).toBe('loud');
    const w3 = mount(Slider, { props: { ariaLabel: 'p-label' } });
    expect(w3.find('.semi-slider-handle').attributes('aria-label')).toBe('p-label');
  });

  it('disabled: class, aria, tabindex, no keyboard changes', async () => {
    const wrapper = mount(Slider, { props: { disabled: true, defaultValue: 10 } });
    expect(wrapper.find('.semi-slider-wrapper').classes()).toContain('semi-slider-disabled');
    const handle = wrapper.find('.semi-slider-handle');
    expect(handle.attributes('tabindex')).toBe('-1');
    expect(handle.attributes('aria-disabled')).toBe('true');
    expect(handle.attributes('aria-label')).toBe('Disabled Slider');
    await wrapper.setProps({ disabled: false });
    expect(wrapper.find('.semi-slider-wrapper').classes()).not.toContain('semi-slider-disabled');
    await wrapper.setProps({ disabled: true });
    expect(wrapper.find('.semi-slider-wrapper').classes()).toContain('semi-slider-disabled');
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 100, clientY: 0 });
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('vertical renders vertical wrapper and top-based positions', () => {
    const wrapper = mount(Slider, { props: { vertical: true, defaultValue: 25, range: false } });
    expect(wrapper.classes()).toContain('semi-slider-vertical-wrapper');
    expect(wrapper.find('.semi-slider-vertical').exists()).toBe(false);
    expect(wrapper.find('.semi-slider-handle').attributes('style')).toContain('top: 25%');
    expect(wrapper.find('.semi-slider-handle').attributes('aria-orientation')).toBe('vertical');
    expect(wrapper.find('.semi-slider-track').attributes('style')).toContain('height: 25%');
    const w2 = mount(Slider, { props: { vertical: true, verticalReverse: true, marks: { 10: 'a' } } });
    expect(w2.classes()).toContain('semi-slider-reverse');
    expect(w2.find('.semi-slider-marks-reverse').exists()).toBe(true);
    expect(w2.find('.semi-slider-mark-reverse').exists()).toBe(true);
  });

  it('marks render dots + labels, active state, showMarkLabel=false hides labels', () => {
    const wrapper = mount(Slider, { props: { defaultValue: 50, marks: { 0: '0°', 50: '50°', 100: '100°', 200: 'out' } } });
    const dots = wrapper.findAll('.semi-slider-dot');
    expect(dots).toHaveLength(3);
    expect(dots[0].classes()).toContain('semi-slider-dot-active');
    expect(dots[1].classes()).toContain('semi-slider-dot-active');
    expect(dots[2].classes()).not.toContain('semi-slider-dot-active');
    expect(dots[1].attributes('style')).toContain('calc(50% - 2px)');
    const marks = wrapper.findAll('.semi-slider-mark');
    expect(marks).toHaveLength(3);
    expect(marks.map((m) => m.text())).toEqual(['0°', '50°', '100°']);
    expect(marks[1].attributes('style')).toContain('left: 50%');
    const w2 = mount(Slider, { props: { marks: { 10: 'x' }, showMarkLabel: false } });
    expect(w2.find('.semi-slider-dots').exists()).toBe(true);
    expect(w2.find('.semi-slider-marks').exists()).toBe(false);
  });

  it('included=false: no track style and marks are not active', () => {
    const wrapper = mount(Slider, { props: { defaultValue: 50, included: false, marks: { 20: 'a' } } });
    expect(wrapper.find('.semi-slider-track').attributes('style') ?? '').toBe('');
    expect(wrapper.find('.semi-slider-dot').classes()).not.toContain('semi-slider-dot-active');
  });

  it('range marks active only inside the interval', () => {
    const wrapper = mount(Slider, { props: { range: true, defaultValue: [20, 60], marks: { 10: 'a', 30: 'b', 80: 'c' } } });
    const dots = wrapper.findAll('.semi-slider-dot');
    expect(dots[0].classes()).not.toContain('semi-slider-dot-active');
    expect(dots[1].classes()).toContain('semi-slider-dot-active');
    expect(dots[2].classes()).not.toContain('semi-slider-dot-active');
  });

  it('tooltipOnMark wraps dots with a tooltip', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { marks: { 10: 'ten' }, tooltipOnMark: true } });
    const dot = wrapper.find('.semi-slider-dot');
    expect(dot.attributes('aria-describedby')).toBeDefined();
    await dot.trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.semi-tooltip-content')?.textContent).toBe('ten');
    wrapper.unmount();
  });

  it('railStyle / style / class / data attrs', () => {
    const wrapper = mount(Slider, { props: { railStyle: { background: 'red' } }, attrs: { class: 'custom', style: 'width: 300px', 'data-test': 'slider', id: 'no' } });
    expect(wrapper.find('.semi-slider-rail').attributes('style')).toContain('background: red');
    const inner = wrapper.find('.semi-slider-wrapper');
    expect(inner.classes()).toContain('custom');
    expect(inner.attributes('style')).toContain('width: 300px');
    expect(inner.attributes('data-test')).toBe('slider');
    expect(inner.attributes('id')).toBeUndefined();
  });

  it('showBoundary toggles the boundary on wrapper hover', async () => {
    const wrapper = mount(Slider, { props: { showBoundary: true } });
    const inner = wrapper.find('.semi-slider-wrapper');
    expect(wrapper.find('.semi-slider-boundary').classes()).not.toContain('semi-slider-boundary-show');
    await inner.trigger('mouseenter');
    expect(wrapper.find('.semi-slider-boundary').classes()).toContain('semi-slider-boundary-show');
    await inner.trigger('mouseleave');
    expect(wrapper.find('.semi-slider-boundary').classes()).not.toContain('semi-slider-boundary-show');
    const w2 = mount(Slider);
    await w2.find('.semi-slider-wrapper').trigger('mouseenter');
    expect(w2.find('.semi-slider-boundary').classes()).not.toContain('semi-slider-boundary-show');
  });

  it('handleDot renders a dot inside the handle (single & range)', () => {
    const w1 = mount(Slider, { props: { handleDot: { size: '8px', color: 'blue' } } });
    const dot = w1.find('.semi-slider-handle-dot');
    expect(dot.exists()).toBe(true);
    expect(dot.attributes('style')).toContain('width: 8px');
    expect(dot.attributes('style')).toContain('height: 8px');
    expect(dot.attributes('style')).toContain('background-color: blue');
    const w2 = mount(Slider, { props: { range: true, handleDot: [{ color: 'red' }, { size: '4px' }] } });
    const dots = w2.findAll('.semi-slider-handle-dot');
    expect(dots).toHaveLength(2);
    expect(dots[0].attributes('style')).toContain('background-color: red');
    expect(dots[1].attributes('style')).toContain('width: 4px');
    const w3 = mount(Slider, { props: { range: true, handleDot: [{ color: 'red' }] } });
    expect(w3.findAll('.semi-slider-handle-dot')).toHaveLength(1);
  });

  it('keyboard: arrows / PageUp / PageDown / Home / End emit change and move the handle', async () => {
    const wrapper = mount(Slider, { props: { defaultValue: 10, step: 2 } });
    const handle = wrapper.find('.semi-slider-handle');
    await handle.trigger('keydown', { key: 'ArrowRight' });
    expect(handle.attributes('aria-valuenow')).toBe('12');
    expect(wrapper.emitted('change')![0]).toEqual([12]);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([12]);
    expect(wrapper.emitted('update:value')![0]).toEqual([12]);
    await handle.trigger('keydown', { key: 'ArrowUp' });
    expect(handle.attributes('aria-valuenow')).toBe('14');
    await handle.trigger('keydown', { key: 'ArrowLeft' });
    await handle.trigger('keydown', { key: 'ArrowDown' });
    expect(handle.attributes('aria-valuenow')).toBe('10');
    await handle.trigger('keydown', { key: 'PageUp' });
    expect(handle.attributes('aria-valuenow')).toBe('30');
    await handle.trigger('keydown', { key: 'PageDown' });
    expect(handle.attributes('aria-valuenow')).toBe('10');
    await handle.trigger('keydown', { key: 'End' });
    expect(handle.attributes('aria-valuenow')).toBe('100');
    await handle.trigger('keydown', { key: 'End' });
    await handle.trigger('keydown', { key: 'Home' });
    expect(handle.attributes('aria-valuenow')).toBe('0');
    // an unchanged value (second End) does not emit
    expect(wrapper.emitted('change')).toHaveLength(8);
    await handle.trigger('keydown', { key: 'a' });
    expect(wrapper.emitted('change')).toHaveLength(8);
  });

  it('keyboard on range handles keeps min <= max', async () => {
    const wrapper = mount(Slider, { props: { range: true, defaultValue: [10, 12] } });
    const [minH, maxH] = wrapper.findAll('.semi-slider-handle');
    await minH.trigger('keydown', { key: 'ArrowRight' });
    await minH.trigger('keydown', { key: 'ArrowRight' });
    await minH.trigger('keydown', { key: 'ArrowRight' });
    expect(minH.attributes('aria-valuenow')).toBe('12');
    expect(wrapper.emitted('change')!.slice(-1)[0]).toEqual([[12, 12]]);
    await maxH.trigger('keydown', { key: 'ArrowLeft' });
    expect(maxH.attributes('aria-valuenow')).toBe('12');
    await maxH.trigger('keydown', { key: 'End' });
    expect(maxH.attributes('aria-valuenow')).toBe('100');
    await maxH.trigger('keydown', { key: 'Home' });
    expect(maxH.attributes('aria-valuenow')).toBe('12');
    await minH.trigger('keydown', { key: 'Home' });
    expect(minH.attributes('aria-valuenow')).toBe('0');
    await minH.trigger('keydown', { key: 'End' });
    expect(minH.attributes('aria-valuenow')).toBe('12');
  });

  it('rtl: arrows are mirrored and handle uses right', async () => {
    const wrapper = mount(ConfigProvider, { props: { direction: 'rtl' }, slots: { default: () => h(Slider, { defaultValue: 10 }) } });
    const handle = wrapper.find('.semi-slider-handle');
    expect(handle.attributes('style')).toContain('right: 10%');
    await handle.trigger('keydown', { key: 'ArrowLeft' });
    expect(handle.attributes('aria-valuenow')).toBe('11');
    expect(wrapper.find('.semi-slider-track').attributes('style')).toContain('right: 0');
  });

  it('click on the rail moves the handle, emits change and afterChange', async () => {
    const wrapper = mount(Slider, { attachTo: document.body });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 100, clientY: 0 });
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([50]);
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('50');
    expect(wrapper.emitted('afterChange')![0]).toEqual([50]);
    wrapper.unmount();
  });

  it('click on the track / a mark also moves the handle; step snaps', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { step: 10, marks: { 30: 'x' } } });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-track').trigger('click', { clientX: 66, clientY: 0 });
    expect(wrapper.emitted('change')![0]).toEqual([30]);
    await wrapper.find('.semi-slider-mark').trigger('click', { clientX: 60, clientY: 0 });
    // already at 30 -> no change
    expect(wrapper.emitted('change')).toHaveLength(1);
    await wrapper.find('.semi-slider-dot').trigger('click', { clientX: 180, clientY: 0 });
    expect(wrapper.emitted('change')![1]).toEqual([90]);
    wrapper.unmount();
  });

  it('decimal step outputs rounded decimals', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { min: 0, max: 1, step: 0.1 } });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 66, clientY: 0 });
    expect(wrapper.emitted('change')![0]).toEqual([0.3]);
    wrapper.unmount();
  });

  it('range click moves the nearest handle', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { range: true, defaultValue: [20, 80] } });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 60, clientY: 0 });
    expect(wrapper.emitted('change')![0]).toEqual([[30, 80]]);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 180, clientY: 0 });
    expect(wrapper.emitted('change')![1]).toEqual([[30, 90]]);
    wrapper.unmount();
  });

  it('vertical click uses clientY', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { vertical: true } });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 0, clientY: 50 });
    expect(wrapper.emitted('change')![0]).toEqual([25]);
    const w2 = mount(Slider, { attachTo: document.body, props: { vertical: true, verticalReverse: true } });
    mockLayout(w2);
    await w2.find('.semi-slider-rail').trigger('click', { clientX: 0, clientY: 50 });
    expect(w2.emitted('change')![0]).toEqual([75]);
    wrapper.unmount();
    w2.unmount();
  });

  it('controlled value: rail click emits but does not move; parent update moves & emits afterChange', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { value: 10 } });
    mockLayout(wrapper);
    await wrapper.find('.semi-slider-rail').trigger('click', { clientX: 100, clientY: 0 });
    expect(wrapper.emitted('change')![0]).toEqual([50]);
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('10');
    await wrapper.setProps({ value: 70 });
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('70');
    expect(wrapper.emitted('afterChange')!.slice(-1)[0]).toEqual([70]);
    await wrapper.setProps({ value: 500 });
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('100');
    wrapper.unmount();
  });

  it('controlled range value updates from parent', async () => {
    const wrapper = mount(Slider, { props: { range: true, value: [10, 20] } });
    await wrapper.setProps({ value: [30, 40] });
    const hs = wrapper.findAll('.semi-slider-handle');
    expect(hs[0].attributes('aria-valuenow')).toBe('30');
    expect(hs[1].attributes('aria-valuenow')).toBe('40');
  });

  it('v-model works', async () => {
    const Parent = defineComponent({
      setup() {
        const v = ref(10);
        return () => h('div', [h(Slider, { modelValue: v.value, 'onUpdate:modelValue': (val: any) => (v.value = val) }), h('span', { id: 'out' }, String(v.value))]);
      },
    });
    const wrapper = mount(Parent);
    const handle = wrapper.find('.semi-slider-handle');
    expect(handle.attributes('aria-valuenow')).toBe('10');
    await handle.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.find('#out').text()).toBe('11');
    expect(wrapper.find('.semi-slider-handle').attributes('aria-valuenow')).toBe('11');
  });

  it('drag: mousedown on handle, mousemove on body, mouseup on window', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 0 } });
    mockLayout(wrapper);
    const handle = wrapper.find('.semi-slider-handle');
    mockHandleRect(handle.element as HTMLElement, 0);
    await handle.trigger('mousedown', { clientX: 0, clientY: 0 });
    expect(handle.classes()).toContain('semi-slider-handle-clicked');
    expect(handle.attributes('style')).toContain('z-index: 2');
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 0, bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([50]);
    expect(handle.attributes('aria-valuenow')).toBe('50');
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 0, bubbles: true }));
    await nextTick();
    expect(handle.attributes('aria-valuenow')).toBe('75');
    const onMouseUp = vi.fn();
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('afterChange')!.slice(-1)[0]).toEqual([75]);
    expect(wrapper.emitted('mouseup')).toHaveLength(1);
    expect(handle.classes()).not.toContain('semi-slider-handle-clicked');
    // listeners removed: further moves are ignored
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 0, bubbles: true }));
    await nextTick();
    expect(handle.attributes('aria-valuenow')).toBe('75');
    wrapper.unmount();
  });

  it('drag range max handle', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { range: true, defaultValue: [10, 50] } });
    mockLayout(wrapper);
    const [, maxH] = wrapper.findAll('.semi-slider-handle');
    mockHandleRect(maxH.element as HTMLElement, 100);
    await maxH.trigger('mousedown', { clientX: 100, clientY: 0 });
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 160, clientY: 0, bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([[10, 80]]);
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(wrapper.emitted('afterChange')![0]).toEqual([[10, 80]]);
    wrapper.unmount();
  });

  it('controlled drag emits change but keeps value until parent updates', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { value: 0 } });
    mockLayout(wrapper);
    const handle = wrapper.find('.semi-slider-handle');
    mockHandleRect(handle.element as HTMLElement, 0);
    await handle.trigger('mousedown', { clientX: 0, clientY: 0 });
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 0, bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([50]);
    expect(handle.attributes('aria-valuenow')).toBe('0');
    window.dispatchEvent(new MouseEvent('mouseup'));
    wrapper.unmount();
  });

  it('touch: touchstart on handle + touchmove on body', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 0 } });
    mockLayout(wrapper);
    const handle = wrapper.find('.semi-slider-handle');
    const el = handle.element as HTMLElement;
    mockHandleRect(el, 0);
    const touchPoint = (x: number) => ({ clientX: x, clientY: 0, pageX: x, pageY: 0, target: el, stopPropagation() {}, preventDefault() {} });
    const touchStart = new Event('touchstart', { bubbles: true, cancelable: true }) as any;
    touchStart.touches = [touchPoint(0)];
    el.dispatchEvent(touchStart);
    await nextTick();
    expect(handle.classes()).toContain('semi-slider-handle-clicked');
    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true }) as any;
    touchMove.touches = [touchPoint(100)];
    Object.defineProperty(touchMove, 'target', { value: el });
    document.body.dispatchEvent(touchMove);
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([50]);
    await handle.trigger('touchend');
    expect(wrapper.emitted('afterChange')![0]).toEqual([50]);
    wrapper.unmount();
  });

  it('handle hover shows tooltip with value (default tipFormatter)', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 33, motion: false } as any });
    const handle = wrapper.find('.semi-slider-handle');
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeNull();
    await handle.trigger('mouseenter');
    await waitPopup();
    const tip = document.querySelector('.semi-slider-handle-tooltip');
    expect(tip).toBeTruthy();
    expect(tip!.querySelector('.semi-tooltip-content')!.textContent).toBe('33');
    await handle.trigger('mouseleave');
    await waitPopup();
    expect(document.querySelector('.semi-slider-handle-tooltip')!.classList.contains('semi-tooltip-wrapper-show')).toBe(false);
    await finishLeaveAnimation();
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeNull();
    wrapper.unmount();
  });

  it('tipFormatter formats the tooltip; tipFormatter=null disables tooltip', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 33, tipFormatter: (v: any) => `${v}%` } });
    await wrapper.find('.semi-slider-handle').trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.semi-slider-handle-tooltip .semi-tooltip-content')!.textContent).toBe('33%');
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(Slider, { attachTo: document.body, props: { defaultValue: 33, tipFormatter: null } });
    await w2.find('.semi-slider-handle').trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeNull();
    w2.unmount();
  });

  it('tooltipVisible=true always shows, tooltipVisible=false never shows', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 5, tooltipVisible: true, range: true } });
    await waitPopup();
    expect(document.querySelectorAll('.semi-slider-handle-tooltip')).toHaveLength(2);
    wrapper.unmount();
    document.body.innerHTML = '';
    const w2 = mount(Slider, { attachTo: document.body, props: { defaultValue: 5, tooltipVisible: false } });
    await w2.find('.semi-slider-handle').trigger('mouseenter');
    await waitPopup();
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeNull();
    w2.unmount();
  });

  it('showArrow=false hides the tooltip arrow', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 5, tooltipVisible: true, showArrow: false } });
    await waitPopup();
    const tip = document.querySelector('.semi-slider-handle-tooltip')!;
    expect(tip).toBeTruthy();
    expect(tip.querySelector('.semi-tooltip-icon-arrow')).toBeNull();
    wrapper.unmount();
  });

  it('focus-visible on handle shows tooltip; blur hides', async () => {
    const wrapper = mount(Slider, { attachTo: document.body, props: { defaultValue: 5 } });
    const handle = wrapper.find('.semi-slider-handle');
    const el = handle.element as HTMLElement;
    const origMatches = el.matches;
    el.matches = (sel: string) => (sel === ':focus-visible' ? true : origMatches.call(el, sel));
    await handle.trigger('focus');
    await waitPopup();
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeTruthy();
    await handle.trigger('blur');
    await finishLeaveAnimation();
    expect(document.querySelector('.semi-slider-handle-tooltip')).toBeNull();
    wrapper.unmount();
  });

  it('exposes foundation and element refs', () => {
    const wrapper = mount(Slider);
    const vm = wrapper.vm as any;
    expect(vm.foundation).toBeTruthy();
    expect(vm.sliderEl).toBe(wrapper.find('.semi-slider-wrapper').element);
    expect(vm.minHandleEl).toBe(wrapper.find('.semi-slider-handle').element);
  });

  it('unmount removes document listeners registered during drag', async () => {
    const wrapper = mount(Slider, { attachTo: document.body });
    mockLayout(wrapper);
    const handle = wrapper.find('.semi-slider-handle');
    mockHandleRect(handle.element as HTMLElement, 0);
    await handle.trigger('mousedown', { clientX: 0, clientY: 0 });
    wrapper.unmount();
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await flushPromises();
    expect(wrapper.emitted('change')).toBeUndefined();
  });
});

describe('Slider (demo parity extras)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('tipFormatter is applied to both range handles on hover', async () => {
    const wrapper = mount(Slider, {
      attachTo: document.body,
      props: { range: true, defaultValue: [20, 60], tipFormatter: (v: any) => `${v}°C`, motion: false } as any,
    });
    const handles = wrapper.findAll('.semi-slider-handle');
    await handles[1].trigger('mouseenter');
    await waitPopup();
    expect(document.body.textContent).toContain('60°C');
    wrapper.unmount();
  });

  it('min / max prop updates reflect in the boundary and aria after mount', async () => {
    const wrapper = mount(Slider, { props: { min: 10, max: 100, range: true, defaultValue: [20, 60] } });
    await wrapper.setProps({ min: 0, max: 200 });
    await nextTick();
    expect(wrapper.find('.semi-slider-boundary-min').text()).toBe('0');
    expect(wrapper.find('.semi-slider-boundary-max').text()).toBe('200');
    expect(wrapper.findAll('.semi-slider-handle')[1].attributes('aria-valuemax')).toBe('200');
  });

  it('railStyle object is applied to the rail (segment background demo)', () => {
    const bg = 'linear-gradient(to right, red 10%, transparent 10%)';
    const wrapper = mount(Slider, { props: { range: true, value: [20, 60], railStyle: { background: bg } } });
    expect((wrapper.find('.semi-slider-rail').element as HTMLElement).style.background).toContain('linear-gradient');
  });

  it('vertical + verticalReverse range renders both handles with aria-orientation', () => {
    const wrapper = mount(Slider, { props: { vertical: true, verticalReverse: true, range: true, defaultValue: [20, 60], marks: { 20: '20°C', 40: '40°C' }, step: 10 } });
    const handles = wrapper.findAll('.semi-slider-handle');
    expect(handles).toHaveLength(2);
    handles.forEach((hd) => expect(hd.attributes('aria-orientation')).toBe('vertical'));
    expect(wrapper.find('.semi-slider-vertical-wrapper').exists()).toBe(true);
    expect(wrapper.find('.semi-slider-marks-reverse').findAll('.semi-slider-mark-reverse')).toHaveLength(2);
  });
});
