import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, reactive, inject, provide } from 'vue';
import type { PropType, CSSProperties, InjectionKey } from 'vue';
import cls from 'classnames';
import _isUndefined from 'lodash/isUndefined';
import _isBoolean from 'lodash/isBoolean';
import RadioFoundation from '@douyinfe/semi-foundation/lib/es/radio/radioFoundation';
import RadioInnerFoundation from '@douyinfe/semi-foundation/lib/es/radio/radioInnerFoundation';
import RadioGroupFoundation from '@douyinfe/semi-foundation/lib/es/radio/radioGroupFoundation';
import { radioClasses as css, radioGroupClasses, strings } from '@douyinfe/semi-foundation/lib/es/radio/constants';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/radio/radio.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode, flattenChildren, cloneVNode } from '../_utils';
import { IconRadio } from '../icons/generated';

export type RadioType = 'default' | 'button' | 'card' | 'pureCard';
export type RadioMode = 'advanced' | '';
export type RadioButtonSize = 'middle' | 'small' | 'large';

export interface RadioGroupContextValue {
  onChange: (e: any) => void;
  value: any;
  disabled?: boolean;
  name?: string;
  isButtonRadio?: boolean;
  isCardRadio?: boolean;
  isPureCardRadio?: boolean;
  buttonSize?: RadioButtonSize;
  prefixCls?: string;
}
export interface RadioContextValue {
  radioGroup?: RadioGroupContextValue;
  mode?: RadioMode;
}
export const RadioContextKey: InjectionKey<RadioContextValue> = Symbol('SemiRadioContext');
export const useRadioContext = () => inject(RadioContextKey, undefined);

