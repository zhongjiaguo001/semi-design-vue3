import { inject, provide, reactive } from 'vue';
import type { InjectionKey } from 'vue';

export interface DropdownContextValue {
  level: number;
  showTick?: boolean;
  trigger?: string;
}

export const DropdownContextKey: InjectionKey<DropdownContextValue> = Symbol('SemiDropdownContext');

const ROOT: DropdownContextValue = reactive({ level: 0 });

export function useDropdownContext(): DropdownContextValue {
  return inject(DropdownContextKey, ROOT);
}
export function provideDropdownContext(value: DropdownContextValue) {
  provide(DropdownContextKey, value);
}
