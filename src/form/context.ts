import { computed, defineComponent, h, inject, provide, type InjectionKey, type ShallowRef } from 'vue';
import get from 'lodash/get';
import type { BaseFormApi, FormState, FormUpdaterContextType } from '@douyinfe/semi-foundation/lib/es/form/interface';

export const FormStateKey: InjectionKey<ShallowRef<FormState>> = Symbol('SemiFormState');
export const FormApiKey: InjectionKey<BaseFormApi> = Symbol('SemiFormApi');
export const FormUpdaterKey: InjectionKey<FormUpdaterContextType> = Symbol('SemiFormUpdater');
export const ArrayFieldKey: InjectionKey<{ shouldUseInitValue: boolean; inArrayField: boolean }> = Symbol('SemiArrayField');

export function provideFormState(state: ShallowRef<FormState>) {
  provide(FormStateKey, state);
}
export function provideFormApi(api: BaseFormApi) {
  provide(FormApiKey, api);
}
export function provideFormUpdater(updater: FormUpdaterContextType) {
  provide(FormUpdaterKey, updater);
}

export function useFormState() {
  return inject(FormStateKey, null);
}
export function useFormApi() {
  return inject(FormApiKey, null);
}
export function useFormUpdater() {
  return inject(FormUpdaterKey, null);
}
export function useArrayFieldState() {
  return inject(ArrayFieldKey, null);
}

/** Vue counterpart of React Form.useFieldState */
export function useFieldState(field: string) {
  const formState = useFormState();
  return computed(() => {
    const st = formState?.value;
    return {
      value: get(st?.values, field),
      error: get(st?.errors, field),
      touched: get(st?.touched, field),
    };
  });
}

/** Vue counterpart of React Form.useFieldApi */
export function useFieldApi(field: string) {
  const formApi = useFormApi();
  return {
    getValue: () => formApi?.getValue(field),
    setValue: (value: any) => formApi?.setValue(field, value),
    getError: () => formApi?.getError?.(field) ?? get(formApi?.getFormState?.()?.errors, field),
    setError: (error: any) => formApi?.setError?.(field, error),
    getTouched: () => get(formApi?.getFormState?.()?.touched, field),
    setTouched: (touched: boolean) => formApi?.setTouched?.(field, touched),
    validate: () => formApi?.validate?.([field]),
  };
}

/** Vue counterpart of React Form.withFormApi */
export function withFormApi(Component: any) {
  return defineComponent({
    name: `WithFormApi${(Component as any).name || ''}`,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const formApi = useFormApi();
      return () => h(Component, { ...attrs, formApi }, slots);
    },
  });
}

/** Vue counterpart of React Form.withFormState */
export function withFormState(Component: any) {
  return defineComponent({
    name: `WithFormState${(Component as any).name || ''}`,
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const formState = useFormState();
      return () => h(Component, { ...attrs, formState: formState?.value }, slots);
    },
  });
}
