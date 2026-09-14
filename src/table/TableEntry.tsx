import { defineComponent, h, ref } from 'vue';
import { strings } from '@douyinfe/semi-foundation/lib/es/table/constants';
import NormalTable, { tableProps, tableEmits } from './Table';
import ResizableTable from './ResizableTable';
import Column from './Column';
import { useConfigContext } from '../configProvider/context';

export const fullTableProps = {
  ...tableProps,
  resizable: { type: [Boolean, Object] as any, default: undefined },
};

/**
 * Public Table entry: dispatches to ResizableTable / NormalTable (React `index.js`).
 */
const Table = defineComponent({
  name: 'Table',
  inheritAttrs: false,
  props: fullTableProps,
  emits: tableEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const tableRef = ref<any>(null);
    expose({
      getCurrentPageData: () => tableRef.value && tableRef.value.getCurrentPageData(),
      tableRef,
    });
    return () => {
      const direction = props.direction ?? context.direction;
      const listeners = {
        onChange: (...args: any[]) => emit('change', ...args),
        onExpand: (...args: any[]) => emit('expand', ...args),
        onExpandedRowsChange: (...args: any[]) => emit('expandedRowsChange', ...args),
        onFilterDropdownVisibleChange: (...args: any[]) => emit('filterDropdownVisibleChange', ...args),
      };
      if (props.resizable) {
        return h(ResizableTable, { ...attrs, ...props, direction, ref: tableRef, ...listeners }, slots);
      }
      const { resizable: _r, ...rest } = props as any;
      return h(NormalTable, { ...attrs, ...rest, direction, ref: tableRef, ...listeners }, slots);
    };
  },
});

(Table as any).Column = Column;
(Table as any).__SemiComponentName__ = 'Table';
(Table as any).DEFAULT_KEY_COLUMN_SELECTION = strings.DEFAULT_KEY_COLUMN_SELECTION;
(Table as any).DEFAULT_KEY_COLUMN_EXPAND = strings.DEFAULT_KEY_COLUMN_EXPAND;
(Table as any).elementType = 'Table';

export default Table;
