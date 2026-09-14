import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import classnames from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/dropdown/constants';
import Foundation from '@douyinfe/semi-foundation/lib/es/dropdown/menuFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useDropdownContext } from './context';

const prefixCls = cssClasses.PREFIX;

export const dropdownMenuProps = {
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
};

const DropdownMenu = defineComponent({
  name: 'DropdownMenu',
  inheritAttrs: false,
  props: dropdownMenuProps,
  setup(props, { slots, attrs }) {
    const context = useDropdownContext();
    const { adapter } = useBaseComponent(props as any, {}, { contexts: () => ({ ...context }) });
    const foundation = new (Foundation as any)(adapter);
    return () => {
      const { className, style } = props;
      const { class: attrClass, style: _s, ...rest } = attrs as any;
      return h(
        'ul',
        {
          role: 'menu',
          'aria-orientation': 'vertical',
          ...rest,
          class: classnames(`${prefixCls}-menu`, className, attrClass),
          style,
          onKeydown: (e: KeyboardEvent) => foundation.onMenuKeydown(e),
        },
        slots.default?.()
      );
    };
  },
});

(DropdownMenu as any).elementType = 'Dropdown.Menu';

export default DropdownMenu;
