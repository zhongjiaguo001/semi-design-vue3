import { defineComponent, h, ref, reactive, watch, onBeforeUnmount, onMounted, toRaw, computed } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import _isUndefined from 'lodash/isUndefined';
import _pick from 'lodash/pick';
import _isFunction from 'lodash/isFunction';
import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _isEmpty from 'lodash/isEmpty';
import _cloneDeep from 'lodash/cloneDeep';
import cls from 'classnames';
import TreeFoundation from '@douyinfe/semi-foundation/lib/es/tree/foundation';
import {
  convertDataToEntities,
  flattenTreeData,
  calcExpandedKeysForValues,
  calcMotionKeys,
  convertJsonToData,
  findKeysForValues,
  calcCheckedKeys,
  calcExpandedKeys,
  filterTreeData,
  normalizeValue,
  updateKeys,
  calcDisabledKeys,
} from '@douyinfe/semi-foundation/lib/es/tree/treeUtil';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/tree/constants';
import '@douyinfe/semi-foundation/lib/es/tree/tree.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, renderSlotOrProp } from '../_utils';
import Input from '../input/Input';
import { CheckboxGroup } from '../checkbox/Checkbox';
import { IconSearch } from '../icons/generated';
import TreeNode from './TreeNode';
import NodeList from './NodeList';
import { provideTreeContext } from './treeContext';
import type { TreeContextValue } from './treeContext';
import { cloneDeep } from './treeUtil';

const prefixcls = cssClasses.PREFIX;

export type ExpandAction = false | 'click' | 'doubleClick';
export type CheckRelation = 'related' | 'unRelated';
export interface TreeNodeData {
  [x: string]: any;
  key?: string;
  value?: number | string;
  label?: any;
  icon?: any;
  disabled?: boolean;
  isLeaf?: boolean;
  children?: TreeNodeData[];
}
export interface KeyMapProps {
  key?: string;
  label?: string;
  value?: string;
  disabled?: string;
  children?: string;
  isLeaf?: string;
  icon?: string;
}
export interface TreeVirtualize {
  itemSize: number;
  height?: number | string;
  width?: number | string;
}
export type TreeValue = string | number | TreeNodeData | Array<TreeNodeData | string | number>;

export const treeProps = {
  autoExpandParent: { type: Boolean, default: false },
  autoExpandWhenDragEnter: { type: Boolean, default: true },
  autoMergeValue: { type: Boolean, default: true },
  blockNode: { type: Boolean, default: true },
  className: { type: String, default: undefined },
  showClear: { type: Boolean, default: true },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandedKeys: { type: Array as PropType<string[]>, default: undefined },
  defaultValue: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  directory: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  disableStrictly: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  emptyContent: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  expandAction: { type: [Boolean, String] as PropType<ExpandAction>, default: false },
  expandAll: { type: Boolean, default: false },
  expandedKeys: { type: Array as PropType<string[]>, default: undefined },
  expandIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  filterTreeNode: { type: [Boolean, Function] as PropType<boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean)>, default: false },
  hideDraggingNode: { type: Boolean, default: false },
  icon: { type: [String, Object, Function] as PropType<any>, default: undefined },
  keyMaps: { type: Object as PropType<KeyMapProps>, default: undefined },
  labelEllipsis: { type: Boolean, default: undefined },
  leafOnly: { type: Boolean, default: false },
  loadData: { type: Function as PropType<(treeNode?: TreeNodeData) => Promise<void>>, default: undefined },
  loadedKeys: { type: Array as PropType<string[]>, default: undefined },
  motion: { type: Boolean, default: true },
  multiple: { type: Boolean, default: false },
  onChangeWithObject: { type: Boolean, default: false },
  preventScroll: { type: Boolean, default: false },
  renderDraggingNode: { type: Function as PropType<(nodeInstance: HTMLElement, node: TreeNodeData) => HTMLElement>, default: undefined },
  renderFullLabel: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  renderLabel: { type: Function as PropType<(label?: any, treeNode?: TreeNodeData, keyword?: string) => VNodeChild>, default: undefined },
  searchClassName: { type: String, default: undefined },
  searchPlaceholder: { type: String, default: undefined },
  searchRender: { type: [Function, Boolean] as PropType<((props: any) => VNodeChild) | false>, default: undefined },
  searchStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  showFilteredOnly: { type: Boolean, default: false },
  showLine: { type: Boolean, default: false },
  treeData: { type: Array as PropType<TreeNodeData[]>, default: undefined },
  treeDataSimpleJson: { type: Object as PropType<Record<string, any>>, default: undefined },
  treeNodeFilterProp: { type: String, default: 'label' },
  value: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  modelValue: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  virtualize: { type: Object as PropType<TreeVirtualize>, default: undefined },
  checkRelation: { type: String as PropType<CheckRelation>, default: 'related' },
  ariaLabel: { type: String, default: undefined },
};

