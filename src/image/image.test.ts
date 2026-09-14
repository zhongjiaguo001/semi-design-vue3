import { mount, flushPromises } from '@vue/test-utils';
import { h, nextTick, ref, defineComponent } from 'vue';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Image, Preview, PreviewInner, PreviewFooter, PreviewHeader, PreviewImage } from './index';
import { LocaleProvider } from '../locale';
import en_US from '../locale/source/en_US';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wait = async (ms = 20) => {
  await sleep(ms);
  await flushPromises();
  await nextTick();
};

const SRC = 'https://example.com/a.png';
const SRC2 = 'https://example.com/b.png';
const SRC3 = 'https://example.com/c.png';

const loadImg = async (wrapper: any) => {
  await wrapper.find('img.semi-image-img').trigger('load');
  await nextTick();
};

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

describe('Image', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders wrapper + img with src/alt/width/height and skeleton while loading', () => {
    const wrapper = mount(Image, { props: { src: SRC, alt: 'pic', width: 200, height: '100px' } });
    expect(wrapper.classes()).toContain('semi-image');
    expect(wrapper.attributes('style')).toContain('width: 200px');
    expect(wrapper.attributes('style')).toContain('height: 100px');
    const img = wrapper.find('img.semi-image-img');
    expect(img.attributes('src')).toBe(SRC);
    expect(img.attributes('data-src')).toBe(SRC);
    expect(img.attributes('alt')).toBe('pic');
    expect(img.attributes('width')).toBe('200');
    expect(img.attributes('height')).toBe('100px');
    expect(img.classes()).not.toContain('semi-image-img-preview');
    expect(wrapper.find('.semi-image-overlay').exists()).toBe(true);
    expect(wrapper.find('.semi-skeleton-image').exists()).toBe(true);
  });

  it('className / class / style / imgCls / imgStyle / crossOrigin / extra attrs', () => {
    const wrapper = mount(Image, {
      props: { src: SRC, className: 'a', class: 'b', style: { color: 'red' }, imgCls: 'ic', imgStyle: { opacity: 0.5 }, crossOrigin: 'anonymous', 'data-x': '1' },
    });
    expect(wrapper.classes()).toContain('a');
    expect(wrapper.classes()).toContain('b');
    expect(wrapper.attributes('style')).toContain('color: red');
    const img = wrapper.find('img');
    expect(img.classes()).toContain('ic');
    expect(img.attributes('style')).toContain('opacity: 0.5');
    expect(img.attributes('crossorigin')).toBe('anonymous');
    expect(img.attributes('data-x')).toBe('1');
  });

  it('load: emits load, removes overlay, adds preview cursor class', async () => {
    const wrapper = mount(Image, { props: { src: SRC } });
    await loadImg(wrapper);
    expect(wrapper.emitted('load')).toHaveLength(1);
    expect(wrapper.find('.semi-image-overlay').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('semi-image-img-preview');
  });

  it('preview=false: no preview cursor and clicking does nothing', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC, preview: false } });
    await loadImg(wrapper);
    expect(wrapper.find('img').classes()).not.toContain('semi-image-img-preview');
    await wrapper.trigger('click');
    await wait();
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(q('.semi-image-preview')).toBeNull();
    wrapper.unmount();
  });

  it('error: emits error, shows default error icon, error class', async () => {
    const wrapper = mount(Image, { props: { src: SRC } });
    await wrapper.find('img').trigger('error');
    expect(wrapper.emitted('error')).toHaveLength(1);
    expect(wrapper.find('img').classes()).toContain('semi-image-img-error');
    expect(wrapper.find('.semi-image-status .semi-icon-upload_error').exists()).toBe(true);
  });

  it('fallback string renders fallback img; fallback node / slot rendered as-is', async () => {
    const wrapper = mount(Image, { props: { src: SRC, fallback: 'fb.png' } });
    await wrapper.find('img.semi-image-img').trigger('error');
    const fb = wrapper.find('.semi-image-status img');
    expect(fb.attributes('src')).toBe('fb.png');
    expect(fb.attributes('alt')).toBe('fallback');

    const wrapper2 = mount(Image, { props: { src: SRC, fallback: h('i', { class: 'fb-node' }) } });
    await wrapper2.find('img.semi-image-img').trigger('error');
    expect(wrapper2.find('.semi-image-status .fb-node').exists()).toBe(true);

    const wrapper3 = mount(Image, { props: { src: SRC }, slots: { fallback: () => h('i', { class: 'fb-slot' }) } });
    await wrapper3.find('img.semi-image-img').trigger('error');
    expect(wrapper3.find('.semi-image-status .fb-slot').exists()).toBe(true);
  });

  it('placeholder prop / slot replaces the skeleton', () => {
    const wrapper = mount(Image, { props: { src: SRC, placeholder: h('i', { class: 'ph' }) } });
    expect(wrapper.find('.semi-image-status .ph').exists()).toBe(true);
    expect(wrapper.find('.semi-skeleton-image').exists()).toBe(false);
    const wrapper2 = mount(Image, { props: { src: SRC }, slots: { placeholder: () => 'loading...' } });
    expect(wrapper2.find('.semi-image-status').text()).toBe('loading...');
  });

  it('src change resets to loading', async () => {
    const wrapper = mount(Image, { props: { src: SRC } });
    await loadImg(wrapper);
    expect(wrapper.find('.semi-image-overlay').exists()).toBe(false);
    await wrapper.setProps({ src: SRC2 });
    expect(wrapper.find('.semi-image-overlay').exists()).toBe(true);
    expect(wrapper.find('img').attributes('src')).toBe(SRC2);
  });

  it('click opens preview in a portal, emits previewVisibleChange; close icon closes and emits close', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    expect(wrapper.emitted('previewVisibleChange')![0]).toEqual([true]);
    const portal = q('.semi-portal');
    expect(portal).toBeTruthy();
    const preview = q('.semi-image-preview')!;
    expect(preview).toBeTruthy();
    expect(preview.querySelector('.semi-image-preview-header')).toBeTruthy();
    expect(preview.querySelector('.semi-image-preview-footer')).toBeTruthy();
    expect(preview.querySelector('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC);
    // single image: no prev/next arrows
    expect(preview.querySelector('.semi-image-preview-prev')).toBeNull();
    expect(preview.querySelector('.semi-image-preview-next')).toBeNull();
    expect(preview.querySelector('.semi-image-preview-footer-page')!.textContent).toBe('1/1');
    expect(document.body.style.overflow).toBe('hidden');

    q('.semi-image-preview-header-close')!.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('previewVisibleChange')![1]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(q('.semi-image-preview')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
  });

  it('preview object: src override, previewCls/previewStyle, visible controlled + onVisibleChange callback', async () => {
    const onVisibleChange = vi.fn();
    const wrapper = mount(Image, {
      attachTo: document.body,
      props: { src: SRC, preview: { src: SRC2, previewCls: 'pc', previewStyle: { color: 'red' }, visible: false, onVisibleChange, closable: false } },
    });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('previewVisibleChange')![0]).toEqual([true]);
    // controlled: stays hidden
    expect(q('.semi-image-preview')).toBeNull();
    await wrapper.setProps({ preview: { src: SRC2, previewCls: 'pc', previewStyle: { color: 'red' }, visible: true, onVisibleChange, closable: false } });
    await wait();
    const preview = q('.semi-image-preview')!;
    expect(preview).toBeTruthy();
    expect(preview.classList.contains('pc')).toBe(true);
    expect(preview.style.color).toBe('red');
    expect(preview.querySelector('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC2);
    expect(preview.querySelector('.semi-image-preview-header-close')).toBeNull();
    wrapper.unmount();
  });

  it('maskClosable: mouseup on mask closes; maskClosable=false does not; moved mouse does not close', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const preview = q('.semi-image-preview')!;
    preview.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    preview.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 50, clientY: 10 }));
    await wait();
    expect(q('.semi-image-preview')).toBeTruthy();
    preview.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    preview.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 12, clientY: 11 }));
    await wait();
    expect(q('.semi-image-preview')).toBeNull();
    wrapper.unmount();

    const wrapper2 = mount(Image, { attachTo: document.body, props: { src: SRC, preview: { maskClosable: false } } });
    await loadImg(wrapper2);
    await wrapper2.trigger('click');
    await wait();
    const preview2 = q('.semi-image-preview')!;
    preview2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    preview2.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 10, clientY: 10 }));
    await wait();
    expect(q('.semi-image-preview')).toBeTruthy();
    wrapper2.unmount();
  });

  it('closeOnEsc: Escape closes and emits close; closeOnEsc=false ignores', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape' } as any));
    await wait();
    expect(q('.semi-image-preview')).toBeNull();
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();

    const wrapper2 = mount(Image, { attachTo: document.body, props: { src: SRC, preview: { closeOnEsc: false } } });
    await loadImg(wrapper2);
    await wrapper2.trigger('click');
    await wait();
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape' } as any));
    await wait();
    expect(q('.semi-image-preview')).toBeTruthy();
    wrapper2.unmount();
  });

  it('footer: zoom in/out, ratio, rotate, download emit and update state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC, preview: { zoomStep: 0.2 } } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const footer = q('.semi-image-preview-footer')!;
    expect(footer.classList.contains('semi-image-preview-footer-content')).toBe(true);
    // initial zoom 0.1 => minus disabled
    expect(footer.querySelector('.semi-icon-minus')!.classList.contains('semi-image-preview-footer-disabled')).toBe(true);
    (footer.querySelector('.semi-icon-plus') as HTMLElement).click();
    await wait();
    expect(wrapper.emitted('zoomIn')![0]).toEqual([0.3]);
    expect((footer.querySelector('input[type=range]') as HTMLInputElement).value).toBe('30');
    (footer.querySelector('.semi-icon-minus') as HTMLElement).click();
    await wait();
    expect(wrapper.emitted('zoomOut')![0]).toEqual([0.1]);
    // ratio toggle
    expect(footer.querySelector('.semi-icon-real_size_stroked')).toBeTruthy();
    (footer.querySelector('.semi-icon-real_size_stroked') as HTMLElement).click();
    await wait();
    expect(wrapper.emitted('ratioChange')![0]).toEqual(['realSize']);
    expect(footer.querySelector('.semi-icon-window_adaption_stroked')).toBeTruthy();
    // rotate
    (footer.querySelector('.semi-icon-rotate') as HTMLElement).click();
    await wait();
    expect(wrapper.emitted('rotateLeft')![0]).toEqual([-90]);
    expect((q('.semi-image-preview-image img') as HTMLElement).style.transform).toContain('rotate(-90deg)');
    // download
    (footer.querySelector('.semi-icon-download') as HTMLElement).click();
    await wait();
    expect(wrapper.emitted('download')![0]).toEqual([SRC, 0]);
    expect(fetchMock).toHaveBeenCalledWith(SRC);
    expect(wrapper.emitted('downloadError')![0]).toEqual([SRC]);
    vi.unstubAllGlobals();
    wrapper.unmount();
  });

  it('disableDownload disables download icon and blocks context menu', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC, preview: { disableDownload: true } } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const dl = q('.semi-image-preview-footer .semi-icon-download')!;
    expect(dl.classList.contains('semi-image-preview-footer-disabled')).toBe(true);
    dl.click();
    await wait();
    expect(wrapper.emitted('download')).toBeUndefined();
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    q('.semi-image-preview-image img')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it('wheel zooms the image', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const preview = q('.semi-image-preview')!;
    preview.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    await wait();
    expect(wrapper.emitted('zoomIn')![0]).toEqual([0.2]);
    preview.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
    await wait();
    expect(wrapper.emitted('zoomOut')![0]).toEqual([0.1]);
    wrapper.unmount();
  });

  it('showTooltip wraps footer icons in tooltip triggers; custom tips are used', async () => {
    const wrapper = mount(Image, { attachTo: document.body, props: { src: SRC, preview: { showTooltip: true, zoomInTip: 'ZI' } } });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const wrappers = qa('.semi-image-preview-footer .semi-image-tooltip-children-wrapper');
    expect(wrappers.length).toBe(7);
    const plusWrapper = q('.semi-image-preview-footer .semi-icon-plus')!.parentElement!;
    expect(plusWrapper.classList.contains('semi-image-tooltip-children-wrapper')).toBe(true);
    plusWrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await sleep(120);
    await flushPromises();
    await nextTick();
    expect(qa('.semi-tooltip-content').some((n) => n.textContent === 'ZI')).toBe(true);
    wrapper.unmount();
  });

  it('renderHeader / header slot, renderPreviewMenu / previewMenu slot, renderCloseIcon, zIndex, getPopupContainer', async () => {
    const container = document.createElement('div');
    container.id = 'pc';
    document.body.appendChild(container);
    const renderPreviewMenu = vi.fn((p: any) => h('div', { class: 'custom-menu' }, [`${p.curPage}/${p.totalNum}`, ...p.menuItems]));
    const wrapper = mount(Image, {
      attachTo: document.body,
      props: {
        src: SRC,
        preview: {
          renderHeader: () => h('b', { class: 'hdr' }, 'H'),
          renderPreviewMenu,
          renderCloseIcon: () => h('i', { class: 'my-close' }),
          zIndex: 2000,
          getPopupContainer: () => container,
        },
      },
    });
    await loadImg(wrapper);
    await wrapper.trigger('click');
    await wait();
    const preview = container.querySelector('.semi-image-preview') as HTMLElement;
    expect(preview).toBeTruthy();
    expect(preview.classList.contains('semi-image-preview-popup')).toBe(true);
    expect(preview.querySelector('.semi-image-preview-header-title .hdr')!.textContent).toBe('H');
    expect(preview.querySelector('.semi-image-preview-header-close .my-close')).toBeTruthy();
    expect(preview.querySelector('.custom-menu')).toBeTruthy();
    expect(preview.querySelector('.semi-image-preview-footer')!.classList.contains('semi-image-preview-footer-content')).toBe(false);
    expect(renderPreviewMenu.mock.calls[0][0]).toMatchObject({ curPage: 1, totalNum: 1, disabledPrev: true, disabledNext: true, ratio: 'adaptation' });
    expect(typeof renderPreviewMenu.mock.calls[0][0].onZoomIn).toBe('function');
    const portal = container.querySelector('.semi-portal') as HTMLElement;
    expect(portal.style.zIndex).toBe('2000');
    expect(portal.style.position).toBe('static');
    // getPopupContainer: body scroll not locked
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();

    const wrapper2 = mount(Image, {
      attachTo: document.body,
      props: { src: SRC },
      slots: { header: () => h('b', { class: 'hdr-slot' }), previewMenu: (p: any) => h('div', { class: 'menu-slot' }, String(p.totalNum)), closeIcon: () => h('i', { class: 'close-slot' }) },
    });
    await loadImg(wrapper2);
    await wrapper2.trigger('click');
    await wait();
    expect(q('.semi-image-preview .hdr-slot')).toBeTruthy();
    expect(q('.semi-image-preview .menu-slot')!.textContent).toBe('1');
    expect(q('.semi-image-preview .close-slot')).toBeTruthy();
    wrapper2.unmount();
  });

  it('locale: footer tips use LocaleProvider (en_US)', async () => {
    const wrapper = mount(LocaleProvider, {
      attachTo: document.body,
      props: { locale: en_US as any },
      slots: { default: () => h(Image, { src: SRC, preview: { showTooltip: true } }) },
    });
    await loadImg(wrapper);
    await wrapper.find('.semi-image').trigger('click');
    await wait();
    const rotate = q('.semi-image-preview-footer .semi-icon-rotate')!.parentElement!;
    rotate.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await sleep(120);
    await flushPromises();
    await nextTick();
    expect(qa('.semi-tooltip-content').some((n) => n.textContent === en_US.Image.rotateTip)).toBe(true);
    wrapper.unmount();
  });

  it('exposes renderMask with locale text and isSemiImage static', () => {
    const wrapper = mount(Image, { props: { src: SRC } });
    const mask = (wrapper.vm as any).renderMask();
    expect(mask).toBeTruthy();
    expect((Image as any).isSemiImage).toBe(true);
    expect((Image as any).Preview).toBe(Preview);
  });
});

