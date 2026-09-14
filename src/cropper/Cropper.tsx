import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { isUndefined } from 'lodash';
import CropperFoundation from '@douyinfe/semi-foundation/lib/es/cropper/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/cropper/constants';
import '@douyinfe/semi-foundation/lib/es/cropper/cropper.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, toCssStyle } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const cropperProps = {
  src: { type: String, default: undefined },
  imgProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  shape: { type: String as PropType<'rect' | 'round' | 'roundRect'>, default: 'rect' },
  aspectRatio: { type: Number, default: undefined },
  defaultAspectRatio: { type: Number, default: 1 },
  zoom: { type: Number, default: undefined },
  rotate: { type: Number, default: undefined },
  showResizeBox: { type: Boolean, default: true },
  cropperBoxStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  cropperBoxCls: { type: String, default: undefined },
  /** alias of cropperBoxCls (name used in the official API table) */
  cropperBoxClassName: { type: String, default: undefined },
  fill: { type: String, default: 'rgba(0, 0, 0, 0)' },
  maxZoom: { type: Number, default: 3 },
  minZoom: { type: Number, default: 0.1 },
  zoomStep: { type: Number, default: 0.1 },
  preview: { type: Function as PropType<() => HTMLElement>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const cropperEmits = ['zoomChange', 'update:zoom'];

const Cropper = defineComponent({
  name: 'Cropper',
  inheritAttrs: false,
  props: cropperProps,
  emits: cropperEmits,
  setup(props, { attrs, emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const imgRef = ref<HTMLImageElement | null>(null);
    let resizeObserver: ResizeObserver | null = null;

    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      imgData: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
      cropperBox: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
      zoom: 1,
      rotate: 0,
      loaded: false,
    });

    const adapter = {
      ...baseAdapter,
      getContainer: () => containerRef.value as HTMLElement,
      notifyZoomChange: (zoom: number) => {
        emit('update:zoom', zoom);
        emit('zoomChange', zoom);
      },
      getImg: () => imgRef.value,
    };
    const foundation = new (CropperFoundation as any)(adapter);

    const applyDerived = (newRotate?: number, newZoom?: number) => {
      const { rotate, zoom, imgData, cropperBox, loaded } = state as any;
      if (!loaded) return;
      let nextWidth = imgData.width;
      let nextHeight = imgData.height;
      let nextImgCenter = { ...imgData.centerPoint };
      const nextState: Record<string, any> = {};
      if (!isUndefined(newRotate) && newRotate !== rotate) {
        nextState.rotate = newRotate;
        const rotateCenter = { x: cropperBox.centerPoint.x, y: -cropperBox.centerPoint.y };
        const imgCenter = { x: imgData.centerPoint.x, y: -imgData.centerPoint.y };
        const angle = ((newRotate - rotate) * Math.PI) / 180;
        nextImgCenter = {
          x: (imgCenter.x - rotateCenter.x) * Math.cos(angle) + (imgCenter.y - rotateCenter.y) * Math.sin(angle) + rotateCenter.x,
          y: -(-(imgCenter.x - rotateCenter.x) * Math.sin(angle) + (imgCenter.y - rotateCenter.y) * Math.cos(angle) + rotateCenter.y),
        };
      }
      if (!isUndefined(newZoom) && newZoom !== zoom) {
        nextState.zoom = newZoom;
        const scaleCenter = { x: cropperBox.centerPoint.x, y: -cropperBox.centerPoint.y };
        const currentImgCenter = { x: nextImgCenter.x, y: -nextImgCenter.y };
        nextWidth = (imgData.width / zoom) * newZoom;
        nextHeight = (imgData.height / zoom) * newZoom;
        nextImgCenter = {
          x: ((currentImgCenter.x - scaleCenter.x) / zoom) * newZoom + scaleCenter.x,
          y: -(((currentImgCenter.y - scaleCenter.y) / zoom) * newZoom + scaleCenter.y),
        };
      }
      if (newRotate !== rotate || newZoom !== zoom) {
        nextState.imgData = { width: nextWidth, height: nextHeight, centerPoint: nextImgCenter };
      }
      Object.assign(state, nextState);
    };

    watch(
      () => [props.rotate, props.zoom] as const,
      ([rotate, zoom]) => applyDerived(rotate, zoom)
    );
    // React getDerivedStateFromProps also applies controlled rotate/zoom right after the image loads
    watch(
      () => (state as any).loaded,
      (loaded) => {
        if (loaded) applyDerived(props.rotate, props.zoom);
      }
    );

    const unRegisterImageWrapRef = () => {
      if (containerRef.value) {
        containerRef.value.removeEventListener('wheel', foundation.handleWheel);
      }
    };
    const registryImageWrapRef = (el: any) => {
      unRegisterImageWrapRef();
      containerRef.value = el;
      if (el) {
        el.addEventListener('wheel', foundation.handleWheel, { passive: false });
      }
    };

    onMounted(() => {
      foundation.init();
      if (containerRef.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => foundation.handleResize());
        resizeObserver.observe(containerRef.value);
      }
    });
    onBeforeUnmount(() => {
      foundation.destroy();
      unRegisterImageWrapRef();
      resizeObserver?.disconnect();
    });

    expose({ getCropperCanvas: () => foundation.getCropperCanvas(), foundation, state });

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { imgData, cropperBox, rotate, loaded } = state as any;
      const imgX = imgData.centerPoint.x - imgData.width / 2;
      const imgY = imgData.centerPoint.y - imgData.height / 2;
      const cropperBoxX = cropperBox.centerPoint.x - cropperBox.width / 2;
      const cropperBoxY = cropperBox.centerPoint.y - cropperBox.height / 2;
      const cropperImgX = imgX - cropperBoxX;
      const cropperImgY = imgY - cropperBoxY;
      foundation.updatePreview({
        width: imgData.width,
        height: imgData.height,
        translateX: cropperImgX,
        translateY: cropperImgY,
        rotate,
      });
      const shape = props.shape || 'rect';
      const cropperBoxCls = props.cropperBoxCls || props.cropperBoxClassName;
      return h(
        'div',
        {
          class: cls(prefixCls, props.className, attrClass),
          style: [props.style, attrStyle],
          ref: registryImageWrapRef,
          ...getDataAttr(rest),
        },
        [
          h('div', { class: cssClasses.IMG_WRAPPER }, [
            h('img', {
              ref: imgRef,
              src: props.src,
              onLoad: (e: Event) => foundation.handleImageLoad(e),
              class: cssClasses.IMG,
              crossorigin: 'anonymous',
              ...(props.imgProps || {}),
              style: toCssStyle({
                width: imgData.width,
                height: imgData.height,
                transformOrigin: 'center',
                transform: `translate(${imgX}px, ${imgY}px) rotate(${rotate}deg)`,
              }),
            }),
          ]),
          h('div', { class: cssClasses.MASK, onMousedown: (e: MouseEvent) => foundation.handleMaskMouseDown(e) }),
          h(
            'div',
            {
              class: cls(cssClasses.CROPPER_BOX, {
                [cropperBoxCls as string]: Boolean(cropperBoxCls),
                [cssClasses.CROPPER_VIEW_BOX_ROUND]: shape === 'round',
              }),
              style: toCssStyle({
                ...(props.cropperBoxStyle || {}),
                width: cropperBox.width,
                height: cropperBox.height,
                transform: `translate(${cropperBoxX}px, ${cropperBoxY}px)`,
              }),
              onMousedown: (e: MouseEvent) => foundation.handleCropperBoxMouseDown(e),
            },
            [
              h(
                'div',
                { class: cls(cssClasses.CROPPER_VIEW_BOX, { [cssClasses.CROPPER_VIEW_BOX_ROUND]: String(shape).includes('round') }) },
                [
                  h('img', {
                    onDragstart: (e: DragEvent) => foundation.viewIMGDragStart(e),
                    class: cssClasses.CROPPER_IMG,
                    src: props.src,
                    style: toCssStyle({
                      width: imgData.width,
                      height: imgData.height,
                      transformOrigin: 'center',
                      transform: `translate(${cropperImgX}px, ${cropperImgY}px) rotate(${rotate}deg)`,
                    }),
                  }),
                ]
              ),
              loaded && props.showResizeBox
                ? (shape === 'round' ? strings.roundCorner : strings.corner).map((corner: string) =>
                    h('div', {
                      class: cls(cssClasses.CORNER, `${cssClasses.CORNER}-${corner}`),
                      'data-dir': corner,
                      key: corner,
                      onMousedown: (e: MouseEvent) => foundation.handleCornerMouseDown(e),
                    })
                  )
                : null,
            ]
          ),
        ]
      );
    };
  },
});

(Cropper as any).elementType = 'Cropper';
export default Cropper;
