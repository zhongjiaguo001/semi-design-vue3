import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Resizable, ResizableHandler, ResizeGroup, ResizeItem, ResizeHandler } from './index';

const mockSize = (el: Element, width: number, height: number) => {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
};
const mockRect = (el: Element, x = 0, y = 0, width = 200, height = 100) => {
  (el as any).getBoundingClientRect = () => ({ x, y, left: x, top: y, width, height, right: x + width, bottom: y + height, toJSON() {} });
};

const mouse = (type: string, x: number, y: number) => new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
const fire = (type: string, x: number, y: number) => window.dispatchEvent(mouse(type, x, y));

describe('Resizable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the resizable container with 8 handlers, children, class/style attrs', () => {
    const wrapper = mount(Resizable, { props: { className: 'a', class: 'b', style: { color: 'red' } }, slots: { default: () => h('i', { class: 'child' }, 'x') } });
    expect(wrapper.classes()).toContain('semi-resizable-resizable');
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.find('.child').exists()).toBe(true);
    const handlers = wrapper.findAll('.semi-resizable-resizableHandler');
    expect(handlers).toHaveLength(8);
    ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'].forEach((d, i) => {
      expect(handlers[i].classes()).toContain(`semi-resizable-resizableHandler-${d}`);
    });
  });

  it('enable=false renders no handlers; a partial enable map disables the others', () => {
    expect(mount(Resizable, { props: { enable: false } }).findAll('.semi-resizable-resizableHandler')).toHaveLength(0);
    const wrapper = mount(Resizable, {
      props: { enable: { right: true, top: false, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false } },
    });
    expect(wrapper.findAll('.semi-resizable-resizableHandler')).toHaveLength(1);
    expect(wrapper.find('.semi-resizable-resizableHandler').classes()).toContain('semi-resizable-resizableHandler-right');
  });

  it('handleStyle / handleClass / handleNode per direction + handleWrapperStyle/Class', () => {
    const wrapper = mount(Resizable, {
      props: {
        handleStyle: { right: { top: '1px' } },
        handleClass: { right: 'hc' },
        handleNode: { right: h('i', { class: 'hn' }, 'H') },
        handleWrapperStyle: { position: 'relative' },
        handleWrapperClass: 'hwc',
        enable: { right: true },
      },
    });
    const handler = wrapper.find('.semi-resizable-resizableHandler-right');
    expect(handler.attributes('style')).toContain('top: 1px');
    expect(handler.classes()).toContain('hc');
    expect(handler.find('.hn').text()).toBe('H');
    const wrapperEl = handler.element.parentElement!;
    expect(wrapperEl.classList.contains('hwc')).toBe(true);
    expect(wrapperEl.getAttribute('style')).toContain('position: relative');
  });

  it('dragging the right handler resizes width with events: resizeStart / change / resizeEnd', async () => {
    const wrapper = mount(Resizable, { props: { minWidth: 50, maxWidth: 300 } });
    const el = wrapper.find('.semi-resizable-resizable').element;
    mockSize(el, 100, 50);
    mockRect(el, 0, 0, 100, 50);
    await wrapper.find('.semi-resizable-resizableHandler-right').trigger('mousedown', { clientX: 100, clientY: 25 });
    expect(wrapper.emitted('resizeStart')).toHaveLength(1);
    expect(wrapper.emitted('resizeStart')![0][1]).toBe('right');
    // background overlay while resizing
    expect(wrapper.find('.semi-resizable-background').exists()).toBe(true);
    fire('mousemove', 150, 25);
    await nextTick();
    expect(wrapper.emitted('change')![0][0]).toEqual({ width: 150, height: 'auto' });
    expect(wrapper.emitted('change')![0][2]).toBe('right');
    expect(wrapper.find('.semi-resizable-resizable').attributes('style')).toContain('width: 150px');
    fire('mousemove', 500, 25);
    await nextTick();
    expect((wrapper.emitted('change')![1][0] as any).width).toBe(300); // clamped to maxWidth
    mockSize(el, 300, 50);
    fire('mouseup', 500, 25);
    await nextTick();
    expect(wrapper.emitted('resizeEnd')![0][0]).toEqual({ width: 300, height: 50 });
    expect(wrapper.find('.semi-resizable-background').exists()).toBe(false);
    fire('mousemove', 200, 25);
    await nextTick();
    expect(wrapper.emitted('change')).toHaveLength(2);
  });

  it('left handler grows leftwards; top/bottom resize height; ratio scales the delta', async () => {
    const wrapper = mount(Resizable, { props: { ratio: 2, enable: { left: true, bottom: true } } });
    const el = wrapper.find('.semi-resizable-resizable').element;
    mockSize(el, 100, 50);
    mockRect(el, 0, 0, 100, 50);
    await wrapper.find('.semi-resizable-resizableHandler-left').trigger('mousedown', { clientX: 100, clientY: 25 });
    fire('mousemove', 50, 25);
    await nextTick();
    expect((wrapper.emitted('change')![0][0] as any).width).toBe(200); // delta 50 * ratio 2
    fire('mouseup', 50, 25);
    await wrapper.find('.semi-resizable-resizableHandler-bottom').trigger('mousedown', { clientX: 50, clientY: 50 });
    fire('mousemove', 50, 100);
    await nextTick();
    expect((wrapper.emitted('change')![1][0] as any).height).toBe(150); // delta 50 * ratio 2
    fire('mouseup', 50, 100);
  });

  it('grid snaps the size; snap arrays snap to the closest value', async () => {
    const wrapper = mount(Resizable, { props: { grid: [10, 10], enable: { right: true } } });
    const el = wrapper.find('.semi-resizable-resizable').element;
    mockSize(el, 100, 50);
    mockRect(el, 0, 0, 100, 50);
    await wrapper.find('.semi-resizable-resizableHandler-right').trigger('mousedown', { clientX: 100, clientY: 25 });
    fire('mousemove', 153, 25);
    await nextTick();
    expect((wrapper.emitted('change')![0][0] as any).width).toBe(150); // 153 -> 150
    fire('mouseup', 153, 25);

    const snapped = mount(Resizable, { props: { snap: { x: [100, 200] }, enable: { right: true } } });
    const el2 = snapped.find('.semi-resizable-resizable').element;
    mockSize(el2, 100, 50);
    mockRect(el2, 0, 0, 100, 50);
    await snapped.find('.semi-resizable-resizableHandler-right').trigger('mousedown', { clientX: 100, clientY: 25 });
    fire('mousemove', 190, 25);
    await nextTick();
    expect((snapped.emitted('change')![0][0] as any).width).toBe(200);
    fire('mouseup', 190, 25);
  });

  it('lockAspectRatio keeps height in proportion when resizing right', async () => {
    const wrapper = mount(Resizable, { props: { lockAspectRatio: 2, enable: { right: true }, minHeight: 10 } });
    const el = wrapper.find('.semi-resizable-resizable').element;
    mockSize(el, 100, 50);
    mockRect(el, 0, 0, 100, 50);
    await wrapper.find('.semi-resizable-resizableHandler-right').trigger('mousedown', { clientX: 100, clientY: 25 });
    fire('mousemove', 200, 25);
    await nextTick();
    const size = wrapper.emitted('change')![0][0] as any;
    expect(size.width).toBe(200);
    expect(size.height).toBeCloseTo(100, 0);
    fire('mouseup', 200, 25);
  });

  it('controlled size: state follows the size prop; defaultSize sets the initial size', async () => {
    const wrapper = mount(Resizable, { props: { size: { width: 120, height: 60 } } });
    expect(wrapper.find('.semi-resizable-resizable').attributes('style')).toContain('width: 120px');
    expect(wrapper.find('.semi-resizable-resizable').attributes('style')).toContain('height: 60px');
    await wrapper.setProps({ size: { width: 150, height: 60 } });
    expect(wrapper.find('.semi-resizable-resizable').attributes('style')).toContain('width: 150px');
    const def = mount(Resizable, { props: { defaultSize: { width: 88, height: 44 } } });
    expect(def.find('.semi-resizable-resizable').attributes('style')).toContain('width: 88px');
    expect(def.find('.semi-resizable-resizable').attributes('style')).toContain('height: 44px');
  });

  it('onResizeStart returning false cancels resizing', async () => {
    const onResizeStart = vi.fn(() => false);
    const wrapper = mount(Resizable, { props: { enable: { right: true }, onResizeStart } });
    const el = wrapper.find('.semi-resizable-resizable').element;
    mockSize(el, 100, 50);
    mockRect(el, 0, 0, 100, 50);
    await wrapper.find('.semi-resizable-resizableHandler-right').trigger('mousedown', { clientX: 100, clientY: 25 });
    fire('mousemove', 150, 25);
    await nextTick();
    expect(onResizeStart).toHaveBeenCalled();
    expect(wrapper.emitted('change')).toBeUndefined();
    fire('mouseup', 150, 25);
  });

  it('standalone ResizableHandler registers mousedown/touchstart and forwards onResizeStart', async () => {
    const onResizeStart = vi.fn();
    const wrapper = mount(ResizableHandler, { props: { direction: 'left', onResizeStart: (e: any, d: string, t: string) => onResizeStart(d, t) } });
    expect(wrapper.classes()).toContain('semi-resizable-resizableHandler-left');
    await wrapper.trigger('mousedown', { clientX: 5 });
    expect(onResizeStart).toHaveBeenCalledWith('left', 'mouse');
    await wrapper.trigger('touchstart', { targetTouches: [{ clientX: 5 }] });
    expect(onResizeStart).toHaveBeenLastCalledWith('left', 'touch');
    wrapper.unmount();
    await wrapper.trigger('mousedown');
    expect(onResizeStart).toHaveBeenCalledTimes(2);
  });
});

