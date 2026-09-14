import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DragMove } from './index';

const mockSize = (el: Element, width: number, height: number) => {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetLeft', { configurable: true, get: () => 0 });
  Object.defineProperty(el, 'offsetTop', { configurable: true, get: () => 0 });
  Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => null });
};

const doc = (type: string, x: number, y: number, target?: EventTarget) => {
  const ev = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  if (target) Object.defineProperty(ev, 'target', { get: () => target });
  return ev;
};

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

describe('DragMove', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the child, sets cursor move and absolute position on the element', () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      slots: { default: () => h('div', { class: 'box' }, 'drag me') },
    });
    const box = wrapper.find('.box');
    expect(box.exists()).toBe(true);
    expect(box.text()).toBe('drag me');
    expect((box.element as HTMLElement).style.cursor).toBe('move');
    expect((box.element as HTMLElement).style.position).toBe('absolute');
    wrapper.unmount();
  });

  it('positionStrategy=relative keeps the element position relative', () => {
    const wrapper = mount(DragMove, { attachTo: document.body, props: { positionStrategy: 'relative' }, slots: { default: () => h('div', { class: 'box' }) } });
    expect((wrapper.find('.box').element as HTMLElement).style.position).toBe('relative');
    wrapper.unmount();
  });

  it('dragging moves the element and emits mouseDown/mouseMove/mouseUp', async () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    box.dispatchEvent(doc('mousedown', 20, 30, box));
    expect(wrapper.emitted('mouseDown')).toHaveLength(1);
    document.dispatchEvent(doc('mousemove', 120, 130));
    await nextFrame();
    expect(wrapper.emitted('mouseMove')).toHaveLength(1);
    expect(box.style.left).toBe('100px');
    expect(box.style.top).toBe('100px');
    document.dispatchEvent(doc('mouseup', 120, 130));
    expect(wrapper.emitted('mouseUp')).toHaveLength(1);
    document.dispatchEvent(doc('mousemove', 200, 200));
    await nextFrame();
    expect(wrapper.emitted('mouseMove')).toHaveLength(1);
    expect(box.style.left).toBe('100px');
    wrapper.unmount();
  });

  it('customMove receives the element and computed position', async () => {
    const customMove = vi.fn();
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { customMove },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    box.dispatchEvent(doc('mousedown', 10, 10, box));
    document.dispatchEvent(doc('mousemove', 60, 40));
    await nextFrame();
    expect(customMove).toHaveBeenCalledWith(box, 30, 50);
    expect(box.style.left).toBe('');
    wrapper.unmount();
  });

  it('allowMove=false prevents dragging but still emits mouseDown', async () => {
    const allowMove = vi.fn(() => false);
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { allowMove },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    box.dispatchEvent(doc('mousedown', 10, 10, box));
    expect(allowMove).toHaveBeenCalled();
    expect(wrapper.emitted('mouseDown')).toHaveLength(1);
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box.style.left).toBe('');
    wrapper.unmount();
  });

  it('allowInputDrag=false: mousedown on input does not start a drag; true allows it', async () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      slots: { default: () => h('div', { class: 'box' }, [h('input', { class: 'inner' })]) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    const input = wrapper.find('input.inner').element;
    box.dispatchEvent(doc('mousedown', 10, 10, input));
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box.style.left).toBe('');
    expect(wrapper.emitted('mouseMove')).toBeUndefined();
    wrapper.unmount();

    const allowed = mount(DragMove, {
      attachTo: document.body,
      props: { allowInputDrag: true },
      slots: { default: () => h('div', { class: 'box2' }, [h('input', { class: 'inner' })]) },
    });
    const box2 = allowed.find('.box2').element as HTMLElement;
    mockSize(box2, 100, 50);
    const input2 = allowed.find('input.inner').element;
    box2.dispatchEvent(doc('mousedown', 10, 10, input2));
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box2.style.left).toBe('90px');
    allowed.unmount();
  });

  it('constrainer=parent clamps the movement within the parent', async () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { constrainer: 'parent' },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    const parent = box.parentElement!;
    mockSize(box, 50, 50);
    mockSize(parent, 100, 100);
    box.dispatchEvent(doc('mousedown', 0, 0, box));
    document.dispatchEvent(doc('mousemove', 500, 500));
    await nextFrame();
    // xMax = parent.offsetWidth - element.offsetWidth = 50
    expect(box.style.left).toBe('50px');
    expect(box.style.top).toBe('50px');
    wrapper.unmount();
  });

  it('constrainer as function uses the returned element', async () => {
    const constrainEl = document.createElement('div');
    constrainEl.className = 'constrainer';
    document.body.appendChild(constrainEl);
    mockSize(constrainEl, 60, 60);
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { constrainer: () => constrainEl },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 10, 10);
    box.dispatchEvent(doc('mousedown', 0, 0, box));
    document.dispatchEvent(doc('mousemove', 500, 500));
    await nextFrame();
    expect(box.style.left).toBe('50px');
    expect(box.style.top).toBe('50px');
    wrapper.unmount();
  });

  it('handler prop: drag starts only from the handler element', async () => {
    const handlerEl = document.createElement('div');
    handlerEl.className = 'handle';
    document.body.appendChild(handlerEl);
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { handler: () => handlerEl },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    expect(handlerEl.style.cursor).toBe('move');
    // mousedown on the element itself does not start dragging
    box.dispatchEvent(doc('mousedown', 10, 10, box));
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box.style.left).toBe('');
    // mousedown on the handler does
    handlerEl.dispatchEvent(doc('mousedown', 10, 10, handlerEl));
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box.style.left).toBe('90px');
    wrapper.unmount();
    handlerEl.remove();
  });

  it('touch events drive dragging and emit touch callbacks', async () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    const touch = (x: number, y: number) => ({ clientX: x, clientY: y });
    const startEv = new Event('touchstart', { bubbles: true, cancelable: true }) as any;
    startEv.targetTouches = [touch(10, 10)];
    box.dispatchEvent(startEv);
    expect(wrapper.emitted('touchStart')).toHaveLength(1);
    const moveEv = new Event('touchmove', { bubbles: true }) as any;
    moveEv.targetTouches = [touch(60, 40)];
    document.dispatchEvent(moveEv);
    await nextFrame();
    expect(wrapper.emitted('touchMove')).toHaveLength(1);
    expect(box.style.left).toBe('50px');
    expect(box.style.top).toBe('30px');
    document.dispatchEvent(new Event('touchend', { bubbles: true }));
    expect(wrapper.emitted('touchEnd')).toHaveLength(1);
    // a new drag session cancelled with touchcancel
    box.dispatchEvent(startEv);
    document.dispatchEvent(new Event('touchcancel', { bubbles: true }));
    expect(wrapper.emitted('touchCancel')).toHaveLength(1);
    wrapper.unmount();
  });

  it('positionStrategy switch updates the element position live', async () => {
    const wrapper = mount(DragMove, {
      attachTo: document.body,
      props: { positionStrategy: 'absolute' },
      slots: { default: () => h('div', { class: 'box' }) },
    });
    const box = wrapper.find('.box').element as HTMLElement;
    expect(box.style.position).toBe('absolute');
    await wrapper.setProps({ positionStrategy: 'relative' });
    await nextTick();
    expect(box.style.position).toBe('relative');
    wrapper.unmount();
  });

  it('unmount removes all listeners', async () => {
    const wrapper = mount(DragMove, { attachTo: document.body, slots: { default: () => h('div', { class: 'box' }) } });
    const box = wrapper.find('.box').element as HTMLElement;
    mockSize(box, 100, 50);
    box.dispatchEvent(doc('mousedown', 10, 10, box));
    wrapper.unmount();
    document.dispatchEvent(doc('mousemove', 100, 100));
    await nextFrame();
    expect(box.style.left).toBe('');
  });

  it('throws when there is no drag element', () => {
    expect(() => mount(DragMove)).toThrow();
  });

  it('statics', () => {
    expect((DragMove as any).__SemiComponentName__).toBe('DragMove');
    expect((DragMove as any).elementType).toBe('DragMove');
  });
});

describe('DragMove child ref forwarding', () => {
  it('keeps the ref set on the child element (like React forwarding the original ref)', async () => {
    const { ref: vueRef, defineComponent: dc } = await import('vue');
    const childRef = vueRef<HTMLElement | null>(null);
    const Comp = dc({
      setup() {
        return () => h(DragMove, null, { default: () => h('div', { class: 'box', ref: childRef }, 'drag me') });
      },
    });
    const wrapper = mount(Comp, { attachTo: document.body });
    await nextTick();
    expect(childRef.value).toBe(wrapper.find('.box').element);
    expect((childRef.value as HTMLElement).style.cursor).toBe('move');
    wrapper.unmount();
  });

  it('exposes the foundation and elementRef', () => {
    const wrapper = mount(DragMove, { attachTo: document.body, slots: { default: () => h('div', { class: 'box' }) } });
    expect((wrapper.vm as any).foundation).toBeTruthy();
    expect((wrapper.vm as any).elementRef).toBe(wrapper.find('.box').element);
    wrapper.unmount();
  });
});
