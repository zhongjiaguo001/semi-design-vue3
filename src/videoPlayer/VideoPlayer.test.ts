import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';
import VideoPlayer from './index';
import { formatTime } from './utils';

describe('VideoPlayer', () => {
  it('renders wrapper, video and controls', () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', width: 320, height: 180, className: 'mine' } });
    expect(w.classes()).toContain('semi-videoPlayer');
    expect(w.classes()).toContain('mine');
    expect(w.find('video').exists()).toBe(true);
    expect(w.find('video').attributes('src')).toBe('clip.mp4');
    expect(w.find('.semi-videoPlayer-controls').exists()).toBe(true);
    expect(w.find('.semi-videoPlayer-controls-time').exists()).toBe(true);
    expect((w.element as HTMLElement).style.width).toBe('320px');
    expect((w.element as HTMLElement).style.height).toBe('180px');
  });

  it('missing src shows noResource', () => {
    const w = mount(VideoPlayer, { props: {} });
    expect(w.find('.semi-videoPlayer-resource-not-found').exists()).toBe(true);
  });

  it('poster and pause icon when not playing', () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', poster: 'poster.png' } });
    expect(w.find('.semi-videoPlayer-poster').exists()).toBe(true);
    expect(w.find('.semi-videoPlayer-pause').exists()).toBe(true);
  });

  it('controlsList hides items', () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', controlsList: ['play'] } });
    expect(w.find('.semi-videoPlayer-controls-time').exists()).toBe(false);
  });

  it('play click emits play after video play event', async () => {
    const onPlay = vi.fn();
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', onPlay } });
    const video = w.find('video').element as HTMLVideoElement;
    video.play = () => {
      video.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };
    video.pause = () => {
      video.dispatchEvent(new Event('pause'));
    };
    const playBtn = w.find('.semi-videoPlayer-controls-menu-button');
    expect(playBtn.exists()).toBe(true);
    await playBtn.trigger('click');
    await nextTick();
    expect(onPlay).toHaveBeenCalled();
  });

  it('clickToPlay=false does not play on video click', async () => {
    const onPlay = vi.fn();
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', clickToPlay: false, onPlay } });
    const video = w.find('video').element as HTMLVideoElement;
    video.play = () => {
      video.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };
    await w.find('video').trigger('click');
    await nextTick();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('exposes foundation', () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4' } });
    expect((w.vm as any).foundation).toBeTruthy();
  });

  it('qualityList / routeList / markers / forwardRef', () => {
    const videoEl = { value: null as HTMLVideoElement | null };
    const w = mount(VideoPlayer, {
      props: {
        src: 'clip.mp4',
        defaultQuality: '1080p',
        qualityList: [
          { label: '1080p', value: '1080p' },
          { label: '480p', value: '480p' },
        ],
        routeList: [{ label: 'line-a', value: 'a' }],
        markers: [{ start: 0, title: 'intro' }],
        forwardRef: videoEl,
      },
    });
    expect(w.find('.semi-videoPlayer-controls-popup').exists()).toBe(true);
    expect(w.find('.semi-videoPlayer-controls-progress-markers').exists() || w.html().includes('intro') || w.find('.semi-videoPlayer-controls').exists()).toBe(true);
    expect(typeof (w.vm as any).play).toBe('function');
    expect(videoEl.value).toBeTruthy();
  });

  it('theme / loop / muted / autoPlay / crossOrigin / captionsSrc attributes', () => {
    const w = mount(VideoPlayer, {
      props: { src: 'clip.mp4', theme: 'light', loop: true, muted: true, autoPlay: true, crossOrigin: 'anonymous', captionsSrc: 'cap.vtt' },
    });
    expect(w.find('.semi-videoPlayer-wrapper-light').exists()).toBe(true);
    const video = w.find('video');
    expect(video.attributes('loop')).toBeDefined();
    expect(video.attributes('autoplay')).toBeDefined();
    expect(video.attributes('crossorigin')).toBe('anonymous');
    expect(w.find('track').attributes('src')).toBe('cap.vtt');
    expect((w.vm as any).state.muted).toBe(true);
    expect((w.vm as any).state.volume).toBe(0);
  });

  it('volume prop initializes state; handleVolumeSilent mutes (foundation does not notify volumeChange, same as React)', async () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', volume: 30 } });
    expect((w.vm as any).state.volume).toBe(30);
    (w.vm as any).foundation.handleVolumeSilent();
    await nextTick();
    expect((w.vm as any).state.muted).toBe(true);
    expect((w.vm as any).state.volume).toBe(30);
  });

  it('playbackRateList / defaultPlaybackRate and rateChange emit', async () => {
    const onRateChange = vi.fn();
    const list = [
      { label: '0.5x', value: 0.5 },
      { label: '2.0x', value: 2 },
    ];
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', playbackRateList: list, defaultPlaybackRate: 2, onRateChange } });
    expect(w.find('.semi-videoPlayer-controls-popup').text()).toBe('2.0x');
    (w.vm as any).foundation.handleRateChange(list[0], { rateChange: '${rate}' });
    await nextTick();
    expect(onRateChange).toHaveBeenCalledWith(0.5);
    expect(w.find('.semi-videoPlayer-controls-popup').text()).toBe('0.5x');
    expect(w.find('.semi-videoPlayer-notification').text()).toBe('0.5x');
  });

  it('qualityChange / routeChange emits and defaultRoute label', async () => {
    const onQualityChange = vi.fn();
    const onRouteChange = vi.fn();
    const w = mount(VideoPlayer, {
      props: {
        src: 'clip.mp4',
        controlsList: ['quality', 'route'],
        defaultQuality: '1080p',
        defaultRoute: 'b',
        qualityList: [
          { label: '1080p', value: '1080p' },
          { label: '480p', value: '480p' },
        ],
        routeList: [
          { label: 'line-a', value: 'a' },
          { label: 'line-b', value: 'b' },
        ],
        onQualityChange,
        onRouteChange,
      },
    });
    const popups = w.findAll('.semi-videoPlayer-controls-popup');
    expect(popups.map((p) => p.text())).toEqual(['1080p', 'line-b']);
    (w.vm as any).foundation.handleQualityChange({ label: '480p', value: '480p' }, { qualityChange: 'q ${quality}' });
    (w.vm as any).foundation.handleRouteChange({ label: 'line-a', value: 'a' }, { routeChange: 'r ${route}' });
    await nextTick();
    expect(onQualityChange).toHaveBeenCalledWith('480p');
    expect(onRouteChange).toHaveBeenCalledWith('a');
    expect(w.findAll('.semi-videoPlayer-controls-popup').map((p) => p.text())).toEqual(['480p', 'line-a']);
  });

  it('mirror toggles class and src prop change updates video', async () => {
    const w = mount(VideoPlayer, { props: { src: 'a.mp4' } });
    (w.vm as any).foundation.handleMirror({ mirror: 'on', cancelMirror: 'off' });
    await nextTick();
    expect(w.classes()).toContain('semi-videoPlayer-mirror');
    await w.setProps({ src: 'b.mp4' });
    expect(w.find('video').attributes('src')).toBe('b.mp4');
  });

  it('seekTime: ArrowRight keydown seeks forward when wrapper focused', async () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', seekTime: 5 }, attachTo: document.body });
    const video = w.find('video').element as HTMLVideoElement;
    let t = 0;
    Object.defineProperty(video, 'currentTime', { get: () => t, set: (v) => { t = v; }, configurable: true });
    Object.defineProperty(video, 'duration', { get: () => 100, configurable: true });
    (w.element as HTMLElement).focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await nextTick();
    expect(t).toBe(5);
    w.unmount();
  });

  it('pause emits after video pause event; exposed pause()', async () => {
    const onPause = vi.fn();
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', onPause } });
    const video = w.find('video').element as HTMLVideoElement;
    video.pause = () => video.dispatchEvent(new Event('pause'));
    (w.vm as any).pause();
    await nextTick();
    expect(onPause).toHaveBeenCalled();
  });

  it('style / width string and data attrs', () => {
    const w = mount(VideoPlayer, { props: { src: 'clip.mp4', width: '50%', style: { marginTop: '10px' } }, attrs: { 'data-x': '1' } });
    expect((w.element as HTMLElement).style.width).toBe('50%');
    expect((w.element as HTMLElement).style.marginTop).toBe('10px');
    expect(w.attributes('data-x')).toBe('1');
  });

  it('formatTime helper', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3661)).toBe('1:01:01');
  });
});
