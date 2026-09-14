import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface PlainTab {
  disabled?: boolean;
  icon?: any;
  itemKey: string;
  tab?: any;
  closable?: boolean;
}

export interface TabContextValue {
  activeKey?: string;
  lazyRender?: boolean;
  panes?: PlainTab[];
  tabPaneMotion?: boolean;
  tabPosition?: 'top' | 'left';
  prevActiveKey?: string | null;
  forceDisableMotion?: boolean;
}

export const TabsContextKey: InjectionKey<TabContextValue> = Symbol('SemiTabsContext');

export function useTabsContext(): TabContextValue {
  return inject(TabsContextKey, {} as TabContextValue);
}
export function provideTabsContext(value: TabContextValue) {
  provide(TabsContextKey, value);
}
