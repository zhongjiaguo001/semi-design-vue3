import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface BreadcrumbShowTooltip {
  width?: string | number;
  ellipsisPos?: 'end' | 'middle';
  opts?: Record<string, any>;
}

export interface BreadContextValue {
  onClick: (info: any, event: any) => void;
  showTooltip?: boolean | BreadcrumbShowTooltip;
  compact?: boolean;
  separator?: any;
  /** renders the separator (prop or slot of the parent Breadcrumb) */
  renderSeparator?: () => any;
}

export const BreadContextKey: InjectionKey<BreadContextValue> = Symbol('SemiBreadContext');

export function useBreadContext(): BreadContextValue | undefined {
  return inject(BreadContextKey, undefined);
}
export function provideBreadContext(value: BreadContextValue) {
  provide(BreadContextKey, value);
}
