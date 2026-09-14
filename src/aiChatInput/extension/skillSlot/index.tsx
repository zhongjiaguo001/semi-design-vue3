import { defineComponent, h } from 'vue';
import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { IconClose } from '../../../icons/generated';
import { getCustomSlotAttribute } from '@douyinfe/semi-foundation/lib/es/aiChatInput/utils';

const SkillSlotComponent = defineComponent({
  name: 'AIChatInputSkillSlotView',
  props: nodeViewProps,
  setup(props) {
    return () => {
      const value: string = props.node.attrs.label ?? props.node.attrs.value ?? '';
      if (value === '') return null;
      return h(NodeViewWrapper, { class: 'skill-slot-wrapper' }, {
        default: () =>
          h('span', { class: 'skill-slot' }, [
            value,
            h(IconClose, {
              class: 'skill-slot-delete',
              onClick: (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                props.editor?.commands.clearContent();
              },
            }),
          ]),
      });
    };
  },
});

const SkillSlot = Node.create({
  name: 'skillSlot',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      value: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-value'),
        renderHTML: (attributes: Record<string, any>) => ({ 'data-value': attributes.value }),
      },
      label: {
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
        renderHTML: (attributes: Record<string, any>) => ({ 'data-label': attributes.label }),
      },
      hasTemplate: {
        parseHTML: (element: HTMLElement) => element.getAttribute('data-template') === 'true',
        renderHTML: (attributes: Record<string, any>) => ({ 'data-template': attributes.hasTemplate }),
      },
      isCustomSlot: getCustomSlotAttribute(),
    };
  },

  parseHTML() {
    return [{ tag: 'skill-slot' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['skill-slot', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return VueNodeViewRenderer(SkillSlotComponent);
  },
});

export default SkillSlot;
