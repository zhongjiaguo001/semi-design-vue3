import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/image/constants';
import PreviewImageFoundation from '@douyinfe/semi-foundation/lib/es/image/previewImageFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import Spin from '../spin/Spin';

const prefixCls = cssClasses.PREFIX;
const preViewImgPrefixCls = `${prefixCls}-preview-image`;

export type RatioType = 'adaptation' | 'realSize';

export const previewImageProps = {
  src: { type: String, default: undefined },
  rotation: { type: Number, default: 0 },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  maxZoom: { type: Number, default: undefined },
  minZoom: { type: Number, default: undefined },
  zoom: { type: Number, default: undefined },
  ratio: { type: String as PropType<RatioType>, default: undefined },
  disableDownload: { type: Boolean, default: false },
  clickZoom: { type: Number, default: undefined },
  initialZoom: { type: Number, default: undefined },
  crossOrigin: { type: String as PropType<'anonymous' | 'use-credentials'>, default: undefined },
  setRatio: { type: Function as PropType<(type: RatioType) => void>, default: undefined },
  onZoom: { type: Function as PropType<(zoom: number, notify?: boolean) => void>, default: undefined },
  onLoad: { type: Function as PropType<(src: string) => void>, default: undefined },
  onError: { type: Function as PropType<(src: string) => void>, default: undefined },
};

interface PreviewImageState {
  width: number;
  height: number;
  loading: boolean;
  translate: { x: number; y: number };
  currZoom: number | undefined;
}

const PreviewImage = defineComponent({
  name: 'PreviewImage',
  props: previewImageProps,
  setup(props, { expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, PreviewImageState>(props as any, {
      width: 0,
      height: 0,
      loading: true,
      translate: { x: 0, y: 0 },
      currZoom: props.zoom,
    });
    const containerRef = ref<HTMLElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);

    const adapter = {
      ...baseAdapter,
      getContainer: () => containerRef.value,
      getImage: () => imageRef.value,
      setLoading: (loading: boolean) => {
        state.loading = loading;
      },
      setImageCursor: (canDrag: boolean) => {
        if (imageRef.value) imageRef.value.style.cursor = canDrag ? 'grab' : 'default';
      },
    };
    const foundation = new (PreviewImageFoundation as any)(adapter);

    const onWindowResize = () => foundation.handleWindowResize();

    onMounted(() => {
      foundation.init();
      window.addEventListener('resize', onWindowResize);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', onWindowResize);
    });

    // componentDidUpdate
    watch(
      () => [props.src, props.zoom, props.ratio, props.rotation],
      ([src, zoom, ratio, rotation], [prevSrc, _prevZoom, prevRatio, prevRotation]) => {
        const zoomChange = 'zoom' in propsView && zoom !== state.currZoom;
        const srcChange = src && src !== prevSrc;
        if (srcChange) {
          foundation.setLoading(true);
        }
        if (!zoomChange && !srcChange) {
          if ('ratio' in propsView && ratio !== prevRatio) {
            foundation.handleRatioChange();
          }
          if ('rotation' in propsView && rotation !== prevRotation) {
            onWindowResize();
          }
        }
      }
    );

    expose({ foundation });

    return () => {
      const { src, rotation, crossOrigin } = props;
      const { loading, width, height, translate } = state;
      const imgStyle: CSSProperties = {
        position: 'absolute',
        visibility: loading ? 'hidden' : 'visible',
        transform: `translate(${translate.x}px, ${translate.y}px) rotate(${rotation}deg)`,
        width: `${width}px`,
        height: `${height}px`,
      };
      return h('div', { class: preViewImgPrefixCls, ref: containerRef }, [
        h('img', {
          ref: imageRef,
          src,
          alt: 'previewImag',
          class: `${preViewImgPrefixCls}-img`,
          key: src,
          onMousemove: (e: MouseEvent) => foundation.handleImageMove(e),
          onMousedown: (e: MouseEvent) => foundation.handleImageMouseDown(e),
          onContextmenu: (e: MouseEvent) => foundation.handleRightClickImage(e),
          onDragstart: (e: DragEvent) => e.preventDefault(),
          onLoad: (e: Event) => foundation.handleLoad(e),
          onError: (e: Event) => foundation.handleError(e),
          style: imgStyle,
          crossorigin: crossOrigin,
        }),
        loading ? h(Spin, { size: 'large', wrapperClassName: `${preViewImgPrefixCls}-spin` }) : null,
      ]);
    };
  },
});

export default PreviewImage;
