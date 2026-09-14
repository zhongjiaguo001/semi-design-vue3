import { defineComponent, h, ref, onMounted, Fragment } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/collapse/constants';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import Collapsible from '../collapsible';
import { IconChevronDown, IconChevronUp } from '../icons/generated';
import { renderNode, hasSlotOrProp, normalizeNode, flattenChildren } from '../_utils';
import { useCollapseContext } from './context';

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const collapsePanelProps = {
  itemKey: { type: String, default: undefined },
  extra: nodeProp,
  header: nodeProp,
  reCalcKey: { type: [String, Number] as PropType<string | number>, default: undefined },
  showArrow: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
};

const CollapsePanel = defineComponent({
  name: 'CollapsePanel',
  inheritAttrs: false,
  props: collapsePanelProps,
  emits: ['motionEnd'],
  setup(props, { slots, attrs, emit }) {
    const context = useCollapseContext();
    const headerExpandIconTriggerRef = ref<HTMLSpanElement | null>(null);
    const ariaID = ref('');
    onMounted(() => {
      ariaID.value = getUuidShort({});
    });

    const handleClick = (itemKey: string, e: MouseEvent) => {
      // Judge user click Icon or Header
      // Don't mount this func into icon span wrapper, or get triggered twice because of event propagation
      if (!context) return;
      if (context.clickHeaderToExpand || headerExpandIconTriggerRef.value?.contains(e.target as Node)) {
        context.onClick(itemKey, e);
      }
    };

    const renderHeader = (active: boolean, expandIconEnable = true) => {
      const { showArrow } = props;
      let expandIcon = context?.expandIcon;
      let collapseIcon = context?.collapseIcon;
      const expandIconPosition = context?.expandIconPosition;
      if (typeof expandIcon === 'undefined') {
        expandIcon = h(IconChevronDown);
      } else {
        expandIcon = normalizeNode(expandIcon);
      }
      if (typeof collapseIcon === 'undefined') {
        collapseIcon = h(IconChevronUp);
      } else {
        collapseIcon = normalizeNode(collapseIcon);
      }
      const icon = h(
        'span',
        {
          ref: headerExpandIconTriggerRef,
          'aria-hidden': 'true',
          class: cls([`${cssClasses.PREFIX}-header-icon`, { [`${cssClasses.PREFIX}-header-iconDisabled`]: !expandIconEnable }]),
        },
        [expandIconEnable ? (active ? collapseIcon : expandIcon) : expandIcon]
      );
      const iconPosLeft = expandIconPosition === 'left';
      const header = renderNode(slots, 'header', props.header);
      const extra = renderNode(slots, 'extra', props.extra);
      if (typeof header === 'string') {
        return [
          showArrow && iconPosLeft ? icon : null,
          h('span', null, header),
          h('span', { class: `${cssClasses.PREFIX}-header-right` }, [h('span', null, extra as any), showArrow && !iconPosLeft ? icon : null]),
        ];
      }
      return [showArrow && iconPosLeft ? icon : null, header as any, showArrow && !iconPosLeft ? icon : null];
    };

    return () => {
      const { itemKey, reCalcKey, disabled } = props;
      const { class: className, ...restProps } = attrs as any;
      const keepDOM = context?.keepDOM;
      const expandIconPosition = context?.expandIconPosition;
      const activeSet = context?.activeSet;
      const motion = context?.motion;
      const lazyRender = context?.lazyRender;
      const active = Boolean(activeSet && activeSet.has(itemKey as string));
      const children = slots.default ? flattenChildren(slots.default()) : [];
      const hasChildren = children.length > 0;
      const itemCls = cls(className, {
        [`${cssClasses.PREFIX}-item`]: true,
        [`${cssClasses.PREFIX}-item-active`]: active,
      });
      const headerCls = cls({
        [`${cssClasses.PREFIX}-header`]: true,
        [`${cssClasses.PREFIX}-header-disabled`]: disabled,
        [`${cssClasses.PREFIX}-header-iconLeft`]: expandIconPosition === 'left',
      });
      const contentCls = cls({ [`${cssClasses.PREFIX}-content`]: true });
      return h('div', { ...restProps, class: itemCls }, [
        h(
          'div',
          {
            role: 'button',
            tabindex: 0,
            class: headerCls,
            'aria-disabled': disabled,
            'aria-expanded': active ? 'true' : 'false',
            'aria-owns': ariaID.value,
            onClick: (e: MouseEvent) => !disabled && handleClick(itemKey as string, e),
          },
          renderHeader(active, hasChildren && !disabled)
        ),
        hasChildren
          ? h(
              Collapsible,
              {
                lazyRender,
                isOpen: active,
                keepDOM,
                motion: motion !== false,
                onMotionEnd: () => emit('motionEnd'),
                reCalcKey,
              },
              {
                default: () =>
                  h('div', { class: contentCls, 'aria-hidden': !active, id: ariaID.value }, [
                    h('div', { class: `${cssClasses.PREFIX}-content-wrapper` }, children),
                  ]),
              }
            )
          : null,
      ]);
    };
  },
});
(CollapsePanel as any).elementType = 'Collapse.Panel';

export default CollapsePanel;
