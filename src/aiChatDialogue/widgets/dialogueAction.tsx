import { defineComponent, h, ref, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import DialogueActionFoundation from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/actionFoundation';
import { useBaseComponent } from '../../_base/useBaseComponent';
import { useLocale } from '../../locale';
import { copyTextToClipboard } from '../../typography/util';
import Button from '../../button/Button';
import Dropdown from '../../dropdown/Dropdown';
import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownItem from '../../dropdown/DropdownItem';
import Modal from '../../modal/Modal';
import { Toast } from '../../toast';
import {
  IconThumbUpStroked,
  IconDeleteStroked,
  IconShareStroked,
  IconCopyStroked,
  IconLikeThumb,
  IconRedoStroked,
  IconEditStroked,
  IconMoreStroked,
} from '../../icons/generated';

const { PREFIX_ACTION } = cssClasses;
const { ROLE, STATUS } = strings;

const DialogueAction = defineComponent({
  name: 'AIChatDialogueAction',
  props: {
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
    isLastChat: { type: Boolean, default: false },
    message: { type: Object as PropType<any>, default: () => ({}) },
    messageEditRender: { type: Function as PropType<any>, default: undefined },
    onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageCopy: { type: Function as PropType<any>, default: undefined },
    onMessageDelete: { type: Function as PropType<any>, default: undefined },
    onMessageEdit: { type: Function as PropType<any>, default: undefined },
    onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageReset: { type: Function as PropType<any>, default: undefined },
    onMessageShare: { type: Function as PropType<any>, default: undefined },
    role: { type: [Object, Map] as PropType<any>, default: undefined },
    showReset: { type: Boolean, default: true },
    className: { type: String, default: undefined },
  },
  setup(props) {
    const { locale } = useLocale('AIChatDialogue');
    const dropdownTriggerRef = ref<HTMLElement | null>(null);
    let clickOutsideHandler: any = null;
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { visible: false, showAction: false });

    const adapter = {
      ...baseAdapter,
      notifyMessageCopy: () => props.onMessageCopy?.(props.message),
      copyToClipboardAndToast: () => {
        const { message } = props;
        if (typeof message?.content === 'string') copyTextToClipboard(message.content);
        else if (Array.isArray(message?.content)) {
          const content = message.content
            ?.map((item: any) => {
              if (typeof item?.content === 'string') return item.content;
              return item?.content?.map((inner: any) => inner?.text).join('') || '';
            })
            .join('');
          copyTextToClipboard(content);
        }
        Toast.success({ content: locale.value?.copySuccess });
      },
      notifyLikeMessage: () => props.onMessageGoodFeedback?.(props.message),
      notifyDislikeMessage: () => props.onMessageBadFeedback?.(props.message),
      notifyResetMessage: () => props.onMessageReset?.(props.message),
      notifyShareMessage: () => props.onMessageShare?.(props.message),
      notifyEditMessage: () => props.onMessageEdit?.(props.message),
      notifyDeleteMessage: () => props.onMessageDelete?.(props.message),
      setVisible: (visible: boolean) => {
        state.visible = visible;
      },
      setShowAction: (showAction: boolean) => {
        state.showAction = showAction;
      },
      registerClickOutsideHandler: (cb: () => void) => {
        if (clickOutsideHandler) adapter.unregisterClickOutsideHandler();
        clickOutsideHandler = (e: MouseEvent) => {
          const el = dropdownTriggerRef.value;
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
    const foundation = new (DialogueActionFoundation as any)(adapter);
    onBeforeUnmount(() => foundation.destroy());

    const showDeleteModal = () => {
      const loc = locale.value || {};
      Modal.warning({ title: loc.deleteConfirm, content: loc.deleteContent, onOk: () => foundation.deleteMessage() });
      foundation.hideMoreDropdown();
    };

    return () => {
      const { message = {}, isLastChat, customRenderFunc } = props;
      const { showAction, visible } = state;
      const { role, status = STATUS.COMPLETED } = message;
      const completed = status === STATUS.COMPLETED;
      const showFeedback = role !== ROLE.USER && completed;
      const showReset = props.showReset !== false && isLastChat && role === ROLE.ASSISTANT;
      const finished = status !== STATUS.IN_PROGRESS && status !== STATUS.INCOMPLETE;
      const showEdit = role === ROLE.USER;
      const wrapCls = cls(PREFIX_ACTION, {
        [`${PREFIX_ACTION}-show`]: (showReset && finished) || showAction,
        [`${PREFIX_ACTION}-hidden`]: !finished,
      });
      const copyNode = h(Button, {
        key: 'copy',
        theme: 'borderless',
        icon: IconCopyStroked,
        type: 'tertiary',
        onClick: () => foundation.copyMessage(),
        class: `${PREFIX_ACTION}-btn`,
      });
      const resetNode = h(Button, {
        key: 'reset',
        theme: 'borderless',
        icon: () => h(IconRedoStroked, { class: `${PREFIX_ACTION}-icon-redo` }),
        type: 'tertiary',
        onClick: () => foundation.resetMessage(),
        class: `${PREFIX_ACTION}-btn`,
      });
      const shareNode = h(Button, {
        key: 'share',
        theme: 'borderless',
        icon: IconShareStroked,
        type: 'tertiary',
        onClick: () => foundation.shareMessage(),
      });
      const likeNode = h(Button, {
        key: 'like',
        theme: 'borderless',
        icon: message.like ? IconLikeThumb : IconThumbUpStroked,
        type: 'tertiary',
        class: `${PREFIX_ACTION}-btn`,
        onClick: () => foundation.likeMessage(),
      });
      const dislikeNode = h(Button, {
        theme: 'borderless',
        key: 'dislike',
        icon: message.dislike
          ? () => h(IconLikeThumb, { class: `${PREFIX_ACTION}-icon-flip` })
          : () => h(IconThumbUpStroked, { class: 'semi-chat-chatBox-action-icon-flip' }),
        type: 'tertiary',
        class: `${PREFIX_ACTION}-btn`,
        onClick: () => foundation.dislikeMessage(),
      });
      const editNode = h(Button, {
        key: 'edit',
        theme: 'borderless',
        icon: IconEditStroked,
        type: 'tertiary',
        onClick: () => foundation.editMessage(),
      });
      const moreNode = h(
        Dropdown,
        {
          trigger: 'custom',
          position: 'bottomLeft',
          className: `${PREFIX_ACTION}-dropdown`,
          visible,
          spacing: 12,
          stopPropagation: true,
          onClickOutSide: () => foundation.hideMoreDropdown(),
          render: () =>
            h(DropdownMenu, null, () =>
              h(DropdownItem, { onClick: () => showDeleteModal() }, () => [h(IconDeleteStroked), ' ', locale.value?.delete])
            ),
        },
        () =>
          h('span', { ref: dropdownTriggerRef }, [
            h(Button, {
              key: 'more',
              theme: 'borderless',
              icon: IconMoreStroked,
              type: 'tertiary',
              onClick: () => foundation.showMoreDropdown(),
            }),
          ])
      );
      if (customRenderFunc) {
        const actionNodes: any[] = [];
        const actionNodeObj: any = {};
        if (completed) {
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
        actionNodes.push(moreNode);
        actionNodeObj.moreNode = moreNode;
        return customRenderFunc({ message, defaultActions: actionNodes, className: wrapCls, defaultActionsObj: actionNodeObj });
      }
      return h('div', { class: wrapCls }, [
        completed ? copyNode : null,
        showReset ? resetNode : null,
        completed ? shareNode : null,
        showEdit ? editNode : null,
        showFeedback ? likeNode : null,
        showFeedback ? dislikeNode : null,
        moreNode,
      ]);
    };
  },
});

export default DialogueAction;
