import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/audioPlayer/constants';
import AudioPlayerFoundation from '@douyinfe/semi-foundation/lib/es/audioPlayer/foundation';
import '@douyinfe/semi-foundation/lib/es/audioPlayer/audioPlayer.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';
import { useLocale } from '../locale';
import Button from '../button/Button';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownItem from '../dropdown/DropdownItem';
import Image from '../image/Image';
import Tooltip from '../tooltip/Tooltip';
import Popover from '../popover/Popover';
import {
  IconAlertCircle,
  IconBackward,
  IconFastForward,
  IconPause,
  IconPlay,
  IconRefresh,
  IconRestart,
  IconVolume2,
  IconVolumnSilent,
} from '../icons/generated';
import AudioSlider from './audioSlider';
import { formatTime } from './utils';

const prefixCls = cssClasses.PREFIX;

type AudioInfo = { title?: string; cover?: string; src: string };
export type AudioUrl = string | AudioInfo | Array<string | AudioInfo>;

export const audioPlayerProps = {
  audioUrl: { type: [String, Object, Array] as PropType<AudioUrl>, default: undefined },
  autoPlay: { type: Boolean, default: false },
  showToolbar: { type: Boolean, default: true },
  skipDuration: { type: Number, default: 10 },
  theme: { type: String as PropType<'dark' | 'light'>, default: 'dark' },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const rateOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2 },
];

