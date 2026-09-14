import { inject, provide, type InjectionKey } from 'vue';
import type { RowProps } from '../grid/Row';
import type { ColProps } from '../grid/Col';

export type Grid = RowProps & ColProps;

export interface ListContextValue {
  onRightClick?: (e: MouseEvent) => void;
  onClick?: (e: MouseEvent) => void;
  grid?: Grid;
}

export const ListContextKey: InjectionKey<ListContextValue> = Symbol('SemiListContext');

export function provideListContext(value: ListContextValue) {
  provide(ListContextKey, value);
}

export function useListContext(): ListContextValue {
  return inject(ListContextKey, null) || {};
}
