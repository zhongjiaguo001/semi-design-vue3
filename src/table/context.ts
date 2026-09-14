import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';
import _noop from 'lodash/noop';

export interface TableStore {
  hoveredRowKey: string | number | null;
  hoveredRowKeys: Array<string | number>;
}

export interface TableContextValue {
  anyColumnFixed?: boolean;
  flattenedColumns?: any[];
  headWidths?: any[];
  tableWidth?: number;
  setHeadWidths?: (headWidths: any[], index?: number) => void;
  getHeadWidths?: (index?: number) => number[];
  getCellWidths?: (flattenedColumns: any[], flattenedWidths?: any[] | null, ignoreScrollBarKey?: boolean) => number[];
  handleRowExpanded?: (expanded: boolean, realKey: any, domEvent?: any) => void;
  renderExpandIcon?: (record: any, isNested?: boolean, groupKey?: any) => any;
  renderSelection?: (record?: any, inHeader?: boolean, index?: number) => any;
  getVirtualizedListRef?: (ref: any) => void;
  setBodyHasScrollbar?: (bodyHasScrollBar: boolean) => void;
  direction?: 'ltr' | 'rtl';
  handleRowSelection?: (rowKey: any, selected: boolean, e: any) => void;
  headerStyle?: Record<string, any>;
  rowSpanHover?: boolean;
  /** reactive store of hovered row keys (replaces the React Store) */
  store?: TableStore;
  [key: string]: any;
}

export const TableContextKey: InjectionKey<TableContextValue> = Symbol('SemiTableContext');

const defaultContext: TableContextValue = {
  headWidths: [],
  setHeadWidths: _noop,
  handleRowExpanded: _noop,
  getCellWidths: () => [],
  getHeadWidths: () => [],
  flattenedColumns: [],
};

export function useTableContext(): TableContextValue {
  return inject(TableContextKey, defaultContext);
}

export function provideTableContext(value: TableContextValue) {
  provide(TableContextKey, value);
}

/** Context shared between Body and its rows (Vue counterpart of the Body instance callbacks) */
export interface BodyContextValue {
  onRowHover?: (isHover: boolean, rowKey: any) => void;
}
export const BodyContextKey: InjectionKey<BodyContextValue> = Symbol('SemiTableBodyContext');
export function useBodyContext(): BodyContextValue {
  return inject(BodyContextKey, {});
}
export function provideBodyContext(value: BodyContextValue) {
  provide(BodyContextKey, value);
}
