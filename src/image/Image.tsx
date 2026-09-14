import { defineComponent, h, ref, watch } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _omit from 'lodash/omit';
import _isUndefined from 'lodash/isUndefined';
import _isObject from 'lodash/isObject';
import _isBoolean from 'lodash/isBoolean';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/image/constants';
import ImageFoundation from '@douyinfe/semi-foundation/lib/es/image/imageFoundation';
import '@douyinfe/semi-foundation/lib/es/image/image.css';
import '@douyinfe/semi-foundation/lib/es/skeleton/skeleton.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { normalizeNode, toPx } from '../_utils';
import { IconUploadError, IconEyeOpened } from '../icons/generated';
import PreviewInner, { previewInnerEmits } from './PreviewInner';
import { usePreviewContext } from './previewContext';

const prefixCls = cssClasses.PREFIX;

export interface ImagePreviewObject extends Record<string, any> {
  visible?: boolean;
  src?: string;
  previewTitle?: any;
  previewCls?: string;
  previewStyle?: CSSProperties;
  onVisibleChange?: (visible: boolean) => void;
}

export const imageProps = {
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  src: { type: String, default: undefined },
  width: { type: [String, Number] as PropType<string | number>, default: undefined },
  height: { type: [String, Number] as PropType<string | number>, default: undefined },
  alt: { type: String, default: undefined },
  placeholder: { type: [String, Object, Function] as PropType<any>, default: undefined },
  fallback: { type: [String, Object, Function] as PropType<any>, default: undefined },
  preview: { type: [Boolean, Object] as PropType<boolean | ImagePreviewObject>, default: true },
  crossOrigin: { type: String as PropType<'anonymous' | 'use-credentials'>, default: undefined },
  imageID: { type: Number, default: undefined },
  imgCls: { type: String, default: undefined },
  imgStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  setDownloadName: { type: Function as PropType<(src: string) => string>, default: undefined },
};

export const imageEmits = ['load', 'error', 'click', 'previewVisibleChange', ...previewInnerEmits];

interface ImageState {
  src: string | undefined;
  loadStatus: 'loading' | 'success' | 'error';
  previewVisible: boolean;
}

