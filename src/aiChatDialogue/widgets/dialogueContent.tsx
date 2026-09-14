import { defineComponent, h, Fragment } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/constants';
import { escapeHtmlInMarkdown } from '@douyinfe/semi-foundation/lib/es/utils/escapeHtml';
import { messageToChatInput } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/dataAdapter';
import MarkdownRender from '../../markdownRender/MarkdownRender';
import Image from '../../image/Image';
import { useLocale } from '../../locale';
import {
  IconAlertCircle,
  IconCode,
  IconExcel,
  IconFile,
  IconPdf,
  IconSendMsgStroked,
  IconVideo,
  IconWord,
  IconWrench,
} from '../../icons/generated';
import { ReasoningWidget } from './contentItem/reasoning';
import { AnnotationWidget } from './contentItem/annotation';
import { ReferenceWidget } from './contentItem/reference';
import Code from './contentItem/code';

const { PREFIX_CONTENT } = cssClasses;
const {
  STATUS,
  MODE,
  ROLE,
  MESSAGE_ITEM_TYPE,
  TEXT_TYPES,
  TOOL_CALL_TYPES,
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  PDF_TYPES,
  EXCEL_TYPES,
  CODE_TYPES,
  VIDEO_TYPES,
} = strings;

const ImageAttachment = defineComponent({
  name: 'AIDialogueImageAttachment',
  props: {
    src: { type: String, default: undefined },
    isList: { type: Boolean, default: false },
    msg: { type: Object as PropType<any>, default: undefined },
    onImageClick: { type: Function as PropType<any>, default: undefined },
    isLastImage: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h(Image, {
        class: cls(`${PREFIX_CONTENT}-img`, {
          [`${PREFIX_CONTENT}-img-list`]: props.isList,
          [`${PREFIX_CONTENT}-img-last`]: props.isLastImage,
        }),
        src: props.src,
        onClick: () => props.onImageClick?.(props.msg),
      });
  },
});

