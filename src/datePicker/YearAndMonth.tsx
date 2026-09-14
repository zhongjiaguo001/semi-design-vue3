import { defineComponent, h, ref, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import _isEqual from 'lodash/isEqual';
import YearAndMonthFoundation from '@douyinfe/semi-foundation/lib/es/datePicker/yearAndMonthFoundation';
import { getYearAndMonth, getYears } from '@douyinfe/semi-foundation/lib/es/datePicker/_utils/index';
import { BASE_CLASS_PREFIX } from '@douyinfe/semi-foundation/lib/es/base/constants';
import { setYear, setMonth, set } from 'date-fns';
import { strings } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import { useBaseComponent } from '../_base/useBaseComponent';
import ScrollList from '../scrollList/ScrollList';
import ScrollItem from '../scrollList/ScrollItem';
import { IconButton } from '../button/Button';
import { IconChevronLeft } from '../icons/generated';
import type { PresetPosition } from './QuickControl';

const prefixCls = `${BASE_CLASS_PREFIX}-datepicker`;

export interface YearMonthPair {
  left: number;
  right: number;
}

export interface YearAndMonthSelectItem {
  currentYear: YearMonthPair;
  currentMonth: YearMonthPair;
}

const stubFalse = () => false;

export const yearAndMonthProps = {
  currentYear: { type: Object as PropType<YearMonthPair>, default: () => ({ left: 0, right: 0 }) },
  currentMonth: { type: Object as PropType<YearMonthPair>, default: () => ({ left: 0, right: 0 }) },
  locale: { type: Object as PropType<any>, default: () => ({}) },
  localeCode: { type: String, default: undefined },
  monthCycled: { type: Boolean, default: false },
  yearCycled: { type: Boolean, default: false },
  noBackBtn: { type: Boolean, default: false },
  disabledDate: { type: Function as PropType<(date: Date) => boolean>, default: stubFalse },
  density: { type: String, default: undefined },
  presetPosition: { type: String as PropType<PresetPosition>, default: undefined },
  renderQuickControls: { type: null as unknown as PropType<any>, default: undefined },
  renderDateInput: { type: null as unknown as PropType<any>, default: undefined },
  type: { type: String as PropType<(typeof strings.TYPE_SET)[number]>, default: 'month' },
  yearAndMonthOpts: { type: Object as PropType<Record<string, any>>, default: undefined },
  startYear: { type: Number, default: undefined },
  endYear: { type: Number, default: undefined },
};

export const yearAndMonthEmits = ['select', 'backToMain'];

const YearAndMonth = defineComponent({
  name: 'DatePickerYearAndMonth',
  inheritAttrs: false,
  props: yearAndMonthProps,
  emits: yearAndMonthEmits,
  setup(props, { emit, expose }) {
    const init = getYearAndMonth(props.currentYear, props.currentMonth);
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      years: getYears(props.startYear, props.endYear).map((year) => ({ value: year, year })),
      months: Array(12)
        .fill(0)
        .map((_v, idx) => ({ value: idx + 1, month: idx + 1 })),
      currentYear: init.year as YearMonthPair,
      currentMonth: init.month as YearMonthPair,
    });

    const yearRef = ref<any>(null);
    const monthRef = ref<any>(null);

    const adapter = {
      ...baseAdapter,
      setCurrentYear: (currentYear: YearMonthPair, cb?: () => void) => baseAdapter.setState({ currentYear } as any, cb),
      setCurrentMonth: (currentMonth: YearMonthPair) => {
        state.currentMonth = currentMonth;
      },
      setCurrentYearAndMonth: (currentYear: YearMonthPair, currentMonth: YearMonthPair) => {
        state.currentYear = currentYear;
        state.currentMonth = currentMonth;
      },
      notifySelectYear: (year: YearMonthPair) => emit('select', { currentMonth: { ...state.currentMonth }, currentYear: year }),
      notifySelectMonth: (month: YearMonthPair) => emit('select', { currentYear: { ...state.currentYear }, currentMonth: month }),
      notifySelectYearAndMonth: (year: YearMonthPair, month: YearMonthPair) => emit('select', { currentYear: year, currentMonth: month }),
      notifyBackToMain: () => emit('backToMain'),
    };
    const foundation = new (YearAndMonthFoundation as any)(adapter);
    foundation.init();
    onBeforeUnmount(() => foundation.destroy());

    // getDerivedStateFromProps
    watch(
      () => [props.currentYear, props.currentMonth],
      () => {
        const { year, month } = getYearAndMonth(props.currentYear, props.currentMonth);
        if (!_isEqual(props.currentYear, state.currentYear)) state.currentYear = year;
        if (!_isEqual(props.currentMonth, state.currentMonth)) state.currentMonth = month;
      },
      { deep: true }
    );
    watch(
      () => [props.startYear, props.endYear],
      () => {
        state.years = getYears(props.startYear, props.endYear).map((year) => ({ value: year, year }));
      }
    );

    const selectYear = (item: any, panelType: string) => foundation.selectYear(item, panelType);
    const selectMonth = (item: any, panelType: string) => foundation.selectMonth(item, panelType);
    const reselect = () => {
      [yearRef, monthRef].forEach((r) => {
        if (r.value && r.value.scrollToIndex) r.value.scrollToIndex();
      });
    };
    const backToMain = (e: MouseEvent) => {
      e && e.stopImmediatePropagation && e.stopImmediatePropagation();
      foundation.backToMain();
    };

    const renderColYear = (panelType: 'left' | 'right') => {
      const { years, currentYear, currentMonth, months } = state;
      const { disabledDate, localeCode, yearCycled, yearAndMonthOpts } = props;
      const currentDate = setMonth(Date.now(), currentMonth[panelType] - 1);
      const left = strings.PANEL_TYPE_LEFT;
      const right = strings.PANEL_TYPE_RIGHT;
      const needDisabled = (year: number) => {
        if (panelType === right && currentYear[left as 'left']) {
          return currentYear[left as 'left'] > year;
        }
        return false;
      };
      const list = years.map(({ value, year }) => {
        const isAllMonthDisabled = months.every(({ month }) => disabledDate(set(currentDate, { year, month: month - 1 })));
        const isRightPanelDisabled = needDisabled(year);
        return { year, value, disabled: isAllMonthDisabled || isRightPanelDisabled };
      });
      let transform = (val: any) => val;
      if (localeCode === 'zh-CN' || localeCode === 'zh-TW') {
        transform = (val: any) => `${val}年`;
      }
      return h(ScrollItem, {
        ref: yearRef,
        cycled: yearCycled,
        list,
        transform,
        selectedIndex: years.findIndex((item) => item.value === currentYear[panelType]),
        type: 'year',
        onSelect: (item: any) => selectYear(item, panelType),
        mode: 'normal',
        ...yearAndMonthOpts,
      });
    };

    const renderColMonth = (panelType: 'left' | 'right') => {
      const { months, currentMonth, currentYear } = state;
      const { locale, localeCode, monthCycled, disabledDate, yearAndMonthOpts } = props;
      let transform = (val: any) => val;
      const currentDate = setYear(Date.now(), currentYear[panelType]);
      const left = strings.PANEL_TYPE_LEFT as 'left';
      const right = strings.PANEL_TYPE_RIGHT as 'right';
      if (localeCode === 'zh-CN' || localeCode === 'zh-TW') {
        transform = (val: any) => `${val}月`;
      }
      const fullMonths = (locale && locale.fullMonths) || {};
      const list = months.map(({ value, month }) => {
        const isRightPanelDisabled = panelType === right && currentMonth[left] && currentYear[left] === currentYear[right] && currentMonth[left] > month;
        return {
          month,
          disabled: disabledDate(setMonth(currentDate, month - 1)) || Boolean(isRightPanelDisabled),
          value: fullMonths[value],
        };
      });
      const selectedIndex = list.findIndex((item) => item.month === currentMonth[panelType]);
      return h(ScrollItem, {
        ref: monthRef,
        cycled: monthCycled,
        list,
        transform,
        selectedIndex,
        type: 'month',
        onSelect: (item: any) => selectMonth(item, panelType),
        mode: 'normal',
        ...yearAndMonthOpts,
      });
    };

    const renderPanel = (panelType: 'left' | 'right') => h(ScrollList, {}, () => [renderColYear(panelType), renderColMonth(panelType)]);

    expose({ reselect, foundation });

    return () => {
      const { locale, noBackBtn, density, presetPosition, renderQuickControls, renderDateInput, type } = props;
      const prefix = `${prefixCls}-yearmonth-header`;
      const bodyCls = `${prefixCls}-yearmonth-body`;
      const selectDateText = locale && locale.selectDate;
      const iconSize = density === 'compact' ? 'default' : 'large';
      const buttonSize = density === 'compact' ? 'small' : 'default';
      const panelTypeLeft = strings.PANEL_TYPE_LEFT as 'left';
      const panelTypeRight = strings.PANEL_TYPE_RIGHT as 'right';
      let content: any = null;
      if (type === 'month') {
        content = renderPanel(panelTypeLeft);
      } else {
        content = h('div', { class: bodyCls }, [renderPanel(panelTypeLeft), renderPanel(panelTypeRight)]);
      }
      const quick = typeof renderQuickControls === 'function' ? renderQuickControls() : renderQuickControls;
      const dateInput = typeof renderDateInput === 'function' ? renderDateInput() : renderDateInput;
      return [
        noBackBtn
          ? null
          : h('div', { class: prefix }, [
              h(
                IconButton,
                {
                  noHorizontalPadding: false,
                  icon: h(IconChevronLeft, { 'aria-hidden': true, size: iconSize }),
                  size: buttonSize,
                  onClick: backToMain,
                },
                () => h('span', selectDateText)
              ),
            ]),
        presetPosition
          ? h('div', { style: { display: 'flex' } }, [
              presetPosition === 'left' && type !== 'monthRange' ? quick : null,
              h('div', [dateInput, content]),
              presetPosition === 'right' && type !== 'monthRange' ? quick : null,
            ])
          : [dateInput, content],
      ];
    };
  },
});

export default YearAndMonth;
