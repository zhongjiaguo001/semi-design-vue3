import '../_utils/prism';
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import ChatFoundation from '@douyinfe/semi-foundation/lib/es/chat/foundation';
import '@douyinfe/semi-foundation/lib/es/chat/chat.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import Button from '../button/Button';
import { IconChevronDown, IconDisc } from '../icons/generated';
import ChatContent from './chatContent';
import Hint from './hint';
import InputBox from './inputBox';

const prefixCls = cssClasses.PREFIX;
const { CHAT_ALIGN, MODE, SEND_HOT_KEY, MESSAGE_STATUS } = strings;

export const chatProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  align: { type: String as PropType<'leftRight' | 'leftAlign'>, default: CHAT_ALIGN.LEFT_RIGHT as 'leftRight' },
  mode: { type: String as PropType<'bubble' | 'noBubble' | 'userBubble'>, default: MODE.BUBBLE as 'bubble' },
  chats: { type: Array as PropType<any[]>, default: () => [] },
  hints: { type: Array as PropType<string[]>, default: () => [] },
  roleConfig: { type: Object as PropType<any>, default: undefined },
  chatBoxRenderConfig: { type: Object as PropType<any>, default: undefined },
  customMarkDownComponents: { type: Object as PropType<any>, default: undefined },
  markdownRenderProps: { type: Object as PropType<any>, default: undefined },
  renderDivider: { type: Function as PropType<(message?: any) => any>, default: undefined },
  renderHintBox: { type: Function as PropType<(props: { content: string; index: number; onHintClick: () => void }) => any>, default: undefined },
  renderInputArea: { type: Function as PropType<(props?: any) => any>, default: undefined },
  placeholder: { type: String, default: undefined },
  topSlot: { type: [Object, Array, String, Function] as PropType<any>, default: undefined },
  bottomSlot: { type: [Object, Array, String, Function] as PropType<any>, default: undefined },
  showStopGenerate: { type: Boolean, default: false },
  showClearContext: { type: Boolean, default: false },
  hintStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  hintCls: { type: String, default: undefined },
  inputBoxStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  inputBoxCls: { type: String, default: undefined },
  uploadProps: { type: Object as PropType<any>, default: undefined },
  uploadTipProps: { type: Object as PropType<any>, default: undefined },
  sendHotKey: { type: String as PropType<'enter' | 'shift+enter'>, default: SEND_HOT_KEY.ENTER as 'enter' },
  enableUpload: { type: [Boolean, Object] as PropType<boolean | { pasteUpload?: boolean; dragUpload?: boolean; clickUpload?: boolean }>, default: true },
  canSend: { type: Boolean, default: undefined },
  escapeHtml: { type: Boolean, default: true },
  onChatsChange: { type: Function as PropType<(chats?: any[]) => void>, default: undefined },
  onMessageSend: { type: Function as PropType<(content: string, attachment: any[]) => void>, default: undefined },
  onInputChange: { type: Function as PropType<(payload: { inputValue?: string; attachment?: any[] }) => void>, default: undefined },
  onClear: { type: Function as PropType<() => void>, default: undefined },
  onHintClick: { type: Function as PropType<(hint: string) => void>, default: undefined },
  onStopGenerator: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
  onMessageDelete: { type: Function as PropType<(message?: any) => void>, default: undefined },
  onMessageReset: { type: Function as PropType<(message?: any) => void>, default: undefined },
  onMessageCopy: { type: Function as PropType<(message?: any) => void>, default: undefined },
  onMessageGoodFeedback: { type: Function as PropType<(message?: any) => void>, default: undefined },
  onMessageBadFeedback: { type: Function as PropType<(message?: any) => void>, default: undefined },
};

export const chatEmits = [
  'chatsChange',
  'messageSend',
  'inputChange',
  'clear',
  'hintClick',
  'stopGenerator',
  'messageDelete',
  'messageReset',
  'messageCopy',
  'messageGoodFeedback',
  'messageBadFeedback',
];

