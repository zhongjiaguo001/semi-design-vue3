import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { ResizableHandlerFoundation } from '@douyinfe/semi-foundation/lib/es/resizable/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/resizable/constants';
import '@douyinfe/semi-foundation/lib/es/resizable/resizable.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import type { ResizeDirection } from './Resizable';

const prefixCls = cssClasses.PREFIX;

export const resizableHandlerProps = {
  direction: { type: String as PropType<ResizeDirection>, default: 'right' },
  onResizeStart: { type: Function as PropType<(e: MouseEvent, direction: string, type: string) => void>, default: undefined },
  className: { type: String, default: undefined },
  disabled: { type: Boolean, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const ResizableHandler = defineComponent({
  name: 'ResizableHandler',
  inheritAttrs: false,
  props: resizableHandlerProps,
  setup(props, { slots, attrs }) {
    const resizeHandlerRef = ref<HTMLElement | null>(null);
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    let foundation: any;
    const adapter = {
      ...baseAdapter,
      registerEvent: () => {
        resizeHandlerRef.value?.addEventListener('mousedown', foundation.onMouseDown);
        resizeHandlerRef.value?.addEventListener('touchstart', foundation.onTouchStart);
      },
      unregisterEvent: () => {
        resizeHandlerRef.value?.removeEventListener('mousedown', foundation.onMouseDown);
        resizeHandlerRef.value?.removeEventListener('touchstart', foundation.onTouchStart);
      },
    };
    foundation = new (ResizableHandlerFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    return () => {
      const { className, style, direction } = props;
      return h(
        'div',
        {
          class: classNames(className, `${prefixCls}-resizableHandler`, `${prefixCls}-resizableHandler-${direction}`, attrs.class as any),
          style: [style, attrs.style as any],
          ref: resizeHandlerRef,
        },
        slots.default?.()
      );
    };
  },
});

export default ResizableHandler;
