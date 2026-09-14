import { defineComponent, h, ref, reactive, onMounted, onBeforeUnmount, watch, nextTick, Fragment, isVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import _isEmpty from 'lodash/isEmpty';
import _pick from 'lodash/pick';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/tabs/constants';
import { cssClasses as overflowClasses } from '@douyinfe/semi-foundation/lib/es/overflowList/constants';
import '@douyinfe/semi-foundation/lib/es/overflowList/overflowList.css';
import { getUuidv4 } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import { IconChevronRight, IconChevronLeft, IconChevronDown } from '../icons/generated';
import Button from '../button/Button';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode } from '../_utils';
import TabItem, { renderPaneNode } from './TabItem';
import TabsDropdown from './Dropdown';
import type { PlainTab } from './context';

export interface OverflowItem extends PlainTab {
  key: string;
  active: boolean;
}

export const tabBarProps = {
  activeKey: { type: String, default: undefined },
  className: { type: String, default: undefined },
  collapsible: { type: [Boolean, String] as PropType<boolean | 'auto'>, default: false },
  list: { type: Array as PropType<PlainTab[]>, default: () => [] },
  onTabClick: { type: Function as PropType<(activeKey: string, e: MouseEvent) => void>, default: undefined },
  showRestInDropdown: { type: Boolean, default: true },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'large' },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  tabBarExtraContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  tabPosition: { type: String as PropType<'top' | 'left'>, default: 'top' },
  type: { type: String as PropType<'line' | 'card' | 'button' | 'slash'>, default: 'line' },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  closable: { type: Boolean, default: false },
  deleteTabItem: { type: Function as PropType<(tabKey: string, e: MouseEvent) => void>, default: undefined },
  handleKeyDown: { type: Function as PropType<(e: KeyboardEvent, itemKey: string, closable: boolean) => void>, default: undefined },
  more: { type: [Number, Object] as PropType<number | { count: number; render?: () => VNodeChild; dropdownProps?: Record<string, any> }>, default: undefined },
  onVisibleTabsChange: { type: Function as PropType<(visibleState: Map<string, boolean>) => void>, default: undefined },
  visibleTabsStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  arrowPosition: { type: String as PropType<'start' | 'end' | 'both'>, default: 'both' },
  renderArrow: {
    type: Function as PropType<(items: OverflowItem[], pos: 'start' | 'end', handleArrowClick: () => void, defaultNode: VNodeChild) => VNodeChild>,
    default: undefined,
  },
  dropdownProps: { type: Object as PropType<{ start?: Record<string, any>; end?: Record<string, any> }>, default: undefined },
};

const INTERSECT_THRESHOLD = 0.75;

