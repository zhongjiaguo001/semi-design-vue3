import { defineComponent, h, ref, watch, onBeforeUnmount, computed } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import classNames from 'classnames';
import PaginationFoundation from '@douyinfe/semi-foundation/lib/es/pagination/foundation';
import { cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/pagination/constants';
import { numbers as popoverNumbers } from '@douyinfe/semi-foundation/lib/es/popover/constants';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import '@douyinfe/semi-foundation/lib/es/pagination/pagination.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import { getDataAttr, normalizeNode, renderSlotOrProp } from '../_utils';
import { IconChevronLeft, IconChevronRight } from '../icons/generated';
import Popover from '../popover/Popover';
import InputNumber from '../inputNumber/InputNumber';
import Select from '../select/Select';
import type { Position } from '../tooltip/Tooltip';

const prefixCls = cssClasses.PREFIX;

export type PaginationSize = 'small' | 'default';
export type PageRenderText = number | '...';

const nodeProp = { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined };

export const paginationProps = {
  total: { type: Number, default: 1 },
  showTotal: { type: Boolean, default: false },
  pageSize: { type: Number as PropType<number | null>, default: null },
  pageSizeOpts: { type: Array as PropType<number[]>, default: () => numbers.PAGE_SIZE_OPTION },
  size: { type: String as PropType<PaginationSize>, default: 'default' },
  currentPage: { type: Number, default: undefined },
  modelValue: { type: Number, default: undefined },
  defaultCurrentPage: { type: Number, default: 1 },
  prevText: nodeProp,
  nextText: nodeProp,
  showSizeChanger: { type: Boolean, default: false },
  popoverZIndex: { type: Number, default: popoverNumbers.DEFAULT_Z_INDEX },
  popoverPosition: { type: String as PropType<Position>, default: undefined },
  hideOnSinglePage: { type: Boolean, default: false },
  hoverShowPageSelect: { type: Boolean, default: false },
  showQuickJumper: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  preventPageChangeOnPageSizeChange: { type: Boolean, default: false },
};

export const paginationEmits = ['update:modelValue', 'update:currentPage', 'update:pageSize', 'pageChange', 'pageSizeChange', 'change'];

interface PaginationState {
  total: number;
  showTotal: boolean;
  currentPage: number;
  pageSize: number;
  pageList: PageRenderText[];
  prevDisabled: boolean;
  nextDisabled: boolean;
  restLeftPageList: number[];
  restRightPageList: number[];
  quickJumpPage: string | number;
  allPageNumbers: number[];
}

const REST_ITEM_HEIGHT = 32;
const REST_LIST_WIDTH = 78;

/**
 * Minimal fixed-size virtual list (replacement for react-window's FixedSizeList used by semi-ui).
 */
const RestPageList = defineComponent({
  name: 'PaginationRestList',
  props: {
    items: { type: Array as PropType<number[]>, required: true },
    itemSize: { type: Number, default: REST_ITEM_HEIGHT },
    height: { type: Number, required: true },
    width: { type: Number, default: REST_LIST_WIDTH },
    direction: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(page: number, index: number) => void>, required: true },
  },
  setup(props) {
    const scrollTop = ref(0);
    const onScroll = (e: Event) => {
      scrollTop.value = (e.target as HTMLElement).scrollTop;
    };
    return () => {
      const { items, itemSize, height, width, direction } = props;
      const count = items.length;
      const overscan = 2;
      const start = Math.max(0, Math.floor(scrollTop.value / itemSize) - overscan);
      const end = Math.min(count, Math.ceil((scrollTop.value + height) / itemSize) + overscan);
      const rows: VNodeChild[] = [];
      for (let index = start; index < end; index++) {
        const page = items[index];
        rows.push(
          h(
            'div',
            {
              role: 'listitem',
              key: `${page}${index}`,
              class: `${prefixCls}-rest-item`,
              style: { position: 'absolute', left: 0, top: `${index * itemSize}px`, height: `${itemSize}px`, width: '100%' },
              'aria-label': `${page}`,
              onClick: () => props.onSelect(page, index),
            },
            String(page)
          )
        );
      }
      return h(
        'div',
        {
          class: `${prefixCls}-rest-list`,
          style: { position: 'relative', height: `${height}px`, width: `${width}px`, overflow: 'auto', willChange: 'transform', direction },
          onScroll,
        },
        [h('div', { style: { height: `${count * itemSize}px`, width: '100%' } }, rows)]
      );
    };
  },
});

