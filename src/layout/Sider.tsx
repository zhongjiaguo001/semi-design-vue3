import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/layout/constants';
import '@douyinfe/semi-foundation/lib/es/layout/layout.css';
import { getDataAttr, registerMediaQuery } from '../_utils';
import { useConfigContext } from '../configProvider/context';
import { useLayoutContext } from './context';

export type LayoutBreakpoint = (typeof strings.BREAKPOINT)[number];

const responsiveMap: Record<string, string> = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1600px)',
};

const generateId = (() => {
  let i = 0;
  return () => {
    i += 1;
    return `${cssClasses.PREFIX}-sider-${i}`;
  };
})();

export const siderProps = {
  prefixCls: { type: String, default: cssClasses.PREFIX },
  breakpoint: { type: Array as PropType<LayoutBreakpoint[]>, default: undefined },
  ariaLabel: { type: String, default: undefined },
  role: { type: String, default: undefined },
};

const Sider = defineComponent({
  name: 'Sider',
  inheritAttrs: false,
  props: siderProps,
  emits: ['breakpoint'],
  setup(props, { slots, attrs, emit }) {
    const context = useLayoutContext();
    const configContext = useConfigContext();
    const uniqueId = generateId();
    let unRegisters: Array<() => void> = [];

    const responsiveHandler = (screen: string, matches: boolean) => {
      emit('breakpoint', screen, matches);
    };

    onMounted(() => {
      const { breakpoint } = props;
      const map = { ...responsiveMap, ...(configContext.responsiveMap || {}) };
      const matchBpt = Object.keys(map).filter((item) => breakpoint && breakpoint.indexOf(item as LayoutBreakpoint) !== -1);
      unRegisters = matchBpt.map((screen) =>
        registerMediaQuery(map[screen], {
          match: () => responsiveHandler(screen, true),
          unmatch: () => responsiveHandler(screen, false),
        })
      );
      if (context.siderHook) {
        context.siderHook.addSider(uniqueId);
      }
    });
    onBeforeUnmount(() => {
      unRegisters.forEach((unRegister) => unRegister());
      unRegisters = [];
      if (context.siderHook) {
        context.siderHook.removeSider(uniqueId);
      }
    });

    return () => {
      const { prefixCls } = props;
      const { class: className, style, 'aria-label': ariaLabelAttr, role, ...others } = attrs as any;
      const classString = cls(className, { [`${prefixCls}-sider`]: true });
      return h(
        'aside',
        {
          class: classString,
          'aria-label': props.ariaLabel ?? ariaLabelAttr,
          role: props.role ?? role,
          style,
          ...getDataAttr(others),
        },
        [h('div', { class: `${prefixCls}-sider-children` }, slots.default?.())]
      );
    };
  },
});
(Sider as any).elementType = 'Layout.Sider';

export default Sider;