describe('PreviewInner', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mountInner = (props: Record<string, any> = {}) => mount(PreviewInner, { attachTo: document.body, props: { src: [SRC, SRC2, SRC3], visible: true, ...props } });

  it('renders nothing when hidden; renders arrows + page for multiple images', async () => {
    const hidden = mount(PreviewInner, { attachTo: document.body, props: { src: [SRC], visible: false } });
    await wait();
    expect(q('.semi-image-preview')).toBeNull();
    hidden.unmount();

    const wrapper = mountInner();
    await wait();
    expect(q('.semi-image-preview')).toBeTruthy();
    expect(q('.semi-image-preview-prev')).toBeNull(); // index 0, not infinite
    expect(q('.semi-image-preview-next')).toBeTruthy();
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('1/3');
    expect(q('.semi-image-preview-footer .semi-icon-chevron_left')!.classList.contains('semi-image-preview-footer-disabled')).toBe(true);
    wrapper.unmount();
  });

  it('next/prev switch images and emit change/next/prev; ends are clamped without infinite', async () => {
    const wrapper = mountInner();
    await wait();
    q('.semi-image-preview-next')!.click();
    await wait();
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    expect(wrapper.emitted('next')![0]).toEqual([1]);
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC2);
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('2/3');
    expect(q('.semi-image-preview-prev')).toBeTruthy();
    q('.semi-image-preview-footer .semi-icon-chevron_right')!.click();
    await wait();
    expect(wrapper.emitted('change')![1]).toEqual([2]);
    expect(q('.semi-image-preview-next')).toBeNull();
    q('.semi-image-preview-footer .semi-icon-chevron_left')!.click();
    await wait();
    expect(wrapper.emitted('prev')![0]).toEqual([1]);
    wrapper.unmount();
  });

  it('infinite wraps around and always shows both arrows', async () => {
    const wrapper = mountInner({ infinite: true });
    await wait();
    expect(q('.semi-image-preview-prev')).toBeTruthy();
    q('.semi-image-preview-prev')!.click();
    await wait();
    expect(wrapper.emitted('change')![0]).toEqual([2]);
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('3/3');
    q('.semi-image-preview-next')!.click();
    await wait();
    expect(wrapper.emitted('change')![1]).toEqual([0]);
    wrapper.unmount();
  });

  it('controlled currentIndex: emits but does not move until prop changes', async () => {
    const wrapper = mountInner({ currentIndex: 0 });
    await wait();
    q('.semi-image-preview-next')!.click();
    await wait();
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('1/3');
    await wrapper.setProps({ currentIndex: 2 });
    await wait();
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('3/3');
    wrapper.unmount();
  });

  it('renderLeftIcon / renderRightIcon (fn and node) and slots', async () => {
    const wrapper = mountInner({ currentIndex: 1, renderLeftIcon: (i: number) => h('i', { class: 'li' }, String(i)), renderRightIcon: h('i', { class: 'ri' }) });
    await wait();
    expect(q('.semi-image-preview-prev .li')!.textContent).toBe('1');
    expect(q('.semi-image-preview-next .ri')).toBeTruthy();
    wrapper.unmount();
    const wrapper2 = mount(PreviewInner, {
      attachTo: document.body,
      props: { src: [SRC, SRC2], visible: true, currentIndex: 1 },
      slots: { leftIcon: (i: number) => h('i', { class: 'li-slot' }, String(i)) },
    });
    await wait();
    expect(q('.semi-image-preview-prev .li-slot')!.textContent).toBe('1');
    wrapper2.unmount();
  });

  it('viewer auto hides after viewerVisibleDelay and mouse move shows it again', async () => {
    vi.useFakeTimers();
    const wrapper = mountInner({ viewerVisibleDelay: 100 });
    await nextTick();
    await vi.advanceTimersByTimeAsync(150);
    await nextTick();
    expect(q('.semi-image-preview-header')!.classList.contains('semi-image-preview-hide')).toBe(true);
    expect(q('.semi-image-preview-footer')!.classList.contains('semi-image-preview-hide')).toBe(true);
    q('.semi-image-preview')!.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(60);
    await nextTick();
    expect(q('.semi-image-preview-header')!.classList.contains('semi-image-preview-hide')).toBe(false);
    vi.useRealTimers();
    wrapper.unmount();
  });

  it('visible toggle locks/unlocks body scroll and registers keydown listener', async () => {
    const wrapper = mount(PreviewInner, { attachTo: document.body, props: { src: SRC, visible: false } });
    await wait();
    expect(document.body.style.overflow).toBe('');
    await wrapper.setProps({ visible: true });
    await wait();
    expect(document.body.style.overflow).toBe('hidden');
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27 } as any));
    expect(wrapper.emitted('visibleChange')![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
    await wrapper.setProps({ visible: false });
    await wait();
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
  });

  it('exposed handlers work', async () => {
    const wrapper = mountInner();
    await wait();
    const vm = wrapper.vm as any;
    vm.handleSwitchImage('next');
    await wait();
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    vm.handleZoomImage(0.5);
    await wait();
    expect(wrapper.emitted('zoomIn')![0]).toEqual([0.5]);
    vm.handleZoomImage(9);
    await wait();
    expect(wrapper.emitted('zoomIn')![1]).toEqual([5]); // clamped to maxZoom
    vm.handleRotateImage('right');
    expect(wrapper.emitted('rotateLeft')![0]).toEqual([90]);
    vm.handleAdjustRatio('realSize');
    expect(wrapper.emitted('ratioChange')![0]).toEqual(['realSize']);
    wrapper.unmount();
  });

  it('image load computes adaptation zoom from the container', async () => {
    const wrapper = mountInner({ src: [SRC] });
    await wait();
    const container = q('.semi-image-preview-image')!;
    Object.defineProperty(container, 'clientWidth', { configurable: true, get: () => 1080 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, get: () => 580 });
    (wrapper.findComponent(PreviewImage).vm as any).foundation.init();
    const img = q('.semi-image-preview-image img') as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { configurable: true, get: () => 2000 });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, get: () => 1000 });
    expect(img.style.visibility).toBe('hidden');
    expect(q('.semi-image-preview-image-spin')).toBeTruthy();
    img.dispatchEvent(new Event('load'));
    await wait();
    expect(img.style.visibility).toBe('visible');
    expect(q('.semi-image-preview-image-spin')).toBeNull();
    // adaptation zoom = min(1000/2000, 500/1000) = 0.5 (load does not notify)
    expect(img.style.width).toBe('1000px');
    expect(img.style.height).toBe('500px');
    expect((q('.semi-image-preview-footer input[type=range]') as HTMLInputElement).value).toBe('50');
    expect(wrapper.emitted('zoomIn')).toBeUndefined();
    wrapper.unmount();
  });
});

