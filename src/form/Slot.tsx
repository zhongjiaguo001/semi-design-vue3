import { defineComponent, h, isVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { isString, isNumber, isObject } from 'lodash';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import Label from './Label';
import { Col } from '../grid';
import ErrorMessage from './ErrorMessage';
import { useFormUpdater } from './context';
import { flattenChildren, normalizeNode } from '../_utils';

const prefix = cssClasses.PREFIX;

export const slotProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  label: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  noLabel: { type: Boolean, default: false },
  labelPosition: { type: String as PropType<'top' | 'left'>, default: undefined },
  error: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
};

const FormSlot = defineComponent({
  name: 'FormSlot',
  inheritAttrs: false,
  props: slotProps,
  setup(props, { slots, attrs }) {
    const updater = useFormUpdater();
    return () => {
      const formProps = updater?.getFormProps?.(['labelPosition', 'labelWidth', 'labelAlign', 'labelCol', 'wrapperCol']) || {};
      const labelCol = formProps.labelCol;
      const wrapperCol = formProps.wrapperCol;
      const appendCol = labelCol && wrapperCol;
      const labelColCls = `${prefix}-col-${formProps.labelAlign}`;
      let labelPosition = props.labelPosition || formProps.labelPosition || 'top';
      let label: any = props.label;
      if (isString(label) || isNumber(label) || isVNode(label)) {
        label = { text: label };
      }
      let emProps: any = {};
      const error = props.error;
      if (typeof error !== 'undefined') {
        if (isObject(error) && !isVNode(error)) emProps = error;
        else emProps = { error };
      }
      const slotError = typeof error !== 'undefined' ? h(ErrorMessage, emProps) : null;
      const slotCls = classNames({ [`${prefix}-field`]: true, [`${prefix}-slot`]: true }, props.className, attrs.class as any);
      const mainCls = classNames({ [`${prefix}-field-main`]: true, [`${prefix}-slot-main`]: true });
      const mergeLabelProps = { align: formProps.labelAlign, width: formProps.labelWidth, ...(isObject(label) ? label : {}) };
      const children = flattenChildren(slots.default?.());
      const labelNode = () => h(Label, mergeLabelProps);
      let content: any;
      switch (true) {
        case !appendCol && !props.noLabel:
          content = [labelNode(), h('div', { class: mainCls }, [children, slotError])];
          break;
        case !appendCol && props.noLabel:
          content = h('div', { class: mainCls }, [children, slotError]);
          break;
        case appendCol && labelPosition === 'top':
          content = [
            h('div', { style: { overflow: 'hidden' } }, [h(Col, { ...labelCol, class: labelColCls }, () => labelNode())]),
            h(Col, null, () => [children, slotError]),
          ];
          break;
        default:
          content = [h(Col, { ...labelCol, class: labelColCls }, () => labelNode()), h(Col, null, () => [children, slotError])];
          break;
      }
      return h('div', { class: slotCls, 'x-label-pos': labelPosition, style: [props.style, (attrs as any).style] }, content);
    };
  },
});

export default FormSlot;
