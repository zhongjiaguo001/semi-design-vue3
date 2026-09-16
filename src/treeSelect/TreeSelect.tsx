import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, toRaw, nextTick, Fragment } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import _isUndefined from 'lodash/isUndefined';
import _isNull from 'lodash/isNull';
import _pick from 'lodash/pick';
import _isFunction from 'lodash/isFunction';
import _isString from 'lodash/isString';
import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _isEmpty from 'lodash/isEmpty';
import _noop from 'lodash/noop';
import cls from 'classnames';
import TreeSelectFoundation from '@douyinfe/semi-foundation/lib/es/treeSelect/foundation';
import {
  convertDataToEntities,
  flattenTreeData,
  calcExpandedKeysForValues,
  calcMotionKeys,
  findKeysForValues,
  calcCheckedKeys,
  calcExpandedKeys,
  filterTreeData,
  normalizeKeyList,
  getValueOrKey,
  normalizeValue,
  updateKeys,
  calcDisabledKeys,
} from '@douyinfe/semi-foundation/lib/es/tree/treeUtil';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/treeSelect/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import '@douyinfe/semi-foundation/lib/es/tree/tree.css';
import '@douyinfe/semi-foundation/lib/es/treeSelect/treeSelect.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, isSemiIcon, renderSlotOrProp } from '../_utils';
import Input from '../input/Input';
import Tag from '../tag/Tag';
import TagInput from '../tagInput/TagInput';
import Popover from '../popover/Popover';
import { CheckboxGroup } from '../checkbox/Checkbox';
import Spin from '../spin/Spin';
import { IconChevronDown, IconClear, IconSearch } from '../icons/generated';
import TreeNode from '../tree/TreeNode';
import NodeList from '../tree/NodeList';
import { TreeVirtualList } from '../tree/Tree';
import { provideTreeContext } from '../tree/treeContext';
import type { TreeContextValue } from '../tree/treeContext';
import { cloneDeep } from '../tree/treeUtil';
import type { TreeNodeData, KeyMapProps, TreeVirtualize, TreeValue, ExpandAction, CheckRelation } from '../tree/Tree';

const prefixcls = cssClasses.PREFIX;
const prefixTree = cssClasses.PREFIX_TREE;

export type TreeSelectSize = (typeof strings.SIZE_SET)[number];
export type TreeSelectValidateStatus = (typeof strings.STATUS)[number];
export type SearchPosition = 'dropdown' | 'trigger';
export interface RenderSelectedItemResult {
  isRenderInTag?: boolean;
  content: any;
}

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const treeSelectProps = {
  ariaDescribedby: { type: String, default: undefined },
  ariaErrormessage: { type: String, default: undefined },
  ariaInvalid: { type: Boolean, default: undefined },
  ariaLabelledby: { type: String, default: undefined },
  ariaRequired: { type: Boolean, default: undefined },
  ariaLabel: { type: String, default: 'TreeSelect' },
  borderless: { type: Boolean, default: false },
  loadedKeys: { type: Array as PropType<string[]>, default: undefined },
  loadData: { type: Function as PropType<(treeNode?: TreeNodeData) => Promise<void>>, default: undefined },
  arrowIcon: { ...nodeProp, default: () => h(IconChevronDown) },
  clearIcon: nodeProp,
  defaultOpen: { type: Boolean, default: false },
  defaultValue: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandedKeys: { type: Array as PropType<string[]>, default: undefined },
  expandAll: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  disableStrictly: { type: Boolean, default: false },
  filterTreeNode: { type: [Boolean, Function] as PropType<boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean)>, default: false },
  multiple: { type: Boolean, default: false },
  remote: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: undefined },
  searchAutoFocus: { type: Boolean, default: false },
  virtualize: { type: Object as PropType<TreeVirtualize>, default: undefined },
  treeNodeFilterProp: { type: String, default: 'label' },
  onChangeWithObject: { type: Boolean, default: false },
  value: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  modelValue: { type: [String, Number, Array, Object] as PropType<TreeValue>, default: undefined },
  expandedKeys: { type: Array as PropType<string[]>, default: undefined },
  autoExpandParent: { type: Boolean, default: false },
  showClear: { type: Boolean, default: false },
  showSearchClear: { type: Boolean, default: true },
  autoAdjustOverflow: { type: Boolean, default: true },
  showFilteredOnly: { type: Boolean, default: false },
  showLine: { type: Boolean, default: false },
  motionExpand: { type: Boolean, default: true },
  emptyContent: { ...nodeProp },
  keyMaps: { type: Object as PropType<KeyMapProps>, default: undefined },
  leafOnly: { type: Boolean, default: false },
  treeData: { type: Array as PropType<TreeNodeData[]>, default: undefined },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMargin: { type: [Number, Object] as PropType<number | Record<string, number>>, default: undefined },
  motion: { type: Boolean, default: true },
  placeholder: { type: String, default: undefined },
  maxTagCount: { type: Number, default: undefined },
  size: { type: String as PropType<TreeSelectSize>, default: 'default' },
  className: { type: String, default: undefined },
  treeNodeLabelProp: { type: String, default: 'label' },
  suffix: nodeProp,
  prefix: nodeProp,
  insetLabel: nodeProp,
  insetLabelId: { type: String, default: undefined },
  zIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  dropdownMatchSelectWidth: { type: Boolean, default: true },
  validateStatus: { type: String as PropType<TreeSelectValidateStatus>, default: undefined },
  mouseEnterDelay: { type: Number, default: undefined },
  mouseLeaveDelay: { type: Number, default: undefined },
  triggerRender: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  stopPropagation: { type: [Boolean, String] as PropType<boolean | string>, default: true },
  outerBottomSlot: nodeProp,
  outerTopSlot: nodeProp,
  expandAction: { type: [Boolean, String] as PropType<ExpandAction>, default: false },
  searchPosition: { type: String as PropType<SearchPosition>, default: strings.SEARCH_POSITION_DROPDOWN as SearchPosition },
  clickToHide: { type: Boolean, default: true },
  renderLabel: { type: Function as PropType<(label?: any, treeNode?: TreeNodeData, keyword?: string) => VNodeChild>, default: undefined },
  renderFullLabel: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  labelEllipsis: { type: Boolean, default: undefined },
  optionListStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  searchRender: { type: [Function, Boolean] as PropType<((props: any) => VNodeChild) | boolean>, default: undefined },
  renderSelectedItem: { type: Function as PropType<(item: TreeNodeData, extra?: { index: number; onClose: (tagContent: any, e: any) => void }) => any>, default: undefined },
  checkRelation: { type: String as PropType<CheckRelation>, default: 'related' },
  showRestTagsPopover: { type: Boolean, default: false },
  restTagsPopoverProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  preventScroll: { type: Boolean, default: false },
  clickTriggerToHide: { type: Boolean, default: true },
  autoMergeValue: { type: Boolean, default: true },
  triggerTagWrap: { type: Boolean, default: false },
  expandIcon: { type: [Object, Function] as PropType<any>, default: undefined },
  position: { type: String, default: undefined },
  /** show a loading spinner in the dropdown instead of the option list (used with `remote` search) */
  loading: { type: Boolean, default: false },
};

