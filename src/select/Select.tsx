import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, onUpdated, Fragment, nextTick } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _isFunction from 'lodash/isFunction';
import _isNumber from 'lodash/isNumber';
import _get from 'lodash/get';
import _isString from 'lodash/isString';
import _isEqual from 'lodash/isEqual';
import SelectFoundation from '@douyinfe/semi-foundation/lib/es/select/foundation';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/select/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import { cssClasses as tagCssClasses } from '@douyinfe/semi-foundation/lib/es/tag/constants';
import SemiEvent from '@douyinfe/semi-foundation/lib/es/utils/Event';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/select/select.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { isSemiIcon, getFocusableElements, getActiveElement, normalizeNode, flattenChildren, getDataAttr } from '../_utils';
import Tag from '../tag/Tag';
import Popover from '../popover/Popover';
import Space from '../space';
import Input from '../input/Input';
import Spin from '../spin/Spin';
import type { Position } from '../tooltip/Tooltip';
import { IconChevronDown, IconClear, IconSearch } from '../icons/generated';
import Option from './Option';
import OptionGroup from './OptionGroup';
import VirtualList from './VirtualList';
import OverflowList from '../overflowList/OverflowList';
import { getOptionsFromGroup } from './utils';
import type { OptionLike } from './utils';

const prefixcls = cssClasses.PREFIX;
const tagPrefixCls = tagCssClasses.PREFIX;

export type SelectSize = (typeof strings.SIZE_SET)[number];
export type SelectValue = string | number | Record<string, any> | any[] | undefined;
export interface VirtualizeProps {
  itemSize?: number;
  height?: number;
  width?: string | number;
}
export interface TriggerRenderProps {
  value: OptionLike[];
  inputValue: string;
  onChange: (value: string, e?: any) => void;
  onSearch: (value: string, e?: any) => void;
  onClear: (e?: any) => void;
  onRemove: (option: OptionLike) => void;
  disabled: boolean;
  placeholder: any;
  componentName: string;
  componentProps: Record<string, any>;
}
export type RenderSingleSelectedItemFn = (optionNode: Record<string, any>) => VNodeChild;
export type RenderMultipleSelectedItemFn = (
  optionNode: Record<string, any>,
  multipleProps: { index: number; disabled: boolean; onClose: (tagContent: any, e: Event) => void }
) => { isRenderInTag: boolean; content: VNodeChild };
export type RenderSelectedItemFn = RenderSingleSelectedItemFn | RenderMultipleSelectedItemFn;

const nodeType = [String, Number, Object, Function, Array] as PropType<any>;

