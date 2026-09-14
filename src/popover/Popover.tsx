import { defineComponent, h, ref, normalizeStyle } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import _get from 'lodash/get';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import '@douyinfe/semi-foundation/lib/es/popover/popover.css';
import Tooltip, { tooltipProps, tooltipEmits } from '../tooltip/Tooltip';
import type { Position, Trigger } from '../tooltip/Tooltip';
import { useConfigContext } from '../configProvider/context';
import { normalizeNode } from '../_utils';

export interface ArrowStyle {
  borderColor?: string;
  backgroundColor?: string;
  borderOpacity?: string | number;
}

export const Arrow = defineComponent({
  name: 'PopoverArrow',
  inheritAttrs: false,
  props: {
    position: { type: String, default: '' },
    className: { type: String, default: undefined },
    arrowStyle: { type: Object as PropType<ArrowStyle>, default: undefined },
    popStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const { position = '', className, arrowStyle, popStyle } = props;
      const isVertical = position.indexOf('top') === 0 || position.indexOf('bottom') === 0;
      const cls = classnames(className, attrs.class as any, cssClasses.ARROW);
      const borderOpacity = _get(arrowStyle, 'borderOpacity');
      const bgColor = _get(arrowStyle, 'backgroundColor', _get(popStyle, 'backgroundColor'));
      const borderColor = _get(arrowStyle, 'borderColor', _get(popStyle, 'borderColor'));
      const { class: _c, ...rest } = attrs as any;
      const wrapProps = {
        ...rest,
        width: numbers.ARROW_BOUNDING.width,
        height: numbers.ARROW_BOUNDING.height,
        xmlns: 'http://www.w3.org/2000/svg',
        class: cls,
      };
      return isVertical
        ? h('svg', wrapProps, [
            h('path', { d: 'M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z', style: { fill: borderColor, opacity: borderOpacity } }),
            h('path', { d: 'M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5  6, 16.5 4S20,1 24,1L24 0L0 0z', style: { fill: bgColor } }),
          ])
        : h('svg', wrapProps, [
            h('path', { d: 'M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z', style: { fill: borderColor, opacity: borderOpacity } }),
            h('path', { d: 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z', style: { fill: bgColor } }),
          ]);
    };
  },
});

const { showArrow: _sa, spacing: _sp, ...restTooltipProps } = tooltipProps;

export const popoverProps = {
  ...restTooltipProps,
  arrowBounding: { type: Object, default: () => numbers.ARROW_BOUNDING },
  showArrow: { type: Boolean, default: false },
  autoAdjustOverflow: { type: Boolean, default: true },
  zIndex: { type: Number, default: numbers.DEFAULT_Z_INDEX },
  motion: { type: Boolean, default: true },
  trigger: { type: String as PropType<Trigger>, default: 'hover' },
  position: { type: String as PropType<Position>, default: 'bottom' },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  closeOnEsc: { type: Boolean, default: true },
  returnFocusOnClose: { type: Boolean, default: true },
  guardFocus: { type: Boolean, default: true },
  disableFocusListener: { type: Boolean, default: true },
  spacing: { type: [Number, Object] as PropType<number | { x?: number; y?: number }>, default: undefined },
  contentClassName: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  arrowStyle: { type: Object as PropType<ArrowStyle>, default: () => ({}) },
};

const Popover = defineComponent({
  name: 'Popover',
  inheritAttrs: false,
  props: popoverProps,
  emits: [...tooltipEmits, 'update:visible'],
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const tooltipRef = ref<any>(null);

    const renderContentNode = (contentProps: any) => {
      if (slots.content) return slots.content(contentProps);
      const content = props.content;
      return typeof content === 'function' && !(content as any).setup && !(content as any).render ? content(contentProps) : normalizeNode(content);
    };

    const renderPopCard = ({ initialFocusRef }: any) => {
      const { contentClassName, prefixCls } = props;
      const direction = context.direction;
      const popCardCls = classnames(prefixCls, contentClassName, { [`${prefixCls}-rtl`]: direction === 'rtl' });
      return h('div', { class: popCardCls }, [h('div', { class: `${prefixCls}-content` }, renderContentNode({ initialFocusRef }))]);
    };

    expose({
      focusTrigger: () => tooltipRef.value?.focusTrigger(),
      rePosition: () => tooltipRef.value?.rePosition(),
    });

    return () => {
      const { prefixCls, showArrow, arrowStyle = {}, arrowBounding, position, style: propStyle, trigger, content: _content, contentClassName: _cc, className, ...rest } = props as any;
      let { spacing } = props;
      // React className / style apply to the popup wrapper; Vue `class` / `style` attrs map onto them.
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const mergedClassName = classnames(className, attrClass) || undefined;
      const style = attrStyle || propStyle ? { ...(normalizeStyle(attrStyle) as any), ...(propStyle as any) } : propStyle;
      const arrow = showArrow ? h(Arrow, { position, class: '', popStyle: style, arrowStyle }) : false;
      if (isNullOrUndefined(spacing)) {
        spacing = showArrow ? numbers.SPACING_WITH_ARROW : numbers.SPACING;
      }
      const role = trigger === 'click' || trigger === 'custom' ? 'dialog' : 'tooltip';
      return h(
        Tooltip,
        {
          guardFocus: true,
          ...restAttrs,
          ...rest,
          className: mergedClassName,
          ref: tooltipRef,
          trigger,
          position,
          style,
          prefixCls,
          spacing,
          showArrow: arrow,
          arrowBounding,
          role,
          onVisibleChange: (v: boolean) => {
            emit('update:visible', v);
            emit('visibleChange', v);
          },
          onClickOutSide: (e: any) => emit('clickOutSide', e),
          onEscKeyDown: (e: any) => emit('escKeyDown', e),
          onAfterClose: () => emit('afterClose'),
        },
        { default: slots.default, content: renderPopCard }
      );
    };
  },
});

(Popover as any).elementType = 'Popover';
(Popover as any).__SemiComponentName__ = 'Popover';

export { strings as popoverStrings };
export default Popover;
