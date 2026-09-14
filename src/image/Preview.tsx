import { defineComponent, h, ref, watch, onMounted, onUpdated, onBeforeUnmount, reactive, cloneVNode, isVNode, Fragment } from 'vue';
import type { PropType, CSSProperties, VNode, VNodeChild } from 'vue';
import cls from 'classnames';
import _isObject from 'lodash/isObject';
import _isEqual from 'lodash/isEqual';
import _omit from 'lodash/omit';
import PreviewFoundation from '@douyinfe/semi-foundation/lib/es/image/previewFoundation';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/image/constants';
import '@douyinfe/semi-foundation/lib/es/image/image.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import PreviewInner, { previewInnerProps, previewInnerEmits } from './PreviewInner';
import { providePreviewContext } from './previewContext';
import type { PreviewContextProps } from './previewContext';

const prefixCls = cssClasses.PREFIX;

const { visible: _v, src: _s, currentIndex: _ci, className: _cn, style: _st, ...restInnerProps } = previewInnerProps;

export const previewProps = {
  ...restInnerProps,
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  visible: { type: Boolean, default: undefined },
  src: { type: [String, Array] as PropType<string | string[]>, default: () => [] },
  currentIndex: { type: Number, default: undefined },
  defaultCurrentIndex: { type: Number, default: undefined },
  defaultVisible: { type: Boolean, default: undefined },
  lazyLoad: { type: Boolean, default: true },
  lazyLoadMargin: { type: String, default: '0px 100px 100px 0px' },
  previewCls: { type: String, default: undefined },
  previewStyle: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const previewEmits = ['update:visible', 'update:currentIndex', ...previewInnerEmits];

interface PreviewState {
  currentIndex: number;
  visible: boolean;
}

const Preview = defineComponent({
  name: 'ImagePreview',
  inheritAttrs: false,
  props: previewProps,
  emits: previewEmits,
  setup(props, { attrs, slots, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, PreviewState>(props as any, {
      currentIndex: props.currentIndex || props.defaultCurrentIndex || 0,
      visible: props.visible || props.defaultVisible || false,
    });
    const adapter = { ...baseAdapter };
    const foundation = new (PreviewFoundation as any)(adapter);
    // route React callbacks used by the foundation to emits
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onVisibleChange') return (v: boolean) => emit('visibleChange', v);
        if (key === 'onChange') return (i: number) => emit('change', i);
        return Reflect.get(target, key);
      },
      has(target, key) {
        return Reflect.has(target, key);
      },
    });
    foundation._adapter.getProps = () => propsProxy;
    foundation._adapter.getProp = (key: string) => propsProxy[key];

    const previewGroupId = getUuidShort({ prefix: 'semi-image-preview-group', length: 4 });
    const previewRef = ref<any>(null);
    let previewObserver: IntersectionObserver | null = null;
    let cachedChildrenKeys: any[] = [];

    const observerImages = () => {
      if (typeof IntersectionObserver === 'undefined') return;
      if (previewObserver) {
        previewObserver.disconnect();
      } else {
        previewObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((item) => {
              const target = item.target as HTMLImageElement;
              const src = target.dataset?.src;
              if (item.isIntersecting && src) {
                target.src = src;
                target.removeAttribute('data-src');
                previewObserver!.unobserve(target);
              }
            });
          },
          { root: document.querySelector(`#${previewGroupId}`), rootMargin: props.lazyLoadMargin }
        );
      }
      const allImgElement = document.querySelectorAll(`.${prefixCls}-img`);
      allImgElement.forEach((item) => previewObserver!.observe(item));
    };

    const handleVisibleChange = (newVisible: boolean) => {
      emit('update:visible', newVisible);
      foundation.handleVisibleChange(newVisible);
      // React re-derives controlled state from props on every render (getDerivedStateFromProps)
      if ('visible' in propsView) state.visible = Boolean(props.visible);
    };
    const handleCurrentIndexChange = (index: number) => {
      emit('update:currentIndex', index);
      foundation.handleCurrentIndexChange(index);
      if ('currentIndex' in propsView) state.currentIndex = props.currentIndex as number;
    };

    // getDerivedStateFromProps
    watch(
      () => [props.currentIndex, props.visible],
      () => {
        if ('currentIndex' in propsView && props.currentIndex !== state.currentIndex) {
          state.currentIndex = props.currentIndex as number;
        }
        if ('visible' in propsView && props.visible !== state.visible) {
          state.visible = Boolean(props.visible);
        }
      }
    );

    const context = reactive({
      isGroup: true,
      previewSrc: [] as string[],
      titles: [] as any[],
      currentIndex: state.currentIndex,
      visible: state.visible,
      lazyLoad: props.lazyLoad,
      previewObserver: null,
      setCurrentIndex: handleCurrentIndexChange,
      handleVisibleChange,
      setDownloadName: props.setDownloadName,
    }) as PreviewContextProps;
    providePreviewContext(context);

    const loopImageIndex = () => {
      let index = 0;
      const srcListInChildren: string[] = [];
      const titles: any[] = [];
      const loop = (children: VNodeChild): VNodeChild => {
        if (Array.isArray(children)) return children.map((c) => loop(c)) as any;
        const child = children as any;
        if (!isVNode(child)) return child;
        const type: any = child.type;
        if (type && typeof type === 'object' && type.isSemiImage) {
          const { src, preview, alt: _a } = (child.props || {}) as any;
          const previewValue = preview === undefined ? true : preview;
          if (previewValue) {
            const previewSrc = _isObject(previewValue) ? (previewValue as any).src ?? src : src;
            srcListInChildren.push(previewSrc);
            titles.push(_isObject(previewValue) ? (previewValue as any).previewTitle : undefined);
            return cloneVNode(child, { imageID: index++ });
          }
          return child;
        }
        if (child.type === Fragment || typeof child.type === 'string') {
          if (Array.isArray(child.children)) {
            const cloned = cloneVNode(child);
            cloned.children = loop(child.children as any) as any;
            return cloned;
          }
          return child;
        }
        if (typeof child.type === 'object' && child.children && typeof child.children === 'object' && !Array.isArray(child.children)) {
          const childSlots = child.children as Record<string, any>;
          if (typeof childSlots.default === 'function') {
            const original = childSlots.default;
            const cloned = cloneVNode(child);
            cloned.children = { ...childSlots, default: (...args: any[]) => loop(original(...args)) } as any;
            return cloned;
          }
        }
        return child;
      };
      const newChildren = loop(slots.default ? slots.default() : []);
      return { srcListInChildren, newChildren, titles };
    };

    onMounted(() => {
      props.lazyLoad && observerImages();
    });
    onUpdated(() => {
      if (props.lazyLoad) {
        const keys = (slots.default ? slots.default() : []).map((c: any) => (isVNode(c) ? c.key : null));
        if (!_isEqual(cachedChildrenKeys, keys)) {
          cachedChildrenKeys = keys;
          observerImages();
        }
      }
    });
    onBeforeUnmount(() => {
      if (previewObserver) {
        previewObserver.disconnect();
        previewObserver = null;
      }
    });

    expose({ foundation, previewRef, previewGroupId });

    return () => {
      const { src, className, style, lazyLoad, setDownloadName, previewCls, previewStyle } = props;
      const { currentIndex, visible } = state;
      const { srcListInChildren, newChildren, titles } = loopImageIndex();
      const srcArr = Array.isArray(src) ? src : typeof src === 'string' ? [src] : [];
      const finalSrcList = [...srcArr, ...srcListInChildren];
      // keep context in sync
      context.previewSrc = finalSrcList;
      context.titles = titles;
      context.currentIndex = currentIndex;
      context.visible = visible;
      context.lazyLoad = lazyLoad;
      context.previewObserver = previewObserver;
      context.setDownloadName = setDownloadName;

      const innerProps = _omit(props as any, ['src', 'className', 'style', 'lazyLoad', 'lazyLoadMargin', 'setDownloadName', 'previewCls', 'previewStyle', 'visible', 'currentIndex', 'defaultVisible', 'defaultCurrentIndex']);
      const listeners: Record<string, any> = {};
      for (const name of previewInnerEmits) {
        if (name === 'visibleChange' || name === 'change') continue;
        listeners[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = (...args: any[]) => emit(name as any, ...args);
      }
      const { class: attrClass, style: attrStyle } = attrs as any;
      return [
        h('div', { id: previewGroupId, style: [style, attrStyle], class: cls(`${prefixCls}-preview-group`, className, attrClass) }, [newChildren]),
        h(
          PreviewInner,
          {
            ...innerProps,
            ...listeners,
            className: previewCls,
            style: previewStyle,
            ref: previewRef,
            src: finalSrcList,
            currentIndex,
            visible,
            setDownloadName,
            onVisibleChange: handleVisibleChange,
            onChange: (i: number) => emit('change', i),
          },
          { header: slots.header, closeIcon: slots.closeIcon, leftIcon: slots.leftIcon, rightIcon: slots.rightIcon, previewMenu: slots.previewMenu }
        ),
      ];
    };
  },
});
(Preview as any).elementType = 'ImagePreview';

export default Preview;
