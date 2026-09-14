import { inject, provide, reactive } from 'vue';
import type { InjectionKey } from 'vue';

export type StepsType = 'fill' | 'basic' | 'nav';

export interface StepsContextValue {
  type: StepsType;
}

export const StepsContextKey: InjectionKey<StepsContextValue> = Symbol('SemiStepsContext');

export function useStepsContext(): StepsContextValue | undefined {
  return inject(StepsContextKey, undefined);
}
export function provideStepsContext(value: StepsContextValue) {
  provide(StepsContextKey, reactive(value));
}
