import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import { cssClasses, DEFAULT_PLAYBACK_RATE, numbers, strings } from '@douyinfe/semi-foundation/lib/es/videoPlayer/constants';
import VideoPlayerFoundation from '@douyinfe/semi-foundation/lib/es/videoPlayer/foundation';
import '@douyinfe/semi-foundation/lib/es/videoPlayer/videoPlayer.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, toCssStyle, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import Button from '../button/Button';
import Popover from '../popover/Popover';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownItem from '../dropdown/DropdownItem';
import AudioSlider from '../audioPlayer/audioSlider';
import VideoProgress from './videoProgress';
import ErrorSvg from './ErrorSvg';
import { formatTime } from './utils';
import {
  IconPlay,
  IconPause,
  IconVolume1,
  IconVolume2,
  IconRestart,
  IconFlipHorizontal,
  IconMinimize,
  IconMaximize,
  IconMute,
  IconPlayCircle,
  IconMiniPlayer,
} from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export const videoPlayerProps = {
  autoPlay: { type: Boolean, default: false },
  captionsSrc: { type: String, default: undefined },
  clickToPlay: { type: Boolean, default: true },
  controlsList: {
    type: Array as PropType<string[]>,
    default: () => [strings.PLAY, strings.NEXT, strings.TIME, strings.VOLUME, strings.PLAYBACK_RATE, strings.QUALITY, strings.ROUTE, strings.MIRROR, strings.FULLSCREEN, strings.PICTURE_IN_PICTURE],
  },
  crossOrigin: { type: String, default: undefined },
  defaultPlaybackRate: { type: Number, default: numbers.DEFAULT_PLAYBACK_RATE },
  defaultQuality: { type: String, default: undefined },
  defaultRoute: { type: String, default: undefined },
  height: { type: [Number, String] as PropType<number | string>, default: undefined },
  loop: { type: Boolean, default: false },
  markers: { type: Array as PropType<any[]>, default: undefined },
  muted: { type: Boolean, default: false },
  playbackRateList: { type: Array as PropType<Array<{ label: string; value: number }>>, default: () => DEFAULT_PLAYBACK_RATE },
  poster: { type: String, default: undefined },
  qualityList: { type: Array as PropType<Array<{ label: string; value: string }>>, default: undefined },
  routeList: { type: Array as PropType<Array<{ label: string; value: string }>>, default: undefined },
  seekTime: { type: Number, default: numbers.DEFAULT_SEEK_TIME },
  src: { type: String, default: undefined },
  theme: { type: String, default: strings.DARK },
  volume: { type: Number, default: numbers.DEFAULT_VOLUME },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  forwardRef: { type: [Object, Function] as PropType<any>, default: undefined },
};

export const videoPlayerEmits = ['pause', 'play', 'qualityChange', 'rateChange', 'routeChange', 'volumeChange'];

