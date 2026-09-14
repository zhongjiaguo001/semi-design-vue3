import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, cloneVNode } from 'vue';
import type { PropType } from 'vue';
import DragMoveFoundation from '@douyinfe/semi-foundation/lib/es/dragMove/foundation';
import { isHTMLElement } from '@douyinfe/semi-foundation/lib/es/utils/dom';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, resolveDOM } from '../_utils';

export type DragMovePositionStrategy = 'absolute' | 'relative';

export const dragMoveProps = {
  handler: { type: Function as PropType<() => HTMLElement>, default: undefined },
  allowInputDrag: { type: Boolean, default: false },
  constrainNode: { type: Function as PropType<() => HTMLElement>, default: undefined },
  constrainer: { type: [Function, String] as PropType<(() => HTMLElement) | 'parent'>, default: undefined },
  allowMove: { type: Function as PropType<(e: MouseEvent | TouchEvent, element: HTMLElement) => boolean>, default: undefined },
  customMove: { type: Function as PropType<(element: HTMLElement, top: number, left: number) => void>, default: undefined },
  positionStrategy: { type: String as PropType<DragMovePositionStrategy>, default: 'absolute' },
};

export const dragMoveEmits = ['mouseDown', 'mouseMove', 'mouseUp', 'touchStart', 'touchMove', 'touchEnd', 'touchCancel'];

const DragMove = defineComponent({
  name: 'DragMove',
  inheritAttrs: false,
  props: dragMoveProps,
  emits: dragMoveEmits,
  setup(props, { slots, emit, expose }) {
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const elementRef = ref<HTMLElement | null>(null);
    const adapter = {
      ...baseAdapter,
      getDragElement: () => {
        let elementDom: any = elementRef.value;
        if (!isHTMLElement(elementDom)) {
          elementDom = resolveDOM(elementDom);
        }
        return elementDom;
      },
      getConstrainer: () => {
        const { constrainer } = props;
        if (typeof constrainer === 'string' && constrainer === 'parent') {
          return (elementRef.value as HTMLElement | null)?.parentNode ?? null;
        } else if (typeof constrainer === 'function') {
          return constrainer();
        }
        return null;
      },
      getHandler: () => {
        const { handler } = props;
        if (typeof handler === 'function') {
          const h = handler();
          return resolveDOM(h) ?? h;
        }
        return adapter.getDragElement();
      },
      notifyMouseDown: (e: MouseEvent) => emit('mouseDown', e),
      notifyMouseMove: (e: MouseEvent) => emit('mouseMove', e),
      notifyMouseUp: (e: MouseEvent) => emit('mouseUp', e),
      notifyTouchStart: (e: TouchEvent) => emit('touchStart', e),
      notifyTouchMove: (e: TouchEvent) => emit('touchMove', e),
      notifyTouchEnd: (e: TouchEvent) => emit('touchEnd', e),
      notifyTouchCancel: (e: TouchEvent) => emit('touchCancel', e),
    };
    const foundation = new (DragMoveFoundation as any)(adapter);

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => props.positionStrategy,
      () => foundation.updatePositionStrategy()
    );

    expose({ foundation, elementRef });

    return () => {
      const children = flattenChildren(slots.default?.());
      if (!children.length) return null;
      const child = children[0];
      // mergeRef=true keeps the child's own ref (React forwards the original ref as well)
      return cloneVNode(child, { ref: (node: any) => (elementRef.value = node && node.$el ? node.$el : node) }, true);
    };
  },
});
(DragMove as any).__SemiComponentName__ = 'DragMove';
(DragMove as any).elementType = 'DragMove';

export default DragMove;
