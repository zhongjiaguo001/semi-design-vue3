import { defineComponent, h, watch } from 'vue';
import type { PropType } from 'vue';
import { format as dateFnsFormat } from 'date-fns';
import { strings } from '@douyinfe/semi-foundation/lib/es/timePicker/constants';
import ComboboxFoundation, { formatOption } from '@douyinfe/semi-foundation/lib/es/timePicker/ComboxFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { normalizeNode } from '../_utils';
import ScrollList from '../scrollList/ScrollList';
import ScrollItem from '../scrollList/ScrollItem';
import type { ScrollItemSelectedItem } from '../scrollList/ScrollItem';

const noop = () => undefined as any;

export const comboboxProps = {
  format: { type: String, default: strings.DEFAULT_FORMAT },
  defaultOpenValue: { type: Object as PropType<any>, default: undefined },
  prefixCls: { type: String, default: undefined },
  showHour: { type: Boolean, default: undefined },
  showMinute: { type: Boolean, default: undefined },
  showSecond: { type: Boolean, default: undefined },
  disabledHours: { type: Function as PropType<() => number[]>, default: noop },
  disabledMinutes: { type: Function as PropType<(hour: number) => number[]>, default: noop },
  disabledSeconds: { type: Function as PropType<(hour: number, minute: number) => number[]>, default: noop },
  hideDisabledOptions: { type: Boolean, default: false },
  use12Hours: { type: Boolean, default: false },
  isAM: { type: Boolean, default: undefined },
  timeStampValue: { type: null as unknown as PropType<any>, default: undefined },
  scrollItemProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  hourStep: { type: Number, default: undefined },
  minuteStep: { type: Number, default: undefined },
  secondStep: { type: Number, default: undefined },
  panelHeader: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  panelFooter: { type: [String, Number, Object, Function, Array] as PropType<any>, default: undefined },
  position: { type: String, default: undefined },
  type: { type: String, default: undefined },
};

export const comboboxEmits = ['change', 'currentSelectPanelChange'];

export interface ComboboxChangeResult {
  isAM: boolean;
  value: string;
  timeStampValue: number;
}

