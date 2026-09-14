import { defineComponent, h, ref } from 'vue';
import { nth } from 'lodash';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { copyTextToClipboard } from '../../../typography/util';
import { IconCopyStroked, IconTick } from '../../../icons/generated';
import { code } from '../../../markdownRender/components';
import { flattenChildren } from '../../../_utils';

const { PREFIX_CODE } = cssClasses;

const Code = defineComponent({
  name: 'AIChatDialogueCode',
  inheritAttrs: false,
  props: {
    className: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const copied = ref(false);
    return () => {
      const className = props.className || (attrs as any).class;
      const language = nth(String(className || '').split('-'), -1);
      const children = flattenChildren(slots.default?.());
      const text = children.map((c: any) => (typeof c.children === 'string' ? c.children : '')).join('');
      const codeNode = h(code, { class: className, className }, () => children);
      if (!language) return codeNode;
      return h('div', { class: PREFIX_CODE }, [
        h('div', { class: `${PREFIX_CODE}-topSlot` }, [
          h('span', { class: `${PREFIX_CODE}-topSlot-type` }, language),
          h('span', { class: `${PREFIX_CODE}-topSlot-copy` }, [
            copied.value
              ? h('button', { class: `${PREFIX_CODE}-topSlot-copy-wrapper` }, [h(IconTick)])
              : h(
                  'button',
                  {
                    class: `${PREFIX_CODE}-topSlot-copy-wrapper`,
                    onClick: () => {
                      copyTextToClipboard(text);
                      copied.value = true;
                      setTimeout(() => {
                        copied.value = false;
                      }, 2000);
                    },
                  },
                  [h(IconCopyStroked)]
                ),
          ]),
        ]),
        codeNode,
      ]);
    };
  },
});

export default Code;