const FileAttachment = defineComponent({
  name: 'AIDialogueFileAttachment',
  props: {
    filename: { type: String, default: undefined },
    file_url: { type: String, default: undefined },
    size: { type: [String, Number] as PropType<any>, default: undefined },
    fileInstance: { type: Object as PropType<any>, default: undefined },
    onFileClick: { type: Function as PropType<any>, default: undefined },
    disabledFileItemClick: { type: Boolean, default: false },
    role: { type: String, default: undefined },
    showReference: { type: Boolean, default: false },
    onReferenceClick: { type: Function as PropType<any>, default: undefined },
    isLastFile: { type: Boolean, default: false },
  },
  setup(props) {
    const renderFileIcon = (type: string) => {
      let icon: any = h(IconFile, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      let typeCls = 'default';
      if (DOCUMENT_TYPES.includes(type)) {
        typeCls = 'word';
        icon = h(IconWord, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      } else if (IMAGE_TYPES.includes(type)) {
        typeCls = 'image';
        icon = h('div', { class: `${PREFIX_CONTENT}-file-icon`, style: { backgroundImage: `url(${props.file_url})` } });
      } else if (PDF_TYPES.includes(type)) {
        typeCls = 'pdf';
        icon = h(IconPdf, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      } else if (EXCEL_TYPES.includes(type)) {
        typeCls = 'excel';
        icon = h(IconExcel, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      } else if (CODE_TYPES.includes(type)) {
        typeCls = 'code';
        icon = h(IconCode, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      } else if (VIDEO_TYPES.includes(type)) {
        typeCls = 'video';
        icon = h(IconVideo, { size: 'extra-large', class: `${PREFIX_CONTENT}-file-icon` });
      }
      return h('div', { class: cls(`${PREFIX_CONTENT}-file-icon-wrapper`, { [`${PREFIX_CONTENT}-file-icon-${typeCls}`]: typeCls }) }, [icon]);
    };
    return () => {
      const suffix = props.filename?.split('.').pop();
      const realType = suffix ?? props.fileInstance?.type?.split('/').pop();
      return h(
        'a',
        {
          href: props.file_url,
          target: '_blank',
          rel: 'noreferrer',
          class: cls(`${PREFIX_CONTENT}-file`, { [`${PREFIX_CONTENT}-file-last`]: props.isLastFile }),
          onClick: (e: MouseEvent) => {
            props.onFileClick?.(props);
            if (props.disabledFileItemClick) e.preventDefault();
          },
        },
        [
          renderFileIcon(realType as string),
          h('div', { class: `${PREFIX_CONTENT}-file-info` }, [
            h('span', { class: cls(`${PREFIX_CONTENT}-file-title`, { [`${PREFIX_CONTENT}-file-title-ellipsis`]: props.role === ROLE.USER && props.showReference }) }, props.filename),
            h('span', { class: `${PREFIX_CONTENT}-file-metadata` }, [h('span', { class: `${PREFIX_CONTENT}-file-type` }, realType), ' ', props.size]),
          ]),
          props.role === ROLE.USER && props.showReference
            ? h(
                'div',
                {
                  class: `${PREFIX_CONTENT}-icon-reference`,
                  role: 'button',
                  tabindex: 0,
                  onClick: (e: MouseEvent) => {
                    props.onReferenceClick?.({ name: props.filename, url: props.file_url });
                    e.preventDefault();
                  },
                },
                [h(IconSendMsgStroked)]
              )
            : null,
        ]
      );
    };
  },
});

const DialogueContent = defineComponent({
  name: 'AIChatDialogueContent',
  props: {
    mode: { type: String as PropType<'bubble' | 'noBubble' | 'userBubble'>, default: undefined },
    escapeHtml: { type: Boolean, default: undefined },
    role: { type: Object as PropType<any>, default: undefined },
    message: { type: Object as PropType<any>, default: () => ({}) },
    customRenderFunc: { type: Function as PropType<(props: any) => any>, default: undefined },
    markdownRenderProps: { type: Object as PropType<any>, default: undefined },
    editing: { type: Boolean, default: false },
    messageEditRender: { type: Function as PropType<(props: any) => any>, default: undefined },
    onFileClick: { type: Function as PropType<any>, default: undefined },
    onImageClick: { type: Function as PropType<any>, default: undefined },
    disabledFileItemClick: { type: Boolean, default: false },
    onAnnotationClick: { type: Function as PropType<any>, default: undefined },
    onReferenceClick: { type: Function as PropType<any>, default: undefined },
    renderDialogueContentItem: { type: Object as PropType<any>, default: undefined },
    showReference: { type: Boolean, default: false },
  },
  setup(props) {
    const { locale } = useLocale('AIChatDialogue');
    return () => {
      const {
        message = {},
        customRenderFunc,
        role: roleInfo,
        mode,
        markdownRenderProps,
        editing,
        messageEditRender,
        showReference,
        onFileClick,
        onImageClick,
        disabledFileItemClick,
        renderDialogueContentItem,
        onAnnotationClick,
        onReferenceClick,
        escapeHtml,
      } = props;
      const { content, role, status, references } = message;
      const shouldEscapeHtml = escapeHtml && role === ROLE.USER;
      const markdownComponents = { code: Code, ...(markdownRenderProps?.components || {}) };
      const isUser = role === ROLE.USER;
      const bubble = mode === MODE.BUBBLE;
      const userBubble = mode === MODE.USER_BUBBLE && isUser;
      const wrapCls = cls({
        [PREFIX_CONTENT]: true,
        [`${PREFIX_CONTENT}-${mode}`]: bubble || userBubble,
        [`${PREFIX_CONTENT}-no-bubble`]: !(bubble || userBubble),
        [`${PREFIX_CONTENT}-user`]: isUser,
        [`${PREFIX_CONTENT}-error`]: status === STATUS.FAILED && (bubble || userBubble),
      });

      const customRenderer = (type: string, index: number, item: any) => {
        const customRendererFunc = renderDialogueContentItem?.[type];
        if (!customRendererFunc) return null;
        let renderer: any;
        if (TOOL_CALL_TYPES.includes(type as any)) {
          const functionName = item?.name;
          if (typeof customRendererFunc === 'object' && functionName) renderer = customRendererFunc[functionName];
        }
        if (!renderer && typeof customRendererFunc === 'function') renderer = customRendererFunc;
        if (renderer) return h('div', { class: `${PREFIX_CONTENT}-custom-renderer`, key: `index-${index}` }, [renderer(item, message)]);
        return null;
      };

      const renderMarkdown = (text: string, key: any) => {
        if (text === '') return null;
        const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(text) : text;
        return h('div', { class: wrapCls, key }, [
          h(MarkdownRender, { format: 'md', raw: rawText, components: markdownComponents, ...(markdownRenderProps || {}) }),
          role === ROLE.USER && showReference
            ? h(
                'div',
                {
                  class: `${PREFIX_CONTENT}-icon-reference`,
                  role: 'button',
                  tabindex: 0,
                  onClick: () => onReferenceClick?.({ type: 'text', content: text }),
                },
                [h(IconSendMsgStroked)]
              )
            : null,
        ]);
      };

      const renderMessage = (msg: any, index: number) => {
        if (typeof msg.content === 'string') return renderMarkdown(msg.content, `msg-${index}`);
        const inner = (msg.content ?? []) as any[];
        const isImageList = inner.filter((i) => i?.type === MESSAGE_ITEM_TYPE.INPUT_IMAGE).length > 1;
        return inner.map((i, innerIdx) => {
          const customNode = customRenderer(i?.type as string, index, i);
          if (customNode) return customNode;
          if (TEXT_TYPES.includes(i?.type as string)) {
            const annotation = i.annotations;
            const filteredAnnotation = annotation && annotation.length > 0 && annotation.filter((item: any) => item.type !== 'file_citation' && item.type !== 'container_file_citation');
            return h(Fragment, { key: `msg-${index}-${innerIdx}` }, [
              filteredAnnotation && filteredAnnotation.length > 0
                ? h(AnnotationWidget, {
                    annotation: filteredAnnotation,
                    maxCount: 15,
                    onClick: () => onAnnotationClick?.(filteredAnnotation),
                  })
                : null,
              renderMarkdown(i.text || '', `msg-${index}-${innerIdx}`),
              renderMarkdown(i.refusal || '', `msg-${index}-${innerIdx}-refusal`),
            ]);
          }
          if (i?.type === MESSAGE_ITEM_TYPE.INPUT_IMAGE) {
            const nextItemType = inner[innerIdx + 1]?.type;
            const isLastImage = innerIdx === inner.length - 1 || nextItemType === MESSAGE_ITEM_TYPE.INPUT_FILE;
            return h(Fragment, { key: `msg-${index}-${innerIdx}` }, [
              h(ImageAttachment, { src: i.image_url, isList: isImageList, msg: i, onImageClick, isLastImage }),
              nextItemType === MESSAGE_ITEM_TYPE.INPUT_FILE ? h('br') : null,
            ]);
          }
          if (i?.type === MESSAGE_ITEM_TYPE.INPUT_FILE) {
            const nextItemType = inner[innerIdx + 1]?.type;
            const isLastFile = innerIdx === inner.length - 1 || nextItemType === MESSAGE_ITEM_TYPE.INPUT_IMAGE;
            return h(Fragment, { key: `msg-${index}-${innerIdx}` }, [
              h(FileAttachment, {
                ...i,
                onFileClick,
                disabledFileItemClick: !!disabledFileItemClick,
                role,
                onReferenceClick,
                showReference,
                isLastFile,
              }),
              nextItemType === MESSAGE_ITEM_TYPE.INPUT_IMAGE ? h('br') : null,
            ]);
          }
          return null;
        });
      };

      const renderToolCall = (item: any, index: number) =>
        h('div', { class: `${PREFIX_CONTENT}-tool-call`, key: `tool-${index}` }, [h(IconWrench), item.name, ' ', item.arguments]);

      const builtinRenderers: Record<string, (item: any, index: number) => any> = {
        [MESSAGE_ITEM_TYPE.MESSAGE]: (item, index) => renderMessage(item, index),
        [MESSAGE_ITEM_TYPE.REASONING]: (item, index) =>
          h(ReasoningWidget, {
            key: `reason-${index}`,
            summary: item.summary,
            content: item.content,
            status: item.status,
            markdownRenderProps,
          }),
        [MESSAGE_ITEM_TYPE.FUNCTION_CALL]: renderToolCall,
        [MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL]: renderToolCall,
      };

      const isLoading = [STATUS.QUEUED, STATUS.IN_PROGRESS, STATUS.INCOMPLETE].includes(status);
      const isOutputExist = (content && content?.length > 0) || message.output_text;
      const loadingNode =
        isLoading && !isOutputExist
          ? h('span', { class: `${PREFIX_CONTENT}-loading` }, [
              h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
              h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
              h('span', { class: `${PREFIX_CONTENT}-loading-item` }),
              h('span', { class: `${PREFIX_CONTENT}-loading-text` }, locale.value?.loading),
            ])
          : null;

      let node: any;
      if (editing) {
        node = messageEditRender?.(messageToChatInput(message));
      } else {
        let realContent: any;
        const textContent = typeof content === 'string' ? content : message.output_text;
        if (textContent) {
          const defaultRenderer = renderDialogueContentItem?.default;
          if (typeof defaultRenderer === 'function') {
            realContent = h('div', { class: `${PREFIX_CONTENT}-custom-renderer` }, [defaultRenderer(textContent, message)]);
          } else {
            const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(textContent) : textContent;
            realContent = h('div', { class: wrapCls }, [
              h(MarkdownRender, { format: 'md', raw: rawText, components: markdownComponents, ...(markdownRenderProps || {}) }),
              role === ROLE.USER && showReference
                ? h(
                    'div',
                    {
                      class: `${PREFIX_CONTENT}-icon-reference`,
                      role: 'button',
                      tabindex: 0,
                      onClick: () => onReferenceClick?.({ type: 'text', content: textContent }),
                    },
                    [h(IconSendMsgStroked)]
                  )
                : null,
            ]);
          }
        } else if (Array.isArray(content)) {
          realContent = content.map((item: any, index: number) => {
            const typeKey = item?.type as string | undefined;
            const effectiveType = typeKey ?? MESSAGE_ITEM_TYPE.MESSAGE;
            const customNode = customRenderer(effectiveType, index, item);
            if (customNode) return customNode;
            const renderer = builtinRenderers[effectiveType];
            if (renderer) return renderer(item, index);
            return null;
          });
        }
        node = h('div', { class: `${PREFIX_CONTENT}-wrapper` }, [
          status === STATUS.FAILED || status === STATUS.CANCELLED ? h('div', { class: `${PREFIX_CONTENT}-failed` }, [h(IconAlertCircle)]) : null,
          h('div', { class: `${PREFIX_CONTENT}-inner` }, realContent),
        ]);
      }

      if (customRenderFunc) {
        return customRenderFunc({ message, role: roleInfo, defaultContent: node, className: wrapCls });
      }
      return h('div', { class: cls(PREFIX_CONTENT, { [`${PREFIX_CONTENT}-editing`]: editing }) }, [
        references && references.length > 0 && !editing ? h(ReferenceWidget, { references }) : null,
        node,
        loadingNode,
      ]);
    };
  },
});

export default DialogueContent;
