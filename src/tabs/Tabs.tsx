import { defineComponent, h, reactive, watch, onBeforeUnmount, nextTick, isVNode, cloneVNode } from 'vue';
import type { PropType, CSSProperties, VNode, VNodeChild } from 'vue';
import _isEqual from 'lodash/isEqual';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/tabs/constants';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import TabsFoundation from '@douyinfe/semi-foundation/lib/es/tabs/foundation';
import '@douyinfe/semi-foundation/lib/es/tabs/tabs.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { camelize } from '../_base/useBaseComponent';
import { flattenChildren, getDataAttr } from '../_utils';
import TabBar from './TabBar';
import type { OverflowItem } from './TabBar';
import TabPane from './TabPane';
import TabItem from './TabItem';
import { provideTabsContext } from './context';
import type { PlainTab, TabContextValue } from './context';

export type TabType = (typeof strings.TYPE_MAP)[number];
export type TabSize = (typeof strings.SIZE)[number];
export type TabPosition = 'top' | 'left'; // (typeof strings.POSITION_MAP)[number]
export type { PlainTab, TabContextValue, OverflowItem };

export interface TabsMore {
  count: number;
  render?: () => VNodeChild;
  dropdownProps?: Record<string, any>;
}
export interface TabsDropDownProps {
  start?: Record<string, any>;
  end?: Record<string, any>;
}

export const tabsProps = {
  activeKey: { type: String, default: undefined },
  modelValue: { type: String, default: undefined },
  defaultActiveKey: { type: String, default: undefined },
  className: { type: String, default: undefined },
  collapsible: { type: [Boolean, String] as PropType<boolean | 'auto'>, default: false },
  contentStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  keepDOM: { type: Boolean, default: true },
  lazyRender: { type: Boolean, default: false },
  renderTabBar: { type: Function as PropType<(tabBarProps: Record<string, any>, DefaultTabBar: typeof TabBar) => VNodeChild>, default: undefined },
  showRestInDropdown: { type: Boolean, default: true },
  size: { type: String as PropType<TabSize>, default: 'large' },
  tabBarClassName: { type: String, default: undefined },
  tabBarExtraContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  tabBarStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  tabList: { type: Array as PropType<PlainTab[]>, default: undefined },
  tabPaneMotion: { type: Boolean, default: true },
  tabPosition: { type: String as PropType<TabPosition>, default: 'top' },
  type: { type: String as PropType<TabType>, default: 'line' },
  preventScroll: { type: Boolean, default: false },
  more: { type: [Number, Object] as PropType<number | TabsMore>, default: undefined },
  visibleTabsStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  arrowPosition: { type: String as PropType<'start' | 'end' | 'both'>, default: 'both' },
  renderArrow: {
    type: Function as PropType<(items: OverflowItem[], pos: 'start' | 'end', handleArrowClick: () => void, defaultNode: VNodeChild) => VNodeChild>,
    default: undefined,
  },
  dropdownProps: { type: Object as PropType<TabsDropDownProps>, default: undefined },
};

export const tabsEmits = ['update:activeKey', 'update:modelValue', 'change', 'tabClick', 'tabClose', 'visibleTabsChange'];

const panePickKeys = ['className', 'style', 'disabled', 'itemKey', 'tab', 'icon'];

/** read a (possibly kebab-cased) raw prop from a vnode */
const readVNodeProp = (vnode: VNode, key: string) => {
  const raw: any = vnode.props || {};
  if (key in raw) return raw[key];
  for (const k of Object.keys(raw)) {
    if (camelize(k) === key) return raw[k];
  }
  return undefined;
};
const toBool = (v: any) => (v === '' ? true : Boolean(v));

const isTabPaneVNode = (vnode: any) => isVNode(vnode) && typeof vnode.type === 'object' && ((vnode.type as any).isTabPane || readVNodeProp(vnode, 'itemKey') !== undefined);

/** node props of a TabPane (`tab` / `icon`) may also be given as same-named slots; the slot wins */
const readPaneNode = (vnode: VNode, key: 'tab' | 'icon') => {
  const children: any = vnode.children;
  if (children && typeof children === 'object' && !Array.isArray(children) && typeof children[key] === 'function') {
    return children[key];
  }
  return readVNodeProp(vnode, key);
};

