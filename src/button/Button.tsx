import { defineComponent, h, computed } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import classNames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/button/constants';
import { strings as iconStrings } from '@douyinfe/semi-foundation/lib/es/icons/constants';
import '@douyinfe/semi-foundation/lib/es/button/button.css';
import '@douyinfe/semi-foundation/lib/es/button/iconButton.css';
import SpinIcon from '../spin/icon';
import { IconAILoading } from '../icons/generated';
import { flattenChildren, normalizeNode, isSemiIcon } from '../_utils';

export type ButtonSize = 'default' | 'small' | 'large';
export type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type ButtonTheme = 'solid' | 'borderless' | 'light' | 'outline';
export type HtmlType = 'button' | 'reset' | 'submit';
export type IconPosition = 'left' | 'right';

export const buttonProps = {
  size: { type: String as PropType<ButtonSize>, default: 'default' },
  type: { type: String as PropType<ButtonType>, default: 'primary' },
  theme: { type: String as PropType<ButtonTheme>, default: 'light' },
  htmlType: { type: String as PropType<HtmlType>, default: 'button' },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  circle: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  colorful: { type: Boolean, default: false },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  contentClassName: { type: String, default: undefined },
  // icon button props
  icon: { type: [Object, Function, String] as PropType<any>, default: undefined },
  iconPosition: { type: String as PropType<IconPosition>, default: strings.DEFAULT_ICON_POSITION as IconPosition },
  iconSize: { type: String as PropType<(typeof iconStrings.SIZE)[number]>, default: undefined },
  iconStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  noHorizontalPadding: { type: [Boolean, String, Array] as PropType<boolean | 'left' | 'right' | Array<'left' | 'right'>>, default: false },
  ariaLabel: { type: String, default: undefined },
};

/**
 * Base button (the React `Button.js`), used directly when neither `icon` nor `loading` is set.
 */
export const BaseButton = defineComponent({
  name: 'SemiBaseButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: ['click', 'mousedown', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit }) {
    const classes = computed(() => {
      const { prefixCls, type, disabled, size, block, circle, theme, colorful } = props;
      return classNames(
        prefixCls,
        {
          [`${prefixCls}-${type}`]: !disabled && type,
          [`${prefixCls}-disabled`]: disabled,
          [`${prefixCls}-size-large`]: size === 'large',
          [`${prefixCls}-size-small`]: size === 'small',
          [`${prefixCls}-block`]: block,
          [`${prefixCls}-circle`]: circle,
          [`${prefixCls}-${theme}`]: theme,
          [`${prefixCls}-${type}-disabled`]: disabled && type,
          [`${prefixCls}-colorful`]: colorful,
        },
        attrs.class as any
      );
    });
    return () => {
      const { class: _c, style, onClick, onMousedown, ...rest } = attrs as any;
      const children = slots.default?.();
      // React only marks the content span when the button is not an IconButton
      const xSemiProps: Record<string, any> = {};
      if (!(typeof _c === 'string' && _c.includes('-with-icon'))) {
        xSemiProps['x-semi-prop'] = 'children';
      }
      return h(
        'button',
        {
          ...rest,
          class: classes.value,
          style,
          type: props.htmlType,
          disabled: props.disabled,
          'aria-disabled': props.disabled,
          'aria-label': props.ariaLabel,
          onClick: (e: MouseEvent) => {
            emit('click', e);
          },
          onMousedown: (e: MouseEvent) => {
            emit('mousedown', e);
          },
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
        },
        [
          h(
            'span',
            {
              class: classNames(`${props.prefixCls}-content`, props.contentClassName),
              onClick: (e: MouseEvent) => props.disabled && e.stopPropagation(),
              ...xSemiProps,
            },
            children
          ),
        ]
      );
    };
  },
});

/**
 * IconButton (the React `iconButton/index.js`)
 */
