import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties, VNode } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/timeline/constants';
import '@douyinfe/semi-foundation/lib/es/timeline/timeline.css';
import { flattenChildren, normalizeNode, getDataAttr, cloneVNode, isVNode } from '../_utils';

const prefixCls = cssClasses.PREFIX;
const itemPrefixCls = cssClasses.ITEM;

export type TimelineMode = (typeof strings.MODE)[number];
export type TimelineItemType = (typeof strings.ITEM_TYPE)[number];
export type TimelineItemPosition = (typeof strings.ITEM_POS)[number];

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const timelineItemProps = {
  color: { type: String, default: undefined },
  time: { ...nodeProp, default: '' },
  type: { type: String as PropType<TimelineItemType>, default: 'default' },
  dot: nodeProp,
  extra: nodeProp,
  position: { type: String as PropType<TimelineItemPosition>, default: undefined },
};

export const TimelineItem = defineComponent({
  name: 'TimelineItem',
  inheritAttrs: false,
  props: timelineItemProps,
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const has = (name: string) => Boolean(slots[name]) || (props as any)[name] !== undefined && (props as any)[name] !== null && (props as any)[name] !== '' && (props as any)[name] !== false;
    const node = (name: string) => (slots[name] ? slots[name]!() : normalizeNode((props as any)[name]));
    return () => {
      const { color, type } = props;
      const { class: className, style, ...rest } = attrs as any;
      const hasDot = has('dot');
      const itemCls = cls(itemPrefixCls, className);
      const dotCls = cls({
        [`${itemPrefixCls}-head`]: true,
        [`${itemPrefixCls}-head-custom`]: hasDot,
        [`${itemPrefixCls}-head-${type}`]: type,
      });
      const dotStyle: CSSProperties | undefined = color ? { backgroundColor: color } : undefined;
      return h(
        'li',
        {
          class: itemCls,
          style,
          onClick: (e: MouseEvent) => emit('click', e),
          ...getDataAttr(rest),
        },
        [
          h('div', { class: `${itemPrefixCls}-tail`, 'aria-hidden': true }),
          h('div', { class: dotCls, 'aria-hidden': true, style: dotStyle }, hasDot ? [node('dot')] : undefined),
          h('div', { class: `${itemPrefixCls}-content` }, [
            slots.default?.(),
            has('extra') ? h('div', { class: `${itemPrefixCls}-content-extra` }, [node('extra')]) : null,
            has('time') ? h('div', { class: `${itemPrefixCls}-content-time` }, [node('time')]) : null,
          ]),
        ]
      );
    };
  },
});
(TimelineItem as any).elementType = 'Timeline.Item';

export interface TimelineDataItem {
  color?: string;
  time?: any;
  type?: TimelineItemType;
  dot?: any;
  extra?: any;
  position?: TimelineItemPosition;
  content?: any;
  class?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
  [key: string]: any;
}

export const timelineProps = {
  mode: { type: String as PropType<TimelineMode>, default: 'left' },
  dataSource: { type: Array as PropType<TimelineDataItem[]>, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

const Timeline = defineComponent({
  name: 'Timeline',
  inheritAttrs: false,
  props: timelineProps,
  setup(props, { slots, attrs }) {
    const getPosCls = (ele: VNode, idx: number) => {
      const { mode } = props;
      const position = (ele.props as any)?.position;
      if (mode === 'alternate') {
        if (position) return `${prefixCls}-item-${position}`;
        return idx % 2 === 0 ? `${prefixCls}-item-left` : `${prefixCls}-item-right`;
      }
      if (mode === 'center') {
        if (position) return `${prefixCls}-item-${position}`;
        return `${prefixCls}-item-left`;
      }
      if (mode === 'left' || mode === 'right') {
        return `${prefixCls}-item-${mode}`;
      }
      if (position) return `${prefixCls}-item-${position}`;
      return '';
    };

    const addClassName = (items: VNode[]) =>
      items.map((ele, idx) => {
        if (isVNode(ele) && typeof ele.type !== 'symbol') {
          return cloneVNode(ele, { class: getPosCls(ele, idx) }, true);
        }
        return ele;
      });

    return () => {
      const { mode, dataSource } = props;
      const { class: className, style, ...rest } = attrs as any;
      const classString = cls(prefixCls, className, { [`${prefixCls}-${mode}`]: mode });
      let childrenList: VNode[] | undefined;
      if (dataSource && dataSource.length) {
        const items = dataSource.map((item, index) => {
          const { content, className: itemClassName, class: itemClass, ...itemProps } = item;
          return h(TimelineItem, { key: `timeline-item-${index}`, class: cls(itemClass, itemClassName), ...itemProps }, { default: () => normalizeNode(content) });
        });
        childrenList = addClassName(items);
      }
      const items = childrenList || addClassName(flattenChildren(slots.default?.()));
      return h('ul', { 'aria-label': props.ariaLabel ?? rest['aria-label'], style, class: classString, ...getDataAttr(rest) }, items);
    };
  },
}) as any;
Timeline.Item = TimelineItem;
Timeline.elementType = 'Timeline';

export default Timeline as typeof Timeline & { Item: typeof TimelineItem };
