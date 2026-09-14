import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import CollapsibleFoundation from '@douyinfe/semi-foundation/lib/es/collapsible/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/collapsible/constants';
import '@douyinfe/semi-foundation/lib/es/collapsible/collapsible.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';

export const collapsibleProps = {
  motion: { type: Boolean, default: true },
  isOpen: { type: Boolean, default: false },
  duration: { type: Number, default: 250 },
  keepDOM: { type: Boolean, default: false },
  lazyRender: { type: Boolean, default: false },
  collapseHeight: { type: Number, default: 0 },
  collapseHeightAdaptive: { type: Boolean, default: false },
  reCalcKey: { type: [Number, String] as PropType<number | string>, default: undefined },
  id: { type: String, default: undefined },
  fade: { type: Boolean, default: false },
};

export interface CollapsibleEntryInfo {
  isShown: boolean;
  height: number;
}

export const getEntryInfo = (entry: ResizeObserverEntry): CollapsibleEntryInfo => {
  // judge whether parent or self display none
  let inRenderTree: boolean;
  if (entry.borderBoxSize) {
    inRenderTree = !(entry.borderBoxSize[0].blockSize === 0 && entry.borderBoxSize[0].inlineSize === 0);
  } else {
    inRenderTree = !(entry.contentRect.height === 0 && entry.contentRect.width === 0);
  }
  let height = 0;
  if (entry.borderBoxSize) {
    height = Math.ceil(entry.borderBoxSize[0].blockSize);
  } else {
    const target = entry.target as HTMLElement;
    height = target.clientHeight;
  }
  return { isShown: inRenderTree, height };
};

const Collapsible = defineComponent({
  name: 'Collapsible',
  inheritAttrs: false,
  props: collapsibleProps,
  emits: ['motionEnd'],
  setup(props, { slots, attrs, emit }) {
    const domRef = ref<HTMLDivElement | null>(null);
    let hasBeenRendered = false;
    let resizeObserver: ResizeObserver | null = null;

    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      domInRenderTree: false,
      domHeight: 0,
      visible: props.isOpen,
      isTransitioning: false,
      cacheIsOpen: props.isOpen,
    });

    const adapter = {
      ...baseAdapter,
      setDOMInRenderTree: (domInRenderTree: boolean) => {
        if (state.domInRenderTree !== domInRenderTree) state.domInRenderTree = domInRenderTree;
      },
      setDOMHeight: (domHeight: number) => {
        if (state.domHeight !== domHeight) state.domHeight = domHeight;
      },
      setVisible: (visible: boolean) => {
        if (state.visible !== visible) state.visible = visible;
      },
      setIsTransitioning: (isTransitioning: boolean) => {
        if (state.isTransitioning !== isTransitioning) state.isTransitioning = isTransitioning;
      },
    };
    const foundation = new (CollapsibleFoundation as any)(adapter);

    const handleResize = (entryList: ResizeObserverEntry[]) => {
      const entry = entryList[0];
      if (entry) {
        const entryInfo = getEntryInfo(entry);
        foundation.updateDOMHeight(entryInfo.height);
        foundation.updateDOMInRenderTree(entryInfo.isShown);
      }
    };

    const isChildrenInRenderTree = () => {
      if (domRef.value) {
        return domRef.value.offsetHeight > 0;
      }
      return false;
    };

    onMounted(() => {
      foundation.init();
      if (typeof ResizeObserver !== 'undefined' && domRef.value) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(domRef.value);
      }
      const domInRenderTree = isChildrenInRenderTree();
      foundation.updateDOMInRenderTree(domInRenderTree);
      if (domInRenderTree && domRef.value) {
        foundation.updateDOMHeight(domRef.value.scrollHeight);
      }
    });

    // getDerivedStateFromProps
    watch(
      () => props.isOpen,
      (isOpen) => {
        const isOpenChanged = isOpen !== state.cacheIsOpen;
        if (isOpenChanged) {
          if (isOpen || !props.motion) {
            state.visible = isOpen;
          }
        }
        if (props.motion && isOpenChanged) {
          state.isTransitioning = true;
        }
        state.cacheIsOpen = isOpen;
      }
    );

    // componentDidUpdate
    watch(
      () => props.reCalcKey,
      () => {
        if (domRef.value) foundation.updateDOMHeight(domRef.value.scrollHeight);
      }
    );
    watch(
      () => state.domInRenderTree,
      (inTree) => {
        if (inTree && domRef.value) foundation.updateDOMHeight(domRef.value.scrollHeight);
      }
    );

    onBeforeUnmount(() => {
      foundation.destroy();
      resizeObserver?.disconnect();
      resizeObserver = null;
    });

    const onTransitionEnd = () => {
      if (!props.isOpen) {
        foundation.updateVisible(false);
      }
      foundation.updateIsTransitioning(false);
      emit('motionEnd');
    };

    return () => {
      const { isOpen, collapseHeight, collapseHeightAdaptive, motion, duration, fade, keepDOM, lazyRender, id } = props;
      const { class: className, style, ...others } = attrs as any;
      const collapsedHeight = collapseHeightAdaptive ? Math.min(state.domHeight, collapseHeight) : collapseHeight;
      const wrapperStyle: CSSProperties = {
        overflow: 'hidden',
        height: `${isOpen ? state.domHeight : collapsedHeight}px`,
        opacity: isOpen || !fade || collapseHeight !== 0 ? 1 : 0,
        transitionDuration: `${motion && state.isTransitioning ? duration : 0}ms`,
      };
      const wrapperCls = cls(`${cssClasses.PREFIX}-wrapper`, { [`${cssClasses.PREFIX}-transition`]: motion && state.isTransitioning }, className);
      const shouldRender = (keepDOM && (lazyRender ? hasBeenRendered : true)) || collapseHeight !== 0 || state.visible || isOpen;
      if (shouldRender && !hasBeenRendered) {
        hasBeenRendered = true;
      }
      return h(
        'div',
        {
          class: wrapperCls,
          style: [wrapperStyle, style],
          onTransitionend: onTransitionEnd,
          ...getDataAttr(others),
        },
        [
          h(
            'div',
            { 'x-semi-prop': 'children', ref: domRef, style: { overflow: 'hidden' }, id },
            shouldRender ? slots.default?.() : undefined
          ),
        ]
      );
    };
  },
});
(Collapsible as any).elementType = 'Collapsible';
(Collapsible as any).getEntryInfo = getEntryInfo;

export default Collapsible;
