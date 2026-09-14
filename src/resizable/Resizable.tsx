import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import classNames from 'classnames';
import { ResizableFoundation } from '@douyinfe/semi-foundation/lib/es/resizable/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/resizable/constants';
import { directions } from '@douyinfe/semi-foundation/lib/es/resizable/types';
import '@douyinfe/semi-foundation/lib/es/resizable/resizable.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import ResizableHandler from './ResizableHandler';

const prefixCls = cssClasses.PREFIX;

export type ResizeDirection = (typeof directions)[number];
export interface ResizeSize {
  width?: string | number;
  height?: string | number;
}
export type ResizeEnable = Partial<Record<ResizeDirection, boolean>> | false;
export type HandleStyle = Partial<Record<ResizeDirection, CSSProperties>>;
export type HandleClassName = Partial<Record<ResizeDirection, string>>;
export type HandleNode = Partial<Record<ResizeDirection, any>>;
export type ResizeCallback = (size: ResizeSize, e: any, direction: ResizeDirection) => void;
export type ResizeStartCallback = (e: any, direction: ResizeDirection) => void | boolean;

export const resizableProps = {
  style: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  className: { type: String, default: undefined },
  grid: { type: Array as PropType<number[]>, default: () => [1, 1] },
  snap: { type: Object as PropType<{ x?: number[]; y?: number[] }>, default: undefined },
  snapGap: { type: Number, default: 0 },
  bounds: { type: [String, Object] as PropType<any>, default: undefined },
  boundsByDirection: { type: Boolean, default: undefined },
  size: { type: Object as PropType<ResizeSize>, default: undefined },
  minWidth: { type: [String, Number] as PropType<string | number>, default: undefined },
  minHeight: { type: [String, Number] as PropType<string | number>, default: undefined },
  maxWidth: { type: [String, Number] as PropType<string | number>, default: undefined },
  maxHeight: { type: [String, Number] as PropType<string | number>, default: undefined },
  lockAspectRatio: { type: [Boolean, Number] as PropType<boolean | number>, default: false },
  lockAspectRatioExtraWidth: { type: Number, default: 0 },
  lockAspectRatioExtraHeight: { type: Number, default: 0 },
  enable: { type: [Object, Boolean] as PropType<ResizeEnable>, default: undefined },
  handleStyle: { type: Object as PropType<HandleStyle>, default: undefined },
  handleClass: { type: Object as PropType<HandleClassName>, default: undefined },
  handleWrapperStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  handleWrapperClass: { type: String, default: undefined },
  handleNode: { type: Object as PropType<HandleNode>, default: undefined },
  defaultSize: { type: Object as PropType<ResizeSize>, default: undefined },
  scale: { type: Number, default: 1 },
  ratio: { type: [Number, Array] as PropType<number | number[]>, default: 1 },
  boundElement: { type: [String, Object] as PropType<any>, default: undefined },
  onResizeStart: { type: Function as PropType<ResizeStartCallback>, default: undefined },
  onChange: { type: Function as PropType<ResizeCallback>, default: undefined },
  onResizeEnd: { type: Function as PropType<ResizeCallback>, default: undefined },
};

export const resizableEmits = ['resizeStart', 'change', 'resizeEnd'];

interface ResizableState {
  isResizing: boolean;
  width: number | string;
  height: number | string;
  direction: ResizeDirection;
  original: { x: number; y: number; width: number; height: number };
  backgroundStyle: CSSProperties;
  flexBasis?: string | number;
}