export const treeEmits = [
  'update:value',
  'update:modelValue',
  'change',
  'select',
  'expand',
  'search',
  'contextMenu',
  'doubleClick',
  'load',
  'dragStart',
  'dragEnter',
  'dragOver',
  'dragLeave',
  'dragEnd',
  'drop',
];

/** structural signature (key / value / children) of treeData, used to detect structure changes */
const structureSignature = (treeData: any[] | undefined, keyMaps?: KeyMapProps): any[] | undefined => {
  if (!treeData) return undefined;
  const realKeyName = _get(keyMaps, 'key', 'key');
  const realValueName = _get(keyMaps, 'value', 'value');
  const realChildrenName = _get(keyMaps, 'children', 'children');
  const walk = (nodes: any[]): any[] => nodes.map((n) => [n[realKeyName], n[realValueName], n[realChildrenName] && n[realChildrenName].length ? walk(n[realChildrenName]) : undefined]);
  return walk(treeData);
};

/** simple fixed-size virtual list (replacement for react-window FixedSizeList) */
const VirtualList = defineComponent({
  name: 'TreeVirtualList',
  props: {
    itemCount: { type: Number, default: 0 },
    itemSize: { type: Number, default: 28 },
    height: { type: [Number, String], default: '100%' },
    width: { type: [Number, String], default: '100%' },
    itemData: { type: Array as PropType<any[]>, default: () => [] },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props, { slots, expose }) {
    const outer = ref<HTMLElement | null>(null);
    const scrollTop = ref(0);
    const measuredHeight = ref(0);
    let ro: ResizeObserver | null = null;
    onMounted(() => {
      if (typeof props.height !== 'number' && outer.value) {
        measuredHeight.value = outer.value.parentElement?.clientHeight || outer.value.clientHeight || 0;
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(() => {
            measuredHeight.value = outer.value?.parentElement?.clientHeight || outer.value?.clientHeight || 0;
          });
          ro.observe(outer.value.parentElement || outer.value);
        }
      }
    });
    onBeforeUnmount(() => ro?.disconnect());
    const viewportHeight = () => (typeof props.height === 'number' ? props.height : measuredHeight.value);
    expose({
      scrollToItem: (index: number, align: 'auto' | 'smart' | 'center' | 'end' | 'start' = 'center') => {
        const el = outer.value;
        if (!el) return;
        const vh = viewportHeight();
        let top = index * props.itemSize;
        if (align === 'center') top = top - vh / 2 + props.itemSize / 2;
        else if (align === 'end') top = top - vh + props.itemSize;
        else if (align === 'auto' || align === 'smart') {
          const current = el.scrollTop;
          if (top >= current && top + props.itemSize <= current + vh) return;
          if (top < current) top = top;
          else top = top - vh + props.itemSize;
        }
        el.scrollTop = Math.max(0, top);
        scrollTop.value = el.scrollTop;
      },
    });
    return () => {
      const { itemCount, itemSize, itemData, className, style, width } = props;
      const vh = viewportHeight();
      const overscan = 2;
      let start = 0;
      let end = itemCount;
      if (vh > 0) {
        start = Math.max(0, Math.floor(scrollTop.value / itemSize) - overscan);
        end = Math.min(itemCount, Math.ceil((scrollTop.value + vh) / itemSize) + overscan);
      }
      const items: VNodeChild[] = [];
      for (let i = start; i < end; i++) {
        items.push(slots.default?.({ index: i, data: itemData, style: { position: 'absolute', top: `${i * itemSize}px`, left: 0, width: '100%', height: `${itemSize}px` } }));
      }
      return h(
        'div',
        {
          ref: outer,
          class: className,
          style: { position: 'relative', height: typeof props.height === 'number' ? `${props.height}px` : props.height, width: typeof width === 'number' ? `${width}px` : width, overflow: 'auto', willChange: 'transform', ...(style || {}) },
          onScroll: (e: Event) => {
            scrollTop.value = (e.target as HTMLElement).scrollTop;
          },
        },
        [h('div', { style: { height: `${itemCount * itemSize}px`, width: '100%', position: 'relative' } }, items)]
      );
    };
  },
});

