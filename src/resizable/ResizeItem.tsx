import { defineComponent, h, ref, onMounted, onBeforeUnmount, onUpdated } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { ResizeItemFoundation } from '@douyinfe/semi-foundation/lib/es/resizable/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/resizable/constants';
import '@douyinfe/semi-foundation/lib/es/resizable/resizable.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useResizeContext } from './context';

const prefixCls = cssClasses.PREFIX;

export type ResizeCallbackFn = (size: { width: number; height: number }, e: any, dir: string) => void;

export const resizeItemProps = {
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  defaultSize: { type: [String, Number] as PropType<string | number>, default: undefined },
  onResizeStart: { type: Function as PropType<(e: any, dir: string) => void>, default: undefined },
  onChange: { type: Function as PropType<ResizeCallbackFn>, default: undefined },
  onResizeEnd: { type: Function as PropType<ResizeCallbackFn>, default: undefined },
};

const ResizeItem = defineComponent({
  name: 'ResizeItem',
  inheritAttrs: false,
  props: resizeItemProps,
  setup(props, { slots, attrs, expose }) {
    const itemRef = ref<HTMLElement | null>(null);
    const { adapter } = useBaseComponent(props as any, {});
    const foundation = new (ResizeItemFoundation as any)(adapter);
    const context = useResizeContext();
    let itemIndex = -1;
    let direction = context.direction;

    onMounted(() => {
      foundation.init();
      const { min, max, onResizeStart, onChange, onResizeEnd, defaultSize } = props;
      if (itemIndex === -1) {
        itemIndex = context.registerItem(itemRef, min, max, defaultSize, onResizeStart, onChange, onResizeEnd);
      }
      direction = context.direction;
    });
    onUpdated(() => {
      if (context.direction !== direction) {
        direction = context.direction;
        const el = itemRef.value;
        if (!el) return;
        if (direction === 'horizontal') {
          const newWidth = el.style.height;
          el.style.width = newWidth;
          el.style.removeProperty('height');
        } else {
          const newHeight = el.style.width;
          el.style.height = newHeight;
          el.style.removeProperty('width');
        }
      }
    });
    onBeforeUnmount(() => foundation.destroy());

    expose({ itemRef, itemIndex: () => itemIndex });

    return () => {
      const { style, className } = props;
      return h('div', { style: [style, attrs.style as any], class: classNames(className, `${prefixCls}-item`, attrs.class as any), ref: itemRef }, slots.default?.());
    };
  },
});
(ResizeItem as any).elementType = 'ResizeItem';

export default ResizeItem;
