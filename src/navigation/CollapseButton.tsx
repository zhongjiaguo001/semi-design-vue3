import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import { IconSidebar } from '../icons/generated';
import Button from '../button';
import Tooltip from '../tooltip';
import { normalizeNode } from '../_utils';

export const collapseButtonProps = {
  prefixCls: { type: String, default: undefined },
  locale: { type: Object as PropType<Record<string, any>>, default: undefined },
  collapseText: { type: Function as PropType<(isCollapsed?: boolean) => any>, default: undefined },
  isCollapsed: { type: Boolean, default: false },
};

const CollapseButton = defineComponent({
  name: 'NavCollapseButton',
  inheritAttrs: false,
  props: collapseButtonProps,
  emits: ['click'],
  setup(props, { emit }) {
    return () => {
      const handleClick = () => emit('click', !props.isCollapsed);
      const btnProps = {
        icon: IconSidebar,
        type: 'tertiary' as const,
        theme: 'borderless' as const,
        onClick: handleClick,
      };
      let finalCollapseText: any = props.isCollapsed ? props.locale?.expandText : props.locale?.collapseText;
      if (typeof props.collapseText === 'function') {
        finalCollapseText = props.collapseText(props.isCollapsed);
      }
      const prefix = props.prefixCls;
      return h('div', { class: `${prefix}-collapse-btn` }, [
        props.isCollapsed
          ? h(Tooltip, { content: finalCollapseText, position: 'right' }, () =>
              h('span', { class: `${prefix}-collapse-wrapper` }, [h(Button, btnProps as any)])
            )
          : h(Button, btnProps as any, () => normalizeNode(finalCollapseText)),
      ]);
    };
  },
});

export default CollapseButton;
