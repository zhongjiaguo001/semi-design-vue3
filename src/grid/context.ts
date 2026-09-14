import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface RowContextValue {
  gutters: [number, number];
}

export const RowContextKey: InjectionKey<RowContextValue> = Symbol('SemiRowContext');

export function useRowContext(): RowContextValue | null {
  return inject(RowContextKey, null);
}
export function provideRowContext(value: RowContextValue) {
  provide(RowContextKey, value);
}
