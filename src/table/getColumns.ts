import { camelize } from 'vue';
import type { VNode } from 'vue';
import { flattenChildren, getVNodeElementType } from '../_utils';
import Column from './Column';

/** props declared as Boolean on <Column>: `<Column sorter />` passes '' which Vue would normally coerce */
const BOOLEAN_COLUMN_PROPS = new Set(['filterChildrenRecord', 'filterDropdownVisible', 'filterMultiple', 'sortChildrenRecord', 'useFullRender', 'resize', 'showSortTip', 'ellipsis', 'fixed', 'sorter', 'filterIcon']);

/**
 * Convert `<Column>` vnode children into column objects (Vue counterpart of getColumns.js)
 */
export default function getColumns(children: any): any[] {
  if (children) {
    const columns: any[] = [];
    flattenChildren(children).forEach((child: VNode) => {
      if (child && (child.type === Column || getVNodeElementType(child) === 'Column')) {
        const rawProps = (child.props || {}) as Record<string, any>;
        const col: Record<string, any> = {};
        Object.keys(rawProps).forEach((k) => {
          const name = camelize(k);
          let value = rawProps[k];
          if (value === '' && BOOLEAN_COLUMN_PROPS.has(name)) value = true;
          col[name] = value;
        });
        const slots = (child.children && typeof child.children === 'object' && !Array.isArray(child.children) ? child.children : {}) as Record<string, any>;
        if (typeof slots.title === 'function') {
          const titleSlot = slots.title;
          col.title = (titleProps?: any) => titleSlot(titleProps || {});
          col.__titleIsSlot = true;
        }
        if (typeof slots.cell === 'function') {
          const cellSlot = slots.cell;
          col.render = (text: any, record: any, index: number, options: any) => cellSlot({ text, record, index, ...(options || {}) });
        }
        if (typeof slots.default === 'function') {
          const nested = getColumns(slots.default());
          if (nested.length) col.children = nested;
        }
        const column: Record<string, any> = { ...col };
        if (child.key != null) column.key = child.key;
        columns.push(column);
      }
    });
    return columns;
  }
  return [];
}
