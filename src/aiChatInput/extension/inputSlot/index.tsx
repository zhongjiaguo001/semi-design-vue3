import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import Component from './component';
import { getCustomSlotAttribute } from '@douyinfe/semi-foundation/lib/es/aiChatInput/utils';
import { ensureTrailingText, keyDownHandlePlugin } from '../plugins';

export const REACT_COMPONENT_NODE_NAME = 'inputSlot';

export default Node.create({
  name: 'inputSlot',
  group: 'inline',
  inline: true,
  content: 'inline*',
  atom: false,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'input-slot',
        getAttrs: (element: any) => ({
          placeholder: element.getAttribute('placeholder'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['input-slot', mergeAttributes(HTMLAttributes), 0];
  },

  addAttributes() {
    return {
      placeholder: {
        default: '',
        parseHTML: (element: any) => element.getAttribute('placeholder') || '',
        renderHTML: (attributes: any) => ({ placeholder: attributes.placeholder }),
      },
      isCustomSlot: getCustomSlotAttribute(),
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Component, {
      update: ({ oldNode, newNode, updateProps }: any) => {
        if (newNode.type !== oldNode.type) return false;
        if ((this as any).editor.view.composing) return true;
        updateProps();
        return true;
      },
    });
  },

  addProseMirrorPlugins() {
    return [ensureTrailingText(this.editor.schema), keyDownHandlePlugin(this.editor.schema)];
  },
});
