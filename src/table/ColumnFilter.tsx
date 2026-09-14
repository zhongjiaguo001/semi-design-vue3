import { defineComponent, h, ref, watch, isVNode, cloneVNode } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import _noop from 'lodash/noop';
import _isEqual from 'lodash/isEqual';
import _pick from 'lodash/pick';
import _omit from 'lodash/omit';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/table/constants';
import { IconFilter } from '../icons/generated';
import Dropdown, { DropdownMenu, DropdownItem } from '../dropdown';
import { Radio } from '../radio';
import { Checkbox } from '../checkbox';
import Button from '../button';
import Space from '../space';
import { useLocale } from '../locale';
import { normalizeNode } from '../_utils';

const FilterDropdownMenu = (children: any[]) => h(DropdownMenu, null, () => children);

const FilterDropdownItem = (props: { key?: any; onClick?: (e: any) => void }, children: any) => h(DropdownItem, { key: props.key, onClick: props.onClick }, () => children);

function renderDropdown(props: Record<string, any>, nestedElem: any = null, level = 0, locale?: any) {
  const {
    filterMultiple = true,
    filters = [],
    filteredValue = [],
    filterDropdownVisible,
    onSelect = _noop,
    onFilterDropdownVisibleChange = _noop,
    trigger = 'click',
    position = 'bottom',
    renderFilterDropdown,
    renderFilterDropdownItem,
    filterConfirmMode = 'immediate',
    tempFilteredValue,
    setTempFilteredValue,
    confirm,
    clear,
    close,
    reset,
  } = props ?? {};
  const displayValue = filterConfirmMode === 'confirm' ? tempFilteredValue ?? [] : filteredValue;
  const renderFilterDropdownProps = _pick(props, ['tempFilteredValue', 'setTempFilteredValue', 'confirm', 'clear', 'close', 'filters']);
  const items =
    typeof renderFilterDropdown === 'function'
      ? renderFilterDropdown(renderFilterDropdownProps)
      : FilterDropdownMenu([
          ...(Array.isArray(filters)
            ? filters.map((filter: any, index: number) => {
                const changeFn = (e: any) => {
                  const domEvent = e && (e.nativeEvent || (e instanceof Event ? e : undefined));
                  if (domEvent) {
                    domEvent.stopImmediatePropagation && domEvent.stopImmediatePropagation();
                    domEvent.stopPropagation && domEvent.stopPropagation();
                    domEvent.preventDefault && domEvent.preventDefault();
                  }
                  if (filterConfirmMode === 'confirm') {
                    const currentTempValue = tempFilteredValue ?? [...filteredValue];
                    let values = [...currentTempValue];
                    const idx = values.indexOf(filter.value);
                    if (idx > -1) {
                      values.splice(idx, 1);
                    } else if (filterMultiple) {
                      values.push(filter.value);
                    } else {
                      values = [filter.value];
                    }
                    setTempFilteredValue?.(values);
                  } else {
                    let values = [...filteredValue];
                    const included = values.includes(filter.value);
                    const idx = values.indexOf(filter.value);
                    if (idx > -1) {
                      values.splice(idx, 1);
                    } else if (filterMultiple) {
                      values.push(filter.value);
                    } else {
                      values = [filter.value];
                    }
                    return onSelect({ value: filter.value, filteredValue: values, included: !included, domEvent });
                  }
                  return undefined;
                };
                const checked = displayValue.includes(filter.value);
                const { text, value } = filter;
                const key = `${level}_${index}`;
                const dropdownItem = typeof renderFilterDropdownItem === 'function' ? renderFilterDropdownItem({ onChange: changeFn, filterMultiple, value, text, checked, filteredValue: displayValue, level }) : null;
                let item: any =
                  dropdownItem && isVNode(dropdownItem)
                    ? cloneVNode(dropdownItem, { key })
                    : FilterDropdownItem({ key, onClick: changeFn }, [filterMultiple ? h(Checkbox, { checked }, () => normalizeNode(text)) : h(Radio, { checked }, () => normalizeNode(text))]);
                if (Array.isArray(filter.children) && filter.children.length) {
                  const childrenDropdownProps: Record<string, any> = { ...props, filters: filter.children, trigger: 'hover', position: 'right' };
                  delete childrenDropdownProps.filterDropdownVisible;
                  item = renderDropdown(childrenDropdownProps, item, level + 1, locale);
                }
                return item;
              })
            : []),
          filterConfirmMode === 'confirm' && level === 0
            ? h('div', { style: { padding: '8px 12px', borderTop: '1px solid var(--semi-color-border)', display: 'flex', justifyContent: 'flex-end' }, class: `${cssClasses.PREFIX}-column-filter-confirm` }, [
                h(Space, null, () => [
                  h(Button, { size: 'small', onClick: () => reset?.() }, () => locale?.resetFilter || 'Reset'),
                  h(Button, { size: 'small', theme: 'solid', onClick: () => confirm?.({ closeDropdown: true }) }, () => locale?.confirmFilter || 'OK'),
                ]),
              ])
            : null,
        ]);
  const restProps = _omit(props, ['filterDropdownVisible', 'filters', 'filteredValue', 'filterMultiple', 'onSelect', 'onFilterDropdownVisibleChange', 'renderFilterDropdown', 'renderFilterDropdownItem', 'filterConfirmMode', 'tempFilteredValue', 'setTempFilteredValue', 'confirm', 'clear', 'close', 'reset', 'filterIcon', 'filterDropdown', 'filterDropdownProps', 'prefixCls', 'dataIndex', 'title', 'render', 'sorter', 'sortOrder', 'defaultSortOrder', 'onFilter', 'key', 'width', 'fixed', 'align', 'className', 'ellipsis', 'onCell', 'onHeaderCell', 'useFullRender', 'defaultFilteredValue', 'sortChildrenRecord', 'filterChildrenRecord', 'sortIcon', 'showSortTip', 'resize', 'shouldCellUpdate', 'colSpan', 'clickToSort', 'mouseDown', 'children', '__titleIsSlot']);
  const dropdownProps: Record<string, any> = {
    ...restProps,
    trigger,
    position,
    render: items,
    onVisibleChange: (visible: boolean) => onFilterDropdownVisibleChange(visible),
    key: `Dropdown_level_${level}`,
    className: `${cssClasses.PREFIX}-column-filter-dropdown`,
  };
  if (filterDropdownVisible != null) {
    dropdownProps.visible = filterDropdownVisible;
  }
  return h(Dropdown, dropdownProps, { default: () => nestedElem });
}

