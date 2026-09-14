import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, onUpdated, nextTick, Fragment } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import cls from 'classnames';
import _isFunction from 'lodash/isFunction';
import _isUndefined from 'lodash/isUndefined';
import _isNull from 'lodash/isNull';
import _isArray from 'lodash/isArray';
import _isString from 'lodash/isString';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/tagInput/constants';
import '@douyinfe/semi-foundation/lib/es/tagInput/tagInput.css';
import TagInputFoundation from '@douyinfe/semi-foundation/lib/es/tagInput/foundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { isSemiIcon, normalizeNode, getDataAttr } from '../_utils';
import Tag from '../tag/Tag';
import Input from '../input/Input';
import Popover from '../popover/Popover';
import { Paragraph } from '../typography/Typography';
import { IconClear, IconHandle } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;

export type TagInputSize = (typeof strings.SIZE_SET)[number];
export type TagInputValidateStatus = (typeof strings.STATUS)[number];
export interface ShowContentTooltip {
  type?: string;
  opts?: Record<string, any>;
}

const nodeType = [String, Number, Object, Function, Array] as PropType<any>;

export const tagInputProps = {
  clearIcon: { type: nodeType, default: undefined },
  disabled: { type: Boolean, default: false },
  allowDuplicates: { type: Boolean, default: true },
  max: { type: Number, default: undefined },
  maxTagCount: { type: Number, default: undefined },
  maxLength: { type: Number, default: undefined },
  showRestTagsPopover: { type: Boolean, default: true },
  restTagsPopoverProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  showContentTooltip: { type: [Boolean, Object] as PropType<boolean | ShowContentTooltip>, default: true },
  defaultValue: { type: Array as PropType<string[]>, default: undefined },
  value: { type: Array as PropType<string[]>, default: undefined },
  modelValue: { type: Array as PropType<string[]>, default: undefined },
  inputValue: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  separator: { type: [String, Array, null] as PropType<string | string[] | null>, default: ',' },
  split: { type: Function as PropType<(originString: string, separators: string | string[] | null) => string[]>, default: undefined },
  showClear: { type: Boolean, default: false },
  addOnBlur: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  expandRestTagsOnClick: { type: Boolean, default: true },
  autoFocus: { type: Boolean, default: false },
  renderTagItem: { type: Function as PropType<(value: string, index: number, onClose: (...args: any[]) => void) => VNodeChild>, default: undefined },
  size: { type: String as PropType<TagInputSize>, default: 'default' },
  validateStatus: { type: String as PropType<TagInputValidateStatus>, default: 'default' },
  prefix: { type: nodeType, default: undefined },
  suffix: { type: nodeType, default: undefined },
  insetLabel: { type: nodeType, default: undefined },
  insetLabelId: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  preventScroll: { type: Boolean, default: false },
  onExceed: { type: Function as PropType<(value: string[]) => void>, default: undefined },
  onInputExceed: { type: Function as PropType<(value: string) => void>, default: undefined },
};

export const tagInputEmits = ['update:modelValue', 'update:value', 'update:inputValue', 'change', 'inputChange', 'add', 'remove', 'exceed', 'inputExceed', 'blur', 'focus', 'keydown'];

