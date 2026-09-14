import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { strings } from '@douyinfe/semi-foundation/lib/es/table/constants';

/**
 * Declarative column definition (`Table.Column`). Renders nothing; `Table` reads the vnode props / slots.
 *
 * Slots:
 *  - `title`   → column.title (node)
 *  - `cell`    → column.render (scoped: { text, record, index, expandIcon, isHovering, selection, indentText })
 *  - `default` → nested `<Column>` children (grouped headers)
 */
export const columnProps = {
  align: { type: String as PropType<'left' | 'right' | 'center'>, default: undefined },
  className: { type: String, default: undefined },
  colSpan: { type: Number, default: undefined },
  dataIndex: { type: String, default: undefined },
  defaultSortOrder: { type: [String, Boolean] as PropType<'ascend' | 'descend' | false>, default: undefined },
  defaultFilteredValue: { type: Array as PropType<any[]>, default: undefined },
  filterChildrenRecord: { type: Boolean, default: undefined },
  filterDropdownProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  filterDropdown: { type: [Object, Function, String] as PropType<any>, default: undefined },
  renderFilterDropdown: { type: Function as PropType<(props: any) => any>, default: undefined },
  filterDropdownVisible: { type: Boolean, default: undefined },
  filterIcon: { type: [Boolean, Object, Function] as PropType<any>, default: undefined },
  filterMultiple: { type: Boolean, default: undefined },
  filterConfirmMode: { type: String as PropType<'immediate' | 'confirm'>, default: undefined },
  filteredValue: { type: Array as PropType<any[]>, default: undefined },
  filters: { type: Array as PropType<any[]>, default: undefined },
  fixed: { type: [Boolean, String] as PropType<(typeof strings.FIXED_SET)[number]>, default: undefined },
  onCell: { type: Function as PropType<(record?: any, rowIndex?: number) => any>, default: undefined },
  onFilter: { type: Function as PropType<(filteredValue?: any, record?: any) => boolean>, default: undefined },
  onFilterDropdownVisibleChange: { type: Function as PropType<(visible?: boolean) => void>, default: undefined },
  onHeaderCell: { type: Function as PropType<(column?: any, columnIndex?: number, index?: number) => any>, default: undefined },
  render: { type: Function as PropType<(text: any, record: any, index: number, options?: any) => any>, default: undefined },
  renderFilterDropdownItem: { type: Function as PropType<(itemInfo?: any) => any>, default: undefined },
  sortChildrenRecord: { type: Boolean, default: undefined },
  sortOrder: { type: [String, Boolean] as PropType<'ascend' | 'descend' | false>, default: undefined },
  sorter: { type: [Boolean, Function] as PropType<boolean | ((a?: any, b?: any, sortOrder?: 'ascend' | 'descend') => number)>, default: undefined },
  sortIcon: { type: Function as PropType<(props: { sortOrder: any }) => any>, default: undefined },
  title: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  useFullRender: { type: Boolean, default: undefined },
  width: { type: [Number, String], default: undefined },
  ellipsis: { type: [Boolean, Object] as PropType<boolean | { showTitle: boolean }>, default: undefined },
  resize: { type: Boolean, default: undefined },
  showSortTip: { type: Boolean, default: undefined },
  shouldCellUpdate: { type: Function as PropType<(props: any, prevProps: any) => boolean>, default: undefined },
};

const Column = defineComponent({
  name: 'TableColumn',
  props: columnProps,
  setup() {
    return () => null;
  },
});
(Column as any).elementType = 'Column';

export default Column;
