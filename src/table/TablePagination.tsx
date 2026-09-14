import { defineComponent, h, isVNode } from 'vue';
import type { PropType } from 'vue';
import _isFunction from 'lodash/isFunction';
import _get from 'lodash/get';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import Pagination from '../pagination';
import { normalizeNode } from '../_utils';

export const tablePaginationProps = {
  style: { type: Object as PropType<Record<string, any>>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  pagination: { type: Object as PropType<Record<string, any>>, default: undefined },
  info: { type: [String, Object, Array] as PropType<any>, default: undefined },
  renderPagination: { type: Function as PropType<(pagination: any) => any>, default: undefined },
  /** the Pagination component to use (Table injects the real one when available) */
  paginationComponent: { type: [Object, Function] as PropType<any>, default: undefined },
};

const TablePagination = defineComponent({
  name: 'TablePagination',
  props: tablePaginationProps,
  setup(props) {
    return () => {
      const { pagination, prefixCls, info, renderPagination, paginationComponent } = props;
      const total = _get(pagination, 'total');
      const customPagination = renderPagination && _isFunction(renderPagination) ? renderPagination(pagination) : null;
      const PaginationComp = paginationComponent || Pagination;
      return h('div', { class: `${prefixCls}-pagination-outer`, style: props.style }, [
        isVNode(customPagination) || (customPagination && typeof customPagination !== 'object')
          ? normalizeNode(customPagination)
          : [
              h('span', { class: `${prefixCls}-pagination-info` }, [normalizeNode(info)]),
              h('span', { class: `${prefixCls}-pagination-wrapper` }, [total > 0 ? h(PaginationComp, { ...pagination, key: _get(pagination, 'pageSize', 'pagination') }) : null]),
            ],
      ]);
    };
  },
});

export default TablePagination;
