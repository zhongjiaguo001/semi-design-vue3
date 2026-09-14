import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import ChatBoxActionFoundation from '@douyinfe/semi-foundation/lib/es/chat/chatBoxActionFoundation';
import { useBaseComponent } from '../../_base/useBaseComponent';
import { useLocale } from '../../locale';
import { copyTextToClipboard } from '../../typography/util';
import Button from '../../button/Button';
import Popconfirm from '../../popconfirm/Popconfirm';
import { IconThumbUpStroked, IconDeleteStroked, IconCopyStroked, IconLikeThumb, IconRedoStroked } from '../../icons/generated';

const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
const { ROLE, MESSAGE_STATUS } = strings;

const ChatBoxAction = defineComponent({
  name: 'ChatBoxAction',
  props: {
    role: { type: Object as PropType<any>, default: undefined },
    message: { type: Object as PropType<any>, default: () => ({}) },
    lastChat: { type: Boolean, default: false },
    toast: { type: Object as PropType<any>, default: undefined },
    onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageCopy: { type: Function as PropType<any>, default: undefined },
    onChatsChange: { type: Function as PropType<any>, default: undefined },
    onMessageDelete: { type: Function as PropType<any>, default: undefined },
    onMessageReset: { type: Function as PropType<any>, default: undefined },
    customRenderFunc: { type: Function as PropType<any>, default: undefined },
  },
  setup(props) {
    const { locale } = useLocale('Chat');
    const popconfirmTriggerRef = ref<HTMLElement | null>(null);
    let clickOutsideHandler: any = null;
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { visible: false, showAction: false });

    const adapter = {
      ...baseAdapter,
      notifyDeleteMessage: () => props.onMessageDelete?.(props.message),
      notifyMessageCopy: () => props.onMessageCopy?.(props.message),
      copyToClipboardAndToast: () => {
        const { message = {}, toast } = props;
        if (typeof message.content === 'string') copyTextToClipboard(message.content);
        else if (Array.isArray(message.content)) copyTextToClipboard(message.content?.map((item: any) => item.text).join(''));
        toast?.success?.({ content: locale.value?.copySuccess });
      },
      notifyLikeMessage: () => props.onMessageGoodFeedback?.(props.message),
      notifyDislikeMessage: () => props.onMessageBadFeedback?.(props.message),
      notifyResetMessage: () => props.onMessageReset?.(props.message),
      setVisible: (visible: boolean) => {
        state.visible = visible;
      },
      setShowAction: (showAction: boolean) => {
        state.showAction = showAction;
      },
      registerClickOutsideHandler: (cb: () => void) => {
        if (clickOutsideHandler) adapter.unregisterClickOutsideHandler();
        clickOutsideHandler = (e: MouseEvent) => {
          const el = popconfirmTriggerRef.value;
          const target = e.target as Element;
          const path = (e as any).composedPath?.() || [target];
          if (el && !el.contains(target) && !path.includes(el)) cb();
        };
        window.addEventListener('mousedown', clickOutsideHandler);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) {
          window.removeEventListener('mousedown', clickOutsideHandler);
          clickOutsideHandler = null;
        }
      },
    };
    const foundation = new (ChatBoxActionFoundation as any)(adapter);
    onBeforeUnmount(() => foundation.destroy());

    return () => {
      const { message = {}, lastChat, customRenderFunc } = props;
      const { showAction, visible } = state;
      const { role, status = MESSAGE_STATUS.COMPLETE } = message;
      const complete = status === MESSAGE_STATUS.COMPLETE;
      const showFeedback = role !== ROLE.USER && complete;
      const showReset = lastChat && role === ROLE.ASSISTANT;
      const finished = status !== MESSAGE_STATUS.LOADING && status !== MESSAGE_STATUS.INCOMPLETE;
      const wrapCls = cls(PREFIX_CHAT_BOX_ACTION, {
        [`${PREFIX_CHAT_BOX_ACTION}-show`]: (showReset && finished) || showAction,
        [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !finished,
      });
      const copyNode = h(Button, { key: 'copy', theme: 'borderless', icon: IconCopyStroked, type: 'tertiary', onClick: () => foundation.copyMessage(), class: `${PREFIX_CHAT_BOX_ACTION}-btn` });
      const likeNode = h(Button, {
        key: 'like',
        theme: 'borderless',
        icon: message.like ? IconLikeThumb : IconThumbUpStroked,
        type: 'tertiary',
        class: `${PREFIX_CHAT_BOX_ACTION}-btn`,
        onClick: () => foundation.likeMessage(),
      });
      const dislikeNode = h(Button, {
        theme: 'borderless',
        key: 'dislike',
        icon: message.dislike ? () => h(IconLikeThumb, { class: `${PREFIX_CHAT_BOX_ACTION}-icon-flip` }) : () => h(IconThumbUpStroked, { class: 'semi-chat-chatBox-action-icon-flip' }),
        type: 'tertiary',
        class: `${PREFIX_CHAT_BOX_ACTION}-btn`,
        onClick: () => foundation.dislikeMessage(),
      });
      const resetNode = h(Button, {
        key: 'reset',
        theme: 'borderless',
        icon: () => h(IconRedoStroked, { class: `${PREFIX_CHAT_BOX_ACTION}-icon-redo` }),
        type: 'tertiary',
        onClick: () => foundation.resetMessage(),
        class: `${PREFIX_CHAT_BOX_ACTION}-btn`,
      });
      const deleteNode = h(
        Popconfirm,
        {
          trigger: 'custom',
          visible,
          key: 'delete',
          title: locale.value?.deleteConfirm,
          onConfirm: () => foundation.deleteMessage(),
          onCancel: () => foundation.hideDeletePopup(),
          position: 'top',
        },
        () =>
          h('span', { ref: popconfirmTriggerRef, class: `${PREFIX_CHAT_BOX_ACTION}-delete-wrap` }, [
            h(Button, {
              theme: 'borderless',
              icon: IconDeleteStroked,
              type: 'tertiary',
              class: `${PREFIX_CHAT_BOX_ACTION}-btn`,
              onClick: () => foundation.showDeletePopup(),
            }),
          ])
      );
      if (customRenderFunc) {
        const actionNodes: any[] = [];
        const actionNodeObj: any = {};
        if (complete) {
          actionNodes.push(copyNode);
          actionNodeObj.copyNode = copyNode;
        }
        if (showFeedback) {
          actionNodes.push(likeNode, dislikeNode);
          actionNodeObj.likeNode = likeNode;
          actionNodeObj.dislikeNode = dislikeNode;
        }
        if (showReset) {
          actionNodes.push(resetNode);
          actionNodeObj.resetNode = resetNode;
        }
        actionNodes.push(deleteNode);
        actionNodeObj.deleteNode = deleteNode;
        return customRenderFunc({ message, defaultActions: actionNodes, className: wrapCls, defaultActionsObj: actionNodeObj });
      }
      return h('div', { class: wrapCls }, [
        complete ? copyNode : null,
        showFeedback ? likeNode : null,
        showFeedback ? dislikeNode : null,
        showReset ? resetNode : null,
        deleteNode,
      ]);
    };
  },
});

export default ChatBoxAction;