export const IconButton = defineComponent({
  name: 'IconButton',
  inheritAttrs: false,
  props: buttonProps,
  emits: ['click', 'mousedown', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit }) {
    return () => {
      const { iconPosition, iconStyle, icon, noHorizontalPadding, theme, prefixCls, loading, colorful, type, disabled } = props;
      const style: CSSProperties = { ...((attrs.style as any) || {}) };
      if (Array.isArray(noHorizontalPadding)) {
        noHorizontalPadding.includes('left') && (style.paddingLeft = 0);
        noHorizontalPadding.includes('right') && (style.paddingRight = 0);
      } else if (noHorizontalPadding === true) {
        style.paddingLeft = 0;
        style.paddingRight = 0;
      } else if (typeof noHorizontalPadding === 'string') {
        noHorizontalPadding === 'left' && (style.paddingLeft = 0);
        noHorizontalPadding === 'right' && (style.paddingRight = 0);
      }

      let IconElem: VNodeChild = null;
      const iconNode = slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(icon, iconStyle ? { style: iconStyle } : undefined);
      if (loading && !disabled) {
        if ((colorful && ['light', 'outline', 'borderless'].includes(theme)) || (theme === 'solid' && type === 'tertiary')) {
          IconElem = h(IconAILoading, { class: `${prefixCls}-content-loading-icon` });
        } else {
          IconElem = h(SpinIcon);
        }
      } else if (iconNode) {
        if (colorful && isSemiIcon(iconNode)) {
          const multipleColor = (theme === 'solid' && type === 'tertiary') || (type === 'primary' && ['light', 'borderless'].includes(theme));
          const twoColor = type === 'tertiary' && ['light', 'borderless', 'outline'].includes(theme);
          if (multipleColor) {
            const fill = disabled
              ? new Array(4).fill('var(--semi-color-disabled-text)')
              : [
                  'var(--semi-button-colorful-multiple-fill-0)',
                  'var(--semi-button-colorful-multiple-fill-1)',
                  'var(--semi-button-colorful-multiple-fill-2)',
                  'var(--semi-button-colorful-multiple-fill-3)',
                ];
            IconElem = normalizeNode(iconNode, { fill });
          } else if (twoColor) {
            const fill = disabled
              ? new Array(2).fill('var(--semi-color-disabled-text)')
              : ['var(--semi-button-colorful-fill-primary)', 'var(--semi-button-colorful-fill-secondary)'];
            IconElem = normalizeNode(iconNode, { fill });
          } else {
            IconElem = iconNode;
          }
        } else {
          IconElem = iconNode;
        }
      }

      const originChildren = slots.default ? flattenChildren(slots.default()) : [];
      const hasChildren = originChildren.length > 0;
      const btnTextCls = classNames({
        [`${prefixCls}-content-left`]: iconPosition === 'right',
        [`${prefixCls}-content-right`]: iconPosition === 'left',
      });
      const children = hasChildren ? h('span', { class: btnTextCls, 'x-semi-prop': 'children' }, originChildren) : null;
      const finalChildren = iconPosition === 'left' ? [IconElem, children] : [children, IconElem];
      const iconBtnCls = classNames(attrs.class as any, `${prefixCls}-with-icon`, {
        [`${prefixCls}-with-icon-only`]: !hasChildren,
        [`${prefixCls}-loading`]: loading,
      });
      const { class: _c, style: _s, ...rest } = attrs as any;
      return h(
        BaseButton,
        {
          ...rest,
          ...props,
          class: iconBtnCls,
          style,
          onClick: (e: MouseEvent) => emit('click', e),
          onMousedown: (e: MouseEvent) => emit('mousedown', e),
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
        },
        { default: () => finalChildren }
      );
    };
  },
});
(IconButton as any).elementType = 'IconButton';

/**
 * Button: delegates to IconButton when `icon`/`loading` is set (the React `button/index.js`)
 */
const Button = defineComponent({
  name: 'Button',
  inheritAttrs: false,
  props: buttonProps,
  emits: ['click', 'mousedown', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit }) {
    return () => {
      const hasIcon = Boolean(props.icon) || Boolean(slots.icon);
      const isLoading = Boolean(props.loading);
      const isDisabled = Boolean(props.disabled);
      const listeners = {
        onClick: (e: MouseEvent) => emit('click', e),
        onMousedown: (e: MouseEvent) => emit('mousedown', e),
        onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
        onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
      };
      if (hasIcon || (isLoading && !isDisabled)) {
        return h(IconButton, { ...attrs, ...props, ...listeners }, slots);
      }
      return h(BaseButton, { ...attrs, ...props, ...listeners }, slots);
    };
  },
});
(Button as any).elementType = 'Button';

export default Button;