const VideoPlayer = defineComponent({
  name: 'VideoPlayer',
  inheritAttrs: false,
  props: videoPlayerProps,
  emits: videoPlayerEmits,
  setup(props, { attrs, emit, expose }) {
    const { locale } = useLocale('VideoPlayer');
    const videoRef = ref<HTMLVideoElement | null>(null);
    const videoWrapperRef = ref<HTMLDivElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      bufferedValue: 0,
      currentQuality: props.defaultQuality || '',
      currentRoute: props.defaultRoute || '',
      currentTime: 0,
      isError: false,
      isMirror: false,
      isPlaying: false,
      muted: props.muted,
      notificationContent: '',
      playbackRate: props.defaultPlaybackRate || 1,
      playbackRateList: props.playbackRateList,
      showNotification: false,
      showControls: true,
      src: props.src || '',
      totalTime: 0,
      volume: props.muted ? 0 : props.volume,
    });

    const adapter = {
      ...baseAdapter,
      getVideo: () => videoRef.value,
      getVideoWrapper: () => videoWrapperRef.value,
      notifyPause: () => emit('pause'),
      notifyPlay: () => emit('play'),
      notifyQualityChange: (quality: string) => emit('qualityChange', quality),
      notifyRateChange: (rate: number) => emit('rateChange', rate),
      notifyRouteChange: (route: string) => emit('routeChange', route),
      notifyVolumeChange: (volume: number) => emit('volumeChange', volume),
      setBufferedValue: (bufferedValue: number) => {
        state.bufferedValue = bufferedValue;
      },
      setCurrentTime: (currentTime: number) => {
        state.currentTime = currentTime;
      },
      setIsError: (isError: boolean) => {
        state.isError = isError;
      },
      setIsMirror: (isMirror: boolean) => {
        state.isMirror = isMirror;
      },
      setIsPlaying: (isPlaying: boolean) => {
        state.isPlaying = isPlaying;
      },
      setMuted: (muted: boolean) => {
        state.muted = muted;
      },
      setNotificationContent: (content: string) => {
        state.notificationContent = content;
      },
      setPlaybackRate: (rate: number) => {
        state.playbackRate = rate;
      },
      setQuality: (quality: string) => {
        state.currentQuality = quality;
      },
      setRoute: (route: string) => {
        state.currentRoute = route;
      },
      setShowControls: (showControls: boolean) => {
        state.showControls = showControls;
      },
      setShowNotification: (showNotification: boolean) => {
        state.showNotification = showNotification;
      },
      setTotalTime: (totalTime: number) => {
        state.totalTime = totalTime;
      },
      setVolume: (volume: number) => {
        state.volume = volume;
      },
    };
    const foundation = new (VideoPlayerFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => props.src,
      (src) => {
        state.src = src || '';
        const el = videoRef.value;
        if (el && src !== undefined) {
          el.src = src || '';
        }
      }
    );

    const setVideoEl = (el: HTMLVideoElement | null) => {
      videoRef.value = el;
      const fr = props.forwardRef;
      if (typeof fr === 'function') fr(el);
      else if (fr && typeof fr === 'object') (fr as any).value = el;
    };

    expose({
      foundation,
      state,
      videoRef,
      play: () => videoRef.value?.play?.(),
      pause: () => videoRef.value?.pause?.(),
    });

    const getVolumeIcon = () => {
      if (state.muted) return h(IconMute);
      if (state.volume < 50) return h(IconVolume1);
      return h(IconVolume2);
    };

    const renderIconButton = (icon: any, onClick: () => void, name: string) => {
      if (!foundation.shouldShowControlItem(name)) return null;
      return h(Button, {
        theme: 'borderless',
        class: cls(`${cssClasses.PREFIX_CONTROLS}-menu-item`, `${cssClasses.PREFIX_CONTROLS}-menu-button`),
        icon,
        onClick,
      });
    };

    return () => {
      const loc = locale.value || {};
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { markers, qualityList, routeList, width, height, autoPlay, style, className, loop, captionsSrc, crossOrigin, theme } = props;
      const { isPlaying, playbackRate, playbackRateList, isMirror, currentTime, totalTime, currentQuality, currentRoute, bufferedValue, showControls } = state;
      const src = state.src || props.src || '';

      const renderTime = () =>
        foundation.shouldShowControlItem(strings.TIME)
          ? h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-time`) }, `${formatTime(currentTime)} / ${formatTime(totalTime)}`)
          : null;

      const renderVolume = () =>
        foundation.shouldShowControlItem(strings.VOLUME)
          ? h(
              Popover,
              {
                autoAdjustOverflow: true,
                position: 'top',
                className: cls(`${cssClasses.PREFIX_CONTROLS}-popover`),
                content: () =>
                  h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-volume`) }, [
                    h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-volume-title`) }, `${state.muted ? 0 : state.volume}%`),
                    h(AudioSlider, { value: state.muted ? 0 : state.volume, max: 100, vertical: true, height: 120, showTooltip: false, onChange: (v: number) => foundation.handleVolumeChange(v) }),
                  ]),
              },
              () =>
                h(Button, {
                  class: cls(`${cssClasses.PREFIX_CONTROLS}-menu-item`, `${cssClasses.PREFIX_CONTROLS}-menu-button`),
                  theme: 'borderless',
                  icon: getVolumeIcon,
                  onClick: () => foundation.handleVolumeSilent(),
                })
            )
          : null;

      const renderDropdownButton = (currentValue: any, list: any[], handleChange: any, name: string) => {
        if (!foundation.shouldShowControlItem(name) || !list) return null;
        return h(
          Dropdown,
          { position: 'top', className: cls(`${cssClasses.PREFIX_CONTROLS}-popup-menu`) },
          {
            default: () =>
              h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-menu-item`, `${cssClasses.PREFIX_CONTROLS}-popup`) }, list.find((option) => option.value === currentValue)?.label),
            render: () =>
              h(DropdownMenu, null, () =>
                list.map((option) =>
                  h(
                    DropdownItem,
                    {
                      class: cls(`${cssClasses.PREFIX_CONTROLS}-popup-menu-item`),
                      key: option.value,
                      active: option.value === currentValue,
                      onClick: () => handleChange(option, loc),
                    },
                    () => option.label
                  )
                )
              ),
          }
        );
      };

      return h(
        'div',
        {
          class: cls(prefixCls, className, attrClass, { [`${prefixCls}-mirror`]: isMirror }),
          style: toCssStyle({ width, height, ...(style || {}), ...(attrStyle || {}) }),
          ref: videoWrapperRef,
          tabindex: 0,
          onMouseenter: () => foundation.handleMouseEnterWrapper(),
          onMouseleave: () => foundation.handleMouseLeaveWrapper(),
          ...getDataAttr(rest),
        },
        [
          h('div', { class: cls(`${prefixCls}-wrapper`, { [`${prefixCls}-wrapper-${theme}`]: theme }) }, [
            h('video', {
              ref: setVideoEl,
              autoplay: autoPlay,
              loop,
              controls: false,
              crossorigin: crossOrigin,
              src,
              onTimeupdate: () => foundation.handleTimeUpdate(),
              onDurationchange: () => foundation.handleDurationChange(),
              onPlay: () => foundation.handleVideoPlay(),
              onPause: () => foundation.handleVideoPause(),
              onClick: () => {
                if (props.clickToPlay !== false) foundation.handlePlayOrPause();
              },
              onError: () => foundation.handleError(),
              onCanplay: () => foundation.handleCanPlay(),
              onWaiting: () => foundation.handleWaiting(loc),
              onStalled: () => foundation.handleStalled(loc),
              onProgress: () => foundation.handleProgress(),
              onEnded: () => foundation.handleEnded(),
            }, [h('track', { kind: 'captions', src: captionsSrc })]),
            isNullOrUndefined(props.src) ? h('div', { class: cls(`${prefixCls}-resource-not-found`) }, loc.noResource) : null,
          ]),
          !isPlaying && props.poster
            ? h('img', {
                class: cls(`${prefixCls}-poster`, { [`${prefixCls}-poster-hide`]: currentTime > 0 && currentTime < totalTime }),
                src: props.poster,
                alt: 'poster',
              })
            : null,
          !isPlaying && !state.isError
            ? h(
                'div',
                {
                  class: cls(`${prefixCls}-pause`),
                  onClick: () => {
                    if (props.clickToPlay !== false) foundation.handlePlay();
                  },
                },
                [h(IconPlayCircle)]
              )
            : null,
          state.isError
            ? h('div', { class: cls(`${prefixCls}-error`, { [`${prefixCls}-error-${theme}`]: theme }) }, [
                h('div', { class: cls(`${prefixCls}-error-svg`) }, [h(ErrorSvg)]),
                loc.videoError,
              ])
            : null,
          state.showNotification && state.notificationContent ? h('div', { class: cls(`${prefixCls}-notification`) }, state.notificationContent) : null,
          h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}`, { [`${cssClasses.PREFIX_CONTROLS}-hide`]: !showControls }) }, [
            h(VideoProgress, {
              key: Number.isFinite(totalTime) ? totalTime : 0,
              value: currentTime,
              max: totalTime,
              onChange: (v: number) => foundation.handleTimeChange(v),
              markers,
              bufferedValue,
            }),
            h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-menu`) }, [
              h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-menu-left`) }, [
                renderIconButton(isPlaying ? IconPause : IconPlay, isPlaying ? () => foundation.handlePause() : () => foundation.handlePlay(), strings.PLAY),
                renderIconButton(() => h(IconRestart, { rotate: 180 }), isPlaying ? () => foundation.handlePause() : () => foundation.handlePlay(), strings.NEXT),
                renderTime(),
                renderVolume(),
                renderDropdownButton(playbackRate, playbackRateList, (option: any, l: any) => foundation.handleRateChange(option, l), strings.PLAYBACK_RATE),
              ]),
              h('div', { class: cls(`${cssClasses.PREFIX_CONTROLS}-menu-right`) }, [
                qualityList && qualityList.length ? renderDropdownButton(currentQuality, qualityList, (option: any, l: any) => foundation.handleQualityChange(option, l), strings.QUALITY) : null,
                routeList && routeList.length ? renderDropdownButton(currentRoute, routeList, (option: any, l: any) => foundation.handleRouteChange(option, l), strings.ROUTE) : null,
                renderIconButton(IconFlipHorizontal, () => foundation.handleMirror(loc), strings.MIRROR),
                renderIconButton(foundation.checkFullScreen() ? IconMinimize : IconMaximize, () => foundation.handleFullscreen(), strings.FULLSCREEN),
                renderIconButton(IconMiniPlayer, () => foundation.handlePictureInPicture(), strings.PICTURE_IN_PICTURE),
              ]),
            ]),
          ]),
        ]
      );
    };
  },
});

(VideoPlayer as any).elementType = 'VideoPlayer';
export default VideoPlayer;
