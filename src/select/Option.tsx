import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classNames from 'classnames';
import _isString from 'lodash/isString';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/select/constants';
import { useLocale } from '../locale';
import { flattenChildren, getDataAttr, normalizeNode } from '../_utils';
import { IconTick } from '../icons/generated';
import { renderHighlight } from './utils';

export const optionProps = {
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
  semiOptionId: { type: String, default: undefined },
  /** extra option data (everything from optionList item / Option props) */
  optionData: { type: Object as PropType<Record<string, any>>, default: undefined },
};

const Option = defineComponent({
  name: 'SelectOption',
  inheritAttrs: false,
  props: optionProps,
  setup(props, { slots, attrs }) {
    const { locale } = useLocale('Select');

    const getRestData = () => {
      const { optionData } = props;
      const rest: Record<string, any> = { ...(optionData || {}) };
      delete rest.value;
      delete rest.label;
      delete rest.children;
      return rest;
    };

    const onClick = (event: Event) => {
      if (props.disabled) return;
      const rest = getRestData();
      const children = slots.default ? slots.default() : undefined;
      const label = props.label ?? rest.label ?? children;
      props.onSelect?.({ ...rest, value: props.value, label }, event);
    };

    const renderOptionContent = (children: any, config: { searchWords: string[]; sourceString: string; highlightClassName: string }) => {
      if (_isString(children) && props.inputValue) {
        return renderHighlight(config.sourceString, config.searchWords, config.highlightClassName);
      }
      return children;
    };

    return () => {
      const { disabled, value, selected, label, empty, emptyContent, focused, showTick, className, style, onMouseEnter, prefixCls, renderOptionItem, inputValue, semiOptionId } = props;
      const optionClassName = classNames(prefixCls, {
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-selected`]: selected,
        [`${prefixCls}-focused`]: focused,
        [`${prefixCls}-empty`]: empty,
        [className as string]: className,
      });
      const selectedIconClassName = classNames([`${prefixCls}-icon`]);
      if (empty) {
        if (emptyContent === null) return null;
        const emptyNode = slots.emptyContent ? slots.emptyContent() : normalizeNode(emptyContent);
        return h('div', { class: optionClassName, 'x-semi-prop': 'emptyContent' }, [emptyNode || locale.value.emptyText]);
      }
      const rest = getRestData();
      let children: any = slots.default ? flattenChildren(slots.default()) : normalizeNode(label);
      // a single text vnode child behaves like a React string child
      if (Array.isArray(children) && children.length === 1 && typeof children[0].type === 'symbol' && typeof children[0].children === 'string') {
        children = children[0].children;
      }
      if (Array.isArray(children) && !children.length) children = undefined;
      if (typeof renderOptionItem === 'function') {
        const customRenderClassName = classNames(className, {
          [`${prefixCls}-custom`]: true,
          [`${prefixCls}-custom-selected`]: selected,
        });
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
          className: customRenderClassName,
        });
      }
      const config = {
        searchWords: [inputValue as string],
        sourceString: children as string,
        highlightClassName: `${prefixCls}-keyword`,
      };
      return h(
        'div',
        {
          ...getDataAttr({ ...rest, ...(attrs as any) }),
          class: optionClassName,
          onClick: (e: MouseEvent) => onClick(e),
          onMouseenter: (e: MouseEvent) => onMouseEnter && onMouseEnter(e),
          role: 'option',
          id: semiOptionId,
          'aria-selected': selected ? 'true' : 'false',
          'aria-disabled': disabled ? 'true' : 'false',
          style,
        },
        [
          showTick ? h('div', { class: selectedIconClassName }, [h(IconTick)]) : null,
          _isString(children) ? h('div', { class: `${prefixCls}-text` }, renderOptionContent(children, config)) : children,
        ]
      );
    };
  },
});
(Option as any).elementType = 'SelectOption';
(Option as any).isSelectOption = true;

export default Option;
