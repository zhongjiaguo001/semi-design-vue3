import { defineComponent, h, ref, onBeforeUnmount, onMounted, watch } from 'vue';
import _throttle from 'lodash/throttle';
import _isEqual from 'lodash/isEqual';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import AIChatInputFoundation from '@douyinfe/semi-foundation/lib/es/aiChatInput/foundation';
import { getAttachmentType, isImageType, getContentType, getCustomSlotAttribute, getSkillSlotString } from '@douyinfe/semi-foundation/lib/es/aiChatInput/utils';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/aiChatInput/aiChatInput.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';
import { useLocale } from '../locale';
import { useConfigContext } from '../configProvider/context';
import { TextSelection, NodeSelection } from '@tiptap/pm/state';
import RichTextInput from './richTextInput';
import Upload from '../upload/Upload';
import Progress from '../progress/Progress';
import Tooltip from '../tooltip/Tooltip';
import Popover from '../popover/Popover';
import {
  IconArrowUp,
  IconStop,
  IconPaperclip,
  IconClose,
  IconSendMsgStroked,
  IconCrossStroked,
  IconFile,
  IconPdf,
  IconWord,
  IconExcel,
  IconCode,
  IconVideo,
  IconMusic,
  IconTemplateStroked,
} from '../icons/generated';
import Configure, { getConfigureItem } from './configure';
import SkillItem from './skillItem';
import SuggestionItem from './suggestionItem';
import HorizontalScroller from './horizontalScroller';

const prefixCls = cssClasses.PREFIX;

export const aiChatInputProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  placeholder: { type: [String, Function] as PropType<any>, default: undefined },
  generating: { type: Boolean, default: false },
  round: { type: Boolean, default: true },
  sendHotKey: { type: String as PropType<'enter' | 'shift+enter'>, default: strings.SEND_HOTKEY.ENTER as 'enter' },
  showUploadButton: { type: Boolean, default: true },
  canSend: { type: Boolean, default: undefined },
  defaultContent: { type: [String, Object] as PropType<any>, default: '' },
  uploadProps: { type: Object as PropType<any>, default: () => ({}) },
  uploadTipProps: { type: Object as PropType<any>, default: undefined },
  references: { type: Array as PropType<any[]>, default: undefined },
  skills: { type: Array as PropType<any[]>, default: undefined },
  skillHotKey: { type: String, default: '/' },
  onMessageSend: { type: Function as PropType<(payload: any) => void>, default: undefined },
  onStopGenerate: { type: Function as PropType<() => void>, default: undefined },
  onContentChange: { type: Function as PropType<(result: any[]) => void>, default: undefined },
  onSkillChange: { type: Function as PropType<(skill: any) => void>, default: undefined },
  onConfigureChange: { type: Function as PropType<(value: any, changed: any) => void>, default: undefined },
  renderActionArea: { type: Function as PropType<(props: { menuItem: any[]; className: string }) => any>, default: undefined },
  clearContentOnGenerating: { type: Boolean, default: true },
  showUploadFile: { type: Boolean, default: true },
  showReference: { type: Boolean, default: true },
  topSlotPosition: { type: String as PropType<'top' | 'middle' | 'bottom'>, default: 'top' },
  renderTopSlot: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderReference: { type: Function as PropType<(reference: any) => any>, default: undefined },
  onUploadChange: { type: Function as PropType<(info: any) => void>, default: undefined },
  onReferenceDelete: { type: Function as PropType<(reference: any) => void>, default: undefined },
  onReferenceClick: { type: Function as PropType<(reference: any) => void>, default: undefined },
  suggestions: { type: Array as PropType<any[]>, default: undefined },
  renderConfigureArea: { type: Function as PropType<(className?: string) => any>, default: undefined },
  renderUploadButton: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderSkillItem: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderSuggestionItem: { type: Function as PropType<(props: any) => any>, default: undefined },
  onSuggestClick: { type: Function as PropType<(suggestion: any) => void>, default: undefined },
  renderTemplate: { type: Function as PropType<(skill: any, onTemplateClick: (content: string) => void) => any>, default: undefined },
  onTemplateVisibleChange: { type: Function as PropType<(visible: boolean) => void>, default: undefined },
  showTemplateButton: { type: Boolean, default: false },
  templatesCls: { type: String, default: undefined },
  templatesStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMatchTriggerWidth: { type: Boolean, default: true },
  popoverProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  transformer: { type: Object as PropType<Map<string, (obj: any) => any>>, default: undefined },
  extensions: { type: Array as PropType<any[]>, default: undefined },
  immediatelyRender: { type: Boolean, default: undefined },
  showPlaceholderWhenSkillOnly: { type: Boolean, default: false },
  keepSkillAfterSend: { type: Boolean, default: false },
  onPaste: { type: Function as PropType<(e: ClipboardEvent) => void>, default: undefined },
  onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
  onBlur: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
};

