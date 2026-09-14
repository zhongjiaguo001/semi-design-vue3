import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import _isString from 'lodash/isString';
import _isNumber from 'lodash/isNumber';
import _isArray from 'lodash/isArray';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/space/constants';
import '@douyinfe/semi-foundation/lib/es/space/space.css';
import { flattenChildren, getDataAttr } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type SpacingType = 'loose' | 'medium' | 'tight';
export type Spacing = SpacingType | number | Array<SpacingType | number>;

export const spaceProps = {
  align: { type: String as PropType<'start' | 'end' | 'center' | 'baseline'>, default: 'center' },
  vertical: { type: Boolean, default: false },
  wrap: { type: Boolean, default: false },
  spacing: { type: [String, Number, Array] as PropType<Spacing>, default: 'tight' },
};

const Space = defineComponent({
  name: 'Space',
  inheritAttrs: false,
  props: spaceProps,
  setup(props, { slots, attrs }) {
    return () => {
      const { spacing, wrap, align, vertical } = props;
      const isWrap = wrap && vertical ? false : wrap;
      const realStyle: Record<string, any> = {};
      let spacingHorizontalType = '';
      let spacingVerticalType = '';
      if (_isString(spacing)) {
        spacingHorizontalType = spacing;
        spacingVerticalType = spacing;
      } else if (_isNumber(spacing)) {
        realStyle.rowGap = `${spacing}px`;
        realStyle.columnGap = `${spacing}px`;
      } else if (_isArray(spacing)) {
        if (_isString(spacing[0])) spacingHorizontalType = spacing[0];
        else if (_isNumber(spacing[0])) realStyle.columnGap = `${spacing[0]}px`;
        if (_isString(spacing[1])) spacingVerticalType = spacing[1];
        else if (_isNumber(spacing[1])) realStyle.rowGap = `${spacing[1]}px`;
      }
      const classNames = cls(prefixCls, attrs.class as any, {
        [`${prefixCls}-align-${align}`]: align,
        [`${prefixCls}-vertical`]: vertical,
        [`${prefixCls}-horizontal`]: !vertical,
        [`${prefixCls}-wrap`]: isWrap,
        [`${prefixCls}-tight-horizontal`]: spacingHorizontalType === strings.SPACING_TIGHT,
        [`${prefixCls}-tight-vertical`]: spacingVerticalType === strings.SPACING_TIGHT,
        [`${prefixCls}-medium-horizontal`]: spacingHorizontalType === strings.SPACING_MEDIUM,
        [`${prefixCls}-medium-vertical`]: spacingVerticalType === strings.SPACING_MEDIUM,
        [`${prefixCls}-loose-horizontal`]: spacingHorizontalType === strings.SPACING_LOOSE,
        [`${prefixCls}-loose-vertical`]: spacingVerticalType === strings.SPACING_LOOSE,
      });
      const { class: _c, style, ...rest } = attrs as any;
      return h('div', { ...getDataAttr(rest), class: classNames, style: [realStyle, style], 'x-semi-prop': 'children' }, flattenChildren(slots.default?.()));
    };
  },
});

export { Space, Space as default };
