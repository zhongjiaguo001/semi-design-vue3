import '../_utils/prism';
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import DialogueFoundation from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/foundation';
import '@douyinfe/semi-foundation/lib/es/aiChatDialogue/aiChatDialogue.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';
import Button from '../button/Button';
import { IconChevronDown } from '../icons/generated';
import DialogueItem from './Dialogue';
import Hint from './widgets/dialogueHint';
import { ReasoningWidget } from './widgets/contentItem/reasoning';
import { DialogueStepWidget } from './widgets/contentItem/dialogueStep';
import { AnnotationWidget } from './widgets/contentItem/annotation';
import { ReferenceWidget } from './widgets/contentItem/reference';
import Code from './widgets/contentItem/code';

const { DIALOGUE_ALIGN, MODE } = strings;
const { PREFIX } = cssClasses;

export const aiChatDialogueProps = {
  align: { type: String as PropType<'leftRight' | 'leftAlign'>, default: DIALOGUE_ALIGN.LEFT_RIGHT as 'leftRight' },
  chats: { type: Array as PropType<any[]>, default: () => [] },
  className: { type: String, default: undefined },
  disabledFileItemClick: { type: Boolean, default: false },
  escapeHtml: { type: Boolean, default: true },
  hintCls: { type: String, default: undefined },
  hints: { type: Array as PropType<string[]>, default: () => [] },
  hintStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  selecting: { type: Boolean, default: false },
  markdownRenderProps: { type: Object as PropType<any>, default: undefined },
  messageEditRender: { type: Function as PropType<any>, default: undefined },
  mode: { type: String as PropType<'bubble' | 'noBubble' | 'userBubble'>, default: MODE.BUBBLE as 'bubble' },
  onAnnotationClick: { type: Function as PropType<any>, default: undefined },
  onChatsChange: { type: Function as PropType<(chats?: any[]) => void>, default: undefined },
  onFileClick: { type: Function as PropType<any>, default: undefined },
  onHintClick: { type: Function as PropType<(hint: string) => void>, default: undefined },
  onImageClick: { type: Function as PropType<any>, default: undefined },
  onMessageBadFeedback: { type: Function as PropType<any>, default: undefined },
  onMessageCopy: { type: Function as PropType<any>, default: undefined },
  onMessageDelete: { type: Function as PropType<any>, default: undefined },
  onMessageEdit: { type: Function as PropType<any>, default: undefined },
  onMessageGoodFeedback: { type: Function as PropType<any>, default: undefined },
  onMessageReset: { type: Function as PropType<any>, default: undefined },
  onMessageShare: { type: Function as PropType<any>, default: undefined },
  onReferenceClick: { type: Function as PropType<any>, default: undefined },
  onSelect: { type: Function as PropType<(selectedIds: string[]) => void>, default: undefined },
  dialogueRenderConfig: { type: Object as PropType<any>, default: undefined },
  renderDialogueContentItem: { type: Object as PropType<any>, default: undefined },
  renderHintBox: { type: Function as PropType<any>, default: undefined },
  roleConfig: { type: Object as PropType<any>, default: () => ({}) },
  showReset: { type: Boolean, default: true },
  showReference: { type: Boolean, default: false },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const aiChatDialogueEmits = [
  'chatsChange',
  'hintClick',
  'select',
  'messageCopy',
  'messageGoodFeedback',
  'messageBadFeedback',
  'messageEdit',
  'messageDelete',
  'messageReset',
  'messageShare',
  'annotationClick',
  'fileClick',
  'imageClick',
  'referenceClick',
];

const AIChatDialogue = defineComponent({
  name: 'AIChatDialogue',
  inheritAttrs: false,
  props: aiChatDialogueProps,
  emits: aiChatDialogueEmits,
  setup(props, { attrs, emit, expose }) {
    const containerRef = ref<HTMLDivElement | null>(null);
    const scrollTargetRef = ref<HTMLElement | null>(null);
    let wheelEventHandler: ((e: WheelEvent) => void) | null = null;

    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      cacheHints: [] as string[],
      selectedIds: new Set<string>(),
      chats: [] as any[],
      backBottomVisible: false,
      wheelScroll: false,
    });

    // Vue's `emit('xxx')` already invokes an `onXxx` handler passed by the parent (declared prop or
    // `@xxx` listener), so emitting once is enough; calling the prop by hand would fire it twice.
    const notify = (_propName: string, emitName: string, ...args: any[]) => {
      emit(emitName as any, ...args);
    };

    const adapter = {
      ...baseAdapter,
      getProps: () => {
        const raw = baseAdapter.getProps();
        return new Proxy(raw as any, {
          get(target, key) {
            if (key === 'onChatsChange') return (chats: any[]) => notify('onChatsChange', 'chatsChange', chats);
            if (key === 'onSelect') return (ids: string[]) => notify('onSelect', 'select', ids);
            if (key === 'onMessageCopy') return (message: any) => notify('onMessageCopy', 'messageCopy', message);
            if (key === 'onMessageGoodFeedback') return (message: any) => notify('onMessageGoodFeedback', 'messageGoodFeedback', message);
            if (key === 'onMessageBadFeedback') return (message: any) => notify('onMessageBadFeedback', 'messageBadFeedback', message);
            if (key === 'onMessageEdit') return (message: any) => notify('onMessageEdit', 'messageEdit', message);
            if (key === 'onHintClick') return (hint: string) => notify('onHintClick', 'hintClick', hint);
            if (key === 'onMessageReset') return (message: any) => notify('onMessageReset', 'messageReset', message);
            if (key === 'onMessageDelete') return (message: any) => notify('onMessageDelete', 'messageDelete', message);
            if (key === 'onMessageShare') return (message: any) => notify('onMessageShare', 'messageShare', message);
            return Reflect.get(target, key);
          },
        });
      },
      getContainerRef: () => containerRef.value,
      setWheelScroll: (flag: boolean) => {
        state.wheelScroll = flag;
      },
      updateSelected: (selectedIds: Set<string>) => {
        state.selectedIds = selectedIds;
      },
      notifySelect: (selectedIds: string[]) => notify('onSelect', 'select', selectedIds),
      notifyChatsChange: (chats: any[]) => notify('onChatsChange', 'chatsChange', chats),
      notifyCopyMessage: (message: any) => notify('onMessageCopy', 'messageCopy', message),
      notifyLikeMessage: (message: any) => notify('onMessageGoodFeedback', 'messageGoodFeedback', message),
      notifyDislikeMessage: (message: any) => notify('onMessageBadFeedback', 'messageBadFeedback', message),
      notifyEditMessage: (message: any) => notify('onMessageEdit', 'messageEdit', message),
      notifyHintClick: (hint: string) => notify('onHintClick', 'hintClick', hint),
      setBackBottomVisible: (visible: boolean) => {
        if (state.backBottomVisible !== visible) state.backBottomVisible = visible;
      },
      registerWheelEvent: () => {
        adapter.unRegisterWheelEvent();
        const containerElement = containerRef.value;
        if (!containerElement) return;
        wheelEventHandler = (e: any) => {
          if (scrollTargetRef.value !== e.currentTarget) return;
          adapter.setWheelScroll(true);
          adapter.unRegisterWheelEvent();
        };
        containerElement.addEventListener('wheel', wheelEventHandler);
      },
      unRegisterWheelEvent: () => {
        if (!wheelEventHandler) return;
        const containerElement = containerRef.value;
        if (containerElement) containerElement.removeEventListener('wheel', wheelEventHandler);
        wheelEventHandler = null;
      },
    };
    const foundation = new (DialogueFoundation as any)(adapter);

    watch(
      () => props.chats,
      (chats) => {
        const next = chats ?? [];
        if (next !== state.chats) state.chats = next;
      },
      { immediate: true }
    );
    watch(
      () => props.hints,
      (hints) => {
        if (hints !== state.cacheHints) state.cacheHints = hints ?? [];
      },
      { immediate: true }
    );
    watch(
      () => [props.chats, props.hints] as const,
      ([newChats, newHints], prev) => {
        const oldChats = prev?.[0] ?? [];
        const cacheHints = prev?.[1] ?? [];
        let shouldScroll = false;
        if ((newChats?.length || 0) > (oldChats?.length || 0)) {
          adapter.setWheelScroll(false);
          adapter.registerWheelEvent();
          foundation.scrollToBottomImmediately();
        }
        if (newChats !== oldChats) {
          foundation.handleChatsChange(newChats);
          if (Array.isArray(newChats) && Array.isArray(oldChats)) {
            const newLastChat = newChats[newChats.length - 1];
            const oldLastChat = oldChats[oldChats.length - 1];
            if (newChats.length > oldChats.length) {
              if (oldChats.length === 0 || newLastChat?.id !== oldLastChat?.id) shouldScroll = true;
            } else if (
              newChats.length === oldChats.length &&
              newChats.length &&
              (newLastChat.status !== 'completed' || newLastChat.status !== oldLastChat.status)
            ) {
              shouldScroll = true;
            }
          }
        }
        if (newHints !== cacheHints && (newHints?.length || 0) > (cacheHints?.length || 0)) shouldScroll = true;
        if (!state.wheelScroll && shouldScroll) foundation.scrollToBottomImmediately();
      }
    );

    const containerScroll = (e: Event) => {
      scrollTargetRef.value = e.target as HTMLElement;
      if (e.target !== e.currentTarget) return;
      foundation.containerScroll(e);
    };

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    expose({
      foundation,
      state,
      selectAll: () => foundation.handleSelectAll(),
      deselectAll: () => foundation.handleDeselectAll(),
      scrollToBottom: (animation: boolean) => {
        if (animation) foundation.scrollToBottomWithAnimation();
        else foundation.scrollToBottomImmediately();
      },
      scrollToTop: (animation: boolean) => {
        if (animation) foundation.scrollToTopWithAnimation();
        else foundation.scrollToTopImmediately();
      },
    });

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { roleConfig, selecting, hintCls, hintStyle, hints, renderHintBox, style, className } = props;
      const { selectedIds, chats, backBottomVisible, wheelScroll } = state;
      return h('div', { class: cls(PREFIX, className, attrClass), style: [style, attrStyle], ...getDataAttr(rest) }, [
        h(
          'div',
          {
            class: cls(`${PREFIX}-list`, { [`${PREFIX}-list-scroll-hidden`]: !wheelScroll }),
            onScroll: containerScroll,
            ref: containerRef,
          },
          [
            chats.map((chat: any, index: number) =>
              h(DialogueItem, {
                key: chat.id,
                message: chat,
                role: roleConfig?.[chat.role],
                onSelectChange: (isChecked: boolean, item: string) => foundation.handleSelectOrRemove(isChecked, item),
                isSelected: selectedIds.has(chat.id),
                onMessageBadFeedback: (message: any) => foundation.dislikeMessage(message),
                onMessageGoodFeedback: (message: any) => foundation.likeMessage(message),
                onMessageReset: (message: any) => foundation.resetMessage(message),
                onMessageEdit: (message: any) => foundation.editMessage(message),
                onMessageDelete: (message: any) => foundation.deleteMessage(message),
                onMessageCopy: (message: any) => notify('onMessageCopy', 'messageCopy', message),
                onMessageShare: (message: any) => notify('onMessageShare', 'messageShare', message),
                isLastChat: index === chats.length - 1,
                continueSend: false,
                selecting,
                align: props.align,
                mode: props.mode,
                escapeHtml: props.escapeHtml,
                dialogueRenderConfig: props.dialogueRenderConfig,
                markdownRenderProps: props.markdownRenderProps,
                messageEditRender: props.messageEditRender,
                disabledFileItemClick: props.disabledFileItemClick,
                renderDialogueContentItem: props.renderDialogueContentItem,
                onFileClick: (file: any) => notify('onFileClick', 'fileClick', file),
                onImageClick: (image: any) => notify('onImageClick', 'imageClick', image),
                onAnnotationClick: (annotation: any) => notify('onAnnotationClick', 'annotationClick', annotation),
                onReferenceClick: (item: any) => notify('onReferenceClick', 'referenceClick', item),
                showReference: props.showReference,
                showReset: props.showReset,
              })
            ),
            hints?.length
              ? h(Hint, {
                  className: hintCls,
                  style: hintStyle,
                  hints,
                  onHintClick: (item: string) => foundation.onHintClick(item),
                  renderHintBox,
                  selecting,
                })
              : null,
          ]
        ),
        backBottomVisible
          ? h('span', { class: `${PREFIX}-backBottom` }, [
              h(Button, {
                class: `${PREFIX}-backBottom-button`,
                icon: () => h(IconChevronDown, { size: 'extra-large' }),
                type: 'tertiary',
                onClick: () => foundation.scrollToBottomWithAnimation(),
              }),
            ])
          : null,
      ]);
    };
  },
});

(AIChatDialogue as any).elementType = 'AIChatDialogue';
(AIChatDialogue as any).__SemiComponentName__ = 'AIChatDialogue';
(AIChatDialogue as any).Reasoning = ReasoningWidget;
(AIChatDialogue as any).Step = DialogueStepWidget;
(AIChatDialogue as any).Annotation = AnnotationWidget;
(AIChatDialogue as any).Reference = ReferenceWidget;
(AIChatDialogue as any).defaultComponents = { code: Code };

export default AIChatDialogue;
