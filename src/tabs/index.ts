import Tabs, { tabsProps, tabsEmits } from './Tabs';
import TabPane, { tabPaneProps } from './TabPane';
import TabItem, { tabItemProps } from './TabItem';
import TabBar, { tabBarProps } from './TabBar';
import TabsDropdown, { tabsDropdownProps } from './Dropdown';

export { Tabs, TabPane, TabItem, TabBar, TabsDropdown, tabsProps, tabsEmits, tabPaneProps, tabItemProps, tabBarProps, tabsDropdownProps };
export { useTabsContext, provideTabsContext, TabsContextKey } from './context';
export type { PlainTab, TabContextValue } from './context';
export type { TabType, TabSize, TabPosition, TabsMore, TabsDropDownProps, OverflowItem } from './Tabs';
export default Tabs;
