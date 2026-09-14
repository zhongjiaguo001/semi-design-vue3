import { defineComponent, h, ref } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/chat/constants';
import InputBoxFoundation from '@douyinfe/semi-foundation/lib/es/chat/inputboxFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import Button from '../button/Button';
import Upload from '../upload/Upload';
import Tooltip from '../tooltip/Tooltip';
import TextArea from '../input/TextArea';
import { IconDeleteStroked, IconChainStroked, IconArrowUp } from '../icons/generated';
import Attachment from './attachment';
import { normalizeNode } from '../_utils';

const { PREFIX_INPUT_BOX } = cssClasses;
const { SEND_HOT_KEY } = strings;
const textAutoSize = { minRows: 1, maxRows: 5 };

const InputBox = defineComponent({
  name: 'ChatInputBox',
  props: {
    canSend: { type: Boolean, default: undefined },
    showClearContext: { type: Boolean, default: false },
    sendHotKey: { type: String as PropType<'enter' | 'shift+enter'>, default: undefined },
    placeholder: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    disableSend: { type: Boolean, default: false },
    uploadTipProps: { type: Object as PropType<any>, default: undefined },
    uploadProps: { type: Object as PropType<any>, default: () => ({}) },
    manualUpload: { type: Function as PropType<(file: File[]) => void>, default: undefined },
    renderInputArea: { type: Function as PropType<(props: any) => any>, default: undefined },
    clickUpload: { type: Boolean, default: undefined },
    pasteUpload: { type: Boolean, default: undefined },
    dragUpload: { type: Boolean, default: undefined },
    uploadRef: { type: Object as PropType<any>, default: undefined },
  },
  emits: ['send', 'clearContext', 'inputChange'],
  setup(props, { emit, expose }) {
    const inputAreaRef = ref<any>(null);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { content: '', attachment: [] as any[] });
    const adapter = {
      ...baseAdapter,
      notifyInputChange: (payload: { inputValue: string; attachment: any[] }) => emit('inputChange', payload),
      setInputValue: (value: string) => {
        state.content = value;
      },
      setAttachment: (attachment: any[]) => {
        state.attachment = attachment;
      },
      notifySend: (content: string, attachment: any[]) => emit('send', content, attachment),
    };
    const foundation = new (InputBoxFoundation as any)(adapter);

    expose({ foundation, state, focus: () => inputAreaRef.value?.focus?.() });

    return () => {
      const { content, attachment } = state;
      const { uploadProps = {}, uploadTipProps, clickUpload, pasteUpload, dragUpload, placeholder, sendHotKey, showClearContext, className, style, renderInputArea } = props;
      const { className: upCls, onChange, renderFileItem, children, ...restUpload } = uploadProps;
      const clearNode = h(Button, {
        class: `${PREFIX_INPUT_BOX}-clearButton`,
        theme: 'borderless',
        icon: IconDeleteStroked,
        onClick: (e: MouseEvent) => emit('clearContext', e),
      });
      let uploadNode: any = null;
      // Official enableUpload object can turn click/paste/drag on independently.
      // Keep Upload mounted for paste/drag even when the click trigger is hidden.
      if (clickUpload || pasteUpload || dragUpload) {
        const uploadInner = h(
          Upload,
          {
            ref: props.uploadRef,
            fileList: attachment,
            listType: 'none',
            ...restUpload,
            class: cls(`${PREFIX_INPUT_BOX}-upload`, { [upCls]: upCls }),
            onChange: (info: any) => foundation.onAttachmentAdd(info),
          },
          () =>
            clickUpload
              ? normalizeNode(children) || h(Button, { class: `${PREFIX_INPUT_BOX}-uploadButton`, icon: () => h(IconChainStroked, { size: 'extra-large' }), theme: 'borderless' })
              : h('span', { style: { display: 'none' }, 'aria-hidden': 'true' })
        );
        uploadNode = clickUpload && uploadTipProps ? h(Tooltip, { ...uploadTipProps }, () => h('span', null, [uploadInner])) : uploadInner;
      }
      const inputNode = h('div', { class: `${PREFIX_INPUT_BOX}-inputArea` }, [
        h(TextArea, {
          placeholder,
          onEnterPress: (e: any) => foundation.onEnterPress(e),
          value: content,
          onChange: (v: string) => foundation.onInputAreaChange(v),
          ref: inputAreaRef,
          class: `${PREFIX_INPUT_BOX}-textarea`,
          autosize: textAutoSize,
          disabledEnterStartNewLine: sendHotKey === SEND_HOT_KEY.ENTER,
          onPaste: (e: any) => foundation.onPaste?.(e),
        }),
        h(Attachment, { attachment, onClear: (item: any) => foundation.onAttachmentDelete(item) }),
      ]);
      const sendNode = h(Button, {
        disabled: foundation.getDisableSend(),
        theme: 'solid',
        type: 'primary',
        class: `${PREFIX_INPUT_BOX}-sendButton`,
        icon: () => h(IconArrowUp, { size: 'large', class: `${PREFIX_INPUT_BOX}-sendButton-icon` }),
        onClick: () => foundation.onSend(),
      });
      const nodes = h('div', { class: cls(PREFIX_INPUT_BOX, className), style }, [
        h('div', { class: `${PREFIX_INPUT_BOX}-inner`, onClick: () => inputAreaRef.value?.focus?.() }, [
          showClearContext ? clearNode : null,
          h('div', { class: `${PREFIX_INPUT_BOX}-container` }, [uploadNode, inputNode, sendNode]),
        ]),
      ]);
      if (renderInputArea) {
        return renderInputArea({
          defaultNode: nodes,
          onClear: (e: any) => emit('clearContext', e),
          onSend: (c: string, a: any[]) => emit('send', c, a),
          detailProps: { clearContextNode: clearNode, uploadNode, inputNode, sendNode, onClick: () => inputAreaRef.value?.focus?.() },
        });
      }
      return nodes;
    };
  },
});

export default InputBox;
