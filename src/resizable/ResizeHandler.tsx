import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { ResizeHandlerFoundation } from '@douyinfe/semi-foundation/lib/es/resizable/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/resizable/constants';
import '@douyinfe/semi-foundation/lib/es/resizable/resizable.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useResizeContext } from './context';
import { IconHandle } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export const resizeHandlerProps = {
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  onResizeStart: { type: Function as PropType<(e: MouseEvent, direction: string) => void>, default: undefined },
  disabled: { type: Boolean, default: undefined },
};

const ResizeHandler = defineComponent({
  name: 'ResizeGroupHandler',
  inheritAttrs: false,
  props: resizeHandlerProps,
  setup(props, { slots, attrs, expose }) {
    const handlerRef = ref<HTMLElement | null>(null);
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const context = useResizeContext();
    let foundation: any;
    let handlerIndex = -1;

    const onMouseDown = (e: MouseEvent) => {
      const { notifyResizeStart } = context;
      notifyResizeStart(handlerIndex, e, 'mouse');
    };
    const onTouchStart = (e: TouchEvent) => {
      const { notifyResizeStart } = context;
      notifyResizeStart(handlerIndex, (e as any).targetTouches[0], 'touch');
    };

    const adapter = {
      ...baseAdapter,
      registerEvents: () => {
        handlerRef.value?.addEventListener('mousedown', onMouseDown);
        handlerRef.value?.addEventListener('touchstart', onTouchStart);
      },
      unregisterEvents: () => {
        handlerRef.value?.removeEventListener('mousedown', onMouseDown);
        handlerRef.value?.removeEventListener('touchstart', onTouchStart);
      },
    };
    foundation = new (ResizeHandlerFoundation as any)(adapter);

    onMounted(() => {
      foundation.init();
      if (handlerIndex === -1) {
        handlerIndex = context.registerHandler(handlerRef);
      }
    });
    onBeforeUnmount(() => foundation.destroy());

    expose({ getHandler: () => handlerRef.value, handlerIndex: () => handlerIndex });

    return () => {
      const { style, className } = props;
      const { direction } = context;
      return h(
        'div',
        {
          class: classNames(className, `${prefixCls}-handler`, `${prefixCls}-handler-${direction}`, attrs.class as any),
          style: [style, attrs.style as any],
          ref: handlerRef,
        },
        slots.default
          ? slots.default()
          : [h(IconHandle, { size: 'inherit', style: { rotate: direction === 'horizontal' ? '0deg' : '90deg' } })]
      );
    };
  },
});
(ResizeHandler as any).elementType = 'ResizeGroupHandler';

export default ResizeHandler;
