import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, it, expect } from 'vitest';
import AudioPlayer from './index';
import { formatTime } from './utils';

describe('AudioPlayer', () => {
  it('renders player chrome, audio element and toolbar', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'track.mp3', className: 'mine' } });
    expect(w.classes()).toContain('semi-audio-player');
    expect(w.classes()).toContain('mine');
    expect(w.classes()).toContain('semi-audio-player-dark');
    expect(w.find('audio').exists()).toBe(true);
    expect(w.find('audio').attributes('src')).toBe('track.mp3');
    expect(w.find('.semi-audio-player-control').exists()).toBe(true);
    expect(w.find('.semi-audio-player-info').exists()).toBe(true);
    expect(w.find('.semi-audio-player-slider').exists() || w.find('.semi-audio-player-slider-wrapper').exists()).toBe(true);
  });

  it('theme=light and showToolbar=false', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3', theme: 'light', showToolbar: false } });
    expect(w.classes()).toContain('semi-audio-player-light');
    expect(w.find('.semi-audio-player-control-speed').exists()).toBe(false);
  });

  it('object audioUrl shows title and cover', () => {
    const w = mount(AudioPlayer, {
      props: { audioUrl: { src: 'a.mp3', title: 'Song Title', cover: 'cover.png' } },
    });
    expect(w.find('.semi-audio-player-info-title').text()).toContain('Song Title');
    expect(w.find('img').exists() || w.find('.semi-image').exists()).toBe(true);
  });

  it('array audioUrl renders prev/next controls', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: ['a.mp3', 'b.mp3'] } });
    expect(w.findAll('.semi-audio-player-control-button-icon').length).toBeGreaterThan(0);
  });

  it('exposes foundation and play click toggles state', async () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3' } });
    expect((w.vm as any).foundation).toBeTruthy();
    const audio = w.find('audio').element as HTMLAudioElement;
    audio.play = () => Promise.resolve();
    audio.pause = () => undefined;
    await w.find('.semi-audio-player-control-button-play').trigger('click');
    await nextTick();
    expect((w.vm as any).state.isPlaying).toBe(true);
  });

  it('formatTime helper', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(NaN)).toBe('0:00');
  });
});

