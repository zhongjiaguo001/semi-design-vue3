import { defineComponent, h, cloneVNode, isVNode } from 'vue';
import type { PropType } from 'vue';
import classNames from 'classnames';
import { isString } from 'lodash';
import { isValid } from '@douyinfe/semi-foundation/lib/es/form/utils';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import * as ObjectUtil from '@douyinfe/semi-foundation/lib/es/utils/object';
import ErrorMessage from './ErrorMessage';
import Label from './Label';
import { useFormUpdater, useFormState } from './context';
import InputGroup, { inputGroupProps } from '../input/InputGroup';
import { Col } from '../grid';
import { flattenChildren, normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

export const formInputGroupProps = {
  ...inputGroupProps,
  label: { type: [String, Object] as PropType<any>, default: undefined },
  extraText: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  extraTextPosition: { type: String as PropType<'bottom' | 'middle'>, default: 'bottom' },
};

const GroupError = defineComponent({
  name: 'FormInputGroupError',
  props: {
    showValidateIcon: { type: Boolean, default: undefined },
    isInInputGroup: { type: Boolean, default: true },
    fieldSet: { type: Array as PropType<string[]>, default: () => [] },
  },
  setup(props) {
    const formState = useFormState();
    return () => {
      const error = (props.fieldSet || []).map((field: string) => ObjectUtil.get(formState?.value?.errors, field));
      if (isValid(error)) return null;
      return h(ErrorMessage, {
        error,
        showValidateIcon: props.showValidateIcon,
        isInInputGroup: props.isInInputGroup,
      });
    };
  },
});

const FormInputGroup = defineComponent({
  name: 'FormInputGroup',
  inheritAttrs: false,
  props: formInputGroupProps,
  setup(props, { slots, attrs }) {
    const updater = useFormUpdater();

    const renderLabel = (label: any, formProps: any) => {
      if (!label) return null;
      if (isString(label)) return h(Label, { width: formProps.labelWidth, text: label });
      return h(Label, { width: formProps.labelWidth, ...label });
    };

    return () => {
      const formProps = updater
        ? updater.getFormProps(['labelPosition', 'labelWidth', 'labelAlign', 'showValidateIcon', 'wrapperCol', 'labelCol', 'disabled'])
        : {};
      const labelPosition = props.labelPosition || formProps.labelPosition;
      const children = flattenChildren(slots.default?.());
      const groupFieldSet: string[] = [];
      const inner = children.map((child) => {
        if (isVNode(child) && (child.props as any)?.field) {
          groupFieldSet.push((child.props as any).field);
          return cloneVNode(child, { isInInputGroup: true }, true);
        }
        return child;
      });

      const groupCls = classNames({ [`${prefix}-field-group`]: true }, attrs.class as any);
      const labelCol = formProps.labelCol;
      const wrapperCol = formProps.wrapperCol;
      const labelAlign = formProps.labelAlign;
      const appendCol = labelCol && wrapperCol;
      const labelColCls = labelCol ? `${prefix}-col-${labelAlign}` : '';
      const labelContent = renderLabel(props.label, formProps);
      const { class: _c, style: attrStyle, ...restAttrs } = attrs as any;
      const { label: _l, extraText, extraTextPosition, ...rest } = props as any;
      const inputGroupContent = h(InputGroup, { disabled: formProps.disabled, ...rest, ...restAttrs, style: attrStyle }, () => inner);
      const groupErrorContent = h(GroupError, { fieldSet: groupFieldSet, showValidateIcon: formProps.showValidateIcon, isInInputGroup: true });
      const extraCls = classNames(`${prefix}-field-extra`, {
        [`${prefix}-field-extra-string`]: typeof extraText === 'string',
        [`${prefix}-field-extra-middle`]: extraTextPosition === 'middle',
        [`${prefix}-field-extra-bottom`]: extraTextPosition === 'bottom',
      });
      const extraContent = extraText ? h('div', { class: extraCls, 'x-semi-prop': 'extraText' }, [normalizeNode(extraText)]) : null;

      let content: any;
      switch (true) {
        case !appendCol:
          content = [labelContent, h('div', null, [extraTextPosition === 'middle' ? extraContent : null, inputGroupContent, extraTextPosition === 'bottom' ? extraContent : null, groupErrorContent])];
          break;
        case appendCol && labelPosition === 'top':
          content = [
            h('div', { style: { overflow: 'hidden' } }, [h(Col, { ...labelCol, class: labelColCls }, () => labelContent)]),
            h(Col, { ...wrapperCol }, () => [extraTextPosition === 'middle' ? extraContent : null, inputGroupContent, extraTextPosition === 'bottom' ? extraContent : null, groupErrorContent]),
          ];
          break;
        case appendCol && labelPosition !== 'top':
          content = [
            h(Col, { ...labelCol, class: labelColCls }, () => labelContent),
            h(Col, { ...wrapperCol }, () => [extraTextPosition === 'middle' ? extraContent : null, inputGroupContent, extraTextPosition === 'bottom' ? extraContent : null, groupErrorContent]),
          ];
          break;
        default:
          break;
      }

      return h('div', { 'x-label-pos': labelPosition, class: groupCls }, content);
    };
  },
});

(FormInputGroup as any).elementType = 'FormInputGroup';
export default FormInputGroup;
