import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import _get from 'lodash/get';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { flattenColumns } from '@douyinfe/semi-foundation/lib/es/table/utils';
import { toPx } from '../_utils';

export const colGroupProps = {
  columns: { type: Array as PropType<any[]>, default: () => [] },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  components: { type: Object as PropType<any>, default: undefined },
};

const ColGroup = defineComponent({
  name: 'TableColGroup',
  props: colGroupProps,
  setup(props) {
    return () => {
      const { columns, className, style, prefixCls, components } = props;
      const ColGroupTag = _get(components, 'colgroup.wrapper', 'colgroup');
      const Col = _get(components, 'colgroup.col', 'col');
      const cols = flattenColumns(columns).map((column: any, idx: number) => {
        const colStyle: Record<string, any> = {};
        if (column.width) {
          colStyle.width = toPx(column.width);
          colStyle.minWidth = colStyle.width;
        }
        return h(Col, { class: classnames(`${prefixCls}-col`, column.className), key: column.key || column.dataIndex || idx, style: colStyle });
      });
      return h(ColGroupTag, { class: classnames(`${prefixCls}-colgroup`, className), style }, cols);
    };
  },
});

export default ColGroup;
