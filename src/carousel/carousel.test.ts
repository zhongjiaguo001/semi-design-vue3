import { mount } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Carousel, CarouselIndicator, CarouselArrow } from './index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slides = (n = 3) => Array.from({ length: n }, (_, i) => h('div', { class: `slide-${i}`, style: { color: 'red' } }, `slide ${i}`));

const mountCarousel = (props: Record<string, any> = {}, n = 3) =>
  mount(Carousel, { props: { autoPlay: false, ...props }, slots: { default: () => slides(n) } });

describe('Carousel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders wrapper, content, items with active classes and animation styles', () => {
    const wrapper = mountCarousel();
    expect(wrapper.classes()).toContain('semi-carousel');
    const content = wrapper.find('.semi-carousel-content');
    expect(content.exists()).toBe(true);
    expect(content.classes()).toContain('semi-carousel-content-slide');
    expect(content.attributes('x-semi-prop')).toBe('children');
    const items = wrapper.findAll('.semi-carousel-content-item');
    expect(items).toHaveLength(3);
    expect(items[0].classes()).toContain('semi-carousel-content-item-active');
    expect(items[0].classes()).toContain('semi-carousel-content-item-current');
    expect(items[1].classes()).toContain('semi-carousel-content-item-next');
    expect(items[2].classes()).toContain('semi-carousel-content-item-prev');
    // keeps child class/style and adds animation style
    expect(items[0].classes()).toContain('slide-0');
    expect(items[0].attributes('style')).toContain('color: red');
    expect(items[0].attributes('style')).toContain('transition-duration: 300ms');
    expect(items[0].attributes('style')).toContain('animation-duration: 300ms');
    // isInit: no slide-in yet
    expect(items[0].classes()).not.toContain('semi-carousel-content-item-slide-in');
  });

  it('speed prop drives the animation duration', () => {
    const wrapper = mountCarousel({ speed: 800 });
    expect(wrapper.find('.semi-carousel-content-item').attributes('style')).toContain('transition-duration: 800ms');
  });

  it('animation=fade uses fade class and never sets slide-in/out', async () => {
    const wrapper = mountCarousel({ animation: 'fade' });
    expect(wrapper.find('.semi-carousel-content').classes()).toContain('semi-carousel-content-fade');
    (wrapper.vm as any).next();
    await nextTick();
    expect(wrapper.find('.semi-carousel-content-item-slide-in').exists()).toBe(false);
    expect(wrapper.find('.semi-carousel-content-item-slide-out').exists()).toBe(false);
  });

  it('defaultActiveIndex sets the initial slide', () => {
    const wrapper = mountCarousel({ defaultActiveIndex: 2 });
    const items = wrapper.findAll('.semi-carousel-content-item');
    expect(items[2].classes()).toContain('semi-carousel-content-item-active');
    expect(wrapper.findAll('.semi-carousel-indicator-item')[2].classes()).toContain('semi-carousel-indicator-item-active');
  });

  it('class / style / data-* attrs are applied to the root', () => {
    const wrapper = mountCarousel({ class: 'my-c', style: { width: '100px' }, 'data-foo': 'bar', id: 'ignored' });
    expect(wrapper.classes()).toContain('my-c');
    expect(wrapper.attributes('style')).toContain('width: 100px');
    expect(wrapper.attributes('data-foo')).toBe('bar');
    expect(wrapper.attributes('id')).toBeUndefined();
  });

  it('renders indicator with type/position/size/theme classes', () => {
    const wrapper = mountCarousel({ indicatorType: 'line', indicatorPosition: 'left', indicatorSize: 'medium', theme: 'dark' });
    const outer = wrapper.find('.semi-carousel-indicator');
    expect(outer.exists()).toBe(true);
    const inner = outer.find('.semi-carousel-indicator-line');
    expect(inner.exists()).toBe(true);
    expect(inner.classes()).toContain('semi-carousel-indicator-left');
    const items = inner.findAll('.semi-carousel-indicator-item');
    expect(items).toHaveLength(3);
    expect(items[0].classes()).toContain('semi-carousel-indicator-item-active');
    expect(items[0].classes()).toContain('semi-carousel-indicator-item-dark');
    expect(items[0].classes()).toContain('semi-carousel-indicator-item-medium');
    expect(items[1].attributes('data-index')).toBe('1');
  });

  it.each(['dot', 'line', 'columnar'] as const)('indicatorType=%s', (type) => {
    const wrapper = mountCarousel({ indicatorType: type });
    expect(wrapper.find(`.semi-carousel-indicator-${type}`).exists()).toBe(true);
  });

  it('showIndicator=false hides indicator; single child hides indicator and arrows', () => {
    expect(mountCarousel({ showIndicator: false }).find('.semi-carousel-indicator').exists()).toBe(false);
    const single = mountCarousel({}, 1);
    expect(single.find('.semi-carousel-indicator').exists()).toBe(false);
    expect(single.find('.semi-carousel-arrow').exists()).toBe(false);
  });

  it('renders arrows with theme / hover classes and default chevron icons', () => {
    const wrapper = mountCarousel({ arrowType: 'hover', theme: 'primary' });
    const arrow = wrapper.find('.semi-carousel-arrow');
    expect(arrow.classes()).toContain('semi-carousel-arrow-hover');
    expect(arrow.classes()).toContain('semi-carousel-arrow-primary');
    expect(arrow.find('.semi-carousel-arrow-prev').classes()).toContain('semi-carousel-arrow-primary');
    expect(arrow.find('.semi-carousel-arrow-next').exists()).toBe(true);
    expect(arrow.find('.semi-carousel-arrow-prev .semi-icon-chevron_left').exists()).toBe(true);
    expect(arrow.find('.semi-carousel-arrow-next .semi-icon-chevron_right').exists()).toBe(true);
    expect(mountCarousel({ arrowType: 'always' }).find('.semi-carousel-arrow').classes()).not.toContain('semi-carousel-arrow-hover');
  });

  it('showArrow=false hides arrows', () => {
    expect(mountCarousel({ showArrow: false }).find('.semi-carousel-arrow').exists()).toBe(false);
  });

  it('arrowProps customises arrow children and props', async () => {
    const onPrevClick = vi.fn();
    const wrapper = mountCarousel({
      arrowProps: {
        leftArrow: { props: { 'data-role': 'left', onClick: onPrevClick }, children: h('span', { class: 'left-custom' }, 'L') },
        rightArrow: { children: 'R' },
      },
    });
    const prev = wrapper.find('.semi-carousel-arrow-prev');
    expect(prev.attributes('data-role')).toBe('left');
    expect(prev.find('.left-custom').exists()).toBe(true);
    expect(wrapper.find('.semi-carousel-arrow-next').text()).toBe('R');
    expect(prev.attributes('x-semi-prop')).toBe('arrowProps.leftArrow.children');
    await prev.trigger('click');
    expect(onPrevClick).toHaveBeenCalled();
  });

  it('leftArrow / rightArrow slots override arrow icons', () => {
    const wrapper = mount(Carousel, {
      props: { autoPlay: false },
      slots: { default: () => slides(), leftArrow: () => h('i', { class: 'l-slot' }), rightArrow: () => h('i', { class: 'r-slot' }) },
    });
    expect(wrapper.find('.semi-carousel-arrow-prev .l-slot').exists()).toBe(true);
    expect(wrapper.find('.semi-carousel-arrow-next .r-slot').exists()).toBe(true);
  });

  it('clicking arrows moves next/prev with wrap-around, emits change(activeIndex, preIndex)', async () => {
    const wrapper = mountCarousel();
    await wrapper.find('.semi-carousel-arrow-next').trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
    expect(wrapper.emitted('update:activeIndex')![0]).toEqual([1]);
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1]);
    let items = wrapper.findAll('.semi-carousel-content-item');
    expect(items[1].classes()).toContain('semi-carousel-content-item-active');
    expect(items[1].classes()).toContain('semi-carousel-content-item-slide-in');
    expect(items[0].classes()).toContain('semi-carousel-content-item-slide-out');
    expect(wrapper.find('.semi-carousel-content').classes()).not.toContain('semi-carousel-content-reverse');

    await wrapper.find('.semi-carousel-arrow-prev').trigger('click');
    await wrapper.find('.semi-carousel-arrow-prev').trigger('click');
    expect(wrapper.emitted('change')![2]).toEqual([2, 0]);
    items = wrapper.findAll('.semi-carousel-content-item');
    expect(items[2].classes()).toContain('semi-carousel-content-item-active');
    expect(wrapper.find('.semi-carousel-content').classes()).toContain('semi-carousel-content-reverse');
  });

  it('slideDirection=right inverts the reverse class', async () => {
    const wrapper = mountCarousel({ slideDirection: 'right' });
    expect(wrapper.find('.semi-carousel-content').classes()).toContain('semi-carousel-content-reverse');
    await wrapper.find('.semi-carousel-arrow-prev').trigger('click');
    expect(wrapper.find('.semi-carousel-content').classes()).not.toContain('semi-carousel-content-reverse');
  });

  it('trigger=click: indicator click changes slide; hover does not', async () => {
    const wrapper = mountCarousel();
    const items = wrapper.findAll('.semi-carousel-indicator-item');
    await items[2].trigger('mouseenter');
    expect(wrapper.emitted('change')).toBeUndefined();
    await items[2].trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual([2, 0]);
    expect(wrapper.findAll('.semi-carousel-indicator-item')[2].classes()).toContain('semi-carousel-indicator-item-active');
    expect(wrapper.find('.semi-carousel-content').classes()).not.toContain('semi-carousel-content-reverse');
    // going backwards sets reverse
    await wrapper.findAll('.semi-carousel-indicator-item')[0].trigger('click');
    expect(wrapper.find('.semi-carousel-content').classes()).toContain('semi-carousel-content-reverse');
  });

  it('trigger=hover: indicator hover changes slide; click does not', async () => {
    const wrapper = mountCarousel({ trigger: 'hover' });
    const items = wrapper.findAll('.semi-carousel-indicator-item');
    await items[1].trigger('click');
    expect(wrapper.emitted('change')).toBeUndefined();
    await items[1].trigger('mouseenter');
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
  });

  it('clicking the already active indicator emits nothing', async () => {
    const wrapper = mountCarousel();
    await wrapper.findAll('.semi-carousel-indicator-item')[0].trigger('click');
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('exposed goTo / next / prev / play / stop', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel();
    const vm = wrapper.vm as any;
    vm.goTo(2);
    await nextTick();
    expect(wrapper.emitted('change')![0]).toEqual([2, 0]);
    expect(wrapper.findAll('.semi-carousel-content-item')[2].classes()).toContain('semi-carousel-content-item-active');
    vm.next();
    await nextTick();
    expect(wrapper.emitted('change')![1]).toEqual([0, 2]);
    vm.prev();
    await nextTick();
    expect(wrapper.emitted('change')![2]).toEqual([2, 0]);
    // goTo with out of range index wraps
    vm.goTo(4);
    await nextTick();
    expect(wrapper.emitted('change')![3]).toEqual([1, 2]);
    // play() forces auto play even when autoPlay=false
    vm.play();
    await vi.advanceTimersByTimeAsync(2300);
    expect(wrapper.emitted('change')![4]).toEqual([2, 1]);
    vm.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.emitted('change')).toHaveLength(5);
  });

  it('autoPlay=true advances every DEFAULT_INTERVAL + speed', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: true });
    await vi.advanceTimersByTimeAsync(2300);
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
    await vi.advanceTimersByTimeAsync(2300);
    expect(wrapper.emitted('change')![1]).toEqual([2, 1]);
    const onChange = vi.fn();
    const w2 = mountCarousel({ autoPlay: true, onChange });
    await vi.advanceTimersByTimeAsync(2300);
    expect(onChange).toHaveBeenCalledTimes(1);
    w2.unmount();
    await vi.advanceTimersByTimeAsync(5000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('autoPlay object: interval is honoured', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: { interval: 500 }, speed: 100 });
    await vi.advanceTimersByTimeAsync(550);
    expect(wrapper.emitted('change')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(100);
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
  });

  it('autoPlay=false never advances', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: false });
    await vi.advanceTimersByTimeAsync(10000);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('hover pauses autoPlay (debounced 400ms) and resumes on leave', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: true });
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(450);
    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.emitted('change')).toBeUndefined();
    await wrapper.trigger('mouseleave');
    await vi.advanceTimersByTimeAsync(450 + 2300);
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
  });

  it('autoPlay object with hoverToPause=false keeps playing on hover', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: { interval: 500, hoverToPause: false }, speed: 0 });
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(450);
    await vi.advanceTimersByTimeAsync(600);
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
  });

  it('autoPlay object with hoverToPause=true pauses on hover', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ autoPlay: { interval: 500, hoverToPause: true }, speed: 0 });
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(450);
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('controlled activeIndex: emits but does not move until parent updates; no auto play', async () => {
    vi.useFakeTimers();
    const wrapper = mountCarousel({ activeIndex: 0, autoPlay: true });
    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.emitted('change')).toBeUndefined();
    await wrapper.find('.semi-carousel-arrow-next').trigger('click');
    expect(wrapper.emitted('change')![0]).toEqual([1, 0]);
    expect(wrapper.findAll('.semi-carousel-content-item')[0].classes()).toContain('semi-carousel-content-item-active');
    await wrapper.setProps({ activeIndex: 2 });
    expect(wrapper.findAll('.semi-carousel-content-item')[2].classes()).toContain('semi-carousel-content-item-active');
    expect(wrapper.findAll('.semi-carousel-indicator-item')[2].classes()).toContain('semi-carousel-indicator-item-active');
  });

  it('v-model:activeIndex and plain v-model work', async () => {
    const Parent = defineComponent({
      setup() {
        const idx = ref(0);
        return () =>
          h('div', [
            h(Carousel, { autoPlay: false, activeIndex: idx.value, 'onUpdate:activeIndex': (v: number) => (idx.value = v) }, { default: () => slides() }),
            h('span', { id: 'out' }, String(idx.value)),
          ]);
      },
    });
    const wrapper = mount(Parent);
    await wrapper.find('.semi-carousel-arrow-next').trigger('click');
    expect(wrapper.find('#out').text()).toBe('1');
    expect(wrapper.findAll('.semi-carousel-content-item')[1].classes()).toContain('semi-carousel-content-item-active');

    const Parent2 = defineComponent({
      setup() {
        const idx = ref(1);
        return () =>
          h('div', [
            h(Carousel, { autoPlay: false, modelValue: idx.value, 'onUpdate:modelValue': (v: number) => (idx.value = v) }, { default: () => slides() }),
            h('span', { id: 'out' }, String(idx.value)),
          ]);
      },
    });
    const wrapper2 = mount(Parent2);
    expect(wrapper2.findAll('.semi-carousel-content-item')[1].classes()).toContain('semi-carousel-content-item-active');
    await wrapper2.find('.semi-carousel-arrow-prev').trigger('click');
    expect(wrapper2.find('#out').text()).toBe('0');
    expect(wrapper2.findAll('.semi-carousel-content-item')[0].classes()).toContain('semi-carousel-content-item-active');
  });

  it('ignores non-element children (text / comments)', () => {
    const wrapper = mount(Carousel, { props: { autoPlay: false }, slots: { default: () => [h('div', 'a'), null as any, h('div', 'b')] } });
    expect(wrapper.findAll('.semi-carousel-content-item')).toHaveLength(2);
  });

  it('elementType static', () => {
    expect((Carousel as any).elementType).toBe('Carousel');
  });
});

