import { defineComponent, h, Fragment } from 'vue';
import type { PropType } from 'vue';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import { useLocale } from '../locale';
import useToast from '../toast/useToast';
import Divider from '../divider';
import ChatBox from './chatBox';

const { PREFIX_DIVIDER, PREFIX } = cssClasses;
const { ROLE } = strings;

const ChatContent = defineComponent({
  name: 'ChatContent',
  props: {
    chats: { type: Array as PropType<any[]>, default: () => [] },
    align: { type: String, default: undefined },
    mode: { type: String, default: undefined },
    escapeHtml: { type: Boolean, default: undefined },
    roleConfig: { type: Object as PropType<any>, default: undefined },
    customMarkDownComponents: { type: Object as PropType<any>, default: undefined },
    chatBoxRenderConfig: { type: Object as PropType<any>, default: undefined },
    markdownRenderProps: { type: Object as PropType<any>, default: undefined },
    renderDivider: { type: Function as PropType<any>, default: undefined },
    onMessageDelete: { type: Function as PropType<any>, default: undefined },
    onChatsChange: { type: Function as PropType<any>, default: undefined },
    onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageReset: { type: Function as PropType<any>, default: undefined },
    onMessageCopy: { type: Function as PropType<any>, default: undefined },
  },
  setup(props) {
    const { locale } = useLocale('Chat');
    const { toast, ToastHolder } = useToast();
    return () => {
      const loc = locale.value || {};
      return h(Fragment, null, [
        (props.chats || []).map((item: any, index: number) => {
          const lastMessage = index === (props.chats || []).length - 1;
          if (item.role === ROLE.DIVIDER) {
            return props.renderDivider
              ? props.renderDivider(item)
              : h(Divider, { key: item.id, class: PREFIX_DIVIDER }, () => loc.clearContext);
          }
          return h(ChatBox, {
            previousMessage: index ? props.chats[index - 1] : undefined,
            toast,
            align: props.align,
            mode: props.mode,
            key: item.id,
            message: item,
            escapeHtml: props.escapeHtml,
            roleConfig: props.roleConfig,
            onMessageBadFeedback: props.onMessageBadFeedback,
            onMessageCopy: props.onMessageCopy,
            onChatsChange: props.onChatsChange,
            onMessageDelete: props.onMessageDelete,
            onMessageGoodFeedback: props.onMessageGoodFeedback,
            onMessageReset: props.onMessageReset,
            lastChat: lastMessage,
            customMarkDownComponents: props.customMarkDownComponents,
            chatBoxRenderConfig: props.chatBoxRenderConfig,
            markdownRenderProps: props.markdownRenderProps,
          });
        }),
        h('div', { class: `${PREFIX}-toast` }, [h(ToastHolder)]),
      ]);
    };
  },
});

export default ChatContent;
