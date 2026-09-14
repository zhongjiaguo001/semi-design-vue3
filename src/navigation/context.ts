import { inject, provide, reactive, type InjectionKey } from 'vue';
import type { ItemKey } from '@douyinfe/semi-foundation/lib/es/navigation/itemFoundation';

export type NavMode = 'vertical' | 'horizontal';

export interface NavContextValue {
  isCollapsed?: boolean;
  mode?: NavMode;
  openKeys?: ItemKey[];
  onCollapseChange?: (isCollapsed: boolean) => void;
  prefixCls?: string;
  selectedKeys?: ItemKey[];
  toggleIconPosition?: string;
  selectedKeysIsControlled?: boolean;
  openKeysIsControlled?: boolean;
  limitIndent?: boolean;
  isInSubNav?: boolean;
  locale?: Record<string, any>;
  subNavMotion?: boolean | Record<string, any> | Function;
  subNavCloseDelay?: number;
  subNavOpenDelay?: number;
  canUpdateOpenKeys?: boolean;
  renderWrapper?: (args: { itemElement: any; isSubNav: boolean; isInSubNav: boolean; props: any }) => any;
  getPopupContainer?: () => HTMLElement;
  tooltipShowDelay?: number;
  tooltipHideDelay?: number;
  onSelect?: (...args: any[]) => void;
  onOpenChange?: (...args: any[]) => void;
  onClick?: (...args: any[]) => void;
  updateOpenKeys?: (keys: ItemKey[]) => void;
  addOpenKeys?: (...keys: ItemKey[]) => void;
  removeOpenKeys?: (...keys: ItemKey[]) => void;
  updateSelectedKeys?: (keys: ItemKey[], includeParentKeys?: boolean) => void;
  addSelectedKeys?: (...keys: ItemKey[]) => void;
  removeSelectedKeys?: (...keys: ItemKey[]) => void;
  [key: string]: any;
}

export const NavContextKey: InjectionKey<NavContextValue> = Symbol('SemiNavContext');

const fallback: NavContextValue = reactive({
  isCollapsed: false,
  selectedKeys: [],
  openKeys: [],
  mode: 'vertical',
  prefixCls: 'semi-navigation',
  toggleIconPosition: 'right',
  limitIndent: true,
  canUpdateOpenKeys: true,
});

export function provideNavContext(value: NavContextValue) {
  provide(NavContextKey, value);
}

export function useNavContext(): NavContextValue {
  return inject(NavContextKey, fallback);
}