const TabBar = defineComponent({
  name: 'TabBar',
  inheritAttrs: false,
  props: tabBarProps,
  setup(props, { attrs, slots }) {
    const { locale } = useLocale('Tabs');
    const state = reactive({
      uuid: '',
      rePosKey: 0,
      shouldCollapse: false,
      /** overflowed items at the start / end of the scroll list (collapsible mode) */
      scrollOverflow: [[], []] as [OverflowItem[], OverflowItem[]],
      visibleState: new Map<string, boolean>(),
    });
    const tabBarRef = ref<HTMLElement | null>(null);
    const scrollerRef = ref<HTMLElement | null>(null);
    let isFirstShowInViewport = true;
    let observer: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let previousY: number | undefined;

    const _isActive = (key: string) => key === props.activeKey;
    const _getBarItemKeyByItemKey = (key: string) => `${key}-bar`;
    const _getItemKeyByBarItemKey = (key: string) => key.replace(/-bar$/, '');

    const getEffectiveCollapsible = () => {
      const { collapsible } = props;
      if (collapsible === 'auto') return state.shouldCollapse;
      return collapsible || false;
    };

    const isTabsWrapped = (tabBarEl: HTMLElement) => {
      if (props.tabPosition === 'left') return false;
      const tabNodes = Array.from(tabBarEl.querySelectorAll(`.${cssClasses.TABS_TAB}`)) as HTMLElement[];
      if (tabNodes.length <= 1) return false;
      const firstTop = tabNodes[0]?.offsetTop;
      if (typeof firstTop !== 'number') return false;
      return tabNodes.some((node) => node.offsetTop !== firstTop);
    };

    const checkOverflow = () => {
      if (props.collapsible !== 'auto') return;
      if (state.shouldCollapse) return;
      const tabBarEl = tabBarRef.value;
      if (!tabBarEl) return;
      const hasOverflow = isTabsWrapped(tabBarEl) || tabBarEl.scrollWidth > tabBarEl.clientWidth + 1;
      if (hasOverflow !== state.shouldCollapse) state.shouldCollapse = hasOverflow;
    };

    const handleResize = () => {
      if (props.collapsible === 'auto') checkOverflow();
    };

    const handleItemClick = (itemKey: string, e: MouseEvent) => {
      props.onTabClick && props.onTabClick(itemKey, e);
    };

    const scrollTabItemIntoViewByKey = (key: string, logicalPosition: ScrollLogicalPosition = 'nearest', behavior?: ScrollBehavior) => {
      const tabItem = document.querySelector(`[data-uuid="${state.uuid}"] .${cssClasses.TABS_TAB}[data-scrollkey="${key}"]`);
      tabItem?.scrollIntoView({ behavior: behavior || 'smooth', block: logicalPosition, inline: logicalPosition });
    };
    const scrollActiveTabItemIntoView = (logicalPosition?: ScrollLogicalPosition, behavior?: ScrollBehavior) => {
      const key = _getBarItemKeyByItemKey(props.activeKey as string);
      scrollTabItemIntoViewByKey(key, logicalPosition, behavior);
    };

    const handleArrowClick = (items: OverflowItem[], pos: 'start' | 'end') => {
      const list = items.slice();
      const lastItem = pos === 'start' ? list.pop() : list.shift();
      if (!lastItem) return;
      scrollTabItemIntoViewByKey(_getBarItemKeyByItemKey(lastItem.itemKey));
    };

    /* ---------------- collapsible (scroll mode overflow list) ---------------- */
    const getRenderedList = (): OverflowItem[] =>
      props.list.map((item) => ({ key: _getBarItemKeyByItemKey(item.itemKey), active: _isActive(item.itemKey), ...item }));

    const syncScrollOverflow = (visibleState: Map<string, boolean>) => {
      const items = getRenderedList();
      const visibleArr = items.map((item) => Boolean(visibleState.get(item.key)));
      const visibleStart = visibleArr.indexOf(true);
      const visibleEnd = visibleArr.lastIndexOf(true);
      if (visibleStart < 0 || visibleEnd < 0) return;
      state.scrollOverflow = [items.slice(0, visibleStart), items.slice(visibleEnd + 1)];
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visibleState = new Map(state.visibleState);
      entries.forEach((entry) => {
        const itemKey = (entry.target as HTMLElement).dataset.scrollkey as string;
        visibleState.set(itemKey, entry.isIntersecting);
      });
      let someItemVisible = false;
      for (const value of visibleState.values()) {
        if (value) {
          someItemVisible = true;
          break;
        }
      }
      const [entry1] = entries;
      const currentY = entry1?.boundingClientRect?.y;
      if (!someItemVisible && previousY !== undefined && currentY !== previousY) {
        previousY = currentY;
        return;
      }
      previousY = currentY;
      state.visibleState = visibleState;
      syncScrollOverflow(visibleState);
      onVisibleStateChange(visibleState);
    };

    const onVisibleStateChange = (visibleMap: Map<string, boolean>) => {
      const visibleMapWithItemKey = new Map<string, boolean>();
      visibleMap.forEach((v, k) => visibleMapWithItemKey.set(_getItemKeyByBarItemKey(k), v));
      if (isFirstShowInViewport) {
        const isShowInViewport = Array.from(visibleMapWithItemKey.values()).some((item) => item);
        if (isShowInViewport) {
          scrollActiveTabItemIntoView('nearest', 'auto');
          isFirstShowInViewport = false;
        }
      }
      if (props.collapsible === 'auto') {
        const isShowInViewport = Array.from(visibleMapWithItemKey.values()).some((v) => v);
        if (isShowInViewport) {
          const hasOverflow = Array.from(visibleMapWithItemKey.values()).some((v) => !v);
          if (hasOverflow !== state.shouldCollapse) state.shouldCollapse = hasOverflow;
        }
      }
      props.onVisibleTabsChange?.(visibleMapWithItemKey);
    };

    const disconnectObserver = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
    const observeItems = () => {
      disconnectObserver();
      const scroller = scrollerRef.value;
      if (!scroller || typeof IntersectionObserver === 'undefined') return;
      observer = new IntersectionObserver(handleIntersect, { root: scroller, threshold: INTERSECT_THRESHOLD });
      Array.from(scroller.querySelectorAll('[data-scrollkey]')).forEach((node) => observer!.observe(node));
    };

    onMounted(() => {
      state.uuid = getUuidv4();
      if (props.collapsible === 'auto') {
        requestAnimationFrame(() => checkOverflow());
        if (typeof ResizeObserver !== 'undefined' && tabBarRef.value) {
          resizeObserver = new ResizeObserver(handleResize);
          resizeObserver.observe(tabBarRef.value);
        }
      }
      if (getEffectiveCollapsible()) nextTick(observeItems);
    });
    onBeforeUnmount(() => {
      disconnectObserver();
      resizeObserver?.disconnect();
      resizeObserver = null;
    });

    watch(
      () => props.activeKey,
      () => {
        if (getEffectiveCollapsible()) nextTick(() => scrollActiveTabItemIntoView());
      }
    );
    watch(
      () => [props.list, getEffectiveCollapsible()],
      () => {
        if (props.collapsible === 'auto') checkOverflow();
        if (getEffectiveCollapsible()) {
          state.visibleState = new Map();
          nextTick(observeItems);
        } else {
          disconnectObserver();
          state.scrollOverflow = [[], []];
        }
      }
    );

    /* ---------------- render helpers ---------------- */
    const renderIcon = (icon: any) => h('span', null, [renderPaneNode(icon)]);

    const renderTabItem = (panel: PlainTab, extra: Record<string, any> = {}) => {
      const { size, type, deleteTabItem, handleKeyDown, tabPosition } = props;
      return h(TabItem, {
        ..._pick(panel, ['disabled', 'icon', 'itemKey', 'tab', 'closable']),
        key: _getBarItemKeyByItemKey(panel.itemKey),
        selected: _isActive(panel.itemKey),
        size,
        type,
        tabPosition,
        handleKeyDown,
        deleteTabItem,
        onClick: handleItemClick,
        ...extra,
      });
    };
    const renderTabComponents = (list: PlainTab[]) => list.map((panel) => renderTabItem(panel));

    const renderCollapse = (items: OverflowItem[], icon: VNodeChild, pos: 'start' | 'end') => {
      const arrowCls = cls({ [`${cssClasses.TABS_BAR}-arrow-${pos}`]: pos, [`${cssClasses.TABS_BAR}-arrow`]: true });
      if (_isEmpty(items)) {
        return h('div', { role: 'presentation', class: arrowCls, key: `arrow-${pos}` }, [h(Button, { disabled: true, icon, theme: 'borderless' })]);
      }
      const { dropdownClassName, dropdownStyle, showRestInDropdown, dropdownProps } = props;
      const disabled = !items.length;
      const menu = items.map((panel) => ({
        key: panel.itemKey,
        name: panel.tab,
        icon: panel.icon ? () => renderIcon(panel.icon) : undefined,
        active: _isActive(panel.itemKey),
        onClick: (e: MouseEvent) => handleItemClick(panel.itemKey, e),
      }));
      const button = h('div', { role: 'presentation', class: arrowCls, onClick: () => handleArrowClick(items, pos) }, [h(Button, { disabled, icon, theme: 'borderless' })]);
      const dropdownCls = cls(dropdownClassName, { [`${cssClasses.TABS_BAR}-dropdown`]: true });
      const customDropdownProps = dropdownProps?.[pos] ?? {};
      if (!showRestInDropdown) return h(Fragment, { key: `arrow-${pos}` }, [button]);
      return h(
        TabsDropdown,
        {
          key: `${state.rePosKey}-${pos}`,
          className: dropdownCls,
          clickToHide: true,
          clickTriggerToHide: true,
          position: pos === 'start' ? 'bottomLeft' : 'bottomRight',
          menu: disabled ? [] : menu,
          showTick: true,
          dropdownStyle,
          trigger: 'hover',
          disableFocusListener: true,
          ...customDropdownProps,
        },
        { default: () => button }
      );
    };

    const renderOverflow = (items: [OverflowItem[], OverflowItem[]]) =>
      items.map((item, index) => {
        const pos = index === 0 ? 'start' : 'end';
        const icon = index === 0 ? h(IconChevronLeft) : h(IconChevronRight);
        const overflowNode = renderCollapse(item, icon, pos);
        if (props.renderArrow) {
          return props.renderArrow(item, pos, () => handleArrowClick(item, pos), overflowNode);
        }
        return overflowNode;
      });

    const renderCollapsedTab = () => {
      const renderedList = getRenderedList();
      const overflow = renderOverflow(state.scrollOverflow);
      const scrollWrapper = h(
        'div',
        { class: `${overflowClasses.PREFIX}-scroll-wrapper`, ref: scrollerRef, style: { ...(props.visibleTabsStyle || {}) }, key: `${overflowClasses.PREFIX}-scroll-wrapper` },
        renderedList.map((item) => renderTabItem(item, { 'data-scrollkey': `${item.key}` }))
      );
      const list: VNodeChild[] = [scrollWrapper];
      if (props.arrowPosition === 'both') {
        list.unshift(overflow[0]);
        list.push(overflow[1]);
      } else if (props.arrowPosition === 'start') {
        list.unshift(overflow[1]);
        list.unshift(overflow[0]);
      } else {
        list.push(overflow[0]);
        list.push(overflow[1]);
      }
      return h('div', { class: cls(overflowClasses.PREFIX, `${cssClasses.TABS_BAR}-overflow-list`) }, list);
    };

    const renderMoreDropdown = (panels: PlainTab[], dropDownProps: Record<string, any> | undefined, trigger: VNodeChild) =>
      h(
        TabsDropdown,
        {
          trigger: 'hover',
          showTick: true,
          position: 'bottomLeft',
          className: `${cssClasses.TABS_BAR}-more-dropdown-${props.type}`,
          clickToHide: true,
          menu: panels.map((panel) => ({
            key: panel.itemKey,
            name: panel.tab,
            icon: panel.icon,
            onClick: (e: MouseEvent) => props.onTabClick && props.onTabClick(panel.itemKey, e),
            active: props.activeKey === panel.itemKey,
          })),
          ...(dropDownProps || {}),
        },
        { default: () => trigger }
      );

    const renderWithMoreTrigger = () => {
      const { list, more } = props;
      let tabElements: VNodeChild[] = [];
      let moreTrigger: VNodeChild = h(
        'div',
        { class: cls({ [`${cssClasses.TABS_BAR}-more-trigger`]: true, [`${cssClasses.TABS_BAR}-more-trigger-${props.type}`]: true }) },
        [
          h('div', { class: `${cssClasses.TABS_BAR}-more-trigger-content` }, [
            h('div', null, locale.value?.more),
            h(IconChevronDown, { class: `${cssClasses.TABS_BAR}-more-trigger-content-icon` }),
          ]),
        ]
      );
      let keepCount = list.length;
      if (typeof more === 'number') {
        keepCount = list.length - Math.min(more, list.length);
        tabElements = list.slice(0, keepCount).map((panel) => renderTabItem(panel));
      } else if (typeof more === 'object' && more !== null) {
        keepCount = list.length - Math.min(more.count, list.length);
        tabElements = list.slice(0, keepCount).map((panel) => renderTabItem(panel));
        if (more.render) moreTrigger = more.render();
      } else if (more !== undefined) {
        throw new Error('[Semi Tabs]: invalid tab props format: more');
      }
      return [...tabElements, renderMoreDropdown(list.slice(keepCount), (more as any)?.dropdownProps, moreTrigger)];
    };

    const renderExtra = () => {
      const { tabBarExtraContent, type, size } = props;
      const extraNode = slots.tabBarExtraContent ? slots.tabBarExtraContent() : normalizeNode(tabBarExtraContent);
      const tabBarExtraContentDefaultStyle: CSSProperties = { float: 'right' };
      // React merges the extra node's own `style` prop into the wrapper style
      const extraVNode = Array.isArray(extraNode) && extraNode.length === 1 ? extraNode[0] : extraNode;
      const extraStyle = isVNode(extraVNode) && extraVNode.props && extraVNode.props.style && typeof extraVNode.props.style === 'object' ? extraVNode.props.style : {};
      const extraCls = cls(cssClasses.TABS_BAR_EXTRA, {
        [`${cssClasses.TABS_BAR}-${type}-extra`]: type,
        [`${cssClasses.TABS_BAR}-${type}-extra-${size}`]: size,
      });
      if (extraNode !== null && extraNode !== undefined && extraNode !== false && !(Array.isArray(extraNode) && !extraNode.length)) {
        return h('div', { class: extraCls, style: { ...tabBarExtraContentDefaultStyle, ...extraStyle }, 'x-semi-prop': 'tabBarExtraContent' }, [extraNode]);
      }
      return null;
    };

    return () => {
      const { type, style, className, list, tabPosition, more } = props;
      const effectiveCollapsible = getEffectiveCollapsible();
      const classNames = cls(className, attrs.class as any, {
        [cssClasses.TABS_BAR]: true,
        [cssClasses.TABS_BAR_LINE]: type === 'line',
        [cssClasses.TABS_BAR_CARD]: type === 'card',
        [cssClasses.TABS_BAR_BUTTON]: type === 'button',
        [cssClasses.TABS_BAR_SLASH]: type === 'slash',
        [`${cssClasses.TABS_BAR}-${tabPosition}`]: tabPosition,
        [`${cssClasses.TABS_BAR}-collapse`]: effectiveCollapsible,
      });
      const extra = renderExtra();
      const contents = effectiveCollapsible ? renderCollapsedTab() : more ? renderWithMoreTrigger() : renderTabComponents(list);
      return h(
        'div',
        {
          role: 'tablist',
          'aria-orientation': tabPosition === 'left' ? 'vertical' : 'horizontal',
          class: classNames,
          style: [attrs.style, style],
          ...getDataAttr(attrs as any),
          'data-uuid': state.uuid,
          ref: tabBarRef,
        },
        [contents, extra]
      );
    };
  },
});

export default TabBar;