const RadioInner = defineComponent({
  name: 'RadioInner',
  inheritAttrs: false,
  props: {
    checked: { type: Boolean, default: undefined },
    defaultChecked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    mode: { type: String as PropType<RadioMode>, default: '' },
    autoFocus: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    isButtonRadio: { type: Boolean, default: false },
    isPureCardRadioGroup: { type: Boolean, default: false },
    addonId: { type: String, default: undefined },
    extraId: { type: String, default: undefined },
    prefixCls: { type: String, default: undefined },
    focusInner: { type: Boolean, default: false },
    preventScroll: { type: Boolean, default: false },
    value: { type: null as unknown as PropType<any>, default: undefined },
    onInputFocus: { type: Function as PropType<(e: any) => void>, default: undefined },
    onInputBlur: { type: Function as PropType<(e: any) => void>, default: undefined },
    onChange: { type: Function as PropType<(e: any) => void>, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  setup(props, { expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { checked: false });
    const inputRef = ref<HTMLInputElement | null>(null);
    const adapter = {
      ...baseAdapter,
      setNativeControlChecked: (checked: boolean) => {
        state.checked = checked;
      },
      notifyChange: (e: any) => props.onChange?.(e),
    };
    const foundation = new (RadioInnerFoundation as any)(adapter);
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => props.checked,
      (c) => foundation.setChecked(c)
    );
    onMounted(() => {
      if (props.autoFocus) inputRef.value?.focus({ preventScroll: props.preventScroll });
    });
    expose({ focus: () => inputRef.value?.focus({ preventScroll: props.preventScroll }), blur: () => inputRef.value?.blur() });
    return () => {
      const { disabled, mode, name, isButtonRadio, isPureCardRadioGroup, addonId, extraId, focusInner, onInputFocus, onInputBlur, ariaLabel } = props;
      const { checked } = state;
      const prefix = props.prefixCls || css.PREFIX;
      const wrapper = cls({
        [`${prefix}-inner`]: true,
        [`${prefix}-inner-checked`]: Boolean(checked),
        [`${prefix}-inner-buttonRadio`]: isButtonRadio,
        [`${prefix}-inner-pureCardRadio`]: isPureCardRadioGroup,
      });
      const inner = cls({ [`${prefix}-focus`]: focusInner, [`${prefix}-focus-border`]: focusInner && !checked, [`${prefix}-inner-display`]: !isButtonRadio });
      return h('span', { class: wrapper }, [
        h('input', {
          ref: inputRef,
          type: mode === 'advanced' ? 'checkbox' : 'radio',
          checked: Boolean(checked),
          disabled,
          onChange: (e: Event) => {
            foundation.handleChange(e);
            Promise.resolve().then(() => {
              if (inputRef.value) inputRef.value.checked = Boolean(state.checked);
            });
          },
          name,
          'aria-label': ariaLabel,
          'aria-labelledby': addonId,
          'aria-describedby': extraId,
          onFocus: onInputFocus,
          onBlur: onInputBlur,
        }),
        h('span', { class: inner }, [checked ? h(IconRadio) : null]),
      ]);
    };
  },
});

export const radioProps = {
  checked: { type: Boolean, default: undefined },
  modelValue: { type: Boolean, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  value: { type: null as unknown as PropType<any>, default: undefined },
  extra: { type: [String, Object, Function] as PropType<any>, default: undefined },
  mode: { type: String as PropType<RadioMode>, default: '' },
  type: { type: String as PropType<RadioType>, default: 'default' },
  displayMode: { type: String as PropType<'vertical' | ''>, default: undefined },
  prefixCls: { type: String, default: undefined },
  addonId: { type: String, default: undefined },
  extraId: { type: String, default: undefined },
  addonClassName: { type: String, default: undefined },
  addonStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  autoFocus: { type: Boolean, default: false },
  preventScroll: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
};

const Radio = defineComponent({
  name: 'Radio',
  inheritAttrs: false,
  props: radioProps,
  emits: ['update:modelValue', 'update:checked', 'change', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit, expose }) {
    const context = useRadioContext();
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      hover: false,
      addonId: props.addonId,
      extraId: props.extraId,
      checked: false,
      focusVisible: false,
    }, { modelProp: 'checked' });
    const getChecked = () => ('checked' in propsView ? (propsView as any).checked : undefined);
    state.checked = getChecked() || props.defaultChecked || false;
    const radioEntity = ref<any>(null);
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
      }),
      getProp: (key: string) => {
        if (key === 'children') return hasChildren();
        if (key === 'extra') return hasExtra() ? (props.extra ?? true) : undefined;
        return (propsView as any)[key];
      },
      setHover: (hover: boolean) => {
        state.hover = hover;
      },
      setAddonId: () => {
        state.addonId = getUuidShort({ prefix: 'addon' });
      },
      setChecked: (checked: boolean) => {
        state.checked = checked;
      },
      setExtraId: () => {
        state.extraId = getUuidShort({ prefix: 'extra' });
      },
      setFocusVisible: (focusVisible: boolean) => {
        state.focusVisible = focusVisible;
      },
    };
    const foundation = new (RadioFoundation as any)(adapter);
    foundation.init();
    watch(
      () => [getChecked(), (props as any).modelValue],
      () => {
        const c = getChecked();
        if (_isUndefined(c)) foundation.setChecked(false);
        else if (_isBoolean(c)) foundation.setChecked(c);
      }
    );
    const isInGroup = () => Boolean(context && context.radioGroup);

    const onChange = (e: any) => {
      if (isInGroup()) {
        context!.radioGroup!.onChange?.(e);
      }
      if (!('checked' in propsView)) foundation.setChecked(e.target.checked);
      emit('update:modelValue', e.target.checked);
      emit('update:checked', e.target.checked);
      emit('change', e);
    };

    expose({ focus: () => radioEntity.value?.focus(), blur: () => radioEntity.value?.blur() });

    return () => {
      const { addonClassName, addonStyle, disabled, prefixCls, displayMode, mode, type, value: propValue, name } = props;
      rendering = true;
      const children = slots.default?.();
      const childrenExists = Boolean(children && flattenChildren(children).length);
      const extra = slots.extra ? slots.extra() : normalizeNode(props.extra);
      const { hover: isHover, addonId, extraId, focusVisible, checked } = state;
      let realChecked: boolean, isDisabled: boolean, realMode: RadioMode, isButtonRadioGroup: boolean | undefined, isCardRadioGroup: boolean, isPureCardRadioGroup: boolean, isButtonRadioComponent = false, buttonSize: RadioButtonSize | undefined, realPrefixCls: string | undefined;
      const p: any = { checked, disabled };
      if (isInGroup()) {
        const group = context!.radioGroup!;
        realChecked = group.value === propValue;
        isDisabled = disabled || Boolean(group.disabled);
        realMode = context!.mode || '';
        isButtonRadioGroup = group.isButtonRadio;
        isCardRadioGroup = Boolean(group.isCardRadio);
        isPureCardRadioGroup = Boolean(group.isPureCardRadio);
        buttonSize = group.buttonSize;
        realPrefixCls = prefixCls || group.prefixCls;
        p.checked = realChecked;
        p.disabled = isDisabled;
      } else {
        realChecked = checked;
        isDisabled = disabled;
        realMode = mode;
        isButtonRadioComponent = type === 'button';
        realPrefixCls = prefixCls;
        isButtonRadioGroup = type === strings.TYPE_BUTTON;
        isPureCardRadioGroup = type === strings.TYPE_PURECARD;
        isCardRadioGroup = type === strings.TYPE_CARD || isPureCardRadioGroup;
      }
      const isButtonRadio = typeof isButtonRadioGroup === 'undefined' ? isButtonRadioComponent : isButtonRadioGroup;
      const prefix = realPrefixCls || css.PREFIX;
      const focusOuter = isCardRadioGroup || isPureCardRadioGroup || isButtonRadio;
      const { class: className, style, ...rest } = attrs as any;
      const wrapper = cls(prefix, {
        [`${prefix}-disabled`]: isDisabled,
        [`${prefix}-checked`]: realChecked,
        [`${prefix}-${displayMode}`]: Boolean(displayMode),
        [`${prefix}-buttonRadioComponent`]: isButtonRadioComponent,
        [`${prefix}-buttonRadioGroup`]: isButtonRadioGroup,
        [`${prefix}-buttonRadioGroup-${buttonSize}`]: isButtonRadioGroup && buttonSize,
        [`${prefix}-cardRadioGroup`]: isCardRadioGroup,
        [`${prefix}-cardRadioGroup_disabled`]: isDisabled && isCardRadioGroup,
        [`${prefix}-cardRadioGroup_checked`]: isCardRadioGroup && realChecked && !isDisabled,
        [`${prefix}-cardRadioGroup_checked_disabled`]: isCardRadioGroup && realChecked && isDisabled,
        [`${prefix}-cardRadioGroup_hover`]: isCardRadioGroup && !realChecked && isHover && !isDisabled,
        [className]: Boolean(className),
        [`${prefix}-focus`]: focusVisible && (isCardRadioGroup || isPureCardRadioGroup),
      });
      const groupName = isInGroup() ? context!.radioGroup!.name : undefined;
      const addonCls = cls(
        {
          [`${prefix}-addon`]: !isButtonRadio,
          [`${prefix}-addon-buttonRadio`]: isButtonRadio,
          [`${prefix}-addon-buttonRadio-checked`]: isButtonRadio && realChecked,
          [`${prefix}-addon-buttonRadio-disabled`]: isButtonRadio && isDisabled,
          [`${prefix}-addon-buttonRadio-hover`]: isButtonRadio && !realChecked && !isDisabled && isHover,
          [`${prefix}-addon-buttonRadio-${buttonSize}`]: isButtonRadio && buttonSize,
          [`${prefix}-focus`]: focusVisible && isButtonRadio,
        },
        addonClassName
      );
      const renderContent = () => {
        if (!childrenExists && !extra) return null;
        return h('div', { class: cls([`${prefix}-content`, { [`${prefix}-isCardRadioGroup_content`]: isCardRadioGroup }]) }, [
          childrenExists ? h('span', { class: addonCls, style: addonStyle, id: addonId, 'x-semi-prop': 'children' }, children) : null,
          extra && !isButtonRadio ? h('div', { class: `${prefix}-extra`, id: extraId, 'x-semi-prop': 'extra' }, [extra]) : null,
        ]);
      };
      return h(
        'label',
        {
          style,
          class: wrapper,
          onMouseenter: (e: MouseEvent) => {
            emit('mouseenter', e);
            foundation.setHover(true);
          },
          onMouseleave: (e: MouseEvent) => {
            emit('mouseleave', e);
            foundation.setHover(false);
          },
          ...getDataAttr(rest),
        },
        [
          h(RadioInner, {
            ...p,
            value: propValue,
            defaultChecked: props.defaultChecked,
            autoFocus: props.autoFocus,
            preventScroll: props.preventScroll,
            prefixCls: realPrefixCls,
            mode: realMode,
            name: name ?? groupName,
            isButtonRadio,
            isPureCardRadioGroup,
            onChange,
            ref: radioEntity,
            addonId: childrenExists ? addonId : undefined,
            extraId: extra ? extraId : undefined,
            focusInner: focusVisible && !focusOuter,
            onInputFocus: (e: any) => foundation.handleFocusVisible(e),
            onInputBlur: () => foundation.handleBlur(),
            ariaLabel: props.ariaLabel ?? rest['aria-label'],
          }),
          renderContent(),
        ]
      );
    };
  },
});
(Radio as any).elementType = 'Radio';

