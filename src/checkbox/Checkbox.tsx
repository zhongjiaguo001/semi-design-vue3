import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, reactive, computed } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import _isUndefined from 'lodash/isUndefined';
import _isBoolean from 'lodash/isBoolean';
import _isEqual from 'lodash/isEqual';
import CheckboxFoundation from '@douyinfe/semi-foundation/lib/es/checkbox/checkboxFoundation';
import CheckboxGroupFoundation from '@douyinfe/semi-foundation/lib/es/checkbox/checkboxGroupFoundation';
import { checkboxClasses as css, checkboxGroupClasses, strings } from '@douyinfe/semi-foundation/lib/es/checkbox/constants';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/checkbox/checkbox.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode, flattenChildren, cloneVNode } from '../_utils';
import { IconCheckboxTick, IconCheckboxIndeterminate } from '../icons/generated';
import { useCheckboxContext, provideCheckboxContext } from './context';

export type CheckboxType = 'default' | 'card' | 'pureCard';

export const checkboxProps = {
  checked: { type: Boolean, default: undefined },
  modelValue: { type: Boolean, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  value: { type: null as unknown as PropType<any>, default: undefined },
  extra: { type: [String, Object, Function] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: undefined },
  type: { type: String as PropType<CheckboxType>, default: 'default' },
  addonId: { type: String, default: undefined },
  extraId: { type: String, default: undefined },
  preventScroll: { type: Boolean, default: false },
  autoFocus: { type: Boolean, default: false },
  role: { type: String, default: undefined },
  tabIndex: { type: Number, default: undefined },
  id: { type: String, default: undefined },
  name: { type: String, default: undefined },
};

const Checkbox = defineComponent({
  name: 'Checkbox',
  inheritAttrs: false,
  props: checkboxProps,
  emits: ['update:modelValue', 'update:checked', 'change', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit, expose }) {
    const context = useCheckboxContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      checked: false,
      addonId: props.addonId,
      extraId: props.extraId,
      focusVisible: false,
    }, { modelProp: 'checked' });
    const getChecked = () => ('checked' in propsView ? (propsView as any).checked : undefined);
    state.checked = getChecked() || props.defaultChecked || false;
    const inputRef = ref<HTMLInputElement | null>(null);

    const isInGroup = () => Boolean(context && context.checkboxGroup && 'value' in propsView);

    let rendering = false;
    // Outside render (e.g. foundation.init in setup) only test slot presence to avoid invoking the slot early.
    const hasChildren = () => (rendering ? Boolean(slots.default && flattenChildren(slots.default()).length) : Boolean(slots.default));
    const hasExtra = () => Boolean(slots.extra || props.extra);

    const adapter = {
      ...baseAdapter,
      getProps: () => new Proxy(propsView, {
        get(t, k) {
          if (k === 'children') return hasChildren();
          if (k === 'extra') return hasExtra() ? (props.extra ?? true) : undefined;
          return Reflect.get(t, k);
        },
        has(t, k) {
          if (k === 'children') return hasChildren();
          return Reflect.has(t, k);
        },
      }),
      getProp: (key: string) => {
        if (key === 'children') return hasChildren();
        if (key === 'extra') return hasExtra() ? (props.extra ?? true) : undefined;
        return (propsView as any)[key];
      },
      setNativeControlChecked: (checked: boolean) => {
        state.checked = checked;
      },
      notifyChange: (cbContent: any) => {
        emit('update:modelValue', cbContent.target.checked);
        emit('update:checked', cbContent.target.checked);
        emit('change', cbContent);
      },
      generateEvent: (checked: boolean, e: any) => ({
        target: { ...props, checked },
        stopPropagation: () => e.stopPropagation(),
        preventDefault: () => e.preventDefault(),
        nativeEvent: {
          stopImmediatePropagation: () => {
            if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          },
        },
      }),
      getIsInGroup: () => isInGroup(),
      getGroupValue: () => (context && context.checkboxGroup && context.checkboxGroup.value) || [],
      notifyGroupChange: (cbContent: any) => context!.checkboxGroup!.onChange(cbContent),
      getGroupDisabled: () => Boolean(context && context.checkboxGroup && context.checkboxGroup.disabled),
      setAddonId: () => {
        state.addonId = getUuidShort({ prefix: 'addon' });
      },
      setExtraId: () => {
        state.extraId = getUuidShort({ prefix: 'extra' });
      },
      setFocusVisible: (focusVisible: boolean) => {
        state.focusVisible = focusVisible;
      },
      focusCheckboxEntity: () => inputRef.value?.focus({ preventScroll: props.preventScroll }),
    };
    const foundation = new (CheckboxFoundation as any)(adapter);
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => [getChecked(), (props as any).modelValue],
      () => {
        const c = getChecked();
        if (_isUndefined(c)) foundation.setChecked(false);
        else if (_isBoolean(c)) foundation.setChecked(c);
      }
    );
    onMounted(() => {
      if (props.autoFocus) inputRef.value?.focus({ preventScroll: props.preventScroll });
    });

    expose({ focus: () => inputRef.value?.focus({ preventScroll: props.preventScroll }), blur: () => inputRef.value?.blur() });

    return () => {
      const { disabled, prefixCls, indeterminate, value, role, tabIndex, id, type } = props;
      const { checked, addonId, extraId, focusVisible } = state;
      rendering = true;
      const children = slots.default?.();
      const childrenExists = hasChildren();
      const extra = slots.extra ? slots.extra() : normalizeNode(props.extra);
      const p: any = { checked, disabled };
      const inGroup = isInGroup();
      if (inGroup) {
        const group = context!.checkboxGroup!;
        if (group.value) p.checked = (group.value || []).includes(value);
        if (group.disabled) p.disabled = group.disabled || disabled;
        p.isCardType = group.isCardType;
        p.isPureCardType = group.isPureCardType;
        p.name = group.name;
      } else {
        p.isPureCardType = type === strings.TYPE_PURECARD;
        p.isCardType = type === strings.TYPE_CARD || p.isPureCardType;
      }
      const prefix = prefixCls || css.PREFIX;
      const focusOuter = p.isCardType || p.isPureCardType;
      const { class: className, style, ...rest } = attrs as any;
      const xSemiPropChildren = rest['x-semi-children-alias'] || 'children';
      const wrapper = classnames(prefix, {
        [`${prefix}-disabled`]: p.disabled,
        [`${prefix}-indeterminate`]: indeterminate,
        [`${prefix}-checked`]: p.checked,
        [`${prefix}-unChecked`]: !p.checked,
        [`${prefix}-cardType`]: p.isCardType,
        [`${prefix}-cardType_disabled`]: p.disabled && p.isCardType,
        [`${prefix}-cardType_enable`]: !(p.disabled && p.isCardType),
        [`${prefix}-cardType_checked`]: p.isCardType && p.checked && !p.disabled,
        [`${prefix}-cardType_checked_disabled`]: p.isCardType && p.checked && p.disabled,
        [className]: Boolean(className),
        [`${prefix}-focus`]: focusVisible && focusOuter,
      });
      const extraCls = classnames(`${prefix}-extra`, { [`${prefix}-cardType_extra_noChildren`]: p.isCardType && !childrenExists });
      const name = (inGroup && context!.checkboxGroup!.name) || props.name;
      const renderContent = () => {
        if (!childrenExists && !extra) return null;
        return h('div', { class: `${prefix}-content` }, [
          childrenExists ? h('span', { id: addonId, class: `${prefix}-addon`, 'x-semi-prop': xSemiPropChildren }, children) : null,
          extra ? h('div', { id: extraId, class: extraCls, 'x-semi-prop': 'extra' }, [extra]) : null,
        ]);
      };
      // inner
      const focusInner = focusVisible && !focusOuter;
      const innerWrapper = classnames({ [`${prefix}-inner`]: true, [`${prefix}-inner-checked`]: Boolean(p.checked), [`${prefix}-inner-pureCardType`]: p.isPureCardType }, css.WRAPPER);
      const innerCls = classnames({ [`${prefix}-inner-display`]: true, [`${prefix}-focus`]: focusInner, [`${prefix}-focus-border`]: focusInner && !p.checked });
      const icon = p.checked ? h(IconCheckboxTick) : indeterminate ? h(IconCheckboxIndeterminate) : null;
      const aria = Object.keys(rest).reduce((acc, k) => {
        if (k.startsWith('aria-')) acc[k] = rest[k];
        return acc;
      }, {} as Record<string, any>);
      const inputProps: Record<string, any> = {
        type: 'checkbox',
        ...aria,
        'aria-disabled': p.disabled,
        'aria-checked': p.checked,
        'aria-labelledby': childrenExists ? addonId : undefined,
        'aria-describedby': (extra ? extraId : undefined) || rest['aria-describedby'],
        class: css.INPUT,
        checked: Boolean(p.checked),
        disabled: p.disabled,
        onChange: (e: Event) => {
          // native change is driven by the wrapper click; keep DOM in sync with state
          (e.target as HTMLInputElement).checked = Boolean(p.checked);
        },
        onFocus: (e: FocusEvent) => foundation.handleFocusVisible(e),
        onBlur: () => foundation.handleBlur(),
        ref: inputRef,
      };
      if (name) inputProps.name = name;
      return h(
        'span',
        {
          role,
          tabindex: tabIndex,
          style,
          class: wrapper,
          id,
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
          onClick: (e: MouseEvent) => foundation.handleChange(e),
          onKeypress: (e: KeyboardEvent) => foundation.handleEnterPress(e),
          'aria-labelledby': rest['aria-labelledby'],
          ...getDataAttr(rest),
        },
        [h('span', { class: innerWrapper }, [h('input', inputProps), h('span', { class: innerCls }, [icon])]), renderContent()]
      );
    };
  },
});
(Checkbox as any).elementType = 'Checkbox';

