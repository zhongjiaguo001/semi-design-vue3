import { defineComponent, h, ref, watch, onBeforeUnmount, onMounted } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { isEqual, isEmpty, isArray, omit } from 'lodash';
import TransferFoundation from '@douyinfe/semi-foundation/lib/es/transfer/foundation';
import { _generateDataByType, _generateSelectedItems } from '@douyinfe/semi-foundation/lib/es/transfer/transferUtils';
import { cssClasses, strings, numbers } from '@douyinfe/semi-foundation/lib/es/transfer/constants';
import '@douyinfe/semi-foundation/lib/es/transfer/transfer.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import { useLocale } from '../locale';
import { Checkbox } from '../checkbox';
import Input from '../input/Input';
import Spin from '../spin';
import Button from '../button';
import Tree from '../tree/Tree';
import Pagination from '../pagination/Pagination';
import { IconClose, IconSearch, IconHandle } from '../icons/generated';
import VirtualList from '../select/VirtualList';

const prefixCls = cssClasses.PREFIX;

export type TransferType = 'list' | 'groupList' | 'treeList';

export const transferProps = {
  disabled: { type: Boolean, default: false },
  dataSource: { type: Array as PropType<any[]>, default: () => [] },
  filter: { type: [Boolean, Function] as PropType<boolean | ((sugInput: string, item: any) => boolean)>, default: undefined },
  defaultValue: { type: Array as PropType<Array<string | number>>, default: () => [] },
  value: { type: Array as PropType<Array<string | number>>, default: undefined },
  modelValue: { type: Array as PropType<Array<string | number>>, default: undefined },
  inputProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  type: { type: String as PropType<TransferType>, default: strings.TYPE_LIST as TransferType },
  emptyContent: { type: Object as PropType<{ left?: any; right?: any; search?: any }>, default: () => ({}) },
  draggable: { type: Boolean, default: false },
  treeProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  showPath: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  virtualize: { type: Object as PropType<{ height?: number | string; width?: number | string; itemSize: number }>, default: undefined },
  pagination: { type: Object as PropType<{ currentPage?: number; defaultCurrentPage?: number; pageSize?: number; onPageChange?: (p: number) => void }>, default: undefined },
  renderSourceItem: { type: Function as PropType<(item: any) => any>, default: undefined },
  renderSelectedItem: { type: Function as PropType<(item: any) => any>, default: undefined },
  renderSourcePanel: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderSelectedPanel: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderSourceHeader: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderSelectedHeader: { type: Function as PropType<(props: any) => any>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

export const transferEmits = ['change', 'select', 'deselect', 'search', 'pageChange', 'update:value', 'update:modelValue'];

/**
 * Minimal AutoSizer (React `tree/autoSizer` counterpart): measures its own box with ResizeObserver
 * and hands `{ height, width }` to the render function. Used by `virtualize` when `height` is not a number.
 */
const AutoSizer = defineComponent({
  name: 'TransferAutoSizer',
  props: {
    defaultHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
    defaultWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
    render: { type: Function as PropType<(size: { height: number; width: number | string }) => any>, required: true },
  },
  setup(props) {
    const el = ref<HTMLElement | null>(null);
    const measured = ref<{ height: number; width: number } | null>(null);
    let ro: ResizeObserver | null = null;
    const measure = () => {
      if (!el.value) return;
      const { height, width } = el.value.getBoundingClientRect();
      if (height > 0) measured.value = { height: Math.floor(height), width: Math.floor(width) };
    };
    onMounted(() => {
      measure();
      if (typeof ResizeObserver !== 'undefined' && el.value) {
        ro = new ResizeObserver(() => measure());
        ro.observe(el.value);
      }
    });
    onBeforeUnmount(() => ro?.disconnect());
    return () => {
      const fallbackHeight = typeof props.defaultHeight === 'number' ? props.defaultHeight : Number.parseInt(String(props.defaultHeight ?? ''), 10);
      const height = measured.value?.height ?? (Number.isFinite(fallbackHeight) && !String(props.defaultHeight).endsWith('%') ? fallbackHeight : 280);
      const width = measured.value?.width ?? props.defaultWidth ?? '100%';
      return h('div', { ref: el, style: { flexGrow: 1, minHeight: 0, width: '100%', height: '100%' } }, [props.render({ height, width })]);
    };
  },
});

const Transfer = defineComponent({
  name: 'Transfer',
  inheritAttrs: false,
  props: transferProps,
  emits: transferEmits,
  setup(props, { attrs, emit, expose, slots }) {
    const { locale } = useLocale('Transfer');
    const treeRef = ref<any>(null);
    /** index of the selected item currently being dragged (native HTML5 DnD sort) */
    const dragIndex = ref(-1);
    /** key of the item whose drag handle was pressed (only that item may start a drag) */
    const armedKey = ref<string | number | null>(null);
    /** keys that rendered a `sortableHandle` — for those, drag can only start from the handle */
    const handledKeys = new Set<string | number>();
    // resolve a render-prop either from the same-named scoped slot (slot wins) or from the prop
    const getRenderer = (name: string): ((p: any) => any) | undefined => {
      const slot = (slots as any)[name];
      if (slot) return (p: any) => slot(p);
      const fn = (props as any)[name];
      return typeof fn === 'function' ? fn : undefined;
    };
    const getEmpty = (slotName: string, propValue: any, fallback: any) => {
      const slot = (slots as any)[slotName];
      if (slot) return slot();
      return propValue ? propValue : fallback;
    };
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(
      props as any,
      {
        data: [] as any[],
        selectedItems: new Map<string | number, any>(),
        searchResult: new Set<string | number>(),
        inputValue: '',
        leftCurrentPage: props.pagination?.defaultCurrentPage ?? props.pagination?.currentPage ?? 1,
      },
      { modelProp: 'value' }
    );

    if (Boolean(props.dataSource) && isArray(props.dataSource)) {
      state.data = _generateDataByType(props.dataSource, props.type);
    }
    const seedValue = Array.isArray((propsView as any).value)
      ? (propsView as any).value
      : Array.isArray(props.defaultValue)
        ? props.defaultValue
        : undefined;
    if (Boolean(seedValue) && isArray(seedValue)) {
      state.selectedItems = _generateSelectedItems(seedValue, state.data);
    }

    const adapter = {
      ...baseAdapter,
      getSelected: () => new Map(state.selectedItems),
      updateSelected: (selectedItems: Map<any, any>) => {
        state.selectedItems = selectedItems;
      },
      notifyChange: (values: any, items: any) => {
        emit('change', values, items);
        emit('update:value', values);
        emit('update:modelValue', values);
      },
      notifySearch: (input: string) => emit('search', input),
      notifySelect: (item: any) => emit('select', item),
      notifyDeselect: (item: any) => emit('deselect', item),
      updateInput: (input: string) => {
        state.inputValue = input;
        state.leftCurrentPage = 1;
      },
      updateSearchResult: (searchResult: Set<any>) => {
        state.searchResult = searchResult;
      },
      searchTree: (keyword: string) => {
        treeRef.value && treeRef.value.search?.(keyword);
      },
      updateCurrentPage: (currentPage: number) => {
        state.leftCurrentPage = currentPage;
      },
      notifyPageChange: (currentPage: number) => {
        props.pagination?.onPageChange?.(currentPage);
        emit('pageChange', currentPage);
      },
    };
    const foundation = new (TransferFoundation as any)(adapter);
    onBeforeUnmount(() => foundation.destroy?.());

    const applyDerived = () => {
      const { value, dataSource, type, filter, pagination } = props as any;
      const resolvedValue = 'value' in propsView ? (propsView as any).value : value;
      let newData = state.data;
      let newSelectedItems = state.selectedItems;
      const merged: Record<string, any> = {};
      if (Boolean(dataSource) && Array.isArray(dataSource)) {
        newData = _generateDataByType(dataSource, type);
        merged.data = newData;
      }
      if (Boolean(resolvedValue) && Array.isArray(resolvedValue)) {
        newSelectedItems = _generateSelectedItems(resolvedValue, newData);
        merged.selectedItems = newSelectedItems;
      }
      if (!isEqual(state.data, newData)) {
        if (typeof state.inputValue === 'string' && state.inputValue !== '') {
          const filterFunc =
            typeof filter === 'function'
              ? (item: any) => filter(state.inputValue, item)
              : (item: any) => typeof item.label === 'string' && item.label.includes(state.inputValue);
          const searchData = newData.filter(filterFunc);
          merged.searchResult = new Set(searchData.map((item: any) => item.key));
        }
      }
      if (pagination && typeof pagination.currentPage === 'number') {
        merged.leftCurrentPage = pagination.currentPage;
      }
      Object.assign(state, merged);
    };

    watch(
      () => [props.dataSource, props.value, props.modelValue, props.type, props.pagination?.currentPage],
      applyDerived,
      { deep: true, immediate: true }
    );

    const onSelectOrRemove = (item: any) => foundation.handleSelectOrRemove(item);
    const onInputChange = (value: string) => foundation.handleInputChange(value, true);
    const onSortEnd = (callbackProps: { oldIndex: number; newIndex: number }) => foundation.handleSortEnd(callbackProps);
    const handleLeftPageChange = (currentPage: number) => foundation.handlePageChange(currentPage);
    const search = (value: string) => foundation.handleInputChange(value, false);
    const getFullPath = (item: any) => {
      const shouldShowPath = props.type === strings.TYPE_TREE_TO_LIST && props.showPath === true;
      if (!shouldShowPath || !Array.isArray(item.path)) return undefined;
      return item.path.map((pathItem: any) => ({ ...pathItem }));
    };

    expose({ search, foundation, state });

    const renderEmpty = (type: string, emptyText: any) => {
      const emptyCls = cls({
        [`${prefixCls}-empty`]: true,
        [`${prefixCls}-right-empty`]: type === 'right',
        [`${prefixCls}-left-empty`]: type === 'left',
      });
      return h('div', { 'aria-label': 'empty', class: emptyCls }, [normalizeNode(emptyText)]);
    };

    const renderFilter = (loc: any) => {
      const { inputProps, filter, disabled } = props;
      if (typeof filter === 'boolean' && !filter) return null;
      return h('div', { role: 'search', 'aria-label': 'Transfer filter', class: `${prefixCls}-filter` }, [
        h(Input, {
          prefix: IconSearch,
          placeholder: loc.placeholder,
          showClear: true,
          value: state.inputValue,
          disabled,
          onChange: onInputChange,
          ...(inputProps || {}),
        }),
      ]);
    };

    const renderHeader = (headerConfig: any) => {
      const { disabled } = props;
      const renderSourceHeader = getRenderer('renderSourceHeader');
      const renderSelectedHeader = getRenderer('renderSelectedHeader');
      const { totalContent, allContent, onAllClick, type, showButton } = headerConfig;
      const headerCls = cls({
        [`${prefixCls}-header`]: true,
        [`${prefixCls}-right-header`]: type === 'right',
        [`${prefixCls}-left-header`]: type === 'left',
      });
      if (type === 'left' && typeof renderSourceHeader === 'function') {
        const { num, showButton: sb, allChecked, onAllClick: oac, leafOnlyNum } = headerConfig;
        return renderSourceHeader({ num, showButton: sb, allChecked, onAllClick: oac, leafOnlyNum });
      }
      if (type === 'right' && typeof renderSelectedHeader === 'function') {
        const { num, showButton: sb, onAllClick: onClear } = headerConfig;
        return renderSelectedHeader({ num, showButton: sb, onClear });
      }
      return h('div', { class: headerCls }, [
        h('span', { class: `${prefixCls}-header-total` }, totalContent),
        showButton
          ? h(
              Button,
              {
                theme: 'borderless',
                disabled,
                type: 'tertiary',
                size: 'small',
                class: `${prefixCls}-header-all`,
                onClick: onAllClick,
              },
              () => allContent
            )
          : null,
      ]);
    };

    const renderLeftItem = (item: any, index: number) => {
      const { disabled } = props;
      const renderSourceItem = getRenderer('renderSourceItem');
      const checked = state.selectedItems.has(item.key);
      if (renderSourceItem) {
        return renderSourceItem({ ...item, checked, onChange: () => onSelectOrRemove(item) });
      }
      const leftItemCls = cls({
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-item-disabled`]: item.disabled,
      });
      return h(
        Checkbox,
        {
          key: item.key ?? index,
          disabled: item.disabled || disabled,
          class: leftItemCls,
          checked,
          role: 'listitem',
          onChange: () => onSelectOrRemove(item),
          'x-semi-children-alias': `dataSource[${index}].label`,
        },
        () => item.label
      );
    };

    const renderGroupTitle = (group: any, index: number) =>
      h('div', { class: `${prefixCls}-group-title`, key: `title-${index}` }, group.title);

    const renderLeftList = (visibleItems: any[]) => {
      const content: any[] = [];
      const groupStatus = new Map();
      visibleItems.forEach((item, index) => {
        const parentGroup = item._parent;
        const optionContent = renderLeftItem(item, index);
        if (parentGroup && groupStatus.has(parentGroup.title)) {
          content.push(optionContent);
        } else if (parentGroup) {
          content.push(renderGroupTitle(parentGroup, index));
          groupStatus.set(parentGroup.title, true);
          content.push(optionContent);
        } else {
          content.push(optionContent);
        }
      });
      return h('div', { class: `${prefixCls}-left-list`, role: 'list', 'aria-label': 'Option list' }, content);
    };

    const renderLeftTree = () => {
      const { disabled, dataSource, treeProps } = props;
      const { values } = foundation.getValuesAndItemsFromMap(state.selectedItems);
      const restTreeProps = omit(treeProps || {}, ['value', 'ref', 'onChange']);
      return h(Tree, {
        ref: treeRef,
        disabled,
        treeData: dataSource as any,
        multiple: true,
        disableStrictly: true,
        value: values,
        defaultExpandAll: true,
        leafOnly: true,
        filterTreeNode: true,
        searchRender: false,
        searchStyle: { padding: 0 },
        style: { flex: 1, overflow: 'overlay' },
        onChange: (value: any) => foundation.handleSelect(value),
        ...restTreeProps,
      });
    };

    /**
     * `sortableHandle(Wrapper)` — same contract as React's `_sortable`: returns a component that renders
     * `Wrapper` inside a `<span>` carrying the drag listeners. Only pressing the handle arms the item for dragging.
     */
    const createSortableHandle = (item: any) => (WrapperComponent: any) => {
      handledKeys.add(item.key);
      return defineComponent({
        name: 'TransferSortableHandle',
        setup() {
          return () =>
            h(
              'span',
              {
                class: `${prefixCls}-right-item-sortable-handle`,
                style: { lineHeight: 0 },
                onMousedown: (e: MouseEvent) => {
                  armedKey.value = item.key;
                  // keep the mousedown inside the item so popups (tooltip/popover) hosting the Transfer don't close
                  e.stopPropagation();
                },
                onTouchstart: () => {
                  armedKey.value = item.key;
                },
              },
              [normalizeNode(WrapperComponent)]
            );
        },
      });
    };

    const renderRightItem = (item: any, sortableHandle?: (Wrapper: any) => any) => {
      const { draggable, type, showPath } = props;
      const renderSelectedItem = getRenderer('renderSelectedItem');
      const onRemove = () => foundation.handleSelectOrRemove(item);
      const rightItemCls = cls({
        [`${prefixCls}-item`]: true,
        [`${prefixCls}-right-item`]: true,
        [`${prefixCls}-right-item-draggable`]: draggable,
      });
      const shouldShowPath = type === strings.TYPE_TREE_TO_LIST && showPath === true;
      const fullPath = getFullPath(item);
      const label = shouldShowPath ? foundation._generatePath(item) : item.label;
      if (renderSelectedItem) {
        return renderSelectedItem({ ...item, fullPath, onRemove, sortableHandle });
      }
      const DragHandle =
        sortableHandle &&
        sortableHandle(() =>
          h(IconHandle, { role: 'button', 'aria-label': 'Drag and sort', class: `${prefixCls}-right-item-drag-handler` } as any)
        );
      return h('div', { role: 'listitem', class: rightItemCls, key: item.key }, [
        draggable && DragHandle ? h(DragHandle) : null,
        h('div', { class: `${prefixCls}-right-item-text` }, [normalizeNode(label)]),
        h(IconClose, {
          onClick: onRemove,
          'aria-disabled': item.disabled,
          class: cls(`${prefixCls}-item-close-icon`, {
            [`${prefixCls}-item-close-icon-disabled`]: item.disabled,
          }),
        } as any),
      ]);
    };

    /** Sortable list (native HTML5 drag & drop) — the Vue counterpart of React's dnd-kit based `Sortable`. */
    const renderRightSortableList = (selectedData: any[]) => {
      const itemPrefix = `${prefixCls}-right-item`;
      return h(
        'div',
        { class: `${prefixCls}-right-list`, role: 'list', 'aria-label': 'Selected list', style: { overflow: 'auto' } },
        selectedData.map((item: any, index: number) => {
          const sortableHandle = createSortableHandle(item);
          const itemCls = cls(`${itemPrefix}-sortable-item`, {
            [`${itemPrefix}-sortable-item-active`]: dragIndex.value === index,
          });
          return h(
            'div',
            {
              key: item.key,
              class: itemCls,
              draggable: true,
              onDragstart: (e: DragEvent) => {
                // when the item rendered a handle, only a press on that handle may start the drag
                if (handledKeys.has(item.key) && armedKey.value !== item.key) {
                  e.preventDefault();
                  return;
                }
                dragIndex.value = index;
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = 'move';
                  try {
                    e.dataTransfer.setData('text/plain', String(item.key));
                  } catch (err) {
                    /* ignore */
                  }
                }
              },
              onDragover: (e: DragEvent) => {
                e.preventDefault();
              },
              onDrop: (e: DragEvent) => {
                e.preventDefault();
                if (dragIndex.value >= 0 && dragIndex.value !== index) {
                  onSortEnd({ oldIndex: dragIndex.value, newIndex: index });
                }
                dragIndex.value = -1;
                armedKey.value = null;
              },
              onDragend: () => {
                dragIndex.value = -1;
                armedKey.value = null;
              },
            },
            [renderRightItem(item, sortableHandle)]
          );
        })
      );
    };

    const renderVirtualizedSelectedList = (selectedData: any[]) => {
      const virtualize = props.virtualize;
      if (!virtualize || isEmpty(virtualize)) return null;
      const { height, width, itemSize } = virtualize;
      const listCls = `${prefixCls}-right-list ${prefixCls}-right-virtual-list`;
      const renderList = (h2: number, w: number | string) =>
        h(VirtualList, {
          role: 'list',
          'aria-label': 'Selected list',
          class: listCls,
          height: h2,
          width: w ?? '100%',
          itemSize,
          itemCount: selectedData.length,
          renderItem: (i: number, style: CSSProperties) =>
            h('div', { key: selectedData[i]?.key ?? i, role: 'presentation', style }, [renderRightItem(selectedData[i])]),
        } as any);
      if (typeof height !== 'number') {
        return h(AutoSizer, {
          defaultHeight: height,
          defaultWidth: width,
          render: ({ height: autoHeight, width: autoWidth }: any) => renderList(autoHeight, autoWidth),
        });
      }
      return renderList(height, width ?? '100%');
    };

    const renderLeft = (loc: any) => {
      const { data, selectedItems, inputValue, searchResult, leftCurrentPage } = state;
      const { loading, type, emptyContent, dataSource, pagination } = props;
      const renderSourcePanel = getRenderer('renderSourcePanel');
      const inSearchMode = inputValue !== '';
      const showNumber = inSearchMode ? searchResult.size : data.length;
      const filterData = inSearchMode ? data.filter((item: any) => searchResult.has(item.key)) : data;
      let leafOnlyNum: number | undefined;
      if (type === strings.TYPE_TREE_TO_LIST) {
        const leafData = inSearchMode ? filterData.filter((item: any) => item.isLeaf) : data.filter((item: any) => item.isLeaf);
        leafOnlyNum = leafData.length;
      }
      let filterDataAllDisabled = true;
      const leftContainsNotInSelected = Boolean(
        filterData.find((f: any) => {
          if (f.disabled) return false;
          if (filterDataAllDisabled) filterDataAllDisabled = false;
          return !selectedItems.has(f.key);
        })
      );
      const totalText = String(loc.total || '').replace('${total}', `${showNumber}`);
      const headerConfig = {
        totalContent: totalText,
        allContent: leftContainsNotInSelected ? loc.selectAll : loc.clearSelectAll,
        onAllClick: () => foundation.handleAll(leftContainsNotInSelected),
        type: 'left',
        showButton: type !== strings.TYPE_TREE_TO_LIST && !filterDataAllDisabled,
        num: showNumber,
        allChecked: !leftContainsNotInSelected,
        leafOnlyNum,
      };
      const inputCom = renderFilter(loc);
      const headerCom = renderHeader(headerConfig);
      const noMatch = inSearchMode && searchResult.size === 0;
      const emptySearch = getEmpty('emptySearch', emptyContent?.search, loc.emptySearch);
      const emptyLeft = getEmpty('emptyLeft', emptyContent?.left, loc.emptyLeft);
      const emptyDataCom = renderEmpty('left', emptyLeft);
      const emptySearchCom = renderEmpty('left', emptySearch);
      const pageSize = pagination?.pageSize ?? numbers.DEFAULT_PAGE_SIZE;
      const hasPagination = Boolean(pagination);
      const currentPage = leftCurrentPage;
      const totalPage = Math.ceil(filterData.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = hasPagination ? filterData.slice(startIndex, startIndex + pageSize) : filterData;

      let content: any = null;
      switch (true) {
        case loading:
          content = h(Spin);
          break;
        case noMatch:
          content = emptySearchCom;
          break;
        case data.length === 0:
          content = emptyDataCom;
          break;
        case type === strings.TYPE_TREE_TO_LIST:
          content = [headerCom, renderLeftTree()];
          break;
        case !noMatch && (type === strings.TYPE_LIST || type === strings.TYPE_GROUP_LIST):
          content = [
            headerCom,
            renderLeftList(paginatedData),
            hasPagination && totalPage > 1
              ? h('div', { class: `${prefixCls}-left-pagination` }, [
                  h(Pagination, {
                    total: filterData.length,
                    currentPage,
                    pageSize,
                    onPageChange: handleLeftPageChange,
                  }),
                ])
              : null,
          ];
          break;
        default:
          content = null;
      }

      const { values } = foundation.getValuesAndItemsFromMap(selectedItems);
      const renderProps = {
        loading,
        noMatch,
        filterData,
        sourceData: data,
        propsDataSource: dataSource,
        allChecked: !leftContainsNotInSelected,
        showNumber,
        inputValue,
        selectedItems,
        value: values,
        onSelect: foundation.handleSelect.bind(foundation),
        onAllClick: () => foundation.handleAll(leftContainsNotInSelected),
        onSearch: onInputChange,
        onSelectOrRemove,
      };
      if (renderSourcePanel) return renderSourcePanel(renderProps);
      return h('section', { class: `${prefixCls}-left` }, [inputCom, content]);
    };

    const renderRight = (loc: any) => {
      const { emptyContent, draggable, virtualize } = props;
      const renderSelectedPanel = getRenderer('renderSelectedPanel');
      const selectedData = [...state.selectedItems.values()].map((item: any) => ({
        ...item,
        fullPath: getFullPath(item),
      }));
      const renderProps = {
        length: selectedData.length,
        selectedData,
        onClear: () => foundation.handleClear(),
        onRemove: (item: any) => foundation.handleSelectOrRemove(item),
        onSortEnd,
      };
      if (renderSelectedPanel) return renderSelectedPanel(renderProps);
      const selectedText = String(loc.selected || '').replace('${total}', `${selectedData.length}`);
      const hasValidSelected = selectedData.findIndex((item: any) => !item.disabled) !== -1;
      const headerCom = renderHeader({
        totalContent: selectedText,
        allContent: loc.clear,
        onAllClick: () => foundation.handleClear(),
        type: 'right',
        showButton: Boolean(selectedData.length) && hasValidSelected,
        num: selectedData.length,
      });
      const emptyCom = renderEmpty('right', getEmpty('emptyRight', emptyContent?.right, loc.emptyRight));
      const shouldVirtualize = Boolean(virtualize && !isEmpty(virtualize));
      let content: any = null;
      switch (true) {
        case !selectedData.length:
          content = emptyCom;
          break;
        case shouldVirtualize && !draggable:
          content = renderVirtualizedSelectedList(selectedData);
          break;
        case !shouldVirtualize && !draggable:
          content = h(
            'div',
            { class: `${prefixCls}-right-list`, role: 'list', 'aria-label': 'Selected list' },
            selectedData.map((item: any) => renderRightItem({ ...item }))
          );
          break;
        case draggable:
          content = renderRightSortableList(selectedData);
          break;
        default:
          break;
      }
      return h('section', { class: `${prefixCls}-right` }, [headerCom, content]);
    };

    return () => {
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      const loc = locale.value || {};
      const transferCls = cls(prefixCls, props.className, attrClass, {
        [`${prefixCls}-disabled`]: props.disabled,
        [`${prefixCls}-custom-panel`]: Boolean(getRenderer('renderSelectedPanel') && getRenderer('renderSourcePanel')),
      });
      return h('div', { class: transferCls, style: [props.style, attrStyle], ...getDataAttr(rest) }, [
        renderLeft(loc),
        renderRight(loc),
      ]);
    };
  },
});

(Transfer as any).elementType = 'Transfer';
export default Transfer;
