import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import _throttle from 'lodash/throttle';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/backtop/constants';
import BackTopFoundation from '@douyinfe/semi-foundation/lib/es/backtop/foundation';
import '@douyinfe/semi-foundation/lib/es/backtop/backtop.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { IconButton } from '../button/Button';
import { IconChevronUp } from '../icons/generated';

const prefixCls = cssClasses.PREFIX;
const getDefaultTarget = () => window;

export const backTopProps = {
  target: { type: Function as PropType<() => any>, default: getDefaultTarget },
  visibilityHeight: { type: Number, default: 400 },
  duration: { type: Number, default: 450 },
};

export const backTopEmits = ['click'];

const BackTop = defineComponent({
  name: 'BackTop',
  inheritAttrs: false,
  props: backTopProps,
  emits: backTopEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { visible: false });
    const adapter = {
      ...baseAdapter,
      updateVisible: (visible: boolean) => {
        state.visible = visible;
      },
      notifyClick: (e: any) => emit('click', e),
      targetIsWindow: (target: any) => target === window,
      isWindowUndefined: () => typeof window === 'undefined',
      targetScrollToTop: (targetNode: any, scrollTop: number) => {
        if (targetNode === window) {
          document.body.scrollTop = scrollTop;
          document.documentElement.scrollTop = scrollTop;
        } else {
          targetNode.scrollTop = scrollTop;
        }
      },
    };
    const foundation = new (BackTopFoundation as any)(adapter);
    let handler: any = null;

    const handleClick = (e: MouseEvent) => foundation.onClick(e);

    onMounted(() => {
      foundation.init();
      handler = _throttle(handleClick, props.duration ?? 450);
    });
    onBeforeUnmount(() => {
      foundation.destroy();
      handler && handler.cancel && handler.cancel();
    });

    expose({ foundation, scrollToTop: (e?: any) => foundation.onClick(e) });

    const renderDefault = () => h(IconButton, { theme: 'light', icon: h(IconChevronUp) });

    return () => {
      const { visible } = state;
      const { class: className, style, ...others } = attrs as any;
      const preCls = cls(prefixCls, className);
      const backtopBtn = slots.default ? slots.default() : renderDefault();
      return visible
        ? h('div', { ...others, class: preCls, style, onClick: (e: MouseEvent) => (handler ? handler(e) : handleClick(e)), 'x-semi-prop': 'children' }, [backtopBtn])
        : null;
    };
  },
});
(BackTop as any).elementType = 'BackTop';

export default BackTop;
