import { defineComponent, h, ref, reactive, watch, onMounted, onBeforeUnmount, toRaw, nextTick, isVNode, cloneVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import _isUndefined from 'lodash/isUndefined';
import _isNull from 'lodash/isNull';
import _isNumber from 'lodash/isNumber';
import _isString from 'lodash/isString';
import _isFunction from 'lodash/isFunction';
import _isObject from 'lodash/isObject';
import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _isEmpty from 'lodash/isEmpty';
import _includes from 'lodash/includes';
import _assign from 'lodash/assign';
import _noop from 'lodash/noop';
import cls from 'classnames';
import CascaderFoundation from '@douyinfe/semi-foundation/lib/es/cascader/foundation';
import { calcMergeType, convertDataToEntities, getValueOrKey, getKeyByValuePath } from '@douyinfe/semi-foundation/lib/es/cascader/util';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/cascader/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import { calcCheckedKeys, calcDisabledKeys, normalizeKeyList, findDescendantKeys, calcCheckedKeysForChecked, calcCheckedKeysForUnchecked } from '@douyinfe/semi-foundation/lib/es/tree/treeUtil';
import isEnterPress from '@douyinfe/semi-foundation/lib/es/utils/isEnterPress';
import '@douyinfe/semi-foundation/lib/es/cascader/cascader.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, isSemiIcon, renderSlotOrProp } from '../_utils';
import Input from '../input/Input';
import Tag from '../tag/Tag';
import TagInput from '../tagInput/TagInput';
import Popover from '../popover/Popover';
import Checkbox from '../checkbox/Checkbox';
import Spin from '../spin/Spin';
import { IconChevronDown, IconClear, IconChevronRight, IconTick } from '../icons/generated';
import VirtualList from '../select/VirtualList';

const prefixcls = cssClasses.PREFIX;
const prefixOption = cssClasses.PREFIX_OPTION;

export type CascaderSize = (typeof strings.SIZE_SET)[number];
export type CascaderValidateStatus = (typeof strings.VALIDATE_STATUS)[number];
export interface CascaderData {
  [x: string]: any;
  value?: string | number;
  label?: any;
  children?: CascaderData[];
  disabled?: boolean;
  isLeaf?: boolean;
}
export interface CascaderEntity {
  [x: string]: any;
  data: CascaderData;
  key: string;
  valuePath: any[];
  path: string[];
  parentKey: string | null;
  level: number;
  ind: number;
  pos: string;
  children?: CascaderEntity[];
  _notExist?: boolean;
}
export type CascaderValue = string | number | Array<string | number>;

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const cascaderProps = {
  ariaLabelledby: { type: String, default: undefined },
  ariaInvalid: { type: Boolean, default: undefined },
  ariaErrormessage: { type: String, default: undefined },
  ariaDescribedby: { type: String, default: undefined },
  ariaRequired: { type: Boolean, default: undefined },
  ariaLabel: { type: String, default: 'Cascader' },
  arrowIcon: { ...nodeProp, default: () => h(IconChevronDown) },
  className: { type: String, default: undefined },
  clearIcon: nodeProp,
  borderless: { type: Boolean, default: false },
  changeOnSelect: { type: Boolean, default: false },
  checkRelation: { type: String as PropType<'related' | 'unRelated'>, default: 'related' },
  defaultValue: { type: [String, Number, Array] as PropType<CascaderValue>, default: undefined },
  value: { type: [String, Number, Array] as PropType<CascaderValue>, default: undefined },
  modelValue: { type: [String, Number, Array] as PropType<CascaderValue>, default: undefined },
  onChangeWithObject: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMargin: { type: [Number, Object] as PropType<number | Record<string, number>>, default: undefined },
  emptyContent: nodeProp,
  motion: { type: Boolean, default: true },
  mouseEnterDelay: { type: Number, default: undefined },
  mouseLeaveDelay: { type: Number, default: undefined },
  filterTreeNode: { type: [Boolean, Function] as PropType<boolean | ((inputValue: string, treeNodeString: string, data?: CascaderData) => boolean)>, default: false },
  filterLeafOnly: { type: Boolean, default: true },
  filterRender: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  filterSorter: { type: Function as PropType<(a: any, b: any, inputValue: string) => number>, default: undefined },
  placeholder: { type: String, default: undefined },
  searchPlaceholder: { type: String, default: undefined },
  size: { type: String as PropType<CascaderSize>, default: 'default' },
  treeData: { type: Array as PropType<CascaderData[]>, default: () => [] },
  treeNodeFilterProp: { type: String, default: 'label' },
  suffix: nodeProp,
  prefix: nodeProp,
  insetLabel: nodeProp,
  insetLabelId: { type: String, default: undefined },
  id: { type: String, default: undefined },
  displayProp: { type: String, default: 'label' },
  displayRender: { type: Function as PropType<(displayPath: any[]) => VNodeChild>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  zIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
  validateStatus: { type: String as PropType<CascaderValidateStatus>, default: undefined },
  showNext: { type: String as PropType<'click' | 'hover'>, default: strings.SHOW_NEXT_BY_CLICK as 'click' },
  stopPropagation: { type: [Boolean, String] as PropType<boolean | string>, default: true },
  showClear: { type: Boolean, default: false },
  defaultOpen: { type: Boolean, default: false },
  autoAdjustOverflow: { type: Boolean, default: true },
  autoClearSearchValue: { type: Boolean, default: true },
  triggerRender: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  bottomSlot: nodeProp,
  topSlot: nodeProp,
  multiple: { type: Boolean, default: false },
  autoMergeValue: { type: Boolean, default: true },
  maxTagCount: { type: Number, default: undefined },
  showRestTagsPopover: { type: Boolean, default: false },
  restTagsPopoverProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  max: { type: Number, default: undefined },
  separator: { type: String, default: ' / ' },
  loadData: { type: Function as PropType<(selectOptions: CascaderData[]) => Promise<void>>, default: undefined },
  loadedKeys: { type: Array as PropType<string[]>, default: undefined },
  disableStrictly: { type: Boolean, default: false },
  leafOnly: { type: Boolean, default: false },
  enableLeafClick: { type: Boolean, default: false },
  clickToSelect: { type: Boolean, default: false },
  preventScroll: { type: Boolean, default: false },
  position: { type: String, default: undefined },
  searchPosition: { type: String as PropType<'trigger' | 'custom'>, default: strings.SEARCH_POSITION_TRIGGER as 'trigger' },
  remote: { type: Boolean, default: false },
  keyMaps: { type: Object as PropType<Record<string, string>>, default: undefined },
  expandIcon: nodeProp,
  virtualizeInSearch: { type: Object as PropType<{ itemSize: number; height: number | string; width?: number | string }>, default: undefined },
};

export const cascaderEmits = ['update:value', 'update:modelValue', 'change', 'select', 'search', 'blur', 'focus', 'dropdownVisibleChange', 'load', 'listScroll', 'exceed', 'clear'];

/* ------------------------------------------------------------------ */
/* CascaderItem (React `cascader/item.js`)                              */
/* ------------------------------------------------------------------ */
const CascaderItem = defineComponent({
  name: 'CascaderItem',
  props: {
    activeKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    selectedKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    separator: { type: String, default: ' / ' },
    loadedKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    loadingKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    onItemClick: { type: Function as PropType<(e: any, item: CascaderEntity) => void>, default: undefined },
    onItemHover: { type: Function as PropType<(e: any, item: CascaderEntity) => void>, default: undefined },
    showNext: { type: String, default: 'click' },
    onItemCheckboxClick: { type: Function as PropType<(item: CascaderEntity) => void>, default: undefined },
    onListScroll: { type: Function as PropType<(e: Event, ind: number) => void>, default: undefined },
    searchable: { type: Boolean, default: false },
    keyword: { type: String, default: '' },
    emptyContent: nodeProp,
    loadData: { type: Function as PropType<(data: CascaderData[]) => Promise<void>>, default: undefined },
    data: { type: Array as PropType<CascaderEntity[]>, default: () => [] },
    multiple: { type: Boolean, default: false },
    checkedKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    halfCheckedKeys: { type: Object as PropType<Set<string>>, default: () => new Set() },
    filterRender: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
    virtualize: { type: Object as PropType<any>, default: undefined },
    expandIcon: nodeProp,
  },
  setup(props, { slots }) {
    const configContext = useConfigContext();
    const { locale } = useLocale('Cascader');

    const onClick = (e: any, item: CascaderEntity) => {
      if (item.data.disabled || ('disabled' in item && item.disabled)) return;
      props.onItemClick?.(e, item);
    };
    const handleItemEnterPress = (keyboardEvent: KeyboardEvent, item: CascaderEntity) => {
      if (isEnterPress(keyboardEvent)) onClick(keyboardEvent, item);
    };
    const onHover = (e: any, item: CascaderEntity) => {
      if (item.data.disabled) return;
      if (props.showNext === strings.SHOW_NEXT_BY_HOVER) props.onItemHover?.(e, item);
    };
    const onCheckboxChange = (e: any, item: CascaderEntity) => {
      e.stopPropagation();
      typeof e.stopImmediatePropagation === 'function' && e.stopImmediatePropagation();
      props.onItemCheckboxClick?.(item);
    };

    const getItemStatus = (key: string) => ({
      active: props.activeKeys.has(key),
      selected: props.selectedKeys.has(key),
      loading: props.loadingKeys.has(key) && !props.loadedKeys.has(key),
    });

    const renderIcon = (type: 'child' | 'tick' | 'loading' | 'empty', haveMarginLeft = false) => {
      const finalCls = (style: string) => style + (haveMarginLeft ? ` ${prefixOption}-icon-left` : '');
      switch (type) {
        case 'child':
          return props.expandIcon ? normalizeNode(typeof props.expandIcon === 'function' ? props.expandIcon() : props.expandIcon) : h(IconChevronRight, { class: finalCls(`${prefixOption}-icon ${prefixOption}-icon-expand`) });
        case 'tick':
          return h(IconTick, { class: finalCls(`${prefixOption}-icon ${prefixOption}-icon-active`) });
        case 'loading':
          return h(Spin, { wrapperClassName: finalCls(`${prefixOption}-spin-icon`) });
        case 'empty':
          return h('span', { 'aria-hidden': true, class: finalCls(`${prefixOption}-icon ${prefixOption}-icon-empty`) });
        default:
          return null;
      }
    };

    const highlight = (searchText: any[]) => {
      const content: VNodeChild[] = [];
      const { keyword, separator } = props;
      searchText.forEach((item: any, idx: number) => {
        if (typeof item === 'string' && keyword) {
          const lowerItem = item.toLowerCase();
          const lowerKeyword = keyword.toLowerCase();
          let searchFrom = 0;
          let keyIndex = 0;
          for (;;) {
            const matchIndex = lowerItem.indexOf(lowerKeyword, searchFrom);
            if (matchIndex === -1) {
              const rest = item.slice(searchFrom);
              if (rest) content.push(rest);
              break;
            }
            const before = item.slice(searchFrom, matchIndex);
            if (before) content.push(before);
            content.push(h('span', { class: `${prefixOption}-label-highlight`, key: `${idx}-${matchIndex}-${keyIndex}` }, item.slice(matchIndex, matchIndex + keyword.length)));
            searchFrom = matchIndex + keyword.length;
            keyIndex++;
          }
        } else {
          content.push(item);
        }
        if (idx !== searchText.length - 1) content.push(separator);
      });
      return content;
    };

    const renderFlattenOptionItem = (data: any, index: number, style?: CSSProperties) => {
      const { multiple, selectedKeys, checkedKeys, halfCheckedKeys, keyword, filterRender, virtualize } = props;
      const { searchText, key, disabled, pathData } = data;
      const selected = selectedKeys.has(key);
      const className = cls(prefixOption, {
        [`${prefixOption}-flatten`]: true && !filterRender,
        [`${prefixOption}-disabled`]: disabled,
        [`${prefixOption}-select`]: selected && !multiple,
      });
      const handleClick = (e: any) => onClick(e, data);
      const handleKeyPress = (e: KeyboardEvent) => handleItemEnterPress(e, data);
      const onCheck = (e: any) => onCheckboxChange(e, data);
      if (filterRender) {
        const itemProps = {
          className,
          inputValue: keyword,
          disabled,
          data: pathData,
          checkStatus: { checked: checkedKeys.has(data.key), halfChecked: halfCheckedKeys.has(data.key) },
          selected,
          onClick: handleClick,
          onCheck,
        };
        const item: any = filterRender(itemProps);
        const node = Array.isArray(item) ? item[0] : item;
        const otherProps: Record<string, any> = { key };
        if (virtualize && isVNode(node)) {
          otherProps.style = { ...((node.props as any)?.style ?? {}), ...(style || {}) };
        }
        return isVNode(node) ? cloneVNode(node, otherProps) : h('span', { key }, node);
      }
      return h(
        'li',
        { role: 'menuitem', class: className, style, key, onClick: handleClick, onKeypress: handleKeyPress },
        [
          h('span', { class: `${prefixOption}-label` }, [
            !multiple && renderIcon('empty'),
            multiple &&
              h('div', { role: 'none', onClick: onCheck }, [
                h(Checkbox, { onChange: onCheck, disabled, indeterminate: halfCheckedKeys.has(data.key), checked: checkedKeys.has(data.key), class: `${prefixOption}-label-checkbox` }),
              ]),
            highlight(searchText),
          ]),
        ]
      );
    };

    const renderFlattenOption = (data: any[]) => {
      const { virtualize } = props;
      if (virtualize && virtualize.itemSize) {
        const height = typeof virtualize.height === 'number' ? virtualize.height : Number.parseInt(String(virtualize.height ?? 270), 10) || 270;
        return h('ul', { class: `${prefixOption}-list`, key: 'flatten-list' }, [
          h(VirtualList, {
            height,
            width: virtualize.width ?? '100%',
            itemSize: virtualize.itemSize,
            itemCount: data.length,
            renderItem: (i: number, style: CSSProperties) => renderFlattenOptionItem(data[i], i, style),
          }),
        ]);
      }
      return h('ul', { class: `${prefixOption}-list`, key: 'flatten-list' }, data.map((item, i) => renderFlattenOptionItem(item, i)));
    };

    const renderItem = (renderData: CascaderEntity[], content: VNodeChild[] = []): VNodeChild[] => {
      const { multiple, checkedKeys, halfCheckedKeys } = props;
      let showChildItem: CascaderEntity | undefined;
      const ind = content.length;
      content.push(
        h(
          'ul',
          { role: 'menu', class: `${prefixOption}-list`, key: renderData[0].key, onScroll: (e: Event) => props.onListScroll?.(e, ind) },
          renderData.map((item) => {
            const { data, key, parentKey } = item;
            const { children, label, disabled, isLeaf } = data;
            const { active, selected, loading } = getItemStatus(key);
            const hasChild = Boolean(children) && children.length;
            const showExpand = hasChild || (props.loadData && !isLeaf);
            if (active && hasChild) showChildItem = item;
            const className = cls(prefixOption, {
              [`${prefixOption}-active`]: active && !selected,
              [`${prefixOption}-select`]: selected && !multiple,
              [`${prefixOption}-disabled`]: disabled,
            });
            const otherAriaProps: Record<string, any> = parentKey ? { 'aria-owns': `cascaderItem-${parentKey}` } : {};
            return h(
              'li',
              {
                role: 'menuitem',
                id: `cascaderItem-${key}`,
                'aria-expanded': active,
                'aria-haspopup': Boolean(showExpand),
                'aria-disabled': disabled,
                ...otherAriaProps,
                class: className,
                key,
                onClick: (e: any) => onClick(e, item),
                onKeypress: (e: KeyboardEvent) => handleItemEnterPress(e, item),
                onMouseenter: (e: any) => onHover(e, item),
              },
              [
                h('span', { class: `${prefixOption}-label` }, [
                  selected && !multiple && renderIcon('tick'),
                  !selected && !multiple && renderIcon('empty'),
                  multiple &&
                    h('div', { role: 'none', onClick: (e: any) => onCheckboxChange(e, item) }, [
                      h(Checkbox, { onChange: (e: any) => onCheckboxChange(e, item), disabled, indeterminate: halfCheckedKeys.has(item.key), checked: checkedKeys.has(item.key), class: `${prefixOption}-label-checkbox` }),
                    ]),
                  h('span', null, [normalizeNode(label)]),
                ]),
                showExpand ? renderIcon(loading ? 'loading' : 'child', true) : null,
              ]
            );
          })
        )
      );
      if (showChildItem) {
        content.concat(renderItem(showChildItem.children, content));
      }
      return content;
    };

    const renderEmpty = () => {
      const emptyContent = renderSlotOrProp(slots, 'emptyContent', props.emptyContent);
      if (emptyContent === null && !slots.emptyContent) return null;
      return h('ul', { class: `${prefixOption} ${prefixOption}-empty`, key: 'empty-list' }, [
        h('span', { class: `${prefixOption}-label`, 'x-semi-prop': 'emptyContent' }, [emptyContent ? normalizeNode(emptyContent) : locale.value?.emptyText]),
      ]);
    };

    return () => {
      const { data, searchable } = props;
      const direction = configContext.direction;
      const isEmpty = !data || !data.length;
      let content: VNodeChild;
      const listsCls = cls({
        [`${prefixOption}-lists`]: true,
        [`${prefixOption}-lists-rtl`]: direction === 'rtl',
        [`${prefixOption}-lists-empty`]: isEmpty,
      });
      if (isEmpty) content = renderEmpty();
      else content = searchable ? renderFlattenOption(data) : renderItem(data);
      return h('div', { class: listsCls }, content);
    };
  },
});

/* ------------------------------------------------------------------ */
/* Cascader                                                             */
/* ------------------------------------------------------------------ */
const Cascader = defineComponent({
  name: 'Cascader',
  inheritAttrs: false,
  props: cascaderProps,
  emits: cascaderEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const configContext = useConfigContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, any>(
      props as any,
      {
        emptyContentMinWidth: null as any,
        disabledKeys: new Set<string>(),
        isOpen: props.defaultOpen,
        rePosKey: 0,
        keyEntities: {} as Record<string, CascaderEntity>,
        selectedKeys: new Set<string>(),
        activeKeys: new Set<string>(),
        filteredKeys: new Set<string>(),
        inputValue: '',
        isSearching: false,
        inputPlaceHolder: props.searchPlaceholder || props.placeholder,
        prevProps: {} as any,
        isHovering: false,
        checkedKeys: new Set<string>(),
        halfCheckedKeys: new Set<string>(),
        resolvedCheckedKeys: new Set<string>(),
        loadedKeys: new Set<string>(),
        loadingKeys: new Set<string>(),
        loading: false,
        showInput: false,
        treeData: props.treeData,
      },
      { modelProp: 'value' }
    );
    const inputRef = ref<any>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const optionsRef = ref<any>(null);
    const optionContainerEl = ref<HTMLElement | null>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    const loadingKeysRef = { current: new Set<string>() };
    const loadedKeysRef = { current: new Set<string>() };
    let mergeType = calcMergeType(props.autoMergeValue, props.leafOnly);

    const callbackProps: Record<string, (...args: any[]) => void> = {
      onLoad: (...args: any[]) => emit('load', ...args),
      onExceed: (data: any) => emit('exceed', data),
      onClear: () => emit('clear'),
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
      updateInputPlaceHolder: (value: string) => {
        state.inputPlaceHolder = value;
      },
      focusInput: () => {
        inputRef.value?.focus?.({ preventScroll: props.preventScroll });
      },
      blurInput: () => {
        inputRef.value?.blur?.();
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
      setEmptyContentMinWidth: (minWidth: any) => {
        state.emptyContentMinWidth = minWidth;
      },
      getTriggerWidth: () => {
        const el = triggerRef.value;
        return el && el.getBoundingClientRect().width;
      },
      updateStates: (states: Record<string, any>) => {
        Object.assign(state, states);
      },
      openMenu: () => {
        state.isOpen = true;
      },
      closeMenu: (cb?: () => void) => {
        state.isOpen = false;
        cb && cb();
      },
      updateSelection: (selectedKeys: Set<string>) => {
        state.selectedKeys = selectedKeys;
      },
      notifyChange: (value: any) => {
        emit('update:value', value);
        emit('update:modelValue', value);
        emit('change', value);
      },
      notifySelect: (selected: any) => {
        emit('select', selected);
      },
      notifyOnSearch: (input: string) => {
        emit('search', input);
      },
      notifyFocus: (...args: any[]) => emit('focus', ...args),
      notifyBlur: (...args: any[]) => emit('blur', ...args),
      notifyDropdownVisibleChange: (visible: boolean) => {
        emit('dropdownVisibleChange', visible);
      },
      toggleHovering: (bool: boolean) => {
        state.isHovering = bool;
      },
      notifyLoadData: (selectedOpt: any[], callback: () => void) => {
        const { loadData } = props;
        if (loadData) {
          new Promise<void>((resolve) => {
            loadData(selectedOpt).then(() => {
              setTimeout(() => {
                callback();
                state.loading = false;
                resolve();
              });
            });
          });
        }
      },
      notifyOnLoad: (newLoadedKeys: Set<string>, data: any) => {
        emit('load', newLoadedKeys, data);
      },
      notifyListScroll: (e: any, { panelIndex, activeNode }: { panelIndex: number; activeNode: any }) => {
        emit('listScroll', e, { panelIndex, activeNode });
      },
      notifyOnExceed: (data: any) => emit('exceed', data),
      notifyClear: () => emit('clear'),
      toggleInputShow: (showInput: boolean, cb: () => void) => {
        state.showInput = showInput;
        cb();
      },
      updateFocusState: (isFocus: boolean) => {
        state.isFocus = isFocus;
      },
      updateLoadingKeyRefValue: (keys: Set<string>) => {
        loadingKeysRef.current = keys;
      },
      getLoadingKeyRefValue: () => loadingKeysRef.current,
      updateLoadedKeyRefValue: (keys: Set<string>) => {
        loadedKeysRef.current = keys;
      },
      getLoadedKeyRefValue: () => loadedKeysRef.current,
    };
    (state as any).isFocus = false;
    const foundation = new (CascaderFoundation as any)(adapter);

    /* ------------------------------------------------------------------ */
    /* getDerivedStateFromProps (multiple) + componentDidUpdate (single)   */
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
      if (!props.multiple) return;
      const p: any = propsView;
      const prevProps = state.prevProps;
      const { multiple, value, defaultValue, onChangeWithObject, leafOnly, autoMergeValue, checkRelation, searchPlaceholder, placeholder, keyMaps } = props;
      let keyEntities = state.keyEntities || {};
      const newState: Record<string, any> = {};
      const newPlaceholder = searchPlaceholder || placeholder;
      if (newPlaceholder !== state.inputPlaceHolder) {
        newState.inputPlaceHolder = newPlaceholder;
      }
      const needUpdate = (name: string) => {
        const firstInProps = _isEmpty(prevProps) && name in p;
        const nameHasChange = prevProps && !_isEqual(prevProps[name], p[name]);
        return firstInProps || nameHasChange;
      };
      const needUpdateData = () => {
        const firstInProps = !prevProps && 'treeData' in p;
        const treeDataHasChange = prevProps && (prevProps.treeData !== props.treeData || treeDataDirty);
        return firstInProps || treeDataHasChange;
      };
      const getRealKeys = (realValue: any, keyEntities: Record<string, CascaderEntity>) => {
        let normalizedValue: any[] = [];
        if (Array.isArray(realValue)) {
          normalizedValue = Array.isArray(realValue[0]) ? realValue : [realValue];
        } else {
          if (realValue !== undefined) normalizedValue = [[realValue]];
        }
        const formatValuePath: any[][] = [];
        normalizedValue.forEach((valueItem) => {
          const formatItem = onChangeWithObject && _isObject(valueItem[0]) ? getValueOrKey(valueItem, keyMaps) : valueItem;
          formatItem.length > 0 && formatValuePath.push(formatItem);
        });
        const formatKeys = formatValuePath.reduce((acc: string[], cur: any[]) => {
          const key = getKeyByValuePath(cur);
          keyEntities[key] && acc.push(key);
          return acc;
        }, []);
        return formatKeys;
      };
      const needUpdateTreeData = needUpdate('treeData') || needUpdateData() || needUpdate('keyMaps');
      const needUpdateValue = needUpdate('value') || (_isEmpty(prevProps) && Boolean(defaultValue));
      if (needUpdateTreeData || needUpdateValue) {
        if (needUpdateTreeData) {
          newState.treeData = props.treeData;
          keyEntities = convertDataToEntities(props.treeData, keyMaps);
          newState.keyEntities = keyEntities;
        }
        let realKeys: any = state.checkedKeys;
        if (needUpdateValue) {
          const realValue = needUpdate('value') ? value : defaultValue;
          realKeys = getRealKeys(realValue, keyEntities);
        } else {
          if (needUpdateTreeData && 'value' in p) {
            realKeys = getRealKeys(value, keyEntities);
          }
        }
        if (realKeys && !Array.isArray(realKeys) && typeof (realKeys as any)[Symbol.iterator] === 'function') {
          realKeys = Array.from(realKeys as Iterable<string>);
        }

        if (checkRelation === strings.RELATED) {
          const calRes = calcCheckedKeys(realKeys, keyEntities);
          const checkedKeys = new Set(calRes.checkedKeys);
          const halfCheckedKeys = new Set(calRes.halfCheckedKeys);
          if (props.disableStrictly) {
            newState.disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
          }
          const isLeafOnlyMerge = calcMergeType(autoMergeValue, leafOnly) === strings.LEAF_ONLY_MERGE_TYPE;
          newState.checkedKeys = checkedKeys;
          newState.halfCheckedKeys = halfCheckedKeys;
          newState.resolvedCheckedKeys = new Set(normalizeKeyList(checkedKeys, keyEntities, isLeafOnlyMerge));
        } else {
          newState.checkedKeys = new Set(realKeys);
        }
        // Expand the first checked path so the dropdown shows the selected branch
        // (React collectOptions only does this for leaf selectedKeys; multiple
        // values are often non-leaf after autoMerge, so we seed activeKeys here).
        const pathSource: Iterable<string> = (newState.resolvedCheckedKeys as Set<string>) || (newState.checkedKeys as Set<string>) || [];
        const firstKey = [...pathSource][0];
        if (firstKey && keyEntities[firstKey] && Array.isArray(keyEntities[firstKey].path)) {
          newState.activeKeys = new Set(keyEntities[firstKey].path);
        }
        newState.prevProps = snapshotProps();
      }
      Object.assign(state, newState);
      treeDataDirty = false;

    };

    derive();
    watch(
      () => [
        props.treeData,
        props.value,
        (propsView as any).value,
        props.defaultValue,
        props.onChangeWithObject,
        props.leafOnly,
        props.autoMergeValue,
        props.checkRelation,
        props.searchPlaceholder,
        props.placeholder,
        props.keyMaps,
        props.disableStrictly,
      ],
      () => {
        treeDataDirty = true;
        derive();
      },
      { deep: true }
    );
    watch(
      () => [(propsView as any).value, props.treeData, props.keyMaps],
      () => {
        // componentDidUpdate for single mode
        state.treeData = props.treeData;
        if (props.multiple) {
          foundation.recalculateFilteredKeys();
          return;
        }
        foundation.collectOptions();
      },
      { deep: true }
    );
    // React flushes the didMount setState before paint; init synchronously in setup for the same effect
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());

    /* ------------------------------------------------------------------ */
    /* handlers                                                            */
    /* ------------------------------------------------------------------ */
    const search = (value: string) => foundation.handleInputChange(value);
    const handleTagRemoveInTrigger = (pos: string) => foundation.handleTagRemoveInTrigger(pos);
    const handleTagClose = (_tagChildren: any, e: any, tagKey?: string | number) => {
      const event = e && typeof e.preventDefault === 'function' ? e : _tagChildren && typeof _tagChildren.preventDefault === 'function' ? _tagChildren : null;
      event && event.preventDefault();
      const key = tagKey ?? (typeof _tagChildren === 'string' || typeof _tagChildren === 'number' ? _tagChildren : undefined);
      if (key == null || !state.keyEntities[key as string]) return;
      foundation.handleTagRemoveByKey(key);
    };
    const handleItemClick = (e: any, item: CascaderEntity) => foundation.handleItemClick(e, item);
    const handleItemHover = (e: any, item: CascaderEntity) => foundation.handleItemHover(e, item);
    const onItemCheckboxClick = (item: CascaderEntity) => foundation.onItemCheckboxClick(item);
    const handleListScroll = (e: Event, ind: number) => foundation.handleListScroll(e, ind);
    const handleMouseOver = () => foundation.toggleHoverState(true);
    const handleMouseLeave = () => foundation.toggleHoverState(false);
    const handleClear = (e: any) => {
      e && e.stopPropagation();
      foundation.handleClear();
    };
    const handleClearEnterPress = (e: any) => {
      e && e.stopPropagation();
      foundation.handleClearEnterPress(e);
    };

    const showClearBtn = () => {
      const { showClear, disabled, multiple } = props;
      const { selectedKeys, isOpen, isHovering, checkedKeys, inputValue } = state;
      const hasValue = selectedKeys.size;
      const multipleWithHaveValue = multiple && checkedKeys.size;
      return Boolean(showClear && (inputValue || hasValue || multipleWithHaveValue) && !disabled && (isOpen || isHovering));
    };

    /* ------------------------------------------------------------------ */
    /* render helpers                                                      */
    /* ------------------------------------------------------------------ */
    const renderTagItem = (nodeKey: string, idx: number) => {
      const { keyEntities, disabledKeys } = state;
      const { size, disabled, displayProp, displayRender, disableStrictly } = props;
      if (keyEntities[nodeKey]) {
        const isDisabled = disabled || keyEntities[nodeKey].data.disabled || (disableStrictly && disabledKeys.has(nodeKey));
        const tagCls = cls(`${prefixcls}-selection-tag`, { [`${prefixcls}-selection-tag-disabled`]: isDisabled });
        const slot = slots.displayRender;
        if (slot) {
          return slot({ item: keyEntities[nodeKey], index: idx });
        }
        if (_isFunction(displayRender)) {
          return displayRender(keyEntities[nodeKey], idx);
        }
        return h(Tag, {
          size: size === 'default' ? 'large' : size,
          key: `tag-${nodeKey}-${idx}`,
          color: 'white',
          tagKey: nodeKey,
          class: tagCls,
          closable: !isDisabled,
          onClose: (children: any, ev: any, key?: string | number) => handleTagClose(children, ev, key ?? nodeKey),
        }, () => keyEntities[nodeKey].data[displayProp]);
      }
      return null;
    };

    const renderPlusN = (hiddenTag: VNodeChild[]) => {
      const { disabled, showRestTagsPopover, restTagsPopoverProps } = props;
      const plusNCls = cls(`${prefixcls}-selection-n`, { [`${prefixcls}-selection-n-disabled`]: disabled });
      const renderPlusNChildren = h('span', { class: plusNCls }, [`+${hiddenTag.length}`]);
      return showRestTagsPopover
        ? h(Popover, { showArrow: true, trigger: 'hover', position: 'top', autoAdjustOverflow: true, ...restTagsPopoverProps }, { default: () => renderPlusNChildren, content: () => hiddenTag })
        : renderPlusNChildren;
    };

    const renderMultipleTags = () => {
      const { autoMergeValue, maxTagCount, checkRelation } = props;
      const { checkedKeys, resolvedCheckedKeys } = state;
      const realKeys = mergeType === strings.NONE_MERGE_TYPE || checkRelation === strings.UN_RELATED ? checkedKeys : resolvedCheckedKeys;
      const displayTag: VNodeChild[] = [];
      const hiddenTag: VNodeChild[] = [];
      [...realKeys].forEach((checkedKey, idx) => {
        const notExceedMaxTagCount = !_isNumber(maxTagCount) || maxTagCount >= idx + 1;
        const item = renderTagItem(checkedKey, idx);
        if (notExceedMaxTagCount) displayTag.push(item);
        else hiddenTag.push(item);
      });
      return [...displayTag, !_isEmpty(hiddenTag) ? renderPlusN(hiddenTag) : null];
    };

    const renderDisplayText = () => {
      const { displayProp, separator, displayRender } = props;
      const { selectedKeys } = state;
      let displayText: VNodeChild = '';
      if (selectedKeys.size) {
        const displayPath = foundation.getItemPropPath([...selectedKeys][0], displayProp);
        const slot = slots.displayRender;
        if (slot) {
          displayText = slot({ path: displayPath, index: 0 });
        } else if (displayRender && typeof displayRender === 'function') {
          displayText = displayRender(displayPath);
        } else {
          displayText = displayPath.map((path: any, index: number) => (index < displayPath.length - 1 ? [path, separator] : path));
        }
      }
      return displayText;
    };

    const renderTagInput = () => {
      const { size, disabled, maxTagCount, showRestTagsPopover, restTagsPopoverProps, checkRelation } = props;
      const { inputValue, checkedKeys, resolvedCheckedKeys, inputPlaceHolder } = state;
      const tagInputcls = cls(`${prefixcls}-tagInput-wrapper`);
      const realKeys = mergeType === strings.NONE_MERGE_TYPE || checkRelation === strings.UN_RELATED ? checkedKeys : resolvedCheckedKeys;
      return h(TagInput, {
        class: tagInputcls,
        ref: inputRef,
        disabled,
        size,
        value: [...realKeys],
        showRestTagsPopover,
        restTagsPopoverProps,
        maxTagCount,
        renderTagItem,
        inputValue,
        onInputChange: (v: string) => search(v),
        onRemove: (v: string) => foundation.handleTagRemoveByKey(v),
        placeholder: inputPlaceHolder,
        expandRestTagsOnClick: false,
      });
    };

    const renderInput = () => {
      const { size, disabled } = props;
      const inputcls = cls(`${prefixcls}-input`);
      const { inputValue, inputPlaceHolder, showInput } = state;
      const inputProps: Record<string, any> = { disabled, value: inputValue, class: inputcls, onChange: (v: string) => search(v) } as any;
      const wrappercls = cls({ [`${prefixcls}-search-wrapper`]: true, [`${prefixcls}-search-wrapper-${size}`]: size !== 'default' });
      const displayText = renderDisplayText();
      const spanCls = cls({
        [`${prefixcls}-selection-placeholder`]: !displayText,
        [`${prefixcls}-selection-text-hide`]: showInput && inputValue,
        [`${prefixcls}-selection-text-inactive`]: showInput && !inputValue,
      });
      return h('div', { class: wrappercls }, [
        h('span', { class: spanCls }, [displayText ? displayText : inputPlaceHolder]),
        showInput && h(Input, { ref: inputRef, size, ...inputProps }),
      ]);
    };

    const keysSize = (keys: any) => {
      if (!keys) return 0;
      if (typeof keys.size === 'number') return keys.size;
      if (typeof keys.length === 'number') return keys.length;
      try { return Array.from(keys).length; } catch { return 0; }
    };
    const renderSelectContent = () => {
      const { placeholder, filterTreeNode, multiple, searchPosition, checkRelation } = props;
      const { checkedKeys, resolvedCheckedKeys } = state;
      const searchable = Boolean(filterTreeNode) && searchPosition === strings.SEARCH_POSITION_TRIGGER;
      if (!searchable) {
        if (multiple) {
          const displayKeys = mergeType === strings.NONE_MERGE_TYPE || checkRelation === strings.UN_RELATED ? checkedKeys : resolvedCheckedKeys;
          if (keysSize(displayKeys) === 0) {
            return h('span', { class: `${prefixcls}-selection-placeholder` }, [placeholder]);
          }
          return renderMultipleTags();
        }
        const displayText = renderDisplayText();
        const spanCls = cls({ [`${prefixcls}-selection-placeholder`]: !displayText });
        return h('span', { class: spanCls }, [displayText ? displayText : placeholder]);
      }
      return multiple ? renderTagInput() : renderInput();
    };

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

    const renderClearBtn = () => {
      const clearCls = cls(`${prefixcls}-clearbtn`);
      const { clearIcon } = props;
      if (showClearBtn()) {
        const icon = renderSlotOrProp(slots, 'clearIcon', clearIcon);
        return h('div', { class: clearCls, onClick: handleClear, onKeypress: handleClearEnterPress, role: 'button', tabindex: 0 }, [icon ? normalizeNode(icon) : h(IconClear)]);
      }
      return null;
    };
    const renderArrow = () => {
      if (showClearBtn()) return null;
      const arrowIcon = renderSlotOrProp(slots, 'arrowIcon', props.arrowIcon);
      return arrowIcon ? h('div', { class: cls(`${prefixcls}-arrow`), 'x-semi-prop': 'arrowIcon' }, [normalizeNode(arrowIcon)]) : null;
    };

    const renderSelection = () => {
      const { disabled, multiple, filterTreeNode, size, className, validateStatus, showClear, id, borderless } = props;
      const { isOpen, isFocus, isInput, checkedKeys } = state;
      const prefix = slots.prefix || props.prefix;
      const suffix = slots.suffix || props.suffix;
      const insetLabel = slots.insetLabel || props.insetLabel;
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as any;
      const filterable = Boolean(filterTreeNode);
      const useCustomTrigger = typeof props.triggerRender === 'function' || Boolean(slots.triggerRender);
      const classNames = useCustomTrigger
        ? cls(className, attrClass)
        : cls(
            prefixcls,
            className,
            attrClass,
            {
              [`${prefixcls}-borderless`]: borderless,
              [`${prefixcls}-focus`]: isFocus || (isOpen && !isInput),
              [`${prefixcls}-disabled`]: disabled,
              [`${prefixcls}-single`]: true,
              [`${prefixcls}-filterable`]: filterable,
              [`${prefixcls}-error`]: validateStatus === 'error',
              [`${prefixcls}-warning`]: validateStatus === 'warning',
              [`${prefixcls}-small`]: size === 'small',
              [`${prefixcls}-large`]: size === 'large',
              [`${prefixcls}-with-prefix`]: prefix || insetLabel,
              [`${prefixcls}-with-suffix`]: suffix,
            }
          );
      const mouseEvent = showClear ? { onMouseenter: handleMouseOver, onMouseleave: handleMouseLeave } : {};
      const sectionCls = cls(`${prefixcls}-selection`, { [`${prefixcls}-selection-multiple`]: multiple && !_isEmpty(checkedKeys) });
      let inner: VNodeChild;
      if (useCustomTrigger) {
        // React passes the `pos` of the selected node(s) (e.g. '0-0-1'), not the keys
        const { selectedKeys, resolvedCheckedKeys, checkedKeys, keyEntities } = state;
        let realValue: any;
        if (multiple) {
          realValue = new Set<string>();
          const source = mergeType === strings.NONE_MERGE_TYPE ? checkedKeys : resolvedCheckedKeys;
          source.forEach((key: string) => realValue.add(keyEntities[key]?.pos));
        } else {
          realValue = keyEntities[[...selectedKeys][0]]?.pos;
        }
        const triggerProps = {
          value: realValue,
          inputValue: state.inputValue,
          onChange: search,
          onClear: handleClear,
          placeholder: state.inputPlaceHolder,
          disabled,
          componentName: 'Cascader',
          componentProps: { ...props },
          onSearch: search,
          onRemove: handleTagRemoveInTrigger,
        };
        inner = slots.triggerRender ? slots.triggerRender(triggerProps) : props.triggerRender!(triggerProps);
      } else {
        inner = [
          prefix || insetLabel ? renderPrefix() : null,
          h('div', { class: sectionCls }, [renderSelectContent()]),
          suffix ? renderSuffix() : null,
          renderClearBtn(),
          renderArrow(),
        ];
      }
      return h(
        'div',
        {
          class: classNames,
          style: attrStyle,
          ref: triggerRef,
          onClick: (e: MouseEvent) => foundation.handleClick(e),
          onKeypress: (e: KeyboardEvent) => foundation.handleSelectionEnterPress(e),
          'aria-invalid': props.ariaInvalid ?? restAttrs['aria-invalid'],
          'aria-errormessage': props.ariaErrormessage ?? restAttrs['aria-errormessage'],
          'aria-label': props.ariaLabel ?? restAttrs['aria-label'],
          'aria-labelledby': props.ariaLabelledby ?? restAttrs['aria-labelledby'],
          'aria-describedby': props.ariaDescribedby ?? restAttrs['aria-describedby'],
          'aria-required': props.ariaRequired ?? restAttrs['aria-required'],
          id,
          onKeydown: foundation.handleKeyDown,
          ...mouseEvent,
          role: 'combobox',
          tabindex: 0,
          ...getDataAttr(restAttrs),
        },
        inner
      );
    };

    const renderContent = () => {
      const { inputValue, isSearching, activeKeys, selectedKeys, checkedKeys, halfCheckedKeys, loadedKeys, loadingKeys } = state;
      const { filterTreeNode, dropdownClassName, dropdownStyle, loadData, emptyContent, separator, topSlot, bottomSlot, showNext, multiple, filterRender, virtualizeInSearch, expandIcon } = props;
      const searchable = Boolean(filterTreeNode) && isSearching;
      const popoverCls = cls(dropdownClassName, `${prefixcls}-popover`);
      const renderData = foundation.getRenderData();
      const isEmpty = !renderData || !renderData.length;
      const realDropDownStyle = isEmpty ? { ...(dropdownStyle || {}), minWidth: state.emptyContentMinWidth } : dropdownStyle;
      const top = renderSlotOrProp(slots, 'topSlot', topSlot);
      const bottom = renderSlotOrProp(slots, 'bottomSlot', bottomSlot);
      return h(
        'div',
        { class: popoverCls, role: 'listbox', style: realDropDownStyle, onKeydown: foundation.handleKeyDown, ref: optionContainerEl },
        [
          normalizeNode(top),
          h(CascaderItem, {
            activeKeys,
            selectedKeys,
            separator,
            loadedKeys,
            loadingKeys,
            onItemClick: handleItemClick,
            onItemHover: handleItemHover,
            showNext,
            onItemCheckboxClick,
            onListScroll: handleListScroll,
            searchable,
            keyword: inputValue,
            loadData,
            data: renderData,
            multiple,
            checkedKeys,
            halfCheckedKeys,
            filterRender: slots.filterRender ? (p: any) => slots.filterRender!(p) : filterRender,
            virtualize: virtualizeInSearch,
            expandIcon: slots.expandIcon ? (p: any) => slots.expandIcon!(p) : expandIcon,
            emptyContent: slots.emptyContent ? undefined : emptyContent,
          }, { emptyContent: slots.emptyContent ? () => slots.emptyContent!() : undefined }),
          normalizeNode(bottom),
        ]
      );
    };

    expose({
      search,
      open: () => foundation.open(),
      close: () => foundation.close(),
      focus: () => foundation.focus(),
      blur: () => foundation.blur(),
      foundation,
      state,
    });

    return () => {
      const { zIndex, getPopupContainer, autoAdjustOverflow, stopPropagation, mouseLeaveDelay, mouseEnterDelay, position, motion, dropdownMargin } = props;
      const { isOpen, rePosKey } = state;
      const direction = configContext.direction;
      const pos = position != null ? position : direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
      return h(
        Popover,
        {
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
          stopPropagation: Boolean(stopPropagation),
          mouseLeaveDelay,
          mouseEnterDelay,
          onAfterClose: () => foundation.updateSearching(false),
        },
        { default: () => renderSelection(), content: () => renderContent() }
      );
    };
  },
});
(Cascader as any).elementType = 'Cascader';

export { CascaderItem, strings as cascaderStrings };
export default Cascader;
