import { defineComponent, h, ref, watch } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import PinCodeFoundation from '@douyinfe/semi-foundation/lib/es/pincode/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/pincode/constants';
import '@douyinfe/semi-foundation/lib/es/pincode/pincode.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import Input from '../input/Input';
import type { InputSize } from '../input/Input';

export type PinCodeFormat = 'number' | 'mixed' | RegExp | ((value: string) => boolean);

export const pinCodeProps = {
  value: { type: String, default: undefined },
  modelValue: { type: String, default: undefined },
  defaultValue: { type: String, default: undefined },
  format: { type: [String, Object, Function, RegExp] as PropType<PinCodeFormat>, default: 'number' },
  count: { type: Number, default: 6 },
  autoFocus: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: undefined },
  onComplete: { type: Function as PropType<(value: string) => void>, default: undefined },
};

export const pinCodeEmits = ['update:modelValue', 'update:value', 'change', 'complete'];

const PinCode = defineComponent({
  name: 'PinCode',
  inheritAttrs: false,
  props: pinCodeProps,
  emits: pinCodeEmits,
  setup(props, { attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView, setStateAsync } = useBaseComponent(props as any, {
      valueList: [] as string[],
      currentActiveIndex: 0,
    }, { modelProp: 'value' });

    const getValueProp = () => ('value' in propsView ? (propsView as any).value : undefined);
    {
      const init = getValueProp() || props.defaultValue;
      state.valueList = (init && String(init).split('')) || [];
    }

    // component instances are stored and the DOM is resolved lazily (the child's own element ref
    // is populated after the parent's component ref callback runs on first mount)
    const inputCompList: any[] = [];
    const setInputRef = (index: number) => (comp: any) => {
      inputCompList[index] = comp;
    };
    const inputDOMList = new Proxy([] as (HTMLInputElement | null)[], {
      get(_t, key) {
        if (typeof key === 'string' && /^\d+$/.test(key)) {
          const comp = inputCompList[Number(key)];
          return comp && typeof comp.getInputElement === 'function' ? comp.getInputElement() : null;
        }
        return Reflect.get(inputCompList, key);
      },
    });

    // the foundation reads `onComplete` from props; merge the prop callback and the emit
    const propsProxy = new Proxy(propsView as any, {
      get(target, key) {
        if (key === 'onComplete') {
          return (value: string) => {
            props.onComplete?.(value);
            emit('complete', value);
          };
        }
        return Reflect.get(target, key);
      },
    });

    const adapter = {
      ...baseAdapter,
      getProps: () => propsProxy,
      getProp: (key: string) => propsProxy[key],
      onCurrentActiveIndexChange: async (i: number) => {
        await setStateAsync({ currentActiveIndex: i } as any);
      },
      notifyValueChange: (values: string[]) => {
        const value = values.join('');
        emit('update:modelValue', value);
        emit('update:value', value);
        emit('change', value);
      },
      changeSpecificInputFocusState: (index: number, focusState: 'blur' | 'focus') => {
        const dom = inputDOMList[index];
        if (focusState === 'focus') dom?.focus?.();
        else if (focusState === 'blur') dom?.blur?.();
      },
      updateValueList: async (valueList: string[]) => {
        await setStateAsync({ valueList } as any);
      },
    };

    const foundation = new (PinCodeFoundation as any)(adapter);

    watch(
      () => getValueProp(),
      (value, prev) => {
        if (value !== prev) foundation.updateValueList((value || '').split(''));
      }
    );

    const focus = (index: number) => {
      const inputDOM = inputDOMList[index];
      inputDOM?.focus();
      try {
        inputDOM?.setSelectionRange(1, 1);
      } catch (e) {
        /* ignore */
      }
    };
    const blur = (index: number) => {
      inputDOMList[index]?.blur();
    };
    expose({ focus, blur, foundation });

    const renderSingleInput = (index: number) =>
      h(Input, {
        ref: setInputRef(index),
        key: `input-${index}`,
        autoFocus: props.autoFocus && index === 0,
        inputmode: props.format === 'number' ? 'numeric' : 'text',
        value: state.valueList[index] ?? '',
        size: props.size,
        disabled: props.disabled,
        onBlur: () => foundation.handleCurrentActiveIndexChange(index, 'blur'),
        onFocus: () => foundation.handleCurrentActiveIndexChange(index, 'focus'),
        onPaste: (e: ClipboardEvent) => foundation.handlePaste(e, index),
        onKeydown: (e: KeyboardEvent) => foundation.handleKeyDownOnSingleInput(e, index),
        onChange: (v: string, e: any) => {
          if (e && 'isComposing' in e && e.isComposing) return;
          const str = String(v ?? '');
          const userInputChar = str[str.length - 1];
          if (foundation.validateValue(userInputChar)) {
            foundation.completeSingleInput(index, userInputChar);
          }
        },
      });

    return () => {
      const inputElements: any[] = [];
      for (let i = 0; i < props.count; i++) {
        inputElements.push(renderSingleInput(i));
      }
      const { class: className, style, ...rest } = attrs as any;
      return h('div', { ...rest, class: cls(`${cssClasses.PREFIX}-wrapper`, className), style: style as CSSProperties }, inputElements);
    };
  },
});
(PinCode as any).elementType = 'PinCode';

export default PinCode;
