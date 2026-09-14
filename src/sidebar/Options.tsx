import { defineComponent, h } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/sidebar/constants';
import Button from '../button/Button';
import { normalizeNode } from '../_utils';

const prefixCls = cssClasses.OPTIONS;

export interface SidebarOption {
  key: string;
  name?: any;
  icon?: any;
  desc?: string;
  [key: string]: any;
}

export const sidebarOptionsProps = {
  options: { type: Array as PropType<SidebarOption[]>, default: () => [] },
  renderOptionItem: { type: Function as PropType<(option: SidebarOption, onChange?: (e: MouseEvent, key: string) => void) => VNodeChild>, default: undefined },
  activeKey: { type: String, default: undefined },
  onChange: { type: Function as PropType<(e: MouseEvent, key: string) => void>, default: undefined },
};

const SidebarOptions = defineComponent({
  name: 'SidebarOptions',
  props: sidebarOptionsProps,
  setup(props, { slots }) {
    return () => {
      const { options, renderOptionItem, onChange, activeKey } = props;
      return h('div', { class: prefixCls }, [
        ...(options || []).map((option) => {
          const { icon, name, key } = option;
          const optionSlots = { default: () => normalizeNode(name) };
          if (typeof renderOptionItem === 'function') {
            return renderOptionItem(option, onChange);
          }
          return h(
            Button,
            { class: cls(`${prefixCls}-button`, { [`${prefixCls}-normal`]: activeKey !== key }), key, icon: normalizeNode(icon), onClick: (e: MouseEvent) => onChange && onChange(e, option.key) },
            optionSlots
          );
        }),
        slots.default?.(),
      ]);
    };
  },
});

export default SidebarOptions;
