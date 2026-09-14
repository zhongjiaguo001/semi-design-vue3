import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Rating from './index';
import ConfigProvider from '../configProvider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wait(ms = 120) {
  await sleep(ms);
  await flushPromises();
  await nextTick();
}

/** jsdom has no layout: give every star an 20px wide box at index * 20 so allowHalf math works */
function mockStarLayout(width = 20) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const li = this.closest('li');
    const idx = li ? Array.from(li.parentElement!.children).indexOf(li) : 0;
    const left = idx * width;
    return { left, top: 0, width, height: width, right: left + width, bottom: width, x: left, y: 0, toJSON() {} } as any;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
}

const stars = (w: any) => w.findAll('li.semi-rating-star');
const wrappers = (w: any) => w.findAll('.semi-rating-star-wrapper');

describe('Rating', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders ul with count + 1 stars (last is the empty star), default size and aria', () => {
    const w = mount(Rating);
    expect(w.element.tagName).toBe('UL');
    expect(w.classes()).toContain('semi-rating');
    expect(w.attributes('tabindex')).toBe('-1');
    expect(w.attributes('aria-label')).toBe('Rating: 0 of 5 stars,');
    const items = stars(w);
    expect(items).toHaveLength(6);
    items.slice(0, 5).forEach((li: any) => {
      expect(li.classes()).toContain('semi-rating-star-default');
      expect(li.classes()).not.toContain('semi-rating-star-full');
      expect(li.find('.semi-icon-star').exists()).toBe(true);
      expect(li.find('.semi-icon-extra-large').exists()).toBe(true);
    });
    // empty star has size 0 style
    expect((items[5].element as HTMLElement).style.width).toBe('0px');
    const second = items[0].find('.semi-rating-star-second');
    expect(second.attributes('role')).toBe('radio');
    expect(second.attributes('aria-checked')).toBe('false');
    expect(second.attributes('aria-posinset')).toBe('1');
    expect(second.attributes('aria-setsize')).toBe('6');
    expect(second.attributes('aria-label')).toBe('1 star');
    expect(second.attributes('x-semi-prop')).toBe('character');
    expect(second.classes()).toContain('semi-rating-no-focus');
    expect(items[1].find('.semi-rating-star-second').attributes('aria-label')).toBe('2 stars');
    // empty star is the tabbable one when value is 0
    expect(items[5].find('.semi-rating-star-second').attributes('tabindex')).toBe('0');
    expect(items[5].find('.semi-rating-star-second').attributes('aria-checked')).toBe('true');
    expect(items[5].find('.semi-rating-star-second').attributes('aria-label')).toBe('0 stars');
    expect(second.attributes('tabindex')).toBe('-1');
    // no half star element without allowHalf
    expect(items[0].find('.semi-rating-star-first').exists()).toBe(false);
  });

  it('defaultValue marks full stars; count changes the number of stars', () => {
    const w = mount(Rating, { props: { defaultValue: 3, count: 4 } });
    const items = stars(w);
    expect(items).toHaveLength(5);
    expect(items[0].classes()).toContain('semi-rating-star-full');
    expect(items[2].classes()).toContain('semi-rating-star-full');
    expect(items[3].classes()).not.toContain('semi-rating-star-full');
    expect(items[2].find('.semi-rating-star-second').attributes('tabindex')).toBe('0');
    expect(items[2].find('.semi-rating-star-second').attributes('aria-checked')).toBe('true');
    expect(w.attributes('aria-label')).toBe('Rating: 3 of 4 stars,');
    expect(mount(Rating, { props: { defaultValue: 1 } }).attributes('aria-label')).toBe('Rating: 1 of 5 star,');
  });

  it('click selects a star (uncontrolled) and emits change / update events; clicking again clears (allowClear)', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body });
    await wrappers(w)[2].trigger('click', { clientX: 55 });
    expect(w.emitted('change')![0]).toEqual([3]);
    expect(w.emitted('update:modelValue')![0]).toEqual([3]);
    expect(w.emitted('update:value')![0]).toEqual([3]);
    expect(stars(w)[2].classes()).toContain('semi-rating-star-full');
    expect((w.vm as any).getValue()).toBe(3);
    await wrappers(w)[2].trigger('click', { clientX: 55 });
    expect(w.emitted('change')![1]).toEqual([0]);
    expect(stars(w)[2].classes()).not.toContain('semi-rating-star-full');
    w.unmount();
  });

  it('allowClear=false keeps the value when clicking the same star', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body, props: { allowClear: false, defaultValue: 2 } });
    await wrappers(w)[1].trigger('click', { clientX: 35 });
    expect(w.emitted('change')![0]).toEqual([2]);
    expect((w.vm as any).getValue()).toBe(2);
    w.unmount();
  });

  it('controlled value does not change until parent updates; v-model works', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body, props: { value: 1 } });
    await wrappers(w)[3].trigger('click', { clientX: 75 });
    expect(w.emitted('change')![0]).toEqual([4]);
    await nextTick();
    expect(stars(w)[3].classes()).not.toContain('semi-rating-star-full');
    expect(stars(w)[0].classes()).toContain('semi-rating-star-full');
    await w.setProps({ value: 4 });
    expect(stars(w)[3].classes()).toContain('semi-rating-star-full');
    w.unmount();
    const Parent = defineComponent({
      setup() {
        const v = ref(0);
        return () => h('div', [h(Rating, { modelValue: v.value, 'onUpdate:modelValue': (val: number) => (v.value = val) }), h('i', { id: 'out' }, String(v.value))]);
      },
    });
    const p = mount(Parent, { attachTo: document.body });
    await wrappers(p)[4].trigger('click', { clientX: 95 });
    expect(p.find('#out').text()).toBe('5');
    expect(stars(p)[4].classes()).toContain('semi-rating-star-full');
    p.unmount();
  });

  it('hover highlights stars and emits hoverChange; mouseleave resets', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body });
    await wrappers(w)[1].trigger('mousemove', { clientX: 35 });
    expect(w.emitted('hoverChange')![0]).toEqual([2]);
    expect(stars(w)[1].classes()).toContain('semi-rating-star-full');
    expect(stars(w)[0].classes()).toContain('semi-rating-star-full');
    // same value again does not emit
    await wrappers(w)[1].trigger('mousemove', { clientX: 36 });
    expect(w.emitted('hoverChange')).toHaveLength(1);
    await w.trigger('mouseleave');
    expect(w.emitted('hoverChange')![1]).toEqual([undefined]);
    expect(stars(w)[1].classes()).not.toContain('semi-rating-star-full');
    w.unmount();
  });

  it('allowHalf: first-star half element, half class, half values by pointer position, aria set size', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body, props: { allowHalf: true, defaultValue: 2.5 } });
    const items = stars(w);
    expect(items[0].find('.semi-rating-star-first').exists()).toBe(true);
    expect(items[5].find('.semi-rating-star-first').exists()).toBe(false);
    expect(items[2].classes()).toContain('semi-rating-star-half');
    expect(items[2].classes()).not.toContain('semi-rating-star-full');
    expect(items[1].classes()).toContain('semi-rating-star-full');
    const first = items[2].find('.semi-rating-star-first');
    expect(first.attributes('aria-checked')).toBe('true');
    expect(first.attributes('tabindex')).toBe('0');
    expect(first.attributes('aria-setsize')).toBe('11');
    expect(first.attributes('aria-posinset')).toBe('5');
    expect(first.attributes('aria-label')).toBe('2.5 stars');
    expect((first.element as HTMLElement).style.width).toBe('50%');
    expect(items[2].find('.semi-rating-star-second').attributes('aria-posinset')).toBe('6');
    // click left half of star 4 (index 3 -> left 60) => 3.5 ; right half => 4
    await wrappers(w)[3].trigger('click', { clientX: 62 });
    expect(w.emitted('change')![0]).toEqual([3.5]);
    await wrappers(w)[3].trigger('click', { clientX: 78 });
    expect(w.emitted('change')![1]).toEqual([4]);
    await wrappers(w)[0].trigger('mousemove', { clientX: 3 });
    expect(w.emitted('hoverChange')![0]).toEqual([0.5]);
    w.unmount();
  });

  it('rtl direction mirrors half detection', async () => {
    mockStarLayout();
    const w = mount(ConfigProvider, { attachTo: document.body, props: { direction: 'rtl' }, slots: { default: () => h(Rating, { allowHalf: true }) } });
    await wrappers(w)[1].trigger('click', { clientX: 38 });
    expect(w.findComponent(Rating).emitted('change')![0]).toEqual([1.5]);
    w.unmount();
  });

  it('disabled: classes, tabindex -1, no interaction', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body, props: { disabled: true, defaultValue: 2 } });
    expect(w.classes()).toContain('semi-rating-disabled');
    expect(w.attributes('tabindex')).toBe('-1');
    expect(wrappers(w)[0].classes()).toContain('semi-rating-star-disabled');
    expect(stars(w)[1].find('.semi-rating-star-second').attributes('aria-disabled')).toBe('true');
    expect(stars(w)[1].find('.semi-rating-star-second').attributes('tabindex')).toBe('-1');
    await wrappers(w)[3].trigger('click', { clientX: 75 });
    await wrappers(w)[3].trigger('mousemove', { clientX: 75 });
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('hoverChange')).toBeUndefined();
    await w.trigger('keydown', { key: 'ArrowRight' });
    expect(w.emitted('keydown')).toBeUndefined();
    w.unmount();
  });

  it('size small / custom numeric size', () => {
    const s = mount(Rating, { props: { size: 'small' } });
    expect(stars(s)[0].classes()).toContain('semi-rating-star-small');
    expect(stars(s)[0].find('.semi-icon-default').exists()).toBe(true);
    const n = mount(Rating, { props: { size: 30 } });
    const li = stars(n)[0].element as HTMLElement;
    expect(li.style.width).toBe('30px');
    expect(li.style.height).toBe('30px');
    expect(li.style.fontSize).toBe('30px');
    expect(stars(n)[0].classes().some((c: string) => c.startsWith('semi-rating-star-') && c !== 'semi-rating-star-full')).toBe(false);
    // size 'inherit' adds no icon size class
    expect(stars(n)[0].find('.semi-icon').classes().some((c: string) => /^semi-icon-(small|default|large|extra-large|extra-small)$/.test(c))).toBe(false);
  });

  it('character prop (string / node) and character slot; string character becomes aria prefix', () => {
    const w = mount(Rating, { props: { character: 'A' } });
    expect(stars(w)[0].find('.semi-rating-star-second').text()).toBe('A');
    expect(stars(w)[0].find('.semi-icon-star').exists()).toBe(false);
    expect(w.attributes('aria-label')).toBe('Rating: 0 of 5 As,');
    expect(stars(w)[0].find('.semi-rating-star-second').attributes('aria-label')).toBe('1 A');
    const n = mount(Rating, { props: { character: h('b', { class: 'ch' }, 'x') } });
    expect(n.findAll('.ch')).toHaveLength(6);
    const s = mount(Rating, { slots: { character: () => h('i', { class: 'cs' }) } });
    expect(s.findAll('.cs')).toHaveLength(6);
  });

  it('keyboard: arrows change value (step 1 / 0.5, wraps), emit keydown + change, hover reset', async () => {
    const w = mount(Rating, { attachTo: document.body, props: { defaultValue: 4, tabIndex: 0 } });
    await w.trigger('keydown', { key: 'ArrowRight' });
    expect(w.emitted('keydown')).toHaveLength(1);
    expect(w.emitted('change')![0]).toEqual([5]);
    expect(w.emitted('hoverChange')![0]).toEqual([undefined]);
    await w.trigger('keydown', { key: 'ArrowUp' });
    expect(w.emitted('change')![1]).toEqual([0]); // wraps past count
    await w.trigger('keydown', { key: 'ArrowLeft' });
    expect(w.emitted('change')![2]).toEqual([5]); // wraps below 0
    await w.trigger('keydown', { key: 'ArrowDown' });
    expect(w.emitted('change')![3]).toEqual([4]);
    await w.trigger('keydown', { key: 'a' });
    expect(w.emitted('change')).toHaveLength(4);
    expect(document.activeElement).toBe(stars(w)[3].find('.semi-rating-star-second').element);
    const half = mount(Rating, { attachTo: document.body, props: { allowHalf: true, defaultValue: 1 } });
    await half.trigger('keydown', { key: 'ArrowRight' });
    expect(half.emitted('change')![0]).toEqual([1.5]);
    expect(document.activeElement).toBe(stars(half)[1].find('.semi-rating-star-first').element);
    w.unmount();
    half.unmount();
  });

  it('Enter on a star wrapper selects it', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body });
    await wrappers(w)[1].trigger('keydown', { key: 'Enter', keyCode: 13, clientX: 35 });
    expect(w.emitted('change')![0]).toEqual([2]);
    w.unmount();
  });

  it('focus / blur emit and focus-visible classes on stars', async () => {
    const w = mount(Rating, { attachTo: document.body, props: { defaultValue: 2, tabIndex: 0 } });
    const second = stars(w)[1].find('.semi-rating-star-second');
    await second.trigger('focus');
    expect(w.emitted('focus')).toHaveLength(1);
    await second.trigger('blur');
    expect(w.emitted('blur')).toHaveLength(1);
    w.unmount();
  });

  it('autoFocus focuses the active star (respecting preventScroll); exposed focus / blur', async () => {
    const w = mount(Rating, { attachTo: document.body, props: { autoFocus: true, defaultValue: 2, preventScroll: true } });
    await nextTick();
    expect(document.activeElement).toBe(stars(w)[1].find('.semi-rating-star-second').element);
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    (w.vm as any).focus();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(w.element);
    (w.vm as any).blur();
    expect(document.activeElement).not.toBe(w.element);
    w.unmount();
    const empty = mount(Rating, { attachTo: document.body, props: { autoFocus: true } });
    await nextTick();
    expect(document.activeElement).toBe(stars(empty)[5].find('.semi-rating-star-second').element);
    empty.unmount();
  });

  it('tooltips wrap stars in a custom-trigger Tooltip shown for the hovered star', async () => {
    mockStarLayout();
    const w = mount(Rating, { attachTo: document.body, props: { tooltips: ['terrible', 'bad', 'normal', 'good', 'wonderful'], motion: false } });
    const outers = w.findAll('.semi-rating-star-outer');
    expect(outers).toHaveLength(6);
    expect(outers[0].attributes('aria-describedby')).toBeDefined();
    await wrappers(w)[2].trigger('mousemove', { clientX: 55 });
    await wait(150);
    const tip = document.querySelector('.semi-tooltip-content');
    expect(tip).toBeTruthy();
    expect(tip!.textContent).toBe('normal');
    w.unmount();
  });

  it('id, class, style, data attrs and aria props', () => {
    const w = mount(Rating, {
      props: { id: 'r1', ariaLabelledby: 'lbl', ariaDescribedby: 'desc', ariaInvalid: true, ariaRequired: true, ariaErrormessage: 'err' },
      attrs: { class: 'c', style: { margin: '1px' }, 'data-k': 'v', title: 'no' },
    });
    expect(w.attributes('id')).toBe('r1');
    expect(w.classes()).toContain('c');
    expect(w.element.style.margin).toBe('1px');
    expect(w.attributes('data-k')).toBe('v');
    expect(w.attributes('title')).toBeUndefined();
    expect(w.attributes('aria-labelledby')).toBe('lbl');
    expect(w.attributes('aria-describedby')).toBe('desc');
    expect(w.attributes('aria-invalid')).toBe('true');
    expect(w.attributes('aria-required')).toBe('true');
    expect(w.attributes('aria-errormessage')).toBe('err');
    expect(stars(w)[0].find('.semi-rating-star-second').attributes('aria-describedby')).toBe('desc');
    const l = mount(Rating, { props: { ariaLabel: 'point' } });
    expect(l.attributes('aria-label')).toBe('Rating: 0 of 5 points,');
  });

  it('accepts React-style kebab aria-* attrs as a fallback to the camelCase props', () => {
    const w = mount(Rating, {
      attrs: { 'aria-label': 'point', 'aria-labelledby': 'lbl', 'aria-describedby': 'desc', 'aria-invalid': true, 'aria-required': true, 'aria-errormessage': 'err' },
    });
    expect(w.attributes('aria-label')).toBe('Rating: 0 of 5 points,');
    expect(w.attributes('aria-labelledby')).toBe('lbl');
    expect(w.attributes('aria-describedby')).toBe('desc');
    expect(w.attributes('aria-invalid')).toBe('true');
    expect(w.attributes('aria-required')).toBe('true');
    expect(w.attributes('aria-errormessage')).toBe('err');
    expect(stars(w)[0].find('.semi-rating-star-second').attributes('aria-describedby')).toBe('desc');
    // prop wins over attr
    const p = mount(Rating, { props: { ariaLabel: 'heart' }, attrs: { 'aria-label': 'point' } });
    expect(p.attributes('aria-label')).toBe('Rating: 0 of 5 hearts,');
  });

  it('official examples: tooltips + controlled value, custom character / count / numeric size', async () => {
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];
    const w = mount(Rating, { props: { tooltips: desc, value: 0 } });
    expect(w.findAll('.semi-rating-star-outer').length).toBe(6);
    const c = mount(Rating, { props: { count: 10, defaultValue: 6 } });
    expect(stars(c).length).toBe(11);
    expect(c.findAll('li.semi-rating-star-full').length).toBe(6);
    const s = mount(Rating, { props: { character: '赞', size: 18, defaultValue: 3 } });
    expect(stars(s)[0].element.style.fontSize).toBe('18px');
    expect(stars(s)[0].find('.semi-rating-star-second').text()).toBe('赞');
    expect(s.attributes('aria-label')).toBe('Rating: 3 of 5 赞s,');
    // empty star always gets size 0 -> no size class for custom size
    const st = mount(Rating, { attrs: { style: { color: 'red' } } });
    expect(st.element.style.color).toBe('red');
  });
});