const TagInput = defineComponent({
  name: 'TagInput',
  inheritAttrs: false,
  props: tagInputProps,
  emits: tagInputEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      tagsArray: [] as string[],
      inputValue: '',
      inputWidth: undefined as number | undefined,
      focusing: false,
      hovering: false,
      active: false,
      entering: false,
    }, { modelProp: 'value' });

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    // getDerivedStateFromProps
    const deriveState = () => {
      const value = getValueProp();
      if (_isArray(value)) {
        state.tagsArray = value;
      } else if ('value' in propsView && !value) {
        state.tagsArray = [];
      }
      if (_isString(props.inputValue)) state.inputValue = props.inputValue;
    };
    state.tagsArray = props.defaultValue || [];
    deriveState();
    watch(
      () => [getValueProp(), props.inputValue],
      () => deriveState(),
      { deep: true }
    );

    const inputRef = ref<any>(null);
    const tagInputRef = ref<HTMLElement | null>(null);
    const inputMirrorRef = ref<HTMLElement | null>(null);
    let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
    const getInputEl = (): HTMLInputElement | null => (inputRef.value && typeof inputRef.value.getInputElement === 'function' ? inputRef.value.getInputElement() : null);

    // props with emit-based callbacks that the foundation calls directly
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onExceed') {
          return (value: string[]) => {
            props.onExceed?.(value);
            emit('exceed', value);
          };
        }
        if (key === 'onInputExceed') {
          return (value: string) => {
            props.onInputExceed?.(value);
            emit('inputExceed', value);
          };
        }
        return Reflect.get(target, key);
      },
    });

    const adapter = {
      ...baseAdapter,
      getProps: () => propsProxy,
      getProp: (key: string) => propsProxy[key],
      setInputValue: (inputValue: string) => {
        state.inputValue = inputValue;
      },
      setTagsArray: (tagsArray: string[]) => {
        state.tagsArray = tagsArray;
      },
      setFocusing: (focusing: boolean) => {
        state.focusing = focusing;
      },
      toggleFocusing: (isFocus: boolean) => {
        const input = getInputEl();
        if (isFocus) input && input.focus({ preventScroll: props.preventScroll });
        else input && input.blur();
        state.focusing = isFocus;
      },
      setHovering: (hovering: boolean) => {
        state.hovering = hovering;
      },
      setActive: (active: boolean) => {
        state.active = active;
      },
      setEntering: (entering: boolean) => {
        state.entering = entering;
      },
      getClickOutsideHandler: () => clickOutsideHandler,
      notifyBlur: (e: FocusEvent) => emit('blur', e),
      notifyFocus: (e: FocusEvent) => emit('focus', e),
      notifyInputChange: (v: string, e: any) => {
        emit('update:inputValue', v);
        emit('inputChange', v, e);
      },
      notifyTagChange: (v: string[]) => {
        emit('update:modelValue', v);
        emit('update:value', v);
        emit('change', v);
      },
      notifyTagAdd: (v: string[]) => emit('add', v),
      notifyTagRemove: (v: string, idx: number) => emit('remove', v, idx),
      notifyKeyDown: (e: KeyboardEvent) => emit('keydown', e),
      registerClickOutsideHandler: (cb: (e: MouseEvent) => void) => {
        const handler = (e: MouseEvent) => {
          const tagInputDom = tagInputRef.value;
          const target = e.target as Node;
          const path = (e.composedPath && e.composedPath()) || [target];
          if (tagInputDom && !tagInputDom.contains(target) && !path.includes(tagInputDom)) {
            cb(e);
          }
        };
        clickOutsideHandler = handler;
        document.addEventListener('click', handler, false);
      },
      unregisterClickOutsideHandler: () => {
        if (clickOutsideHandler) document.removeEventListener('click', clickOutsideHandler, false);
        clickOutsideHandler = null;
      },
    };

    const foundation = new (TagInputFoundation as any)(adapter);

    const updateInputWidth = () => {
      const inputEl = getInputEl();
      const mirrorEl = inputMirrorRef.value;
      const { inputValue, tagsArray } = state;
      const { placeholder } = props;
      if (!inputEl || !mirrorEl) return;
      if (!inputValue) {
        if (state.inputWidth !== undefined) state.inputWidth = undefined;
        return;
      }
      try {
        const cs = window.getComputedStyle(inputEl);
        mirrorEl.style.font = cs.font;
        mirrorEl.style.letterSpacing = cs.letterSpacing;
        mirrorEl.style.textTransform = cs.textTransform;
        mirrorEl.style.paddingLeft = cs.paddingLeft;
        mirrorEl.style.paddingRight = cs.paddingRight;
        mirrorEl.style.borderLeftWidth = cs.borderLeftWidth;
        mirrorEl.style.borderRightWidth = cs.borderRightWidth;
        mirrorEl.style.boxSizing = cs.boxSizing;
      } catch (e) {
        /* ignore */
      }
      const mirrorText = inputValue || (tagsArray?.length === 0 ? placeholder : '') || ' ';
      if (mirrorEl.textContent !== String(mirrorText)) mirrorEl.textContent = String(mirrorText);
      const nextWidth = Math.ceil(mirrorEl.scrollWidth + 2);
      if (Number.isFinite(nextWidth) && nextWidth > 0 && nextWidth !== state.inputWidth) {
        state.inputWidth = nextWidth;
      }
    };

    onMounted(() => {
      const { disabled, autoFocus, preventScroll } = props;
      if (!disabled && autoFocus) {
        getInputEl()?.focus({ preventScroll });
        foundation.handleClick();
      }
      foundation.init();
      updateInputWidth();
    });
    onBeforeUnmount(() => {
      foundation.destroy();
      adapter.unregisterClickOutsideHandler();
    });

    let prevInputValue = state.inputValue;
    let prevSize = props.size;
    let prevPlaceholder = props.placeholder;
    let prevTagsLength = state.tagsArray?.length;
    onUpdated(() => {
      if (prevInputValue !== state.inputValue || prevSize !== props.size || prevPlaceholder !== props.placeholder || prevTagsLength !== state.tagsArray?.length) {
        updateInputWidth();
      }
      prevInputValue = state.inputValue;
      prevSize = props.size;
      prevPlaceholder = props.placeholder;
      prevTagsLength = state.tagsArray?.length;
    });

    const handleInputChange = (e: Event) => foundation.handleInputChange(e);
    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);
    const handleInputFocus = (e: FocusEvent) => foundation.handleInputFocus(e);
    const handleInputBlur = (e: FocusEvent) => foundation.handleInputBlur(e);
    const handleClearBtn = (e: MouseEvent) => foundation.handleClearBtn(e);
    const handleClearEnterPress = (e: KeyboardEvent) => foundation.handleClearEnterPress(e);
    const handleTagClose = (idx: number) => foundation.handleTagClose(idx);
    const handleInputMouseLeave = () => foundation.handleInputMouseLeave();
    const handleClick = (e?: MouseEvent) => foundation.handleClick(e);
    const handleInputMouseEnter = () => foundation.handleInputMouseEnter();
    const handleClickPrefixOrSuffix = (e: MouseEvent) => foundation.handleClickPrefixOrSuffix(e);
    const handlePreventMouseDown = (e: MouseEvent) => foundation.handlePreventMouseDown(e);
    const handleInputCompositionStart = (e: CompositionEvent) => foundation.handleInputCompositionStart(e);
    const handleInputCompositionEnd = (e: CompositionEvent) => foundation.handleInputCompositionEnd(e);

    /* ---------------- basic HTML5 drag & drop sorting ---------------- */
    let dragIndex = -1;
    const onDragStart = (index: number, e: DragEvent) => {
      dragIndex = index;
      try {
        e.dataTransfer?.setData('text/plain', String(index));
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      } catch (err) {
        /* ignore */
      }
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (index: number, e: DragEvent) => {
      e.preventDefault();
      if (dragIndex === -1 || dragIndex === index) {
        dragIndex = -1;
        return;
      }
      foundation.handleSortEnd({ oldIndex: dragIndex, newIndex: index });
      dragIndex = -1;
    };

    const getRenderTagItem = () => {
      if (props.renderTagItem) return props.renderTagItem;
      if (slots.renderTagItem) return (value: string, index: number, onClose: any) => slots.renderTagItem!({ value, index, onClose });
      return undefined;
    };

    const renderTag = (value: string, index: number, sortable?: boolean) => {
      const { size, disabled, showContentTooltip, draggable } = props;
      const { active } = state;
      const showIconHandler = active && draggable;
      const tagCls = cls(`${prefixCls}-wrapper-tag`, {
        [`${prefixCls}-wrapper-tag-size-${size}`]: size,
        [`${prefixCls}-wrapper-tag-icon`]: showIconHandler,
      });
      const typoCls = cls(`${prefixCls}-wrapper-typo`, { [`${prefixCls}-wrapper-typo-disabled`]: disabled });
      const itemWrapperCls = cls({ [`${prefixCls}-drag-item`]: showIconHandler, [`${prefixCls}-wrapper-tag-icon`]: showIconHandler });
      const dragHandle = () => h(IconHandle, { class: `${prefixCls}-drag-handler` });
      const elementKey = showIconHandler ? value : `${index}${value}`;
      const onClose = (...args: any[]) => {
        if (args[1] && typeof args[1].preventDefault === 'function') args[1].preventDefault();
        !disabled && handleTagClose(index);
      };
      const renderTagItem = getRenderTagItem();
      const dragProps = sortable
        ? { draggable: true, onDragstart: (e: DragEvent) => onDragStart(index, e), onDragover: onDragOver, onDrop: (e: DragEvent) => onDrop(index, e) }
        : {};
      if (_isFunction(renderTagItem)) {
        if (showIconHandler && sortable) {
          return h('div', { class: itemWrapperCls, key: elementKey, ...dragProps }, [dragHandle(), renderTagItem(value, index, onClose)]);
        }
        return h(Fragment, { key: elementKey }, [renderTagItem(value, index, onClose)]);
      }
      return h(
        Tag,
        {
          class: tagCls,
          color: 'white',
          size: size === 'small' ? 'small' : 'large',
          type: 'light',
          onClose,
          closable: !disabled,
          key: elementKey,
          visible: true,
          ariaLabel: `${!disabled ? 'Closable ' : ''}Tag: ${value}`,
          ...dragProps,
        },
        {
          default: () => [
            showIconHandler && sortable ? dragHandle() : null,
            h(Paragraph as any, { class: typoCls, ellipsis: { showTooltip: showContentTooltip, rows: 1 } }, { default: () => value }),
          ],
        }
      );
    };

    const getAllTags = () => state.tagsArray.map((value, index) => renderTag(value, index));

    const renderTags = () => {
      const { disabled, maxTagCount, showRestTagsPopover, restTagsPopoverProps = {}, draggable, expandRestTagsOnClick } = props;
      const { tagsArray, active } = state;
      const restTagsCls = cls(`${prefixCls}-wrapper-n`, { [`${prefixCls}-wrapper-n-disabled`]: disabled });
      if (active && draggable && tagsArray.length > 0) {
        return h(
          'div',
          { class: `${prefixCls}-sortable-list` },
          tagsArray.map((value, index) => h('div', { class: `${prefixCls}-sortable-item`, key: value }, [renderTag(value, index, true)]))
        );
      }
      const allTags = getAllTags();
      let restTags: any[] = [];
      let tags = [...allTags];
      if ((!active || !expandRestTagsOnClick) && maxTagCount && maxTagCount < allTags.length) {
        tags = allTags.slice(0, maxTagCount);
        restTags = allTags.slice(maxTagCount);
      }
      const restTagsContent = h('span', { class: restTagsCls }, `+${tagsArray.length - (maxTagCount as number)}`);
      return h(Fragment, [
        ...tags,
        restTags.length > 0
          ? showRestTagsPopover
            ? h(Popover, { showArrow: true, trigger: 'hover', position: 'top', autoAdjustOverflow: true, ...restTagsPopoverProps }, { content: () => restTags, default: () => restTagsContent })
            : restTagsContent
          : null,
      ]);
    };

    const renderClearBtn = () => {
      const { hovering, tagsArray, inputValue } = state;
      const { showClear, disabled } = props;
      const clearCls = cls(`${prefixCls}-clearBtn`, {
        [`${prefixCls}-clearBtn-invisible`]: !hovering || (inputValue === '' && tagsArray.length === 0) || disabled,
      });
      if (showClear) {
        const clearIcon = slots.clearIcon ? slots.clearIcon() : normalizeNode(props.clearIcon);
        return h(
          'div',
          { role: 'button', tabindex: 0, 'aria-label': 'Clear TagInput value', class: clearCls, onClick: (e: MouseEvent) => handleClearBtn(e), onKeypress: (e: KeyboardEvent) => handleClearEnterPress(e) },
          [clearIcon ? clearIcon : h(IconClear)]
        );
      }
      return null;
    };

    const hasNode = (name: string) => Boolean(slots[name]) || !(_isNull((props as any)[name]) || _isUndefined((props as any)[name]));
    const getNode = (name: string) => (slots[name] ? slots[name]!() : normalizeNode((props as any)[name]));
    const singleNode = (node: any) => (Array.isArray(node) && node.length === 1 ? node[0] : node);

    const renderPrefix = () => {
      const { insetLabelId } = props;
      const hasPrefix = hasNode('prefix');
      const hasInset = hasNode('insetLabel');
      if (!hasPrefix && !hasInset) return null;
      const labelNode = hasPrefix ? getNode('prefix') : getNode('insetLabel');
      const raw = hasPrefix ? props.prefix : props.insetLabel;
      const prefixWrapperCls = cls(`${prefixCls}-prefix`, {
        [`${prefixCls}-inset-label`]: hasInset,
        [`${prefixCls}-prefix-text`]: labelNode && _isString(raw),
        [`${prefixCls}-prefix-icon`]: isSemiIcon(singleNode(labelNode)),
      });
      return h('div', { class: prefixWrapperCls, onMousedown: handlePreventMouseDown, onClick: handleClickPrefixOrSuffix, id: insetLabelId, 'x-semi-prop': 'prefix' }, [labelNode]);
    };

    const renderSuffix = () => {
      if (!hasNode('suffix')) return null;
      const suffix = getNode('suffix');
      const suffixWrapperCls = cls(`${prefixCls}-suffix`, {
        [`${prefixCls}-suffix-text`]: suffix && _isString(props.suffix),
        [`${prefixCls}-suffix-icon`]: isSemiIcon(singleNode(suffix)),
      });
      return h('div', { class: suffixWrapperCls, onMousedown: handlePreventMouseDown, onClick: handleClickPrefixOrSuffix, 'x-semi-prop': 'suffix' }, [suffix]);
    };

    expose({
      blur: () => {
        getInputEl()?.blur();
        foundation.clickOutsideCallBack();
      },
      focus: () => {
        getInputEl()?.focus({ preventScroll: props.preventScroll });
        if (!props.disabled) foundation.handleClick();
      },
      foundation,
      tagInputRef,
    });

    return () => {
      const { size, disabled, placeholder, validateStatus } = props;
      const { focusing, hovering, tagsArray, inputValue, active, inputWidth } = state;
      const { class: className, style, ...restAttrs } = attrs as any;
      const hasPrefix = hasNode('prefix') || hasNode('insetLabel');
      const tagInputCls = cls(prefixCls, className, {
        [`${prefixCls}-focus`]: focusing || active,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-hover`]: hovering && !disabled,
        [`${prefixCls}-error`]: validateStatus === 'error',
        [`${prefixCls}-warning`]: validateStatus === 'warning',
        [`${prefixCls}-small`]: size === 'small',
        [`${prefixCls}-large`]: size === 'large',
        [`${prefixCls}-with-prefix`]: hasPrefix,
        [`${prefixCls}-with-suffix`]: hasNode('suffix'),
      });
      const inputCls = cls(`${prefixCls}-wrapper-input`, `${prefixCls}-wrapper-input-${size}`);
      const wrapperCls = cls(`${prefixCls}-wrapper`);
      const inputWrapperStyle: Record<string, any> = {};
      if (typeof inputWidth === 'number') inputWrapperStyle.width = `${inputWidth}px`;
      return h(
        'div',
        {
          ref: tagInputRef,
          style,
          class: tagInputCls,
          'aria-disabled': disabled,
          'aria-label': props.ariaLabel ?? restAttrs['aria-label'],
          'aria-invalid': validateStatus === 'error',
          onMouseenter: () => handleInputMouseEnter(),
          onMouseleave: () => handleInputMouseLeave(),
          onClick: (e: MouseEvent) => handleClick(e),
          ...getDataAttr(restAttrs),
        },
        [
          renderPrefix(),
          h('div', { class: wrapperCls }, [
            renderTags(),
            h('span', { ref: inputMirrorRef, class: `${prefixCls}-wrapper-inputMirror` }),
            h(Input, {
              'aria-label': 'input value',
              ref: inputRef,
              class: inputCls,
              style: inputWrapperStyle,
              disabled,
              value: inputValue,
              size,
              placeholder: tagsArray.length === 0 ? placeholder : '',
              onKeydown: (e: KeyboardEvent) => handleKeyDown(e),
              onChange: (_v: any, e: Event) => handleInputChange(e),
              onBlur: (e: FocusEvent) => handleInputBlur(e),
              onFocus: (e: FocusEvent) => handleInputFocus(e),
              onCompositionStart: handleInputCompositionStart,
              onCompositionEnd: handleInputCompositionEnd,
            }),
          ]),
          renderClearBtn(),
          renderSuffix(),
        ]
      );
    };
  },
});
(TagInput as any).elementType = 'TagInput';

export default TagInput;