const Combobox = defineComponent({
  name: 'TimePickerCombobox',
  inheritAttrs: false,
  props: comboboxProps,
  emits: comboboxEmits,
  setup(props, { slots, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent(props as any, {
      showHour: false,
      showMinute: false,
      showSecond: false,
      hourOptions: [] as number[],
      minuteOptions: [] as number[],
      secondOptions: [] as number[],
    });
    const { locale, localeCode } = useLocale('TimePicker');

    const foundation = new (ComboboxFoundation as any)(baseAdapter);
    Object.assign(state, foundation.initData());

    const cacheRefCurrent = (key: string, current: any) => {
      if (key && typeof key === 'string') {
        baseAdapter.setCache(key, current);
      }
    };

    const reselect = () => {
      const currentKeys = ['ampm', 'hour', 'minute', 'second'];
      currentKeys.forEach((key) => {
        const current = baseAdapter.getCache(key);
        if (current && current.scrollToIndex) {
          current.scrollToIndex();
        }
      });
    };

    const onItemChange = ({ type, value }: ScrollItemSelectedItem) => {
      const { use12Hours, format, timeStampValue } = props;
      let { isAM } = props;
      const transformValue: Date = foundation.getDisplayDateFromTimeStamp(timeStampValue);
      if (type === 'hour') {
        if (use12Hours) {
          if (isAM) {
            transformValue.setHours(Number(value) % 12);
          } else {
            transformValue.setHours((Number(value) % 12) + 12);
          }
        } else {
          transformValue.setHours(Number(value));
        }
      } else if (type === 'minute') {
        transformValue.setMinutes(Number(value));
      } else if (type === 'ampm') {
        const ampm = String(value).toUpperCase();
        if (use12Hours) {
          if (ampm === 'PM') {
            isAM = false;
            transformValue.getHours() < 12 && transformValue.setHours((transformValue.getHours() % 12) + 12);
          }
          if (ampm === 'AM') {
            isAM = true;
            transformValue.getHours() >= 12 && transformValue.setHours(transformValue.getHours() - 12);
          }
        }
      } else {
        transformValue.setSeconds(Number(value));
      }
      const result: ComboboxChangeResult = {
        isAM: Boolean(isAM),
        value: dateFnsFormat(transformValue, format && format.replace(/(\s+)A/g, '$1a')),
        timeStampValue: Number(transformValue),
      };
      emit('change', result);
    };

    const onEnterSelectPanel = (range: any) => emit('currentSelectPanelChange', range);

    // componentDidUpdate: re-init options when relevant props change
    watch(
      () => [props.timeStampValue, props.format, props.hideDisabledOptions, props.use12Hours, props.hourStep, props.minuteStep, props.secondStep, props.disabledHours, props.disabledMinutes, props.disabledSeconds, props.isAM],
      () => {
        Object.assign(state, foundation.initData());
      }
    );

    const renderHourSelect = (hour: number) => {
      const { prefixCls, disabledHours, use12Hours, scrollItemProps } = props;
      const { showHour, hourOptions } = state;
      if (!showHour) return null;
      const disabledOptions = disabledHours();
      let hourOptionsAdj: number[];
      let hourAdj: number;
      if (use12Hours) {
        hourOptionsAdj = [12].concat(hourOptions.filter((h) => h < 12 && h > 0));
        hourAdj = hour % 12 || 12;
      } else {
        hourOptionsAdj = hourOptions;
        hourAdj = hour;
      }
      const transformHour = (value: any) => value + locale.value.hour;
      const className = `${prefixCls}-list-hour`;
      return h(ScrollItem, {
        ref: (current: any) => cacheRefCurrent('hour', current),
        mode: 'normal',
        transform: transformHour,
        className,
        list: hourOptionsAdj.map((option) => formatOption(option, disabledOptions)),
        selectedIndex: hourOptionsAdj.indexOf(hourAdj),
        type: 'hour',
        onSelect: onItemChange,
        ...scrollItemProps,
      });
    };

    const renderMinuteSelect = (minute: number) => {
      const { prefixCls, disabledMinutes, timeStampValue, scrollItemProps } = props;
      const { showMinute, minuteOptions } = state;
      if (!showMinute) return null;
      const value = new Date(timeStampValue);
      const disabledOptions = disabledMinutes && disabledMinutes(value.getHours());
      const className = `${prefixCls}-list-minute`;
      const transformMinute = (min: any) => min + locale.value.minute;
      return h(ScrollItem, {
        ref: (current: any) => cacheRefCurrent('minute', current),
        mode: 'normal',
        transform: transformMinute,
        list: minuteOptions.map((option) => formatOption(option, disabledOptions)),
        selectedIndex: minuteOptions.indexOf(minute),
        type: 'minute',
        onSelect: onItemChange,
        className,
        ...scrollItemProps,
      });
    };

    const renderSecondSelect = (second: number) => {
      const { prefixCls, disabledSeconds, timeStampValue, scrollItemProps } = props;
      const { showSecond, secondOptions } = state;
      if (!showSecond) return null;
      const value = new Date(timeStampValue);
      const disabledOptions = disabledSeconds && disabledSeconds(value.getHours(), value.getMinutes());
      const className = `${prefixCls}-list-second`;
      const transformSecond = (sec: any) => String(sec) + locale.value.second;
      return h(ScrollItem, {
        ref: (current: any) => cacheRefCurrent('second', current),
        mode: 'normal',
        transform: transformSecond,
        list: secondOptions.map((option) => formatOption(option, disabledOptions)),
        selectedIndex: secondOptions.indexOf(second),
        className,
        type: 'second',
        onSelect: onItemChange,
        ...scrollItemProps,
      });
    };

    const renderAMPMSelect = () => {
      const { prefixCls, use12Hours, isAM, scrollItemProps } = props;
      if (!use12Hours) return null;
      const AMPMOptions = [
        { value: 'AM', text: locale.value.AM || '上午' },
        { value: 'PM', text: locale.value.PM || '下午' },
      ];
      const selected = isAM ? 0 : 1;
      const className = `${prefixCls}-list-ampm`;
      return h(ScrollItem, {
        ref: (current: any) => cacheRefCurrent('ampm', current),
        mode: 'normal',
        className,
        list: AMPMOptions,
        selectedIndex: selected,
        type: 'ampm',
        onSelect: onItemChange,
        ...scrollItemProps,
      });
    };

    expose({ reselect, foundation, onEnterSelectPanel, getDisplayDateFromTimeStamp: (ts: any) => foundation.getDisplayDateFromTimeStamp(ts) });

    return () => {
      const { timeStampValue, panelHeader, panelFooter } = props;
      void localeCode.value;
      void propsView;
      const value: Date = foundation.getDisplayDateFromTimeStamp(timeStampValue);
      const headerNode = slots.panelHeader ? slots.panelHeader() : normalizeNode(panelHeader);
      const footerNode = slots.panelFooter ? slots.panelFooter() : normalizeNode(panelFooter);
      return h(
        ScrollList,
        {
          xSemiHeaderAlias: 'panelHeader',
          xSemiFooterAlias: 'panelFooter',
        },
        {
          default: () => [renderAMPMSelect(), renderHourSelect(value.getHours()), renderMinuteSelect(value.getMinutes()), renderSecondSelect(value.getSeconds())],
          ...(slots.panelHeader || (panelHeader !== undefined && panelHeader !== null && panelHeader !== false) ? { header: () => headerNode } : {}),
          ...(slots.panelFooter || (panelFooter !== undefined && panelFooter !== null && panelFooter !== false) ? { footer: () => footerNode } : {}),
        }
      );
    };
  },
});

export default Combobox;
