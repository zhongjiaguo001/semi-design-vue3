import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface AnchorContextValue {
  activeLink: string;
  showTooltip?: boolean | Record<string, any>;
  position?: string;
  childMap: Record<string, Set<string>>;
  autoCollapse?: boolean;
  size?: 'small' | 'default';
  onClick: (e: any, link: string) => void;
  /** `parents`: hrefs of the ancestor links (outermost first), used to build the autoCollapse child map */
  addLink: (link: string, parents?: string[]) => void;
  removeLink: (link: string) => void;
}

export const AnchorContextKey: InjectionKey<AnchorContextValue> = Symbol('SemiAnchorContext');

export function useAnchorContext(): AnchorContextValue | undefined {
  return inject(AnchorContextKey, undefined);
}
export function provideAnchorContext(value: AnchorContextValue) {
  provide(AnchorContextKey, value);
}
