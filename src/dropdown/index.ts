import DropdownComponent, { dropdownProps, dropdownEmits } from './Dropdown';
import DropdownMenu, { dropdownMenuProps } from './DropdownMenu';
import DropdownItem, { dropdownItemProps, dropdownItemEmits } from './DropdownItem';
import { DropdownDivider, DropdownTitle, dropdownDividerProps, dropdownTitleProps } from './DropdownDividerTitle';
import { useDropdownContext, provideDropdownContext, DropdownContextKey } from './context';

export type DropdownStatic = typeof DropdownComponent & {
  Menu: typeof DropdownMenu;
  Item: typeof DropdownItem;
  Divider: typeof DropdownDivider;
  Title: typeof DropdownTitle;
};

const Dropdown = DropdownComponent as DropdownStatic;

export {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownTitle,
  dropdownProps,
  dropdownEmits,
  dropdownMenuProps,
  dropdownItemProps,
  dropdownItemEmits,
  dropdownDividerProps,
  dropdownTitleProps,
  useDropdownContext,
  provideDropdownContext,
  DropdownContextKey,
};
export type { DropdownTrigger, DropDownMenuItem, DropDownMenuItemItem, DropDownMenuItemDivider, DropDownMenuItemTitle } from './Dropdown';
export type { DropdownItemType } from './DropdownItem';
export type { DropdownContextValue } from './context';
export default Dropdown;
