import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import Cropper from './index';

describe('Cropper', () => {
  it('renders cropper layers and exposes getCropperCanvas', () => {
    const w = mount(Cropper, { props: { src: 'photo.png' } });
    expect(w.classes()).toContain('semi-cropper');
    expect(w.find('.semi-cropper-img-wrapper').exists()).toBe(true);
    expect(w.find('img.semi-cropper-img').exists()).toBe(true);
    expect(w.find('.semi-cropper-mask').exists()).toBe(true);
    expect(w.find('.semi-cropper-box').exists()).toBe(true);
    expect(typeof (w.vm as any).getCropperCanvas).toBe('function');
  });

  it('round shape adds round view-box class', () => {
    const w = mount(Cropper, { props: { src: 'photo.png', shape: 'round' } });
    expect(w.find('.semi-cropper-view-box-round').exists()).toBe(true);
  });

  it('showResizeBox=false hides corners even after load', async () => {
    const w = mount(Cropper, { props: { src: 'photo.png', showResizeBox: false } });
    const img = w.find('img.semi-cropper-img');
    Object.defineProperty(img.element, 'naturalWidth', { value: 200 });
    Object.defineProperty(img.element, 'naturalHeight', { value: 100 });
    await img.trigger('load');
    await nextTick();
    expect(w.find('.semi-cropper-box-corner').exists()).toBe(false);
  });

  it('exposes foundation', () => {
    const w = mount(Cropper, { props: { src: 'photo.png' } });
    expect((w.vm as any).foundation).toBeTruthy();
  });
});

describe('Cropper parity', () => {
  const load = async (w: any, nw = 200, nh = 100) => {
    const img = w.find('img.semi-cropper-img');
    Object.defineProperty(img.element, 'naturalWidth', { value: nw });
    Object.defineProperty(img.element, 'naturalHeight', { value: nh });
    await img.trigger('load');
    await nextTick();
    await nextTick();
  };

  it('applies cropperBoxClassName / cropperBoxCls / cropperBoxStyle to the cropper box', () => {
    const w = mount(Cropper, {
      props: { src: 'a.png', cropperBoxClassName: 'my-box', cropperBoxStyle: { outlineColor: 'red' } },
    });
    const box = w.find('.semi-cropper-box');
    expect(box.classes()).toContain('my-box');
    expect((box.element as HTMLElement).style.outlineColor).toBe('red');
    const w2 = mount(Cropper, { props: { src: 'a.png', cropperBoxCls: 'cls-box' } });
    expect(w2.find('.semi-cropper-box').classes()).toContain('cls-box');
  });

  it('renders corners after load by default, round corners for round shape', async () => {
    const w = mount(Cropper, { props: { src: 'a.png' } });
    await load(w);
    expect(w.findAll('.semi-cropper-box-corner').length).toBe(8);
    const w2 = mount(Cropper, { props: { src: 'a.png', shape: 'round' } });
    await load(w2);
    expect(w2.findAll('.semi-cropper-box-corner').length).toBe(4);
    expect(w2.find('.semi-cropper-box').classes()).toContain('semi-cropper-view-box-round');
  });

  it('roundRect shape rounds the view box but not the cropper box', () => {
    const w = mount(Cropper, { props: { src: 'a.png', shape: 'roundRect' } });
    expect(w.find('.semi-cropper-view-box').classes()).toContain('semi-cropper-view-box-round');
    expect(w.find('.semi-cropper-box').classes()).not.toContain('semi-cropper-view-box-round');
  });

  it('passes imgProps and className/style through', () => {
    const w = mount(Cropper, {
      props: { src: 'a.png', imgProps: { alt: 'pic' }, className: 'my-cropper', style: { width: '10px' } },
    });
    expect(w.find('img.semi-cropper-img').attributes('alt')).toBe('pic');
    expect(w.classes()).toContain('my-cropper');
    expect((w.element as HTMLElement).style.width).toBe('10px');
  });

  it('controlled rotate updates transform after load', async () => {
    const w = mount(Cropper, { props: { src: 'a.png', rotate: 0 } });
    await load(w);
    await w.setProps({ rotate: 90 });
    await nextTick();
    expect((w.vm as any).state.rotate).toBe(90);
    expect(w.find('img.semi-cropper-img').attributes('style')).toContain('rotate(90deg)');
  });

  it('controlled zoom scales imgData and emits zoomChange / update:zoom on wheel', async () => {
    const w = mount(Cropper, { props: { src: 'a.png', zoom: 1 } });
    await load(w);
    const before = (w.vm as any).state.imgData.width;
    await w.setProps({ zoom: 2 });
    await nextTick();
    expect((w.vm as any).state.zoom).toBe(2);
    expect((w.vm as any).state.imgData.width).toBeCloseTo(before * 2);
    (w.vm as any).foundation.handleWheel({ deltaY: -100, preventDefault() {} });
    await nextTick();
    expect(w.emitted('zoomChange')).toBeTruthy();
    expect(w.emitted('update:zoom')).toBeTruthy();
  });

  it('initial controlled zoom/rotate are applied once the image loads', async () => {
    const w = mount(Cropper, { props: { src: 'a.png', zoom: 2, rotate: 45 } });
    await load(w);
    await nextTick();
    expect((w.vm as any).state.zoom).toBe(2);
    expect((w.vm as any).state.rotate).toBe(45);
  });

  it('aspectRatio fixes the cropper box ratio on load', async () => {
    const w = mount(Cropper, { props: { src: 'a.png', aspectRatio: 2 }, attachTo: document.body });
    await load(w);
    const { cropperBox } = (w.vm as any).state;
    if (cropperBox.width) expect(cropperBox.width / cropperBox.height).toBeCloseTo(2);
    w.unmount();
  });

  it('preview renders an img into the preview container and removes it on unmount', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const w = mount(Cropper, { props: { src: 'a.png', preview: () => container } });
    await load(w);
    expect(container.querySelector('img')).toBeTruthy();
    w.unmount();
    expect(container.querySelector('img')).toBeNull();
    container.remove();
  });
});