export interface RadioOptionType {
  label?: any;
  value: any;
  disabled?: boolean;
  extra?: any;
  className?: string;
  style?: CSSProperties;
  addonId?: string;
  addonStyle?: CSSProperties;
  addonClassName?: string;
  extraId?: string;
}

export const radioGroupProps = {
  value: { type: null as unknown as PropType<any>, default: undefined },
  modelValue: { type: null as unknown as PropType<any>, default: undefined },
  defaultValue: { type: null as unknown as PropType<any>, default: undefined },
  disabled: { type: Boolean, default: false },
  options: { type: Array as PropType<Array<RadioOptionType | string>>, default: undefined },
  direction: { type: String as PropType<'horizontal' | 'vertical'>, default: strings.DEFAULT_DIRECTION },
  mode: { type: String as PropType<RadioMode>, default: '' },
  type: { type: String as PropType<RadioType>, default: strings.TYPE_DEFAULT },
  buttonSize: { type: String as PropType<RadioButtonSize>, default: 'middle' },
  prefixCls: { type: String, default: undefined },
  name: { type: String, default: undefined },
  id: { type: String, default: undefined },
};

export const RadioGroup = defineComponent({
  name: 'RadioGroup',
  inheritAttrs: false,
  props: radioGroupProps,
  emits: ['update:modelValue', 'update:value', 'change'],
  setup(props, { slots, attrs, emit }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, { value: undefined as any }, { modelProp: 'value' });
    const getValue = () => ('value' in propsView ? (propsView as any).value : undefined);
    state.value = getValue() ?? props.defaultValue;
    const adapter = {
      ...baseAdapter,
      setValue: (value: any) => {
        state.value = value;
      },
      isInProps: (name: string) => name in propsView,
      notifyChange: (evt: any) => {
        emit('update:modelValue', evt.target.value);
        emit('update:value', evt.target.value);
        emit('change', evt);
      },
    };
    const foundation = new (RadioGroupFoundation as any)(adapter);
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => [getValue(), (props as any).modelValue],
      (n, o) => {
        const nv = getValue();
        const ov = o?.[0];
        if (typeof ov === 'number' && isNaN(ov) && typeof nv === 'number' && isNaN(nv)) return;
        if (ov !== nv) foundation.handlePropValueChange(nv);
      }
    );
    const groupCtx = reactive<RadioGroupContextValue>({
      onChange: (evt: any) => foundation.handleChange(evt),
      value: undefined,
      disabled: false,
      name: 'default',
      isButtonRadio: false,
      isCardRadio: false,
      isPureCardRadio: false,
      buttonSize: 'middle',
      prefixCls: undefined,
    });
    const ctxValue = reactive<RadioContextValue>({ radioGroup: groupCtx, mode: '' });
    watch(
      () => [state.value, props.disabled, props.name, props.type, props.buttonSize, props.prefixCls, props.mode],
      () => {
        const isPureCardRadio = props.type === strings.TYPE_PURECARD;
        groupCtx.value = state.value;
        groupCtx.disabled = props.disabled;
        groupCtx.name = props.name || 'default';
        groupCtx.isButtonRadio = props.type === strings.TYPE_BUTTON;
        groupCtx.isCardRadio = props.type === strings.TYPE_CARD || isPureCardRadio;
        groupCtx.isPureCardRadio = isPureCardRadio;
        groupCtx.buttonSize = props.buttonSize;
        groupCtx.prefixCls = props.prefixCls;
        ctxValue.mode = props.mode;
      },
      { immediate: true }
    );
    provide(RadioContextKey, ctxValue);

    return () => {
      const { options, prefixCls, direction, type, id, disabled } = props;
      const isButtonRadio = type === strings.TYPE_BUTTON;
      const isPureCardRadio = type === strings.TYPE_PURECARD;
      const isCardRadio = type === strings.TYPE_CARD || isPureCardRadio;
      const isDefaultRadio = type === strings.TYPE_DEFAULT;
      // React RadioGroup uses radioGroupClasses.PREFIX (`semi-radioGroup`).
      // Using radioClasses.PREFIX (`semi-radio`) makes `.semi-radio:hover .semi-radio-inner-display`
      // match every item when the group itself is hovered.
      const prefix = prefixCls || radioGroupClasses.PREFIX;
      const { class: className, style, ...rest } = attrs as any;
      const prefixClsDisplay = cls(className, {
        [prefix]: true,
        [`${prefix}-wrapper`]: true,
        [`${prefix}-${direction}`]: direction && !isButtonRadio,
        [`${prefix}-${direction}-default`]: direction && isDefaultRadio,
        [`${prefix}-${direction}-card`]: direction && isCardRadio,
        [`${prefix}-buttonRadio`]: isButtonRadio,
      });
      let inner: any;
      if (options) {
        inner = options.map((option, index) => {
          if (typeof option === 'string') {
            return h(Radio, { key: index, disabled, value: option }, () => option);
          }
          return h(
            Radio,
            { key: index, disabled: option.disabled || disabled, value: option.value, extra: option.extra, class: option.className, style: option.style, addonId: option.addonId, addonStyle: option.addonStyle, addonClassName: option.addonClassName, extraId: option.extraId },
            () => normalizeNode(option.label)
          );
        });
      } else {
        inner = flattenChildren(slots.default?.()).map((itm, index) => (typeof itm.type === 'object' ? cloneVNode(itm, { key: index }) : itm));
      }
      const aria = Object.keys(rest).reduce((acc, k) => {
        if (k.startsWith('aria-')) acc[k] = rest[k];
        return acc;
      }, {} as Record<string, any>);
      return h('div', { class: prefixClsDisplay, style, id, ...aria, ...getDataAttr(rest) }, inner);
    };
  },
});

export { RadioInner };
export default Radio;
