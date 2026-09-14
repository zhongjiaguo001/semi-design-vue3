import { defineComponent, h, reactive, watchEffect, Fragment } from 'vue';
import type { PropType, VNode, VNodeChild } from 'vue';
import cls from 'classnames';
import _isFunction from 'lodash/isFunction';
import _isNull from 'lodash/isNull';
import _isUndefined from 'lodash/isUndefined';
import _merge from 'lodash/merge';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/breadcrumb/constants';
import BreadcrumbFoundation from '@douyinfe/semi-foundation/lib/es/breadcrumb/foundation';
import BreadcrumbItemFoundation from '@douyinfe/semi-foundation/lib/es/breadcrumb/itemFoundation';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import '@douyinfe/semi-foundation/lib/es/breadcrumb/breadcrumb.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, normalizeNode, getDataAttr, cloneVNode, isVNode, getVNodeElementType, renderSlotOrProp } from '../_utils';
import Popover from '../popover/Popover';
import { Text as TypographyText } from '../typography/Typography';
import { IconMore } from '../icons/generated';
import { provideBreadContext, useBreadContext } from './context';
import type { BreadcrumbShowTooltip } from './context';

const clsPrefix = cssClasses.PREFIX;

export type MoreType = (typeof strings.MORE_TYPE)[number];

export interface Route {
  [x: string]: any;
  path?: string;
  href?: string;
  name?: string;
  icon?: any;
}
export interface BreadcrumbItemInfo {
  name?: any;
  href?: string;
  icon?: any;
  path?: string;
}

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const breadcrumbItemProps = {
  icon: { type: [Object, Function, String] as PropType<any>, default: undefined },
  href: { type: String, default: undefined },
  separator: nodeProp,
  noLink: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  shouldRenderSeparator: { type: Boolean, default: true },
  route: { type: [Object, String] as PropType<Route | string>, default: undefined },
  name: { type: String, default: undefined },
};

export const BreadcrumbItem = defineComponent({
  name: 'BreadcrumbItem',
  inheritAttrs: false,
  props: breadcrumbItemProps,
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const context = useBreadContext();
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const adapter = {
      ...baseAdapter,
      notifyClick: (item: BreadcrumbItemInfo, e: any) => emit('click', item, e),
      notifyParent: (item: BreadcrumbItemInfo, e: any) => context?.onClick(item, e),
    };
    const foundation = new (BreadcrumbItemFoundation as any)(adapter);

    const getChildren = () => flattenChildren(slots.default?.());
    const getStringChildren = (children: VNode[]): string | undefined => {
      if (children.length === 1 && typeof children[0].type === 'symbol' && typeof children[0].children === 'string') return children[0].children as string;
      return undefined;
    };

    const renderIcon = () => {
      const compact = context?.compact;
      const iconSize = compact ? 'small' : 'default';
      const className = `${clsPrefix}-item-icon`;
      const iconNode = slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(props.icon);
      if (isVNode(iconNode)) {
        return cloneVNode(iconNode, { class: className, size: iconSize }, true);
      }
      return iconNode;
    };

    const getTooltipOpt = (): BreadcrumbShowTooltip => {
      const showTooltip = context?.showTooltip;
      if (!showTooltip) {
        return { width: 150, ellipsisPos: 'end' };
      }
      const defaultOpts: BreadcrumbShowTooltip = { width: 150, ellipsisPos: 'end', opts: { autoAdjustOverflow: true, position: 'top' } };
      if (typeof showTooltip === 'object') {
        return _merge(defaultOpts, showTooltip);
      }
      return defaultOpts;
    };

    const getItemInfo = (children: VNode[]): BreadcrumbItemInfo => {
      let itemInfo: BreadcrumbItemInfo = {};
      const { route, href } = props;
      const hasHref = !_isUndefined(href) && !_isNull(href);
      if (route) {
        itemInfo = typeof route === 'object' ? route : { name: route };
      } else {
        const str = getStringChildren(children);
        itemInfo.name = str !== undefined ? str : (children as any);
        if (hasHref) itemInfo.href = href;
      }
      return itemInfo;
    };

    const renderBreadItem = (children: VNode[]) => {
      const compact = context?.compact;
      const showTooltip = getTooltipOpt();
      const icon = renderIcon();
      const str = getStringChildren(children);
      if (str) {
        const { opts, ellipsisPos, width } = showTooltip;
        return h(Fragment, [
          icon,
          h('span', { class: `${clsPrefix}-item-title` }, [
            h(
              TypographyText,
              {
                ellipsis: { showTooltip: opts ? { opts } : false, pos: ellipsisPos },
                style: { maxWidth: typeof width === 'number' ? `${width}px` : width },
                size: compact ? 'small' : 'normal',
              },
              { default: () => str }
            ),
          ]),
        ]);
      }
      return h(Fragment, [icon, children.length ? h('span', { class: `${clsPrefix}-item-title ${clsPrefix}-item-title-inline` }, children) : null]);
    };

    const renderItem = (children: VNode[]) => {
      const { href, active, noLink } = props;
      const hasHref = href !== null && typeof href !== 'undefined';
      const itemCls = cls({
        [`${clsPrefix}-item`]: true,
        [`${clsPrefix}-item-active`]: active,
        [`${clsPrefix}-item-link`]: !noLink,
      });
      const itemInner = renderBreadItem(children);
      const tag = active || !hasHref ? 'span' : 'a';
      const itemInfo = getItemInfo(children);
      return h(tag, { class: itemCls, onClick: (e: MouseEvent) => foundation.handleClick(itemInfo, e), href }, [itemInner]);
    };

    return () => {
      const { active, shouldRenderSeparator } = props;
      const children = getChildren();
      const pageLabel = active ? { 'aria-current': 'page' } : {};
      const item = renderItem(children);
      const ownSeparator = renderSlotOrProp(slots, 'separator', normalizeNode(props.separator));
      const separator = ownSeparator || h('span', { class: `${clsPrefix}-separator` }, [context?.renderSeparator ? context.renderSeparator() : normalizeNode(context?.separator)]);
      const wrapperCls = cls({ [`${clsPrefix}-item-wrap`]: true }, attrs.class as any);
      const { class: _c, ...rest } = attrs as any;
      return h('span', { class: wrapperCls, style: rest.style, ...pageLabel, ...getDataAttr(rest) }, [item, shouldRenderSeparator ? separator : null]);
    };
  },
});
(BreadcrumbItem as any).elementType = 'Breadcrumb.Item';
(BreadcrumbItem as any).isBreadcrumbItem = true;