const AudioPlayer = defineComponent({
  name: 'AudioPlayer',
  inheritAttrs: false,
  props: audioPlayerProps,
  setup(props, { attrs, expose }) {
    const { locale } = useLocale('AudioPlayer');
    const audioRef = ref<HTMLAudioElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      isPlaying: false,
      currentIndex: 0,
      totalTime: 0,
      currentTime: 0,
      currentRate: { label: '1.0x', value: 1 },
      volume: 100,
      error: false,
    });

    const onLoadedMetadata = () => foundation.initAudioState();
    const onError = () => foundation.errorHandler();
    const onEnded = () => foundation.endHandler();

    const adapter = {
      ...baseAdapter,
      init: () => {
        const el = audioRef.value;
        if (!el) return;
        el.addEventListener('loadedmetadata', onLoadedMetadata);
        el.addEventListener('error', onError);
        el.addEventListener('ended', onEnded);
      },
      destroy: () => {
        const el = audioRef.value;
        if (!el) return;
        el.removeEventListener('loadedmetadata', onLoadedMetadata);
        el.removeEventListener('error', onError);
        el.removeEventListener('ended', onEnded);
      },
      handleStatusClick: () => {
        if (!audioRef.value) return;
        if (state.isPlaying) audioRef.value.pause();
        else audioRef.value.play();
        state.isPlaying = !state.isPlaying;
      },
      getAudioRef: () => audioRef.value,
      resetAudioState: () => {
        state.isPlaying = true;
        state.currentTime = 0;
        state.currentRate = { label: '1.0x', value: 1 };
        if (audioRef.value) {
          audioRef.value.currentTime = 0;
          audioRef.value.playbackRate = 1;
          audioRef.value.play();
        }
      },
      handleTimeUpdate: () => {
        if (!audioRef.value) return;
        state.currentTime = audioRef.value.currentTime;
      },
      handleTrackChange: (direction: 'next' | 'prev') => {
        if (!audioRef.value) return;
        const { audioUrl } = props;
        if (Array.isArray(audioUrl)) {
          state.currentIndex =
            direction === 'next'
              ? (state.currentIndex + 1) % audioUrl.length
              : (state.currentIndex - 1 + audioUrl.length) % audioUrl.length;
          state.error = false;
        }
        foundation.resetAudioState();
      },
      handleTimeChange: (value: number) => {
        if (!audioRef.value) return;
        audioRef.value.currentTime = value;
        state.currentTime = value;
      },
      handleRefresh: () => {
        if (!audioRef.value) return;
        if (state.error) audioRef.value.load();
        else {
          audioRef.value.currentTime = 0;
          state.currentTime = 0;
        }
      },
      handleSpeedChange: (value: { label: string; value: number }) => {
        if (!audioRef.value) return;
        audioRef.value.playbackRate = value.value;
        state.currentRate = value;
      },
      handleSeek: (direction: number) => {
        if (!audioRef.value) return;
        const skipDuration = props.skipDuration ?? 10;
        const newTime = Math.min(Math.max(audioRef.value.currentTime + direction * skipDuration, 0), audioRef.value.duration || 0);
        audioRef.value.currentTime = newTime;
      },
      handleVolumeChange: (value: number) => {
        if (!audioRef.value) return;
        const volume = Math.floor(value);
        audioRef.value.volume = volume / 100;
        state.volume = volume;
      },
    };
    const foundation = new (AudioPlayerFoundation as any)(adapter);

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const handleVolumeSilent = () => {
      if (!audioRef.value) return;
      audioRef.value.volume = state.volume === 0 ? 0.5 : 0;
      state.volume = state.volume === 0 ? 50 : 0;
    };

    const getAudioInfo = (audioUrl: AudioUrl) => {
      if (Array.isArray(audioUrl)) {
        const audioInfo = audioUrl[state.currentIndex];
        if (typeof audioInfo === 'string') return { src: audioInfo, audioTitle: null, audioCover: null };
        return { src: audioInfo.src, audioTitle: audioInfo.title, audioCover: audioInfo.cover };
      }
      if (typeof audioUrl === 'string') return { src: audioUrl, audioTitle: null, audioCover: null };
      return { src: (audioUrl as AudioInfo)?.src, audioTitle: (audioUrl as AudioInfo)?.title, audioCover: (audioUrl as AudioInfo)?.cover };
    };

    expose({ foundation, state, audioRef });

    return () => {
      const loc = locale.value || {};
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { audioUrl, autoPlay, className, style, showToolbar = true, theme = 'dark' } = props;
      const src = getAudioInfo(audioUrl).src;
      const { audioTitle, audioCover } = getAudioInfo(audioUrl);
      const isAudioUrlArray = Array.isArray(audioUrl);
      const iconClass = cls(`${prefixCls}-control-button-icon`);
      const circleStyle = { borderRadius: '50%' };
      const transparentStyle = { background: 'transparent' };
      const errorNode = h('div', { class: cls(`${prefixCls}-error`) }, [h(IconAlertCircle, { size: 'large' }), loc.mediaError || '音频加载失败']);

      const control = h('div', { class: cls(`${prefixCls}-control`) }, [
        isAudioUrlArray
          ? h(Tooltip, { content: loc.prev, autoAdjustOverflow: true, showArrow: false }, () =>
              h('span', null, [
                h(Button, {
                  style: { ...circleStyle, ...transparentStyle },
                  size: 'large',
                  icon: () => h(IconRestart, { size: 'large', class: iconClass }),
                  onClick: () => foundation.handleTrackChange('prev'),
                }),
              ])
            )
          : null,
        h(Button, {
          style: circleStyle,
          size: 'large',
          disabled: state.error,
          onClick: () => foundation.handleStatusClick(),
          icon: state.isPlaying ? () => h(IconPause, { size: 'large' }) : () => h(IconPlay, { size: 'large', style: { marginLeft: '1px' } }),
          class: cls(`${prefixCls}-control-button-play`, { [`${prefixCls}-control-button-play-disabled`]: state.error }),
        }),
        isAudioUrlArray
          ? h(Tooltip, { content: loc.next, autoAdjustOverflow: true, showArrow: false }, () =>
              h('span', null, [
                h(Button, {
                  style: { ...circleStyle, ...transparentStyle },
                  size: 'large',
                  icon: () => h(IconRestart, { size: 'large', rotate: 180, class: iconClass }),
                  onClick: () => foundation.handleTrackChange('next'),
                }),
              ])
            )
          : null,
      ]);

      const info = h('div', { class: cls(`${prefixCls}-info-container`) }, [
        audioCover ? h(Image, { src: audioCover, width: 50, height: 50 }) : null,
        h('div', { class: cls(`${prefixCls}-info`) }, [
          audioTitle ? h('div', { class: cls(`${prefixCls}-info-title`) }, [audioTitle, state.error ? errorNode : null]) : null,
          !state.error
            ? h('div', { class: cls(`${prefixCls}-info-time`) }, [
                h('span', { style: { width: '38px' } }, formatTime(state.currentTime)),
                h('div', { class: cls(`${prefixCls}-slider-container`) }, [
                  h(AudioSlider, { value: state.currentTime, max: state.totalTime, theme, onChange: (v: number) => foundation.handleTimeChange(v) }),
                ]),
                h('span', { style: { width: '38px' } }, formatTime(state.totalTime)),
              ])
            : null,
        ]),
      ]);

      const skipDuration = props.skipDuration ?? 10;
      const toolbar = !state.error
        ? h('div', { class: cls(`${prefixCls}-control`) }, [
            h(
              Popover,
              {
                autoAdjustOverflow: true,
                content: () =>
                  h('div', { class: cls(`${prefixCls}-control-volume`) }, [
                    h('div', { class: cls(`${prefixCls}-control-volume-title`) }, `${state.volume}%`),
                    h(AudioSlider, { value: state.volume, max: 100, vertical: true, height: 120, theme, showTooltip: false, onChange: (v: number) => foundation.handleVolumeChange(v) }),
                  ]),
              },
              () =>
                h('span', null, [
                  h(Tooltip, { content: loc.volume, autoAdjustOverflow: true, showArrow: false }, () =>
                    h(Button, {
                      style: transparentStyle,
                      icon: state.volume === 0 ? () => h(IconVolumnSilent, { class: iconClass }) : () => h(IconVolume2, { class: iconClass }),
                      onClick: handleVolumeSilent,
                    })
                  ),
                ])
            ),
            h(Tooltip, { content: String(loc.backward || '').replace('${skipDuration}', String(skipDuration)), autoAdjustOverflow: true, showArrow: false }, () =>
              h('span', null, [h(Button, { style: transparentStyle, icon: () => h(IconBackward, { class: iconClass }), onClick: () => foundation.handleSeek(-1) })])
            ),
            h(Tooltip, { content: String(loc.forward || '').replace('${skipDuration}', String(skipDuration)), autoAdjustOverflow: true, showArrow: false }, () =>
              h('span', null, [h(Button, { style: transparentStyle, icon: () => h(IconFastForward, { class: iconClass }), onClick: () => foundation.handleSeek(1) })])
            ),
            h(
              Dropdown,
              {
                className: cls(`${prefixCls}-control-speed-menu`),
              },
              {
                default: () => h('div', { class: cls(`${prefixCls}-control-speed`) }, [h('span', null, state.currentRate.label)]),
                render: () =>
                  h(DropdownMenu, null, () =>
                    rateOptions.map((option) =>
                      h(
                        DropdownItem,
                        {
                          class: cls(`${prefixCls}-control-speed-menu-item`),
                          key: option.value,
                          active: option.value === state.currentRate.value,
                          onClick: () => foundation.handleSpeedChange(option),
                        },
                        () => option.label
                      )
                    )
                  ),
              }
            ),
            h(Button, { onClick: () => foundation.handleRefresh(), style: transparentStyle, icon: () => h(IconRefresh, { style: { transform: 'rotateY(180deg)' }, class: iconClass }) }),
          ])
        : h('div', { class: cls(`${prefixCls}-control`) }, [
            h(Button, { onClick: () => foundation.handleRefresh(), style: transparentStyle, icon: () => h(IconRefresh, { style: { transform: 'rotateY(180deg)' }, class: iconClass }) }),
          ]);

      return h('div', { class: cls(prefixCls, className, attrClass, `${prefixCls}-${theme}`), style: [style, attrStyle], ...getDataAttr(rest) }, [
        h('audio', { src, autoplay: autoPlay, class: cls(prefixCls, className), style, ref: audioRef, onTimeupdate: () => foundation.handleTimeUpdate() }, [
          h('track', { kind: 'captions', src }),
        ]),
        control,
        info,
        showToolbar ? toolbar : null,
      ]);
    };
  },
});

(AudioPlayer as any).elementType = 'AudioPlayer';
export default AudioPlayer;
