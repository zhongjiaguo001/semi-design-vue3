import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _isEqual from 'lodash/isEqual';
import { strings, cssClasses } from '@douyinfe/semi-foundation/lib/es/autoComplete/constants';
import AutoCompleteFoundation from '@douyinfe/semi-foundation/lib/es/autoComplete/foundation';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/autoComplete/autoComplete.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import Spin from '../spin/Spin';
import Popover from '../popover/Popover';
import Input from '../input/Input';
import type { Position } from '../tooltip/Tooltip';
import Option from './Option';

const prefixCls = cssClasses.PREFIX;

export type AutoCompleteSize = (typeof strings.SIZE)[number];
export interface AutoCompleteItem {
  value?: string | number;
  label?: any;
  disabled?: boolean;
  [x: string]: any;
}
export type AutoCompleteData = Array<string | number | AutoCompleteItem>;
export interface AutoCompleteTriggerRenderProps {
  inputValue: any;
  value: any[];
  componentName: string;
  componentProps: Record<string, any>;
  disabled: boolean;
  placeholder: string | undefined;
  onChange: (value: string, e?: any) => void;
  onClear: () => void;
  onBlur: (e: FocusEvent) => void;
  onFocus: (e: FocusEvent) => void;
  [x: string]: any;
}

const nodeType = [String, Number, Object, Function, Array] as PropType<any>;

export const autoCompleteProps = {
  autoFocus: { type: Boolean, default: false },
  autoAdjustOverflow: { type: Boolean, default: true },
  clearIcon: { type: nodeType, default: undefined },
  data: { type: Array as PropType<AutoCompleteData>, default: () => [] },
  defaultOpen: { type: Boolean, default: false },
  defaultValue: { type: [String, Number] as PropType<string | number>, default: undefined },
  defaultActiveFirstOption: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dropdownMatchSelectWidth: { type: Boolean, default: true },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  emptyContent: { type: nodeType, default: null },
  id: { type: String, default: undefined },
  insetLabel: { type: nodeType, default: undefined },
  insetLabelId: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  position: { type: String as PropType<Position>, default: 'bottomLeft' },
  placeholder: { type: String, default: undefined },
  prefix: { type: nodeType, default: undefined },
  onChangeWithObject: { type: Boolean, default: false },
  onSelectWithObject: { type: Boolean, default: false },
  renderItem: { type: Function as PropType<(item: any) => VNodeChild>, default: undefined },
  renderSelectedItem: { type: Function as PropType<(option: any) => string>, default: undefined },
  suffix: { type: nodeType, default: undefined },
  showClear: { type: Boolean, default: false },
  size: { type: String as PropType<AutoCompleteSize>, default: 'default' },
  stopPropagation: { type: [Boolean, String] as PropType<boolean | string>, default: true },
  maxHeight: { type: [String, Number] as PropType<string | number>, default: 300 },
  mouseEnterDelay: { type: Number, default: undefined },
  mouseLeaveDelay: { type: Number, default: undefined },
  motion: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: true },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  triggerRender: { type: Function as PropType<(props: AutoCompleteTriggerRenderProps) => VNodeChild>, default: undefined },
  value: { type: [String, Number] as PropType<string | number>, default: undefined },
  modelValue: { type: [String, Number] as PropType<string | number>, default: undefined },
  validateStatus: { type: String as PropType<'default' | 'error' | 'warning' | 'success'>, default: 'default' },
  zIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
};

export const autoCompleteEmits = ['update:modelValue', 'update:value', 'change', 'search', 'select', 'clear', 'blur', 'focus', 'keydown', 'dropdownVisibleChange'];

