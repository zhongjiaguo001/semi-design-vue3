/**
 * Implementation reference from: https://github.com/ant-design/ant-design/blob/master/components/grid/row.tsx
 */
import { defineComponent, h, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/grid/constants';
import '@douyinfe/semi-foundation/lib/es/grid/grid.css';
import { registerMediaQuery } from '../_utils';
import { useConfigContext } from '../configProvider/context';
import { provideRowContext } from './context';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type Gutter = number | Partial<Record<Breakpoint, number>>;
export type RowType = 'flex';
export type RowAlign = 'top' | 'middle' | 'bottom';
export type RowJustify = 'start' | 'end' | 'center' | 'space-around' | 'space-between';

const responsiveArray: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

export const defaultResponsiveMap: Record<Breakpoint, string> = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1600px)',
};

export const rowProps = {
  type: { type: String as PropType<RowType>, default: undefined },
  align: { type: String as PropType<RowAlign>, default: undefined },
  justify: { type: String as PropType<RowJustify>, default: undefined },
  gutter: { type: [Number, Object, Array] as PropType<Gutter | Gutter[]>, default: 0 as Gutter | Gutter[] },
  prefixCls: { type: String, default: cssClasses.PREFIX },
};

const Row = defineComponent({
  name: 'Row',
  inheritAttrs: false,
  props: rowProps,
  setup(props, { slots, attrs }) {
    const configContext = useConfigContext();
    const screens = reactive<Record<Breakpoint, boolean>>({ xs: true, sm: true, md: true, lg: true, xl: true, xxl: true });
    let unRegisters: Array<() => void> = [];

    const getResponsiveMap = (): Record<Breakpoint, string> =>
      ({ ...defaultResponsiveMap, ...(configContext.responsiveMap || {}) }) as Record<Breakpoint, string>;

    onMounted(() => {
      // Register media queries exactly like the React Row does; the query map can be
      // overridden through <ConfigProvider responsiveMap>.
      const responsiveMap = getResponsiveMap();
      unRegisters = (Object.keys(responsiveMap) as Breakpoint[]).map((screen) =>
        registerMediaQuery(responsiveMap[screen], {
          match: () => {
            if (typeof props.gutter !== 'object') return;
            screens[screen] = true;
          },
          unmatch: () => {
            if (typeof props.gutter !== 'object') return;
            screens[screen] = false;
          },
        })
      );
    });
    onBeforeUnmount(() => {
      unRegisters.forEach((unRegister) => unRegister());
      unRegisters = [];
    });

    const gutters = computed<[number, number]>(() => {
      const { gutter = 0 } = props;
      const results: [number, number] = [0, 0];
      const normalizedGutter = (Array.isArray(gutter) ? gutter.slice(0, 2) : [gutter, 0]) as Gutter[];
      normalizedGutter.forEach((g, index) => {
        if (typeof g === 'object' && g !== null) {
          for (let i = 0; i < responsiveArray.length; i++) {
            const breakpoint = responsiveArray[i];
            if (screens[breakpoint] && g[breakpoint] !== undefined) {
              results[index] = g[breakpoint] as number;
              break;
            }
          }
        } else {
          results[index] = (g as number) || 0;
        }
      });
      return results;
    });

    provideRowContext(reactive({ gutters }) as any);

    return () => {
      const { prefixCls, type, justify, align } = props;
      const [gx, gy] = gutters.value;
      const prefix = `${prefixCls}-row`;
      const classes = classnames(
        {
          [prefix]: type !== 'flex',
          [`${prefix}-${type}`]: type,
          [`${prefix}-${type}-${justify}`]: type && justify,
          [`${prefix}-${type}-${align}`]: type && align,
        },
        attrs.class as any
      );
      const rowStyle: CSSProperties = {
        ...(gx > 0 ? { marginLeft: `${gx / -2}px`, marginRight: `${gx / -2}px` } : {}),
        ...(gy > 0 ? { marginTop: `${gy / -2}px`, marginBottom: `${gy / -2}px` } : {}),
      };
      const { class: _c, style, ...others } = attrs as any;
      return h('div', { ...others, class: classes, style: [rowStyle, style], 'x-semi-prop': 'children' }, slots.default?.());
    };
  },
});
(Row as any).elementType = 'Row';

export default Row;
