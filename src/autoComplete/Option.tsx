import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import _isString from 'lodash/isString';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/autoComplete/constants';
import { useLocale } from '../locale';
import { flattenChildren, normalizeNode } from '../_utils';
import { IconTick } from '../icons/generated';
import { renderHighlight } from '../select/utils';

export const autoCompleteOptionProps = {
  disabled: { type: Boolean, default: false },
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  selected: { type: Boolean, default: false },
  label: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  empty: { type: Boolean, default: false },
  emptyContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  onSelect: { type: Function as PropType<(option: Record<string, any>, e: Event) => void>, default: undefined },
  focused: { type: Boolean, default: false },
  showTick: { type: Boolean, default: false },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  onMouseEnter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX_OPTION },
  renderOptionItem: { type: Function as PropType<(props: Record<string, any>) => any>, default: undefined },
  inputValue: { type: String, default: undefined },
  /** extra option data (everything from the data item) */
  optionData: { type: Object as PropType<Record<string, any>>, default: undefined },
};

const Option = defineComponent({
  name: 'AutoCompleteOption',
  inheritAttrs: false,
  props: autoCompleteOptionProps,
  setup(props, { slots }) {
    const { locale } = useLocale('Select');

    const getRestData = () => {
      const rest: Record<string, any> = { ...(props.optionData || {}) };
      delete rest.value;
      delete rest.label;
      delete rest.children;
      return rest;
    };

    const onClick = (event: Event) => {
      if (props.disabled) return;
      const rest = getRestData();
      const children = slots.default ? slots.default() : undefined;
      props.onSelect?.({ ...rest, value: props.value, label: props.label ?? children }, event);
    };

    return () => {
      const { disabled, value, selected, label, empty, emptyContent, focused, showTick, className, style, onMouseEnter, prefixCls, renderOptionItem, inputValue } = props;
      const optionClassName = classNames(prefixCls, {
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-selected`]: selected,
        [`${prefixCls}-focused`]: focused,
        [`${prefixCls}-empty`]: empty,
        [className as string]: className,
      });
      if (empty) {
        if (emptyContent === null) return null;
        const emptyNode = slots.emptyContent ? slots.emptyContent() : normalizeNode(emptyContent);
        return h('div', { class: optionClassName, 'x-semi-prop': 'emptyContent' }, [emptyNode || locale.value.emptyText]);
      }
      const rest = getRestData();
      let children: any = slots.default ? flattenChildren(slots.default()) : normalizeNode(label);
      if (Array.isArray(children) && children.length === 1 && typeof children[0].type === 'symbol' && typeof children[0].children === 'string') {
        children = children[0].children;
      }
      if (Array.isArray(children) && !children.length) children = undefined;
      if (typeof renderOptionItem === 'function') {
        return renderOptionItem({
          ...rest,
          disabled,
          focused,
          selected,
          style,
          label,
          value,
          inputValue,
          onMouseEnter: (e: MouseEvent) => onMouseEnter?.(e),
          onClick: (e: Event) => onClick(e),
        });
      }
      const content = _isString(children) && inputValue ? renderHighlight(children, [inputValue], `${prefixCls}-keyword`) : children;
      return h(
        'div',
        {
          class: optionClassName,
          onClick: (e: MouseEvent) => onClick(e),
          onMouseenter: (e: MouseEvent) => onMouseEnter && onMouseEnter(e),
          role: 'option',
          'aria-selected': selected ? 'true' : 'false',
          'aria-disabled': disabled ? 'true' : 'false',
          style,
        },
        [showTick ? h('div', { class: classNames([`${prefixCls}-icon`]) }, [h(IconTick)]) : null, _isString(children) ? h('div', { class: `${prefixCls}-text` }, content) : children]
      );
    };
  },
});
(Option as any).elementType = 'AutoCompleteOption';
(Option as any).isSelectOption = true;

export default Option;