describe('CarouselIndicator', () => {
  it('renders standalone with className/style/data attrs and emits indicatorChange', async () => {
    const wrapper = mount(CarouselIndicator, {
      props: { total: 4, activeIndex: 1, type: 'columnar', position: 'right', size: 'medium', theme: 'primary', className: 'ind', style: { top: '1px' }, 'data-x': 'y' },
    });
    expect(wrapper.classes()).toContain('semi-carousel-indicator');
    expect(wrapper.classes()).toContain('semi-carousel-indicator-columnar');
    expect(wrapper.classes()).toContain('semi-carousel-indicator-right');
    expect(wrapper.classes()).toContain('ind');
    expect(wrapper.attributes('style')).toContain('top: 1px');
    expect(wrapper.attributes('data-x')).toBe('y');
    const items = wrapper.findAll('.semi-carousel-indicator-item');
    expect(items).toHaveLength(4);
    expect(items[1].classes()).toContain('semi-carousel-indicator-item-active');
    expect(items[1].classes()).toContain('semi-carousel-indicator-item-primary');
    expect(items[1].classes()).toContain('semi-carousel-indicator-item-medium');
    await items[3].trigger('click');
    expect(wrapper.emitted('indicatorChange')![0]).toEqual([3]);
  });

  it('trigger=hover emits on mouseenter only', async () => {
    const wrapper = mount(CarouselIndicator, { props: { total: 2, trigger: 'hover' } });
    await wrapper.findAll('.semi-carousel-indicator-item')[1].trigger('click');
    expect(wrapper.emitted('indicatorChange')).toBeUndefined();
    await wrapper.findAll('.semi-carousel-indicator-item')[1].trigger('mouseenter');
    expect(wrapper.emitted('indicatorChange')![0]).toEqual([1]);
  });
});

describe('CarouselArrow', () => {
  it('calls prev/next callbacks', async () => {
    const prev = vi.fn();
    const next = vi.fn();
    const wrapper = mount(CarouselArrow, { props: { prev, next, theme: 'dark', type: 'hover' } });
    expect(wrapper.classes()).toContain('semi-carousel-arrow-dark');
    expect(wrapper.classes()).toContain('semi-carousel-arrow-hover');
    await wrapper.find('.semi-carousel-arrow-prev').trigger('click');
    await wrapper.find('.semi-carousel-arrow-next').trigger('click');
    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
