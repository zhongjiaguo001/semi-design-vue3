import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, reactive } from 'vue';
import type { PropType, CSSProperties, Ref } from 'vue';
import classNames from 'classnames';
import { ResizeGroupFoundation } from '@douyinfe/semi-foundation/lib/es/resizable/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/resizable/constants';
import '@douyinfe/semi-foundation/lib/es/resizable/resizable.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { provideResizeContext } from './context';
import type { ResizeContextValue } from './context';

const prefixCls = cssClasses.PREFIX;

export type ResizeGroupDirection = 'horizontal' | 'vertical';

export const resizeGroupProps = {
  direction: { type: String as PropType<ResizeGroupDirection>, default: 'horizontal' },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

interface ResizeGroupState {
  isResizing: boolean;
  originalPosition: { x: number; y: number; lastItemSize: number; nextItemSize: number; lastOffset: number; nextOffset: number };
  backgroundStyle: CSSProperties;
  curHandler: number | null;
}

const ResizeGroup = defineComponent({
  name: 'ResizeGroup',
  inheritAttrs: false,
  props: resizeGroupProps,
  setup(props, { slots, attrs, expose }) {
    const groupRef = ref<HTMLElement | null>(null);
    const itemRefs = new Map<number, Ref<HTMLElement | null>>();
    const itemMinMap = new Map<number, string | undefined>();
    const itemMaxMap = new Map<number, string | undefined>();
    const itemDefaultSizeList = new Map<number, string | number | undefined>();
    const itemResizeStart = new Map<number, ((e: any, dir: string) => void) | undefined>();
    const itemResizing = new Map<number, ((size: { width: number; height: number }, e: any, dir: string) => void) | undefined>();
    const itemResizeEnd = new Map<number, ((size: { width: number; height: number }, e: any, dir: string) => void) | undefined>();
    const handlerRefs = new Map<number, Ref<HTMLElement | null>>();

    const { state, adapter: baseAdapter } = useBaseComponent<any, ResizeGroupState>(props as any, {
      isResizing: false,
      originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0, lastOffset: 0, nextOffset: 0 },
      backgroundStyle: { cursor: 'auto' },
      curHandler: null,
    });
    let foundation: any;

    const registerItem: ResizeContextValue['registerItem'] = (ref, min, max, defaultSize, onResizeStart, onChange, onResizeEnd) => {
      if (Array.from(itemRefs.values()).some((r) => r === ref)) return -1;
      const index = itemRefs.size;
      itemRefs.set(index, ref);
      itemMinMap.set(index, min);
      itemMaxMap.set(index, max);
      itemDefaultSizeList.set(index, defaultSize);
      itemResizeStart.set(index, onResizeStart);
      itemResizing.set(index, onChange);
      itemResizeEnd.set(index, onResizeEnd);
      return index;
    };
    const registerHandler: ResizeContextValue['registerHandler'] = (ref) => {
      if (Array.from(handlerRefs.values()).some((r) => r === ref)) return -1;
      const index = handlerRefs.size;
      handlerRefs.set(index, ref);
      return index;
    };

    const context = reactive({
      direction: props.direction,
      registerItem,
      registerHandler,
      notifyResizeStart: (handlerIndex: number, e: any, type: 'mouse' | 'touch') => foundation.onResizeStart(handlerIndex, e, type),
      getGroupSize: () => {
        const el = groupRef.value;
        return { width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 };
      },
    }) as ResizeContextValue;
    provideResizeContext(context);

    const registerEvent = (type = 'mouse') => {
      if (type === 'mouse') {
        window.addEventListener('mousemove', foundation.onMouseMove);
        window.addEventListener('mouseup', foundation.onResizeEnd);
        window.addEventListener('mouseleave', foundation.onResizeEnd);
      } else {
        window.addEventListener('touchmove', foundation.onTouchMove, { passive: false });
        window.addEventListener('touchend', foundation.onResizeEnd);
        window.addEventListener('touchcancel', foundation.onResizeEnd);
      }
    };
    const unregisterEvent = (type = 'mouse') => {
      if (type === 'mouse') {
        window.removeEventListener('mousemove', foundation.onMouseMove);
        window.removeEventListener('mouseup', foundation.onResizeEnd);
        window.removeEventListener('mouseleave', foundation.onResizeEnd);
      } else {
        window.removeEventListener('touchmove', foundation.onTouchMove);
        window.removeEventListener('touchend', foundation.onResizeEnd);
        window.removeEventListener('touchcancel', foundation.onResizeEnd);
      }
    };

    const adapter = {
      ...baseAdapter,
      getGroupRef: () => groupRef.value,
      getItem: (id: number) => itemRefs.get(id)?.value ?? null,
      getItemCount: () => itemRefs.size,
      getHandler: (id: number) => handlerRefs.get(id)?.value ?? null,
      getHandlerCount: () => handlerRefs.size,
      getItemMin: (index: number) => itemMinMap.get(index),
      getItemMax: (index: number) => itemMaxMap.get(index),
      getItemChange: (index: number) => itemResizing.get(index),
      getItemEnd: (index: number) => itemResizeEnd.get(index),
      getItemStart: (index: number) => itemResizeStart.get(index),
      getItemDefaultSize: (index: number) => itemDefaultSizeList.get(index),
      registerEvents: registerEvent,
      unregisterEvents: unregisterEvent,
    };
    foundation = new (ResizeGroupFoundation as any)(adapter);

    onMounted(() => {
      foundation.init();
      window.addEventListener('resize', foundation.ensureConstraint);
    });
    onBeforeUnmount(() => {
      // ResizeGroupFoundation.destroy() is a no-op; drag listeners live on window
      // and must be dropped here or mousemove after unmount reads a detached group.
      try { unregisterEvent('mouse'); } catch { /* ignore */ }
      try { unregisterEvent('touch'); } catch { /* ignore */ }
      try { foundation.destroy(); } catch { /* ignore */ }
      window.removeEventListener('resize', foundation.ensureConstraint);
      state.isResizing = false;
      state.curHandler = null;
    });

    expose({ foundation, groupRef, getGroupSize: () => ({ width: groupRef.value?.offsetWidth ?? 0, height: groupRef.value?.offsetHeight ?? 0 }) });
    watch(
      () => props.direction,
      (direction) => {
        context.direction = direction;
        foundation.direction = direction;
      }
    );

    return () => {
      const { direction, className } = props;
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      return h(
        'div',
        {
          style: [{ flexDirection: direction === 'vertical' ? 'column' : 'row' }, props.style, attrStyle],
          ref: groupRef,
          class: classNames(className, `${prefixCls}-group`, attrClass),
          ...rest,
        },
        [
          state.isResizing ? h('div', { style: state.backgroundStyle, class: classNames(className, `${prefixCls}-background`) }) : null,
          slots.default?.(),
        ]
      );
    };
  },
});
(ResizeGroup as any).elementType = 'ResizeGroup';

export default ResizeGroup;
