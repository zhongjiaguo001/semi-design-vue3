import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { nextTick, h } from 'vue';

const loadAnimation = vi.fn(() => ({ destroy: vi.fn(), play: vi.fn() }));
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: (...args: any[]) => (loadAnimation as any)(...args),
  },
}));

import Lottie from './index';
import lottieWeb from 'lottie-web';

describe('Lottie', () => {
  it('renders a container with width/height and class', () => {
    const w = mount(Lottie, { props: { width: '80px', height: '80px', className: 'mine' } });
    expect(w.classes()).toContain('semi-lottie');
    expect(w.classes()).toContain('mine');
    expect((w.element as HTMLElement).style.width).toBe('80px');
    expect((w.element as HTMLElement).style.height).toBe('80px');
  });

  it('returns null when params.container is provided', () => {
    const host = document.createElement('div');
    const w = mount(Lottie, { props: { params: { container: host } } });
    expect(w.find('.semi-lottie').exists()).toBe(false);
  });

  it('exposes getLottie static and instance helpers', () => {
    expect(typeof (Lottie as any).getLottie).toBe('function');
    const w = mount(Lottie, { props: { params: { animationData: { layers: [] } } } });
    expect(typeof (w.vm as any).getLottie).toBe('function');
  });

  it('calls lottie.loadAnimation with container + defaults merged with params', () => {
    loadAnimation.mockClear();
    const w = mount(Lottie, { props: { params: { path: 'a.json', loop: false } } });
    expect(loadAnimation).toHaveBeenCalledTimes(1);
    const arg: any = (loadAnimation.mock.calls[0] as any)[0];
    expect(arg.container).toBe(w.element);
    expect(arg.renderer).toBe('svg');
    expect(arg.autoplay).toBe(true);
    expect(arg.loop).toBe(false);
    expect(arg.path).toBe('a.json');
  });

  it('uses params.container as the load container when provided', () => {
    loadAnimation.mockClear();
    const host = document.createElement('div');
    mount(Lottie, { props: { params: { container: host, path: 'a.json' } } });
    const arg: any = (loadAnimation.mock.calls[0] as any)[0];
    expect(arg.container).toBe(host);
  });

  it('invokes getAnimationInstance / getLottie props and emits the same events', () => {
    const getAnimationInstance = vi.fn();
    const getLottie = vi.fn();
    const w = mount(Lottie, { props: { params: { path: 'a.json' }, getAnimationInstance, getLottie } });
    expect(getAnimationInstance).toHaveBeenCalledTimes(1);
    expect(typeof getAnimationInstance.mock.calls[0][0].destroy).toBe('function');
    expect(getLottie).toHaveBeenCalledWith(lottieWeb);
    expect(w.emitted('getAnimationInstance')?.length).toBe(1);
    expect(w.emitted('getLottie')?.[0][0]).toBe(lottieWeb);
    expect((Lottie as any).getLottie()).toBe(lottieWeb);
    expect((w.vm as any).getLottie()).toBe(lottieWeb);
    expect((w.vm as any).getAnimationInstance()).toBe(getAnimationInstance.mock.calls[0][0]);
  });

  it('re-creates the animation when params change and destroys it on unmount', async () => {
    loadAnimation.mockClear();
    const getAnimationInstance = vi.fn();
    const w = mount(Lottie, { props: { params: { path: 'a.json' }, getAnimationInstance } });
    const first: any = getAnimationInstance.mock.calls[0][0];
    await w.setProps({ params: { path: 'b.json' } });
    await nextTick();
    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(loadAnimation).toHaveBeenCalledTimes(2);
    expect(getAnimationInstance).toHaveBeenCalledTimes(2);
    expect(w.emitted('getAnimationInstance')?.length).toBe(2);
    const second: any = getAnimationInstance.mock.calls[1][0];
    w.unmount();
    expect(second.destroy).toHaveBeenCalledTimes(1);
  });

  it('merges style prop (object or string), class and data-* attrs', () => {
    const w = mount(Lottie, {
      props: { style: { background: 'red' } },
      attrs: { class: 'extra', 'data-foo': 'bar' },
    });
    expect(w.classes()).toContain('extra');
    expect((w.element as HTMLElement).style.background).toBe('red');
    expect(w.attributes('data-foo')).toBe('bar');
    const w2 = mount({ render: () => h(Lottie, { style: 'margin-top: 4px', width: '10px' }) });
    expect((w2.element as HTMLElement).style.marginTop).toBe('4px');
    expect((w2.element as HTMLElement).style.width).toBe('10px');
  });
});
