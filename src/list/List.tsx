import { defineComponent, h, cloneVNode, isVNode, reactive, watch } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/list/constants';
import '@douyinfe/semi-foundation/lib/es/list/list.css';
import { getDataAttr, flattenChildren, normalizeNode, renderSlotOrProp } from '../_utils';
import { useLocale } from '../locale';
import { Row } from '../grid';
import Spin from '../spin';
import ListItem from './Item';
import { provideListContext } from './context';
import type { Grid } from './context';

const prefixCls = cssClasses.PREFIX;

export const listProps = {
  bordered: { type: Boolean, default: false },
  footer: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  header: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  layout: { type: String as PropType<(typeof strings.LAYOUT)[number]>, default: 'vertical' },
  size: { type: String as PropType<(typeof strings.SIZE)[number]>, default: 'default' },
  split: { type: Boolean, default: true },
  emptyContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  dataSource: { type: Array as PropType<any[]>, default: undefined },
  renderItem: { type: Function as PropType<(item: any, ind: number) => any>, default: undefined },
  grid: { type: Object as PropType<Grid>, default: undefined },
  loading: { type: Boolean, default: false },
  loadMore: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const listEmits = ['click', 'rightClick'];

const List = defineComponent({
  name: 'List',
  inheritAttrs: false,
  props: listProps,
  emits: listEmits,
  setup(props, { slots, attrs, emit }) {
    const { locale } = useLocale('List');
    const ctx = reactive({
      grid: props.grid,
      onRightClick: (e: MouseEvent) => emit('rightClick', e),
      onClick: (e: MouseEvent) => emit('click', e),
    });
    watch(
      () => props.grid,
      (grid) => {
        ctx.grid = grid;
      }
    );
    provideListContext(ctx);

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const header = renderSlotOrProp(slots, 'header', props.header);
      const footer = renderSlotOrProp(slots, 'footer', props.footer);
      const emptyContent = renderSlotOrProp(slots, 'emptyContent', props.emptyContent);
      const loadMore = renderSlotOrProp(slots, 'loadMore', props.loadMore);
      const children = flattenChildren(slots.default?.());
      const wrapperCls = cls(prefixCls, props.className, attrClass, {
        [`${prefixCls}-flex`]: props.layout === 'horizontal',
        [`${prefixCls}-${props.size}`]: props.size,
        [`${prefixCls}-grid`]: props.grid,
        [`${prefixCls}-split`]: props.split,
        [`${prefixCls}-bordered`]: props.bordered,
      });
      let childrenList: any = null;
      if (props.dataSource && props.dataSource.length) {
        const items = props.renderItem ? props.dataSource.map((item, index) => props.renderItem!(item, index)) : [];
        childrenList = items.map((child: any, index: number) => {
          if (isVNode(child)) {
            return cloneVNode(child, { key: child.key ?? `list-item-${index}` }, true);
          }
          return child;
        });
      } else if (!children.length) {
        childrenList = emptyContent
          ? h('div', { class: `${prefixCls}-empty`, 'x-semi-prop': 'emptyContent' }, [normalizeNode(emptyContent)])
          : h('div', { class: `${prefixCls}-empty` }, locale.value?.emptyText);
      }
      let body: any;
      if (props.grid) {
        const rowProps: Record<string, any> = {};
        ['align', 'gutter', 'justify', 'type'].forEach((key) => {
          if (key in (props.grid as any)) rowProps[key] = (props.grid as any)[key];
        });
        body = h(Row, { type: 'flex', ...rowProps }, () => [childrenList, children]);
      } else {
        body = h('ul', { class: `${prefixCls}-items` }, [childrenList, children]);
      }
      return h('div', { class: wrapperCls, style: [props.style, attrStyle], ...getDataAttr(rest) }, [
        header ? h('div', { class: `${prefixCls}-header`, 'x-semi-prop': 'header' }, [normalizeNode(header)]) : null,
        h(Spin, { spinning: props.loading, size: 'large' }, () => body),
        footer ? h('div', { class: `${prefixCls}-footer`, 'x-semi-prop': 'footer' }, [normalizeNode(footer)]) : null,
        loadMore ? normalizeNode(loadMore) : null,
      ]);
    };
  },
});

(List as any).Item = ListItem;
(List as any).elementType = 'List';
export default List;
