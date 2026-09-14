import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface CollapseContextValue {
  activeSet: Set<string>;
  expandIcon?: any;
  collapseIcon?: any;
  clickHeaderToExpand?: boolean;
  keepDOM?: boolean;
  expandIconPosition?: 'left' | 'right';
  onClick: (activeKey: string, e: MouseEvent) => void;
  motion?: boolean;
  lazyRender?: boolean;
}

export const CollapseContextKey: InjectionKey<CollapseContextValue> = Symbol('SemiCollapseContext');

export function useCollapseContext(): CollapseContextValue | undefined {
  return inject(CollapseContextKey, undefined);
}
export function provideCollapseContext(value: CollapseContextValue) {
  provide(CollapseContextKey, value);
}
