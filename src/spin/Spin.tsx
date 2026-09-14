import { defineComponent, h, watch, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import SpinFoundation from '@douyinfe/semi-foundation/lib/es/spin/foundation';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/spin/constants';
import '@douyinfe/semi-foundation/lib/es/spin/spin.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr, normalizeNode } from '../_utils';
import SpinIcon from './icon';

const prefixCls = cssClasses.PREFIX;

export type SpinSize = (typeof strings.SIZE)[number];

export const spinProps = {
  size: { type: String as PropType<SpinSize>, default: 'middle' },
  spinning: { type: Boolean, default: true },
  indicator: { type: [Object, Function] as PropType<any>, default: undefined },
  delay: { type: Number, default: 0 },
  tip: { type: [String, Object, Function] as PropType<any>, default: undefined },
  wrapperClassName: { type: String, default: undefined },
  childStyle: { type: Object as PropType<CSSProperties>, default: undefined },
};

const Spin = defineComponent({
  name: 'Spin',
  inheritAttrs: false,
  props: spinProps,
  setup(props, { slots, attrs }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      delay: props.delay,
      // with a delay the spinner is hidden first and revealed once the delay elapsed
      loading: props.delay ? false : props.spinning,
    });
    const adapter = {
      ...baseAdapter,
      setLoading: (value: boolean) => {
        state.loading = value;
      },
    };
    const foundation = new (SpinFoundation as any)(adapter);

    // getDerivedStateFromProps
    const derive = () => {
      if (!props.delay) {
        state.loading = props.spinning;
        return;
      }
      if (props.spinning === false) {
        // a pending delay timer must not re-enable loading after spinning was turned off
        foundation.destroy();
        state.delay = 0;
        state.loading = false;
        return;
      }
      state.delay = props.delay;
    };
    derive();
    watch(() => [props.spinning, props.delay], derive);

    onBeforeUnmount(() => foundation.destroy());

    const renderSpin = () => {
      const indicator = slots.indicator ? slots.indicator() : normalizeNode(props.indicator);
      const tip = slots.tip ? slots.tip() : normalizeNode(props.tip);
      if (!state.loading) return null;
      return h('div', { class: `${prefixCls}-wrapper` }, [
        indicator ? h('div', { class: `${prefixCls}-animate`, 'x-semi-prop': 'indicator' }, [indicator]) : h(SpinIcon),
        tip ? h('div', { 'x-semi-prop': 'tip' }, [tip]) : null,
      ]);
    };

    let timerArmed = false;
    watch(
      () => state.delay,
      (d) => {
        if (!d) timerArmed = false;
      }
    );
    return () => {
      if (state.delay && !timerArmed) {
        timerArmed = true;
        foundation.updateLoadingIfNeedDelay();
      }
      const children = slots.default?.();
      const hasChildren = Boolean(children && children.length);
      const spinCls = cls(prefixCls, props.wrapperClassName, attrs.class as any, {
        [`${prefixCls}-${props.size}`]: props.size,
        [`${prefixCls}-block`]: hasChildren,
        [`${prefixCls}-hidden`]: !state.loading,
      });
      return h('div', { class: spinCls, style: attrs.style as any, ...getDataAttr(attrs) }, [
        renderSpin(),
        h('div', { class: `${prefixCls}-children`, style: props.childStyle, 'x-semi-prop': 'children' }, children),
      ]);
    };
  },
});

export { SpinIcon };
export default Spin;