describe('ResizeGroup / ResizeItem / ResizeHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mountGroup = (props: Record<string, any> = {}, itemProps: any[] = [{}, {}]) =>
    mount(ResizeGroup, {
      attachTo: document.body,
      props,
      slots: {
        default: () => [
          h(ResizeItem, itemProps[0], { default: () => h('span', { class: 'i0' }, 'A') }),
          h(ResizeHandler),
          h(ResizeItem, itemProps[1], { default: () => h('span', { class: 'i1' }, 'B') }),
        ],
      },
    });

  const layout = (wrapper: any, { width = 400, itemW = 200, handlerW = 4 } = {}) => {
    const group = wrapper.find('.semi-resizable-group').element;
    mockSize(group, width, 100);
    const items = wrapper.findAll('.semi-resizable-item');
    items.forEach((i) => mockSize(i.element, itemW, 100));
    const handler = wrapper.find('.semi-resizable-handler').element;
    mockSize(handler, handlerW, 100);
    return { group, items, handler };
  };

  it('renders group with flexDirection row, items and handler with default icon', () => {
    const wrapper = mountGroup();
    expect(wrapper.classes()).toContain('semi-resizable-group');
    expect(wrapper.find('.semi-resizable-group').attributes('style')).toContain('flex-direction: row');
    expect(wrapper.findAll('.semi-resizable-item')).toHaveLength(2);
    const handler = wrapper.find('.semi-resizable-handler');
    expect(handler.exists()).toBe(true);
    expect(handler.classes()).toContain('semi-resizable-handler-horizontal');
    expect(handler.find('.semi-icon-handle').exists()).toBe(true);
  });

  it('direction=vertical: column layout, rotated icon, vertical handler class', () => {
    const wrapper = mountGroup({ direction: 'vertical' });
    expect(wrapper.find('.semi-resizable-group').attributes('style')).toContain('flex-direction: column');
    expect(wrapper.find('.semi-resizable-handler').classes()).toContain('semi-resizable-handler-vertical');
    expect(wrapper.find('.semi-icon-handle').attributes('style')).toContain('rotate: 90deg');
  });

  it('initSpace distributes defaultSize: px and number proportions', async () => {
    const wrapper = mountGroup({}, [{ defaultSize: '25%' }, {}]);
    layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    const items = wrapper.findAll('.semi-resizable-item');
    // 25% of 400 = 100 - 2 (handler/2) => calc(25% - 2px); the rest (75%) for the undefined item
    expect((items[0].element as HTMLElement).style.width).toBe('calc(25% - 2px)');
    expect((items[1].element as HTMLElement).style.width).toBe('calc(75% - 2px)');
  });

  it('dragging the handler resizes both items and fires item callbacks', async () => {
    const onChange0 = vi.fn();
    const onChange1 = vi.fn();
    const wrapper = mountGroup({}, [{ onChange: onChange0 }, { onChange: onChange1 }]);
    const { items } = layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    await wrapper.find('.semi-resizable-handler').trigger('mousedown', { clientX: 200, clientY: 50 });
    expect(wrapper.find('.semi-resizable-background').exists()).toBe(true);
    fire('mousemove', 250, 50);
    await nextTick();
    expect(onChange0).toHaveBeenCalled();
    expect(onChange0.mock.calls[0][2]).toBe('right');
    expect(onChange1.mock.calls[0][2]).toBe('left');
    expect((items[0].element as HTMLElement).style.width).toBe('calc(63% - 2px)');
    expect((items[1].element as HTMLElement).style.width).toBe('calc(37% - 2px)');
    fire('mouseup', 250, 50);
    await nextTick();
    expect(wrapper.find('.semi-resizable-background').exists()).toBe(false);
    fire('mousemove', 300, 50);
    await nextTick();
    expect(onChange0).toHaveBeenCalledTimes(1);
  });

  it('min/max constraints adjust the sizes', async () => {
    const wrapper = mountGroup({}, [{ min: '100px', max: '300px' }, { min: '100px' }]);
    const { items } = layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    await wrapper.find('.semi-resizable-handler').trigger('mousedown', { clientX: 200, clientY: 50 });
    fire('mousemove', 450, 50); // would make item0 > 300px
    await nextTick();
    expect((items[0].element as HTMLElement).style.width).toBe('calc(75% - 2px)'); // clamped to 300px
    expect((items[1].element as HTMLElement).style.width).toBe('calc(25% - 2px)');
    fire('mouseup', 450, 50);
  });

  it('onResizeStart / onResizeEnd item callbacks receive directions and sizes', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const wrapper = mountGroup({}, [{ onResizeStart: onStart, onResizeEnd: onEnd }, { onResizeStart: onStart, onResizeEnd: onEnd }]);
    layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    await wrapper.find('.semi-resizable-handler').trigger('mousedown', { clientX: 200, clientY: 50 });
    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onStart.mock.calls[0][1]).toBe('right');
    expect(onStart.mock.calls[1][1]).toBe('left');
    fire('mousemove', 220, 50);
    fire('mouseup', 220, 50);
    await nextTick();
    expect(onEnd).toHaveBeenCalledTimes(2);
    expect(onEnd.mock.calls[0][0].width).toBeGreaterThan(0);
  });

  it('handler children slot overrides the default icon; className/style forwarded', () => {
    const wrapper = mount(ResizeGroup, {
      props: { className: 'g', style: { gap: '4px' } },
      slots: {
        default: () => [
          h(ResizeItem, { className: 'i', style: { color: 'red' } }, { default: () => 'A' }),
          h(ResizeHandler, { className: 'h', style: { width: '8px' } }, { default: () => h('i', { class: 'custom-handle' }, '||') }),
          h(ResizeItem, null, { default: () => 'B' }),
        ],
      },
    });
    expect(wrapper.classes()).toContain('g');
    expect(wrapper.attributes('style')).toContain('gap: 4px');
    expect(wrapper.find('.semi-resizable-item').classes()).toContain('i');
    expect(wrapper.find('.semi-resizable-item').attributes('style')).toContain('color: red');
    const handler = wrapper.find('.semi-resizable-handler');
    expect(handler.classes()).toContain('h');
    expect(handler.attributes('style')).toContain('width: 8px');
    expect(handler.find('.custom-handle').exists()).toBe(true);
    expect(handler.find('.semi-icon-handle').exists()).toBe(false);
  });

  it('dynamic direction switch updates context and item styles', async () => {
    const wrapper = mountGroup({ direction: 'horizontal' });
    layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    await wrapper.setProps({ direction: 'vertical' });
    await nextTick();
    expect(wrapper.find('.semi-resizable-handler').classes()).toContain('semi-resizable-handler-vertical');
    // items swap width/height styles
    const items = wrapper.findAll('.semi-resizable-item');
    expect((items[0].element as HTMLElement).style.height).toBe('calc(50% - 2px)');
    expect((items[0].element as HTMLElement).style.width).toBe('');
  });

  it('unmount removes the window resize listener and drag listeners', async () => {
    const wrapper = mountGroup();
    layout(wrapper);
    await nextTick();
    (wrapper.vm as any).foundation.init();
    await nextTick();
    await wrapper.find('.semi-resizable-handler').trigger('mousedown', { clientX: 200, clientY: 50 });
    wrapper.unmount();
    fire('mousemove', 300, 50);
    await nextTick();
    expect(wrapper.emitted()).toEqual({});
  });

  it('statics', () => {
    expect((Resizable as any).elementType).toBe('Resizable');
    expect((ResizeGroup as any).elementType).toBe('ResizeGroup');
    expect((ResizeItem as any).elementType).toBe('ResizeItem');
  });
});
