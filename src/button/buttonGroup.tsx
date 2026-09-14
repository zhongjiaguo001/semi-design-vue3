import { defineComponent, h, cloneVNode, onMounted, onBeforeUnmount, ref } from 'vue';
import type { PropType } from 'vue';
import classNames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/button/constants';
import '@douyinfe/semi-foundation/lib/es/button/button.css';
import { flattenChildren, getVNodeElementType } from '../_utils';
import type { ButtonSize, ButtonType, ButtonTheme } from './Button';

const prefixCls = cssClasses.PREFIX;

export const ButtonGroup = defineComponent({
  name: 'ButtonGroup',
  props: {
    disabled: { type: Boolean, default: undefined },
    size: { type: String as PropType<ButtonSize>, default: 'default' },
    type: { type: String as PropType<ButtonType>, default: undefined },
    theme: { type: String as PropType<ButtonTheme>, default: undefined },
    colorful: { type: Boolean, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return () => {
      const children = flattenChildren(slots.default?.());
      const inner = children.map((item, index) => {
        if (typeof item.type === 'object') {
          const extra: Record<string, any> = {};
          if (props.disabled !== undefined) extra.disabled = props.disabled;
          if (props.size !== undefined) extra.size = props.size;
          if (props.type !== undefined) extra.type = props.type;
          // child's own props win for disabled/size/type, mirror React: {disabled,size,type, ...itm.props, ...rest}
          const own = item.props || {};
          const merged = { ...extra };
          Object.keys(own).forEach((k) => {
            merged[k] = own[k];
          });
          // `rest` (theme / colorful) is spread after the child's props in React, so the group wins when set
          if (props.theme !== undefined) merged.theme = props.theme;
          if (props.colorful !== undefined) merged.colorful = props.colorful;
          return cloneVNode(item, { ...merged, key: item.key ?? index }, true);
        }
        return item;
      });
      const innerWithLine: any[] = [];
      if (inner.length > 1) {
        inner.slice(0, -1).forEach((item, index) => {
          const isButtonType = getVNodeElementType(item) === 'Button';
          const buttonProps: any = item.props || {};
          const type = buttonProps.type ?? props.type;
          const theme = props.theme ?? buttonProps.theme;
          const disabled = buttonProps.disabled ?? props.disabled;
          if (isButtonType && theme !== 'outline') {
            const lineCls = classNames(
              `${prefixCls}-group-line`,
              `${prefixCls}-group-line-${theme ?? 'light'}`,
              `${prefixCls}-group-line-${type ?? 'primary'}`,
              { [`${prefixCls}-group-line-disabled`]: disabled === '' || disabled === true }
            );
            innerWithLine.push(item, h('span', { class: lineCls, key: `line-${index}` }));
          } else {
            innerWithLine.push(item);
          }
        });
        innerWithLine.push(inner[inner.length - 1]);
      } else {
        innerWithLine.push(...inner);
      }
      return h('div', { class: `${prefixCls}-group`, role: 'group', 'aria-label': props.ariaLabel }, innerWithLine);
    };
  },
});

export const SplitButtonGroup = defineComponent({
  name: 'SplitButtonGroup',
  props: {
    ariaLabel: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);
    let observer: MutationObserver | null = null;
    const addClassName = () => {
      if (!containerRef.value) return;
      const buttons = containerRef.value.querySelectorAll('button');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (first && !first.classList.contains(`${prefixCls}-first`)) first.classList.add(`${prefixCls}-first`);
      if (last && !last.classList.contains(`${prefixCls}-last`)) last.classList.add(`${prefixCls}-last`);
    };
    onMounted(() => {
      addClassName();
      if (typeof MutationObserver !== 'undefined' && containerRef.value) {
        observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if ((m.type === 'attributes' && m.attributeName === 'class') || (m.type === 'childList' && Array.from(m.addedNodes).some((n) => n.nodeName === 'BUTTON'))) {
              addClassName();
            }
          }
        });
        observer.observe(containerRef.value, { attributes: true, childList: true, subtree: true });
      }
    });
    onBeforeUnmount(() => observer?.disconnect());
    return () => h('div', { ref: containerRef, class: `${prefixCls}-split`, role: 'group', 'aria-label': props.ariaLabel }, slots.default?.());
  },
});
