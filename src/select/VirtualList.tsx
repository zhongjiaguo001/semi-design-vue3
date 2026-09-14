import { defineComponent, h, ref, computed } from 'vue';
import type { PropType, CSSProperties } from 'vue';

/**
 * Minimal fixed-size virtual list (the Vue counterpart of react-window's FixedSizeList
 * as used by Select). Renders only the rows intersecting the viewport (+ overscan).
 * In environments without layout (jsdom) `height` is still honoured through the props,
 * and scrolling is driven by the container's scrollTop.
 */
export const virtualListProps = {
  height: { type: Number, default: 270 },
  width: { type: [String, Number] as PropType<string | number>, default: '100%' },
  itemSize: { type: Number, default: 36 },
  itemCount: { type: Number, default: 0 },
  overscanCount: { type: Number, default: 2 },
  renderItem: { type: Function as PropType<(index: number, style: CSSProperties) => any>, required: true },
  direction: { type: String, default: undefined },
};

const VirtualList = defineComponent({
  name: 'SelectVirtualList',
  props: virtualListProps,
  setup(props, { expose }) {
    const outerRef = ref<HTMLElement | null>(null);
    const scrollOffset = ref(0);

    const range = computed(() => {
      const { itemSize, itemCount, height, overscanCount } = props;
      if (!itemCount) return [0, -1];
      const start = Math.max(0, Math.floor(scrollOffset.value / itemSize) - overscanCount);
      const visible = Math.ceil(height / itemSize);
      const end = Math.min(itemCount - 1, Math.floor(scrollOffset.value / itemSize) + visible + overscanCount);
      return [start, end];
    });

    const onScroll = (e: Event) => {
      scrollOffset.value = (e.currentTarget as HTMLElement).scrollTop;
    };

    const scrollTo = (offset: number) => {
      const max = Math.max(0, props.itemCount * props.itemSize - props.height);
      const next = Math.max(0, Math.min(offset, max));
      scrollOffset.value = next;
      if (outerRef.value) outerRef.value.scrollTop = next;
    };

    const scrollToItem = (index: number, align: 'auto' | 'start' | 'center' | 'end' = 'auto') => {
      const { itemSize, height, itemCount } = props;
      index = Math.max(0, Math.min(index, itemCount - 1));
      const itemOffset = index * itemSize;
      const max = Math.max(0, itemCount * itemSize - height);
      const current = scrollOffset.value;
      let offset = current;
      switch (align) {
        case 'start':
          offset = itemOffset;
          break;
        case 'end':
          offset = itemOffset - height + itemSize;
          break;
        case 'center':
          offset = itemOffset - height / 2 + itemSize / 2;
          break;
        default:
          if (itemOffset < current) offset = itemOffset;
          else if (itemOffset + itemSize > current + height) offset = itemOffset - height + itemSize;
      }
      scrollTo(Math.max(0, Math.min(offset, max)));
    };

    expose({ scrollTo, scrollToItem, outerRef });

    return () => {
      const { height, width, itemSize, itemCount, renderItem, direction } = props;
      const [start, end] = range.value;
      const items: any[] = [];
      for (let i = start; i <= end; i++) {
        items.push(renderItem(i, { position: 'absolute', left: 0, top: `${i * itemSize}px`, height: `${itemSize}px`, width: '100%' }));
      }
      return h(
        'div',
        {
          ref: outerRef,
          class: 'semi-select-virtual-list',
          style: { position: 'relative', height: `${height}px`, width: typeof width === 'number' ? `${width}px` : width, overflow: 'auto', willChange: 'transform', direction },
          onScroll,
        },
        [h('div', { style: { height: `${itemCount * itemSize}px`, width: '100%' } }, items)]
      );
    };
  },
});

export default VirtualList;