/** lenient deep-equal: functions compare by source (a slot re-invocation creates new closures each render) */
const looseEqual = (a: any, b: any, depth = 0): boolean => {
  if (a === b) return true;
  if (depth > 6) return true;
  if (typeof a === 'function' && typeof b === 'function') return a.toString() === b.toString();
  if (isVNode(a) && isVNode(b)) {
    if (a.type !== b.type) return false;
    if (!looseEqual(a.props, b.props, depth + 1)) return false;
    const ca: any = a.children;
    const cb: any = b.children;
    if (ca && cb && typeof ca === 'object' && typeof cb === 'object' && !Array.isArray(ca) && !Array.isArray(cb)) {
      // slots object: compare by keys only
      return _isEqual(Object.keys(ca), Object.keys(cb));
    }
    return looseEqual(ca, cb, depth + 1);
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((c, i) => looseEqual(c, b[i], depth + 1));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => looseEqual(a[k], b[k], depth + 1));
  }
  return _isEqual(a, b);
};
const nodeEqual = looseEqual;
const panesEqual = (a: Record<string, any>[] | undefined, b: Record<string, any>[] | undefined) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((pa, i) => {
    const pb = b[i];
    return (
      pa.itemKey === pb.itemKey &&
      Boolean(pa.disabled) === Boolean(pb.disabled) &&
      Boolean(pa.closable) === Boolean(pb.closable) &&
      nodeEqual(pa.tab, pb.tab) &&
      nodeEqual(pa.icon, pb.icon) &&
      _isEqual(pa.className, pb.className) &&
      _isEqual(pa.style, pb.style)
    );
  });
};