const Pagination = defineComponent({
  name: 'Pagination',
  inheritAttrs: false,
  props: paginationProps,
  emits: paginationEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { locale } = useLocale('Pagination');
    const initialPageSize = props.pageSize || props.pageSizeOpts[0] || numbers.DEFAULT_PAGE_SIZE;
    const shouldFillAllNumber = props.size === 'small' && props.hoverShowPageSelect && !props.disabled;
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, PaginationState>(
      props as any,
      {
        total: props.total,
        showTotal: props.showTotal,
        currentPage: 1,
        pageSize: initialPageSize,
        pageList: [],
        prevDisabled: false,
        nextDisabled: false,
        restLeftPageList: [],
        restRightPageList: [],
        quickJumpPage: '',
        allPageNumbers: shouldFillAllNumber ? Array.from({ length: Math.ceil(props.total / initialPageSize) }, (_v, i) => i + 1) : [],
      },
      { modelProp: 'currentPage' }
    );
    const getCurrentPageProp = () => ('currentPage' in propsView ? (propsView as any).currentPage : undefined);
    state.currentPage = getCurrentPageProp() || props.defaultCurrentPage;

    warning(
      Boolean(props.showSizeChanger && props.hideOnSinglePage),
      '[Semi Pagination] You should not use showSizeChanger and hideOnSinglePage in ths same time. At this time, hideOnSinglePage no longer takes effect, otherwise there may be a problem that the switch entry disappears'
    );

    const adapter = {
      ...baseAdapter,
      setPageList: (pageListState: { pageList: PageRenderText[]; restLeftPageList: number[]; restRightPageList: number[] }) => {
        const { pageList, restLeftPageList, restRightPageList } = pageListState;
        state.pageList = pageList;
        state.restLeftPageList = restLeftPageList;
        state.restRightPageList = restRightPageList;
      },
      setDisabled: (prevIsDisabled: boolean, nextIsDisabled: boolean) => {
        state.prevDisabled = prevIsDisabled;
        state.nextDisabled = nextIsDisabled;
      },
      updateTotal: (total: number) => {
        state.total = total;
      },
      updatePageSize: (pageSize: number) => {
        state.pageSize = pageSize;
      },
      updateQuickJumpPage: (quickJumpPage: string | number) => {
        state.quickJumpPage = quickJumpPage;
      },
      updateAllPageNumbers: (allPageNumbers: number[]) => {
        state.allPageNumbers = allPageNumbers;
      },
      setCurrentPage: (pageIndex: number) => {
        state.currentPage = pageIndex;
      },
      registerKeyDownHandler: (handler: any) => {
        document.addEventListener('keydown', handler);
      },
      unregisterKeyDownHandler: (handler: any) => {
        document.removeEventListener('keydown', handler);
      },
      notifyPageChange: (pageIndex: number) => {
        emit('update:modelValue', pageIndex);
        emit('update:currentPage', pageIndex);
        emit('pageChange', pageIndex);
      },
      notifyPageSizeChange: (pageSize: number) => {
        emit('update:pageSize', pageSize);
        emit('pageSizeChange', pageSize);
      },
      notifyChange: (pageIndex: number, pageSize: number) => {
        emit('change', pageIndex, pageSize);
      },
    };
    const foundation = new (PaginationFoundation as any)(adapter);

    // init needs no DOM: run synchronously so the first render already has the page list (React re-renders in componentDidMount)
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());

    // componentDidUpdate
    watch(
      () => [getCurrentPageProp(), props.total, props.pageSize] as const,
      ([currentPage, total, pageSize], [prevCurrentPage, prevTotal, prevPageSize]) => {
        let pagerHasChanged = false;
        let allPageNumberNeedUpdate = false;
        if (prevCurrentPage !== currentPage) pagerHasChanged = true;
        if (prevTotal !== total) {
          pagerHasChanged = true;
          allPageNumberNeedUpdate = true;
        }
        if (prevPageSize !== pageSize) {
          pagerHasChanged = true;
          allPageNumberNeedUpdate = true;
        }
        if (pagerHasChanged) {
          foundation.updatePage(currentPage, total, pageSize);
        }
        if (allPageNumberNeedUpdate) {
          foundation.updateAllPageNumbers(total, pageSize ?? state.pageSize);
        }
      }
    );

    const defaultPopoverPosition = computed(() => (context.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));

    const renderPrevBtn = () => {
      const { disabled } = props;
      const { prevDisabled } = state;
      const isDisabled = prevDisabled || disabled;
      const preClassName = classNames({
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-prev`]: true,
        [`${prefixCls}-item-disabled`]: isDisabled,
      });
      const prevText = renderSlotOrProp(slots, 'prevText', normalizeNode(props.prevText));
      return h(
        'li',
        {
          role: 'button',
          'aria-disabled': isDisabled ? true : false,
          'aria-label': 'Previous',
          onClick: (e: MouseEvent) => !isDisabled && foundation.goPrev(e),
          class: preClassName,
          'x-semi-prop': 'prevText',
        },
        [prevText || h(IconChevronLeft, { size: 'large' })]
      );
    };

    const renderNextBtn = () => {
      const { disabled } = props;
      const { nextDisabled } = state;
      const isDisabled = nextDisabled || disabled;
      const nextClassName = classNames({
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-item-disabled`]: isDisabled,
        [`${prefixCls}-next`]: true,
      });
      const nextText = renderSlotOrProp(slots, 'nextText', normalizeNode(props.nextText));
      return h(
        'li',
        {
          role: 'button',
          'aria-disabled': isDisabled ? true : false,
          'aria-label': 'Next',
          onClick: (e: MouseEvent) => !isDisabled && foundation.goNext(e),
          class: nextClassName,
          'x-semi-prop': 'nextText',
        },
        [nextText || h(IconChevronRight, { size: 'large' })]
      );
    };

    const renderPageSizeSwitch = () => {
      const { showSizeChanger, disabled, popoverZIndex } = props;
      const popoverPosition = props.popoverPosition || defaultPopoverPosition.value;
      const { pageSize } = state;
      if (!showSizeChanger) return null;
      const newPageSizeOpts: number[] = foundation.pageSizeInOpts();
      const pageSizeToken: string = locale.value.pageSize;
      const optionList = newPageSizeOpts.map((size) => ({
        value: size,
        key: size,
        label: h('span', null, pageSizeToken.replace('${pageSize}', size.toString())),
      }));
      return h('div', { class: classNames(`${prefixCls}-switch`) }, [
        h(Select, {
          'aria-label': 'Page size selector',
          disabled,
          onChange: (newPageSize: number) => foundation.changePageSize(newPageSize),
          value: pageSize,
          key: pageSize + pageSizeToken,
          position: popoverPosition || 'bottomRight',
          clickToHide: true,
          zIndex: popoverZIndex,
          dropdownClassName: `${prefixCls}-select-dropdown`,
          optionList,
        }),
      ]);
    };

    const renderQuickJump = () => {
      const { showQuickJumper, disabled } = props;
      const { quickJumpPage, total, pageSize } = state;
      if (!showQuickJumper) return null;
      const totalPageNum = foundation._getTotalPageNumber(total, pageSize);
      const isDisabled = totalPageNum === 1 || disabled;
      const quickJumpCls = classNames({
        [`${prefixCls}-quickjump`]: true,
        [`${prefixCls}-quickjump-disabled`]: isDisabled,
      });
      return h('div', { class: quickJumpCls }, [
        h('span', null, locale.value.jumpTo),
        h(InputNumber, {
          value: quickJumpPage,
          class: `${prefixCls}-quickjump-input-number`,
          hideButtons: true,
          disabled: isDisabled,
          onBlur: () => foundation.handleQuickJumpBlur(),
          onEnterPress: (e: any) => foundation.handleQuickJumpEnterPress(e.target.value),
          onChange: (v: any) => foundation.handleQuickJumpNumberChange(v),
        }),
        h('span', null, locale.value.page),
      ]);
    };

    const renderRestPageList = (restList: number[]) => {
      const count = restList.length;
      const listHeight = count >= 5 ? REST_ITEM_HEIGHT * 5 : REST_ITEM_HEIGHT * count;
      return h(RestPageList, {
        items: restList,
        itemSize: REST_ITEM_HEIGHT,
        width: REST_LIST_WIDTH,
        height: listHeight,
        direction: context.direction,
        onSelect: (page: number, index: number) => foundation.goPage(page, index),
      });
    };

    const renderPageList = () => {
      const { pageList, currentPage, restLeftPageList, restRightPageList } = state;
      const { popoverPosition, popoverZIndex, disabled } = props;
      return pageList.map((page, i) => {
        const pageListClassName = classNames(`${prefixCls}-item`, {
          [`${prefixCls}-item-active`]: currentPage === page,
          [`${prefixCls}-item-all-disabled`]: disabled,
          [`${prefixCls}-item-all-disabled-active`]: currentPage === page && disabled,
        });
        const pageEl = h(
          'li',
          {
            key: `${page}${i}`,
            onClick: () => !disabled && foundation.goPage(page, i),
            class: pageListClassName,
            'aria-label': page === '...' ? 'More' : `Page ${page}`,
            'aria-current': currentPage === page ? 'page' : false,
          },
          String(page)
        );
        if (page === '...' && !disabled) {
          const content = i < 3 ? restLeftPageList : restRightPageList;
          return h(
            Popover,
            {
              rePosKey: getCurrentPageProp(),
              trigger: 'hover',
              content: () => renderRestPageList(content),
              key: `${page}${i}`,
              position: popoverPosition,
              zIndex: popoverZIndex,
            },
            { default: () => pageEl }
          );
        }
        return pageEl;
      });
    };

    const renderSmallPageSelect = (content: VNodeChild) => {
      const { allPageNumbers } = state;
      return h(Popover, { content: () => renderRestPageList(allPageNumbers) }, { default: () => content });
    };

    const renderSmallPage = () => {
      const { hideOnSinglePage, hoverShowPageSelect, showSizeChanger, disabled } = props;
      const { class: className, style, ...rest } = attrs as any;
      const paginationCls = classNames(`${prefixCls}-small`, prefixCls, className, { [`${prefixCls}-disabled`]: disabled });
      const { currentPage, total, pageSize } = state;
      const totalPageNum = Math.ceil(total / pageSize);
      if (totalPageNum < 2 && hideOnSinglePage && !showSizeChanger) return null;
      const pageCls = classNames({
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-item-small`]: true,
        [`${prefixCls}-item-all-disabled`]: disabled,
      });
      const content = h('div', { class: pageCls }, [String(currentPage), '/', String(totalPageNum), ' ']);
      return h('div', { class: paginationCls, style, ...getDataAttr(rest) }, [
        renderPrevBtn(),
        hoverShowPageSelect && !disabled ? renderSmallPageSelect(content) : content,
        renderNextBtn(),
        renderQuickJump(),
      ]);
    };

    const renderDefaultPage = () => {
      const { total, pageSize } = state;
      const { showTotal, hideOnSinglePage, showSizeChanger, disabled } = props;
      const { class: className, style, ...rest } = attrs as any;
      const paginationCls = classNames(className, `${prefixCls}`, { [`${prefixCls}-disabled`]: disabled });
      const totalPageNum = Math.ceil(total / pageSize);
      if (totalPageNum < 2 && hideOnSinglePage && !showSizeChanger) return null;
      const totalToken = (locale.value.total as string).replace('${total}', totalPageNum.toString());
      return h('ul', { class: paginationCls, style, ...getDataAttr(rest) }, [
        showTotal ? h('span', { class: `${prefixCls}-total` }, totalToken) : null,
        renderPrevBtn(),
        ...renderPageList(),
        renderNextBtn(),
        renderPageSizeSwitch(),
        renderQuickJump(),
      ]);
    };

    expose({
      foundation,
      goPage: (page: number) => foundation.goPage(page),
      goPrev: () => foundation.goPrev(),
      goNext: () => foundation.goNext(),
      changePageSize: (size: number) => foundation.changePageSize(size),
    });

    return () => (props.size === 'small' ? renderSmallPage() : renderDefaultPage());
  },
});
(Pagination as any).elementType = 'Pagination';

export default Pagination;
