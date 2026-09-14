import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import _times from 'lodash/times';
import _findIndex from 'lodash/findIndex';
import _map from 'lodash/map';
import _find from 'lodash/find';
import _throttle from 'lodash/throttle';
import _debounce from 'lodash/debounce';
import classnames from 'classnames';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/scrollList/constants';
import ItemFoundation from '@douyinfe/semi-foundation/lib/es/scrollList/itemFoundation';
import animatedScrollTo from '@douyinfe/semi-foundation/lib/es/scrollList/scrollTo';
import isElement from '@douyinfe/semi-foundation/lib/es/utils/isElement';
import { useBaseComponent } from '../_base/useBaseComponent';

const msPerFrame = 1000 / 60;
const blankReg = /^\s*$/;
const wheelMode = 'wheel';

export type ScrollItemMode = (typeof strings.MODE)[number];

export interface ScrollItemItem {
  [x: string]: any;
  transform?: (value: any, text: string) => string;
  value: any;
  text?: string;
  disabled?: boolean;
}

export interface ScrollItemSelectedItem extends ScrollItemItem {
  type?: string | number;
  index: number;
}

export const scrollItemProps = {
  mode: { type: String as PropType<ScrollItemMode>, default: wheelMode },
  cycled: { type: Boolean, default: false },
  list: { type: Array as PropType<ScrollItemItem[]>, default: () => [] },
  selectedIndex: { type: Number, default: 0 },
  transform: { type: Function as PropType<(value: any, text: string) => string>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  motion: { type: [Boolean, Function] as PropType<boolean | ((...args: any[]) => any)>, default: true },
  type: { type: [String, Number] as PropType<string | number>, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

export const scrollItemEmits = ['select'];

const ScrollItem = defineComponent({
  name: 'ScrollItem',
  inheritAttrs: false,
  props: scrollItemProps,
  emits: scrollItemEmits,
  setup(props, { attrs, emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      prependCount: 0,
      appendCount: 0,
    });

    // DOM caches (React instance fields)
    let selectedNode: HTMLElement | null = null;
    let willSelectNode: HTMLElement | null = null;
    let scrollAnimation: any = null;
    const list = ref<HTMLElement | null>(null);
    const wrapper = ref<HTMLElement | null>(null);
    const selector = ref<HTMLElement | null>(null);

    const isWheelMode = () => props.mode === wheelMode;
    const isDisabledData = (data: any) => data && typeof data === 'object' && data.disabled;

    const indexIsSame = (index1: number, index2: number) => {
      const { list: data } = props;
      if (data.length) {
        return index1 % data.length === index2 % data.length;
      }
      return undefined;
    };

    const isDisabledIndex = (index: number) => {
      const { list: data } = props;
      if (Array.isArray(data) && data.length && index > -1) {
        const size = data.length;
        const indexInData = index % size;
        return isDisabledData(data[indexInData]);
      }
      return false;
    };

    const isDisabledNode = (node: any) => {
      const listWrapper = list.value;
      if (isElement(node) && isElement(listWrapper)) {
        const index = _findIndex(listWrapper!.children as any, (child: any) => child === node);
        return isDisabledIndex(index);
      }
      return false;
    };

    const addClassToNode = (node?: HTMLElement | null, selectedCls: string = cssClasses.SELECTED) => {
      const listWrapper = list.value;
      const target = node || selectedNode;
      if (isElement(target) && isElement(listWrapper)) {
        const { children } = listWrapper!;
        const reg = new RegExp(`\\s*${selectedCls}\\s*`, 'g');
        _map(children as any, (n: any) => {
          n.className = n.className && n.className.replace(reg, ' ');
          if (blankReg.test(n.className)) {
            n.className = '';
          }
        });
        if (target!.className && !blankReg.test(target!.className)) {
          target!.className += ` ${selectedCls}`;
        } else {
          target!.className = selectedCls;
        }
      }
    };

    const getIndexByNode = (node: any) => _findIndex((list.value?.children || []) as any, (n: any) => n === node);
    const getNodeByIndex = (index: number): HTMLElement | undefined => {
      const children = (list.value?.children || []) as any;
      if (index > -1) {
        return _find(children, (_n: any, idx: number) => idx === index) as HTMLElement | undefined;
      }
      return _find(children, (child: any) => !isDisabledNode(child)) as HTMLElement | undefined;
    };

    const getItmHeight = (itm: any) => (itm && itm.offsetHeight) || numbers.DEFAULT_ITEM_HEIGHT;

    const scrollToPos = (targetTop: number, duration: number = numbers.DEFAULT_SCROLL_DURATION) => {
      const wrapperEl = wrapper.value;
      if (!wrapperEl) return;
      if (duration && props.motion) {
        if (scrollAnimation) {
          scrollAnimation.destroy();
        }
        if (wrapperEl.scrollTop === targetTop) {
          if (isWheelMode()) {
            const nodeInfo = foundation.getNearestNodeInfo(list.value, selector.value);
            nodeInfo && addClassToNode(nodeInfo.nearestNode);
          }
        } else {
          scrollAnimation = animatedScrollTo(wrapperEl, targetTop, duration);
          scrollAnimation.on('rest', () => {
            if (isWheelMode()) {
              const nodeInfo = foundation.getNearestNodeInfo(list.value, selector.value);
              nodeInfo && addClassToNode(nodeInfo.nearestNode);
            }
          });
          scrollAnimation.start();
        }
      } else {
        wrapperEl.scrollTop = targetTop;
      }
    };

    const scrollToNode = (node: any, duration?: number) => {
      const wrapperEl = wrapper.value;
      if (!wrapperEl || !list.value) return;
      const wrapperHeight = wrapperEl.offsetHeight;
      const itemHeight = getItmHeight(node);
      const targetTop = ((node && node.offsetTop) || (list.value.children.length * itemHeight) / 2) - (wrapperHeight - itemHeight) / 2;
      scrollToPos(targetTop, duration as number);
    };

    const scrollToIndex = (_selectedIndex?: number, duration?: number) => {
      duration = typeof duration === 'number' ? duration : numbers.DEFAULT_SCROLL_DURATION;
      scrollToNode(selectedNode, duration);
    };

    const scrollToCenter = (node?: Element | null, scrollWrapper?: Element | null, duration?: number) => {
      const target = (node || selectedNode) as HTMLElement | null;
      const wrap = (scrollWrapper || wrapper.value) as HTMLElement | null;
      if (isElement(target) && isElement(wrap)) {
        const scrollRect = wrap!.getBoundingClientRect();
        const selectedRect = target!.getBoundingClientRect();
        const targetTop = wrap!.scrollTop + (selectedRect.top - (scrollRect.top + scrollRect.height / 2 - selectedRect.height / 2));
        scrollToPos(targetTop, typeof duration === 'number' ? duration : numbers.DEFAULT_SCROLL_DURATION);
      }
    };

    const adapter = {
      ...baseAdapter,
      setPrependCount: (prependCount: number) => {
        state.prependCount = prependCount;
      },
      setAppendCount: (appendCount: number) => {
        state.appendCount = appendCount;
      },
      isDisabledIndex,
      setSelectedNode: (node: HTMLElement) => {
        if (node) willSelectNode = node;
      },
      notifySelectItem: (data: ScrollItemSelectedItem) => emit('select', data),
      scrollToCenter,
    };
    const foundation = new (ItemFoundation as any)(adapter);

    const throttledAdjustList = _throttle((_e: any, nearestNode: any) => {
      foundation.adjustInfiniteList(list.value, wrapper.value, nearestNode);
    }, msPerFrame);
    const debouncedSelect = _debounce((_e: any, nearestNode: any) => {
      if (nearestNode) selectedNode = nearestNode;
      foundation.selectNode(nearestNode, list.value);
    }, msPerFrame * 2);

    const scrollToSelectItem = (e: Event) => {
      const info = foundation.getNearestNodeInfo(list.value, selector.value);
      if (!info) return;
      const { nearestNode } = info;
      if (props.cycled) {
        throttledAdjustList(e, nearestNode);
      }
      debouncedSelect(e, nearestNode);
    };

    const clickToSelectItem = (e: MouseEvent) => {
      e && e.stopImmediatePropagation && e.stopImmediatePropagation();
      const res = foundation.getTargetNode(e, list.value);
      if (!res) return;
      const { targetNode: node, infoInList } = res;
      if (node && infoInList && !infoInList.disabled) {
        debouncedSelect(null, node);
      }
    };

    const getNodeByOffset = (refNode: any, offset: number) => {
      const { list: data } = props;
      if (isElement(refNode) && isElement(list.value) && typeof offset === 'number' && Array.isArray(data) && data.length) {
        offset = offset % data.length;
        const refIndex = getIndexByNode(refNode);
        let targetIndex = refIndex + offset;
        while (targetIndex < 0) {
          targetIndex += data.length;
        }
        if (offset) {
          return getNodeByIndex(targetIndex);
        }
      }
      return refNode;
    };

    onMounted(() => {
      foundation.init();
      const { mode, cycled, selectedIndex } = props;
      const node = getNodeByIndex(typeof selectedIndex === 'number' && selectedIndex > -1 ? selectedIndex : 0) || null;
      selectedNode = node;
      willSelectNode = node;
      if (mode === wheelMode && cycled) {
        foundation.initWheelList(list.value, wrapper.value, () => {
          scrollToNode(node, 0);
        });
      } else {
        scrollToNode(node, 0);
      }
    });

    onBeforeUnmount(() => {
      if (props.cycled) {
        throttledAdjustList.cancel();
        debouncedSelect.cancel();
      }
      if (scrollAnimation) {
        scrollAnimation.destroy();
        scrollAnimation = null;
      }
      foundation.destroy();
    });

    // componentDidUpdate: smooth scroll to selected option
    watch(
      () => props.selectedIndex,
      (selectedIndex, prevSelectedIndex) => {
        if (prevSelectedIndex !== selectedIndex) {
          const willSelectIndex = getIndexByNode(willSelectNode);
          if (!indexIsSame(willSelectIndex, selectedIndex)) {
            const newSelectedNode = getNodeByOffset(selectedNode, selectedIndex - (prevSelectedIndex as number));
            if (newSelectedNode) willSelectNode = newSelectedNode;
          }
          if (willSelectNode) selectedNode = willSelectNode;
          scrollToIndex(selectedIndex);
        }
      },
      { flush: 'post' }
    );

    const renderItemList = (prefixKey = '') => {
      const { selectedIndex, mode, transform: commonTrans, list: data } = props;
      return data.map((item, index) => {
        const { transform: itemTrans } = item;
        const transform = typeof itemTrans === 'function' ? itemTrans : commonTrans;
        const selected = selectedIndex === index;
        const cls = classnames({
          [`${cssClasses.PREFIX}-item-sel`]: selected && mode !== wheelMode,
          [`${cssClasses.PREFIX}-item-disabled`]: Boolean(item.disabled),
        });
        let text: any = '';
        if (selected) {
          if (typeof transform === 'function') {
            text = transform(item.value, item.text as string);
          } else {
            text = item.text == null ? item.value : item.text;
          }
        } else {
          text = item.text == null ? item.value : item.text;
        }
        const events: Record<string, any> = {};
        if (!isWheelMode() && !item.disabled) {
          events.onClick = () => foundation.selectIndex(index, list.value);
        }
        return h(
          'li',
          {
            key: prefixKey + index,
            ...events,
            class: cls,
            role: 'option',
            'aria-disabled': item.disabled,
          },
          text
        );
      });
    };

    const renderNormalList = () => {
      const { className, style } = props;
      const inner = renderItemList();
      const wrapperCls = classnames(`${cssClasses.PREFIX}-item`, className, attrs.class as any);
      return h('div', { style: [style, attrs.style as any], class: wrapperCls, ref: wrapper }, [
        h(
          'ul',
          {
            role: 'listbox',
            'aria-multiselectable': false,
            'aria-label': props.ariaLabel ?? (attrs as any)['aria-label'],
            ref: list,
          },
          inner
        ),
      ]);
    };

    const renderInfiniteList = () => {
      const { cycled, className, style } = props;
      const { prependCount, appendCount } = state;
      const prependList = _times(prependCount).reduce((arr: any[], num) => {
        const items = renderItemList(`pre_${num}_`);
        arr.unshift(...items);
        return arr;
      }, []);
      const appendList = _times(appendCount).reduce((arr: any[], num) => {
        const items = renderItemList(`app_${num}_`);
        arr.push(...items);
        return arr;
      }, []);
      const inner = renderItemList();
      const listWrapperCls = classnames(`${cssClasses.PREFIX}-list-outer`, {
        [`${cssClasses.PREFIX}-list-outer-nocycle`]: !cycled,
      });
      const wrapperCls = classnames(`${cssClasses.PREFIX}-item-wheel`, className, attrs.class as any);
      const selectorCls = classnames(`${cssClasses.PREFIX}-selector`);
      const preShadeCls = classnames(`${cssClasses.PREFIX}-shade`, `${cssClasses.PREFIX}-shade-pre`);
      const postShadeCls = classnames(`${cssClasses.PREFIX}-shade`, `${cssClasses.PREFIX}-shade-post`);
      return h('div', { class: wrapperCls, style: [style, attrs.style as any] }, [
        h('div', { class: preShadeCls }),
        h('div', { class: selectorCls, ref: selector }),
        h('div', { class: postShadeCls }),
        h('div', { class: listWrapperCls, ref: wrapper, onScroll: scrollToSelectItem }, [
          h(
            'ul',
            {
              role: 'listbox',
              'aria-label': props.ariaLabel ?? (attrs as any)['aria-label'],
              'aria-multiselectable': false,
              ref: list,
              onClick: clickToSelectItem,
            },
            [...prependList, ...inner, ...appendList]
          ),
        ]),
      ]);
    };

    expose({
      scrollToIndex,
      scrollToNode,
      scrollToPos,
      scrollToCenter,
      getIndexByNode,
      getNodeByIndex,
      foundation,
    });

    return () => (isWheelMode() ? renderInfiniteList() : renderNormalList());
  },
});

(ScrollItem as any).elementType = 'ScrollItem';
export default ScrollItem;
