import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/tabs/constants';
import { IconClose } from '../icons/generated';
import { normalizeNode } from '../_utils';

export const tabItemProps = {
  tab: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'large' },
  type: { type: String as PropType<'line' | 'card' | 'button' | 'slash'>, default: 'line' },
  icon: { type: [String, Object, Function] as PropType<any>, default: undefined },
  selected: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  itemKey: { type: String, default: undefined },
  tabPosition: { type: String as PropType<'top' | 'left'>, default: 'top' },
  deleteTabItem: { type: Function as PropType<(itemKey: string, e: MouseEvent) => void>, default: undefined },
  handleKeyDown: { type: Function as PropType<(e: KeyboardEvent, itemKey: string, closable: boolean) => void>, default: undefined },
  onClick: { type: Function as PropType<(itemKey: string, e: MouseEvent) => void>, default: undefined },
};

/** Render a pane's `tab` / `icon` (node, slot function or render function) */
export const renderPaneNode = (node: any) => {
  if (typeof node === 'function' && !(node as any).setup && !(node as any).render && !(node as any).__vccOpts && !(node as any).props) {
    return node();
  }
  return normalizeNode(node);
};

const TabItem = defineComponent({
  name: 'TabItem',
  props: tabItemProps,
  setup(props) {
    const handleKeyDownInItem = (event: KeyboardEvent) => {
      props.handleKeyDown && props.handleKeyDown(event, props.itemKey as string, props.closable);
    };
    const handleItemClick = (e: MouseEvent) => {
      !props.disabled && props.onClick && props.onClick(props.itemKey as string, e);
    };
    return () => {
      const { tab, size, type, icon, selected, closable, disabled, itemKey, deleteTabItem, tabPosition } = props;
      const closableIcon = closable
        ? h(IconClose, {
            'aria-label': 'Close',
            role: 'button',
            class: `${cssClasses.TABS_TAB}-icon-close`,
            onClick: (e: MouseEvent) => deleteTabItem && deleteTabItem(itemKey as string, e),
          })
        : null;
      const panelIcon = icon ? h('span', { class: `${cssClasses.TABS_BAR}-icon` }, [renderPaneNode(icon)]) : null;
      const className = cls(cssClasses.TABS_TAB, `${cssClasses.TABS_TAB}-${type}`, `${cssClasses.TABS_TAB}-${tabPosition}`, `${cssClasses.TABS_TAB}-single`, {
        [cssClasses.TABS_TAB_ACTIVE]: selected,
        [cssClasses.TABS_TAB_DISABLED]: disabled,
        [`${cssClasses.TABS_TAB}-small`]: size === 'small',
        [`${cssClasses.TABS_TAB}-medium`]: size === 'medium',
      });
      return h(
        'div',
        {
          role: 'tab',
          id: `semiTab${itemKey}`,
          'data-tabkey': `semiTab${itemKey}`,
          'aria-controls': `semiTabPanel${itemKey}`,
          'aria-disabled': disabled ? 'true' : 'false',
          'aria-selected': selected ? 'true' : 'false',
          tabindex: selected ? 0 : -1,
          onKeydown: handleKeyDownInItem,
          onClick: handleItemClick,
          class: className,
        },
        [panelIcon, renderPaneNode(tab), closableIcon]
      );
    };
  },
});
(TabItem as any).elementType = 'Tabs.TabItem';

export default TabItem;
