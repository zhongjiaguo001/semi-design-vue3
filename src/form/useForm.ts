import { reactive } from 'vue';
import type { BaseFormApi, FormState } from '@douyinfe/semi-foundation/lib/es/form/interface';

const EMPTY_FORM_STATE: FormState = { values: {}, errors: {}, touched: {} };

export function useForm<T extends Record<string, any> = any>() {
  const formState = reactive({ values: {}, errors: {}, touched: {} }) as FormState<T>;
  /** kept as the SAME reactive object so `const [, , values] = useForm()` stays live (React re-renders instead) */
  const values = formState.values as Record<string, any>;
  const syncValues = (next: Record<string, any> | undefined) => {
    Object.keys(values).forEach((k) => delete values[k]);
    Object.assign(values, next || {});
  };
  const applyState = (st: FormState<T>) => {
    formState.errors = (st?.errors || {}) as any;
    formState.touched = (st?.touched || {}) as any;
    syncValues(st?.values as any);
  };
  let realApi: BaseFormApi<T> | null = null;

  const bind = (api: BaseFormApi<T>) => {
    realApi = api;
    applyState(api.getFormState() as FormState<T>);
  };
  const unbind = () => {
    realApi = null;
    applyState(EMPTY_FORM_STATE as FormState<T>);
  };
  const updateState = (newState: FormState<T>) => {
    applyState(newState);
  };

  const internals = {
    __realApi: null as BaseFormApi<T> | null,
    __bind: bind,
    __unbind: unbind,
    __updateState: updateState,
  };

  const formApi = new Proxy(internals, {
    get(target, prop: string) {
      if (prop.startsWith('__')) return (target as any)[prop];
      const api = realApi;
      if (!api) {
        if (typeof prop === 'string') {
          return (..._args: any[]) => {
            console.warn(`[Semi Form] FormApi.${prop}() is called before Form component is mounted.`);
            return undefined;
          };
        }
        return undefined;
      }
      const value = (api as any)[prop];
      return typeof value === 'function' ? value.bind(api) : value;
    },
    set(target, prop: string, value) {
      if (prop.startsWith('__')) {
        (target as any)[prop] = value;
        return true;
      }
      return false;
    },
  }) as unknown as BaseFormApi<T> & typeof internals;

  return [formApi, formState, formState.values] as const;
}

export default useForm;