export const selectProps = {
  id: { type: String, default: undefined },
  autoFocus: { type: Boolean, default: false },
  autoClearSearchValue: { type: Boolean, default: true },
  arrowIcon: { type: nodeType, default: undefined },
  borderless: { type: Boolean, default: false },
  clearIcon: { type: nodeType, default: undefined },
  defaultValue: { type: [String, Number, Array, Object] as PropType<SelectValue>, default: undefined },
  value: { type: [String, Number, Array, Object] as PropType<SelectValue>, default: undefined },
  modelValue: { type: [String, Number, Array, Object] as PropType<SelectValue>, default: undefined },
  placeholder: { type: nodeType, default: '' },
  multiple: { type: Boolean, default: false },
  filter: { type: [Boolean, Function] as PropType<boolean | ((inputValue: string, option: OptionLike) => boolean)>, default: false },
  max: { type: Number, default: undefined },
  maxTagCount: { type: Number, default: undefined },
  maxHeight: { type: [String, Number] as PropType<string | number>, default: numbers.LIST_HEIGHT },
  size: { type: String as PropType<SelectSize>, default: undefined },
  disabled: { type: Boolean, default: false },
  emptyContent: { type: nodeType, default: undefined },
  expandRestTagsOnClick: { type: Boolean, default: false },
  zIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
  position: { type: String as PropType<Position>, default: undefined },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMargin: { type: [Number, Object] as PropType<number | Record<string, number>>, default: undefined },
  ellipsisTrigger: { type: Boolean, default: false },
  outerTopSlot: { type: nodeType, default: undefined },
  innerTopSlot: { type: nodeType, default: undefined },
  outerBottomSlot: { type: nodeType, default: undefined },
  innerBottomSlot: { type: nodeType, default: undefined },
  optionList: { type: Array as PropType<OptionLike[]>, default: undefined },
  dropdownMatchSelectWidth: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  defaultOpen: { type: Boolean, default: false },
  open: { type: Boolean, default: undefined },
  validateStatus: { type: String as PropType<'default' | 'error' | 'warning'>, default: undefined },
  defaultActiveFirstOption: { type: Boolean, default: true },
  onChangeWithObject: { type: Boolean, default: false },
  suffix: { type: nodeType, default: undefined },
  searchPosition: { type: String, default: strings.SEARCH_POSITION_TRIGGER },
  searchPlaceholder: { type: String, default: undefined },
  prefix: { type: nodeType, default: undefined },
  insetLabel: { type: nodeType, default: undefined },
  insetLabelId: { type: String, default: undefined },
  inputProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  showClear: { type: Boolean, default: false },
  showArrow: { type: Boolean, default: true },
  renderSelectedItem: { type: Function as PropType<RenderSelectedItemFn>, default: undefined },
  renderCreateItem: { type: Function as PropType<(inputValue: any, focus: boolean, style?: CSSProperties) => VNodeChild>, default: undefined },
  renderOptionItem: { type: Function as PropType<(props: Record<string, any>) => VNodeChild>, default: undefined },
  clickToHide: { type: Boolean, default: false },
  remote: { type: Boolean, default: false },
  allowCreate: { type: Boolean, default: false },
  triggerRender: { type: Function as PropType<(props: TriggerRenderProps) => VNodeChild>, default: undefined },
  virtualize: { type: Object as PropType<VirtualizeProps>, default: undefined },
  preventScroll: { type: Boolean, default: false },
  showRestTagsPopover: { type: Boolean, default: false },
  restTagsPopoverProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  // tooltip / popover pass through
  spacing: { type: [Number, Object] as PropType<number | { x?: number; y?: number }>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  motion: { type: Boolean, default: true },
  autoAdjustOverflow: { type: Boolean, default: true },
  mouseLeaveDelay: { type: Number, default: undefined },
  mouseEnterDelay: { type: Number, default: undefined },
  stopPropagation: { type: Boolean, default: true },
  rePosKey: { type: [String, Number], default: undefined },
};

export const selectEmits = [
  'update:modelValue',
  'update:value',
  'change',
  'select',
  'deselect',
  'search',
  'clear',
  'focus',
  'blur',
  'dropdownVisibleChange',
  'exceed',
  'create',
  'listScroll',
  'mouseEnter',
  'mouseLeave',
];

const Select = defineComponent({
  name: 'Select',
  inheritAttrs: false,
  props: selectProps,
  emits: selectEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { locale } = useLocale('Select');
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      isOpen: false,
      isFocus: false,
      options: [] as OptionLike[],
      selections: new Map<any, any>(),
      dropdownMinWidth: null as any,
      optionKey: 0,
      inputValue: '',
      showInput: false,
      focusIndex: props.defaultActiveFirstOption ? 0 : -1,
      keyboardEventSet: {} as Record<string, any>,
      optionGroups: [] as any[],
      isHovering: false,
      isFocusInContainer: false,
      isFullTags: false,
      overflowItemCount: 0,
    }, { modelProp: 'value' });

    const selectOptionListID = getUuidShort();
    const selectID = props.id || getUuidShort();
    const virtualizeListRef = ref<any>(null);
    const inputRef = ref<any>(null);
    const dropdownInputRef = ref<any>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const optionsRef = ref<any>(null);
    const optionContainerEl = ref<HTMLElement | null>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    const eventManager = new (SemiEvent as any)();

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    const getInputEl = (r: any): HTMLInputElement | null => (r && typeof r.getInputElement === 'function' ? r.getInputElement() : r?.inputRef?.value ?? null);

    // children (Select.Option / Select.OptGroup vnodes) are read inside the render function so
    // slot dependencies are tracked; the foundation reads the latest snapshot.
    let currentChildren: VNodeChild = undefined;
    const readChildren = () => {
      currentChildren = slots.default ? slots.default() : undefined;
      return currentChildren;
    };
    const getChildren = () => currentChildren;

    /**
     * React batches setState inside an event handler, so `getState('selections')` inside
     * foundation._notifyChange still returns the selections from *before* the handler ran.
     * Vue's setState is synchronous, so we keep a committed copy refreshed on the next tick.
     */
    let committedSelections = new Map<any, any>();
    let commitScheduled = false;
    const scheduleCommit = () => {
      if (commitScheduled) return;
      commitScheduled = true;
      nextTick(() => {
        commitScheduled = false;
        committedSelections = new Map(state.selections);
      });
    };

    const keyboardAdapter = {
      registerKeyDown: (cb: (e: KeyboardEvent) => void) => {
        state.keyboardEventSet = { onKeydown: cb };
      },
      unregisterKeyDown: () => {
        state.keyboardEventSet = {};
      },
      updateFocusIndex: (focusIndex: number) => {
        state.focusIndex = focusIndex;
      },
      scrollToFocusOption: () => {
        const index = state.focusIndex;
        if (typeof index !== 'number' || index < 0) return;
        if (props.virtualize && virtualizeListRef.value?.scrollToItem) {
          virtualizeListRef.value.scrollToItem(index);
          return;
        }
        let optionClassName: string;
        if ('renderOptionItem' in propsView) {
          optionClassName = `.${prefixcls}-option-custom:nth-child(${index + 1})`;
        } else {
          optionClassName = `.${prefixcls}-option:nth-child(${index + 1})`;
        }
        const destNode = document.querySelector(`#${prefixcls}-${selectOptionListID} ${optionClassName}`) as HTMLElement | null;
        if (destNode) {
          const destParent = destNode.parentNode as HTMLElement;
          destParent.scrollTop = destNode.offsetTop - destParent.offsetTop - destParent.clientHeight / 2 + destNode.clientHeight / 2;
        }
      },
    };
    const filterAdapter = {
      updateInputValue: (value: string) => {
        state.inputValue = value;
      },
      toggleInputShow: (showInput: boolean, cb: () => void) => {
        baseAdapter.setState({ showInput }, () => cb());
      },
      focusInput: () => {
        const el = getInputEl(inputRef.value);
        el && el.focus({ preventScroll: props.preventScroll });
      },
      focusDropdownInput: () => {
        const el = getInputEl(dropdownInputRef.value);
        el && el.focus({ preventScroll: props.preventScroll });
      },
    };
    const multipleAdapter = {
      notifyMaxLimit: (option: OptionLike) => emit('exceed', option),
      getMaxLimit: () => props.max,
      registerClickOutsideHandler: (cb: (e: MouseEvent) => void) => {
        const handler = (e: MouseEvent) => {
          const triggerDom = triggerRef.value;
          const optionsDom = optionContainerEl.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (!(optionsDom && optionsDom.contains(target)) && !(triggerDom && triggerDom.contains(target)) && !(path.includes(triggerDom as any) || path.includes(optionsDom as any))) {
            cb(e);
          }
        };
        clickOutsideHandler = handler;
        document.addEventListener('mousedown', handler, false);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) {
          document.removeEventListener('mousedown', clickOutsideHandler, false);
          clickOutsideHandler = null;
        }
      },
      rePositionDropdown: () => {
        state.optionKey = state.optionKey + 1;
      },
      notifyDeselect: (value: any, option: any) => {
        delete option._parentGroup;
        emit('deselect', value, option);
      },
    };

    const parseStyleWidth = (): any => {
      const style = (attrs as any).style;
      if (!style) return undefined;
      if (typeof style === 'string') {
        const m = style.match(/(?:^|;)\s*width\s*:\s*([^;]+)/);
        return m ? m[1].trim() : undefined;
      }
      if (Array.isArray(style)) {
        for (const item of style) {
          const w = item && typeof item === 'object' ? item.width : undefined;
          if (w !== undefined) return w;
        }
        return undefined;
      }
      return style.width;
    };
    // the foundation reads `props.style.width` (React className/style are attrs in Vue)
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'style') {
          const width = parseStyleWidth();
          return width === undefined ? undefined : { width };
        }
        return Reflect.get(target, key);
      },
      has(target, key) {
        if (key === 'style') return (attrs as any).style !== undefined;
        return Reflect.has(target, key);
      },
    });

    const adapter = {
      ...baseAdapter,
      getProps: () => propsProxy,
      ...keyboardAdapter,
      ...filterAdapter,
      ...multipleAdapter,
      on: (eventName: string, eventCallback: () => void) => eventManager.on(eventName, eventCallback),
      off: (eventName: string) => eventManager.off(eventName),
      once: (eventName: string, eventCallback: () => void) => eventManager.once(eventName, eventCallback),
      emit: (eventName: string) => eventManager.emit(eventName),
      getOptionsFromChildren: (children: VNodeChild = getChildren()) => {
        let optionGroups: any[] = [];
        let options: OptionLike[] = [];
        const { optionList } = props;
        if (optionList && optionList.length) {
          options = optionList.map((itemOpt, index) => ({ _show: true, _selected: false, _scrollIndex: index, ...itemOpt }));
          optionGroups[0] = { children: options, label: '' };
        } else {
          const result = getOptionsFromGroup(children);
          optionGroups = result.optionGroups;
          options = result.options;
        }
        state.optionGroups = optionGroups;
        return options;
      },
      updateOptions: (options: OptionLike[]) => {
        state.options = options;
      },
      openMenu: (cb?: () => void) => {
        baseAdapter.setState({ isOpen: true }, () => cb?.());
      },
      closeMenu: () => {
        state.isOpen = false;
      },
      getTriggerWidth: () => {
        const el = triggerRef.value;
        return el && el.getBoundingClientRect().width;
      },
      setOptionWrapperWidth: (width: any) => {
        state.dropdownMinWidth = width;
      },
      updateSelection: (selections: Map<any, any>) => {
        state.selections = selections;
        scheduleCommit();
      },
      // clone Map, important!!!, prevent unexpected modify on state
      getSelections: () => new Map(state.selections),
      notifyChange: (value: any) => {
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
      notifySelect: (value: any, option: any) => {
        delete option._parentGroup;
        emit('select', value, option);
      },
      notifyDropdownVisibleChange: (visible: boolean) => emit('dropdownVisibleChange', visible),
      notifySearch: (input: string, event: any) => emit('search', input, event),
      notifyCreate: (input: any) => emit('create', input),
      notifyMouseEnter: (e: MouseEvent) => emit('mouseEnter', e),
      notifyMouseLeave: (e: MouseEvent) => emit('mouseLeave', e),
      notifyFocus: (event: any) => emit('focus', event),
      notifyBlur: (event: any) => emit('blur', event),
      notifyClear: () => emit('clear'),
      notifyListScroll: (e: any) => emit('listScroll', e),
      updateHovering: (isHovering: boolean) => {
        state.isHovering = isHovering;
      },
      updateFocusState: (isFocus: boolean) => {
        state.isFocus = isFocus;
      },
      updateOverflowItemCount: (overflowItemCount: number) => {
        state.overflowItemCount = overflowItemCount;
      },
      focusTrigger: () => {
        try {
          triggerRef.value?.focus({ preventScroll: props.preventScroll });
        } catch (error) {
          /* ignore */
        }
      },
      getContainer: () => optionContainerEl.value,
      getFocusableElements: (node: any) => getFocusableElements(node),
      getActiveElement: () => getActiveElement(),
      setIsFocusInContainer: (isFocusInContainer: boolean) => {
        state.isFocusInContainer = isFocusInContainer;
      },
      getIsFocusInContainer: () => state.isFocusInContainer,
      updateScrollTop: (index?: number) => {
        let optionClassName: string;
        if ('renderOptionItem' in propsView) {
          optionClassName = `.${prefixcls}-option-custom-selected`;
          if (index !== undefined) optionClassName = `.${prefixcls}-option-custom:nth-child(${index + 1})`;
        } else {
          optionClassName = `.${prefixcls}-option-selected`;
          if (index !== undefined) optionClassName = `.${prefixcls}-option:nth-child(${index + 1})`;
        }
        const destNode = document.querySelector(`#${prefixcls}-${selectOptionListID} ${optionClassName}`) as HTMLElement | null;
        if (destNode) {
          const destParent = destNode.parentNode as HTMLElement;
          destParent.scrollTop = destNode.offsetTop - destParent.offsetTop - destParent.clientHeight / 2 + destNode.clientHeight / 2;
        }
      },
    };

    const foundation = new (SelectFoundation as any)(adapter);
    foundation._notifyChange = (selections: Map<any, any>) => {
      const { onChangeWithObject } = props;
      const selectionsProps = [...selections.values()];
      const isMultiple = foundation._isMultiple();
      const hasChange = foundation._diffSelections(selections, committedSelections, isMultiple);
      if (!hasChange) return;
      if (onChangeWithObject) {
        foundation._notifyChangeWithObject(selections);
      } else if (!isMultiple) {
        adapter.notifyChange(selectionsProps.length ? selectionsProps[0].value : undefined);
      } else {
        adapter.notifyChange(selectionsProps.length ? selectionsProps.map((p) => p.value) : []);
      }
    };

    const getChildrenKeys = () => flattenChildren(getChildren()).map((child) => child.key);
    let prevChildrenKeys: any[] = [];
    let prevOptionList = props.optionList;
    let prevValue = getValueProp();

    /**
     * React runs foundation.init() in componentDidMount and flushes the resulting setState
     * before the browser paints. In Vue that would leave the first paint without the default
     * selection, so the option collection / default selection run during the first render and
     * only the DOM dependent part (dropdown width, defaultOpen, autoFocus) waits for onMounted.
     */
    let initialized = false;
    const initSync = () => {
      if (initialized) return;
      initialized = true;
      const originalOptions = foundation._collectOptions();
      foundation._setDefaultSelection(originalOptions);
      prevChildrenKeys = getChildrenKeys();
    };
    onMounted(() => {
      initSync();
      foundation._setDropdownWidth();
      const originalOptions = state.options;
      if (props.defaultOpen || props.open) {
        foundation.open(undefined, originalOptions);
      }
      if (props.autoFocus) {
        foundation.focus(originalOptions);
      }
    });
    onBeforeUnmount(() => {
      foundation.destroy();
    });

    // componentDidUpdate
    onUpdated(() => {
      const nowChildrenKeys = getChildrenKeys();
      let isOptionsChanged = false;
      if (!_isEqual(prevChildrenKeys, nowChildrenKeys) || !_isEqual(prevOptionList, props.optionList)) {
        isOptionsChanged = true;
        foundation.handleOptionListChange();
      }
      prevChildrenKeys = nowChildrenKeys;
      prevOptionList = props.optionList;
      const value = getValueProp();
      if (!_isEqual(value, prevValue) || isOptionsChanged) {
        if ('value' in propsView) {
          foundation.handleValueChange(value);
        } else {
          foundation.handleOptionListChangeHadDefaultValue();
        }
      }
      prevValue = value;
    });

    watch(
      () => props.open,
      (open) => {
        if (open === undefined) return;
        if (open && !state.isOpen) foundation.open();
        else if (!open && state.isOpen) foundation.close();
      }
    );

    const handleInputChange = (value: string, event?: any) => foundation.handleInputChange(value, event);
    const onSelect = (option: OptionLike, optionIndex: number, e: any) => foundation.onSelect(option, optionIndex, e);
    const onClear = (e: MouseEvent) => {
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      foundation.handleClearClick(e);
    };
    const onOptionHover = (optionIndex: number) => foundation.handleOptionMouseEnter(optionIndex);

    const slotOrProp = (name: string, slotProps?: any) => (slots[name] ? slots[name]!(slotProps) : normalizeNode((props as any)[name]));
    const hasSlotOrProp = (name: string) => Boolean(slots[name] || ((props as any)[name] !== undefined && (props as any)[name] !== null && (props as any)[name] !== ''));

    const getRenderSelectedItem = (): RenderSelectedItemFn | undefined => {
      if (props.renderSelectedItem) return props.renderSelectedItem;
      if (slots.renderSelectedItem) {
        return ((optionNode: any, multipleProps?: any) => {
          const content = slots.renderSelectedItem!({ optionNode, ...(multipleProps || {}) });
          if (multipleProps) return { isRenderInTag: true, content };
          return content;
        }) as any;
      }
      return undefined;
    };

    /* ------------------------------ trigger inputs ------------------------------ */
    const renderTriggerInput = () => {
      const { size, multiple, disabled, inputProps, filter } = props;
      const inputPropsCls = _get(inputProps, 'className');
      const inputcls = cls(`${prefixcls}-input`, { [`${prefixcls}-input-single`]: !multiple, [`${prefixcls}-input-multiple`]: multiple }, inputPropsCls);
      const { inputValue, focusIndex } = state;
      const { className: _cn, ...restInputProps } = inputProps || {};
      const selectInputProps: Record<string, any> = {
        value: inputValue,
        disabled,
        class: inputcls,
        onChange: handleInputChange,
        ...restInputProps,
      };
      if (multiple) {
        selectInputProps.style = { width: inputValue ? `${inputValue.length * 16}px` : '2px' };
      }
      return h(Input, {
        ref: inputRef,
        size,
        'aria-activedescendant': focusIndex !== -1 ? `${selectID}-option-${focusIndex}` : '',
        onFocus: (e: FocusEvent) => {
          if (multiple && Boolean(filter)) state.isFocus = true;
          e.stopPropagation();
        },
        onBlur: (e: FocusEvent) => foundation.handleInputBlur(e),
        ...selectInputProps,
      });
    };

    const renderDropdownInput = () => {
      const { size, multiple, disabled, inputProps, searchPlaceholder } = props;
      const { inputValue, focusIndex } = state;
      const wrapperCls = cls(`${prefixcls}-dropdown-search-wrapper`);
      const inputPropsCls = _get(inputProps, 'className');
      const inputCls = cls(`${prefixcls}-dropdown-input`, { [`${prefixcls}-dropdown-input-single`]: !multiple, [`${prefixcls}-dropdown-input-multiple`]: multiple }, inputPropsCls);
      const { className: _cn, ...restInputProps } = inputProps || {};
      return h('div', { class: wrapperCls }, [
        h(
          Input,
          {
            ref: dropdownInputRef,
            size,
            'aria-activedescendant': focusIndex !== -1 ? `${selectID}-option-${focusIndex}` : '',
            value: inputValue,
            disabled,
            class: inputCls,
            onChange: handleInputChange,
            placeholder: searchPlaceholder,
            showClear: true,
            ...restInputProps,
            onKeydown: (e: KeyboardEvent) => foundation._handleKeyDown(e),
          },
          { prefix: () => h(IconSearch) }
        ),
      ]);
    };

    /* ------------------------------ options ------------------------------ */
    const renderEmpty = () => h(Option, { empty: true, emptyContent: props.emptyContent }, slots.emptyContent ? { emptyContent: slots.emptyContent } : undefined);
    const renderLoading = () => h('div', { class: `${prefixcls}-loading-wrapper` }, [h(Spin)]);

    const renderCreateOption = (option: OptionLike, isFocused: boolean, optionIndex: number, style?: CSSProperties) => {
      const { renderCreateItem } = props;
      if (typeof renderCreateItem === 'undefined' && !slots.renderCreateItem) {
        const { value, label, children: _c, ...rest } = option;
        return h(
          Option,
          {
            key: option.key || option.label + option.value,
            onSelect: (v: any, e: any) => onSelect(v, optionIndex, e),
            onMouseEnter: () => onOptionHover(optionIndex),
            showTick: true,
            value,
            label,
            disabled: option.disabled,
            className: option.className,
            style: style as any,
            optionData: option,
            focused: isFocused,
          },
          { default: () => [h('span', { class: `${prefixcls}-create-tips` }, locale.value.createText), option.value] }
        );
      }
      const customCreateItem = slots.renderCreateItem ? slots.renderCreateItem({ inputValue: option.value, focus: isFocused, style }) : renderCreateItem!(option.value, isFocused, style);
      return h(
        'div',
        {
          role: 'button',
          'aria-label': 'Use the input box to create an optional item',
          onClick: (e: MouseEvent) => onSelect(option, optionIndex, e),
          key: option.key || option.label,
        },
        [customCreateItem]
      );
    };

    const renderOption = (option: OptionLike, optionIndex: number, style?: CSSProperties) => {
      const { focusIndex, inputValue } = state;
      const { renderOptionItem } = props;
      const isFocused = optionIndex === focusIndex;
      let optionStyle: any = style || {};
      if (option.style) optionStyle = { ...optionStyle, ...option.style };
      if (option._inputCreateOnly) {
        return renderCreateOption(option, isFocused, optionIndex, style);
      }
      if ('key' in option) option._keyInOptionList = option.key;
      const labelNode = normalizeNode(option.label);
      const key = option._keyInOptionList ?? option._keyInJsx ?? String(option.label) + option.value + optionIndex;
      return h(
        Option,
        {
          key,
          showTick: true,
          value: option.value,
          label: option.label,
          disabled: Boolean(option.disabled),
          className: option.className,
          selected: Boolean(option._selected),
          onSelect: (v: any, e: any) => onSelect(v, optionIndex, e),
          focused: isFocused,
          onMouseEnter: () => onOptionHover(optionIndex),
          style: optionStyle,
          renderOptionItem: slots.renderOptionItem ? (p: any) => slots.renderOptionItem!(p) : renderOptionItem,
          inputValue,
          semiOptionId: `${selectID}-option-${optionIndex}`,
          optionData: option,
        },
        { default: () => labelNode }
      );
    };

    const renderWithGroup = (visibleOptions: OptionLike[]) => {
      const content: any[] = [];
      const groupStatus = new Map();
      visibleOptions.forEach((option, optionIndex) => {
        const parentGroup = option._parentGroup;
        const optionContent = renderOption(option, optionIndex);
        if (parentGroup && !groupStatus.has(parentGroup.label)) {
          const groupKey = typeof parentGroup.label === 'string' || typeof parentGroup.label === 'number' ? parentGroup.label : parentGroup.key;
          const { children: _c, key: _k, ...groupProps } = parentGroup;
          content.push(h(OptionGroup, { ...groupProps, key: groupKey }));
          groupStatus.set(parentGroup.label, true);
        }
        content.push(optionContent);
      });
      return content;
    };

    const renderVirtualizeList = (visibleOptions: OptionLike[]) => {
      const { virtualize } = props;
      const { height, width, itemSize } = virtualize as VirtualizeProps;
      return h(VirtualList, {
        ref: virtualizeListRef,
        height: height || numbers.LIST_HEIGHT,
        itemCount: visibleOptions.length,
        itemSize: itemSize || 36,
        width: width || '100%',
        direction: context.direction,
        renderItem: (index: number, style: CSSProperties) => renderOption(visibleOptions[index], index, style),
      });
    };

    const renderOptions = () => {
      const { dropdownMinWidth, options, selections } = state;
      const { maxHeight, dropdownClassName, dropdownStyle, loading, virtualize, multiple, emptyContent, searchPosition, filter } = props;
      const visibleOptions = options.filter((item) => item._show);
      let listContent: any = renderWithGroup(visibleOptions);
      if (virtualize) listContent = renderVirtualizeList(visibleOptions);
      const style = { minWidth: typeof dropdownMinWidth === 'number' ? `${dropdownMinWidth}px` : dropdownMinWidth, ...dropdownStyle };
      const optionListCls = cls({ [`${prefixcls}-option-list`]: true, [`${prefixcls}-option-list-chosen`]: selections.size });
      const isEmpty = !options.length || !options.some((item) => item._show);
      const outerTopSlot = slotOrProp('outerTopSlot');
      const innerTopSlot = slotOrProp('innerTopSlot');
      const innerBottomSlot = slotOrProp('innerBottomSlot');
      const outerBottomSlot = slotOrProp('outerBottomSlot');
      const has = (n: string) => hasSlotOrProp(n);
      return h(
        'div',
        {
          id: `${prefixcls}-${selectOptionListID}`,
          class: cls({ [`${prefixcls}-option-list-wrapper`]: !(isEmpty && emptyContent === null) }, dropdownClassName),
          style,
          ref: optionContainerEl,
          onKeydown: (e: KeyboardEvent) => foundation.handleContainerKeyDown(e),
        },
        [
          has('outerTopSlot') ? h('div', { class: `${prefixcls}-option-list-outer-top-slot`, onMouseenter: () => foundation.handleSlotMouseEnter() }, [outerTopSlot]) : null,
          searchPosition === strings.SEARCH_POSITION_DROPDOWN && filter ? renderDropdownInput() : null,
          h(
            'div',
            {
              style: { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight },
              class: optionListCls,
              role: 'listbox',
              'aria-multiselectable': multiple,
              onScroll: (e: Event) => foundation.handleListScroll(e),
            },
            [
              has('innerTopSlot') ? h('div', { class: `${prefixcls}-option-list-inner-top-slot`, onMouseenter: () => foundation.handleSlotMouseEnter() }, [innerTopSlot]) : null,
              loading ? renderLoading() : isEmpty ? renderEmpty() : listContent,
              has('innerBottomSlot') ? h('div', { class: `${prefixcls}-option-list-inner-bottom-slot`, onMouseenter: () => foundation.handleSlotMouseEnter() }, [innerBottomSlot]) : null,
            ]
          ),
          has('outerBottomSlot') ? h('div', { class: `${prefixcls}-option-list-outer-bottom-slot`, onMouseenter: () => foundation.handleSlotMouseEnter() }, [outerBottomSlot]) : null,
        ]
      );
    };

    /* ------------------------------ selection ------------------------------ */
    const renderSingleSelection = (selections: Map<any, any>, filterable: boolean) => {
      let renderSelectedItem = getRenderSelectedItem() as RenderSingleSelectedItemFn | undefined;
      const { searchPosition } = props;
      const { showInput, inputValue } = state;
      let renderText: any = '';
      const selectedItems = [...selections];
      if (typeof renderSelectedItem === 'undefined') {
        renderSelectedItem = (optionNode: any) => normalizeNode(optionNode.label);
      }
      if (selectedItems.length) {
        const selectedItem = selectedItems[0][1];
        renderText = renderSelectedItem(selectedItem);
      }
      const showInputInTrigger = searchPosition === strings.SEARCH_POSITION_TRIGGER;
      const spanCls = cls({
        [`${prefixcls}-selection-text`]: true,
        [`${prefixcls}-selection-placeholder`]: !renderText && renderText !== 0,
        [`${prefixcls}-selection-text-hide`]: inputValue && showInput && showInputInTrigger,
        [`${prefixcls}-selection-text-inactive`]: !inputValue && showInput && showInputInTrigger,
      });
      const contentWrapperCls = `${prefixcls}-content-wrapper`;
      return h('div', { class: contentWrapperCls }, [
        h('span', { class: spanCls, 'x-semi-prop': 'placeholder' }, [renderText || renderText === 0 ? renderText : slotOrProp('placeholder')]),
        filterable && showInput && showInputInTrigger ? renderTriggerInput() : null,
      ]);
    };

    const getTagItem = (item: [any, any], i: number, renderSelectedItem: RenderMultipleSelectedItemFn) => {
      const { size, disabled: selectDisabled } = props;
      const label = item[0];
      const { value } = item[1];
      const disabled = item[1].disabled || selectDisabled;
      const onClose = (_tagContent: any, e: Event) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        foundation.removeTag({ label, value });
      };
      const { content, isRenderInTag } = renderSelectedItem(item[1], { index: i, disabled, onClose });
      const basic = { disabled, closable: !disabled, onClose };
      if (isRenderInTag) {
        return h(Tag, { ...basic, color: 'white', size: size || 'large', key: value, tabIndex: -1 }, { default: () => content });
      }
      return h(Fragment, { key: value }, [content]);
    };

    const renderTag = (item: [any, any], i: number, isCollapseItem?: boolean) => {
      const { size, disabled: selectDisabled } = props;
      let renderSelectedItem = getRenderSelectedItem() as RenderMultipleSelectedItemFn | undefined;
      const label = item[0];
      const { value } = item[1];
      const disabled = item[1].disabled || selectDisabled;
      const onClose = (_tagContent: any, e: Event) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        foundation.removeTag({ label, value });
      };
      if (typeof renderSelectedItem === 'undefined') {
        renderSelectedItem = (optionNode: any) => ({ isRenderInTag: true, content: normalizeNode(optionNode.label) });
      }
      const { content, isRenderInTag } = renderSelectedItem(item[1], { index: i, disabled, onClose });
      const basic = { disabled, closable: !disabled, onClose };
      const realContent = isCollapseItem && !_isFunction(props.renderSelectedItem) ? h('span', { class: `${prefixcls}-content-wrapper-collapse-text` }, [content]) : content;
      if (isRenderInTag) {
        return h(Tag, { ...basic, color: 'white', size: size || 'large', key: value, style: { maxWidth: '100%' } }, { default: () => realContent });
      }
      return h(Fragment, { key: value }, [realContent]);
    };

    const renderNTag = (n: number, restTags: [any, any][]) => {
      const { size, showRestTagsPopover, restTagsPopoverProps } = props;
      const baseTag = h(
        Tag,
        { closable: false, size: size || 'large', color: 'grey', class: `${prefixcls}-content-wrapper-collapse-tag`, key: `_+${n}`, style: { marginRight: 0, flexShrink: 0 } },
        { default: () => `+${n}` }
      );
      let nTag: any = baseTag;
      if (showRestTagsPopover) {
        nTag = h(
          Popover,
          {
            showArrow: true,
            trigger: 'hover',
            position: 'top',
            autoAdjustOverflow: true,
            ...restTagsPopoverProps,
            key: `_+${n}_Popover`,
          },
          {
            content: () => h(Space, { spacing: 2, wrap: true, style: { maxWidth: '400px' } }, { default: () => restTags.map((tag, index) => renderTag(tag, index)) }),
            default: () => baseTag,
          }
        );
      }
      return nTag;
    };

    const handleOverflow = (items: [any, any][]) => {
      const { overflowItemCount, selections } = state;
      const { maxTagCount } = props;
      const newOverFlowItemCount =
        selections.size - (maxTagCount as number) > 0 ? selections.size - (maxTagCount as number) + items.length - 1 : items.length - 1;
      if (overflowItemCount !== newOverFlowItemCount) {
        foundation.updateOverflowItemCount(selections.size, newOverFlowItemCount);
      }
    };

    const renderOverflow = (items: [any, any][], index: number) => {
      const isCollapse = true;
      return items.length && items[0] ? renderTag(items[0], index, isCollapse) : null;
    };

    /** ellipsisTrigger: React measures tags with OverflowList, then a separate +N for overflowItemCount. */
    const renderCollapsedTags = (selections: [any, any][], length?: number) => {
      const { overflowItemCount } = state;
      const normalTags = typeof length === 'number' ? selections.slice(0, length) : selections;
      return h('div', { class: `${prefixcls}-content-wrapper-collapse` }, [
        h(OverflowList, {
          items: normalTags,
          itemKey: (item: any) => item?.[1]?.value,
          overflowRenderer: (overflowItems: any) => renderOverflow(overflowItems as [any, any][], (length ?? 1) - 1),
          onOverflow: (overflowItems: any) => handleOverflow(overflowItems as [any, any][]),
          visibleItemRenderer: (item: any, index: number) => renderTag(item as [any, any], index),
        }),
        overflowItemCount > 0 ? renderNTag(overflowItemCount, selections.slice(selections.length - overflowItemCount)) : null,
      ]);
    };

    /** Vue counterpart of semi-ui TagGroup (mode="custom") used for one-line tags */
    const renderTagGroup = (opts: { tagList: any[]; maxTagCount?: number; restCount?: number; showPopover?: boolean; popoverProps?: Record<string, any>; onPlusNMouseEnter?: () => void }) => {
      const { tagList, maxTagCount, restCount, showPopover, popoverProps, onPlusNMouseEnter } = opts;
      const groupCls = cls({ [`${tagPrefixCls}-group`]: true, [`${tagPrefixCls}-group-max`]: maxTagCount, [`${tagPrefixCls}-group-large`]: true });
      let tagContents = tagList;
      if (typeof maxTagCount !== 'undefined') {
        const n = restCount ? restCount : tagList.length - maxTagCount;
        const normalTags = tagList.slice(0, maxTagCount);
        const restTags = tagList.slice(maxTagCount);
        if (n > 0) {
          const baseTag = h(
            Tag,
            { closable: false, size: 'large', color: 'grey', style: { backgroundColor: 'transparent' }, key: '_+n', onMouseenter: onPlusNMouseEnter },
            { default: () => `+${n}` }
          );
          let nTag: any = baseTag;
          if (showPopover) {
            nTag = h(
              Popover,
              { showArrow: true, trigger: 'hover', position: 'top', autoAdjustOverflow: true, className: `${tagPrefixCls}-rest-group-popover`, ...popoverProps, key: '_+n_Popover' },
              { content: () => restTags, default: () => baseTag }
            );
          }
          normalTags.push(nTag);
          tagContents = normalTags;
        }
      }
      return h('div', { class: groupCls }, tagContents);
    };

    const renderOneLineTags = (selectedItems: [any, any][], n?: number) => {
      let renderSelectedItem = getRenderSelectedItem() as RenderMultipleSelectedItemFn | undefined;
      const { showRestTagsPopover, restTagsPopoverProps, maxTagCount } = props;
      const { isFullTags } = state;
      if (typeof renderSelectedItem === 'undefined') {
        renderSelectedItem = (optionNode: any) => ({ isRenderInTag: true, content: normalizeNode(optionNode.label) });
      }
      if (showRestTagsPopover) {
        const mapItems = isFullTags ? selectedItems : selectedItems.slice(0, maxTagCount);
        const tags = mapItems.map((item, i) => getTagItem(item, i, renderSelectedItem!));
        return renderTagGroup({
          tagList: tags,
          maxTagCount: n,
          restCount: isFullTags ? undefined : selectedItems.length - (maxTagCount as number),
          showPopover: showRestTagsPopover,
          popoverProps: restTagsPopoverProps,
          onPlusNMouseEnter: () => foundation.updateIsFullTags(),
        });
      }
      const mapItems = selectedItems.slice(0, maxTagCount);
      const tags = mapItems.map((item, i) => getTagItem(item, i, renderSelectedItem!));
      return renderTagGroup({ tagList: tags, maxTagCount: n, restCount: selectedItems.length - (maxTagCount as number) });
    };

    const renderMultipleSelection = (selections: Map<any, any>, filterable: boolean) => {
      const { searchPosition, maxTagCount, expandRestTagsOnClick, ellipsisTrigger } = props;
      const { inputValue, isOpen } = state;
      const selectedItems = [...selections] as [any, any][];
      const contentWrapperCls = cls({
        [`${prefixcls}-content-wrapper`]: true,
        [`${prefixcls}-content-wrapper-one-line`]: maxTagCount && !isOpen,
        [`${prefixcls}-content-wrapper-empty`]: !selectedItems.length,
      });
      const spanCls = cls({
        [`${prefixcls}-selection-text`]: true,
        [`${prefixcls}-selection-placeholder`]: !selectedItems.length,
        [`${prefixcls}-selection-text-hide`]: selectedItems && selectedItems.length,
      });
      const placeholderNode = slotOrProp('placeholder');
      const placeholderText = hasSlotOrProp('placeholder') && !inputValue ? h('span', { class: spanCls }, [placeholderNode]) : null;
      const n = maxTagCount !== undefined && selectedItems.length > maxTagCount ? maxTagCount : undefined;
      const NotOneLine = !maxTagCount;
      const oneLineTags = () => (ellipsisTrigger ? renderCollapsedTags(selectedItems, n) : renderOneLineTags(selectedItems, n));
      const tagContent = NotOneLine || (expandRestTagsOnClick && isOpen) ? selectedItems.map((item, i) => renderTag(item, i)) : oneLineTags();
      const showTriggerInput = filterable && searchPosition === strings.SEARCH_POSITION_TRIGGER;
      return h('div', { class: contentWrapperCls }, [selectedItems && selectedItems.length ? tagContent : placeholderText, showTriggerInput ? renderTriggerInput() : null]);
    };

    const renderSuffix = () => {
      const suffix = slotOrProp('suffix');
      const suffixNode = Array.isArray(suffix) && suffix.length === 1 ? suffix[0] : suffix;
      const suffixWrapperCls = cls({
        [`${prefixcls}-suffix`]: true,
        [`${prefixcls}-suffix-text`]: suffix && _isString(props.suffix),
        [`${prefixcls}-suffix-icon`]: isSemiIcon(suffixNode),
      });
      return h('div', { class: suffixWrapperCls, 'x-semi-prop': 'suffix' }, [suffix]);
    };

    const renderPrefix = () => {
      const { insetLabelId } = props;
      const hasPrefix = hasSlotOrProp('prefix');
      const labelNode = hasPrefix ? slotOrProp('prefix') : slotOrProp('insetLabel');
      const labelSingle = Array.isArray(labelNode) && labelNode.length === 1 ? labelNode[0] : labelNode;
      const rawLabel = hasPrefix ? props.prefix : props.insetLabel;
      const prefixWrapperCls = cls({
        [`${prefixcls}-prefix`]: true,
        [`${prefixcls}-inset-label`]: hasSlotOrProp('insetLabel'),
        [`${prefixcls}-prefix-text`]: labelNode && _isString(rawLabel),
        [`${prefixcls}-prefix-icon`]: isSemiIcon(labelSingle),
      });
      return h('div', { class: prefixWrapperCls, id: insetLabelId, 'x-semi-prop': 'prefix,insetLabel' }, [labelNode]);
    };

    const renderSelection = () => {
      const { disabled, multiple, filter, id: _id, size, validateStatus, showArrow, triggerRender, borderless } = props;
      const { selections, isOpen, keyboardEventSet, inputValue, isHovering, isFocus, showInput, focusIndex } = state;
      const { class: className, style, ...restAttrs } = attrs as any;
      const useCustomTrigger = typeof triggerRender === 'function' || Boolean(slots.triggerRender);
      const filterable = Boolean(filter);
      const hasPrefix = hasSlotOrProp('prefix') || hasSlotOrProp('insetLabel');
      const hasSuffix = hasSlotOrProp('suffix');
      const selectionCls = useCustomTrigger
        ? cls(className)
        : cls(prefixcls, className, {
            [`${prefixcls}-borderless`]: borderless,
            [`${prefixcls}-open`]: isOpen,
            [`${prefixcls}-focus`]: isFocus,
            [`${prefixcls}-disabled`]: disabled,
            [`${prefixcls}-single`]: !multiple,
            [`${prefixcls}-multiple`]: multiple,
            [`${prefixcls}-filterable`]: filterable,
            [`${prefixcls}-small`]: size === 'small',
            [`${prefixcls}-large`]: size === 'large',
            [`${prefixcls}-error`]: validateStatus === 'error',
            [`${prefixcls}-warning`]: validateStatus === 'warning',
            [`${prefixcls}-no-arrow`]: !showArrow,
            [`${prefixcls}-with-prefix`]: hasPrefix,
            [`${prefixcls}-with-suffix`]: hasSuffix,
          });
      const showClear = props.showClear && (selections.size || inputValue) && !disabled && (isHovering || isOpen);
      const arrowIcon = slots.arrowIcon ? slots.arrowIcon() : props.arrowIcon !== undefined ? normalizeNode(props.arrowIcon) : h(IconChevronDown, { 'aria-label': '' });
      const arrowContent = showArrow ? h('div', { class: `${prefixcls}-arrow`, 'x-semi-prop': 'arrowIcon' }, [arrowIcon]) : h('div', { class: `${prefixcls}-arrow-empty` });
      const clear = slots.clearIcon ? slots.clearIcon() : props.clearIcon ? normalizeNode(props.clearIcon) : h(IconClear);
      let inner: any;
      if (useCustomTrigger) {
        const triggerProps: TriggerRenderProps = {
          value: Array.from(selections.values()),
          inputValue,
          onChange: handleInputChange,
          onSearch: handleInputChange,
          onRemove: (item: OptionLike) => foundation.removeTag(item),
          onClear,
          disabled,
          placeholder: props.placeholder,
          componentName: 'Select',
          componentProps: { ...props },
        };
        inner = slots.triggerRender ? slots.triggerRender(triggerProps) : triggerRender!(triggerProps);
      } else {
        inner = [
          hasPrefix ? renderPrefix() : null,
          h('div', { class: cls(`${prefixcls}-selection`) }, [multiple ? renderMultipleSelection(selections, filterable) : renderSingleSelection(selections, filterable)]),
          hasSuffix ? renderSuffix() : null,
          showClear ? h('div', { class: cls(`${prefixcls}-clear`), onClick: onClear }, [clear]) : arrowContent,
        ];
      }
      const tabIndex = disabled || (filterable && showInput) || (filterable && multiple) ? -1 : 0;
      return h(
        'div',
        {
          role: 'combobox',
          'aria-disabled': disabled,
          'aria-expanded': isOpen,
          'aria-controls': `${prefixcls}-${selectOptionListID}`,
          'aria-haspopup': 'listbox',
          'aria-label': selections.size ? 'selected' : '',
          'aria-invalid': restAttrs['aria-invalid'],
          'aria-errormessage': restAttrs['aria-errormessage'],
          'aria-labelledby': restAttrs['aria-labelledby'],
          'aria-describedby': restAttrs['aria-describedby'],
          'aria-required': restAttrs['aria-required'],
          class: selectionCls,
          ref: triggerRef,
          onClick: (e: MouseEvent) => foundation.handleClick(e),
          style,
          id: selectID,
          tabindex: tabIndex,
          'aria-activedescendant': focusIndex !== -1 ? `${selectID}-option-${focusIndex}` : '',
          onMouseenter: (e: MouseEvent) => foundation.handleMouseEnter(e),
          onMouseleave: (e: MouseEvent) => foundation.handleMouseLeave(e),
          onFocus: (e: FocusEvent) => foundation.handleTriggerFocus(e),
          onBlur: (e: FocusEvent) => foundation.handleTriggerBlur(e),
          onKeypress: (e: KeyboardEvent) => foundation.handleKeyPress(e),
          ...keyboardEventSet,
          ...getDataAttr(restAttrs),
        },
        inner
      );
    };

    /* Processing logic when popover visible changes */
    const handlePopoverVisibleChange = (status: boolean) => {
      const { virtualize } = props;
      const { selections } = state;
      if (!status) return;
      if (virtualize) {
        let minItemIndex = -1;
        selections.forEach((item: any) => {
          const itemIndex = _get(item, '_scrollIndex');
          if (_isNumber(itemIndex) && itemIndex >= 0) {
            minItemIndex = minItemIndex !== -1 && minItemIndex < itemIndex ? minItemIndex : itemIndex;
          }
        });
        if (minItemIndex !== -1) {
          try {
            virtualizeListRef.value.scrollToItem(minItemIndex, 'center');
          } catch (error) {
            /* ignore */
          }
        }
      } else {
        foundation.updateScrollTop();
      }
    };

    expose({
      close: () => foundation.close(),
      open: () => foundation.open(),
      clearInput: () => foundation.clearInput(),
      selectAll: () => foundation.selectAll(),
      deselectAll: () => foundation.clearSelected(),
      focus: () => foundation.focus(),
      rePosition: () => {
        state.optionKey = state.optionKey + 1;
      },
      search: (value: string, event?: any) => handleInputChange(value, event),
      foundation,
      triggerRef,
      optionContainerEl,
    });

    return () => {
      const direction = context.direction;
      const defaultPosition = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
      const { position = defaultPosition, zIndex, getPopupContainer, motion, autoAdjustOverflow, mouseLeaveDelay, mouseEnterDelay, spacing, stopPropagation, dropdownMargin, rePosKey } = props;
      readChildren();
      initSync();
      const { isOpen, optionKey } = state;
      const selection = renderSelection();
      const popoverRePosKey = rePosKey !== undefined ? `${optionKey}-${rePosKey}` : optionKey;
      const popoverProps: Record<string, any> = {
        getPopupContainer,
        motion,
        autoAdjustOverflow,
        zIndex,
        ref: optionsRef,
        visible: isOpen,
        trigger: 'custom',
        rePosKey: popoverRePosKey,
        position,
        spacing,
        stopPropagation,
        disableArrowKeyDown: true,
        onVisibleChange: (status: boolean) => handlePopoverVisibleChange(status),
        onAfterClose: () => foundation.handlePopoverClose(),
      };
      if (dropdownMargin !== undefined) popoverProps.margin = dropdownMargin;
      if (mouseLeaveDelay !== undefined) popoverProps.mouseLeaveDelay = mouseLeaveDelay;
      if (mouseEnterDelay !== undefined) popoverProps.mouseEnterDelay = mouseEnterDelay;
      return h(Popover, popoverProps, { content: () => renderOptions(), default: () => selection });
    };
  },
});
(Select as any).elementType = 'Select';
(Select as any).Option = Option;
(Select as any).OptGroup = OptionGroup;

export default Select;
