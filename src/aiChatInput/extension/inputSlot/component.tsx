import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3';
import { strings } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';

const InputSlotComponent = defineComponent({
  name: 'AIChatInputInputSlotView',
  props: nodeViewProps,
  setup(props) {
    const hidePlaceholderInComposition = ref(false);
    const placeholderRef = ref<HTMLSpanElement | null>(null);
    const placeholderWidth = ref<number | undefined>(undefined);

    const isSelectionInsideThisSlot = () => {
      if (!props.editor || typeof props.getPos !== 'function') return false;
      const pos = props.getPos();
      if (typeof pos !== 'number') return false;
      const { from, to } = props.editor.state.selection;
      return from > pos && to < pos + props.node.nodeSize;
    };

    const onCompositionStart = () => {
      if (isSelectionInsideThisSlot()) hidePlaceholderInComposition.value = true;
    };
    const onCompositionEnd = () => {
      hidePlaceholderInComposition.value = false;
    };

    onMounted(() => {
      const dom = props.editor?.view?.dom;
      if (!dom) return;
      dom.addEventListener('compositionstart', onCompositionStart, true);
      dom.addEventListener('compositionend', onCompositionEnd, true);
      dom.addEventListener('compositioncancel', onCompositionEnd, true);
    });
    onBeforeUnmount(() => {
      const dom = props.editor?.view?.dom;
      if (!dom) return;
      dom.removeEventListener('compositionstart', onCompositionStart, true);
      dom.removeEventListener('compositionend', onCompositionEnd, true);
      dom.removeEventListener('compositioncancel', onCompositionEnd, true);
    });

    watch(
      () => [props.node.textContent, hidePlaceholderInComposition.value, props.node.attrs.placeholder],
      () => {
        const isEmpty = props.node.textContent === strings.ZERO_WIDTH_CHAR;
        const shouldShow = isEmpty && !hidePlaceholderInComposition.value;
        if (shouldShow && placeholderRef.value) {
          const timer = window.setTimeout(() => {
            placeholderWidth.value = placeholderRef.value?.offsetWidth;
          });
          return () => window.clearTimeout(timer);
        }
        return undefined;
      }
    );

    return () => {
      const isEmpty = props.node.textContent === strings.ZERO_WIDTH_CHAR;
      const placeholder = props.node.attrs.placeholder || '';
      const shouldShowPlaceholder = isEmpty && !hidePlaceholderInComposition.value;
      return h(
        NodeViewWrapper,
        {
          as: 'span',
          class: 'input-slot',
          style: { minWidth: shouldShowPlaceholder && placeholderWidth.value ? `${placeholderWidth.value}px` : undefined },
        },
        {
          default: () => [
            h(
              'span',
              {
                ref: placeholderRef,
                'data-placeholder': true,
                contenteditable: 'false',
                class: 'input-slot-placeholder',
                style: { display: shouldShowPlaceholder ? undefined : 'none' },
              },
              placeholder
            ),
            h(NodeViewContent, { as: 'span', class: 'content' }),
          ],
        }
      );
    };
  },
});

export default InputSlotComponent;