const Resizable = defineComponent({
  name: 'Resizable',
  inheritAttrs: false,
  props: resizableProps,
  emits: resizableEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const resizableRef = ref<HTMLElement | null>(null);
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, ResizableState>(props as any, {
      isResizing: false,
      width: 'auto',
      height: 'auto',
      direction: 'right',
      original: { x: 0, y: 0, width: 0, height: 0 },
      backgroundStyle: { cursor: 'auto' },
      flexBasis: undefined,
    });
    // React initialises state from `propSize` in the constructor; init() early-returns before
    // the first resize, so the initial size must be seeded here
    const propSize = (props.size || props.defaultSize) || { width: 'auto', height: 'auto' };
    state.width = propSize.width ?? 'auto';
    state.height = propSize.height ?? 'auto';
    let foundation: any;
    const adapter = {
      ...baseAdapter,
      getResizable: () => resizableRef.value,
      registerEvent: (type = 'mouse') => {
        if (type === 'mouse') {
          window?.addEventListener('mouseup', foundation.onMouseUp);
          window?.addEventListener('mousemove', foundation.onMouseMove);
          window?.addEventListener('mouseleave', foundation.onMouseUp);
        } else {
          window?.addEventListener('touchmove', foundation.onTouchMove, { passive: false });
          window?.addEventListener('touchend', foundation.onMouseUp);
          window?.addEventListener('touchcancel', foundation.onMouseUp);
        }
      },
      unregisterEvent: (type = 'mouse') => {
        if (type === 'mouse') {
          window?.removeEventListener('mouseup', foundation.onMouseUp);
          window?.removeEventListener('mousemove', foundation.onMouseMove);
          window?.removeEventListener('mouseleave', foundation.onMouseUp);
        } else {
          window?.removeEventListener('touchmove', foundation.onTouchMove);
          window?.removeEventListener('touchend', foundation.onMouseUp);
          window?.removeEventListener('touchcancel', foundation.onMouseUp);
        }
      },
    };
    // React reads the callbacks from props; route them to emits
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onChange') return (size: ResizeSize, e: any, direction: ResizeDirection) => emit('change', size, e, direction);
        if (key === 'onResizeStart') {
          const original = target.onResizeStart;
          return (e: any, direction: ResizeDirection) => {
            emit('resizeStart', e, direction);
            // React lets onResizeStart cancel the resize by returning false; support that via the prop
            if (typeof original === 'function') {
              return original(e, direction);
            }
            return undefined;
          };
        }
        if (key === 'onResizeEnd') return (size: ResizeSize, e: any, direction: ResizeDirection) => emit('resizeEnd', size, e, direction);
        if (key === 'boundElement') return target.boundElement ?? target.bounds;
        return Reflect.get(target, key);
      },
    });
    foundation = new (ResizableFoundation as any)(adapter);
    foundation._adapter.getProps = () => propsProxy;
    foundation._adapter.getProp = (key: string) => propsProxy[key];

    const enableMap = () => {
      const enable = props.enable;
      if (enable === false) return false;
      if (enable && typeof enable === 'object') return enable;
      return { top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
    };

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    // controlled `size`: keep the state in sync like React's setState-after-change
    watch(
      () => props.size,
      (size) => {
        if (size) {
          state.width = size.width ?? 'auto';
          state.height = size.height ?? 'auto';
        }
      },
      { deep: true }
    );

    expose({ foundation, getResizable: () => resizableRef.value });

    const renderResizeHandler = () => {
      const { handleStyle, handleClass, handleNode, handleWrapperStyle, handleWrapperClass } = props;
      const enable = enableMap();
      if (!enable) return null;
      const handlers = directions.map((dir) => {
        if ((enable as any)[dir] === false) return null;
        return h(
          ResizableHandler,
          {
            key: dir,
            direction: dir,
            onResizeStart: (e: any) => foundation.onResizeStart(e, dir, 'mouse'),
            style: handleStyle && handleStyle[dir],
            className: handleClass && handleClass[dir],
          },
          { default: () => (handleNode && handleNode[dir] !== undefined ? normalizeNode(handleNode[dir]) : null) }
        );
      });
      return h('div', { class: handleWrapperClass, style: handleWrapperStyle }, handlers);
    };

    return () => {
      const { className, style, maxHeight, maxWidth, minHeight, minWidth } = props;
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const resizeStyle: CSSProperties = {
        userSelect: state.isResizing ? 'none' : 'auto',
        maxWidth: maxWidth as any,
        maxHeight: maxHeight as any,
        minWidth: minWidth as any,
        minHeight: minHeight as any,
        ...style,
        ...foundation.sizeStyle,
      };
      if (state.flexBasis) {
        resizeStyle.flexBasis = state.flexBasis;
      }
      return h(
        'div',
        {
          style: [resizeStyle, attrStyle],
          class: classNames(className, `${prefixCls}-resizable`, attrClass),
          ref: resizableRef,
          ...getDataAttr(rest),
        },
        [
          state.isResizing ? h('div', { style: state.backgroundStyle, class: classNames(className, `${prefixCls}-background`) }) : null,
          slots.default?.(),
          renderResizeHandler(),
        ]
      );
    };
  },
});
(Resizable as any).elementType = 'Resizable';

export default Resizable;
