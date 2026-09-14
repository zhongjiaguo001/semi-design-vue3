import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface DescriptionsContextValue {
  align?: 'left' | 'justify' | 'plain' | 'center';
  layout?: 'horizontal' | 'vertical';
}

export const DescriptionsContextKey: InjectionKey<DescriptionsContextValue> = Symbol('SemiDescriptionsContext');

export function useDescriptionsContext(): DescriptionsContextValue {
  return inject(DescriptionsContextKey, {});
}
export function provideDescriptionsContext(value: DescriptionsContextValue) {
  provide(DescriptionsContextKey, value);
}
