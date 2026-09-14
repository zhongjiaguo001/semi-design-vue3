import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import SwitchFoundation from '@douyinfe/semi-foundation/lib/es/switch/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/switch/constants';
import '@douyinfe/semi-foundation/lib/es/switch/switch.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import Spin from '../spin/Spin';

export type SwitchSize = (typeof strings.SIZE_MAP)[number];

export const switchProps = {
  checked: { type: Boolean, default: undefined },
  modelValue: { type: Boolean, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  size: { type: String as PropType<SwitchSize>, default: 'default' },
  checkedText: { type: [String, Object, Function] as PropType<any>, default: undefined },
  uncheckedText: { type: [String, Object, Function] as PropType<any>, default: undefined },
  id: { type: String, default: undefined },
};

const Switch = defineComponent({
  name: 'Switch',
  inheritAttrs: false,
  props: switchProps,
  emits: ['update:modelValue', 'update:checked', 'change', 'mouseenter', 'mouseleave'],
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      nativeControlChecked: false as boolean | undefined,
      nativeControlDisabled: false,
      focusVisible: false,
    }, { modelProp: 'checked' });
    const getChecked = () => ('checked' in propsView ? (propsView as any).checked : undefined);
    state.nativeControlChecked = props.defaultChecked || getChecked();
    const switchRef = ref<HTMLInputElement | null>(null);

    const adapter = {
      ...baseAdapter,
      setNativeControlChecked: (v: boolean | undefined) => {
        state.nativeControlChecked = v;
      },
      setNativeControlDisabled: (v: boolean | undefined) => {
        state.nativeControlDisabled = Boolean(v);
      },
      setFocusVisible: (v: boolean) => {
        state.focusVisible = v;
      },
      notifyChange: (checked: boolean, e: any) => {
        emit('update:modelValue', checked);
        emit('update:checked', checked);
        emit('change', checked, e);
      },
    };
    const foundation = new (SwitchFoundation as any)(adapter);
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());
    watch(
      () => [getChecked(), (props as any).modelValue],
      () => foundation.setChecked(getChecked())
    );
    watch(
      () => props.disabled,
      (d) => foundation.setDisabled(d)
    );

    expose({ focus: () => switchRef.value?.focus(), blur: () => switchRef.value?.blur() });

    return () => {
      const { nativeControlChecked, nativeControlDisabled, focusVisible } = state;
      const { size, loading, id } = props;
      const checkedText = slots.checkedText ? slots.checkedText() : normalizeNode(props.checkedText);
      const uncheckedText = slots.uncheckedText ? slots.uncheckedText() : normalizeNode(props.uncheckedText);
      const { class: className, style, ...rest } = attrs as any;
      const wrapperCls = cls(className, {
        [cssClasses.PREFIX]: true,
        [cssClasses.CHECKED]: nativeControlChecked,
        [cssClasses.DISABLED]: nativeControlDisabled,
        [cssClasses.LARGE]: size === 'large',
        [cssClasses.SMALL]: size === 'small',
        [cssClasses.LOADING]: loading,
        [cssClasses.FOCUS]: focusVisible,
      });
      const showCheckedText = checkedText && nativeControlChecked && size !== 'small';
      const showUncheckedText = uncheckedText && !nativeControlChecked && size !== 'small';
      const aria = Object.keys(rest).reduce((acc, k) => {
        if (k.startsWith('aria-')) acc[k] = rest[k];
        return acc;
      }, {} as Record<string, any>);
      return h(
        'div',
        {
          class: wrapperCls,
          style,
          onMouseenter: (e: MouseEvent) => emit('mouseenter', e),
          onMouseleave: (e: MouseEvent) => emit('mouseleave', e),
          ...getDataAttr(rest),
        },
        [
          loading ? h(Spin, { wrapperClassName: cssClasses.LOADING_SPIN, size: size === 'default' ? 'middle' : size }) : h('div', { class: cssClasses.KNOB, 'aria-hidden': 'true' }),
          showCheckedText ? h('div', { class: cssClasses.CHECKED_TEXT, 'x-semi-prop': 'checkedText' }, [checkedText]) : null,
          showUncheckedText ? h('div', { class: cssClasses.UNCHECKED_TEXT, 'x-semi-prop': 'uncheckedText' }, [uncheckedText]) : null,
          h('input', {
            type: 'checkbox',
            class: cssClasses.NATIVE_CONTROL,
            disabled: nativeControlDisabled || loading,
            checked: nativeControlChecked || false,
            ref: switchRef,
            id,
            role: 'switch',
            'aria-checked': Boolean(nativeControlChecked),
            ...aria,
            'aria-disabled': props.disabled,
            onChange: (e: Event) => {
              foundation.handleChange((e.target as HTMLInputElement).checked, e);
              // controlled: keep DOM in sync with state
              Promise.resolve().then(() => {
                if (switchRef.value) switchRef.value.checked = Boolean(state.nativeControlChecked);
              });
            },
            onFocus: (e: FocusEvent) => foundation.handleFocusVisible(e),
            onBlur: () => foundation.handleBlur(),
          }),
        ]
      );
    };
  },
});

(Switch as any).__SemiComponentName__ = 'Switch';

export { Switch, Switch as default };
