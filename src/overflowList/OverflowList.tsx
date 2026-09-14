import { defineComponent, h, watch, onMounted, onUpdated, onBeforeUnmount, nextTick, cloneVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _get from 'lodash/get';
import _isFunction from 'lodash/isFunction';
import _isEqual from 'lodash/isEqual';
import copy from 'fast-copy';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/overflowList/constants';
import OverflowListFoundation from '@douyinfe/semi-foundation/lib/es/overflowList/foundation';
import '@douyinfe/semi-foundation/lib/es/overflowList/overflowList.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren } from '../_utils';

const prefixCls = cssClasses.PREFIX;
const Boundary = strings.BOUNDARY_MAP;
const OverflowDirection = strings.OVERFLOW_DIR;
const RenderMode = strings.MODE_MAP;

export type OverflowListRenderMode = (typeof strings.MODE_SET)[number];
export type OverflowListBoundary = (typeof strings.BOUNDARY_SET)[number];
export type OverflowListDirection = (typeof strings.POSITION_SET)[number];
export type OverflowItem = Record<string, any>;
export type OverflowRenderDirection = 'both' | 'start' | 'end';

export const overflowListProps = {
  className: { type: String, default: undefined },
  collapseFrom: { type: String as PropType<OverflowListBoundary>, default: 'end' },
  direction: { type: String as PropType<OverflowListDirection>, default: undefined },
  items: { type: Array as PropType<OverflowItem[]>, default: () => [] },
  itemKey: { type: [String, Function] as PropType<string | ((item: OverflowItem) => string | number)>, default: undefined },
  minVisibleItems: { type: Number, default: 0 },
  overflowRenderer: { type: Function as PropType<(overflowItems: any) => VNodeChild>, default: () => null },
  renderMode: { type: String as PropType<OverflowListRenderMode>, default: 'collapse' },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  threshold: { type: Number, default: 0.75 },
  visibleItemRenderer: { type: Function as PropType<(item: OverflowItem, index: number) => VNodeChild>, default: () => null },
  wrapperClassName: { type: String, default: undefined },
  wrapperStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  collapseMask: { type: Object as PropType<Record<string, any>>, default: undefined },
  overflowRenderDirection: { type: String as PropType<OverflowRenderDirection>, default: 'both' },
};

export const overflowListEmits = ['overflow', 'intersect', 'visibleStateChange'];

interface OverflowListState {
  direction: number;
  lastOverflowCount: number;
  overflow: OverflowItem[];
  visible: OverflowItem[];
  containerWidth: number;
  visibleState: Map<string, boolean>;
  itemSizeMap: Map<string, number>;
  overflowStatus: 'calculating' | 'overflowed' | 'normal';
  pivot: number;
  overflowWidth: number;
  maxCount: number;
  scrollOverflow: [OverflowItem[], OverflowItem[]];
  isScrollOverflowCalculating: boolean;
}

const OverflowList = defineComponent({
  name: 'OverflowList',
  inheritAttrs: false,
  props: overflowListProps,
  emits: overflowListEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, OverflowListState>(props as any, {
      direction: OverflowDirection.GROW,
      lastOverflowCount: 0,
      overflow: [],
      visible: [],
      containerWidth: 0,
      visibleState: new Map(),
      itemSizeMap: new Map(),
      overflowStatus: 'calculating',
      pivot: -1,
      overflowWidth: 0,
      maxCount: 0,
      scrollOverflow: [[], []],
      isScrollOverflowCalculating: true,
    });

    // non reactive caches (React instance fields)
    let itemSizeMap = new Map<string | number, number>();
    let itemRefs: Record<string, HTMLElement | null> = {};
    let scroller: HTMLElement | null = null;
    let rootEl: HTMLElement | null = null;
    let overflowEl: HTMLElement | null = null;
    let containerObserver: ResizeObserver | null = null;
    let itemObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let cachedIntersectKeys: string[] = [];
    const itemElMeta = new Map<Element, { item: OverflowItem; idx: number }>();
    const observedItemEls = new Set<Element>();
    let overflowObserved: Element | null = null;
    let mounted = false;

    const hasRO = () => typeof ResizeObserver !== 'undefined';
    const hasIO = () => typeof IntersectionObserver !== 'undefined';

    const isScrollMode = () => props.renderMode === RenderMode.SCROLL;

    const getItemKey = (item: OverflowItem, defaultKey: any) => {
      const { itemKey } = props;
      if (_isFunction(itemKey)) {
        return itemKey(item);
      }
      return _get(item, (itemKey as string) || 'key', defaultKey);
    };

    /**
     * React re-runs componentDidUpdate on every setState (even with an unchanged value);
     * Vue only re-renders on actual changes, so the collapse calculation is scheduled explicitly.
     */
    let calcScheduled = false;
    const requestCalc = () => {
      state.overflowStatus = 'calculating';
      if (calcScheduled) return;
      calcScheduled = true;
      nextTick(() => {
        calcScheduled = false;
        if (!mounted || isScrollMode() || state.overflowStatus !== 'calculating') return;
        foundation.handleCollapseOverflow();
      });
    };

    const adapter = {
      ...baseAdapter,
      updateVisibleState: (visibleState: Map<string, boolean>) => {
        state.visibleState = visibleState;
        nextTick(() => emit('visibleStateChange', visibleState));
      },
      updateStates: (states: Partial<OverflowListState>) => {
        Object.assign(state, states);
      },
      notifyIntersect: (res: any) => {
        emit('intersect', res);
      },
      getItemSizeMap: () => itemSizeMap,
    };
    const foundation = new (OverflowListFoundation as any)(adapter);
    // React passes onOverflow through props; wire it to the emit
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onOverflow') return (overflow: any) => emit('overflow', overflow);
        return Reflect.get(target, key);
      },
    });
    foundation._adapter.getProps = () => propsProxy;
    foundation._adapter.getProp = (key: string) => propsProxy[key];

    /** getDerivedStateFromProps for `items` / `style` */
    const deriveState = (itemsChanged: boolean) => {
      state.direction = OverflowDirection.GROW;
      state.lastOverflowCount = 0;
      state.maxCount = 0;
      state.isScrollOverflowCalculating = true;
      if (itemsChanged && isScrollMode() && Array.isArray(state.scrollOverflow)) {
        const nextItems = props.items || [];
        const nextItemMap = new Map<any, OverflowItem>();
        nextItems.forEach((it, idx) => {
          nextItemMap.set(getItemKey(it, idx), it);
        });
        const mapList = (list: OverflowItem[] = []) => list.map((it, idx) => nextItemMap.get(getItemKey(it, idx))).filter(Boolean) as OverflowItem[];
        const [cachedStart, cachedEnd] = state.scrollOverflow;
        state.scrollOverflow = [mapList(cachedStart), mapList(cachedEnd)];
      }
      if (isScrollMode()) {
        state.visible = props.items;
        state.overflow = [];
      } else {
        let maxCount = props.items.length;
        if (Math.floor(state.containerWidth / numbers.MINIMUM_HTML_ELEMENT_WIDTH) !== 0) {
          maxCount = Math.min(maxCount, Math.floor(state.containerWidth / numbers.MINIMUM_HTML_ELEMENT_WIDTH));
        }
        const isCollapseFromStart = props.collapseFrom === Boundary.START;
        const visible = isCollapseFromStart ? copy(props.items).reverse().slice(0, maxCount) : props.items.slice(0, maxCount);
        const overflow = isCollapseFromStart ? copy(props.items).reverse().slice(maxCount) : props.items.slice(maxCount);
        state.visible = visible;
        state.overflow = overflow;
        state.maxCount = maxCount;
      }
      requestCalc();
    };
    deriveState(true);

    let prevItems = props.items;
    let prevStyle = props.style;
    watch(
      () => [props.items, props.style, props.renderMode, props.collapseFrom],
      () => {
        const itemsChanged = !_isEqual(prevItems, props.items);
        const styleChanged = !_isEqual(prevStyle, props.style);
        // componentDidUpdate: key change resets caches
        const prevKeys = (prevItems || []).map((item, index) => getItemKey(item, index));
        const nowKeys = (props.items || []).map((item, index) => getItemKey(item, index));
        if (!_isEqual(prevKeys, nowKeys)) {
          itemRefs = {};
          itemSizeMap = new Map();
          state.visibleState = new Map();
          state.isScrollOverflowCalculating = true;
        }
        prevItems = props.items;
        prevStyle = props.style;
        if (itemsChanged || styleChanged) {
          deriveState(itemsChanged);
        }
      },
      { deep: true }
    );

    const resize = (entries: ResizeObserverEntry[] = []) => {
      const containerWidth = entries[0]?.target.clientWidth;
      state.containerWidth = containerWidth as number;
      requestCalc();
    };

    const onItemResize = (entry: ResizeObserverEntry, item: OverflowItem, idx: number) => {
      const key = getItemKey(item, idx);
      const width = itemSizeMap.get(key);
      if (!width) {
        itemSizeMap.set(key, entry.target.clientWidth);
      } else if (width !== entry.target.clientWidth) {
        itemSizeMap.set(key, entry.target.clientWidth);
        requestCalc();
      }
      const { maxCount } = state;
      if (itemSizeMap.size === maxCount) {
        requestCalc();
      }
    };

    const handleItemEntries = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === overflowEl) {
          state.overflowWidth = entry.target.clientWidth;
          requestCalc();
          continue;
        }
        const meta = itemElMeta.get(entry.target);
        if (meta) onItemResize(entry, meta.item, meta.idx);
      }
    };

    const ensureItemObserver = () => {
      if (!itemObserver && hasRO()) {
        itemObserver = new ResizeObserver(handleItemEntries);
      }
      return itemObserver;
    };

    const syncObservers = () => {
      if (isScrollMode()) return;
      const observer = ensureItemObserver();
      if (!observer) return;
      // drop elements that left the DOM
      for (const el of Array.from(itemElMeta.keys())) {
        if (!rootEl || !rootEl.contains(el)) itemElMeta.delete(el);
      }
      // items
      for (const el of Array.from(observedItemEls)) {
        if (!itemElMeta.has(el)) {
          observer.unobserve(el);
          observedItemEls.delete(el);
        }
      }
      for (const el of itemElMeta.keys()) {
        if (!observedItemEls.has(el)) {
          observer.observe(el);
          observedItemEls.add(el);
        }
      }
      // overflow container
      if (overflowObserved !== overflowEl) {
        if (overflowObserved) observer.unobserve(overflowObserved);
        overflowObserved = overflowEl;
        if (overflowEl) observer.observe(overflowEl);
      }
    };

    const syncIntersectionObserver = () => {
      if (!isScrollMode() || !hasIO()) return;
      const keys = Object.keys(itemRefs).filter((k) => itemRefs[k]);
      if (!intersectionObserver) {
        intersectionObserver = new IntersectionObserver((entries) => foundation.handleIntersect(entries), {
          root: scroller,
          threshold: props.threshold,
          rootMargin: '0px',
        });
        cachedIntersectKeys = [];
      }
      if (!keys.length) {
        intersectionObserver.disconnect();
        cachedIntersectKeys = [];
        return;
      }
      if (!_isEqual(cachedIntersectKeys, keys)) {
        intersectionObserver.disconnect();
        keys.forEach((key) => {
          const node = itemRefs[key];
          if (node && node instanceof Element) intersectionObserver!.observe(node);
        });
        cachedIntersectKeys = keys;
      }
    };

    onMounted(() => {
      mounted = true;
      if (!isScrollMode() && hasRO() && rootEl) {
        containerObserver = new ResizeObserver(resize);
        containerObserver.observe(rootEl);
      }
      syncObservers();
      syncIntersectionObserver();
      if (!isScrollMode() && state.overflowStatus === 'calculating') {
        foundation.handleCollapseOverflow();
      }
    });

    onUpdated(() => {
      syncObservers();
      syncIntersectionObserver();
    });

    onBeforeUnmount(() => {
      mounted = false;
      containerObserver?.disconnect();
      containerObserver = null;
      itemObserver?.disconnect();
      itemObserver = null;
      intersectionObserver?.disconnect();
      intersectionObserver = null;
      observedItemEls.clear();
      itemElMeta.clear();
    });

    const renderOverflow = (): VNodeChild => {
      const overflow = foundation.getOverflowItem();
      if (slots.overflow) return slots.overflow(overflow);
      return props.overflowRenderer(overflow);
    };

    const renderVisibleItem = (item: OverflowItem, idx: number): VNodeChild => {
      if (slots.item) return slots.item({ item, index: idx });
      return props.visibleItemRenderer(item, idx);
    };

    const setItemEl = (item: OverflowItem, idx: number, el: any) => {
      if (el) itemElMeta.set(el, { item, idx });
    };

    const renderItemList = () => {
      const { className, wrapperClassName, wrapperStyle, style, renderMode, collapseFrom } = props;
      const { visible, overflowStatus } = state;
      let overflow: any = renderOverflow();
      if (!isScrollMode()) {
        const nodes = flattenChildren(overflow as any);
        if (nodes.length) {
          overflow = h(
            'div',
            {
              class: `${prefixCls}-overflow`,
              ref: (el: any) => {
                overflowEl = el || null;
              },
            },
            nodes.map((n) => cloneVNode(n))
          );
        } else {
          overflow = null;
          overflowEl = null;
        }
      }
      let inner: VNodeChild[];
      if (renderMode === RenderMode.SCROLL) {
        const overflowNodes = Array.isArray(overflow) ? overflow : flattenChildren(overflow);
        const list: VNodeChild[] = [
          h(
            'div',
            {
              class: cls(wrapperClassName, `${prefixCls}-scroll-wrapper`),
              ref: (el: any) => {
                scroller = el || null;
              },
              style: { ...wrapperStyle },
              key: `${prefixCls}-scroll-wrapper`,
            },
            visible.map((item, idx) => {
              const rendered = flattenChildren(renderVisibleItem(item, idx) as any)[0];
              if (!rendered) return null;
              const key = rendered.key !== null && rendered.key !== undefined ? rendered.key : getItemKey(item, idx);
              return cloneVNode(
                rendered,
                {
                  ref: (node: any) => {
                    const dom = node && node.$el ? node.$el : node;
                    if (dom) itemRefs[String(key)] = dom;
                    else delete itemRefs[String(key)];
                  },
                  'data-scrollkey': `${key}`,
                  key,
                } as any,
                true
              );
            })
          ),
        ];
        if (props.overflowRenderDirection === 'both') {
          list.unshift(overflowNodes[0]);
          list.push(overflowNodes[1]);
        } else if (props.overflowRenderDirection === 'start') {
          list.unshift(overflowNodes[1]);
          list.unshift(overflowNodes[0]);
        } else {
          list.push(overflowNodes[0]);
          list.push(overflowNodes[1]);
        }
        inner = list;
      } else {
        inner = [
          collapseFrom === Boundary.START ? overflow : null,
          ...visible.map((item, idx) => {
            const key = getItemKey(item, idx);
            const element = renderVisibleItem(item, idx);
            return h(
              'div',
              {
                key: key ?? idx,
                class: `${prefixCls}-item`,
                ref: (el: any) => setItemEl(item, idx, el),
              },
              flattenChildren(element as any).map((n) => cloneVNode(n))
            );
          }),
          collapseFrom === Boundary.END ? overflow : null,
        ];
      }
      return h(
        'div',
        {
          class: cls(`${prefixCls}`, className, attrs.class as any),
          style: [
            style,
            attrs.style as any,
            renderMode === RenderMode.COLLAPSE
              ? {
                  maxWidth: '100%',
                  visibility: overflowStatus === 'calculating' && state.pivot < 0 ? 'hidden' : 'visible',
                }
              : null,
          ],
          ref: (el: any) => {
            rootEl = el || null;
          },
        },
        inner
      );
    };

    expose({ foundation, getOverflowItem: () => foundation.getOverflowItem() });

    return () => renderItemList();
  },
});
(OverflowList as any).elementType = 'OverflowList';
(OverflowList as any).__SemiComponentName__ = 'OverflowList';

export default OverflowList;