export interface CheckboxOptionType {
  label?: any;
  value: any;
  disabled?: boolean;
  extra?: any;
  className?: string;
  style?: CSSProperties;
  onChange?: (e: any) => void;
}

export const checkboxGroupProps = {
  value: { type: Array as PropType<any[]>, default: undefined },
  modelValue: { type: Array as PropType<any[]>, default: undefined },
  defaultValue: { type: Array as PropType<any[]>, default: () => [] },
  disabled: { type: Boolean, default: false },
  options: { type: Array as PropType<Array<CheckboxOptionType | string>>, default: undefined },
  direction: { type: String as PropType<'horizontal' | 'vertical'>, default: strings.DEFAULT_DIRECTION },
  type: { type: String as PropType<CheckboxType>, default: strings.TYPE_DEFAULT },
  prefixCls: { type: String, default: undefined },
  name: { type: String, default: undefined },
  id: { type: String, default: undefined },
};

export const CheckboxGroup = defineComponent({
  name: 'CheckboxGroup',
  inheritAttrs: false,
  props: checkboxGroupProps,
  emits: ['update:modelValue', 'update:value', 'change'],
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, { value: [] as any[] }, { modelProp: 'value' });
    const getValue = () => ('value' in propsView ? (propsView as any).value : undefined);
    state.value = getValue() || props.defaultValue;
    const adapter = {
      ...baseAdapter,
      updateGroupValue: (value: any[]) => {
        state.value = value;
      },
      notifyChange: (value: any[]) => {
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
    };
    const foundation = new (CheckboxGroupFoundation as any)(adapter);
    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => [getValue(), (props as any).modelValue],
      (n, o) => {
        if (!_isEqual(n?.[0], o?.[0]) || !_isEqual(n?.[1], o?.[1])) foundation.handlePropValueChange(getValue());
      }
    );

    const groupCtx = reactive({
      onChange: (evt: any) => foundation.handleChange(evt),
      value: [] as any[],
      disabled: false,
      name: 'default',
      isCardType: false,
      isPureCardType: false,
    });
    const ctxValue = reactive({ checkboxGroup: groupCtx });
    watch(
      () => [state.value, props.disabled, props.name, props.type],
      () => {
        const isPureCardType = props.type === strings.TYPE_PURECARD;
        groupCtx.value = (state.value || []).slice();
        groupCtx.disabled = props.disabled;
        groupCtx.name = foundation.getFormatName();
        groupCtx.isCardType = props.type === strings.TYPE_CARD || isPureCardType;
        groupCtx.isPureCardType = isPureCardType;
      },
      { immediate: true, deep: true }
    );
    provideCheckboxContext(ctxValue);

    return () => {
      const { options, prefixCls, direction, id, type, disabled } = props;
      const isPureCardType = type === strings.TYPE_PURECARD;
      const isCardType = type === strings.TYPE_CARD || isPureCardType;
      // React CheckboxGroup uses checkboxGroupClasses.PREFIX (`semi-checkboxGroup`).
      // Using checkboxClasses.PREFIX (`semi-checkbox`) makes `.semi-checkbox:hover .semi-checkbox-inner-display`
      // match every item when the group itself is hovered.
      const prefix = prefixCls || checkboxGroupClasses.PREFIX;
      const { class: className, style, ...rest } = attrs as any;
      const prefixClsDisplay = classnames(
        {
          [prefix]: true,
          [`${prefix}-wrapper`]: true,
          [`${prefix}-${direction}`]: direction,
          [`${prefix}-${direction}-cardType`]: direction && isCardType,
          [`${prefix}-${direction}-pureCardType`]: direction && isPureCardType,
        },
        className
      );
      let inner: any;
      if (options) {
        inner = options.map((option, index) => {
          if (typeof option === 'string') {
            return h(Checkbox, { role: 'listitem', key: index, disabled, value: option, prefixCls }, () => option);
          }
          return h(
            Checkbox,
            { role: 'listitem', key: index, disabled: option.disabled || disabled, value: option.value, prefixCls, extra: option.extra, class: option.className, style: option.style, onChange: option.onChange },
            () => normalizeNode(option.label)
          );
        });
      } else {
        inner = flattenChildren(slots.default?.()).map((itm, index) => {
          if (typeof itm.type !== 'object' || itm.type === null) return itm;
          const extra: Record<string, any> = { key: index };
          if (itm.type === Checkbox || (itm.type as any).name === 'Checkbox') extra.role = 'listitem';
          return cloneVNode(itm, extra);
        });
      }
      return h(
        'div',
        {
          id,
          role: 'list',
          'aria-label': rest['aria-label'],
          class: prefixClsDisplay,
          style,
          'aria-labelledby': rest['aria-labelledby'],
          'aria-describedby': rest['aria-describedby'],
          ...getDataAttr(rest),
        },
        inner
      );
    };
  },
});

// React parity: `Checkbox.Group` static alias of CheckboxGroup
(Checkbox as any).Group = CheckboxGroup;

export default Checkbox;
