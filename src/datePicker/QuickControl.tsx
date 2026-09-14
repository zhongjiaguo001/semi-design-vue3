import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import classNames from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import Button from '../button/Button';
import { Text } from '../typography/Typography';

const prefixCls = cssClasses.PREFIX;

export type PresetPosition = (typeof strings.PRESET_POSITION_SET)[number];

export interface PresetType {
  start?: string | number | Date | (() => string | number | Date);
  end?: string | number | Date | (() => string | number | Date);
  text?: string;
}

export const quickControlProps = {
  presets: { type: Array as PropType<Array<PresetType | (() => PresetType)>>, default: () => [] },
  presetPosition: { type: String as PropType<PresetPosition>, default: 'bottom' },
  type: { type: String, default: undefined },
  insetInput: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: undefined },
  locale: { type: Object as PropType<any>, default: undefined },
};

export const quickControlEmits = ['presetClick'];

const QuickControl = defineComponent({
  name: 'DatePickerQuickControl',
  inheritAttrs: false,
  props: quickControlProps,
  emits: quickControlEmits,
  setup(props, { emit }) {
    return () => {
      const { presets, type, presetPosition, insetInput, locale } = props;
      const isTypeRange = type === 'dateRange' || type === 'dateTimeRange';
      const isPanelTopAndBottom = presetPosition === 'top' || presetPosition === 'bottom';
      const isMonth = type === 'month';
      const isTopAndBottomRange = isPanelTopAndBottom && isTypeRange;
      const isTopAndBottomMonth = isPanelTopAndBottom && isMonth;
      const wrapperCls = classNames(`${prefixCls}-quick-control`, {
        [`${prefixCls}-quick-control-${type}`]: type,
        [`${prefixCls}-quick-control-${presetPosition}`]: true,
      });
      const headerCls = classNames({ [`${prefixCls}-quick-control-header`]: true });
      const contentWrapperCls = classNames({ [`${prefixCls}-quick-control-${presetPosition}-content-wrapper`]: true });
      const contentCls = classNames({
        [`${prefixCls}-quick-control-${presetPosition}-content`]: !isTopAndBottomRange && !isTopAndBottomMonth,
        [`${prefixCls}-quick-control-${presetPosition}-range-content`]: isTopAndBottomRange,
        [`${prefixCls}-quick-control-${presetPosition}-month-content`]: isTopAndBottomMonth,
      });
      const itemCls = classNames({
        [`${prefixCls}-quick-control-${presetPosition}-content-item`]: !isTopAndBottomRange && !isTopAndBottomMonth,
        [`${prefixCls}-quick-control-${presetPosition}-range-content-item`]: isTopAndBottomRange,
        [`${prefixCls}-quick-control-${presetPosition}-month-content-item`]: isTopAndBottomMonth,
      });
      const ellipsisCls = classNames({
        [`${prefixCls}-quick-control-${presetPosition}-content-item-ellipsis`]: !isTopAndBottomRange && !isTopAndBottomMonth,
        [`${prefixCls}-quick-control-${presetPosition}-range-content-item-ellipsis`]: isTopAndBottomRange,
        [`${prefixCls}-quick-control-${presetPosition}-month-content-item-ellipsis`]: isTopAndBottomMonth,
      });
      if (!presets || !presets.length) return null;
      return h('div', { class: wrapperCls, 'x-insetinput': insetInput ? 'true' : 'false' }, [
        !isPanelTopAndBottom ? h('div', { class: headerCls }, locale && locale.presets) : null,
        h('div', { class: contentWrapperCls }, [
          h(
            'div',
            { class: contentCls },
            presets.map((item, index) => {
              const _item = typeof item === 'function' ? item() : item;
              return h(
                Button,
                { size: 'small', type: 'primary', onClick: (e: MouseEvent) => emit('presetClick', _item, e), key: index },
                () => h('div', { class: itemCls }, [h(Text as any, { ellipsis: { showTooltip: true }, class: ellipsisCls }, () => _item.text)])
              );
            })
          ),
        ]),
      ]);
    };
  },
});

export default QuickControl;
