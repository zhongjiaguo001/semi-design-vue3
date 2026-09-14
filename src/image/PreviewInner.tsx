import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, isVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _isEqual from 'lodash/isEqual';
import { cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/image/constants';
import PreviewInnerFoundation from '@douyinfe/semi-foundation/lib/es/image/previewInnerFoundation';
import '@douyinfe/semi-foundation/lib/es/image/image.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getScrollbarWidth, normalizeNode } from '../_utils';
import Portal from '../_portal/Portal';
import { IconArrowLeft, IconArrowRight } from '../icons/generated';
import PreviewHeader from './PreviewHeader';
import PreviewFooter from './PreviewFooter';
import type { MenuProps } from './PreviewFooter';
import PreviewImage from './PreviewImage';
import type { RatioType } from './PreviewImage';
import { usePreviewContext } from './previewContext';

const prefixCls = cssClasses.PREFIX;

export const previewInnerProps = {
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  visible: { type: Boolean, default: false },
  src: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  currentIndex: { type: Number, default: undefined },
  defaultCurrentIndex: { type: Number, default: undefined },
  defaultVisible: { type: Boolean, default: undefined },
  maskClosable: { type: Boolean, default: true },
  closable: { type: Boolean, default: true },
  zoomStep: { type: Number, default: 0.1 },
  infinite: { type: Boolean, default: false },
  showTooltip: { type: Boolean, default: false },
  closeOnEsc: { type: Boolean, default: true },
  prevTip: { type: String, default: undefined },
  nextTip: { type: String, default: undefined },
  zoomInTip: { type: String, default: undefined },
  zoomOutTip: { type: String, default: undefined },
  rotateTip: { type: String, default: undefined },
  downloadTip: { type: String, default: undefined },
  adaptiveTip: { type: String, default: undefined },
  originTip: { type: String, default: undefined },
  lazyLoad: { type: Boolean, default: false },
  preLoad: { type: Boolean, default: true },
  preLoadGap: { type: Number, default: 2 },
  disableDownload: { type: Boolean, default: false },
  viewerVisibleDelay: { type: Number, default: 10000 },
  zIndex: { type: Number, default: numbers.DEFAULT_Z_INDEX },
  maxZoom: { type: Number, default: 5 },
  minZoom: { type: Number, default: 0.1 },
  initialZoom: { type: Number, default: undefined },
  crossOrigin: { type: String as PropType<'anonymous' | 'use-credentials'>, default: undefined },
  renderHeader: { type: Function as PropType<(title?: any) => VNodeChild>, default: undefined },
  renderPreviewMenu: { type: Function as PropType<(props: MenuProps) => VNodeChild>, default: undefined },
  renderLeftIcon: { type: [Function, Object] as PropType<any>, default: undefined },
  renderRightIcon: { type: [Function, Object] as PropType<any>, default: undefined },
  renderCloseIcon: { type: [Function, Object] as PropType<any>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  setDownloadName: { type: Function as PropType<(src: string) => string>, default: undefined },
};

export const previewInnerEmits = [
  'visibleChange',
  'change',
  'close',
  'zoomIn',
  'zoomOut',
  'prev',
  'next',
  'download',
  'downloadError',
  'ratioChange',
  'rotateLeft',
  'rotateChange',
];

interface PreviewInnerState {
  imgSrc: string[];
  imgLoadStatus: Record<string, boolean>;
  zoom: number;
  currentIndex: number;
  ratio: RatioType;
  rotation: number;
  viewerVisible: boolean;
  visible: boolean;
  preloadAfterVisibleChange: boolean;
  direction: '' | 'prev' | 'next';
}

const PreviewInner = defineComponent({
  name: 'ImagePreviewInner',
  inheritAttrs: false,
  props: previewInnerProps,
  emits: previewInnerEmits,
  setup(props, { attrs, slots, emit, expose }) {
    const context = usePreviewContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, PreviewInnerState>(
      props as any,
      {
        imgSrc: [],
        imgLoadStatus: {},
        zoom: 0.1,
        currentIndex: 0,
        ratio: 'adaptation',
        rotation: 0,
        viewerVisible: true,
        visible: false,
        preloadAfterVisibleChange: true,
        direction: '',
      },
      { contexts: () => context as any }
    );

    let bodyOverflow = '';
    let originBodyWidth = '100%';
    let scrollBarWidth = 0;
    let imageWrapEl: HTMLElement | null = null;
    const imageRef = ref<any>(null);
    const headerRef = ref<any>(null);
    const footerRef = ref<any>(null);
    const leftIconRef = ref<HTMLElement | null>(null);
    const rightIconRef = ref<HTMLElement | null>(null);

    const isInGroup = () => Boolean(context && context.isGroup);

    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);
    const handleWheel = (e: WheelEvent) => foundation.handleWheel(e);

    const adapter = {
      ...baseAdapter,
      getIsInGroup: () => isInGroup(),
      disabledBodyScroll: () => {
        const { getPopupContainer } = props;
        bodyOverflow = document.body.style.overflow || '';
        if (!getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = 'hidden';
          document.body.style.width = `calc(${originBodyWidth || '100%'} - ${scrollBarWidth}px)`;
        }
      },
      enabledBodyScroll: () => {
        const { getPopupContainer } = props;
        if (!getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = bodyOverflow;
          document.body.style.width = originBodyWidth;
        }
      },
      notifyChange: (index: number, direction: 'prev' | 'next') => {
        emit('change', index);
        if (direction === 'prev') {
          emit('prev', index);
        } else {
          emit('next', index);
        }
      },
      notifyZoom: (zoom: number, increase: boolean) => {
        if (increase) {
          emit('zoomIn', zoom);
        } else {
          emit('zoomOut', zoom);
        }
      },
      notifyClose: () => emit('close'),
      notifyVisibleChange: (visible: boolean) => emit('visibleChange', visible),
      notifyRatioChange: (type: RatioType) => emit('ratioChange', type),
      notifyRotateChange: (angle: number) => {
        emit('rotateLeft', angle);
        emit('rotateChange', angle);
      },
      notifyDownload: (src: string, index: number) => emit('download', src, index),
      notifyDownloadError: (src: string) => emit('downloadError', src),
      registerKeyDownListener: () => {
        window && window.addEventListener('keydown', handleKeyDown);
      },
      unregisterKeyDownListener: () => {
        window && window.removeEventListener('keydown', handleKeyDown);
      },
      getSetDownloadFunc: () => context?.setDownloadName ?? props.setDownloadName,
      isValidTarget: (e: MouseEvent) => {
        const headerDom = headerRef.value?.getElement?.() ?? null;
        const footerDom = footerRef.value?.getElement?.() ?? null;
        const leftIconDom = leftIconRef.value;
        const rightIconDom = rightIconRef.value;
        const target = e.target as Node;
        if ((headerDom && headerDom.contains(target)) || (footerDom && footerDom.contains(target)) || (leftIconDom && leftIconDom.contains(target)) || (rightIconDom && rightIconDom.contains(target))) {
          return false;
        }
        return true;
      },
      changeImageZoom: (...args: any[]) => {
        imageRef.value && imageRef.value.foundation.changeZoom(...args);
      },
    };
    const foundation = new (PreviewInnerFoundation as any)(adapter);

    // getDerivedStateFromProps
    const deriveState = () => {
      let src: string[] = [];
      if (props.visible) {
        src = Array.isArray(props.src) ? props.src : props.src ? [props.src] : [];
      }
      if (!_isEqual(src, state.imgSrc)) {
        state.imgSrc = src;
      }
      if (props.visible !== state.visible) {
        state.visible = props.visible;
        if (props.visible) {
          state.preloadAfterVisibleChange = true;
          state.viewerVisible = true;
          state.rotation = 0;
          state.ratio = 'adaptation';
        }
      }
      if ('currentIndex' in propsView && props.currentIndex !== state.currentIndex) {
        state.currentIndex = props.currentIndex as number;
        state.ratio = 'adaptation';
      }
    };
    deriveState();
    watch(
      () => [props.visible, props.src, props.currentIndex],
      ([visible, src], [prevVisible, prevSrc]) => {
        deriveState();
        if (src !== prevSrc) {
          foundation.updateTimer();
        }
        if (!prevVisible && visible) {
          foundation.beforeShow();
        }
        if (prevVisible && !visible) {
          foundation.afterHide();
        }
      },
      { flush: 'pre' }
    );

    onMounted(() => {
      scrollBarWidth = getScrollbarWidth();
      originBodyWidth = document.body.style.width;
      if (props.visible) {
        foundation.beforeShow();
      }
    });
    onBeforeUnmount(() => {
      foundation.clearTimer();
      if (state.visible) foundation.afterHide();
      if (imageWrapEl) imageWrapEl.removeEventListener('wheel', handleWheel);
    });

    const registryImageWrapRef = (el: any) => {
      if (imageWrapEl) {
        imageWrapEl.removeEventListener('wheel', handleWheel);
      }
      if (el) {
        el.addEventListener('wheel', handleWheel, { passive: false });
      }
      imageWrapEl = el || null;
    };

    const handleSwitchImage = (direction: 'prev' | 'next') => foundation.handleSwitchImage(direction);
    const handleZoomImage = (newZoom: number, notify = true) => foundation.handleZoomImage(newZoom, notify);

    expose({
      foundation,
      handleSwitchImage,
      handleZoomImage,
      handleDownload: () => foundation.handleDownload(),
      handleAdjustRatio: (type: RatioType) => foundation.handleAdjustRatio(type),
      handleRotateImage: (direction: 'left' | 'right') => foundation.handleRotateImage(direction),
    });

    const resolveIcon = (slotName: string, prop: any, currentIndex: number) => {
      if (slots[slotName]) return slots[slotName]!(currentIndex);
      const node = typeof prop === 'function' && !prop.setup && !prop.render ? prop(currentIndex) : prop;
      return normalizeNode(node);
    };

    return () => {
      const {
        getPopupContainer,
        closable,
        zIndex,
        visible,
        className,
        style,
        maxZoom,
        minZoom,
        initialZoom,
        infinite,
        zoomStep,
        crossOrigin,
        prevTip,
        nextTip,
        zoomInTip,
        zoomOutTip,
        rotateTip,
        downloadTip,
        adaptiveTip,
        originTip,
        showTooltip,
        disableDownload,
        renderLeftIcon,
        renderRightIcon,
        renderCloseIcon,
        renderPreviewMenu,
        renderHeader,
      } = props;
      const { currentIndex, imgSrc, zoom, ratio, rotation, viewerVisible } = state;
      let wrapperStyle: CSSProperties = { zIndex };
      if (getPopupContainer) {
        wrapperStyle = { zIndex, position: 'static' };
      }
      const previewPrefixCls = `${prefixCls}-preview`;
      const previewWrapperCls = cls(previewPrefixCls, { [`${prefixCls}-hide`]: !visible, [`${previewPrefixCls}-popup`]: Boolean(getPopupContainer) }, className, attrs.class as any);
      const hideViewerCls = !viewerVisible ? `${previewPrefixCls}-hide` : '';
      const total = imgSrc.length;
      const showPrev = total !== 1 && (infinite || currentIndex !== 0);
      const showNext = total !== 1 && (infinite || currentIndex !== total - 1);
      const leftIcon = resolveIcon('leftIcon', renderLeftIcon, currentIndex);
      const rightIcon = resolveIcon('rightIcon', renderRightIcon, currentIndex);
      const leftIconNode = Array.isArray(leftIcon) ? leftIcon[0] : leftIcon;
      const rightIconNode = Array.isArray(rightIcon) ? rightIcon[0] : rightIcon;
      if (!visible) return null;
      return h(
        Portal,
        { getPopupContainer, style: wrapperStyle },
        {
          default: () =>
            h(
              'div',
              {
                class: previewWrapperCls,
                style: [style, attrs.style as any],
                onMousedown: (e: MouseEvent) => foundation.handleMouseDown(e),
                onMouseup: (e: MouseEvent) => foundation.handleMouseUp(e),
                ref: registryImageWrapRef,
                onMousemove: (e: MouseEvent) => foundation.handleMouseMove(e),
              },
              [
                h(
                  PreviewHeader,
                  {
                    ref: headerRef,
                    class: cls(hideViewerCls),
                    onClose: (e: MouseEvent) => foundation.handlePreviewClose(e),
                    renderHeader,
                    closable,
                    renderCloseIcon,
                  },
                  { header: slots.header, closeIcon: slots.closeIcon }
                ),
                h(PreviewImage, {
                  ref: imageRef,
                  src: imgSrc[currentIndex],
                  onZoom: handleZoomImage,
                  disableDownload,
                  setRatio: (type: RatioType) => foundation.handleAdjustRatio(type),
                  zoom,
                  ratio,
                  rotation,
                  crossOrigin,
                  initialZoom,
                  maxZoom,
                  minZoom,
                  onError: () => foundation.preloadSingleImage(),
                  onLoad: (src: string) => foundation.onImageLoad(src),
                }),
                showPrev
                  ? h(
                      'div',
                      { ref: leftIconRef, class: cls(`${previewPrefixCls}-icon`, `${previewPrefixCls}-prev`, hideViewerCls), onClick: () => handleSwitchImage('prev') },
                      [isVNode(leftIconNode) ? leftIconNode : h(IconArrowLeft, { size: 'large' })]
                    )
                  : null,
                showNext
                  ? h(
                      'div',
                      { ref: rightIconRef, class: cls(`${previewPrefixCls}-icon`, `${previewPrefixCls}-next`, hideViewerCls), onClick: () => handleSwitchImage('next') },
                      [isVNode(rightIconNode) ? rightIconNode : h(IconArrowRight, { size: 'large' })]
                    )
                  : null,
                h(
                  PreviewFooter,
                  {
                    ref: footerRef,
                    class: hideViewerCls,
                    totalNum: total,
                    curPage: currentIndex + 1,
                    disabledPrev: !showPrev,
                    disabledNext: !showNext,
                    zoom: zoom * 100,
                    min: minZoom * 100,
                    max: maxZoom * 100,
                    step: zoomStep * 100,
                    showTooltip,
                    ratio,
                    prevTip,
                    nextTip,
                    zIndex,
                    zoomInTip,
                    zoomOutTip,
                    rotateTip,
                    downloadTip,
                    disableDownload,
                    adaptiveTip,
                    originTip,
                    onPrev: () => handleSwitchImage('prev'),
                    onNext: () => handleSwitchImage('next'),
                    onZoomIn: handleZoomImage,
                    onZoomOut: handleZoomImage,
                    onDownload: () => foundation.handleDownload(),
                    onRotate: (direction: 'left' | 'right') => foundation.handleRotateImage(direction),
                    onAdjustRatio: (type: RatioType) => foundation.handleAdjustRatio(type),
                    renderPreviewMenu,
                  },
                  { previewMenu: slots.previewMenu }
                ),
              ]
            ),
        }
      );
    };
  },
});

export default PreviewInner;