const AutoComplete = defineComponent({
  name: 'AutoComplete',
  inheritAttrs: false,
  props: autoCompleteProps,
  emits: autoCompleteEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      dropdownMinWidth: null as any,
      inputValue: '' as any,
      options: [] as any[],
      visible: false,
      focusIndex: props.defaultActiveFirstOption ? 0 : -1,
      selection: new Map<any, any>(),
      rePosKey: 1,
      keyboardEventSet: {} as Record<string, any>,
    }, { modelProp: 'value' });

    const triggerRef = ref<HTMLElement | null>(null);
    const optionsRef = ref<any>(null);
    const optionContainerEl = ref<HTMLElement | null>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    const optionListId = getUuidShort();

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);

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
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'style') {
          const width = parseStyleWidth();
          return width === undefined ? undefined : { width };
        }
        if (key === 'renderItem' && !props.renderItem && slots.renderItem) {
          return (item: any) => slots.renderItem!({ item });
        }
        return Reflect.get(target, key);
      },
      has(target, key) {
        if (key === 'style') return (attrs as any).style !== undefined;
        return Reflect.has(target, key);
      },
    });

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
      updateScrollTop: (index?: number) => {
        let optionClassName = `.${prefixCls}-option-selected`;
        if (index !== undefined) optionClassName = `.${prefixCls}-option:nth-child(${index + 1})`;
        const destNode = document.querySelector(`#${prefixCls}-${optionListId} ${optionClassName}`) as HTMLElement | null;
        if (destNode) {
          const destParent = destNode.parentNode as HTMLElement;
          destParent.scrollTop = destNode.offsetTop - destParent.offsetTop - destParent.clientHeight / 2 + destNode.clientHeight / 2;
        }
      },
    };

    const adapter = {
      ...baseAdapter,
      getProps: () => propsProxy,
      getProp: (key: string) => propsProxy[key],
      ...keyboardAdapter,
      getTriggerWidth: () => {
        const el = triggerRef.value;
        return el && el.getBoundingClientRect().width;
      },
      setOptionWrapperWidth: (width: any) => {
        state.dropdownMinWidth = width;
      },
      updateInputValue: (inputValue: any) => {
        state.inputValue = inputValue;
      },
      toggleListVisible: (isShow: boolean) => {
        state.visible = isShow;
      },
      updateOptionList: (optionList: any[]) => {
        state.options = optionList;
      },
      updateSelection: (selection: Map<any, any>) => {
        state.selection = selection;
      },
      notifySearch: (inputValue: string) => emit('search', inputValue),
      notifyChange: (value: any) => {
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
      notifySelect: (option: any) => emit('select', option),
      notifyDropdownVisibleChange: (isVisible: boolean) => emit('dropdownVisibleChange', isVisible),
      notifyClear: () => emit('clear'),
      notifyFocus: (event: FocusEvent) => emit('focus', event),
      notifyBlur: (event: FocusEvent) => emit('blur', event),
      notifyKeyDown: (e: KeyboardEvent) => emit('keydown', e),
      rePositionDropdown: () => {
        state.rePosKey = state.rePosKey + 1;
      },
      registerClickOutsideHandler: (cb: (e: MouseEvent) => void) => {
        const handler = (e: MouseEvent) => {
          const triggerDom = triggerRef.value;
          const optionsDom = optionContainerEl.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (
            optionsDom &&
            (!optionsDom.contains(target) || !optionsDom.contains(target.parentNode)) &&
            triggerDom &&
            !triggerDom.contains(target) &&
            !(path.includes(triggerDom) || path.includes(optionsDom))
          ) {
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
    };

    const foundation = new (AutoCompleteFoundation as any)(adapter);

    /**
     * React runs init() in componentDidMount and flushes the state before paint; the
     * DOM independent part (options + initial value) runs during the first render here.
     */
    let initialized = false;
    const initSync = () => {
      if (initialized) return;
      initialized = true;
      const { data, defaultValue } = props;
      const value = getValueProp();
      if (data && data.length) {
        foundation._adapter.updateOptionList(foundation._generateList(data));
      }
      let initValue: any;
      if (typeof defaultValue !== 'undefined') initValue = defaultValue;
      if (typeof value !== 'undefined') initValue = value;
      if (typeof initValue !== 'undefined') foundation.handleValueChange(initValue);
    };

    onMounted(() => {
      initSync();
      foundation._setDropdownWidth();
      if (props.defaultOpen) foundation.openDropdown();
    });
    onBeforeUnmount(() => foundation.destroy());

    watch(
      () => props.data,
      (data, prev) => {
        if (!_isEqual(data, prev)) foundation.handleDataChange(data);
      },
      { deep: true }
    );
    watch(
      () => getValueProp(),
      (value, prev) => {
        if (value !== prev) foundation.handleValueChange(value);
      }
    );

    const onSelect = (option: any, optionIndex: number) => foundation.handleSelect(option, optionIndex);
    const onSearch = (value: string) => foundation.handleSearch(value);
    const onBlur = (e: FocusEvent) => foundation.handleBlur(e);
    const onFocus = (e: FocusEvent) => foundation.handleFocus(e);
    const onInputClear = () => foundation.handleClear();
    const handleInputClick = (e: MouseEvent) => foundation.handleInputClick(e);

    const slotOrProp = (name: string) => (slots[name] ? slots[name]!() : normalizeNode((props as any)[name]));
    const hasSlotOrProp = (name: string) => Boolean(slots[name] || ((props as any)[name] !== undefined && (props as any)[name] !== null && (props as any)[name] !== ''));

    const renderInput = () => {
      const { placeholder, showClear, disabled, triggerRender, validateStatus, autoFocus, id, size, insetLabelId } = props;
      const value = getValueProp();
      const { inputValue, keyboardEventSet, selection } = state;
      const { class: className, style, ...restAttrs } = attrs as any;
      const useCustomTrigger = typeof triggerRender === 'function' || Boolean(slots.triggerRender);
      const outerProps: Record<string, any> = {
        style,
        class: useCustomTrigger ? cls(className) : cls({ [prefixCls]: true, [`${prefixCls}-disabled`]: disabled }, className),
        onClick: handleInputClick,
        ref: triggerRef,
        id,
        ...keyboardEventSet,
        tabindex: -1,
        ...getDataAttr(restAttrs),
      };
      const innerProps: Record<string, any> = {
        disabled,
        placeholder,
        autoFocus,
        onChange: onSearch,
        onClear: onInputClear,
        'aria-label': restAttrs['aria-label'],
        'aria-labelledby': restAttrs['aria-labelledby'],
        'aria-invalid': restAttrs['aria-invalid'],
        'aria-errormessage': restAttrs['aria-errormessage'],
        'aria-describedby': restAttrs['aria-describedby'],
        'aria-required': restAttrs['aria-required'],
        insetLabelId,
        showClear,
        validateStatus,
        size,
        onBlur,
        onFocus,
      };
      const currentValue = typeof value !== 'undefined' ? value : inputValue;
      if (useCustomTrigger) {
        const triggerProps: AutoCompleteTriggerRenderProps = {
          ...innerProps,
          suffix: props.suffix,
          prefix: props.prefix || props.insetLabel,
          clearIcon: props.clearIcon,
          inputValue: currentValue,
          value: Array.from(selection.values()),
          componentName: 'AutoComplete',
          componentProps: { ...props },
        } as any;
        return h('div', outerProps, [slots.triggerRender ? slots.triggerRender(triggerProps) : triggerRender!(triggerProps)]);
      }
      const inputSlots: Record<string, any> = {};
      if (hasSlotOrProp('suffix')) inputSlots.suffix = () => slotOrProp('suffix');
      if (hasSlotOrProp('prefix')) inputSlots.prefix = () => slotOrProp('prefix');
      else if (hasSlotOrProp('insetLabel')) inputSlots.prefix = () => slotOrProp('insetLabel');
      if (hasSlotOrProp('clearIcon')) inputSlots.clearIcon = () => slotOrProp('clearIcon');
      return h('div', outerProps, [h(Input, { ...innerProps, value: currentValue }, inputSlots)]);
    };

    const renderLoading = () => h('div', { class: `${prefixCls}-loading-wrapper` }, [h(Spin)]);

    const renderOption = (option: any, optionIndex: number) => {
      const { focusIndex } = state;
      const isFocused = optionIndex === focusIndex;
      const rendered = option._renderedLabel ?? option.label;
      return h(
        Option,
        {
          showTick: false,
          onSelect: (v: any) => onSelect(v, optionIndex),
          focused: isFocused,
          onMouseEnter: () => foundation.handleOptionMouseEnter(optionIndex),
          key: option.key || String(option.label) + option.value + optionIndex,
          value: option.value,
          label: option.label,
          disabled: Boolean(option.disabled),
          className: option.className,
          style: option.style,
          inputValue: typeof state.inputValue === 'string' ? state.inputValue : String(state.inputValue ?? ''),
          optionData: option,
        },
        { default: () => normalizeNode(rendered) }
      );
    };

    const renderOptionList = () => {
      const { maxHeight, dropdownStyle, dropdownClassName, loading } = props;
      const { options, dropdownMinWidth } = state;
      const listCls = cls({ [`${prefixCls}-option-list`]: true }, dropdownClassName);
      let optionsNode: any;
      if (options.length === 0) {
        optionsNode = slots.emptyContent ? slots.emptyContent() : normalizeNode(props.emptyContent);
      } else {
        optionsNode = options.filter((option) => option.show).map((option, i) => renderOption(option, i));
      }
      const style = {
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        minWidth: typeof dropdownMinWidth === 'number' ? `${dropdownMinWidth}px` : dropdownMinWidth,
        ...dropdownStyle,
      };
      return h('div', { ref: optionContainerEl, class: listCls, role: 'listbox', style, id: `${prefixCls}-${optionListId}` }, [!loading ? optionsNode : renderLoading()]);
    };

    expose({ foundation, triggerRef, optionContainerEl });

    return () => {
      const { position, motion, zIndex, mouseEnterDelay, mouseLeaveDelay, autoAdjustOverflow, stopPropagation, getPopupContainer } = props;
      initSync();
      const { visible, rePosKey } = state;
      const popoverProps: Record<string, any> = {
        autoAdjustOverflow,
        trigger: 'custom',
        motion: Boolean(motion),
        visible,
        position,
        ref: optionsRef,
        zIndex,
        stopPropagation: Boolean(stopPropagation),
        getPopupContainer,
        rePosKey,
      };
      if (mouseEnterDelay !== undefined) popoverProps.mouseEnterDelay = mouseEnterDelay;
      if (mouseLeaveDelay !== undefined) popoverProps.mouseLeaveDelay = mouseLeaveDelay;
      return h(Popover, popoverProps, { content: () => renderOptionList(), default: () => renderInput() });
    };
  },
});
(AutoComplete as any).elementType = 'AutoComplete';
(AutoComplete as any).Option = Option;

export default AutoComplete;
