import { defineComponent, h, reactive, watch, isVNode, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { isEqual } from 'lodash';
import NavigationFoundation from '@douyinfe/semi-foundation/lib/es/navigation/foundation';
import { strings, cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/navigation/constants';
import '@douyinfe/semi-foundation/lib/es/navigation/navigation.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, flattenChildren, getVNodeElementType, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import SubNav from './SubNav';
import NavItem from './Item';
import NavFooter from './Footer';
import NavHeader from './Header';
import { provideNavContext, type NavContextValue } from './context';
import type { ItemKey } from '@douyinfe/semi-foundation/lib/es/navigation/itemFoundation';

export type Mode = 'vertical' | 'horizontal';

function createAddKeysFn(getKeys: () => ItemKey[], setKeys: (keys: ItemKey[]) => void) {
  return function addKeys(...keys: ItemKey[]) {
    const handleKeys = new Set(getKeys() || []);
    keys.forEach((key) => key !== undefined && key !== null && handleKeys.add(key));
    setKeys(Array.from(handleKeys));
  };
}

function createRemoveKeysFn(getKeys: () => ItemKey[], setKeys: (keys: ItemKey[]) => void) {
  return function removeKeys(...keys: ItemKey[]) {
    const handleKeys = new Set(getKeys() || []);
    keys.forEach((key) => key !== undefined && key !== null && handleKeys.delete(key));
    setKeys(Array.from(handleKeys));
  };
}

function navNodesFromSlots(nodes: any[]): any[] {
  return nodes.map((node) => {
    const nodeProps = { ...(node.props || {}) };
    const kids =
      node.children && typeof node.children === 'object' && typeof (node.children as any).default === 'function'
        ? flattenChildren((node.children as any).default())
        : [];
    return {
      ...nodeProps,
      itemKey: nodeProps.itemKey ?? nodeProps['item-key'],
      items: kids.length ? navNodesFromSlots(kids) : undefined,
      props: nodeProps,
    };
  });
}

export const navProps = {
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  defaultIsCollapsed: { type: Boolean, default: undefined },
  defaultOpenKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
  defaultSelectedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
  subDropdownProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  expandIcon: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  footer: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  header: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  isCollapsed: { type: Boolean, default: undefined },
  items: { type: Array as PropType<any[]>, default: undefined },
  limitIndent: { type: Boolean, default: true },
  mode: { type: String as PropType<Mode>, default: strings.MODE_VERTICAL as Mode },
  multiple: { type: Boolean, default: false },
  openKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  selectedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
  subNavCloseDelay: { type: Number, default: numbers.DEFAULT_SUBNAV_CLOSE_DELAY },
  subNavMotion: { type: [Boolean, Object, Function] as PropType<any>, default: true },
  subNavOpenDelay: { type: Number, default: numbers.DEFAULT_SUBNAV_OPEN_DELAY },
  toggleIconPosition: { type: String, default: 'right' },
  tooltipHideDelay: { type: Number, default: numbers.DEFAULT_TOOLTIP_HIDE_DELAY },
  tooltipShowDelay: { type: Number, default: numbers.DEFAULT_TOOLTIP_SHOW_DELAY },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  renderWrapper: { type: Function as PropType<any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const navEmits = [
  'click',
  'select',
  'deselect',
  'openChange',
  'collapseChange',
  'update:selectedKeys',
  'update:openKeys',
  'update:isCollapsed',
];

const Nav = defineComponent({
  name: 'Nav',
  inheritAttrs: false,
  props: navProps,
  emits: navEmits,
  setup(props, { slots, attrs, emit }) {
    const { locale } = useLocale('Navigation');
    const { state, adapter: baseAdapter, isControlled, propsView } = useBaseComponent(
      props as any,
      {
        isCollapsed: Boolean(undefined),
        openKeys: [] as ItemKey[],
        items: [] as any[],
        itemKeysMap: {} as Record<string, ItemKey[]>,
        selectedKeys: [] as ItemKey[],
      }
    );

    const slotChildren = () => flattenChildren(slots.default?.());
    let cachedNavChildren: any[] = [];

    const adapterGetProps = () => {
      const view = baseAdapter.getProps();
      return new Proxy(view as any, {
        get(t, k) {
          if (k === 'children') return cachedNavChildren;
          return t[k];
        },
      });
    };

    const addSelectedKeys = createAddKeysFn(
      () => state.selectedKeys,
      (keys) => {
        state.selectedKeys = keys;
      }
    );
    const removeSelectedKeys = createRemoveKeysFn(
      () => state.selectedKeys,
      (keys) => {
        state.selectedKeys = keys;
      }
    );
    const addOpenKeys = createAddKeysFn(
      () => state.openKeys,
      (keys) => {
        state.openKeys = keys;
      }
    );
    const removeOpenKeys = createRemoveKeysFn(
      () => state.openKeys,
      (keys) => {
        state.openKeys = keys;
      }
    );

    let foundation: any;
    const adapter = {
      ...baseAdapter,
      getProps: adapterGetProps,
      getProp: (key: string) => (key === 'children' ? cachedNavChildren : baseAdapter.getProp(key)),
      notifySelect: (data: any) => {
        emit('select', data);
        emit('update:selectedKeys', data?.selectedKeys);
      },
      notifyOpenChange: (data: any) => {
        emit('openChange', data);
        emit('update:openKeys', data?.openKeys);
      },
      setIsCollapsed: (isCollapsed: boolean) => {
        state.isCollapsed = isCollapsed;
      },
      notifyCollapseChange: (isCollapsed: boolean) => {
        emit('collapseChange', isCollapsed);
        emit('update:isCollapsed', isCollapsed);
      },
      updateItems: (items: any[]) => {
        state.items = [...items];
      },
      setItemKeysMap: (itemKeysMap: Record<string, ItemKey[]>) => {
        state.itemKeysMap = { ...itemKeysMap };
      },
      addSelectedKeys,
      removeSelectedKeys,
      updateSelectedKeys: (selectedKeys: ItemKey[], includeParentKeys = true) => {
        let willUpdateSelectedKeys = selectedKeys;
        if (includeParentKeys) {
          const parentSelectKeys = foundation.selectLevelZeroParentKeys(null, selectedKeys);
          willUpdateSelectedKeys = Array.from(new Set(selectedKeys.concat(parentSelectKeys)));
        }
        state.selectedKeys = willUpdateSelectedKeys;
      },
      updateOpenKeys: (openKeys: ItemKey[]) => {
        state.openKeys = [...openKeys];
      },
      addOpenKeys,
      removeOpenKeys,
      setItemsChanged: (isChanged: boolean) => {
        baseAdapter.setCache('itemsChanged', isChanged);
      },
    };

    foundation = new (NavigationFoundation as any)(adapter);
    state.isCollapsed = Boolean(isControlled('isCollapsed') ? props.isCollapsed : props.defaultIsCollapsed);
    // React runs foundation.init in the constructor when either `items` or `children` exist;
    // mirror that for the slot (JSX) API so defaultOpenKeys / defaultSelectedKeys work there too.
    let initialized = false;
    const initFromSlots = () => {
      // slot children can only be read inside render; run the constructor init lazily on the first render
      initialized = true;
      if (cachedNavChildren.length) {
        const calcState = foundation.init('constructor');
        if (calcState) Object.assign(state, calcState);
      }
    };
    if (props.items && props.items.length) {
      initialized = true;
      const calcState = foundation.init('constructor');
      if (calcState) Object.assign(state, calcState);
    }

    watch(
      () => props.items,
      () => foundation.init(),
      { deep: true }
    );
    watch(
      () => (propsView as any).isCollapsed,
      (isCollapsed) => {
        if (isControlled('isCollapsed') && isCollapsed !== state.isCollapsed) {
          state.isCollapsed = isCollapsed;
        }
      }
    );
    watch(
      () => [props.selectedKeys, props.openKeys] as const,
      ([selectedKeys, openKeys], prev) => {
        const [prevSelected, prevOpen] = prev || [];
        foundation.handleItemsChange(false);
        if (selectedKeys && !isEqual(prevSelected, selectedKeys)) {
          adapter.updateSelectedKeys(selectedKeys);
          const willOpenKeys = foundation.getWillOpenKeys(state.itemKeysMap);
          adapter.updateOpenKeys(willOpenKeys);
        }
        if (openKeys && !isEqual(prevOpen, openKeys)) {
          adapter.updateOpenKeys(openKeys);
        }
      }
    );
    onBeforeUnmount(() => foundation.destroy());

    const onCollapseChange = () => foundation.handleCollapseChange();

    const renderItems = (items: any[] = [], level = 0): any[] =>
      items.map((item, idx) => {
        if (Array.isArray(item.items) && item.items.length) {
          return h(
            SubNav,
            {
              key: item.itemKey || String(level) + idx,
              ...item,
              level,
              expandIcon: props.expandIcon,
              subDropdownProps: props.subDropdownProps,
            },
            () => renderItems(item.items, level + 1)
          );
        }
        return h(NavItem, { key: item.itemKey || String(level) + idx, ...item, level });
      });

    const context = reactive({} as NavContextValue);
    const syncContext = () => {
      Object.assign(context, {
        subNavCloseDelay: props.subNavCloseDelay,
        subNavOpenDelay: props.subNavOpenDelay,
        subNavMotion: props.subNavMotion,
        tooltipShowDelay: props.tooltipShowDelay,
        tooltipHideDelay: props.tooltipHideDelay,
        openKeys: state.openKeys,
        openKeysIsControlled: isControlled('openKeys') && props.mode === 'vertical' && !state.isCollapsed,
        canUpdateOpenKeys: true,
        selectedKeys: state.selectedKeys,
        selectedKeysIsControlled: isControlled('selectedKeys'),
        isCollapsed: state.isCollapsed,
        onCollapseChange,
        mode: props.mode,
        onSelect: (data: any) => adapter.notifySelect(data),
        onOpenChange: (data: any) => adapter.notifyOpenChange(data),
        updateOpenKeys: adapter.updateOpenKeys,
        addOpenKeys,
        removeOpenKeys,
        updateSelectedKeys: adapter.updateSelectedKeys,
        addSelectedKeys,
        removeSelectedKeys,
        onClick: (...args: any[]) => emit('click', ...args),
        locale: locale.value,
        prefixCls: props.prefixCls,
        toggleIconPosition: props.toggleIconPosition,
        limitIndent: props.limitIndent,
        renderWrapper: props.renderWrapper,
        getPopupContainer: props.getPopupContainer,
        isInSubNav: false,
      } as NavContextValue);
    };
    syncContext();
    watch(
      () => [
        state.openKeys,
        state.selectedKeys,
        state.isCollapsed,
        props.mode,
        props.subNavMotion,
        props.toggleIconPosition,
        props.limitIndent,
        locale.value,
      ],
      syncContext,
      { flush: 'sync' }
    );
    provideNavContext(context);

    return () => {
      cachedNavChildren = navNodesFromSlots(slotChildren());
      if (!initialized) initFromSlots();
      if (!(props.items && props.items.length) && cachedNavChildren.length) {
        // keep the parent-key map in sync when slot children change (React re-inits on children change)
        const keysMap = (NavigationFoundation as any).buildItemKeysMap(cachedNavChildren);
        if (!isEqual(keysMap, state.itemKeysMap)) state.itemKeysMap = keysMap;
      }
      syncContext();
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const { mode, prefixCls, bodyStyle, footer, header, className, style } = props;
      const { selectedKeys: _sk, openKeys: _ok, items, isCollapsed } = state;
      const children = [...slotChildren()];
      const footers: any[] = [];
      const headers: any[] = [];

      const headerNode = slots.header ? slots.header() : header;
      const footerNode = slots.footer ? slots.footer() : footer;
      if (isVNode(footerNode) || Array.isArray(footerNode)) {
        footers.push(h(NavFooter, { key: 0 }, () => footerNode));
      } else if (footerNode && typeof footerNode === 'object') {
        footers.push(h(NavFooter, { key: 0, ...(footerNode as any) }));
      } else if (footerNode) {
        footers.push(h(NavFooter, { key: 0 }, () => normalizeNode(footerNode)));
      }
      if (isVNode(headerNode) || Array.isArray(headerNode)) {
        headers.push(h(NavHeader, { key: 0 }, () => headerNode));
      } else if (headerNode && typeof headerNode === 'object') {
        headers.push(h(NavHeader, { key: 0, ...(headerNode as any) }));
      } else if (headerNode) {
        headers.push(h(NavHeader, { key: 0 }, () => normalizeNode(headerNode)));
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const type = getVNodeElementType(child);
        if (type === 'NavFooter') {
          footers.push(child);
          children.splice(i, 1);
          i--;
        } else if (type === 'NavHeader') {
          headers.push(child);
          children.splice(i, 1);
          i--;
        }
      }

      const finalCls = cls(prefixCls, className, attrClass, {
        [`${prefixCls}-collapsed`]: isCollapsed,
        [`${prefixCls}-horizontal`]: mode === 'horizontal',
        [`${prefixCls}-vertical`]: mode === 'vertical',
      });
      const headerListOuterCls = cls(`${prefixCls}-header-list-outer`, {
        [`${prefixCls}-header-list-outer-collapsed`]: isCollapsed,
      });

      return h('div', { class: finalCls, style: [style, attrStyle], ...getDataAttr(rest) }, [
        h('div', { class: `${prefixCls}-inner` }, [
          h('div', { class: headerListOuterCls }, [
            headers,
            h('div', { style: bodyStyle, class: `${prefixCls}-list-wrapper` }, [
              h('ul', { role: 'menu', 'aria-orientation': mode, class: `${prefixCls}-list` }, [renderItems(items), children]),
            ]),
          ]),
          footers,
        ]),
      ]);
    };
  },
});

(Nav as any).Sub = SubNav;
(Nav as any).Item = NavItem;
(Nav as any).Header = NavHeader;
(Nav as any).Footer = NavFooter;
(Nav as any).elementType = 'Nav';
export default Nav;