const Chat = defineComponent({
  name: 'Chat',
  inheritAttrs: false,
  props: chatProps,
  emits: chatEmits,
  setup(props, { attrs, emit, expose, slots }) {
    const { locale } = useLocale('Chat');
    const containerRef = ref<HTMLDivElement | null>(null);
    const uploadRef = ref<any>(null);
    const dropAreaRef = ref<HTMLDivElement | null>(null);
    const scrollTargetRef = ref<HTMLElement | null>(null);
    let wheelEventHandler: ((e: WheelEvent) => void) | null = null;
    let dragStatus = false;
    let resizeObserver: ResizeObserver | null = null;

    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      backBottomVisible: false,
      chats: [] as any[],
      cacheHints: [] as string[],
      wheelScroll: false,
      uploadAreaVisible: false,
    });

    // Vue's emit resolves `onXxx` from the raw vnode props, so it already covers both
    // `:on-message-send="fn"` (prop form) and `@message-send="fn"` (listener form).
    // Calling props.onXxx() in addition would fire the callback twice.
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
            if (key === 'onMessageSend') return (content: string, attachment: any[]) => notify('onMessageSend', 'messageSend', content, attachment);
            if (key === 'onInputChange') return (payload: any) => notify('onInputChange', 'inputChange', payload);
            if (key === 'onClear') return () => notify('onClear', 'clear');
            if (key === 'onHintClick') return (hint: string) => notify('onHintClick', 'hintClick', hint);
            if (key === 'onStopGenerator') return (e: any) => notify('onStopGenerator', 'stopGenerator', e);
            if (key === 'onMessageDelete') return (message: any) => notify('onMessageDelete', 'messageDelete', message);
            if (key === 'onMessageReset') return (message: any) => notify('onMessageReset', 'messageReset', message);
            if (key === 'onMessageCopy') return (message: any) => notify('onMessageCopy', 'messageCopy', message);
            if (key === 'onMessageGoodFeedback') return (message: any) => notify('onMessageGoodFeedback', 'messageGoodFeedback', message);
            if (key === 'onMessageBadFeedback') return (message: any) => notify('onMessageBadFeedback', 'messageBadFeedback', message);
            return Reflect.get(target, key);
          },
        });
      },
      getContainerRef: () => containerRef.value,
      setWheelScroll: (flag: boolean) => {
        state.wheelScroll = flag;
      },
      notifyChatsChange: (chats: any[]) => notify('onChatsChange', 'chatsChange', chats),
      notifyLikeMessage: (message: any) => notify('onMessageGoodFeedback', 'messageGoodFeedback', message),
      notifyDislikeMessage: (message: any) => notify('onMessageBadFeedback', 'messageBadFeedback', message),
      notifyCopyMessage: (message: any) => notify('onMessageCopy', 'messageCopy', message),
      notifyClearContext: () => notify('onClear', 'clear'),
      notifyMessageSend: (content: string, attachment: any[]) => notify('onMessageSend', 'messageSend', content, attachment),
      notifyInputChange: (payload: { inputValue: string; attachment: any[] }) => notify('onInputChange', 'inputChange', payload),
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
      notifyStopGenerate: (e: MouseEvent) => notify('onStopGenerator', 'stopGenerator', e),
      notifyHintClick: (hint: string) => notify('onHintClick', 'hintClick', hint),
      setUploadAreaVisible: (visible: boolean) => {
        state.uploadAreaVisible = visible;
      },
      manualUpload: (file: File[]) => {
        uploadRef.value?.insert?.(file);
      },
      getDropAreaElement: () => dropAreaRef.value,
      getDragStatus: () => dragStatus,
      setDragStatus: (status: boolean) => {
        dragStatus = status;
      },
    };
    const foundation = new (ChatFoundation as any)(adapter);

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
        const oldChats = prev?.[0];
        const cacheHints = prev?.[1] ?? [];
        let shouldScroll = false;
        if (newChats !== oldChats) {
          if (Array.isArray(newChats) && Array.isArray(oldChats)) {
            const newLastChat = newChats[newChats.length - 1];
            const oldLastChat = oldChats[oldChats.length - 1];
            if (newChats.length > oldChats.length) {
              if (oldChats.length === 0 || newLastChat?.id !== oldLastChat?.id) shouldScroll = true;
            } else if (
              newChats.length === oldChats.length &&
              newChats.length &&
              (newLastChat.status !== 'complete' || newLastChat.status !== oldLastChat.status)
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

    onMounted(() => {
      foundation.init();
      if (containerRef.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => foundation.handleScrollContainerResize());
        resizeObserver.observe(containerRef.value);
      }
    });
    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      foundation.destroy();
    });

    expose({
      foundation,
      state,
      resetMessage: () => foundation.resetMessage(null),
      clearContext: () => foundation.clearContext(null),
      scrollToBottom: (animation: boolean) => {
        if (animation) foundation.scrollToBottomWithAnimation();
        else foundation.scrollToBottomImmediately();
      },
      sendMessage: (content: string, attachment: any[]) => foundation.onMessageSend(content, attachment),
    });

    return () => {
      const loc = locale.value || {};
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const {
        topSlot,
        bottomSlot,
        roleConfig,
        hints,
        chatBoxRenderConfig,
        align,
        renderHintBox,
        style,
        className,
        showStopGenerate,
        customMarkDownComponents,
        mode,
        showClearContext,
        placeholder,
        inputBoxCls,
        inputBoxStyle,
        hintStyle,
        hintCls,
        uploadProps,
        uploadTipProps,
        sendHotKey,
        renderDivider,
        markdownRenderProps,
        enableUpload,
        canSend,
        escapeHtml,
      } = props;
      const { backBottomVisible, chats, wheelScroll, uploadAreaVisible } = state;
      const lastChat = chats.length > 0 && chats[chats.length - 1];
      let disableSend = false;
      let showStopGenerateFlag = false;
      if (lastChat && showStopGenerate) {
        const lastChatOnGoing =
          lastChat?.status && [MESSAGE_STATUS.LOADING, MESSAGE_STATUS.INCOMPLETE].includes(lastChat?.status);
        disableSend = lastChatOnGoing;
        showStopGenerateFlag = lastChatOnGoing;
      }
      const { dragUpload, clickUpload, pasteUpload } = foundation.getUploadProps(enableUpload);
      const dragEventHandlers = dragUpload
        ? {
            onDragover: (e: DragEvent) => foundation.handleDragOver(e),
            onDragstart: (e: DragEvent) => foundation.handleDragStart(e),
            onDragend: (e: DragEvent) => foundation.handleDragEnd(e),
          }
        : {};
      const top = slots.topSlot?.() ?? slots.top?.() ?? normalizeNode(topSlot);
      const bottom = slots.bottomSlot?.() ?? slots.bottom?.() ?? normalizeNode(bottomSlot);

      return h(
        'div',
        {
          class: cls(prefixCls, className, attrClass),
          style: [style, attrStyle],
          ...dragEventHandlers,
          ...getDataAttr(rest),
        },
        [
          dragUpload && uploadAreaVisible
            ? h(
                'div',
                {
                  ref: dropAreaRef,
                  class: `${prefixCls}-dropArea`,
                  onDragover: (e: DragEvent) => foundation.handleContainerDragOver(e),
                  onDrop: (e: DragEvent) => foundation.handleContainerDrop(e),
                  onDragleave: (e: DragEvent) => foundation.handleContainerDragLeave(e),
                },
                [h('span', { class: `${prefixCls}-dropArea-text` }, loc.dropAreaText)]
              )
            : null,
          h('div', { class: `${prefixCls}-inner` }, [
            top,
            h('div', { class: `${prefixCls}-content` }, [
              h(
                'div',
                {
                  class: cls(`${prefixCls}-container`, { 'semi-chat-container-scroll-hidden': !wheelScroll }),
                  onScroll: containerScroll,
                  ref: containerRef,
                },
                [
                  h(ChatContent, {
                    align,
                    mode,
                    chats,
                    escapeHtml,
                    roleConfig,
                    customMarkDownComponents,
                    onMessageDelete: (message: any) => foundation.deleteMessage(message),
                    onChatsChange: (next: any[]) => notify('onChatsChange', 'chatsChange', next),
                    onMessageBadFeedback: (message: any) => foundation.dislikeMessage(message),
                    onMessageGoodFeedback: (message: any) => foundation.likeMessage(message),
                    onMessageReset: (message: any) => foundation.resetMessage(message),
                    onMessageCopy: (message: any) => notify('onMessageCopy', 'messageCopy', message),
                    chatBoxRenderConfig,
                    renderDivider,
                    markdownRenderProps,
                  }),
                  hints?.length
                    ? h(Hint, {
                        className: hintCls,
                        style: hintStyle,
                        value: hints,
                        onHintClick: (item: string) => foundation.onHintClick(item),
                        renderHintBox,
                      })
                    : null,
                ]
              ),
            ]),
            backBottomVisible && !showStopGenerateFlag
              ? h('span', { class: `${prefixCls}-action` }, [
                  h(Button, {
                    class: `${prefixCls}-action-content ${prefixCls}-action-backBottom`,
                    icon: () => h(IconChevronDown, { size: 'extra-large' }),
                    type: 'tertiary',
                    onClick: () => foundation.scrollToBottomWithAnimation(),
                  }),
                ])
              : null,
            showStopGenerateFlag
              ? h('span', { class: `${prefixCls}-action` }, [
                  h(
                    Button,
                    {
                      class: `${prefixCls}-action-content ${prefixCls}-action-stop`,
                      icon: () => h(IconDisc, { size: 'extra-large' }),
                      type: 'tertiary',
                      onClick: (e: MouseEvent) => foundation.stopGenerate(e),
                    },
                    () => loc.stop
                  ),
                ])
              : null,
            h(InputBox, {
              canSend,
              showClearContext,
              uploadRef,
              manualUpload: adapter.manualUpload,
              style: inputBoxStyle,
              className: inputBoxCls,
              placeholder,
              disableSend,
              onClearContext: (e: any) => foundation.clearContext(e),
              onSend: (content: string, attachment: any[]) => foundation.onMessageSend(content, attachment),
              onInputChange: (payload: any) => foundation.onInputChange(payload),
              renderInputArea: props.renderInputArea,
              uploadProps,
              uploadTipProps,
              sendHotKey,
              clickUpload,
              pasteUpload,
              dragUpload,
            }),
            bottom,
          ]),
        ]
      );
    };
  },
});

(Chat as any).elementType = 'Chat';
(Chat as any).__SemiComponentName__ = 'Chat';
export default Chat;
