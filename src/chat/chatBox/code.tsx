import { defineComponent, h, ref } from 'vue';
import { nth } from 'lodash';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import { copyTextToClipboard } from '../../typography/util';
import { IconCopyStroked, IconTick } from '../../icons/generated';
import { code } from '../../markdownRender/components';
import { useLocale } from '../../locale';
import { flattenChildren } from '../../_utils';

const { PREFIX_CHAT_BOX } = cssClasses;

const Code = defineComponent({
  name: 'ChatCode',
  inheritAttrs: false,
  props: {
    className: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const { locale } = useLocale('Chat');
    const copied = ref(false);
    return () => {
      const loc = locale.value || {};
      const className = props.className || (attrs as any).class;
      const language = nth(String(className || '').split('-'), -1);
      const children = flattenChildren(slots.default?.());
      const text = children.map((c: any) => (typeof c.children === 'string' ? c.children : '')).join('');
      const codeNode = h(code, { class: className, className }, () => children);
      if (!language) return codeNode;
      return h('div', { class: `${PREFIX_CHAT_BOX}-content-code semi-always-dark` }, [
        h('div', { class: `${PREFIX_CHAT_BOX}-content-code-topSlot` }, [
          h('span', { class: `${PREFIX_CHAT_BOX}-content-code-topSlot-type` }, language),
          h('span', { class: `${PREFIX_CHAT_BOX}-content-code-topSlot-copy` }, [
            copied.value
              ? h('span', { class: `${PREFIX_CHAT_BOX}-content-code-topSlot-copy-wrapper` }, [h(IconTick), loc.copied])
              : h(
                  'button',
                  {
                    class: `${PREFIX_CHAT_BOX}-content-code-topSlot-copy-wrapper ${PREFIX_CHAT_BOX}-content-code-topSlot-toCopy`,
                    onClick: () => {
                      copyTextToClipboard(text);
                      copied.value = true;
                      setTimeout(() => {
                        copied.value = false;
                      }, 2000);
                    },
                  },
                  [h(IconCopyStroked), loc.copy]
                ),
          ]),
        ]),
        codeNode,
      ]);
    };
  },
});

export default Code;
