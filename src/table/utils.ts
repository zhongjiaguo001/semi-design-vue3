import _map from 'lodash/map';
import _find from 'lodash/find';
import _clone from 'lodash/clone';
import _merge from 'lodash/merge';
import _cloneDeepWith from 'lodash/cloneDeepWith';
import _set from 'lodash/set';
import { isVNode, toRaw, isProxy } from 'vue';
import Logger from '@douyinfe/semi-foundation/lib/es/utils/Logger';
import { numbers, strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { getColumnKey, equalWith } from '@douyinfe/semi-foundation/lib/es/table/utils';
import _isEqual from 'lodash/isEqual';

let scrollbarVerticalSize: number | undefined;
let scrollbarHorizontalSize: number | undefined;

const scrollbarMeasure: Record<string, string> = {
  position: 'absolute',
  top: '-9999px',
  width: '50px',
  height: '50px',
};

/**
 * Vue counterpart of semi-ui `_utils.cloneDeep`: deep clones plain data but keeps
 * functions, VNodes, component definitions and Errors by reference.
 */
export function cloneDeep<T = any>(value: T, customizer?: (v: any) => any): T {
  const raw = isProxy(value) ? toRaw(value as any) : value;
  return _cloneDeepWith(raw, (v: any) => {
    if (typeof customizer === 'function') {
      return customizer(v);
    }
    if (typeof v === 'function' || isVNode(v)) {
      return v;
    }
    if (v && typeof v === 'object' && ((v as any).setup || (v as any).render || (v as any).__vccOpts)) {
      // component definition
      return v;
    }
    if (Object.prototype.toString.call(v) === '[object Error]') {
      return v;
    }
    if (isProxy(v)) {
      // unwrap reactive proxies so the clone works on raw data
      return cloneDeep(toRaw(v), customizer);
    }
    if (Array.isArray(v) && v.length === 0) {
      const keys = Object.keys(v);
      if (keys.length) {
        const newArray: any[] = [];
        keys.forEach((key) => {
          _set(newArray, key, (v as any)[key]);
        });
        return newArray;
      }
    }
    return undefined;
  });
}

/**
 * @param {'vertical'|'horizontal'} [direction]
 * @returns {number}
 */
export function measureScrollbar(direction: 'vertical' | 'horizontal' = 'vertical'): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return 0;
  }
  const isVertical = direction === 'vertical';
  if (isVertical && scrollbarVerticalSize) {
    return scrollbarVerticalSize;
  } else if (!isVertical && scrollbarHorizontalSize) {
    return scrollbarHorizontalSize;
  }
  const scrollDiv = document.createElement('div');
  Object.keys(scrollbarMeasure).forEach((scrollProp) => {
    (scrollDiv.style as any)[scrollProp] = scrollbarMeasure[scrollProp];
  });
  if (isVertical) {
    scrollDiv.style.overflowY = 'scroll';
  } else {
    scrollDiv.style.overflowX = 'scroll';
  }
  document.body.appendChild(scrollDiv);
  let size = 0;
  if (isVertical) {
    size = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    scrollbarVerticalSize = size;
  } else {
    size = scrollDiv.offsetHeight - scrollDiv.clientHeight;
    scrollbarHorizontalSize = size;
  }
  document.body.removeChild(scrollDiv);
  return size;
}

export function amendTableWidth(tableWidth: number | undefined) {
  return typeof tableWidth === 'number'
    ? tableWidth - numbers.DEFAULT_CELL_PADDING_LEFT - numbers.DEFAULT_CELL_PADDING_RIGHT - numbers.DEFAULT_CELL_BORDER_WIDTH_LEFT - numbers.DEFAULT_CELL_BORDER_WIDTH_RIGHT - measureScrollbar('vertical')
    : undefined;
}

export interface TableComponents {
  table?: any;
  header?: { outer?: any; wrapper?: any; row?: any; cell?: any };
  body?: { outer?: any; wrapper?: any; row?: any; cell?: any; colgroup?: { wrapper?: any; col?: any } };
  footer?: { wrapper?: any; row?: any; cell?: any };
}

/**
 * The user can pass a component to define the rendering method of each level of the table
 * This function merges the components passed in by the user with the default components
 */
export function mergeComponents(components?: TableComponents, virtualized?: any): Required<TableComponents> {
  return _merge(
    {},
    {
      table: 'table',
      header: { outer: 'table', wrapper: 'thead', row: 'tr', cell: 'th' },
      body: virtualized
        ? { outer: 'div', wrapper: 'div', row: 'div', cell: 'div', colgroup: { wrapper: 'div', col: 'div' } }
        : { outer: 'table', wrapper: 'tbody', row: 'tr', cell: 'td', colgroup: { wrapper: 'colgroup', col: 'col' } },
      footer: { wrapper: 'tfoot', row: 'tr', cell: 'td' },
    },
    components ? toRaw(components) : components
  ) as Required<TableComponents>;
}

export const logger = new Logger('[semi-vue Table]');

export function mergeColumns(oldColumns: any[] = [], newColumns: any[] = [], keyPropNames: string[] | null = null, deep = true) {
  const finalColumns: any[] = [];
  const clone = deep ? cloneDeep : _clone;
  _map(newColumns, (newColumn) => {
    newColumn = { ...newColumn };
    const key = getColumnKey(newColumn, keyPropNames as any);
    const oldColumn = key != null && _find(oldColumns, (item) => getColumnKey(item, keyPropNames as any) === key);
    if (oldColumn) {
      finalColumns.push(clone({ ...oldColumn, ...newColumn }));
    } else {
      finalColumns.push(clone(newColumn));
    }
  });
  return finalColumns;
}

export function getNextSortOrder(sortOrder: any): 'ascend' | 'descend' | 'cancelSort' {
  switch (sortOrder) {
    case strings.SORT_DIRECTIONS[0]:
      return strings.SORT_DIRECTIONS[1] as 'descend';
    case strings.SORT_DIRECTIONS[1]:
      return 'cancelSort';
    default:
      return strings.SORT_DIRECTIONS[0] as 'ascend';
  }
}

/** Whether a column.render / renderGroupSection result is a `{ children, props }` cell descriptor */
export function isInvalidRenderCellText(text: any): boolean {
  return Boolean(text) && !isVNode(text) && Object.prototype.toString.call(text) === '[object Object]';
}

/**
 * Structural column comparison used to decide whether slot-derived columns changed between renders.
 * Functions are compared by source text (like foundation `equalWith`) and VNodes by type/props/text.
 */
export function columnsEqual(a: any, b: any): boolean {
  return equalWith(a, b, (x: any, y: any) => {
    if (isVNode(x) && isVNode(y)) {
      return x.type === y.type && _isEqual(x.props, y.props) && (typeof x.children === 'string' || typeof y.children === 'string' ? x.children === y.children : true);
    }
    if (isVNode(x) !== isVNode(y)) return false;
    return undefined;
  });
}