export const treeSelectEmits = ['update:value', 'update:modelValue', 'change', 'clear', 'search', 'select', 'expand', 'blur', 'focus', 'load', 'visibleChange'];

const TreeSelect = defineComponent({
  name: 'TreeSelect',
  inheritAttrs: false,
  props: treeSelectProps,
  emits: treeSelectEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const configContext = useConfigContext();
    const { locale: treeSelectLocale } = useLocale('TreeSelect');
    const { locale: treeLocale } = useLocale('Tree');
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, any>(
      props as any,
      {
        inputTriggerFocus: false,
        isOpen: false,
        isFocus: false,
        rePosKey: 0,
        dropdownMinWidth: null as null | number | string,
        inputValue: '',
        keyEntities: {} as Record<string, any>,
        treeData: [] as any[],
        flattenNodes: [] as any[],
        cachedFlattenNodes: undefined as any[] | undefined,
        selectedKeys: [] as string[],
        checkedKeys: new Set<string>(),
        halfCheckedKeys: new Set<string>(),
        realCheckedKeys: new Set<string>(),
        disabledKeys: new Set<string>(),
        motionKeys: new Set<string>(),
        motionType: 'hide' as string | null,
        expandedKeys: new Set<string>(props.expandedKeys),
        filteredKeys: new Set<string>(),
        filteredExpandedKeys: new Set<string>(),
        filteredShownKeys: new Set<string>(),
        prevProps: null as any,
        isHovering: false,
        cachedKeyValuePairs: {} as Record<string, string>,
        loadedKeys: new Set<string>(),
        loadingKeys: new Set<string>(),
      },
      { modelProp: 'value' }
    );
    const inputRef = ref<any>(null);
    const tagInputRef = ref<any>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const optionsRef = ref<any>(null);
    const optionContainerEl = ref<HTMLElement | null>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

    /** callbacks the foundation reads by prop name */
    const callbackProps: Record<string, (...args: any[]) => void> = {
      onVisibleChange: (v: boolean) => emit('visibleChange', v),
      onLoad: (...args: any[]) => emit('load', ...args),
    };
    const propsProxy = new Proxy(propsView as any, {
      get(t, k) {
        if (typeof k === 'string' && k in callbackProps) return callbackProps[k];
        if (k === 'style') return (attrs as any).style;
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
      registerClickOutsideHandler: (cb: (e: any) => void) => {
        adapter.unregisterClickOutsideHandler();
        clickOutsideHandler = (e: MouseEvent) => {
          const triggerDom = triggerRef.value;
          const optionsDom = optionContainerEl.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (optionsDom && (!optionsDom.contains(target) || !optionsDom.contains(target.parentNode)) && triggerDom && !triggerDom.contains(target) && !(path.includes(triggerDom) || path.includes(optionsDom))) {
            cb(e);
          }
        };
        document.addEventListener('mousedown', clickOutsideHandler, false);
      },
      unregisterClickOutsideHandler: () => {
        if (!clickOutsideHandler) return;
        document.removeEventListener('mousedown', clickOutsideHandler, false);
        clickOutsideHandler = null;
      },
      rePositionDropdown: () => {
        state.rePosKey = state.rePosKey + 1;
      },
      updateState: (states: Record<string, any>) => {
        Object.assign(state, states);
      },
      notifySelect: (selectKey: string, bool: boolean, node: any) => {
        emit('select', selectKey, bool, node);
      },
      notifySearch: (input: string, filteredExpandedKeys: string[], filteredNodes: any[]) => {
        emit('search', input, filteredExpandedKeys, filteredNodes);
      },
      cacheFlattenNodes: (bool: boolean) => {
        state.cachedFlattenNodes = bool ? cloneDeep(toRaw(state.flattenNodes)) : undefined;
      },
      notifyLoad: (newLoadedKeys: Set<string>, data: any) => {
        emit('load', newLoadedKeys, data);
      },
      notifyClear: (e: any) => {
        emit('clear', e);
      },
      updateLoadKeys: (data: any, resolve: () => void) => {
        const loadedKeys = new Set<string>(state.loadedKeys || []);
        const loadingKeys = new Set<string>(state.loadingKeys || []);
        const res = foundation.handleNodeLoad(loadedKeys, loadingKeys, data, resolve);
        if (res && res.loadingKeys) state.loadingKeys = res.loadingKeys;
      },
      openMenu: () => {
        state.isOpen = true;
        nextTick(() => emit('visibleChange', true));
      },
      closeMenu: (cb?: () => void) => {
        state.isOpen = false;
        nextTick(() => {
          cb && cb();
          emit('visibleChange', false);
        });
      },
      getTriggerWidth: () => {
        const el = triggerRef.value;
        return el && el.getBoundingClientRect().width;
      },
      setOptionWrapperWidth: (width: any) => {
        state.dropdownMinWidth = width;
      },
      notifyChange: (value: any, node: any, e: any) => {
        emit('update:value', value);
        emit('update:modelValue', value);
        emit('change', value, node, e);
      },
      notifyChangeWithObject: (node: any, e: any) => {
        emit('update:value', node);
        emit('update:modelValue', node);
        emit('change', node, e);
      },
      notifyExpand: (expandedKeys: Set<string>, { expanded: bool, node }: { expanded: boolean; node: any }) => {
        emit('expand', [...expandedKeys], { expanded: bool, node });
        if (bool && props.loadData) {
          onNodeLoad(node);
        }
      },
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyBlur: (...args: any[]) => emit('blur', ...args),
      toggleHovering: (bool: boolean) => {
        state.isHovering = bool;
      },
      updateInputFocus: (bool: boolean) => {
        if (bool) {
          inputRef.value?.focus?.({ preventScroll: props.preventScroll });
          tagInputRef.value?.focus?.();
        } else {
          inputRef.value?.blur?.();
          tagInputRef.value?.blur?.();
        }
      },
      updateIsFocus: (bool: boolean) => {
        state.isFocus = bool;
      },
    };
    const foundation = new (TreeSelectFoundation as any)(adapter);
    const onNodeLoad = (data: any) => new Promise<void>((resolve) => foundation.setLoadKeys(data, resolve));

    /* ------------------------------------------------------------------ */
    /* getDerivedStateFromProps                                            */
    /* ------------------------------------------------------------------ */
    const snapshotProps = () => {
      const snap: Record<string, any> = {};
      Object.keys(props).forEach((k) => {
        snap[k] = (propsView as any)[k];
      });
      snap.value = (propsView as any).value;
      return snap;
    };
    let treeDataDirty = false;
    const derive = () => {
      const prevProps = state.prevProps;
      const p: any = propsView;
      const { keyMaps } = props;
      const needUpdate = (name: string) => (!prevProps && name in p) || (prevProps && !_isEqual(prevProps[name], p[name]));
      let treeData: any[] | undefined;
      const withObject = props.onChangeWithObject;
      let keyEntities = state.keyEntities || {};
      let valueEntities = state.cachedKeyValuePairs || {};
      const newState: Record<string, any> = { prevProps: snapshotProps() };
      const needUpdateTreeData = needUpdate('treeData') || treeDataDirty;
      treeDataDirty = false;
      const needUpdateExpandedKeys = needUpdate('expandedKeys');
      const isSearching = Boolean(props.filterTreeNode && !props.remote && state.inputValue && state.inputValue.length);
      if (needUpdateTreeData) {
        treeData = props.treeData;
        newState.treeData = treeData;
        const entitiesMap = convertDataToEntities(treeData as any[], keyMaps);
        newState.keyEntities = { ...entitiesMap.keyEntities };
        keyEntities = newState.keyEntities;
        newState.cachedKeyValuePairs = { ...entitiesMap.valueEntities };
        valueEntities = newState.cachedKeyValuePairs;
      }
      if (treeData && props.motion && !_isEqual(Object.keys(newState.keyEntities), Object.keys(state.keyEntities))) {
        if (prevProps && props.motion) {
          newState.motionKeys = new Set([]);
          newState.motionType = null;
        }
      }
      const expandAllWhenDataChange = needUpdateTreeData && props.expandAll;
      if (!isSearching) {
        if (needUpdateExpandedKeys || (prevProps && needUpdate('autoExpandParent'))) {
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
          newState.expandedKeys = calcExpandedKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), keyEntities, props.multiple, valueEntities);
        } else if (!prevProps && p.value) {
          newState.expandedKeys = calcExpandedKeysForValues(normalizeValue(p.value, withObject, keyMaps), keyEntities, props.multiple, valueEntities);
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
      const isMultiple = props.multiple;
      if (!isMultiple) {
        if (needUpdate('value')) {
          newState.selectedKeys = findKeysForValues(normalizeValue(p.value, withObject, keyMaps), valueEntities, isMultiple);
        } else if (!prevProps && props.defaultValue) {
          newState.selectedKeys = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
        } else if (treeData) {
          if (p.value) {
            newState.selectedKeys = findKeysForValues(normalizeValue(p.value, withObject, keyMaps) || '', valueEntities, isMultiple);
          } else {
            newState.selectedKeys = updateKeys(state.selectedKeys, keyEntities);
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
      if (needUpdateTreeData || needUpdate('value')) {
        newState.rePosKey = state.rePosKey + 1;
      }
      if (treeData && props.disableStrictly && props.checkRelation === 'related') {
        newState.disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
      }
      Object.assign(state, newState);
    };
    derive();
    watch(
      () => [
        props.keyMaps,
        props.filterTreeNode,
        props.remote,
        props.expandedKeys,
        props.autoExpandParent,
        props.motion,
        props.expandAll,
        props.defaultExpandAll,
        props.defaultExpandedKeys,
        props.defaultValue,
        (propsView as any).value,
        props.multiple,
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
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    /* ------------------------------------------------------------------ */
    /* handlers                                                            */
    /* ------------------------------------------------------------------ */
    const removeTag = (removedKey: string) => foundation.removeTag(removedKey);
    const handleClick = (e: MouseEvent) => foundation.handleClick(e);
    const getDataForKeyNotInKeyEntities = (key: string) => foundation.getDataForKeyNotInKeyEntities(key);
    const handleSelectionEnterPress = (e: KeyboardEvent) => foundation.handleSelectionEnterPress(e);
    const handleClear = (e: any) => {
      e && e.stopPropagation();
      foundation.handleClear(e);
    };
    const handleClearEnterPress = (e: any) => {
      e && e.stopPropagation();
      foundation.handleClearEnterPress(e);
    };
    const handleMouseOver = () => foundation.toggleHoverState(true);
    const handleMouseLeave = () => foundation.toggleHoverState(false);
    const search = (value: string) => {
      if (!state.isOpen) foundation.open();
      foundation.handleInputChange(value);
    };
    const close = () => foundation.close(null);
    const onNodeSelect = (e: any, treeNode: any) => foundation.handleNodeSelect(e, treeNode);
    const onNodeCheck = (e: any, treeNode: any) => foundation.handleNodeSelect(e, treeNode);
    const onNodeExpand = (e: any, treeNode: any) => foundation.handleNodeExpand(e, treeNode);
    const handlePopoverVisibleChange = (isVisible: boolean) => foundation.handlePopoverVisibleChange(isVisible);
    const afterClose = () => foundation.handleAfterClose();
    const onMotionEnd = () => adapter.rePositionDropdown();

    const hasValue = () => {
      const { multiple, checkRelation } = props;
      const { realCheckedKeys, checkedKeys, selectedKeys } = state;
      if (multiple) {
        if (checkRelation === 'related') return Boolean(checkedKeys.size);
        if (checkRelation === 'unRelated') return Boolean(realCheckedKeys.size);
        return false;
      }
      return Boolean(selectedKeys.length);
    };
    const showClearBtn = () => {
      const { showClear, disabled, searchPosition } = props;
      const { inputValue, isOpen, isHovering } = state;
      const triggerSearchHasInputValue = searchPosition === strings.SEARCH_POSITION_TRIGGER && inputValue;
      return Boolean(showClear && (hasValue() || triggerSearchHasInputValue) && !disabled && (isOpen || isHovering));
    };

    const getRenderLabel = () => (slots.renderLabel ? (label: any, data: any, keyword?: string) => slots.renderLabel!({ label, data, keyword }) : props.renderLabel);
    const getRenderFullLabel = () => (slots.renderFullLabel ? (p: any) => slots.renderFullLabel!(p) : props.renderFullLabel);
    const getExpandIcon = () => (slots.expandIcon ? (p: any) => slots.expandIcon!(p) : props.expandIcon);

    /** the renderSelectedItem the foundation reads (single mode text) */
    const renderSelectedItemForFoundation = () => {
      if (slots.renderSelectedItem) return (item: any, extra?: any) => slots.renderSelectedItem!({ item, ...(extra || {}) });
      return props.renderSelectedItem;
    };
    Object.defineProperty(callbackProps, 'renderSelectedItem', { get: renderSelectedItemForFoundation, enumerable: true });

    /* ------------------------------------------------------------------ */
    /* render helpers – trigger                                            */
    /* ------------------------------------------------------------------ */
    const renderSuffix = () => {
      const suffix = renderSlotOrProp(slots, 'suffix', props.suffix);
      const node = normalizeNode(suffix);
      const suffixWrapperCls = cls({
        [`${prefixcls}-suffix`]: true,
        [`${prefixcls}-suffix-text`]: suffix && _isString(suffix),
        [`${prefixcls}-suffix-icon`]: isSemiIcon(node),
      });
      return h('div', { class: suffixWrapperCls, 'x-semi-prop': 'suffix' }, [node]);
    };
    const renderPrefix = () => {
      const { insetLabelId } = props;
      const prefix = renderSlotOrProp(slots, 'prefix', props.prefix);
      const insetLabel = renderSlotOrProp(slots, 'insetLabel', props.insetLabel);
      const labelNode = prefix || insetLabel;
      const node = normalizeNode(labelNode);
      const prefixWrapperCls = cls({
        [`${prefixcls}-prefix`]: true,
        [`${prefixcls}-inset-label`]: insetLabel,
        [`${prefixcls}-prefix-text`]: labelNode && _isString(labelNode),
        [`${prefixcls}-prefix-icon`]: isSemiIcon(node),
      });
      return h('div', { class: prefixWrapperCls, id: insetLabelId, 'x-semi-prop': 'prefix,insetLabel' }, [node]);
    };

    const renderTagList = (triggerRenderKeys: string[]) => {
      const { keyEntities, disabledKeys } = state;
      const { treeNodeLabelProp, disabled, disableStrictly, size, keyMaps } = props;
      const realLabelName = _get(keyMaps, 'label', treeNodeLabelProp);
      const propRender = renderSelectedItemForFoundation();
      const renderSelectedItem = _isFunction(propRender) ? propRender : (item: any) => ({ isRenderInTag: true, content: _get(item, realLabelName, null) });
      const tagList: VNodeChild[] = [];
      triggerRenderKeys.forEach((key, index) => {
        const item = keyEntities[key] && keyEntities[key].key === key ? keyEntities[key].data : getDataForKeyNotInKeyEntities(key);
        const onClose = (_tagContent: any, e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          removeTag(key);
        };
        const { content, isRenderInTag } = item ? (renderSelectedItem as any)(item, { index, onClose }) || {} : ({} as any);
        if (_isNull(content) || _isUndefined(content)) return;
        const isDisabled = disabled || item.disabled || (disableStrictly && disabledKeys.has(item.key));
        const tag = { closable: !isDisabled, color: 'white' as const, visible: true, onClose, key: `tag-${key}-${index}`, size: size === 'small' ? ('small' as const) : ('large' as const) };
        if (isRenderInTag) {
          tagList.push(h(Tag, tag, () => normalizeNode(content)));
        } else {
          tagList.push(normalizeNode(content));
        }
      });
      return tagList;
    };

    /** minimal TagGroup (mode=custom) */
    const renderTagGroup = (tagList: VNodeChild[]) => {
      const { maxTagCount, showRestTagsPopover, restTagsPopoverProps } = props;
      const groupCls = cls({ 'semi-tag-group': true, 'semi-tag-group-max': maxTagCount, 'semi-tag-group-large': true });
      let contents = tagList;
      if (typeof maxTagCount !== 'undefined') {
        const n = tagList.length - maxTagCount;
        const normalTags = tagList.slice(0, maxTagCount);
        const restTags = tagList.slice(maxTagCount);
        if (n > 0) {
          const restCountTag = h(Tag, { closable: false, size: 'large', color: 'grey', style: { backgroundColor: 'transparent' }, key: '_+n' }, () => `+${n}`);
          const nTag: VNodeChild = showRestTagsPopover
            ? h(Popover, { showArrow: true, trigger: 'hover', position: 'top', autoAdjustOverflow: true, className: 'semi-tag-rest-group-popover', ...restTagsPopoverProps, key: '_+n_Popover' }, { default: () => restCountTag, content: () => restTags })
            : restCountTag;
          normalTags.push(nTag);
          contents = normalTags;
        }
      }
      return h('div', { class: groupCls }, contents);
    };

    const renderSingleTriggerSearchItem = () => {
      const { placeholder, disabled } = props;
      const { inputTriggerFocus } = state;
      const renderText = foundation.getRenderTextInSingle();
      const spanCls = cls(`${prefixcls}-selection-TriggerSearchItem`, {
        [`${prefixcls}-selection-TriggerSearchItem-placeholder`]: (inputTriggerFocus || !renderText) && !disabled,
        [`${prefixcls}-selection-TriggerSearchItem-disabled`]: disabled,
      });
      return h('span', { class: spanCls, onClick: foundation.onClickSingleTriggerSearchItem }, [renderText ? normalizeNode(renderText) : placeholder]);
    };
    const renderSingleTriggerSearch = () => [renderInput(), !state.inputValue ? renderSingleTriggerSearchItem() : null];

    const renderSelectContent = (triggerRenderKeys: string[]): VNodeChild => {
      const { multiple, placeholder, searchPosition, filterTreeNode } = props;
      const isTriggerPositionSearch = filterTreeNode && searchPosition === strings.SEARCH_POSITION_TRIGGER;
      if (isTriggerPositionSearch) {
        return multiple ? renderTagInput(triggerRenderKeys) : renderSingleTriggerSearch();
      }
      if (!multiple || !hasValue()) {
        const renderText = foundation.getRenderTextInSingle();
        const spanCls = cls(`${prefixcls}-selection-content`, { [`${prefixcls}-selection-placeholder`]: !renderText });
        return h('span', { class: spanCls }, [renderText ? normalizeNode(renderText) : placeholder]);
      }
      return renderTagGroup(renderTagList(triggerRenderKeys));
    };

    const renderArrow = () => {
      if (showClearBtn()) return null;
      const arrowIcon = renderSlotOrProp(slots, 'arrowIcon', props.arrowIcon);
      return arrowIcon ? h('div', { class: cls(`${prefixcls}-arrow`), 'x-semi-prop': 'arrowIcon' }, [normalizeNode(arrowIcon)]) : null;
    };
    const renderClearBtn = () => {
      if (!showClearBtn()) return null;
      const clearIcon = renderSlotOrProp(slots, 'clearIcon', props.clearIcon);
      return h(
        'div',
        { role: 'button', tabindex: 0, 'aria-label': 'Clear TreeSelect value', class: cls(`${prefixcls}-clearbtn`), onClick: handleClear, onKeypress: handleClearEnterPress },
        [clearIcon ? normalizeNode(clearIcon) : h(IconClear)]
      );
    };

    const renderTagItem = (key: string, idx: number) => {
      const { keyEntities, disabledKeys } = state;
      const { size, leafOnly, disabled, disableStrictly, treeNodeLabelProp, keyMaps } = props;
      const realLabelName = _get(keyMaps, 'label', treeNodeLabelProp);
      const keyList = normalizeKeyList([key], keyEntities, leafOnly, true);
      const nodes = keyList.map(() => (keyEntities[key] && keyEntities[key].key === key ? keyEntities[key].data : getDataForKeyNotInKeyEntities(key)));
      const value = getValueOrKey(nodes, keyMaps);
      const tagCls = cls(`${prefixcls}-selection-tag`, { [`${prefixcls}-selection-tag-disabled`]: disabled });
      const nodeHaveData = !_isEmpty(nodes) && !_isEmpty(nodes[0]);
      const isDisableStrictlyNode = disableStrictly && nodeHaveData && disabledKeys.has(nodes[0].key);
      const closable = nodeHaveData && !nodes[0].disabled && !disabled && !isDisableStrictlyNode;
      const onClose = (_tagChildren: any, e: any) => {
        e && typeof e.preventDefault === 'function' && e.preventDefault();
        removeTag(key);
      };
      const tagProps: any = { size: size === 'small' ? 'small' : 'large', key: `tag-${value}-${idx}`, color: 'white', class: tagCls, closable, onClose };
      const item = nodes[0];
      const propRender = renderSelectedItemForFoundation();
      const renderSelectedItem = _isFunction(propRender) ? propRender : (selectedItem: any) => ({ isRenderInTag: true, content: _get(selectedItem, realLabelName, null) });
      const { content, isRenderInTag } = item ? (renderSelectedItem as any)(item, { index: idx, onClose }) || {} : ({} as any);
      if (isRenderInTag) return h(Tag, tagProps, () => normalizeNode(content));
      return normalizeNode(content);
    };

    const renderTagInput = (triggerRenderKeys: string[]) => {
      const { disabled, size, searchAutoFocus, placeholder, maxTagCount, showRestTagsPopover, restTagsPopoverProps, searchPosition, filterTreeNode, preventScroll } = props;
      const { inputValue } = state;
      const autoFocus = filterTreeNode && searchPosition === strings.SEARCH_POSITION_TRIGGER ? searchAutoFocus : undefined;
      return h(TagInput, {
        maxTagCount,
        disabled,
        onInputChange: (v: string) => search(v),
        ref: tagInputRef,
        placeholder,
        value: triggerRenderKeys,
        inputValue,
        size,
        showRestTagsPopover,
        restTagsPopoverProps,
        autoFocus,
        renderTagItem: (itemKey: string, index: number) => renderTagItem(itemKey, index),
        onRemove: (itemKey: string) => removeTag(itemKey),
        expandRestTagsOnClick: false,
        preventScroll,
      });
    };

    /* ------------------------------------------------------------------ */
    /* render helpers – dropdown                                           */
    /* ------------------------------------------------------------------ */
    const renderInput = () => {
      const { searchPlaceholder, searchRender, showSearchClear, searchPosition, searchAutoFocus, multiple, disabled, preventScroll } = props;
      const { inputValue, inputTriggerFocus } = state;
      const isDropdownPositionSearch = searchPosition === strings.SEARCH_POSITION_DROPDOWN;
      const inputcls = cls({ [`${prefixTree}-input`]: isDropdownPositionSearch, [`${prefixcls}-inputTrigger`]: !isDropdownPositionSearch });
      const baseInputProps: Record<string, any> = { value: inputValue, className: inputcls, preventScroll, onChange: (value: string) => search(value) };
      const inputDropdownProps: Record<string, any> = { showClear: showSearchClear, prefix: h(IconSearch) };
      const inputTriggerProps: Record<string, any> = { autofocus: searchAutoFocus, onFocus: () => foundation.handleInputTriggerFocus(), onBlur: () => foundation.handleInputTriggerBlur(), disabled };
      const realInputProps = isDropdownPositionSearch ? inputDropdownProps : inputTriggerProps;
      const wrapperCls = cls({
        [`${prefixTree}-search-wrapper`]: isDropdownPositionSearch,
        [`${prefixcls}-triggerSingleSearch-wrapper`]: !isDropdownPositionSearch && !multiple,
        [`${prefixcls}-triggerSingleSearch-upper`]: !isDropdownPositionSearch && inputTriggerFocus,
      });
      const useCusSearch = typeof searchRender === 'function' || typeof searchRender === 'boolean' || Boolean(slots.searchRender);
      if (useCusSearch && !searchRender && !slots.searchRender) return null;
      const placeholder = isDropdownPositionSearch ? searchPlaceholder || treeSelectLocale.value?.searchPlaceholder : '';
      let inner: VNodeChild;
      if (slots.searchRender) {
        inner = slots.searchRender({ ...realInputProps, ...baseInputProps, placeholder });
      } else if (useCusSearch) {
        inner = (searchRender as any)({ ...realInputProps, ...baseInputProps, placeholder });
      } else {
        const { className: inputClassName, onChange, ...restBase } = baseInputProps;
        const { autofocus, ...restReal } = realInputProps;
        inner = h(Input, { 'aria-label': 'Filter TreeSelect item', ref: inputRef, placeholder, class: inputClassName, onChange, autoFocus: autofocus, ...restBase, ...restReal });
      }
      return h('div', { class: wrapperCls }, [inner]);
    };

    const renderEmpty = () => {
      const hasSlot = Boolean(slots.emptyContent);
      const { emptyContent } = props;
      if (emptyContent === null && !hasSlot) return null;
      const content = hasSlot ? slots.emptyContent!() : emptyContent;
      if (content) return h(TreeNode, { empty: true, emptyContent: content });
      return h(TreeNode, { empty: true, emptyContent: treeLocale.value?.emptyText });
    };

    const renderTreeNode = (treeNode: any, _ind?: number, style?: any) => {
      const { data, key } = treeNode;
      const treeNodeProps = foundation.getTreeNodeProps(key);
      const { showLine, keyMaps } = props;
      if (!treeNodeProps) return null;
      const picked: Record<string, any> = _pick(treeNode, ['key', 'label', 'disabled', 'isLeaf', 'icon', 'isEnd']);
      const children = data[_get(keyMaps, 'children', 'children')];
      !_isUndefined(children) && (picked.children = children);
      const { key: _k, ...rest } = { ...treeNodeProps, ...data, ...picked } as any;
      return h(TreeNode, { ...rest, key, data, style, showLine, expandIcon: getExpandIcon() });
    };

    const renderNodeList = (): VNodeChild => {
      const { flattenNodes, cachedFlattenNodes, motionKeys, motionType, filteredKeys } = state;
      const direction = configContext.direction;
      const { virtualize, motionExpand } = props;
      const isExpandControlled = 'expandedKeys' in (propsView as any);
      if (!virtualize || _isEmpty(virtualize)) {
        return h(NodeList, {
          flattenNodes,
          flattenList: cachedFlattenNodes,
          motionKeys: motionExpand ? motionKeys : new Set<string>(),
          motionType,
          searchTargetIsDeep: isExpandControlled && motionExpand && _isEmpty(motionKeys) && !_isEmpty(filteredKeys),
          onMotionEnd,
          renderTreeNode,
        });
      }
      return h(
        'div',
        { style: { height: typeof virtualize.height === 'number' ? `${virtualize.height}px` : virtualize.height || '100%', overflow: 'visible' }, class: `${prefixTree}-auto-wrapper` },
        [
          h(
            TreeVirtualList,
            {
              itemCount: flattenNodes.length,
              itemSize: virtualize.itemSize,
              height: virtualize.height ?? '100%',
              width: virtualize.width ?? '100%',
              itemData: flattenNodes,
              className: `${prefixTree}-virtual-list`,
              style: { direction } as any,
            },
            { default: ({ index, style, data }: any) => renderTreeNode(data[index], index, style) }
          ),
        ]
      );
    };

    const context = reactive<TreeContextValue>({
      get loadData() {
        return props.loadData;
      },
      get treeDisabled() {
        return props.disabled;
      },
      get motion() {
        return props.motionExpand;
      },
      get motionKeys() {
        return state.motionKeys;
      },
      get motionType() {
        return state.motionType;
      },
      get expandAction() {
        return props.expandAction;
      },
      get filterTreeNode() {
        return props.filterTreeNode;
      },
      get keyEntities() {
        return state.keyEntities;
      },
      onNodeClick: undefined,
      onNodeDoubleClick: undefined,
      onNodeRightClick: _noop,
      onNodeExpand,
      onNodeSelect,
      onNodeCheck,
      renderTreeNode,
      get multiple() {
        return props.multiple;
      },
      get showFilteredOnly() {
        return props.showFilteredOnly;
      },
      get isSearching() {
        return Boolean(state.inputValue);
      },
      get renderLabel() {
        return getRenderLabel();
      },
      get renderFullLabel() {
        return getRenderFullLabel();
      },
      get labelEllipsis() {
        return typeof props.labelEllipsis === 'undefined' ? props.virtualize : props.labelEllipsis;
      },
      onNodeLoad,
    } as any);
    provideTreeContext(context);

    const renderLoading = () => h('div', { class: `${prefixcls}-loading-wrapper`, style: { padding: '8px 16px', cursor: 'not-allowed', display: 'flex', alignItems: 'center' } }, [h(Spin)]);

    const renderTree = () => {
      const { inputValue, filteredKeys, flattenNodes, checkedKeys, realCheckedKeys } = state;
      const { filterTreeNode, multiple, showFilteredOnly, optionListStyle, searchPosition, checkRelation, emptyContent, loading } = props;
      const outerTopSlot = renderSlotOrProp(slots, 'outerTopSlot', props.outerTopSlot);
      const outerBottomSlot = renderSlotOrProp(slots, 'outerBottomSlot', props.outerBottomSlot);
      const wrapperCls = cls(`${prefixTree}-wrapper`);
      const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
      const noData = _isEmpty(flattenNodes) || (showFilteredOnly && searchNoRes);
      const isDropdownPositionSearch = searchPosition === strings.SEARCH_POSITION_DROPDOWN;
      const listCls = cls(`${prefixTree}-option-list ${prefixTree}-option-list-block`, { [`${prefixTree}-option-list-hidden`]: emptyContent === null && !slots.emptyContent && noData });
      return h('div', { class: wrapperCls }, [
        normalizeNode(outerTopSlot),
        !outerTopSlot && filterTreeNode && isDropdownPositionSearch ? renderInput() : null,
        h('div', { class: listCls, role: 'tree', 'aria-multiselectable': multiple ? true : false, style: optionListStyle }, [
          loading
            ? renderLoading()
            : noData
            ? renderEmpty()
            : multiple
              ? h(CheckboxGroup, { value: Array.from(checkRelation === 'related' ? checkedKeys : realCheckedKeys) }, { default: () => renderNodeList() })
              : renderNodeList(),
        ]),
        normalizeNode(outerBottomSlot),
      ]);
    };

    const renderContent = () => {
      const { dropdownMinWidth } = state;
      const { dropdownStyle, dropdownClassName } = props;
      const style = { minWidth: typeof dropdownMinWidth === 'number' ? `${dropdownMinWidth}px` : dropdownMinWidth, ...(dropdownStyle || {}) };
      const popoverCls = cls(dropdownClassName, `${prefixcls}-popover`);
      return h('div', { class: popoverCls, style, onKeydown: foundation.handleKeyDown, ref: optionContainerEl }, [renderTree()]);
    };

    const renderSelection = () => {
      const { disabled, multiple, filterTreeNode, validateStatus, size, className, placeholder, showClear, leafOnly, searchPosition, triggerRender, borderless, autoMergeValue, checkRelation, triggerTagWrap } = props;
      const { inputValue, selectedKeys, checkedKeys, keyEntities, isFocus, realCheckedKeys } = state;
      const prefix = slots.prefix || props.prefix;
      const suffix = slots.suffix || props.suffix;
      const insetLabel = slots.insetLabel || props.insetLabel;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const filterable = Boolean(filterTreeNode);
      const useCustomTrigger = typeof triggerRender === 'function' || Boolean(slots.triggerRender);
      const mouseEvent = showClear ? { onMouseenter: handleMouseOver, onMouseleave: handleMouseLeave } : {};
      const isTriggerPositionSearch = searchPosition === strings.SEARCH_POSITION_TRIGGER && filterable;
      const isEmptyTriggerSearch = isTriggerPositionSearch && _isEmpty(checkedKeys);
      const isValueTriggerSearch = isTriggerPositionSearch && !_isEmpty(checkedKeys);
      const classNames = useCustomTrigger
        ? cls(className, attrClass)
        : cls(
            prefixcls,
            {
              [`${prefixcls}-borderless`]: borderless,
              [`${prefixcls}-focus`]: isFocus,
              [`${prefixcls}-disabled`]: disabled,
              [`${prefixcls}-single`]: !multiple,
              [`${prefixcls}-multiple`]: multiple,
              [`${prefixcls}-multiple-tagInput-empty`]: multiple && isEmptyTriggerSearch,
              [`${prefixcls}-multiple-tagInput-notEmpty`]: multiple && isValueTriggerSearch,
              [`${prefixcls}-filterable`]: filterable,
              [`${prefixcls}-error`]: validateStatus === 'error',
              [`${prefixcls}-warning`]: validateStatus === 'warning',
              [`${prefixcls}-small`]: size === 'small',
              [`${prefixcls}-large`]: size === 'large',
              [`${prefixcls}-with-prefix`]: prefix || insetLabel,
              [`${prefixcls}-with-suffix`]: suffix,
              [`${prefixcls}-triggerTagWrap`]: Boolean(triggerTagWrap) && multiple && isTriggerPositionSearch,
            },
            className,
            attrClass
          );
      let triggerRenderKeys: string[] = [];
      if (multiple) {
        if (!autoMergeValue) triggerRenderKeys = [...checkedKeys];
        else if (checkRelation === 'related') triggerRenderKeys = normalizeKeyList([...checkedKeys], keyEntities, leafOnly, true);
        else if (checkRelation === 'unRelated') triggerRenderKeys = [...realCheckedKeys];
      } else {
        triggerRenderKeys = selectedKeys;
      }
      let inner: any;
      if (useCustomTrigger) {
        const triggerProps = {
          inputValue,
          value: triggerRenderKeys.map((key) => _get(keyEntities, [key, 'data'])),
          disabled,
          placeholder,
          onClear: handleClear,
          componentName: 'TreeSelect',
          componentProps: { ...props },
          onSearch: search,
          onRemove: removeTag,
        };
        inner = slots.triggerRender ? slots.triggerRender(triggerProps) : triggerRender!(triggerProps);
      } else {
        inner = [
          prefix || insetLabel ? renderPrefix() : null,
          h('div', { class: `${prefixcls}-selection` }, [renderSelectContent(triggerRenderKeys)]),
          suffix ? renderSuffix() : null,
          showClear || (isTriggerPositionSearch && inputValue) ? renderClearBtn() : null,
          renderArrow(),
        ];
      }
      const tabIndex = disabled ? null : 0;
      return h(
        'div',
        {
          role: 'combobox',
          'aria-disabled': disabled,
          'aria-haspopup': 'tree',
          tabindex: tabIndex,
          class: classNames,
          style: attrStyle,
          ref: triggerRef,
          onClick: handleClick,
          onKeypress: handleSelectionEnterPress,
          onKeydown: foundation.handleKeyDown,
          'aria-invalid': props.ariaInvalid ?? restAttrs['aria-invalid'],
          'aria-errormessage': props.ariaErrormessage ?? restAttrs['aria-errormessage'],
          'aria-label': props.ariaLabel ?? restAttrs['aria-label'],
          'aria-labelledby': props.ariaLabelledby ?? restAttrs['aria-labelledby'],
          'aria-describedby': props.ariaDescribedby ?? restAttrs['aria-describedby'],
          'aria-required': props.ariaRequired ?? restAttrs['aria-required'],
          ...mouseEvent,
          ...getDataAttr(restAttrs),
        },
        inner
      );
    };

    expose({ search, close, open: () => foundation.open(), foundation, state, triggerRef });

    return () => {
      const { motion, zIndex, mouseLeaveDelay, mouseEnterDelay, autoAdjustOverflow, stopPropagation, getPopupContainer, dropdownMargin, position } = props;
      const { isOpen, rePosKey } = state;
      const pos = position ? position : 'bottomLeft';
      return h(
        Popover,
        {
          stopPropagation: Boolean(stopPropagation),
          getPopupContainer,
          zIndex,
          motion,
          margin: dropdownMargin as any,
          ref: optionsRef,
          visible: isOpen,
          trigger: 'custom',
          rePosKey,
          position: pos as any,
          autoAdjustOverflow,
          mouseLeaveDelay,
          mouseEnterDelay,
          onVisibleChange: handlePopoverVisibleChange,
          onAfterClose: afterClose,
        },
        { default: () => renderSelection(), content: () => renderContent() }
      );
    };
  },
});
(TreeSelect as any).elementType = 'TreeSelect';

export { strings as treeSelectStrings };
export default TreeSelect;
