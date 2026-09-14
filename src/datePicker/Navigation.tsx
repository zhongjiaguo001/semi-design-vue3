import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/datePicker/constants';
import Button, { IconButton } from '../button/Button';
import { IconChevronLeft, IconChevronRight, IconDoubleChevronLeft, IconDoubleChevronRight } from '../icons/generated';

const prefixCls = cssClasses.NAVIGATION;

export type PanelType = 'left' | 'right';

export const navigationProps = {
  monthText: { type: String, default: '' },
  density: { type: String, default: undefined },
  navPrev: { type: [Object, Function] as PropType<any>, default: undefined },
  navNext: { type: [Object, Function] as PropType<any>, default: undefined },
  shouldBimonthSwitch: { type: Boolean, default: false },
  panelType: { type: String as PropType<PanelType>, default: undefined },
  forwardRef: { type: Function as PropType<(el: HTMLElement | null) => void>, default: undefined },
};

export const navigationEmits = ['monthClick', 'nextMonth', 'prevMonth', 'nextYear', 'prevYear'];

const Navigation = defineComponent({
  name: 'DatePickerNavigation',
  inheritAttrs: false,
  props: navigationProps,
  emits: navigationEmits,
  setup(props, { emit }) {
    return () => {
      const { monthText, density, shouldBimonthSwitch, panelType, forwardRef } = props;
      const btnTheme = 'borderless';
      const iconBtnSize = density === 'compact' ? 'default' : 'large';
      const btnNoHorizontalPadding = true;
      const buttonSize = density === 'compact' ? 'small' : 'default';
      const isLeftPanel = panelType === strings.PANEL_TYPE_LEFT;
      const isRightPanel = panelType === strings.PANEL_TYPE_RIGHT;
      const hiddenLeftPanelRightButtons = shouldBimonthSwitch && isLeftPanel;
      const hiddenRightPanelLeftButtons = shouldBimonthSwitch && isRightPanel;
      const leftButtonStyle: CSSProperties = {};
      const rightButtonStyle: CSSProperties = {};
      if (hiddenRightPanelLeftButtons) leftButtonStyle.visibility = 'hidden';
      if (hiddenLeftPanelRightButtons) rightButtonStyle.visibility = 'hidden';
      return h('div', { class: prefixCls, ref: (el: any) => forwardRef && forwardRef(el) }, [
        h(IconButton, {
          key: 'double-chevron-left',
          'aria-label': 'Previous year',
          icon: h(IconDoubleChevronLeft, { 'aria-hidden': true, size: iconBtnSize }),
          size: buttonSize,
          theme: btnTheme,
          noHorizontalPadding: btnNoHorizontalPadding,
          onClick: (e: MouseEvent) => emit('prevYear', e),
          style: leftButtonStyle,
        }),
        h(IconButton, {
          key: 'chevron-left',
          'aria-label': 'Previous month',
          icon: h(IconChevronLeft, { 'aria-hidden': true, size: iconBtnSize }),
          size: buttonSize,
          onClick: (e: MouseEvent) => emit('prevMonth', e),
          theme: btnTheme,
          noHorizontalPadding: btnNoHorizontalPadding,
          style: leftButtonStyle,
        }),
        h('div', { class: `${prefixCls}-month` }, [
          h(Button, { onClick: (e: MouseEvent) => emit('monthClick', e), theme: btnTheme, size: buttonSize }, () => h('span', monthText)),
        ]),
        h(IconButton, {
          key: 'chevron-right',
          'aria-label': 'Next month',
          icon: h(IconChevronRight, { 'aria-hidden': true, size: iconBtnSize }),
          size: buttonSize,
          onClick: (e: MouseEvent) => emit('nextMonth', e),
          theme: btnTheme,
          noHorizontalPadding: btnNoHorizontalPadding,
          style: rightButtonStyle,
        }),
        h(IconButton, {
          key: 'double-chevron-right',
          'aria-label': 'Next year',
          icon: h(IconDoubleChevronRight, { 'aria-hidden': true, size: iconBtnSize }),
          size: buttonSize,
          theme: btnTheme,
          noHorizontalPadding: btnNoHorizontalPadding,
          onClick: (e: MouseEvent) => emit('nextYear', e),
          style: rightButtonStyle,
        }),
      ]);
    };
  },
});

export default Navigation;