export const columnFilterProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  filteredValue: { type: Array as PropType<any[]>, default: undefined },
  filterIcon: { type: [Boolean, Object, Function, String] as PropType<any>, default: 'filter' },
  filterDropdownProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  onSelect: { type: Function as PropType<(data: any) => void>, default: _noop },
  filterDropdownVisible: { type: Boolean, default: undefined },
  filterDropdown: { type: [Object, Function, String] as PropType<any>, default: null },
  renderFilterDropdown: { type: Function as PropType<(props: any) => any>, default: undefined },
  renderFilterDropdownItem: { type: Function as PropType<(itemInfo: any) => any>, default: undefined },
  onFilterDropdownVisibleChange: { type: Function as PropType<(visible: boolean) => void>, default: _noop },
  filterConfirmMode: { type: String as PropType<'immediate' | 'confirm'>, default: 'immediate' },
  filters: { type: Array as PropType<any[]>, default: () => [] },
  filterMultiple: { type: Boolean, default: true },
  trigger: { type: String, default: 'click' },
  position: { type: String, default: 'bottom' },
  /** other column props forwarded by Table (dataIndex etc.) */
  column: { type: Object as PropType<Record<string, any>>, default: undefined },
};

const ColumnFilter = defineComponent({
  name: 'TableColumnFilter',
  inheritAttrs: false,
  props: columnFilterProps,
  setup(props, { attrs }) {
    const { locale } = useLocale('Table');
    const isFilterDropdownVisibleControlled = () => typeof props.filterDropdownVisible !== 'undefined';
    const isCustomFilterDropdown = () => typeof props.renderFilterDropdown === 'function';
    const isCustomDropdownVisible = () => !isFilterDropdownVisibleControlled() && (isCustomFilterDropdown() || props.filterConfirmMode === 'confirm');
    const tempFilteredValue = ref<any[] | undefined>(props.filteredValue);
    const initialFilteredValue = ref<any[] | undefined>(props.filteredValue);
    const dropdownVisible = ref<boolean | undefined>(isCustomDropdownVisible() ? false : props.filterDropdownVisible);

    watch(
      () => props.filterDropdownVisible,
      (v) => {
        if (typeof v !== 'undefined') dropdownVisible.value = v;
      }
    );
    watch(
      () => props.filteredValue,
      (v) => {
        tempFilteredValue.value = v;
      }
    );

    const confirm = (opts: { filteredValue?: any[]; closeDropdown?: boolean } = {}) => {
      const newFilteredValue = opts?.filteredValue || tempFilteredValue.value;
      if (!_isEqual(newFilteredValue, props.filteredValue)) {
        props.onSelect({ filteredValue: newFilteredValue });
      }
      if (opts.closeDropdown) {
        dropdownVisible.value = false;
      }
    };
    const clear = (opts: { closeDropdown?: boolean } = {}) => {
      tempFilteredValue.value = [];
      props.onSelect({ filteredValue: [] });
      if (opts.closeDropdown) {
        dropdownVisible.value = false;
      }
    };
    const close = () => {
      dropdownVisible.value = false;
    };
    const reset = () => {
      tempFilteredValue.value = initialFilteredValue.value;
    };
    const handleFilterDropdownVisibleChange = (visible: boolean) => {
      if (isCustomDropdownVisible()) {
        dropdownVisible.value = visible;
      }
      if (visible && props.filterConfirmMode === 'confirm') {
        initialFilteredValue.value = props.filteredValue;
        tempFilteredValue.value = props.filteredValue;
      }
      props.onFilterDropdownVisibleChange(visible);
    };

    return () => {
      const { prefixCls, filteredValue, filterIcon, filterDropdownProps, filterDropdown, filterDropdownVisible } = props;
      const finalCls = cls(`${prefixCls}-column-filter`, { on: Array.isArray(filteredValue) && filteredValue.length });
      let iconElem: any;
      if (typeof filterIcon === 'function' && !(filterIcon as any).setup && !(filterIcon as any).render && !(filterIcon as any).__vccOpts) {
        iconElem = filterIcon(Array.isArray(filteredValue) && filteredValue.length > 0);
      } else if (isVNode(filterIcon) || (filterIcon && typeof filterIcon === 'object')) {
        iconElem = normalizeNode(filterIcon);
      } else {
        iconElem = h('div', { class: finalCls }, ['​', h(IconFilter, { role: 'button', 'aria-label': 'Filter data with this column', 'aria-haspopup': 'listbox', tabindex: -1, size: 'default' })]);
      }
      const renderFilterDropdownProps = {
        tempFilteredValue: tempFilteredValue.value,
        setTempFilteredValue: (v: any[]) => {
          tempFilteredValue.value = v;
        },
        confirm,
        clear,
        close,
        reset,
        filters: props.filters,
      };
      const renderProps = {
        ...(props.column || {}),
        ..._omit(props, ['column']),
        ...(attrs as any),
        ...filterDropdownProps,
        ...renderFilterDropdownProps,
        filterDropdownVisible: isFilterDropdownVisibleControlled() ? filterDropdownVisible : dropdownVisible.value,
        onFilterDropdownVisibleChange: handleFilterDropdownVisibleChange,
      };
      if (filterDropdown) {
        return normalizeNode(filterDropdown);
      }
      return renderDropdown(renderProps, iconElem, 0, locale.value);
    };
  },
});

export default ColumnFilter;
