import { defineComponent, h } from 'vue';
import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import Select from '../../../select/Select';
import { getCustomSlotAttribute } from '@douyinfe/semi-foundation/lib/es/aiChatInput/utils';
import { strings } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';

const SelectSlotComponent = defineComponent({
  name: 'AIChatInputSelectSlotView',
  props: nodeViewProps,
  setup(props) {
    return () => {
      const value: string = props.node.attrs.value ?? '';
      let options: Array<{ value: string; label: string }> = [];
      try {
        options = JSON.parse(props.node.attrs.options || '[]').map((option: string) => ({ value: option, label: option }));
      } catch {
        options = [];
      }
      return h(NodeViewWrapper, { class: 'select-slot-wrapper' }, {
        default: () =>
          h(Select, {
            class: 'select-slot',
            optionList: options,
            value,
            onChange: (val: any) => {
              if (typeof val === 'string') props.updateAttributes({ value: val });
            },
          }),
      });
    };
  },
});

const SelectSlot = Node.create({
  name: 'selectSlot',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      value: {
        default: strings.ZERO_WIDTH_CHAR,
        parseHTML: (element: HTMLElement) => element.getAttribute('value'),
        renderHTML: (attrs: Record<string, any>) => ({ value: attrs.value }),
      },
      options: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('options') || '',
        renderHTML: (attrs: Record<string, any>) => (attrs.options ? { options: attrs.options } : {}),
      },
      isCustomSlot: getCustomSlotAttribute(),
    };
  },

  parseHTML() {
    return [{ tag: 'select-slot' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['select-slot', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return VueNodeViewRenderer(SelectSlotComponent);
  },
});

export default SelectSlot;
