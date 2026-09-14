/**
 * Implementation reference from: https://github.com/ant-design/ant-design/blob/master/components/grid/col.tsx
 */
import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/grid/constants';
import '@douyinfe/semi-foundation/lib/es/grid/grid.css';
import { useRowContext } from './context';

export interface ColSize {
  span?: number;
  order?: number;
  offset?: number;
  push?: number;
  pull?: number;
}
export type ColResponsive = number | ColSize;

const objectOrNumber = { type: [Object, Number] as PropType<ColResponsive>, default: undefined };

export const colProps = {
  span: { type: Number, default: undefined },
  order: { type: Number, default: undefined },
  offset: { type: Number, default: undefined },
  push: { type: Number, default: undefined },
  pull: { type: Number, default: undefined },
  xs: objectOrNumber,
  sm: objectOrNumber,
  md: objectOrNumber,
  lg: objectOrNumber,
  xl: objectOrNumber,
  xxl: objectOrNumber,
  prefixCls: { type: String, default: cssClasses.PREFIX },
};

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

const Col = defineComponent({
  name: 'Col',
  inheritAttrs: false,
  props: colProps,
  setup(props, { slots, attrs }) {
    const rowContext = useRowContext();
    return () => {
      const { prefixCls, span, order, offset, push, pull } = props;
      let sizeClassObj: Record<string, boolean> = {};
      const prefix = `${prefixCls}-col`;
      sizes.forEach((size) => {
        let sizeProps: ColSize = {};
        const value = props[size];
        if (typeof value === 'number') {
          sizeProps.span = value;
        } else if (typeof value === 'object') {
          sizeProps = value || {};
        }
        sizeClassObj = {
          ...sizeClassObj,
          [`${prefix}-${size}-${sizeProps.span}`]: sizeProps.span !== undefined,
          [`${prefix}-${size}-order-${sizeProps.order}`]: Boolean(sizeProps.order) || sizeProps.order === 0,
          [`${prefix}-${size}-offset-${sizeProps.offset}`]: Boolean(sizeProps.offset) || sizeProps.offset === 0,
          [`${prefix}-${size}-push-${sizeProps.push}`]: Boolean(sizeProps.push) || sizeProps.push === 0,
          [`${prefix}-${size}-pull-${sizeProps.pull}`]: Boolean(sizeProps.pull) || sizeProps.pull === 0,
        };
      });
      const classes = classnames(
        prefix,
        {
          [`${prefix}-${span}`]: span !== undefined,
          [`${prefix}-order-${order}`]: order,
          [`${prefix}-offset-${offset}`]: offset,
          [`${prefix}-push-${push}`]: push,
          [`${prefix}-pull-${pull}`]: pull,
        },
        attrs.class as any,
        sizeClassObj
      );
      const gutters = rowContext && rowContext.gutters;
      if (!gutters) {
        throw new Error('please make sure <Col> inside <Row>');
      }
      const colStyle: CSSProperties = {
        ...(gutters[0] > 0 ? { paddingLeft: `${gutters[0] / 2}px`, paddingRight: `${gutters[0] / 2}px` } : {}),
        ...(gutters[1] > 0 ? { paddingTop: `${gutters[1] / 2}px`, paddingBottom: `${gutters[1] / 2}px` } : {}),
      };
      const { class: _c, style, ...others } = attrs as any;
      return h('div', { ...others, style: [colStyle, style], class: classes, 'x-semi-prop': 'children' }, slots.default?.());
    };
  },
});
(Col as any).elementType = 'Col';

export default Col;
