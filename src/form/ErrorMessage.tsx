import { defineComponent, h, isVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import { IconAlertTriangle, IconAlertCircle } from '../icons/generated';
import { normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

export const errorMessageProps = {
  error: { type: [Boolean, String, Number, Array, Object, Function] as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  showValidateIcon: { type: Boolean, default: undefined },
  validateStatus: { type: String, default: undefined },
  helpText: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  isInInputGroup: { type: Boolean, default: false },
  errorMessageId: { type: String, default: undefined },
  helpTextId: { type: String, default: undefined },
};

const ErrorMessage = defineComponent({
  name: 'FormErrorMessage',
  inheritAttrs: false,
  props: errorMessageProps,
  setup(props) {
    const generatorText = (error: any) => {
      const id = props.error ? props.errorMessageId : props.helpTextId;
      if (typeof error === 'string') return h('span', { id }, error);
      if (Array.isArray(error)) {
        const err = error.filter(Boolean);
        return err.length ? h('span', { id }, err.join(', ')) : null;
      }
      if (isVNode(error)) return error;
      return null;
    };

    return () => {
      const { error, className, style, validateStatus, helpText, showValidateIcon, isInInputGroup } = props;
      const cls = classNames(
        {
          [`${prefix}-field-error-message`]: Boolean(error),
          [`${prefix}-field-help-text`]: Boolean(helpText),
        },
        className
      );
      if (!error && !helpText) return null;
      if (error === '' && validateStatus === 'error') return null;
      const text = error ? generatorText(error) : generatorText(helpText);
      if (Array.isArray(error) && !text && !helpText) return null;
      const iconCls = `${prefix}-field-validate-status-icon`;
      let icon: any = null;
      if (isInInputGroup) {
        icon = h(IconAlertCircle, { class: iconCls });
      } else if (validateStatus === 'warning') {
        icon = h(IconAlertTriangle, { class: iconCls });
      } else if (validateStatus === 'error') {
        icon = h(IconAlertCircle, { class: iconCls });
      }
      return h('div', { class: cls, style }, [showValidateIcon && text ? icon : null, text ?? normalizeNode(helpText)]);
    };
  },
});

export default ErrorMessage;
