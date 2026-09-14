import { defineComponent, h, reactive, watch } from 'vue';
import type { PropType, CSSProperties, VNode } from 'vue';
import cls from 'classnames';
import _isPlainObject from 'lodash/isPlainObject';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/descriptions/constants';
import DescriptionsFoundation from '@douyinfe/semi-foundation/lib/es/descriptions/foundation';
import '@douyinfe/semi-foundation/lib/es/descriptions/descriptions.css';
import { useBaseComponent, camelize } from '../_base/useBaseComponent';
import { getDataAttr, flattenChildren, isVNode } from '../_utils';
import DescriptionsItem, { descriptionsItemProps } from './DescriptionsItem';
import { provideDescriptionsContext } from './context';
import type { DescriptionsContextValue } from './context';

const prefixCls = cssClasses.PREFIX;

export type DescriptionsAlign = 'left' | 'justify' | 'plain' | 'center';
export type DescriptionsSize = 'small' | 'medium' | 'large';
export type DescriptionsLayout = 'horizontal' | 'vertical';

export interface DescriptionsData {
  key?: any;
  value?: any;
  hidden?: boolean;
  className?: string;
  class?: any;
  style?: CSSProperties;
  span?: number;
  keyStyle?: CSSProperties;
  [key: string]: any;
}

export const descriptionsProps = {
  align: { type: String as PropType<DescriptionsAlign>, default: 'center' },
  row: { type: Boolean, default: false },
  size: { type: String as PropType<DescriptionsSize>, default: 'medium' },
  data: { type: Array as PropType<DescriptionsData[]>, default: () => [] },
  layout: { type: String as PropType<DescriptionsLayout>, default: 'vertical' },
  column: { type: Number, default: 3 },
};

interface Column extends DescriptionsData {
  /** the original vnode when the column came from children */
  __vnode?: VNode;
}

/** turn a child <Descriptions.Item> vnode into a column descriptor (React: `{ value: children, ...item.props }`) */
function vnodeToColumn(vnode: VNode): Column {
  const raw = (vnode.props || {}) as Record<string, any>;
  const col: Column = { __vnode: vnode };
  Object.keys(raw).forEach((k) => {
    col[camelize(k)] = raw[k];
  });
  if (col.itemKey !== undefined && col.key === undefined) col.key = col.itemKey;
  if (typeof col.span === 'string') col.span = Number(col.span);
  if ((col.hidden as any) === '') col.hidden = true;
  return col;
}

const Descriptions = defineComponent({
  name: 'Descriptions',
  inheritAttrs: false,
  props: descriptionsProps,
  setup(props, { slots, attrs }) {
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    let currentChildren: VNode[] = [];

    const adapter = {
      ...baseAdapter,
      getColumns: (): Column[] => {
        if (props.data?.length) {
          return props.data as Column[];
        }
        if (currentChildren.length) {
          return currentChildren.map((item) => (isVNode(item) ? vnodeToColumn(item) : ([] as any)));
        }
        return [];
      },
    };
    const foundation = new (DescriptionsFoundation as any)(adapter);

    const context = reactive<DescriptionsContextValue>({ align: props.align, layout: props.layout });
    watch(
      () => [props.align, props.layout],
      () => {
        context.align = props.align;
        context.layout = props.layout;
      },
      { flush: 'sync' }
    );
    provideDescriptionsContext(context);

    const renderDataItem = (item: DescriptionsData, key: any) => {
      const { key: itemKey, value, className, class: klass, hidden, style, span, keyStyle, ...rest } = item;
      return h(
        DescriptionsItem,
        { key, itemKey, hidden, span, keyStyle, class: [className, klass], style, ...rest },
        { default: () => (typeof value === 'function' ? value() : value) }
      );
    };

    const renderColumnItem = (item: Column, key: any) => {
      if (item.__vnode) {
        // re-render the child with the (possibly adjusted) span
        const vnode = item.__vnode;
        return h(vnode.type as any, { ...(vnode.props || {}), key, span: item.span }, vnode.children as any);
      }
      return renderDataItem(item, key);
    };

    const renderChildrenList = () => {
      const { layout, data } = props;
      currentChildren = slots.default ? flattenChildren(slots.default()) : [];
      if (layout === 'horizontal') {
        const horizontalList: Column[][] = foundation.getHorizontalList();
        return horizontalList.map((row, index) =>
          h(
            'tr',
            { key: index },
            row.map((item, itemIndex) => (_isPlainObject(item) ? renderColumnItem(item, `${index}-${itemIndex}`) : null))
          )
        );
      }
      return data && data.length ? data.map((item, index) => (_isPlainObject(item) ? renderDataItem(item, index) : null)) : currentChildren;
    };

    return () => {
      const { align, row, size, layout } = props;
      const { class: className, style, ...rest } = attrs as any;
      const classNames = cls(prefixCls, className, {
        [`${prefixCls}-${align}`]: !row,
        [`${prefixCls}-double`]: row,
        [`${prefixCls}-double-${size}`]: row,
        [`${prefixCls}-horizontal`]: layout === 'horizontal',
        [`${prefixCls}-vertical`]: layout === 'vertical',
      });
      return h('div', { class: classNames, style, ...getDataAttr(rest) }, [h('table', null, [h('tbody', null, renderChildrenList())])]);
    };
  },
});
(Descriptions as any).elementType = 'Descriptions';
(Descriptions as any).Item = DescriptionsItem;

export { DescriptionsItem, descriptionsItemProps };
export default Descriptions as typeof Descriptions & { Item: typeof DescriptionsItem };
