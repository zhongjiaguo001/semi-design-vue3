import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export interface TreeContextValue {
  treeDisabled?: boolean;
  treeIcon?: any;
  motion?: boolean;
  motionKeys?: Set<string>;
  motionType?: string | null;
  filterTreeNode?: any;
  keyEntities?: Record<string, any>;
  onNodeClick?: (e: any, treeNode: any) => void;
  onNodeExpand?: (e: any, treeNode: any) => void;
  onNodeSelect?: (e: any, treeNode: any) => void;
  onNodeCheck?: (e: any, treeNode: any) => void;
  onNodeRightClick?: (e: any, treeNode: any) => void;
  onNodeDoubleClick?: (e: any, treeNode: any) => void;
  renderTreeNode?: (treeNode: any, ind?: number, style?: any) => any;
  onNodeDragStart?: (e: any, treeNode: any) => void;
  onNodeDragEnter?: (e: any, treeNode: any) => void;
  onNodeDragOver?: (e: any, treeNode: any) => void;
  onNodeDragLeave?: (e: any, treeNode: any) => void;
  onNodeDragEnd?: (e: any, treeNode: any) => void;
  onNodeDrop?: (e: any, treeNode: any) => void;
  expandAction?: false | 'click' | 'doubleClick';
  directory?: boolean;
  multiple?: boolean;
  showFilteredOnly?: boolean;
  isSearching?: boolean;
  loadData?: (data: any) => Promise<any>;
  onNodeLoad?: (data: any) => Promise<any>;
  renderLabel?: (label: any, data: any, keyword?: string) => any;
  draggable?: boolean;
  renderFullLabel?: (props: any) => any;
  dragOverNodeKey?: string | string[] | null;
  dropPosition?: number | null;
  labelEllipsis?: any;
}

export const TreeContextKey: InjectionKey<TreeContextValue> = Symbol('SemiTreeContext');

export function useTreeContext(): TreeContextValue {
  return inject(TreeContextKey, {} as TreeContextValue);
}
export function provideTreeContext(value: TreeContextValue) {
  provide(TreeContextKey, value);
}
