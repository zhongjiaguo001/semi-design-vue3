import { defineComponent, h, ref, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/videoPlayer/constants';
import VideoProgressFoundation from '@douyinfe/semi-foundation/lib/es/videoPlayer/progressFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import Tooltip from '../tooltip/Tooltip';
import { formatTime } from './utils';
import { toCssStyle } from '../_utils';

export const videoProgressProps = {
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  showTooltip: { type: Boolean, default: true },
  markers: { type: Array as PropType<Array<{ start: number; title: string }>>, default: undefined },
  bufferedValue: { type: Number, default: 0 },
  onChange: { type: Function as PropType<(value: number) => void>, default: undefined },
};

export const videoProgressEmits = ['change'];

const VideoProgress = defineComponent({
  name: 'VideoProgress',
  inheritAttrs: false,
  props: videoProgressProps,
  emits: videoProgressEmits,
  setup(props, { emit }) {
    const sliderRef = ref<HTMLDivElement | null>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      isDragging: false,
      isHandleHovering: false,
      movingInfo: null as { progress: number; offset: number; value: number } | null,
      activeIndex: -1,
    });

    const initMarkerList = () => {
      const { markers, max } = props;
      const hasMarkers = markers && markers.length > 0;
      const defaultMarker = { start: 0, end: max, left: '0', title: '', width: '100%' };
      if (!hasMarkers) return [defaultMarker];
      const newMarkers = [...markers];
      const markersList: any[] = [];
      newMarkers.forEach((marker, index) => {
        const end = index === newMarkers.length - 1 ? max : newMarkers[index + 1].start;
        if (!(marker.start > max || end > max)) {
          markersList.push({
            left: `${(marker.start / max) * 100}%`,
            width: `${max ? ((end - marker.start) / max) * 100 : 100}%`,
            end,
            start: marker.start,
            title: marker.title,
          });
        }
      });
      return markersList;
    };
    let markersList = initMarkerList();

    const adapter = {
      ...baseAdapter,
      getSliderRef: () => sliderRef.value,
      getMarkersList: () => markersList,
      setIsDragging: (isDragging: boolean) => {
        state.isDragging = isDragging;
      },
      setIsHandleHovering: (isHandleHovering: boolean) => {
        state.isHandleHovering = isHandleHovering;
      },
      setActiveIndex: (activeIndex: number) => {
        state.activeIndex = activeIndex;
      },
      setMovingInfo: (movingInfo: any) => {
        state.movingInfo = movingInfo;
      },
    };
    const foundation = new (VideoProgressFoundation as any)(adapter);
    onBeforeUnmount(() => {
      foundation.handleDocumentMouseUp?.();
    });

    const renderTooltipContent = () => {
      const { movingInfo } = state;
      if (markersList.length > 0 && movingInfo) {
        const hoverIndex = markersList.findIndex((marker: any) => movingInfo.value > marker.start && movingInfo.value < marker.end);
        return [
          h('div', { class: cls(`${cssClasses.PREFIX_PROGRESS}-tooltip-content`) }, markersList[hoverIndex]?.title),
          h('div', { class: cls(`${cssClasses.PREFIX_PROGRESS}-tooltip-content`) }, formatTime(movingInfo.progress * props.max)),
        ];
      }
      return movingInfo ? formatTime(movingInfo.progress * props.max) : '';
    };

    return () => {
      markersList = initMarkerList();
      const { showTooltip, max, value: currentValue } = props;
      const { movingInfo, isHandleHovering, isDragging, activeIndex } = state;
      const sliderContent = h(
        'div',
        {
          role: 'slider',
          tabindex: 0,
          'aria-valuenow': currentValue,
          ref: sliderRef,
          class: cls(`${cssClasses.PREFIX_PROGRESS}`),
          onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
          onMouseup: () => foundation.handleMouseUp(),
          onMouseenter: (e: MouseEvent) => foundation.handleMouseEvent(e, false),
          onMousemove: (e: MouseEvent) => foundation.handleMouseEvent(e, true),
        },
        [
          h(
            'div',
            { class: cls(`${cssClasses.PREFIX_PROGRESS}-markers`) },
            markersList.map((marker: any, index: number) =>
              h(
                'div',
                {
                  key: `${marker.start}-${index}`,
                  class: cls(`${cssClasses.PREFIX_PROGRESS}-slider`, {
                    [`${cssClasses.PREFIX_PROGRESS}-slider-active`]: index === activeIndex && isDragging,
                  }),
                  style: { left: marker.left, width: marker.width },
                  onMouseenter: () => foundation.handleSliderMouseEnter(index),
                  onMouseleave: () => foundation.handleSliderMouseLeave(index),
                },
                [
                  h('div', { class: cls(`${cssClasses.PREFIX_PROGRESS}-slider-list`) }),
                  h('div', { class: cls(`${cssClasses.PREFIX_PROGRESS}-slider-buffered`), style: { width: foundation.getLoadedWidth(marker) } }),
                  h('div', { class: cls(`${cssClasses.PREFIX_PROGRESS}-slider-played`), style: { width: foundation.getPlayedWidth(marker) } }),
                ]
              )
            )
          ),
          h('div', {
            class: cls(`${cssClasses.PREFIX_PROGRESS}-handle`),
            style: {
              left: `calc(${((max ? (currentValue || 1) / max : 0) * 100)}% - 8px)`,
              transform: 'translateY(-50%)',
              opacity: isHandleHovering || isDragging ? 1 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            },
          }),
        ]
      );
      void emit;
      return showTooltip
        ? h(
            Tooltip,
            {
              position: 'top',
              className: cls(`${cssClasses.PREFIX_PROGRESS}-tooltip`),
              content: () => renderTooltipContent(),
              style: toCssStyle({ left: movingInfo?.offset }),
            },
            () => sliderContent
          )
        : sliderContent;
    };
  },
});

export default VideoProgress;