describe('AudioPlayer parity extras', () => {
  const mountPlayer = (props: any) => {
    const w = mount(AudioPlayer, { props });
    const audio = w.find('audio').element as HTMLAudioElement;
    audio.play = () => Promise.resolve();
    audio.pause = () => undefined;
    audio.load = () => undefined;
    return { w, audio };
  };

  it('defaults: autoPlay=false, showToolbar=true, skipDuration=10, theme=dark', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3' } });
    expect((w.props() as any).autoPlay).toBe(false);
    expect((w.props() as any).showToolbar).toBe(true);
    expect((w.props() as any).skipDuration).toBe(10);
    expect((w.props() as any).theme).toBe('dark');
    expect(w.find('.semi-audio-player-control-speed').exists()).toBe(true);
    expect(w.find('audio').attributes('autoplay')).toBeUndefined();
  });

  it('autoPlay sets the audio autoplay attribute', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3', autoPlay: true } });
    expect(w.find('audio').attributes('autoplay')).toBeDefined();
  });

  it('style prop and data attrs are applied to the root', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3', style: { width: '300px' } }, attrs: { 'data-foo': 'bar' } });
    expect((w.element as HTMLElement).style.width).toBe('300px');
    expect(w.attributes('data-foo')).toBe('bar');
  });

  it('handleSeek respects skipDuration and clamps within duration', () => {
    const { w, audio } = mountPlayer({ audioUrl: 'a.mp3', skipDuration: 15 });
    Object.defineProperty(audio, 'duration', { configurable: true, get: () => 100 });
    audio.currentTime = 20;
    (w.vm as any).foundation.handleSeek(1);
    expect(audio.currentTime).toBe(35);
    (w.vm as any).foundation.handleSeek(-1);
    (w.vm as any).foundation.handleSeek(-1);
    (w.vm as any).foundation.handleSeek(-1);
    expect(audio.currentTime).toBe(0);
  });

  it('handleSpeedChange updates playbackRate and label', async () => {
    const { w, audio } = mountPlayer({ audioUrl: 'a.mp3' });
    (w.vm as any).foundation.handleSpeedChange({ label: '2.0x', value: 2 });
    await nextTick();
    expect(audio.playbackRate).toBe(2);
    expect(w.find('.semi-audio-player-control-speed').text()).toBe('2.0x');
  });

  it('handleTimeChange / handleRefresh update currentTime', async () => {
    const { w, audio } = mountPlayer({ audioUrl: 'a.mp3' });
    (w.vm as any).foundation.handleTimeChange(65);
    await nextTick();
    expect((w.vm as any).state.currentTime).toBe(65);
    expect(w.find('.semi-audio-player-info-time span').text()).toBe('1:05');
    (w.vm as any).foundation.handleRefresh();
    await nextTick();
    expect((w.vm as any).state.currentTime).toBe(0);
    expect(audio.currentTime).toBe(0);
  });

  it('handleVolumeChange floors the value and sets audio volume', () => {
    const { w, audio } = mountPlayer({ audioUrl: 'a.mp3' });
    (w.vm as any).foundation.handleVolumeChange(42.7);
    expect((w.vm as any).state.volume).toBe(42);
    expect(audio.volume).toBeCloseTo(0.42);
  });

  it('track change cycles through the array and resets state', async () => {
    const { w } = mountPlayer({ audioUrl: [{ src: 'a.mp3', title: 'A' }, { src: 'b.mp3', title: 'B' }] });
    expect(w.find('.semi-audio-player-info-title').text()).toContain('A');
    (w.vm as any).foundation.handleTrackChange('next');
    await nextTick();
    expect((w.vm as any).state.currentIndex).toBe(1);
    expect(w.find('audio').attributes('src')).toBe('b.mp3');
    expect(w.find('.semi-audio-player-info-title').text()).toContain('B');
    (w.vm as any).foundation.handleTrackChange('next');
    await nextTick();
    expect((w.vm as any).state.currentIndex).toBe(0);
    (w.vm as any).foundation.handleTrackChange('prev');
    await nextTick();
    expect((w.vm as any).state.currentIndex).toBe(1);
  });

  it('ended event advances to the next track for arrays and stops for single', async () => {
    const { w, audio } = mountPlayer({ audioUrl: ['a.mp3', 'b.mp3'] });
    audio.dispatchEvent(new Event('ended'));
    await nextTick();
    expect((w.vm as any).state.currentIndex).toBe(1);
    const single = mountPlayer({ audioUrl: 'a.mp3' });
    (single.w.vm as any).state.isPlaying = true;
    single.audio.dispatchEvent(new Event('ended'));
    await nextTick();
    expect((single.w.vm as any).state.isPlaying).toBe(false);
  });

  it('error event shows the error node, disables play and reduces the toolbar', async () => {
    const { w, audio } = mountPlayer({ audioUrl: { src: 'bad.mp3', title: 'T' } });
    audio.dispatchEvent(new Event('error'));
    await nextTick();
    expect(w.find('.semi-audio-player-error').exists()).toBe(true);
    expect(w.find('.semi-audio-player-control-button-play-disabled').exists()).toBe(true);
    expect(w.find('.semi-audio-player-info-time').exists()).toBe(false);
    expect(w.find('.semi-audio-player-control-speed').exists()).toBe(false);
  });

  it('loadedmetadata initialises totalTime', async () => {
    const { w, audio } = mountPlayer({ audioUrl: 'a.mp3' });
    Object.defineProperty(audio, 'duration', { configurable: true, get: () => 125 });
    audio.dispatchEvent(new Event('loadedmetadata'));
    await nextTick();
    expect((w.vm as any).state.totalTime).toBe(125);
    expect(w.findAll('.semi-audio-player-info-time span')[1].text()).toBe('2:05');
  });

  it('toolbar icons carry the control-button-icon class', () => {
    const w = mount(AudioPlayer, { props: { audioUrl: 'a.mp3' } });
    expect(w.findAll('.semi-audio-player-control-button-icon').length).toBeGreaterThanOrEqual(4);
  });
});
