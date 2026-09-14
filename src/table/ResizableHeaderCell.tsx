import { defineComponent, h, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';

export const resizableHeaderCellProps = {
  onResize: { type: Function as PropType<(e: any, data: { size: { width: number; height: number } }) => void>, default: undefined },
  onResizeStart: { type: Function as PropType<(e: any, data?: any) => void>, default: undefined },
  onResizeStop: { type: Function as PropType<(e: any, data?: any) => void>, default: undefined },
  width: { type: [Number, String], default: undefined },
  resize: { type: Boolean, default: undefined },
};

/**
 * Header cell with a horizontal resize handle (Vue counterpart of react-resizable usage).
 * Keeps the `react-resizable` / `react-resizable-handle` class names because the Semi css targets them.
 */
const ResizableHeaderCell = defineComponent({
  name: 'TableResizableHeaderCell',
  inheritAttrs: false,
  props: resizableHeaderCellProps,
  setup(props, { attrs, slots }) {
    let startX = 0;
    let startWidth = 0;
    let dragging = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const width = Math.max(0, startWidth + (e.clientX - startX));
      props.onResize && props.onResize(e, { size: { width, height: 0 } });
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      props.onResizeStop && props.onResizeStop(e, { size: { width: Math.max(0, startWidth + (e.clientX - startX)), height: 0 } });
    };
    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startWidth = typeof props.width === 'number' ? props.width : Number.parseFloat(String(props.width)) || 0;
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
      props.onResizeStart && props.onResizeStart(e, { size: { width: startWidth, height: 0 } });
    };
    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
    });

    return () => {
      const { width, resize } = props;
      const children = slots.default ? slots.default() : [];
      if (typeof width !== 'number' || resize === false) {
        return h('th', { ...attrs }, children);
      }
      const { class: className, ...rest } = attrs as any;
      return h('th', { ...rest, class: [className, 'react-resizable'] }, [
        ...children,
        h('span', {
          class: 'react-resizable-handle react-resizable-handle-se',
          style: { zIndex: 2, pointerEvents: 'auto' },
          onMousedown: onMouseDown,
          onClick: (e: MouseEvent) => e.stopPropagation(),
        }),
      ]);
    };
  },
});

export default ResizableHeaderCell;