const Tree = defineComponent({
  name: 'Tree',
  inheritAttrs: false,
  props: treeProps,
  emits: treeEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const configContext = useConfigContext();
    const { locale } = useLocale('Tree');
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, any>(
      props as any,
      {
        inputValue: '',
        keyEntities: {},
        treeData: [] as any[],
        flattenNodes: [] as any[],
        selectedKeys: [] as string[],
        checkedKeys: new Set<string>(),
        halfCheckedKeys: new Set<string>(),
        realCheckedKeys: new Set<string>(),
        motionKeys: new Set<string>(),
        motionType: 'hide' as string | null,
        expandedKeys: new Set<string>(props.expandedKeys),
        filteredKeys: new Set<string>(),
        filteredExpandedKeys: new Set<string>(),
        filteredShownKeys: new Set<string>(),
        prevProps: null as any,
        loadedKeys: new Set<string>(),
        loadingKeys: new Set<string>(),
        cachedFlattenNodes: undefined as any[] | undefined,
        cachedKeyValuePairs: {} as Record<string, string>,
        disabledKeys: new Set<string>(),
        dragging: false,
        dragNodesKeys: new Set<string>(),
        dragOverNodeKey: null as any,
        dropPosition: null as number | null,
      },
      { modelProp: 'value' }
    );
    const inputRef = ref<any>(null);
    const virtualizedListRef = ref<any>(null);
    let dragNode: any = null;

    /** callbacks the foundation reads from props by name */
    const callbackProps: Record<string, (...args: any[]) => void> = {
      onLoad: (...args: any[]) => emit('load', ...args),
      onDragStart: (...args: any[]) => emit('dragStart', ...args),
      onDragEnter: (...args: any[]) => emit('dragEnter', ...args),
      onDragOver: (...args: any[]) => emit('dragOver', ...args),
      onDragLeave: (...args: any[]) => emit('dragLeave', ...args),
      onDragEnd: (...args: any[]) => emit('dragEnd', ...args),
      onDrop: (...args: any[]) => emit('drop', ...args),
    };
    const propsProxy = new Proxy(propsView as any, {
      get(t, k) {
        if (typeof k === 'string' && k in callbackProps) return callbackProps[k];
        return Reflect.get(t, k);
      },
      has(t, k) {
        if (typeof k === 'string' && k in callbackProps) return true;
        return Reflect.has(t, k);
      },
    });

    const adapter = {
      ...baseAdapter,
      getProps: () => propsProxy,
      getProp: (key: string) => propsProxy[key],
      updateInputValue: (value: string) => {
        state.inputValue = value;
      },
      focusInput: () => {
        const { preventScroll } = props;
        inputRef.value?.focus?.({ preventScroll });
      },
      updateState: (states: Record<string, any>) => {
        Object.assign(state, states);
      },
      notifyExpand: (expandedKeys: Set<string>, { expanded: bool, node }: { expanded: boolean; node: any }) => {
        emit('expand', [...expandedKeys], { expanded: bool, node });
        if (bool && props.loadData) {
          onNodeLoad(node);
        }
      },
      notifySelect: (selectKey: string, bool: boolean, node: any) => {
        emit('select', selectKey, bool, node);
      },
      notifyChange: (value: any) => {
        emit('update:value', value);
        emit('update:modelValue', value);
        emit('change', value);
      },
      notifySearch: (input: string, filteredExpandedKeys: string[]) => {
        emit('search', input, filteredExpandedKeys);
      },
      notifyRightClick: (e: any, node: any) => {
        emit('contextMenu', e, node);
      },
      notifyDoubleClick: (e: any, node: any) => {
        emit('doubleClick', e, node);
      },
      cacheFlattenNodes: (bool: boolean) => {
        state.cachedFlattenNodes = bool ? cloneDeep(toRaw(state.flattenNodes)) : undefined;
      },
      setDragNode: (treeNode: any) => {
        dragNode = treeNode;
      },
    };
    const foundation = new (TreeFoundation as any)(adapter);

    const onNodeLoad = (data: any) =>
      new Promise<void>((resolve) => {
        const loadedKeys = new Set<string>(state.loadedKeys || []);
        const loadingKeys = new Set<string>(state.loadingKeys || []);
        const res = foundation.handleNodeLoad(loadedKeys, loadingKeys, data, resolve);
        if (res && res.loadingKeys) state.loadingKeys = res.loadingKeys;
      });

    /* ------------------------------------------------------------------ */
    /* getDerivedStateFromProps                                            */
    /* ------------------------------------------------------------------ */
    const snapshotProps = () => {
      const snap: Record<string, any> = {};
      Object.keys(props).forEach((k) => {
        snap[k] = (propsView as any)[k];
      });
      snap.value = (propsView as any).value;
      snap.treeDataSimpleJson = props.treeDataSimpleJson ? _cloneDeep(props.treeDataSimpleJson) : props.treeDataSimpleJson;
      return snap;
    };
    let prevStructure: any[] | undefined;
    let treeDataDirty = false;

    const derive = () => {
      const prevProps = state.prevProps;
      const p: any = propsView;
      const { keyMaps } = props;
      let treeData: any[] | undefined;
      let keyEntities = state.keyEntities || {};
      let valueEntities = state.cachedKeyValuePairs || {};
      const isSeaching = Boolean(props.filterTreeNode && state.inputValue && state.inputValue.length);
      const newState: Record<string, any> = { prevProps: snapshotProps() };
      const isExpandControlled = 'expandedKeys' in p;
      const needUpdate = (name: string) => {
        const firstInProps = !prevProps && name in p;
        const nameHasChange = prevProps && !_isEqual(prevProps[name], p[name]);
        return firstInProps || nameHasChange;
      };
      const nowStructure = structureSignature(props.treeData, keyMaps);
      const treeDataRefUpdated = (!prevProps && 'treeData' in p) || (prevProps && (prevProps.treeData !== props.treeData || treeDataDirty));
      const treeDataStructureUpdated = (!prevProps && 'treeData' in p) || (prevProps && !_isEqual(prevStructure, nowStructure));
      prevStructure = nowStructure;
      treeDataDirty = false;
      const needUpdateSimpleJson = needUpdate('treeDataSimpleJson');

      if (treeDataRefUpdated) {
        treeData = props.treeData;
        newState.treeData = treeData;
        const entitiesMap = convertDataToEntities(treeData as any[], keyMaps);
        newState.keyEntities = { ...entitiesMap.keyEntities };
        keyEntities = newState.keyEntities;
        newState.cachedKeyValuePairs = { ...entitiesMap.valueEntities };
        valueEntities = newState.cachedKeyValuePairs;
      } else if (needUpdateSimpleJson) {
        treeData = convertJsonToData(props.treeDataSimpleJson as any);
        newState.treeData = treeData;
        const entitiesMap = convertDataToEntities(treeData, keyMaps);
        newState.keyEntities = { ...entitiesMap.keyEntities };
        keyEntities = newState.keyEntities;
        newState.cachedKeyValuePairs = { ...entitiesMap.valueEntities };
        valueEntities = newState.cachedKeyValuePairs;
      }
      const dataStructureUpdated = needUpdateSimpleJson || treeDataStructureUpdated;
      if (dataStructureUpdated && props.motion) {
        if (prevProps && props.motion) {
          newState.motionKeys = new Set([]);
          newState.motionType = null;
        }
      }
      const dataUpdated = dataStructureUpdated;
      const expandAllWhenDataChange = dataUpdated && props.expandAll;
      if (!isSeaching) {
        if (needUpdate('expandedKeys') || (prevProps && needUpdate('autoExpandParent'))) {
          newState.expandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
          if (prevProps && props.motion && !treeData) {
            const { motionKeys, motionType } = calcMotionKeys(state.expandedKeys, newState.expandedKeys, keyEntities);
            newState.motionKeys = new Set(motionKeys);
            newState.motionType = motionType;
            if (motionType === 'hide') {
              newState.cachedFlattenNodes = cloneDeep(toRaw(state.flattenNodes));
            }
          }
        } else if ((!prevProps && (props.defaultExpandAll || props.expandAll)) || expandAllWhenDataChange) {
          newState.expandedKeys = new Set(Object.keys(keyEntities));
        } else if (!prevProps && props.defaultExpandedKeys) {
          newState.expandedKeys = calcExpandedKeys(props.defaultExpandedKeys, keyEntities);
        } else if (!prevProps && props.defaultValue) {
          newState.expandedKeys = calcExpandedKeysForValues(props.defaultValue, keyEntities, props.multiple, valueEntities);
        } else if (!prevProps && p.value) {
          newState.expandedKeys = calcExpandedKeysForValues(p.value, keyEntities, props.multiple, valueEntities);
        } else if (!isExpandControlled && dataUpdated && p.value) {
          if (!(state.treeData && state.treeData.length > 0 && props.loadData)) {
            newState.expandedKeys = calcExpandedKeysForValues(p.value, keyEntities, props.multiple, valueEntities);
          }
        }
        if (!newState.expandedKeys) {
          delete newState.expandedKeys;
        }
        if (treeData || newState.expandedKeys) {
          newState.flattenNodes = flattenTreeData(treeData || state.treeData, newState.expandedKeys || state.expandedKeys, keyMaps as any);
        }
      } else {
        if (treeData) {
          const filteredState = filterTreeData({
            treeData,
            inputValue: state.inputValue,
            filterTreeNode: props.filterTreeNode,
            filterProps: props.treeNodeFilterProp,
            showFilteredOnly: props.showFilteredOnly,
            keyEntities: newState.keyEntities,
            prevExpandedKeys: [...state.filteredExpandedKeys],
            keyMaps,
          });
          newState.flattenNodes = filteredState.flattenNodes;
          newState.motionKeys = new Set([]);
          newState.filteredKeys = filteredState.filteredKeys;
          newState.filteredShownKeys = filteredState.filteredShownKeys;
          newState.filteredExpandedKeys = filteredState.filteredExpandedKeys;
        }
        if (props.expandedKeys) {
          newState.filteredExpandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
          if (prevProps && props.motion) {
            const prevKeys = state.filteredExpandedKeys || new Set([]);
            if (!treeData) {
              const motionResult = calcMotionKeys(prevKeys, newState.filteredExpandedKeys, keyEntities);
              let { motionKeys } = motionResult;
              const { motionType } = motionResult;
              if (props.showFilteredOnly) {
                motionKeys = motionKeys.filter((key: string) => state.filteredShownKeys.has(key));
              }
              if (motionType === 'hide') {
                newState.cachedFlattenNodes = cloneDeep(toRaw(state.flattenNodes));
              }
              newState.motionKeys = new Set(motionKeys);
              newState.motionType = motionType;
            }
          }
          newState.flattenNodes = flattenTreeData(treeData || state.treeData, newState.filteredExpandedKeys || state.filteredExpandedKeys, keyMaps as any, props.showFilteredOnly && state.filteredShownKeys);
        }
      }
      const withObject = props.onChangeWithObject;
      const isMultiple = props.multiple;
      if (!isMultiple) {
        if (needUpdate('value')) {
          newState.selectedKeys = findKeysForValues(normalizeValue(p.value, withObject, keyMaps), valueEntities, isMultiple);
        } else if (!prevProps && props.defaultValue) {
          newState.selectedKeys = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
        } else if (treeData) {
          if (p.value) {
            newState.selectedKeys = findKeysForValues(normalizeValue(p.value, withObject, keyMaps) || '', valueEntities, isMultiple);
          }
        }
      } else {
        let checkedKeyValues: any;
        if (needUpdate('value')) {
          checkedKeyValues = findKeysForValues(normalizeValue(p.value, withObject, keyMaps), valueEntities, isMultiple);
        } else if (!prevProps && props.defaultValue) {
          checkedKeyValues = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
        } else if (treeData) {
          if (p.value) {
            checkedKeyValues = findKeysForValues(normalizeValue(p.value, withObject, keyMaps) || [], valueEntities, isMultiple);
          } else {
            checkedKeyValues = updateKeys(props.checkRelation === 'related' ? state.checkedKeys : state.realCheckedKeys, keyEntities);
          }
        }
        if (checkedKeyValues) {
          if (props.checkRelation === 'unRelated') {
            newState.realCheckedKeys = new Set(checkedKeyValues);
          } else if (props.checkRelation === 'related') {
            const { checkedKeys, halfCheckedKeys } = calcCheckedKeys(checkedKeyValues, keyEntities);
            newState.checkedKeys = checkedKeys;
            newState.halfCheckedKeys = halfCheckedKeys;
          }
        }
      }
      if (needUpdate('loadedKeys')) {
        newState.loadedKeys = new Set(props.loadedKeys);
      }
      if (treeData && props.disableStrictly && props.checkRelation === 'related') {
        newState.disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
      }
      Object.assign(state, newState);
    };

    derive();
    watch(
      () => [
        props.treeDataSimpleJson,
        props.keyMaps,
        props.filterTreeNode,
        props.expandedKeys,
        props.autoExpandParent,
        props.motion,
        props.expandAll,
        props.defaultExpandAll,
        props.defaultExpandedKeys,
        props.defaultValue,
        (propsView as any).value,
        props.multiple,
        props.loadData,
        props.showFilteredOnly,
        props.treeNodeFilterProp,
        props.onChangeWithObject,
        props.checkRelation,
        props.loadedKeys,
        props.disableStrictly,
      ],
      () => derive(),
      { deep: true }
    );
    watch(
      () => props.treeData,
      () => {
        treeDataDirty = true;
        derive();
      },
      { deep: true }
    );
    onBeforeUnmount(() => foundation.destroy());

    /* ------------------------------------------------------------------ */
    /* node event handlers                                                */
    /* ------------------------------------------------------------------ */
    const onNodeSelect = (e: any, treeNode: any) => foundation.handleNodeSelect(e, treeNode);
    const onNodeCheck = (e: any, treeNode: any) => foundation.handleNodeSelect(e, treeNode);
    const onNodeExpand = (e: any, treeNode: any) => foundation.handleNodeExpand(e, treeNode);
    const onNodeRightClick = (e: any, treeNode: any) => foundation.handleNodeRightClick(e, treeNode);
    const onNodeDoubleClick = (e: any, treeNode: any) => foundation.handleNodeDoubleClick(e, treeNode);
    const onNodeDragStart = (e: any, treeNode: any) => foundation.handleNodeDragStart(e, treeNode);
    const onNodeDragEnter = (e: any, treeNode: any) => foundation.handleNodeDragEnter(e, treeNode, dragNode);
    const onNodeDragOver = (e: any, treeNode: any) => foundation.handleNodeDragOver(e, treeNode, dragNode);
    const onNodeDragLeave = (e: any, treeNode: any) => foundation.handleNodeDragLeave(e, treeNode);
    const onNodeDragEnd = (e: any, treeNode: any) => foundation.handleNodeDragEnd(e, treeNode);
    const onNodeDrop = (e: any, treeNode: any) => foundation.handleNodeDrop(e, treeNode, dragNode);

    const search = (value: string) => foundation.handleInputChange(value);
    const scrollTo = (scrollData: { key: string; align?: 'auto' | 'smart' | 'center' | 'end' | 'start' }) => {
      const { key, align = 'center' } = scrollData;
      const { flattenNodes } = state;
      if (key) {
        const index = flattenNodes?.findIndex((node: any) => node.key === key);
        index >= 0 && virtualizedListRef.value?.scrollToItem(index, align);
      }
    };

    const getIcon = () => (slots.icon ? (nodeProps: any) => slots.icon!(nodeProps) : props.icon);
    const getExpandIcon = () => (slots.expandIcon ? (p: any) => slots.expandIcon!(p) : props.expandIcon);
    const getRenderLabel = () => (slots.renderLabel ? (label: any, data: any, keyword?: string) => slots.renderLabel!({ label, data, keyword }) : props.renderLabel);
    const getRenderFullLabel = () => (slots.renderFullLabel ? (p: any) => slots.renderFullLabel!(p) : props.renderFullLabel);

    const renderTreeNode = (treeNode: any, _ind?: number, style?: any) => {
      const { data, key } = treeNode;
      const treeNodeProps = foundation.getTreeNodeProps(key);
      if (!treeNodeProps) return null;
      const { keyMaps, showLine } = props;
      const picked: Record<string, any> = _pick(treeNode, ['key', 'label', 'disabled', 'isLeaf', 'icon', 'isEnd']);
      const children = data[_get(keyMaps, 'children', 'children')];
      !_isUndefined(children) && (picked.children = children);
      const { key: _k, ...rest } = { ...treeNodeProps, ...data, ...picked } as any;
      return h(TreeNode, { ...rest, key, showLine, data, expandIcon: getExpandIcon(), style: _isEmpty(style) ? {} : style });
    };

    const context = reactive<TreeContextValue>({
      get treeDisabled() {
        return props.disabled;
      },
      get treeIcon() {
        return getIcon();
      },
      get motion() {
        return props.motion;
      },
      get motionKeys() {
        return state.motionKeys;
      },
      get motionType() {
        return state.motionType;
      },
      get filterTreeNode() {
        return props.filterTreeNode;
      },
      get keyEntities() {
        return state.keyEntities;
      },
      onNodeClick: undefined,
      onNodeExpand,
      onNodeSelect,
      onNodeCheck,
      onNodeRightClick,
      onNodeDoubleClick,
      renderTreeNode,
      onNodeDragStart,
      onNodeDragEnter,
      onNodeDragOver,
      onNodeDragLeave,
      onNodeDragEnd,
      onNodeDrop,
      get expandAction() {
        return props.expandAction;
      },
      get directory() {
        return props.directory;
      },
      get multiple() {
        return props.multiple;
      },
      get showFilteredOnly() {
        return props.showFilteredOnly;
      },
      get isSearching() {
        return Boolean(state.inputValue);
      },
      get loadData() {
        return props.loadData;
      },
      onNodeLoad,
      get renderLabel() {
        return getRenderLabel();
      },
      get draggable() {
        return props.draggable;
      },
      get renderFullLabel() {
        return getRenderFullLabel();
      },
      get dragOverNodeKey() {
        return state.dragOverNodeKey;
      },
      get dropPosition() {
        return state.dropPosition;
      },
      get labelEllipsis() {
        return typeof props.labelEllipsis === 'undefined' ? props.virtualize : props.labelEllipsis;
      },
    } as any);
    provideTreeContext(context);

    /* ------------------------------------------------------------------ */
    /* render                                                              */
    /* ------------------------------------------------------------------ */
    const renderEmpty = () => {
      const emptyContent = renderSlotOrProp(slots, 'emptyContent', props.emptyContent);
      if (emptyContent) {
        return h(TreeNode, { empty: true, emptyContent });
      }
      return h(TreeNode, { empty: true, emptyContent: _get(locale.value, 'emptyText') });
    };

    const renderInput = () => {
      const { searchClassName, searchStyle, searchRender, searchPlaceholder, showClear } = props;
      if (searchRender === false) return null;
      const inputcls = cls(`${prefixcls}-input`);
      const { inputValue } = state;
      const inputProps: Record<string, any> = {
        value: inputValue,
        className: inputcls,
        onChange: (value: string) => search(value),
        prefix: h(IconSearch),
        showClear,
        placeholder: searchPlaceholder || _get(locale.value, 'searchPlaceholder'),
      };
      const wrapperCls = cls(`${prefixcls}-search-wrapper`, searchClassName);
      let inner: VNodeChild;
      if (slots.searchRender) {
        inner = slots.searchRender({ ...inputProps });
      } else if (_isFunction(searchRender)) {
        inner = searchRender({ ...inputProps });
      } else {
        const { className: inputClassName, onChange, ...restInputProps } = inputProps;
        inner = h(Input, { 'aria-label': 'Filter Tree', ref: inputRef, class: inputClassName, onChange, ...restInputProps });
      }
      return h('div', { class: wrapperCls, style: searchStyle }, [inner]);
    };

    const renderNodeList = (): VNodeChild => {
      const { flattenNodes, cachedFlattenNodes, motionKeys, motionType } = state;
      const { virtualize, motion } = props;
      const direction = configContext.direction;
      if (_isEmpty(flattenNodes)) return undefined;
      if (!virtualize || _isEmpty(virtualize)) {
        return h(NodeList, {
          flattenNodes,
          flattenList: cachedFlattenNodes,
          motionKeys: motion ? motionKeys : new Set<string>(),
          motionType,
          renderTreeNode,
        });
      }
      return h(
        'div',
        { style: { height: typeof virtualize.height === 'number' ? `${virtualize.height}px` : virtualize.height || '100%', overflow: 'visible' }, class: `${prefixcls}-auto-wrapper` },
        [
          h(
            VirtualList,
            {
              ref: virtualizedListRef,
              itemCount: flattenNodes.length,
              itemSize: virtualize.itemSize,
              height: virtualize.height ?? '100%',
              width: virtualize.width ?? '100%',
              itemData: flattenNodes,
              className: `${prefixcls}-virtual-list`,
              style: { direction } as any,
            },
            { default: ({ index, style, data }: any) => renderTreeNode(data[index], index, style) }
          ),
        ]
      );
    };

    expose({ search, scrollTo, foundation, state });

    return () => {
      const { keyEntities, inputValue, filteredKeys, checkedKeys, realCheckedKeys } = state;
      const { blockNode, className, filterTreeNode, multiple, showFilteredOnly, checkRelation } = props;
      const { class: attrClass, style: attrStyle, 'aria-label': ariaLabelAttr, ...restAttrs } = attrs as any;
      const wrapperCls = cls(`${prefixcls}-wrapper`, className, attrClass);
      const listCls = cls(`${prefixcls}-option-list`, { [`${prefixcls}-option-list-block`]: blockNode });
      const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
      const noData = _isEmpty(keyEntities) || (showFilteredOnly && searchNoRes);
      const ariaAttr: Record<string, any> = { role: noData ? 'none' : 'tree' };
      if (ariaAttr.role === 'tree') {
        ariaAttr['aria-multiselectable'] = multiple ? true : false;
      }
      return h('div', { 'aria-label': props.ariaLabel ?? ariaLabelAttr, class: wrapperCls, style: attrStyle, ...getDataAttr(restAttrs) }, [
        filterTreeNode ? renderInput() : null,
        h('div', { class: listCls, ...ariaAttr }, [
          noData
            ? renderEmpty()
            : multiple
              ? h(CheckboxGroup, { value: Array.from(checkRelation === 'related' ? checkedKeys : realCheckedKeys) }, { default: () => renderNodeList() })
              : renderNodeList(),
        ]),
      ]);
    };
  },
});
(Tree as any).TreeNode = TreeNode;
(Tree as any).elementType = 'Tree';

export { VirtualList as TreeVirtualList, strings as treeStrings };
export default Tree;
