import { defineComponent, h, watch, computed } from 'vue';
import type { PropType } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { isNodeEmpty } from '@tiptap/core';
import type { Editor, Extensions } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Paragraph from '@tiptap/extension-paragraph';
import HardBreak from '@tiptap/extension-hard-break';
import { UndoRedo, Placeholder, preparePlaceholderAttribute } from '@tiptap/extensions';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node } from '@tiptap/pm/model';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import InputSlot from './extension/inputSlot';
import SelectSlot from './extension/selectSlot';
import SkillSlot from './extension/skillSlot';
import SemiStatusExtension from './extension/statusExtension';
import { handleCompositionEndLogic, handlePasteLogic, handleTextInputLogic, handleZeroWidthCharLogic } from './extension/plugins';

const PREFIX = cssClasses.PREFIX;

const CustomPlaceholder = Placeholder.extend({
  addProseMirrorPlugins() {
    const dataAttribute = this.options.dataAttribute
      ? `data-${preparePlaceholderAttribute(this.options.dataAttribute)}`
      : 'data-placeholder';

    const isDocActuallyEmpty = (doc: Node) => {
      let actuallyEmpty = true;
      doc.descendants((node) => {
        if (!actuallyEmpty) return false;
        if (node.type.name === 'skillSlot') return false;
        if (node.isText) {
          const textWithoutZeroWidth = (node.text || '').replace(new RegExp(strings.ZERO_WIDTH_CHAR, 'g'), '');
          if (textWithoutZeroWidth.length > 0) {
            actuallyEmpty = false;
            return false;
          }
        } else if (node.type.name !== 'doc' && node.type.name !== 'paragraph') {
          actuallyEmpty = false;
          return false;
        }
        return true;
      });
      return actuallyEmpty;
    };

    const isParagraphActuallyEmpty = (paragraphNode: Node) => {
      let actuallyEmpty = true;
      paragraphNode.descendants((node) => {
        if (!actuallyEmpty) return false;
        if (node.type.name === 'skillSlot') return false;
        if (node.isText) {
          const textWithoutZeroWidth = (node.text || '').replace(new RegExp(strings.ZERO_WIDTH_CHAR, 'g'), '');
          if (textWithoutZeroWidth.length > 0) {
            actuallyEmpty = false;
            return false;
          }
        } else if (node.type.name !== 'paragraph') {
          actuallyEmpty = false;
          return false;
        }
        return true;
      });
      return actuallyEmpty;
    };

    const paragraphHasSkillSlot = (paragraphNode: Node) => {
      let hasSkill = false;
      paragraphNode.descendants((node) => {
        if (node.type.name === 'skillSlot') {
          hasSkill = true;
          return false;
        }
        return true;
      });
      return hasSkill;
    };

    return [
      new Plugin({
        key: new PluginKey('custom-placeholder'),
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
            const { anchor } = selection;
            const decorations: Decoration[] = [];
            if (!active) return null;
            const showPlaceholderWhenSkillOnly = (this.options as any).showPlaceholderWhenSkillOnly ?? false;
            const isEmptyDoc = this.editor.isEmpty || (showPlaceholderWhenSkillOnly && isDocActuallyEmpty(doc));
            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty =
                !node.isLeaf &&
                (node.type.name === 'paragraph'
                  ? showPlaceholderWhenSkillOnly
                    ? isParagraphActuallyEmpty(node)
                    : isNodeEmpty(node)
                  : isNodeEmpty(node));
              if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                const classes = [this.options.emptyNodeClass];
                if (isEmptyDoc) classes.push(this.options.emptyEditorClass);
                const hasSkill = showPlaceholderWhenSkillOnly && node.type.name === 'paragraph' && paragraphHasSkillSlot(node);
                if (hasSkill) classes.push('has-skill-slot');
                const attrs: any = {
                  class: classes.join(' '),
                  [dataAttribute]:
                    typeof this.options.placeholder === 'function'
                      ? this.options.placeholder({ editor: this.editor, node, pos, hasAnchor } as any)
                      : this.options.placeholder,
                };
                decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs));
              }
              return this.options.includeChildren;
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export const richTextInputProps = {
  defaultContent: { type: [String, Object] as PropType<any>, default: '' },
  placeholder: { type: [String, Function] as PropType<any>, default: undefined },
  immediatelyRender: { type: Boolean, default: true },
  setEditor: { type: Function as PropType<(editor: Editor | null) => void>, default: undefined },
  onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
  onChange: { type: Function as PropType<(content: string) => void>, default: undefined },
  extensions: { type: Array as PropType<Extensions>, default: () => [] },
  handleKeyDown: { type: Function as PropType<(view: any, event: KeyboardEvent) => boolean>, default: undefined },
  onPaste: { type: Function as PropType<(files: File[]) => void>, default: undefined },
  onPasteEvent: { type: Function as PropType<(event: ClipboardEvent) => void>, default: undefined },
  onFocus: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
  onBlur: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
  handleCreate: { type: Function as PropType<() => void>, default: undefined },
  showPlaceholderWhenSkillOnly: { type: Boolean, default: false },
};

const RichTextInput = defineComponent({
  name: 'AIChatInputRichText',
  inheritAttrs: false,
  props: richTextInputProps,
  setup(props) {
    const allExtensions = computed(() => {
      const customPlaceholderOptions: Record<string, any> = {
        placeholder: props.placeholder,
        showPlaceholderWhenSkillOnly: true,
      };
      const placeholderExtension = props.showPlaceholderWhenSkillOnly
        ? CustomPlaceholder.configure(customPlaceholderOptions)
        : Placeholder.configure({ placeholder: props.placeholder });
      return [
        Document,
        Paragraph,
        Text,
        UndoRedo,
        HardBreak,
        InputSlot,
        SelectSlot,
        SkillSlot,
        placeholderExtension,
        SemiStatusExtension,
        ...(props.extensions || []),
      ];
    });

    const editor = useEditor({
      extensions: allExtensions.value as Extensions,
      content: props.defaultContent ?? '',
      immediatelyRender: props.immediatelyRender,
      editorProps: {
        handleKeyDown: (view, event) => props.handleKeyDown?.(view, event) ?? false,
        handlePaste: handlePasteLogic as any,
        handleTextInput: (view, from, to, text) => (view.composing ? false : handleTextInputLogic(view, from, to, text)),
        handleDOMEvents: {
          compositionend: (view: any) => {
            window.setTimeout(() => handleCompositionEndLogic(view), 60);
            return false;
          },
        },
      },
      onCreate: ({ editor: ed }) => {
        const { state, view } = ed;
        const tr = handleZeroWidthCharLogic(state);
        if (tr) view.dispatch(tr);
        props.handleCreate?.();
      },
      onUpdate: ({ editor: ed }) => {
        props.onChange?.(ed.getText());
      },
    });

    watch(
      editor,
      (ed) => {
        props.setEditor?.(ed ?? null);
      },
      { immediate: true }
    );

    return () => {
      if (!editor.value) return null;
      return h(EditorContent, {
        editor: editor.value,
        class: `${PREFIX}-editor-content`,
        onKeydown: (e: KeyboardEvent) => props.onKeyDown?.(e),
        onFocus: (e: FocusEvent) => props.onFocus?.(e),
        onBlur: (e: FocusEvent) => props.onBlur?.(e),
        onPaste: (e: ClipboardEvent) => {
          props.onPasteEvent?.(e);
          const items = e.clipboardData?.items as any;
          const files: File[] = [];
          if (items) {
            for (const it of items) {
              const file = it.getAsFile?.();
              if (file) files.push(file);
            }
          }
          if (files.length) props.onPaste?.(files);
        },
      });
    };
  },
});

export default RichTextInput;