const Image = defineComponent({
  name: 'Image',
  inheritAttrs: false,
  props: imageProps,
  emits: imageEmits,
  setup(props, { attrs, slots, emit, expose }) {
    const context = usePreviewContext();
    const { locale } = useLocale('Image');
    const { state, adapter: baseAdapter } = useBaseComponent<any, ImageState>(
      props as any,
      { src: '', loadStatus: 'loading', previewVisible: false },
      { contexts: () => context as any }
    );
    const imgRef = ref<HTMLImageElement | null>(null);

    const isInGroup = () => Boolean(context && context.isGroup);
    const isLazyLoad = () => (context ? Boolean(context.lazyLoad) : false);

    const adapter = {
      ...baseAdapter,
      getIsInGroup: () => isInGroup(),
    };
    const foundation = new (ImageFoundation as any)(adapter);
    // React reads onLoad / onError from props; route them to the emits
    const propsProxy = new Proxy(props as any, {
      get(target, key) {
        if (key === 'onLoad') return (e: Event) => emit('load', e);
        if (key === 'onError') return (e: Event) => emit('error', e);
        if (key === 'preview' && _isObject(target.preview)) {
          const preview = target.preview as ImagePreviewObject;
          const onVisibleChange = preview.onVisibleChange;
          return {
            ...preview,
            onVisibleChange: (visible: boolean) => {
              onVisibleChange && onVisibleChange(visible);
              emit('previewVisibleChange', visible);
            },
          };
        }
        return Reflect.get(target, key);
      },
    });
    foundation._adapter.getProps = () => propsProxy;
    foundation._adapter.getProp = (key: string) => propsProxy[key];

    // getDerivedStateFromProps
    const deriveState = () => {
      if (props.src !== state.src) {
        state.src = props.src;
        state.loadStatus = 'loading';
      }
      if (_isObject(props.preview)) {
        const { visible } = props.preview as ImagePreviewObject;
        if (_isBoolean(visible)) {
          state.previewVisible = visible;
        }
      }
    };
    deriveState();
    watch(() => [props.src, props.preview], deriveState, { deep: true });

    const handleClick = (e: MouseEvent) => {
      emit('click', e);
      foundation.handleClick(e);
    };
    // the foundation calls its own handlePreviewVisibleChange from handleClick; wrap it so the
    // Vue emit fires for the boolean `preview` form too (the object form emits through its onVisibleChange)
    const originHandlePreviewVisibleChange = foundation.handlePreviewVisibleChange;
    foundation.handlePreviewVisibleChange = (visible: boolean) => {
      originHandlePreviewVisibleChange(visible);
      if (!_isObject(props.preview)) emit('previewVisibleChange', visible);
    };
    const handlePreviewVisibleChange = (visible: boolean) => {
      foundation.handlePreviewVisibleChange(visible);
    };

    const renderDefaultLoading = () => {
      const { width, height } = props;
      return h('div', { class: 'semi-skeleton-image', style: { width: toPx(width), height: toPx(height) } });
    };
    const renderDefaultError = () => h('div', { class: `${prefixCls}-status` }, [h(IconUploadError, { size: 'extra-large' })]);
    const renderLoad = () => {
      const placeholder = slots.placeholder ? slots.placeholder() : normalizeNode(props.placeholder);
      return placeholder ? h('div', { class: `${prefixCls}-status` }, [placeholder]) : renderDefaultLoading();
    };
    const renderError = () => {
      const fallback = slots.fallback ? slots.fallback() : props.fallback;
      const fallbackNode: VNodeChild = typeof fallback === 'string' ? h('img', { style: { width: '100%', height: '100%' }, src: fallback, alt: 'fallback' }) : normalizeNode(fallback);
      return fallback ? h('div', { class: `${prefixCls}-status` }, [fallbackNode]) : renderDefaultError();
    };
    const renderExtra = () => {
      const { loadStatus } = state;
      return h('div', { class: `${prefixCls}-overlay` }, [loadStatus === 'error' ? renderError() : null, loadStatus === 'loading' ? renderLoad() : null]);
    };
    // kept for parity with React (`renderMask`), not rendered by default there either
    const renderMask = () =>
      h('div', { class: `${prefixCls}-mask` }, [h('div', { class: `${prefixCls}-mask-info` }, [h(IconEyeOpened, { size: 'extra-large' }), h('span', { class: `${prefixCls}-mask-info-text` }, locale.value?.preview)])]);

    expose({ foundation, imgRef, renderMask, getImageElement: () => imgRef.value });

    return () => {
      const { src, loadStatus, previewVisible } = state;
      const { width, height, alt, style, className, crossOrigin, preview, imageID: _id, setDownloadName, imgCls, imgStyle } = props;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const outerStyle: CSSProperties = { width: toPx(width), height: toPx(height), ...style };
      const outerCls = cls(prefixCls, className, attrClass);
      const canPreview = loadStatus === 'success' && Boolean(preview) && !isInGroup();
      const showPreviewCursor = Boolean(preview) && loadStatus === 'success';
      const previewSrc = _isObject(preview) ? (preview as ImagePreviewObject).src ?? src : src;
      const previewObj = _isObject(preview) ? (preview as ImagePreviewObject) : undefined;
      const previewProps: Record<string, any> =
        previewObj && canPreview
          ? { ..._omit(previewObj, ['className', 'style', 'previewCls', 'previewStyle', 'visible', 'src', 'onVisibleChange']), className: previewObj.previewCls, style: previewObj.previewStyle }
          : {};
      // React `onXxx` keys inside `preview` become listeners on PreviewInner
      const previewListeners: Record<string, any> = {};
      for (const name of previewInnerEmits) {
        const reactName = `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        previewListeners[reactName] = (...args: any[]) => {
          const cb = previewObj && (previewObj as any)[reactName];
          typeof cb === 'function' && cb(...args);
          emit(name as any, ...args);
        };
      }
      return h('div', { style: [outerStyle, attrStyle], class: outerCls, onClick: handleClick }, [
        h('img', {
          ref: imgRef,
          ...restAttrs,
          src: isInGroup() && isLazyLoad() ? undefined : src,
          'data-src': src,
          alt,
          style: imgStyle,
          class: cls(`${prefixCls}-img`, { [`${prefixCls}-img-preview`]: showPreviewCursor, [`${prefixCls}-img-error`]: loadStatus === 'error', [imgCls as string]: Boolean(imgCls) }),
          width,
          height,
          crossorigin: crossOrigin,
          onError: (e: Event) => foundation.handleError(e),
          onLoad: (e: Event) => foundation.handleLoaded(e),
        }),
        loadStatus !== 'success' ? renderExtra() : null,
        canPreview
          ? h(
              PreviewInner,
              {
                ...previewProps,
                ...previewListeners,
                src: previewSrc,
                visible: previewVisible,
                onVisibleChange: handlePreviewVisibleChange,
                crossOrigin: !_isUndefined(crossOrigin) ? crossOrigin : previewProps.crossOrigin,
                setDownloadName,
              },
              { header: slots.header, closeIcon: slots.closeIcon, leftIcon: slots.leftIcon, rightIcon: slots.rightIcon, previewMenu: slots.previewMenu }
            )
          : null,
      ]);
    };
  },
});
(Image as any).isSemiImage = true;
(Image as any).elementType = 'Image';

export default Image;
