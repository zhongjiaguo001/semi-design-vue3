import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface CheckboxGroupContextValue {
  onChange: (e: any) => void;
  value: any[];
  disabled?: boolean;
  name?: string;
  isCardType?: boolean;
  isPureCardType?: boolean;
}

export interface CheckboxContextValue {
  checkboxGroup?: CheckboxGroupContextValue;
}

export const CheckboxContextKey: InjectionKey<CheckboxContextValue> = Symbol('SemiCheckboxContext');

export function useCheckboxContext(): CheckboxContextValue | undefined {
  return inject(CheckboxContextKey, undefined);
}
export function provideCheckboxContext(value: CheckboxContextValue) {
  provide(CheckboxContextKey, value);
}