export const breadcrumbProps = {
  activeIndex: { type: Number, default: undefined },
  routes: { type: Array as PropType<Array<Route | string>>, default: () => [] },
  separator: { ...nodeProp, default: '/' },
  compact: { type: Boolean, default: true },
  renderItem: { type: Function as PropType<(route: Route) => VNodeChild>, default: undefined },
  showTooltip: {
    type: [Boolean, Object] as PropType<boolean | BreadcrumbShowTooltip>,
    default: (() => ({ width: 150, ellipsisPos: 'end' })) as () => boolean | BreadcrumbShowTooltip,
  },
  autoCollapse: { type: Boolean, default: true },
  maxItemCount: { type: Number, default: 4 },
  /* Customize the contents of the ellipsis area */
  renderMore: { type: Function as PropType<(restItem: VNode[]) => VNodeChild>, default: undefined },
  /* Type of ellipsis area */
  moreType: { type: String as PropType<MoreType>, default: 'default' },
  ariaLabel: { type: String, default: 'Breadcrumb' },
};

export const breadcrumbEmits = ['click'];

const Breadcrumb = defineComponent({
  name: 'Breadcrumb',
  inheritAttrs: false,
  props: breadcrumbProps,
  emits: breadcrumbEmits,
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { isCollapsed: true });
    const adapter = {
      ...baseAdapter,
      notifyClick: (info: BreadcrumbItemInfo, event: any) => emit('click', info, event),
      expandCollapsed: () => {
        state.isCollapsed = false;
      },
    };
    const foundation = new (BreadcrumbFoundation as any)(adapter);

    const onClick = (info: BreadcrumbItemInfo, event: any) => foundation.handleClick(info, event);

    const getSeparator = () => renderSlotOrProp(slots, 'separator', normalizeNode(props.separator));
    const context = reactive({ onClick, showTooltip: props.showTooltip, compact: props.compact, separator: props.separator, renderSeparator: getSeparator });
    watchEffect(() => {
      context.showTooltip = props.showTooltip;
      context.compact = props.compact;
      context.separator = props.separator;
    });
    provideBreadContext(context);


    const renderPopoverMore = (restItem: VNode[]) => {
      const content = () =>
        h(
          Fragment,
          restItem.map((item, idx) => h(Fragment, { key: `restItem-${idx}` }, [item, idx !== restItem.length - 1 ? h('span', { class: `${clsPrefix}-restItem` }, [getSeparator()]) : null]))
        );
      return h(Popover, { content, style: { padding: '12px' }, showArrow: true }, { default: () => h(IconMore) });
    };

    const handleCollapse = (template: VNode[], itemsLen: number) => {
      const { maxItemCount, moreType } = props;
      const renderMore = props.renderMore || (slots.more ? (rest: VNode[]) => slots.more!({ restItem: rest }) : undefined);
      const hasRenderMore = _isFunction(renderMore);
      const restItem = template.slice(1, itemsLen - maxItemCount + 1);
      const spread = h('span', { class: `${clsPrefix}-collapse`, key: `more-${itemsLen}` }, [
        h('span', { class: `${clsPrefix}-item-wrap` }, [
          h(
            'span',
            {
              role: 'button',
              tabindex: 0,
              'aria-label': 'Expand breadcrumb items',
              class: `${clsPrefix}-item ${clsPrefix}-item-more`,
              onClick: (item: any) => foundation.handleExpand(item),
              onKeypress: (e: KeyboardEvent) => foundation.handleExpandEnterPress(e),
            },
            [
              hasRenderMore ? renderMore!(restItem) : null,
              !hasRenderMore && moreType === 'default' ? h(IconMore) : null,
              !hasRenderMore && moreType === 'popover' ? renderPopoverMore(restItem) : null,
            ]
          ),
          h('span', { class: `${clsPrefix}-separator`, 'x-semi-prop': 'separator' }, [getSeparator()]),
        ]),
      ]);
      template.splice(1, itemsLen - maxItemCount, spread);
      return template;
    };

    const renderRouteItems = (items: any[], shouldCollapse: boolean, moreTypeIsPopover: boolean) => {
      const { renderItem, maxItemCount } = props;
      const restItemLength = items.length - maxItemCount;
      const hasRenderMore = _isFunction(props.renderMore) || Boolean(slots.more);
      const itemRenderer = renderItem || (slots.item ? (route: Route) => slots.item!({ route }) : undefined);
      return items.map((route, idx) => {
        const { _origin, ...routeProps } = route;
        const key = _origin.key || `item-${route.name || route.path}-${idx}`;
        const inCollapseArea = idx > 0 && idx <= restItemLength;
        const { name: _n, ...passProps } = routeProps;
        return h(
          BreadcrumbItem,
          {
            ...passProps,
            key,
            active: props.activeIndex !== undefined ? props.activeIndex === idx : idx === items.length - 1,
            route: _origin,
            shouldRenderSeparator: idx !== items.length - 1 && !(shouldCollapse && (hasRenderMore || moreTypeIsPopover) && inCollapseArea),
          },
          { default: () => (itemRenderer ? itemRenderer(_origin) : route.name) }
        );
      });
    };

    const renderList = (): VNode[] => {
      const { routes, autoCollapse, maxItemCount, moreType } = props;
      const { isCollapsed } = state;
      const hasRoutes = routes && routes.length > 0;
      const items: any[] = hasRoutes ? foundation.genRoutes(routes) : flattenChildren(slots.default?.());
      let template: VNode[];
      const itemLength = items.length;
      const restItemLength = itemLength - maxItemCount;
      const shouldCollapse = Boolean(items && autoCollapse && itemLength > maxItemCount && isCollapsed);
      const hasRenderMore = _isFunction(props.renderMore) || Boolean(slots.more);
      const moreTypeIsPopover = moreType === 'popover';
      if (hasRoutes) {
        template = renderRouteItems(items, shouldCollapse, moreTypeIsPopover);
      } else {
        template = (items as VNode[]).map((item, idx) => {
          const inCollapseArea = idx > 0 && idx <= restItemLength;
          if (!item) return item;
          warning(typeof item.type === 'object' && !(item.type as any).isBreadcrumbItem && getVNodeElementType(item) !== 'Breadcrumb.Item', '[Semi Breadcrumb]: Only accepts Breadcrumb.Item as its children');
          return cloneVNode(
            item,
            {
              key: `${idx}-item`,
              active: props.activeIndex !== undefined ? props.activeIndex === idx : idx === items.length - 1,
              shouldRenderSeparator: idx !== items.length - 1 && !(shouldCollapse && (hasRenderMore || moreTypeIsPopover) && inCollapseArea),
            },
            true
          );
        });
      }
      if (shouldCollapse) {
        return handleCollapse(template, items.length);
      }
      return template;
    };

    return () => {
      const breadcrumbs = renderList();
      const { compact } = props;
      const { class: className, style, ...rest } = attrs as any;
      const sizeCls = cls(className, {
        [`${clsPrefix}-wrapper`]: true,
        [`${clsPrefix}-wrapper-compact`]: compact,
        [`${clsPrefix}-wrapper-loose`]: !compact,
      });
      const ariaLabel = (rest['aria-label'] as string | undefined) ?? props.ariaLabel;
      return h('nav', { 'aria-label': ariaLabel, class: sizeCls, style, ...getDataAttr(rest) }, breadcrumbs);
    };
  },
}) as any;
Breadcrumb.Item = BreadcrumbItem;
Breadcrumb.elementType = 'Breadcrumb';

export default Breadcrumb as typeof Breadcrumb & { Item: typeof BreadcrumbItem };
