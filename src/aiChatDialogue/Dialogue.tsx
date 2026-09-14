import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import Checkbox from '../checkbox/Checkbox';
import DialogueTitle from './widgets/dialogueTitle';
import DialogueAvatar from './widgets/dialogueAvatar';
import DialogueAction from './widgets/dialogueAction';
import DialogueContent from './widgets/dialogueContent';

const prefixCls = cssClasses.PREFIX;
const { ROLE, DIALOGUE_ALIGN } = strings;

const DialogueItem = defineComponent({
  name: 'AIChatDialogueItem',
  props: {
    align: { type: String, default: undefined },
    continueSend: { type: Boolean, default: false },
    isLastChat: { type: Boolean, default: false },
    isSelected: { type: Boolean, default: false },
    message: { type: Object as PropType<any>, default: () => ({}) },
    onSelectChange: { type: Function as PropType<(isChecked: boolean, item: string) => void>, default: undefined },
    role: { type: [Object, Map] as PropType<any>, default: undefined },
    selecting: { type: Boolean, default: false },
    mode: { type: String, default: undefined },
    escapeHtml: { type: Boolean, default: undefined },
    dialogueRenderConfig: { type: Object as PropType<any>, default: undefined },
    markdownRenderProps: { type: Object as PropType<any>, default: undefined },
    messageEditRender: { type: Function as PropType<any>, default: undefined },
    disabledFileItemClick: { type: Boolean, default: false },
    renderDialogueContentItem: { type: Object as PropType<any>, default: undefined },
    onFileClick: { type: Function as PropType<any>, default: undefined },
    onImageClick: { type: Function as PropType<any>, default: undefined },
    onAnnotationClick: { type: Function as PropType<any>, default: undefined },
    onReferenceClick: { type: Function as PropType<any>, default: undefined },
    showReference: { type: Boolean, default: false },
    showReset: { type: Boolean, default: true },
    onMessageReset: { type: Function as PropType<any>, default: undefined },
    onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
    onMessageCopy: { type: Function as PropType<any>, default: undefined },
    onMessageShare: { type: Function as PropType<any>, default: undefined },
    onMessageEdit: { type: Function as PropType<any>, default: undefined },
    onMessageDelete: { type: Function as PropType<any>, default: undefined },
  },
  setup(props) {
    const getRoleInfo = () => {
      const { role, message } = props;
      if (role instanceof Map) return role.get(message?.name);
      return role;
    };
    return () => {
      const { message, selecting, align, isSelected, onSelectChange, continueSend, dialogueRenderConfig } = props;
      const id = message.id;
      const roleInfo = getRoleInfo();
      const isRightAlign = message.role === ROLE.USER && align === DIALOGUE_ALIGN.LEFT_RIGHT;
      const containerCls = cls({
        [`${prefixCls}-container`]: true,
        [`${prefixCls}-container-right`]: isRightAlign,
      });
      const avatarNode = h(DialogueAvatar, { role: roleInfo, message, customRenderFunc: dialogueRenderConfig?.renderDialogueAvatar });
      const titleNode = h(DialogueTitle, { role: roleInfo, message, customRenderFunc: dialogueRenderConfig?.renderDialogueTitle });
      const contentNode = h(DialogueContent, {
        key: message.editing,
        message,
        mode: props.mode as any,
        editing: message.editing && message.role === ROLE.USER,
        escapeHtml: props.escapeHtml,
        messageEditRender: props.messageEditRender,
        onFileClick: props.onFileClick,
        onImageClick: props.onImageClick,
        disabledFileItemClick: props.disabledFileItemClick,
        renderDialogueContentItem: props.renderDialogueContentItem,
        onAnnotationClick: props.onAnnotationClick,
        onReferenceClick: props.onReferenceClick,
        customRenderFunc: dialogueRenderConfig?.renderDialogueContent,
        markdownRenderProps: props.markdownRenderProps,
        showReference: props.showReference,
      });
      const actionNode = h(DialogueAction, {
        role: props.role,
        message,
        onMessageCopy: props.onMessageCopy,
        onMessageReset: props.onMessageReset,
        onMessageGoodFeedback: props.onMessageGoodFeedback,
        onMessageBadFeedback: props.onMessageBadFeedback,
        showReset: props.showReset,
        isLastChat: props.isLastChat,
        onMessageShare: props.onMessageShare,
        onMessageEdit: props.onMessageEdit,
        onMessageDelete: props.onMessageDelete,
        messageEditRender: props.messageEditRender,
        customRenderFunc: dialogueRenderConfig?.renderDialogueAction,
      });
      if (typeof dialogueRenderConfig?.renderFullDialogue === 'function') {
        return dialogueRenderConfig.renderFullDialogue({
          message,
          role: roleInfo,
          defaultNodes: { avatar: avatarNode, title: titleNode, content: contentNode, action: actionNode },
          className: containerCls,
        });
      }
      return h(
        'div',
        {
          class: cls(`${prefixCls}-wrapper`, {
            [`${prefixCls}-wrapper-selected`]: selecting && isSelected,
            [`${prefixCls}-wrapper-continue-send`]: continueSend,
          }),
        },
        [
          selecting
            ? h('div', { class: `${prefixCls}-checkbox` }, [
                h(Checkbox, { checked: isSelected, onChange: (e: any) => onSelectChange?.(e.target.checked, id) }),
              ])
            : null,
          h('div', { class: containerCls }, [
            avatarNode,
            h('div', { class: `${prefixCls}-inner` }, [!continueSend ? titleNode : null, contentNode, actionNode]),
          ]),
        ]
      );
    };
  },
});

export default DialogueItem;
