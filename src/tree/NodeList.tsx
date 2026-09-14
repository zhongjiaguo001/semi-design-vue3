import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import _isEqual from 'lodash/isEqual';
import cls from 'classnames';
import { cssClasses as collapsibleClasses } from '@douyinfe/semi-foundation/lib/es/collapsible/constants';
import '@douyinfe/semi-foundation/lib/es/collapsible/collapsible.css';

const getTreeNodeKey = (treeNode: any) => treeNode.key;

/**
 * Minimal Collapsible used for tree node expand / collapse motion (React `tree/nodeCollapsible.js` + `collapsible`).
 * `open` is the initial state; the opposite state is applied on the next tick so a height transition runs.
 */
export const NodeCollapsible = defineComponent({
  name: 'TreeNodeCollapsible',
  props: {
    open: { type: Boolean, default: false },
    duration: { type: Number, default: 200 },
    motion: { type: Boolean, default: true },
    onMotionEnd: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots }) {
    const isOpen = ref(props.open);
    const domHeight = ref(0);
    const isTransitioning = ref(false);
    const innerRef = ref<HTMLElement | null>(null);
    let fallbackTimer: any = null;
    let ended = false;

    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(fallbackTimer);
      isTransitioning.value = false;
      props.onMotionEnd?.();
    };

    onMounted(() => {
      if (innerRef.value) domHeight.value = innerRef.value.scrollHeight;
      setTimeout(() => {
        if (innerRef.value) domHeight.value = innerRef.value.scrollHeight;
        isOpen.value = !props.open;
        isTransitioning.value = props.motion;
        if (!props.motion) {
          end();
        } else {
          // jsdom / display:none never fire transitionend
          fallbackTimer = setTimeout(end, props.duration + 50);
        }
      }, 0);
    });
    onBeforeUnmount(() => clearTimeout(fallbackTimer));

    return () => {
      const height = isOpen.value ? domHeight.value : 0;
      const wrapperCls = cls(`${collapsibleClasses.PREFIX}-wrapper`, { [`${collapsibleClasses.PREFIX}-transition`]: props.motion && isTransitioning.value });
      return h(
        'div',
        {
          class: wrapperCls,
          style: { overflow: 'hidden', height: `${height}px`, transitionDuration: `${props.motion && isTransitioning.value ? props.duration : 0}ms` },
          onTransitionend: end,
        },
        [h('div', { 'x-semi-prop': 'children', ref: innerRef, style: { overflow: 'hidden' } }, slots.default?.())]
      );
    };
  },
});

/** React `tree/nodeList.js` */
const NodeList = defineComponent({
  name: 'TreeNodeList',
  props: {
    flattenNodes: { type: Array as PropType<any[]>, default: () => [] },
    flattenList: { type: Array as PropType<any[]>, default: undefined },
    motionKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    motionType: { type: String as PropType<string | null>, default: undefined },
    searchTargetIsDeep: { type: Boolean, default: false },
    onMotionEnd: { type: Function as PropType<() => void>, default: undefined },
    renderTreeNode: { type: Function as PropType<(treeNode: any, ind?: number, style?: any) => VNodeChild>, required: true },
  },
  setup(props) {
    const state = reactive({
      transitionNodes: [] as any[],
      cachedData: [] as any[],
      cachedMotionKeys: undefined as Set<string> | undefined,
      cachedMotionType: undefined as string | null | undefined,
    });

    const derive = () => {
      const { flattenNodes = [], motionKeys, motionType, flattenList = [] } = props;
      const motionKeyArr = [...motionKeys];
      const hasChanged = !_isEqual(state.cachedMotionKeys ? [...state.cachedMotionKeys] : undefined, motionKeyArr) || !_isEqual(state.cachedData.map((i) => i.key), flattenNodes.map((i) => i.key));
      if (!hasChanged || !motionKeyArr.length) return;
      const transitionNodes: any[] = [];
      const transitionRange: any[] = [];
      let rangeStart = 0;
      const lookUpTarget = motionType === 'hide' && flattenList && flattenList.length ? flattenList : flattenNodes;
      lookUpTarget.forEach((treeNode: any, ind: number) => {
        const nodeKey = getTreeNodeKey(treeNode);
        if (motionKeys.has(nodeKey)) {
          transitionRange.push(treeNode);
          if (nodeKey === motionKeyArr[0]) rangeStart = ind;
        } else {
          transitionNodes.push(treeNode);
        }
      });
      transitionNodes.splice(rangeStart, 0, transitionRange);
      state.transitionNodes = transitionNodes;
      state.cachedData = flattenNodes;
      state.cachedMotionKeys = new Set(motionKeys);
      state.cachedMotionType = motionType;
    };
    derive();
    watch(() => [props.flattenNodes, props.motionKeys, props.motionType, props.flattenList], derive, { flush: 'sync' });

    const onMotionEnd = () => {
      typeof props.onMotionEnd === 'function' && props.onMotionEnd();
      state.transitionNodes = [];
    };

    return () => {
      const { flattenNodes, motionType, searchTargetIsDeep, renderTreeNode } = props;
      const { transitionNodes } = state;
      const mapData = transitionNodes.length && !searchTargetIsDeep ? transitionNodes : flattenNodes;
      return mapData.map((treeNode: any) => {
        const isMotionNode = Array.isArray(treeNode);
        if (isMotionNode && !treeNode.length) return null;
        if (isMotionNode && treeNode.length) {
          const nodeKey = getTreeNodeKey(treeNode[0]);
          return h(
            NodeCollapsible,
            { open: motionType === 'hide', duration: 200, motion: Boolean(motionType), key: `motion-${nodeKey}`, onMotionEnd },
            { default: () => treeNode.map((node: any) => renderTreeNode(node)) }
          );
        }
        return renderTreeNode(treeNode);
      });
    };
  },
});

export default NodeList;
