import { defineComponent, h, computed, Fragment } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import { escapeHtmlInMarkdown } from '@douyinfe/semi-foundation/lib/es/utils/escapeHtml';
import MarkdownRender from '../../markdownRender/MarkdownRender';
import { FileAttachment, ImageAttachment } from '../attachment';
import Code from './code';

const { PREFIX_CHAT_BOX } = cssClasses;
const { MESSAGE_STATUS, MODE, ROLE } = strings;

const ChatBoxContent = defineComponent({
  name: 'ChatBoxContent',
  props: {
    mode: { type: String as PropType<'bubble' | 'noBubble' | 'userBubble'>, default: undefined },
    customMarkDownComponents: { type: Object as PropType<Record<string, any>>, default: undefined },
    escapeHtml: { type: Boolean, default: undefined },
    role: { type: Object as PropType<any>, default: undefined },
    message: { type: Object as PropType<any>, default: () => ({}) },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
    markdownRenderProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  },
  setup(props) {
    return () => {
      const { message = {}, customRenderFunc, role: roleInfo, customMarkDownComponents, mode, markdownRenderProps, escapeHtml } = props;
      const { content, role, status } = message;
      const shouldEscapeHtml = escapeHtml && role === ROLE.USER;
      const markdownComponents = { code: Code, SemiFile: FileAttachment, img: ImageAttachment, ...customMarkDownComponents };
      const isUser = role === ROLE.USER;
      const bubble = mode === MODE.BUBBLE;
      const userBubble = mode === MODE.USER_BUBBLE && isUser;
      const wrapCls = cls(`${PREFIX_CHAT_BOX}-content`, {
        [`${PREFIX_CHAT_BOX}-content-${mode}`]: bubble || userBubble,
        [`${PREFIX_CHAT_BOX}-content-user`]: (bubble && isUser) || userBubble,
        [`${PREFIX_CHAT_BOX}-content-error`]: status === MESSAGE_STATUS.ERROR && (bubble || userBubble),
      });
      let node: any;
      if (status === MESSAGE_STATUS.LOADING) {
        node = h('span', { class: `${PREFIX_CHAT_BOX}-content-loading` }, [h('span', { class: `${PREFIX_CHAT_BOX}-content-loading-item` })]);
      } else {
        let realContent: any;
        if (typeof content === 'string') {
          const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(content) : content;
          realContent = h(MarkdownRender, { format: 'md', raw: rawText, components: markdownComponents, ...(markdownRenderProps || {}) });
        } else if (Array.isArray(content)) {
          realContent = content.map((item: any, index: number) => {
            if (item.type === 'text') {
              const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(item.text) : item.text;
              return h(MarkdownRender, { key: index, format: 'md', raw: rawText, components: markdownComponents, ...(markdownRenderProps || {}) });
            }
            if (item.type === 'image_url') return h(ImageAttachment, { key: index, src: item.image_url.url });
            if (item.type === 'file_url') {
              const { name, size, url, type } = item.file_url;
              const realType = name.split('.').pop() ?? type?.split('/').pop();
              return h(FileAttachment, { key: index, url, name, size, type: realType });
            }
            return null;
          });
        }
        node = h(Fragment, null, realContent);
      }
      if (customRenderFunc) return customRenderFunc({ message, role: roleInfo, defaultContent: node, className: wrapCls });
      return h('div', { class: wrapCls }, [node]);
    };
  },
});

export default ChatBoxContent;
