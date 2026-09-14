import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { omit } from 'lodash';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/feedback/constants';
import FeedbackFoundation from '@douyinfe/semi-foundation/lib/es/feedback/foundation';
import '@douyinfe/semi-foundation/lib/es/feedback/feedback.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, flattenChildren, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import TextArea from '../input/TextArea';
import { RadioGroup } from '../radio';
import { CheckboxGroup } from '../checkbox';
import Button from '../button/Button';
import Modal from '../modal/Modal';
import SideSheet from '../sideSheet/SideSheet';

const prefixCls = cssClasses.PREFIX;
const { Emoji } = strings;

export const feedbackProps = {
  mode: { type: String as PropType<'modal' | 'popup'>, default: 'popup' },
  type: { type: String as PropType<'text' | 'emoji' | 'radio' | 'checkbox' | 'custom'>, default: 'emoji' },
  textAreaProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  radioGroupProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  checkboxGroupProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  renderContent: { type: Function as PropType<(content: any) => any>, default: undefined },
  okButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  cancelButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  footer: { type: [String, Number, Object, Function, Array, Boolean] as PropType<any>, default: undefined },
  visible: { type: Boolean, default: undefined },
  title: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const feedbackEmits = ['valueChange', 'cancel', 'ok', 'afterClose', 'update:visible'];

const Feedback = defineComponent({
  name: 'Feedback',
  inheritAttrs: false,
  props: feedbackProps,
  emits: feedbackEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { locale } = useLocale('Feedback');
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      value: null as any,
      onOKReturnPromiseStatus: 'fulfilled' as string,
      onCancelReturnPromiseStatus: 'fulfilled' as string,
    });

    const adapter = {
      ...baseAdapter,
      setValue: (value: any) => {
        state.value = value;
      },
      notifyValueChange: (value: any) => {
        state.value = value;
        emit('valueChange', value);
      },
      notifyClose: () => emit('afterClose'),
      notifyCancel: (e: any) => {
        emit('cancel', e);
        emit('update:visible', false);
      },
      notifyOk: (e: any) => {
        emit('ok', e);
        emit('update:visible', false);
      },
      notifyTextAreaChange: (value: string, e: any) => {
        props.textAreaProps?.onChange?.(value, e);
      },
      notifyCheckBoxChange: (value: any[]) => {
        props.checkboxGroupProps?.onChange?.(value);
      },
      notifyRadioChange: (e: any) => {
        props.radioGroupProps?.onChange?.(e);
      },
    };
    const foundation = new (FeedbackFoundation as any)(adapter);

    const disableSubmitButton = () => {
      const value = state.value;
      return !Boolean(value) || (Array.isArray(value) && value.length === 0);
    };

    const textNode = () =>
      h(TextArea, {
        onChange: (value: string, e: any) => foundation.handleTextChange(value, e),
        placeholder: 'Provider additional feedback',
        ...(props.textAreaProps || {}),
      });

    const emojiNode = () => {
      const { emoji } = (state.value ?? {}) as { emoji?: string; text?: string };
      return [
        h(
          'div',
          { class: `${prefixCls}-emoji-container` },
          Object.values(Emoji).map((item: string) =>
            h(
              'span',
              {
                key: item,
                class: cls(`${prefixCls}-emoji-item`, { [`${prefixCls}-emoji-item-selected`]: item === emoji }),
                'data-value': item,
                onClick: (e: MouseEvent) => foundation.handleEmojiClick(e),
              },
              item
            )
          )
        ),
        emoji === Emoji.bad
          ? h(TextArea, {
              onChange: (value: string, e: any) => foundation.handleEmojiReasonChange(value, e),
              placeholder: 'Provider additional feedback(optional)',
              ...(props.textAreaProps || {}),
            })
          : null,
      ];
    };

    const radioNode = () =>
      h('div', { class: `${prefixCls}-radio-container` }, [
        h(RadioGroup, {
          direction: 'vertical',
          onChange: (e: any) => foundation.handleRadioChange(e),
          ...omit(props.radioGroupProps || {}, 'onChange'),
        }),
      ]);

    const checkboxNode = () =>
      h('div', { class: `${prefixCls}-checkbox-container` }, [
        h(CheckboxGroup, {
          direction: 'vertical',
          onChange: (value: any) => foundation.handleCheckboxChange(value),
          ...omit(props.checkboxGroupProps || {}, 'onChange'),
        }),
      ]);

    const getRealChildren = () => {
      let result: any = null;
      switch (props.type) {
        case 'custom':
          result = flattenChildren(slots.default?.());
          break;
        case 'text':
          result = textNode();
          break;
        case 'emoji':
          result = emojiNode();
          break;
        case 'radio':
          result = radioNode();
          break;
        case 'checkbox':
          result = checkboxNode();
          break;
        default:
          break;
      }
      if (typeof props.renderContent === 'function') result = props.renderContent(result);
      return result;
    };

    const renderFooter = (loc: any) => {
      // React `footer={null}` / `footer={false}` hides the footer (used by the "thanks" demo)
      if (props.footer === null || props.footer === false) return null;
      if (props.footer !== undefined) return normalizeNode(props.footer);
      if (slots.footer) return slots.footer();
      return h('div', { class: `${prefixCls}-footer` }, [
        h(
          Button,
          {
            type: 'primary',
            onClick: (e: MouseEvent) => foundation.handleCancel(e),
            loading: state.onCancelReturnPromiseStatus === 'pending',
            ...(props.cancelButtonProps || {}),
          },
          () => loc.cancel
        ),
        h(
          Button,
          {
            type: 'primary',
            theme: 'solid',
            disabled: disableSubmitButton(),
            onClick: (e: MouseEvent) => foundation.handleSubmit(e),
            loading: state.onOKReturnPromiseStatus === 'pending',
            ...(props.okButtonProps || {}),
          },
          () => loc.submit
        ),
      ]);
    };

    expose({ foundation, state, disableSubmitButton });

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const loc = locale.value || {};
      const restProps = foundation.getRestProps();
      const realChildren = getRealChildren();
      const disabledOkButton = disableSubmitButton();
      const realCls = cls(prefixCls, props.className, attrClass, {
        [`${prefixCls}-${props.type}`]: props.type,
      });
      if (props.mode === 'modal') {
        return h(
          Modal,
          {
            okButtonProps: { disabled: disabledOkButton, ...(restProps.okButtonProps || {}) },
            okText: loc.submit,
            cancelText: loc.cancel,
            className: realCls,
            style: [props.style, attrStyle],
            visible: props.visible,
            ...omit(restProps, ['okButtonProps', 'className', 'style', 'visible', 'footer']),
            ...(props.footer !== undefined ? { footer: props.footer } : {}),
            ...getDataAttr(rest),
            onOk: (e: MouseEvent) => foundation.handleModalOk(e),
            onCancel: (e: MouseEvent) => foundation.handleModalCancel(e),
            'onUpdate:visible': (v: boolean) => emit('update:visible', v),
          },
          () => realChildren
        );
      }
      return h(
        SideSheet,
        {
          mask: false,
          disableScroll: false,
          canVerticalSetWidth: true,
          placement: 'bottom',
          height: 'auto',
          className: realCls,
          style: [props.style, attrStyle],
          footer: renderFooter(loc),
          visible: props.visible,
          onCancel: (e: MouseEvent) => foundation.handleCancel(e),
          'onUpdate:visible': (v: boolean) => emit('update:visible', v),
          ...omit(restProps, ['className', 'style', 'footer', 'visible']),
          ...getDataAttr(rest),
        },
        () => realChildren
      );
    };
  },
});

(Feedback as any).elementType = 'Feedback';
export default Feedback;
