import { defineComponent, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { PropType, CSSProperties } from 'vue';

export interface AnimationSlotProps {
  animationClassName: string;
  animationStyle: CSSProperties;
  animationEventsNeedBind: Record<string, (e?: any) => void>;
  isAnimating: boolean;
}

/**
 * Vue port of semi-ui `_cssAnimation`.
 * Renders the default scoped slot with the current animation class / style / events.
 * When `motion` is false it behaves like a zero-duration animation so the
 * consuming component's lifecycle does not need to special-case "no animation".
 */
export default defineComponent({
  name: 'CSSAnimation',
  props: {
    motion: { type: Boolean, default: true },
    startClassName: { type: String, default: undefined },
    endClassName: { type: String, default: undefined },
    replayKey: { type: [String, Number], default: '' },
    fillMode: { type: String as PropType<CSSProperties['animationFillMode']>, default: undefined },
    animationState: { type: String, default: undefined },
    onAnimationStart: { type: Function as PropType<() => void>, default: undefined },
    onAnimationEnd: { type: Function as PropType<(isAnimating: boolean) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const state = reactive({
      currentClassName: props.startClassName,
      extraStyle: { animationFillMode: props.fillMode } as CSSProperties,
      isAnimating: true,
    });

    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    const clearSafety = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };
    const handleAnimationStart = () => {
      props.onAnimationStart?.();
    };
    const handleAnimationEnd = () => {
      if (!state.isAnimating) {
        clearSafety();
        return;
      }
      clearSafety();
      state.currentClassName = props.endClassName;
      state.extraStyle = { animationFillMode: props.fillMode };
      state.isAnimating = false;
      nextTick(() => props.onAnimationEnd?.(false));
    };
    const armSafety = () => {
      clearSafety();
      if (!props.motion) return;
      // If animationend never fires (missing keyframes, display:none, reduced motion),
      // still finish so popovers can emit afterClose / flush controlled values.
      safetyTimer = setTimeout(handleAnimationEnd, 400);
    };

    onMounted(() => {
      props.onAnimationStart?.();
      if (!props.motion) {
        props.onAnimationEnd?.(false);
        state.isAnimating = false;
      } else {
        armSafety();
      }
    });
    onBeforeUnmount(clearSafety);

    watch(
      () => [props.startClassName, props.replayKey, props.motion],
      () => {
        state.currentClassName = props.startClassName;
        state.extraStyle = { animationFillMode: props.fillMode };
        state.isAnimating = true;
        nextTick(() => {
          props.onAnimationStart?.();
          if (!props.motion) {
            props.onAnimationEnd?.(state.isAnimating);
            state.isAnimating = false;
          } else {
            armSafety();
          }
        });
      }
    );

    return () => {
      const slotProps: AnimationSlotProps = props.motion
        ? {
            animationClassName: state.currentClassName ?? '',
            animationStyle: state.extraStyle,
            animationEventsNeedBind: {
              onAnimationstart: handleAnimationStart,
              onAnimationend: handleAnimationEnd,
            },
            isAnimating: state.isAnimating,
          }
        : {
            animationClassName: '',
            animationStyle: {},
            animationEventsNeedBind: {},
            isAnimating: state.isAnimating,
          };
      return slots.default?.(slotProps);
    };
  },
});
