import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { isEqual } from 'lodash';
import LottieFoundation from '@douyinfe/semi-foundation/lib/es/lottie/foundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/lottie/constants';
import { useBaseComponent } from '../_base/useBaseComponent';
import { getDataAttr } from '../_utils';

export const lottieProps = {
  width: { type: String, default: undefined },
  height: { type: String, default: undefined },
  /** Passed to lottie-web `lottie.loadAnimation` (merged over container/renderer/loop/autoplay defaults). */
  params: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  /** Called with the current AnimationItem on mount and whenever params change. */
  getAnimationInstance: { type: Function as PropType<(instance: any) => void>, default: undefined },
  /** Called with the global lottie-web package on mount. */
  getLottie: { type: Function as PropType<(pkg: any) => void>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: [Object, String] as PropType<CSSProperties | string>, default: undefined },
};

const Lottie = defineComponent({
  name: 'Lottie',
  inheritAttrs: false,
  props: lottieProps,
  // Vue-style mirrors of the React callback props: `@get-animation-instance` / `@get-lottie`
  emits: ['getAnimationInstance', 'getLottie'],
  setup(props, { attrs, expose, emit }) {
    const container = ref<HTMLElement | null>(null);
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const getContainer = () => props.params?.container ?? container.value;
    const adapter = {
      ...baseAdapter,
      getContainer,
      getLoadParams: () => ({
        container: getContainer(),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        ...(props.params || {}),
      }),
    };
    const foundation = new (LottieFoundation as any)(adapter);

    onMounted(() => {
      try {
        // foundation.init() loads the animation and invokes the getAnimationInstance / getLottie props
        foundation.init();
      } catch {
        /* empty / invalid animation data is allowed */
      }
      emit('getAnimationInstance', foundation.animation);
      emit('getLottie', (LottieFoundation as any).getLottie());
    });
    onBeforeUnmount(() => {
      try {
        foundation.destroy();
      } catch {
        /* ignore */
      }
    });
    watch(
      () => props.params,
      (next, prev) => {
        if (!isEqual(next, prev)) {
          try {
            foundation.handleParamsUpdate();
          } catch {
            /* ignore */
          }
          emit('getAnimationInstance', foundation.animation);
        }
      },
      { deep: true }
    );

    expose({
      foundation,
      getAnimationInstance: () => foundation.animation,
      getLottie: () => (LottieFoundation as any).getLottie(),
    });

    return () => {
      if (props.params?.container) return null;
      const { class: attrClass, style: attrStyle, ...rest } = attrs as any;
      return h('div', {
        ref: container,
        class: cls(cssClasses.PREFIX, props.className, attrClass),
        style: [{ width: props.width, height: props.height }, props.style, attrStyle],
        ...getDataAttr(rest),
      });
    };
  },
});

(Lottie as any).getLottie = () => (LottieFoundation as any).getLottie();
(Lottie as any).elementType = 'Lottie';
export default Lottie;