describe('Preview (group)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mountGroup = (props: Record<string, any> = {}, extra: any[] = []) =>
    mount(Preview, {
      attachTo: document.body,
      props: { lazyLoad: false, ...props },
      slots: {
        default: () => [
          h(Image, { src: SRC, preview: { previewTitle: 'first' } }),
          h('div', { class: 'nested' }, [h(Image, { src: SRC2 })]),
          h(Image, { src: SRC3, preview: false }),
          ...extra,
        ],
      },
    });

  it('renders group wrapper, assigns imageID to previewable images and collects srcs', async () => {
    const wrapper = mountGroup({ className: 'grp', class: 'g2', style: { color: 'red' } });
    const group = wrapper.find('.semi-image-preview-group');
    expect(group.exists()).toBe(true);
    expect(group.classes()).toContain('grp');
    expect(group.classes()).toContain('g2');
    expect(group.attributes('id')).toMatch(/^semi-image-preview-group/);
    expect(group.attributes('style')).toContain('color: red');
    const imgs = wrapper.findAllComponents(Image);
    expect(imgs).toHaveLength(3);
    expect(imgs[0].props('imageID')).toBe(0);
    expect(imgs[1].props('imageID')).toBe(1);
    expect(imgs[2].props('imageID')).toBeUndefined();
    wrapper.unmount();
  });

  it('clicking a grouped image opens the group preview at its index with titles; navigation works', async () => {
    const wrapper = mountGroup();
    const imgs = wrapper.findAll('.semi-image');
    await imgs[1].find('img').trigger('load');
    await imgs[1].trigger('click');
    await wait();
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    expect(wrapper.emitted('update:visible')![0]).toEqual([true]);
    expect(wrapper.emitted('change')![0]).toEqual([1]);
    expect(wrapper.emitted('update:currentIndex')![0]).toEqual([1]);
    // the image itself must not open its own preview (only one portal)
    expect(qa('.semi-image-preview')).toHaveLength(1);
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC2);
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('2/2');
    q('.semi-image-preview-prev')!.click();
    await wait();
    expect(wrapper.emitted('change')![1]).toEqual([0]);
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC);
    expect(q('.semi-image-preview-header-title')!.textContent).toBe('first');
    q('.semi-image-preview-header-close')!.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await wait();
    expect(wrapper.emitted('visibleChange')![1]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(q('.semi-image-preview')).toBeNull();
    wrapper.unmount();
  });

  it('src prop (string / array) is prepended to the list', async () => {
    const wrapper = mountGroup({ src: ['x.png', 'y.png'], visible: true, currentIndex: 0 });
    await wait();
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('1/4');
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe('x.png');
    wrapper.unmount();
    const wrapper2 = mountGroup({ src: 'z.png', visible: true, currentIndex: 2 });
    await wait();
    expect(q('.semi-image-preview-footer-page')!.textContent).toBe('3/3');
    wrapper2.unmount();
  });

  it('controlled visible / currentIndex and defaultVisible / defaultCurrentIndex', async () => {
    const wrapper = mountGroup({ visible: false, currentIndex: 1 });
    const imgs = wrapper.findAll('.semi-image');
    await imgs[0].trigger('click');
    await wait();
    expect(wrapper.emitted('visibleChange')![0]).toEqual([true]);
    expect(wrapper.emitted('change')![0]).toEqual([0]);
    expect(q('.semi-image-preview')).toBeNull();
    await wrapper.setProps({ visible: true });
    await wait();
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC2);
    wrapper.unmount();

    const wrapper2 = mountGroup({ defaultVisible: true, defaultCurrentIndex: 1 });
    await wait();
    expect(q('.semi-image-preview-image img')!.getAttribute('src')).toBe(SRC2);
    wrapper2.unmount();
  });

  it('v-model:visible works', async () => {
    const Parent = defineComponent({
      setup() {
        const visible = ref(false);
        return () =>
          h('div', [
            h(Preview, { lazyLoad: false, visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v) }, { default: () => [h(Image, { src: SRC }), h(Image, { src: SRC2 })] }),
            h('span', { id: 'out' }, String(visible.value)),
          ]);
      },
    });
    const wrapper = mount(Parent, { attachTo: document.body });
    await wrapper.findAll('.semi-image')[0].trigger('click');
    await wait();
    expect(wrapper.find('#out').text()).toBe('true');
    expect(q('.semi-image-preview')).toBeTruthy();
    wrapper.unmount();
  });

  it('previewCls / previewStyle / forwarded preview props / setDownloadName', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const setDownloadName = vi.fn(() => 'custom.png');
    const wrapper = mountGroup({ visible: true, previewCls: 'pcls', previewStyle: { color: 'blue' }, infinite: true, closable: false, setDownloadName });
    await wait();
    const preview = q('.semi-image-preview')!;
    expect(preview.classList.contains('pcls')).toBe(true);
    expect(preview.style.color).toBe('blue');
    expect(preview.querySelector('.semi-image-preview-header-close')).toBeNull();
    expect(preview.querySelector('.semi-image-preview-prev')).toBeTruthy();
    (preview.querySelector('.semi-icon-download') as HTMLElement).click();
    await wait();
    expect(setDownloadName).toHaveBeenCalledWith(SRC);
    expect(wrapper.emitted('download')![0]).toEqual([SRC, 0]);
    vi.unstubAllGlobals();
    wrapper.unmount();
  });

  it('lazyLoad: images in group have no src until intersecting', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let cb: any;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(c: any, public options: any) {
          cb = c;
        }
        observe = observe;
        unobserve() {}
        disconnect = disconnect;
      }
    );
    const wrapper = mount(Preview, {
      attachTo: document.body,
      props: { lazyLoad: true, lazyLoadMargin: '10px' },
      slots: { default: () => [h(Image, { src: SRC })] },
    });
    await wait();
    const img = wrapper.find('img.semi-image-img');
    expect(img.attributes('src')).toBeUndefined();
    expect(img.attributes('data-src')).toBe(SRC);
    expect(observe).toHaveBeenCalledWith(img.element);
    cb([{ target: img.element, isIntersecting: true }]);
    expect(img.attributes('src')).toBe(SRC);
    expect(img.attributes('data-src')).toBeUndefined();
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('PreviewHeader / PreviewFooter / PreviewImage standalone', () => {
  it('PreviewHeader: title, closable, custom close icon, onClose', async () => {
    const onClose = vi.fn();
    const wrapper = mount(PreviewHeader, { props: { onClose, renderHeader: (t: any) => `T:${t ?? ''}`, titleStyle: { color: 'red' } } });
    expect(wrapper.classes()).toContain('semi-image-preview-header');
    expect(wrapper.find('.semi-image-preview-header-title').text()).toBe('T:');
    expect(wrapper.find('.semi-image-preview-header-title').attributes('style')).toContain('color: red');
    expect(wrapper.find('.semi-image-preview-header-close .semi-icon-close').exists()).toBe(true);
    await wrapper.find('.semi-image-preview-header-close').trigger('mouseup');
    expect(onClose).toHaveBeenCalled();
    const noClose = mount(PreviewHeader, { props: { closable: false } });
    expect(noClose.find('.semi-image-preview-header-close').exists()).toBe(false);
    const custom = mount(PreviewHeader, { props: { renderCloseIcon: h('i', { class: 'ci' }) } });
    expect(custom.find('.semi-image-preview-header-close .ci').exists()).toBe(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(PreviewHeader, { props: { renderCloseIcon: () => 'text' } });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('PreviewFooter: slider change / plus / minus / ratio / rotate / prev / next / download callbacks', async () => {
    const cbs = { onZoomIn: vi.fn(), onZoomOut: vi.fn(), onPrev: vi.fn(), onNext: vi.fn(), onAdjustRatio: vi.fn(), onRotate: vi.fn(), onDownload: vi.fn() };
    const wrapper = mount(PreviewFooter, { props: { curPage: 2, totalNum: 3, zoom: 100, min: 10, max: 500, step: 10, ...cbs } });
    expect(wrapper.classes()).toContain('semi-image-preview-footer-wrapper');
    expect(wrapper.find('.semi-image-preview-footer-page').text()).toBe('2/3');
    expect(wrapper.findAll('.semi-divider')).toHaveLength(2);
    await wrapper.find('.semi-icon-plus').trigger('click');
    expect(cbs.onZoomIn).toHaveBeenCalledWith(1.1);
    await wrapper.find('.semi-icon-minus').trigger('click');
    expect(cbs.onZoomOut).toHaveBeenCalledWith(0.9);
    await wrapper.find('.semi-icon-chevron_left').trigger('click');
    await wrapper.find('.semi-icon-chevron_right').trigger('click');
    expect(cbs.onPrev).toHaveBeenCalled();
    expect(cbs.onNext).toHaveBeenCalled();
    await wrapper.find('.semi-icon-real_size_stroked').trigger('click');
    expect(cbs.onAdjustRatio).toHaveBeenCalledWith('realSize');
    await wrapper.find('.semi-icon-rotate').trigger('click');
    expect(cbs.onRotate).toHaveBeenCalledWith('left');
    await wrapper.find('.semi-icon-download').trigger('click');
    expect(cbs.onDownload).toHaveBeenCalled();
    const range = wrapper.find('input[type=range]');
    await range.setValue('300');
    expect(cbs.onZoomIn).toHaveBeenLastCalledWith(3);
    // disabled states
    const disabled = mount(PreviewFooter, { props: { zoom: 500, max: 500, disabledPrev: true, disabledNext: true, disableDownload: true, ...cbs } });
    expect(disabled.find('.semi-icon-plus').classes()).toContain('semi-image-preview-footer-disabled');
    expect(disabled.find('.semi-icon-chevron_left').classes()).toContain('semi-image-preview-footer-disabled');
    expect(disabled.find('.semi-icon-download').classes()).toContain('semi-image-preview-footer-disabled');
    // ratio=realSize shows the adaption icon
    const rs = mount(PreviewFooter, { props: { ratio: 'realSize', ...cbs } });
    expect(rs.find('.semi-icon-window_adaption_stroked').exists()).toBe(true);
    await rs.find('.semi-icon-window_adaption_stroked').trigger('click');
    expect(cbs.onAdjustRatio).toHaveBeenLastCalledWith('adaptation');
  });

  it('PreviewImage: load/error callbacks, drag moves image when larger than container', async () => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    const onZoom = vi.fn();
    const wrapper = mount(PreviewImage, { attachTo: document.body, props: { src: SRC, zoom: 1, rotation: 0, ratio: 'adaptation', onLoad, onError, onZoom, maxZoom: 5, minZoom: 0.1 } });
    expect(wrapper.classes()).toContain('semi-image-preview-image');
    const container = wrapper.element as HTMLElement;
    Object.defineProperty(container, 'clientWidth', { configurable: true, get: () => 200 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, get: () => 200 });
    window.dispatchEvent(new Event('resize'));
    const img = wrapper.find('img').element as HTMLImageElement;
    Object.defineProperty(img, 'naturalWidth', { configurable: true, get: () => 400 });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, get: () => 400 });
    await wrapper.find('img').trigger('load');
    expect(onLoad).toHaveBeenCalledWith(SRC);
    // adaptation zoom = 120/400 = 0.3 -> notify onZoom(0.3, false)
    expect(onZoom).toHaveBeenCalledWith(0.3, false);
    // simulate the parent applying the adaptation zoom, then zoom 2 => 800px image, draggable
    (wrapper.vm as any).foundation.changeZoom(0.3);
    (wrapper.vm as any).foundation.changeZoom(2);
    await nextTick();
    expect(img.style.width).toBe('800px');
    expect(img.style.cursor).toBe('grab');
    await wrapper.find('img').trigger('mousedown', { clientX: 100, clientY: 100 });
    await wrapper.find('img').trigger('mousemove', { clientX: 150, clientY: 120, buttons: 1 });
    expect(img.style.transform).toContain('translate(50px, 20px)');
    await wrapper.find('img').trigger('error');
    expect(onError).toHaveBeenCalledWith(SRC);
    wrapper.unmount();
  });
});