export const aiChatInputEmits = [
  'messageSend',
  'stopGenerate',
  'contentChange',
  'skillChange',
  'uploadChange',
  'referenceDelete',
  'referenceClick',
  'configureChange',
  'suggestClick',
  'templateVisibleChange',
  'focus',
  'blur',
  'paste',
];

const AIChatInput = defineComponent({
  name: 'AIChatInput',
  inheritAttrs: false,
  props: aiChatInputProps,
  emits: aiChatInputEmits,
  setup(props, { attrs, emit, expose, slots }) {
    const { locale } = useLocale('AIChatInput');
    // React render props are also accepted as same-named scoped slots (slot wins), per PORTING.md
    const renderOrSlot = (slotName: string, renderFn: ((...args: any[]) => any) | undefined, ...args: any[]) => {
      const slot = (slots as any)[slotName];
      if (slot) return slot(...args);
      return renderFn ? renderFn(...args) : undefined;
    };
    const hasRenderer = (slotName: string, renderFn: any) => Boolean((slots as any)[slotName] || renderFn);
    const configContext = useConfigContext();
    let transformedContent: any[] = [];
    const uploadRef = ref<any>(null);
    const triggerRef = ref<HTMLDivElement | null>(null);
    const richTextDIVRef = ref<HTMLDivElement | null>(null);
    const suggestionPanelRef = ref<HTMLDivElement | null>(null);
    const configureRef = ref<any>(null);
    const popUpOptionListID = getUuidShort();
    let editorInstance: any = null;
    const editorEpoch = ref(0);
    let clickOutsideHandler: any = null;

    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      popupKey: 1,
      templateVisible: false,
      skillVisible: false,
      suggestionVisible: false,
      attachments: (props.uploadProps?.defaultFileList ?? []) as any[],
      content: null as any,
      popupWidth: null as any,
      skill: undefined as any,
      activeSkillIndex: 0,
      activeSuggestionIndex: 0,
      richTextInit: false,
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
            // foundation.onUploadChange calls props.onUploadChange directly: route it through notify so the emit fires once
            if (key === 'onUploadChange') return (info: any) => notify('onUploadChange', 'uploadChange', info);
            return Reflect.get(target, key);
          },
        });
      },
      reposPopover: _throttle(() => {
        if (state.templateVisible) state.popupKey += 1;
      }, 200),
      setContent: (content: any) => {
        editorInstance?.commands?.setContent(content);
        editorEpoch.value += 1;
      },
      focusEditor: (pos?: any) => editorInstance?.commands?.focus(pos || 'end'),
      getTriggerWidth: () => triggerRef.value?.offsetWidth || 0,
      getEditor: () => editorInstance,
      getPopupID: () => popUpOptionListID,
      notifyContentChange: (result: any[]) => {
        transformedContent = result;
        notify('onContentChange', 'contentChange', result);
      },
      notifyConfigureChange: (value: any, changed: any) => notify('onConfigureChange', 'configureChange', value, changed),
      manualUpload: (files: File[]) => uploadRef.value?.insert?.(files),
      notifyMessageSend: (payload: any) => notify('onMessageSend', 'messageSend', payload),
      notifyStopGenerate: () => notify('onStopGenerate', 'stopGenerate'),
      notifySkillChange: (skill: any) => notify('onSkillChange', 'skillChange', skill),
      clearContent: () => adapter.setContent(''),
      clearAttachments: () => {
        state.attachments = [];
      },
      getRichTextDiv: () => richTextDIVRef.value,
      registerClickOutsideHandler: (cb: (e: any) => void) => {
        if (clickOutsideHandler) adapter.unregisterClickOutsideHandler();
        clickOutsideHandler = (e: Event) => {
          const optionsDom = suggestionPanelRef.value;
          const triggerDom = triggerRef.value;
          const target = e.target as Element;
          const path = ((e as any).composedPath && (e as any).composedPath()) || [target];
          if (
            optionsDom &&
            (!optionsDom.contains(target) || !optionsDom.contains(target.parentNode as Node)) &&
            triggerDom &&
            !triggerDom.contains(target) &&
            !(path.includes(triggerDom) || path.includes(optionsDom))
          ) {
            cb(e);
          }
        };
        document.addEventListener('mousedown', clickOutsideHandler, false);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) {
          document.removeEventListener('mousedown', clickOutsideHandler, false);
          clickOutsideHandler = null;
        }
      },
      handleReferenceDelete: (reference: any) => notify('onReferenceDelete', 'referenceDelete', reference),
      handleReferenceClick: (reference: any) => notify('onReferenceClick', 'referenceClick', reference),
      isSelectionText: (selection: any) => selection instanceof TextSelection,
      createSelection: (node: any, pos: number) => NodeSelection.create(node, pos),
      notifyFocus: (e: any) => notify('onFocus', 'focus', e),
      notifyBlur: (e: any) => notify('onBlur', 'blur', e),
      getConfigureValue: () => configureRef.value?.getConfigureValue?.() ?? {},
    };
    const foundation = new (AIChatInputFoundation as any)(adapter);
    onMounted(() => foundation.init?.());
    onBeforeUnmount(() => foundation.destroy());

    const setContent = (content: any) => adapter.setContent(content);
    const setContentWhileSaveTool = (content: string) => {
      const skill = state.skill;
      const realContent = skill ? `<p>${getSkillSlotString(skill)}${content}</p>` : `<p>${content}</p>`;
      setContent(realContent);
    };
    const changeTemplateVisible = (visible: boolean) => {
      foundation.changeTemplateVisible(visible);
      notify('onTemplateVisibleChange', 'templateVisibleChange', visible);
    };
    const handleSuggestionSelect = (suggestion: any) => {
      foundation.handleSuggestionSelect(suggestion);
      notify('onSuggestClick', 'suggestClick', suggestion);
    };

    // React componentDidUpdate parity
    watch(
      () => props.suggestions,
      (next, prev) => {
        if (_isEqual(next, prev)) return;
        const newVisible = Boolean(next && next.length > 0);
        newVisible ? foundation.showSuggestionPanel() : foundation.hideSuggestionPanel();
      }
    );
    watch(
      () => props.generating,
      (next, prev) => {
        if (next && next !== prev && props.clearContentOnGenerating !== false) {
          props.keepSkillAfterSend ? setContentWhileSaveTool('') : adapter.clearContent();
          adapter.clearAttachments();
        }
      }
    );

    expose({
      foundation,
      state,
      send: () => foundation.handleSend(),
      stopGenerate: () => foundation.handleStopGenerate(),
      focus: () => editorInstance?.commands?.focus?.('end'),
      focusEditor: (pos?: any) => adapter.focusEditor(pos),
      getEditor: () => adapter.getEditor(),
      setContent,
      setContentWhileSaveTool,
      deleteContent: (content: any) => foundation.handleDeleteContent(content),
      deleteUploadFile: (item: any) => foundation.handleUploadFileDelete(item),
      changeTemplateVisible,
    });

    const getIconByType = (type: string, size: 'small' | 'large' = 'small') => {
      if (type === 'text') return null;
      const map: Record<string, any> = { file: IconWord, word: IconWord, code: IconCode, excel: IconExcel, video: IconVideo, audio: IconMusic, pdf: IconPdf };
      const Comp = map[type] || IconFile;
      return h(Comp, { size });
    };
    const getReferenceIconByType = (type: string) =>
      h('span', { class: `${prefixCls}-ref-icon ${prefixCls}-ref-icon-${type} ${prefixCls}-reference-icon` }, [getIconByType(type)]);
    const getAttachmentIconByType = (type: string) =>
      h('span', { class: `${prefixCls}-attachment-icon ${prefixCls}-ref-icon ${prefixCls}-ref-icon-${type}` }, [getIconByType(type, 'large')]);

    const renderSkill = () =>
      h(
        'div',
        {
          id: `${prefixCls}-skill-${popUpOptionListID}`,
          class: `${prefixCls}-skill`,
          style: { width: state.popupWidth, maxHeight: numbers.SKILL_MAX_HEIGHT },
        },
        (props.skills || []).map((item: any, index: number) =>
          h(SkillItem, {
            index,
            isActive: state.activeSkillIndex === index,
            key: item.key || item.value,
            skill: item,
            renderSkillItem: hasRenderer('skillItem', props.renderSkillItem) ? (p: any) => renderOrSlot('skillItem', props.renderSkillItem, p) : undefined,
            onClick: (skill: any) => foundation.handleSkillSelect(skill),
            onMouseEnter: (i: number) => foundation.setActiveSkillIndex(i),
          })
        )
      );

    const renderSuggestions = () =>
      h(
        'div',
        {
          id: `${prefixCls}-suggestion-${popUpOptionListID}`,
          class: `${prefixCls}-suggestion`,
          style: { width: state.popupWidth, maxHeight: numbers.SUGGESTION_MAX_HEIGHT },
          ref: suggestionPanelRef,
        },
        (props.suggestions || []).map((item: any, index: number) =>
          h(SuggestionItem, {
            index,
            key: typeof item === 'string' ? item : item?.content ?? index,
            suggestion: item,
            isActive: state.activeSuggestionIndex === index,
            renderSuggestionItem: hasRenderer('suggestionItem', props.renderSuggestionItem) ? (p: any) => renderOrSlot('suggestionItem', props.renderSuggestionItem, p) : undefined,
            onClick: (suggestion: any) => {
              handleSuggestionSelect(suggestion);
              foundation.hideSuggestionPanel();
            },
            onMouseEnter: (i: number) => foundation.setActiveSuggestionIndex(i),
          })
        )
      );

    const renderTemplate = () =>
      h(
        'div',
        {
          class: cls(`${prefixCls}-template`, { [props.templatesCls as string]: props.templatesCls }),
          style: { width: state.popupWidth, maxHeight: numbers.TEMPLATE_MAX_HEIGHT, ...(props.templatesStyle || {}) },
        },
        renderOrSlot('template', props.renderTemplate, state.skill, setContent)
      );

    const renderPopoverContent = () => {
      if (state.templateVisible) return renderTemplate();
      if (state.skillVisible) return renderSkill();
      if (state.suggestionVisible) return renderSuggestions();
      return null;
    };

    const renderUploadNode = () => {
      if (!props.showUploadButton) return null;
      const { children, ...rest } = props.uploadProps ?? {};
      const defaultButtonNode = h('button', { class: `${prefixCls}-footer-action-button ${prefixCls}-footer-action-upload`, type: 'button' }, [h(IconPaperclip)]);
      const openFileDialog = () => uploadRef.value?.openFileDialog?.();
      const uploadChild = hasRenderer('uploadButton', props.renderUploadButton)
        ? renderOrSlot('uploadButton', props.renderUploadButton, {
            defaultNode: children ?? defaultButtonNode,
            openFileDialog,
            disabled: Boolean(props.uploadProps?.disabled),
            attachments: state.attachments ?? [],
          })
        : children ?? defaultButtonNode;
      const uploadNode = h(
        Upload,
        {
          ref: uploadRef,
          fileList: state.attachments,
          listType: 'none',
          ...rest,
          key: 'upload',
          onChange: (info: any) => foundation.onUploadChange(info),
        },
        () => uploadChild
      );
      return props.uploadTipProps ? h(Tooltip, { ...props.uploadTipProps, key: 'upload' }, () => h('span', null, [uploadNode])) : uploadNode;
    };

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { generating, round, placeholder, className, style, renderActionArea, showUploadFile, showReference, references } = props;
      const loc = locale.value || {};
      void editorEpoch.value;
      const canSend = foundation.canSend();
      const sendBtn = h(
        'button',
        {
          key: 'send',
          class: cls(`${prefixCls}-footer-action-button`, {
            [`${prefixCls}-footer-action-send`]: !generating,
            [`${prefixCls}-footer-action-stop`]: generating,
            [`${prefixCls}-footer-action-send-disabled`]: !generating && !canSend,
          }),
          onClick: generating ? () => foundation.handleStopGenerate() : () => foundation.handleSend(),
        },
        [generating ? h(IconStop) : h(IconArrowUp)]
      );
      const uploadNode = renderUploadNode();
      const actionNodes = [uploadNode, sendBtn].filter(Boolean);
      const actionCls = `${prefixCls}-footer-action`;
      const footerRight = hasRenderer('actionArea', renderActionArea) ? renderOrSlot('actionArea', renderActionArea, { menuItem: actionNodes, className: actionCls }) : h('div', { class: actionCls }, actionNodes);

      const hasTemplate = Boolean(state.skill?.hasTemplate);
      const templateBtn =
        props.showTemplateButton || hasTemplate
          ? h(
              (Configure as any).Button,
              {
                key: 'template',
                field: 'template',
                onClick: (visible: boolean) => changeTemplateVisible(visible),
                icon: IconTemplateStroked,
              },
              () => loc.template
            )
          : null;
      const configureChildren = [renderOrSlot('configureArea', props.renderConfigureArea), templateBtn].filter(Boolean);
      const footerLeft = h(Configure, {
        ref: configureRef,
        round,
        onChange: (value: any, changed: any) => foundation.onConfigureChange?.(value, changed),
      }, () => configureChildren);

      const attachments = state.attachments || [];
      const attachmentNode =
        showUploadFile && attachments.length
          ? h(HorizontalScroller, { prefix: prefixCls }, () =>
              attachments.map((item: any) => {
                const isImage = isImageType(item);
                const realType = getAttachmentType(item);
                const sign = getContentType(realType);
                const showPercent = !(item.percent === 100 || typeof item.percent === 'undefined') && item.status === 'uploading';
                return h('div', { class: `${prefixCls}-attachment`, key: item.uid }, [
                  isImage ? h('img', { class: `${prefixCls}-attachment-img`, src: item.url, alt: item.name }) : getAttachmentIconByType(sign),
                  h('div', { class: `${prefixCls}-attachment-content` }, [
                    h('div', { class: `${prefixCls}-attachment-content-name` }, item.name),
                    h('div', { class: `${prefixCls}-attachment-content-size` }, `${realType} ${item.size ?? ''}`),
                  ]),
                  showPercent ? h(Progress, { type: 'circle', width: 30, class: `${prefixCls}-attachment-progress`, percent: item.percent, showInfo: false, 'aria-label': 'upload progress' }) : null,
                  h(IconClose, { class: `${prefixCls}-attachment-delete`, size: 'small', onClick: () => foundation.handleUploadFileDelete(item) }),
                ]);
              })
            )
          : null;

      const referenceList = references || [];
      const referenceNode =
        showReference && referenceList.length
          ? h(
              'div',
              { class: `${prefixCls}-references` },
              referenceList.map((item: any) => {
                if (hasRenderer('reference', props.renderReference)) return renderOrSlot('reference', props.renderReference, item);
                const isImage = isImageType(item);
                const sign = getContentType(getAttachmentType(item));
                return h(
                  'div',
                  {
                    key: item.id,
                    class: `${prefixCls}-reference`,
                    onClick: () => foundation.handleReferenceClick(item),
                  },
                  [
                    h(IconSendMsgStroked),
                    h('span', { class: `${prefixCls}-reference-content` }, [
                      item.type !== 'text' ? (isImage ? h('img', { class: `${prefixCls}-reference-img`, src: item.url, alt: item.name }) : getReferenceIconByType(sign)) : null,
                      h('span', { class: `${prefixCls}-reference-name` }, item.type === 'text' ? item.content : item.name),
                    ]),
                    h(IconCrossStroked, {
                      size: 'small',
                      class: `${prefixCls}-reference-delete`,
                      onClick: (e: MouseEvent) => {
                        e.stopPropagation();
                        adapter.handleReferenceDelete(item);
                      },
                    }),
                  ]
                );
              })
            )
          : null;

      const topSlot = renderOrSlot('topSlot', props.renderTopSlot, {
        references,
        attachments,
        content: transformedContent,
        handleUploadFileDelete: (item: any) => foundation.handleUploadFileDelete(item),
        handleReferenceDelete: (item: any) => adapter.handleReferenceDelete(item),
      });
      const pos = props.topSlotPosition || 'top';
      const inner = h(
        'div',
        {
          class: cls(prefixCls, className, attrClass, { [`${prefixCls}-round`]: round }),
          style: [style, attrStyle],
          ref: triggerRef,
          onClick: (e: MouseEvent) => foundation.handleContainerClick(e),
          onMousedown: (e: MouseEvent) => foundation.handleContainerMouseDown(e),
          ...getDataAttr(rest),
        },
        [
          pos === 'top' ? topSlot : null,
          referenceNode,
          pos === 'middle' ? topSlot : null,
          attachmentNode,
          pos === 'bottom' ? topSlot : null,
          h('div', { class: `${prefixCls}-editor`, ref: richTextDIVRef }, [
            h(RichTextInput, {
              defaultContent: props.defaultContent,
              placeholder,
              immediatelyRender: props.immediatelyRender !== false,
              extensions: props.extensions,
              showPlaceholderWhenSkillOnly: props.showPlaceholderWhenSkillOnly,
              setEditor: (ed: any) => {
                editorInstance = ed;
              },
              onChange: (content: string) => {
                foundation.handleContentChange(content);
                editorEpoch.value += 1;
              },
              onKeyDown: (e: KeyboardEvent) => foundation.handleKeyDown(e),
              handleKeyDown: (view: any, e: KeyboardEvent) => foundation.handRichTextArealKeyDown?.(view, e),
              onPaste: (files: File[]) => foundation.handlePaste(files),
              onPasteEvent: (e: ClipboardEvent) => notify('onPaste', 'paste', e),
              onFocus: (e: FocusEvent) => foundation.handleFocus(e),
              onBlur: (e: FocusEvent) => foundation.handleBlur(e),
              handleCreate: () => foundation.handleCreate?.(),
            }),
          ]),
          h('div', { class: cls(`${prefixCls}-footer`, { [`${prefixCls}-footer-round`]: round }) }, [footerLeft, footerRight]),
        ]
      );

      const popoverVisible = Boolean(state.templateVisible || state.skillVisible || state.suggestionVisible);
      const defaultPosition = configContext.direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
      return h(
        Popover,
        {
          position: defaultPosition,
          ...(props.popoverProps || {}),
          rePosKey: state.popupKey,
          className: cls({
            [`${prefixCls}-popover-suggestion`]: state.suggestionVisible,
            [`${prefixCls}-popover-skill`]: state.skillVisible,
            [`${prefixCls}-popover-template`]: state.templateVisible,
          }),
          content: () => renderPopoverContent(),
          visible: popoverVisible,
          trigger: 'custom',
          disableArrowKeyDown: true,
        },
        () => inner
      );
    };
  },
});

(AIChatInput as any).elementType = 'AIChatInput';
(AIChatInput as any).__SemiComponentName__ = 'AIChatInput';
(AIChatInput as any).Configure = Configure;
(AIChatInput as any).getConfigureItem = getConfigureItem;
(AIChatInput as any).getCustomSlotAttribute = getCustomSlotAttribute;
export default AIChatInput;
