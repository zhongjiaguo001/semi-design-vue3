import { defineComponent, h, computed } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import ChatBoxAvatar from './chatBoxAvatar';
import ChatBoxTitle from './chatBoxTitle';
import ChatBoxContent from './chatBoxContent';
import ChatBoxAction from './chatBoxAction';

const { PREFIX_CHAT_BOX } = cssClasses;
const { ROLE, CHAT_ALIGN } = strings;

const ChatBox = defineComponent({
  name: 'ChatBox',
  props: {
    message: { type: Object as PropType<any>, default: () => ({}) },
    lastChat: { type: Boolean, default: false },
    align: { type: String, default: undefined },
    toast: { type: Object as PropType<any>, default: undefined },
    mode: { type: String, default: undefined },
    roleConfig: { type: Object as PropType<any>, default: undefined },
    onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageCopy: { type: Function as PropType<any>, default: undefined },
    onChatsChange: { type: Function as PropType<any>, default: undefined },
    onMessageDelete: { type: Function as PropType<any>, default: undefined },
    onMessageReset: { type: Function as PropType<any>, default: undefined },
    chatBoxRenderConfig: { type: Object as PropType<any>, default: () => ({}) },
    customMarkDownComponents: { type: Object as PropType<any>, default: undefined },
    previousMessage: { type: Object as PropType<any>, default: undefined },
    markdownRenderProps: { type: Object as PropType<any>, default: undefined },
    escapeHtml: { type: Boolean, default: undefined },
  },
  setup(props) {
    return () => {
      const { message, previousMessage, align, chatBoxRenderConfig = {} } = props;
      const continueSend = message?.role === previousMessage?.role;
      const info = props.roleConfig ? props.roleConfig[message.role] ?? {} : {};
      const avatarNode = h(ChatBoxAvatar, { continueSend, role: info, message, customRenderFunc: chatBoxRenderConfig.renderChatBoxAvatar });
      const titleNode = h(ChatBoxTitle, { role: info, message, customRenderFunc: chatBoxRenderConfig.renderChatBoxTitle });
      const contentNode = h(ChatBoxContent, {
        mode: props.mode as any,
        role: info,
        message,
        escapeHtml: props.escapeHtml,
        customMarkDownComponents: props.customMarkDownComponents,
        customRenderFunc: chatBoxRenderConfig.renderChatBoxContent,
        markdownRenderProps: props.markdownRenderProps,
      });
      const actionNode = h(ChatBoxAction, {
        toast: props.toast,
        role: info,
        message,
        lastChat: props.lastChat,
        onMessageBadFeedback: props.onMessageBadFeedback,
        onMessageCopy: props.onMessageCopy,
        onChatsChange: props.onChatsChange,
        onMessageDelete: props.onMessageDelete,
        onMessageGoodFeedback: props.onMessageGoodFeedback,
        onMessageReset: props.onMessageReset,
        customRenderFunc: chatBoxRenderConfig.renderChatBoxAction,
      });
      const containerCls = cls(PREFIX_CHAT_BOX, {
        [`${PREFIX_CHAT_BOX}-right`]: message.role === ROLE.USER && align === CHAT_ALIGN.LEFT_RIGHT,
      });
      if (typeof chatBoxRenderConfig.renderFullChatBox === 'function') {
        return chatBoxRenderConfig.renderFullChatBox({
          message,
          role: info,
          defaultNodes: { avatar: avatarNode, title: titleNode, content: contentNode, action: actionNode },
          className: containerCls,
        });
      }
      return h('div', { class: containerCls }, [
        avatarNode,
        h('div', { class: `${PREFIX_CHAT_BOX}-wrap` }, [!continueSend ? titleNode : null, contentNode, actionNode]),
      ]);
    };
  },
});

export default ChatBox;