const Tabs = defineComponent({
  name: 'Tabs',
  inheritAttrs: false,
  props: tabsProps,
  emits: tabsEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, any>(
      props as any,
      { activeKey: '', panes: [] as PlainTab[], prevActiveKey: null as string | null, forceDisableMotion: false },
      { modelProp: 'activeKey' }
    );
    const getActiveKeyProp = (): string | undefined => ('activeKey' in propsView ? (propsView as any).activeKey : undefined);

    /** panes derived from the default slot (TabPane children) */
    let latestChildPanes: Record<string, any>[] = [];
    let prevChildPanes: Record<string, any>[] = [];

    const collectChildPanes = (children: VNode[]) => {
      const res: Record<string, any>[] = [];
      children.forEach((child) => {
        if (!isTabPaneVNode(child)) return;
        res.push({
          tab: readPaneNode(child, 'tab'),
          icon: readPaneNode(child, 'icon'),
          disabled: toBool(readVNodeProp(child, 'disabled')),
          itemKey: readVNodeProp(child, 'itemKey'),
          closable: toBool(readVNodeProp(child, 'closable')),
          className: readVNodeProp(child, 'className') ?? readVNodeProp(child, 'class'),
          style: readVNodeProp(child, 'style'),
        });
      });
      return res;
    };
    const getChildren = () => flattenChildren(slots.default?.());

    const getPanes = (): PlainTab[] => {
      const { tabList } = props;
      if (Array.isArray(tabList) && tabList.length) return tabList;
      return latestChildPanes.map((p) => ({ tab: p.tab, icon: p.icon, disabled: p.disabled, itemKey: p.itemKey, closable: p.closable }));
    };

    const adapter = {
      ...baseAdapter,
      collectPane: () => {
        state.panes = getPanes();
      },
      collectActiveKey: () => {
        if (typeof getActiveKeyProp() !== 'undefined') return;
        const { activeKey } = state;
        const panes = getPanes();
        if (panes.findIndex((p) => p.itemKey === activeKey) === -1) {
          if (panes.length > 0) {
            adapter.setNewActiveKey(panes[0].itemKey);
          } else {
            adapter.setNewActiveKey('');
          }
        }
      },
      notifyTabClick: (activeKey: string, event: any) => {
        emit('tabClick', activeKey, event);
      },
      notifyChange: (activeKey: string) => {
        emit('update:activeKey', activeKey);
        emit('update:modelValue', activeKey);
        emit('change', activeKey);
      },
      setNewActiveKey: (activeKey: string) => {
        if (state.activeKey !== activeKey) {
          state.prevActiveKey = state.activeKey;
          state.activeKey = activeKey;
        }
      },
      getDefaultActiveKeyFromChildren: () => {
        const { tabList } = props;
        let activeKey = '';
        const list: any[] = tabList ? tabList : latestChildPanes;
        list.forEach((item) => {
          if (item && !activeKey && !item.disabled) activeKey = item.itemKey;
        });
        return activeKey;
      },
      notifyTabDelete: (tabKey: string) => {
        emit('tabClose', tabKey);
      },
    };
    const foundation = new (TabsFoundation as any)(adapter);

    // initial state (React constructor) – computed lazily in the first render so the slot is invoked inside it
    let initialized = false;
    const ensureInit = (children: VNode[]) => {
      if (initialized) return;
      initialized = true;
      latestChildPanes = collectChildPanes(children);
      prevChildPanes = latestChildPanes;
      state.activeKey = foundation.getDefaultActiveKey();
      state.panes = getPanes();
      foundation.init();
    };
    onBeforeUnmount(() => foundation.destroy());

    // getDerivedStateFromProps: controlled activeKey
    watch(
      () => [getActiveKeyProp(), (props as any).modelValue],
      () => {
        const activeKey = getActiveKeyProp();
        if (!isNullOrUndefined(activeKey) && activeKey !== state.activeKey) {
          // forceDisableMotion when the newly activated pane was just added
          const prevItemKeys = new Set(prevChildPanes.map((p) => p.itemKey));
          const newAdded = latestChildPanes.map((p) => p.itemKey).filter((k) => !prevItemKeys.has(k));
          state.forceDisableMotion = newAdded.includes(activeKey);
          state.prevActiveKey = state.activeKey;
          state.activeKey = activeKey;
        }
      }
    );
    watch(
      () => props.tabList,
      (n, o) => {
        if (!panesEqual(n as any, o as any)) foundation.handleTabListChange();
      },
      { deep: true }
    );

    const context = reactive<TabContextValue>({
      activeKey: state.activeKey,
      lazyRender: props.lazyRender,
      panes: state.panes,
      tabPaneMotion: props.tabPaneMotion,
      tabPosition: props.tabPosition as TabPosition,
      prevActiveKey: state.prevActiveKey,
      forceDisableMotion: state.forceDisableMotion,
    });
    watch(
      () => [state.activeKey, props.lazyRender, state.panes, props.tabPaneMotion, props.tabPosition, state.prevActiveKey, state.forceDisableMotion],
      () => {
        context.activeKey = state.activeKey;
        context.lazyRender = props.lazyRender;
        context.panes = state.panes;
        context.tabPaneMotion = props.tabPaneMotion;
        context.tabPosition = props.tabPosition as TabPosition;
        context.prevActiveKey = state.prevActiveKey;
        context.forceDisableMotion = state.forceDisableMotion;
      },
      { flush: 'sync' }
    );
    provideTabsContext(context);

    const onTabClick = (activeKey: string, event: MouseEvent) => {
      foundation.handleTabClick(activeKey, event);
    };
    const deleteTabItem = (tabKey: string, event: MouseEvent) => {
      event.stopPropagation();
      foundation.handleTabDelete(tabKey);
    };

    const getActiveItem = (children: VNode[]) => {
      const { activeKey } = state;
      if (props.tabList) return children;
      return children.filter((pane) => {
        if (isVNode(pane) && pane.type && (pane.type as any).isTabPane) {
          return readVNodeProp(pane, 'itemKey') === activeKey;
        }
        return true;
      });
    };

    /** children changed (componentDidUpdate). Applied synchronously so the bar re-renders in the same pass. */
    const syncChildPanes = (children: VNode[]) => {
      const now = collectChildPanes(children);
      const isTabListType = Boolean(props.tabList);
      if (!panesEqual(latestChildPanes, now)) {
        prevChildPanes = latestChildPanes;
        latestChildPanes = now;
        if (!isTabListType) {
          foundation.handleTabPanesChange();
        }
      }
    };

    expose({ foundation, getPanes: () => state.panes });

    return () => {
      const {
        collapsible,
        contentStyle,
        keepDOM,
        renderTabBar,
        showRestInDropdown,
        size,
        tabBarClassName,
        tabBarExtraContent,
        tabBarStyle,
        tabPosition,
        type,
        more,
        visibleTabsStyle,
        arrowPosition,
        renderArrow,
        dropdownProps,
        className,
      } = props;
      const children = getChildren();
      ensureInit(children);
      syncChildPanes(children);
      const { panes, activeKey } = state;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const tabWrapperCls = cls(className, attrClass, { [cssClasses.TABS]: true, [`${cssClasses.TABS}-${tabPosition}`]: tabPosition });
      const tabContentCls = cls({ [cssClasses.TABS_CONTENT]: true, [`${cssClasses.TABS_CONTENT}-${tabPosition}`]: tabPosition });
      const tabBarProps: Record<string, any> = {
        activeKey,
        className: tabBarClassName,
        collapsible,
        list: panes,
        onTabClick,
        showRestInDropdown,
        size,
        style: tabBarStyle,
        tabBarExtraContent,
        tabPosition,
        type,
        deleteTabItem,
        handleKeyDown: foundation.handleKeyDown,
        more,
        onVisibleTabsChange: (visibleState: Map<string, boolean>) => emit('visibleTabsChange', visibleState),
        visibleTabsStyle,
        arrowPosition,
        renderArrow,
        dropdownProps,
      };
      const barSlots = slots.tabBarExtraContent ? { tabBarExtraContent: slots.tabBarExtraContent } : undefined;
      let tabBar: VNodeChild;
      if (slots.renderTabBar) {
        tabBar = slots.renderTabBar({ tabBarProps, DefaultTabBar: TabBar });
      } else if (renderTabBar) {
        tabBar = renderTabBar(tabBarProps, TabBar);
      } else {
        tabBar = h(TabBar, tabBarProps, barSlots);
      }
      const content = keepDOM ? children : getActiveItem(children);
      return h('div', { class: tabWrapperCls, style: attrStyle, ...getDataAttr(restAttrs) }, [
        tabBar,
        h('div', { class: tabContentCls, style: { ...(contentStyle || {}) } }, content.map((c) => (isVNode(c) ? cloneVNode(c) : c))),
      ]);
    };
  },
});
(Tabs as any).TabPane = TabPane;
(Tabs as any).TabItem = TabItem;
(Tabs as any).elementType = 'Tabs';

export { panePickKeys };
export default Tabs;
