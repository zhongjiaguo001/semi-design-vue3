import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/form/constants';
import { useLocale } from '../locale';
import { flattenChildren, normalizeNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export const labelProps = {
  align: { type: String, default: 'left' },
  className: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  text: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  name: { type: String, default: '' },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  extra: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  optional: { type: Boolean, default: false },
};

const Label = defineComponent({
  name: 'FormLabel',
  inheritAttrs: false,
  props: labelProps,
  setup(props, { slots, attrs }) {
    const { locale } = useLocale('Form');
    return () => {
      const { required, text, disabled, name, width, align, style, className, extra, id, optional } = props;
      const labelCls = classNames(className, attrs.class as any, {
        [`${prefixCls}-field-label`]: true,
        [`${prefixCls}-field-label-left`]: align === 'left',
        [`${prefixCls}-field-label-right`]: align === 'right',
        [`${prefixCls}-field-label-required`]: required,
        [`${prefixCls}-field-label-disabled`]: disabled,
        [`${prefixCls}-field-label-with-extra`]: extra,
      });
      const labelStyle: CSSProperties = { ...(style || {}) };
      if (width) labelStyle.width = width as any;
      const children = flattenChildren(slots.default?.());
      const optionalText = optional
        ? h('span', { class: `${prefixCls}-field-label-optional-text` }, locale.value?.optional)
        : null;
      const textContent = h('div', { class: `${prefixCls}-field-label-text`, 'x-semi-prop': 'label' }, [
        text !== undefined ? normalizeNode(text) : children,
        optionalText,
      ]);
      const extraNode = extra ? h('div', { class: `${prefixCls}-field-label-extra` }, [normalizeNode(extra)]) : null;
      return h('label', { class: labelCls, for: name, style: labelStyle, id }, extra ? [textContent, extraNode] : textContent);
    };
  },
});

export default Label;
