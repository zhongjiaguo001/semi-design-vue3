import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface SiderHook {
  addSider: (id: string) => void;
  removeSider: (id: string) => void;
}

export interface LayoutContextValue {
  siderHook: SiderHook;
}

export const LayoutContextKey: InjectionKey<LayoutContextValue> = Symbol('SemiLayoutContext');

const noop = () => undefined;
const defaultContext: LayoutContextValue = { siderHook: { addSider: noop, removeSider: noop } };

export function useLayoutContext(): LayoutContextValue {
  return inject(LayoutContextKey, defaultContext);
}
export function provideLayoutContext(value: LayoutContextValue) {
  provide(LayoutContextKey, value);
}
