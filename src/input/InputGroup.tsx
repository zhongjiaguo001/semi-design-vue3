import { defineComponent, h, cloneVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/input/constants';
import { flattenChildren } from '../_utils';
import type { InputSize } from './Input';

const prefixCls = cssClasses.PREFIX;

export interface InputGroupLabel {
  text?: any;
  name?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  extra?: any;
}

export const inputGroupProps = {
  size: { type: String as PropType<InputSize>, default: 'default' },
  label: { type: Object as PropType<InputGroupLabel>, default: undefined },
  labelPosition: { type: String as PropType<'top' | 'left'>, default: undefined },
  disabled: { type: Boolean, default: undefined },
};

const InputGroup = defineComponent({
  name: 'InputGroup',
  inheritAttrs: false,
  props: inputGroupProps,
  emits: ['focus', 'blur'],
  setup(props, { slots, attrs, emit }) {
    const renderLabel = () => {
      const label = props.label!;
      const labelCls = cls('semi-form-field-label', label.className, {
        'semi-form-field-label-required': label.required,
      });
      return h(
        'label',
        { class: labelCls, style: { width: typeof label.width === 'number' ? `${label.width}px` : label.width, ...label.style }, for: label.name || 'input-group' },
        [h('span', { class: 'semi-form-field-label-text' }, [label.text]), label.optional ? h('span', { class: 'semi-form-field-label-optional-text' }, ['(optional)']) : null, label.extra ? h('div', { class: 'semi-form-field-label-extra' }, [label.extra]) : null]
      );
    };

    return () => {
      const { size, label, labelPosition, disabled: groupDisabled } = props;
      const { class: className, style, onFocus: _f, onBlur: _b, ...rest } = attrs as any;
      const groupCls = cls(`${prefixCls}-group`, { [`${prefixCls}-${size}`]: size !== 'default' }, className);
      const children = flattenChildren(slots.default?.());
      const inner = children.map((item, index) => {
        if (typeof item.type !== 'object') return item;
        const itemProps: any = item.props || {};
        const itemDisabled = itemProps.disabled;
        const disabled = typeof itemDisabled === 'boolean' ? itemDisabled : itemDisabled === '' ? true : groupDisabled;
        const extra: Record<string, any> = { key: item.key ?? index, ...rest, size };
        if (disabled !== undefined) extra.disabled = disabled;
        if (!itemProps.onFocus) extra.onFocus = (e: any) => emit('focus', e);
        if (!itemProps.onBlur) extra.onBlur = (e: any) => emit('blur', e);
        return cloneVNode(item, extra, true);
      });
      if (label && label.text) {
        const groupWrapperCls = cls({
          [`${prefixCls}-group-wrapper`]: true,
          [`${prefixCls}-group-wrapper-with-top-label`]: labelPosition === 'top',
          [`${prefixCls}-group-wrapper-with-left-label`]: labelPosition === 'left',
        });
        const defaultName = 'input-group';
        return h('div', { class: groupWrapperCls }, [
          renderLabel(),
          h(
            'span',
            {
              role: 'group',
              'aria-disabled': groupDisabled,
              id: label.name || defaultName,
              class: groupCls,
              style,
              onFocus: (e: FocusEvent) => emit('focus', e),
              onBlur: (e: FocusEvent) => emit('blur', e),
            },
            inner
          ),
        ]);
      }
      return h(
        'span',
        {
          role: 'group',
          'aria-label': 'Input group',
          'aria-disabled': groupDisabled,
          class: groupCls,
          style,
          onFocus: (e: FocusEvent) => emit('focus', e),
          onBlur: (e: FocusEvent) => emit('blur', e),
        },
        inner
      );
    };
  },
});

export default InputGroup;
