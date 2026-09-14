import { defineComponent, h, watch, onMounted, onBeforeUnmount, cloneVNode } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _debounce from 'lodash/debounce';
import isNullOrUndefined from '@douyinfe/semi-foundation/lib/es/utils/isNullOrUndefined';
import CarouselFoundation from '@douyinfe/semi-foundation/lib/es/carousel/foundation';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/carousel/constants';
import '@douyinfe/semi-foundation/lib/es/carousel/carousel.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { flattenChildren, getDataAttr } from '../_utils';
import CarouselIndicator from './CarouselIndicator';
import type { CarouselIndicatorPosition, CarouselIndicatorSize, CarouselIndicatorType, CarouselTheme, CarouselTrigger } from './CarouselIndicator';
import CarouselArrow from './CarouselArrow';
import type { CarouselArrowProps, CarouselArrowType } from './CarouselArrow';

export type CarouselAnimation = (typeof strings.ANIMATION_MAP)[number];
export type CarouselSlideDirection = (typeof strings.DIRECTION)[number];
export interface CarouselAutoPlayObject {
  interval?: number;
  hoverToPause?: boolean;
}

export const carouselProps = {
  activeIndex: { type: Number, default: undefined },
  modelValue: { type: Number, default: undefined },
  animation: { type: String as PropType<CarouselAnimation>, default: 'slide' },
  arrowProps: { type: Object as PropType<CarouselArrowProps>, default: undefined },
  autoPlay: { type: [Boolean, Object] as PropType<boolean | CarouselAutoPlayObject>, default: true },
  defaultActiveIndex: { type: Number, default: numbers.DEFAULT_ACTIVE_INDEX },
  indicatorPosition: { type: String as PropType<CarouselIndicatorPosition>, default: 'center' },
  indicatorSize: { type: String as PropType<CarouselIndicatorSize>, default: 'small' },
  indicatorType: { type: String as PropType<CarouselIndicatorType>, default: 'dot' },
  theme: { type: String as PropType<CarouselTheme>, default: 'light' },
  arrowType: { type: String as PropType<CarouselArrowType>, default: 'always' },
  showArrow: { type: Boolean, default: true },
  showIndicator: { type: Boolean, default: true },
  slideDirection: { type: String as PropType<CarouselSlideDirection>, default: 'left' },
  speed: { type: Number, default: numbers.DEFAULT_SPEED },
  trigger: { type: String as PropType<CarouselTrigger>, default: 'click' },
};

export const carouselEmits = ['change', 'update:activeIndex', 'update:modelValue'];

interface CarouselState {
  activeIndex: number;
  preIndex: number;
  isReverse: boolean;
  isInit: boolean;
}

const Carousel = defineComponent({
  name: 'Carousel',
  inheritAttrs: false,
  props: carouselProps,
  emits: carouselEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, CarouselState>(
      props as any,
      { activeIndex: 0, preIndex: 0, isReverse: false, isInit: true },
      { modelProp: 'activeIndex' }
    );

    let currentChildren: any[] = [];
    const getChildren = () => {
      // the render function refreshes this list; before the first render read the slot directly
      if (!currentChildren.length && slots.default) {
        currentChildren = flattenChildren(slots.default());
      }
      return currentChildren;
    };

    const adapter = {
      ...baseAdapter,
      notifyChange: (activeIndex: number, preIndex: number) => {
        emit('update:activeIndex', activeIndex);
        emit('update:modelValue', activeIndex);
        emit('change', activeIndex, preIndex);
      },
      setNewActiveIndex: (activeIndex: number) => {
        state.activeIndex = activeIndex;
      },
      setPreActiveIndex: (preIndex: number) => {
        state.preIndex = preIndex;
      },
      setIsReverse: (isReverse: boolean) => {
        state.isReverse = isReverse;
      },
      setIsInit: (isInit: boolean) => {
        state.isInit = isInit;
      },
      getChildren,
    };
    const foundation = new (CarouselFoundation as any)(adapter);
    const defaultActiveIndex = foundation.getDefaultActiveIndex();
    state.activeIndex = defaultActiveIndex ?? 0;
    state.preIndex = defaultActiveIndex ?? 0;

    const getActiveIndexProp = () => ('activeIndex' in propsView ? (propsView as any).activeIndex : undefined);

    // getDerivedStateFromProps
    watch(
      () => [props.activeIndex, props.modelValue],
      () => {
        const v = getActiveIndexProp();
        if (!isNullOrUndefined(v) && v !== state.activeIndex) {
          state.activeIndex = v;
        }
      }
    );

    const play = () => {
      foundation.setForcePlay(true);
      return foundation.handleAutoPlay();
    };
    const stop = () => {
      foundation.setForcePlay(false);
      return foundation.stop();
    };
    const goTo = (targetIndex: number) => foundation.goTo(targetIndex);
    const prev = () => foundation.prev();
    const next = () => foundation.next();

    const handleAutoPlay = () => {
      if (!foundation.getIsControlledComponent()) {
        foundation.handleAutoPlay();
      }
    };
    const handleMouseEnter = () => {
      const autoPlay = props.autoPlay as boolean | CarouselAutoPlayObject;
      if (autoPlay === true || (typeof autoPlay === 'object' && autoPlay && autoPlay.hoverToPause)) {
        foundation.stop();
      }
    };
    const handleMouseLeave = () => {
      const autoPlay = props.autoPlay as boolean | CarouselAutoPlayObject;
      if ((typeof autoPlay !== 'object' || (autoPlay && autoPlay.hoverToPause)) && !foundation.getIsControlledComponent()) {
        foundation.handleAutoPlay();
      }
    };
    const debouncedMouseEnter = _debounce(handleMouseEnter, 400);
    const debouncedMouseLeave = _debounce(handleMouseLeave, 400);
    const onIndicatorChange = (activeIndex: number) => foundation.onIndicatorChange(activeIndex);
    const getValidIndex = (activeIndex: number) => foundation.getValidIndex(activeIndex);

    onMounted(() => {
      handleAutoPlay();
    });
    onBeforeUnmount(() => {
      debouncedMouseEnter.cancel();
      debouncedMouseLeave.cancel();
      foundation.destroy();
    });

    expose({ play, stop, goTo, prev, next, foundation });

    const renderChildren = (children: any[]) => {
      const { speed, animation } = props;
      const { activeIndex, preIndex, isInit } = state;
      return children.map((child, index) => {
        const isCurrent = index === activeIndex;
        const isPrev = index === getValidIndex(activeIndex - 1);
        const isNext = index === getValidIndex(activeIndex + 1);
        const animateStyle: CSSProperties = {
          transitionTimingFunction: 'ease',
          transitionDuration: `${speed}ms`,
          animationTimingFunction: 'ease',
          animationDuration: `${speed}ms`,
        };
        return cloneVNode(
          child,
          {
            style: animateStyle,
            class: cls({
              [`${cssClasses.CAROUSEL_CONTENT}-item-prev`]: isPrev,
              [`${cssClasses.CAROUSEL_CONTENT}-item-next`]: isNext,
              [`${cssClasses.CAROUSEL_CONTENT}-item-current`]: isCurrent,
              [`${cssClasses.CAROUSEL_CONTENT}-item`]: true,
              [`${cssClasses.CAROUSEL_CONTENT}-item-active`]: isCurrent,
              [`${cssClasses.CAROUSEL_CONTENT}-item-slide-in`]: animation === 'slide' && !isInit && isCurrent,
              [`${cssClasses.CAROUSEL_CONTENT}-item-slide-out`]: animation === 'slide' && !isInit && index === preIndex,
            }),
          },
          true
        );
      });
    };

    const renderIndicator = (children: any[]) => {
      const { activeIndex } = state;
      const { showIndicator, indicatorType, theme, indicatorPosition, indicatorSize, trigger } = props;
      if (showIndicator && children.length > 1) {
        return h('div', { class: cls(cssClasses.CAROUSEL_INDICATOR) }, [
          h(CarouselIndicator, {
            type: indicatorType,
            total: children.length,
            activeIndex,
            position: indicatorPosition,
            trigger,
            size: indicatorSize,
            theme,
            onIndicatorChange,
          }),
        ]);
      }
      return null;
    };

    const renderArrow = (children: any[]) => {
      const { showArrow, arrowType, theme, arrowProps } = props;
      if (showArrow && children.length > 1) {
        return h(CarouselArrow, { type: arrowType, theme, prev, next, arrowProps }, { leftArrow: slots.leftArrow, rightArrow: slots.rightArrow });
      }
      return null;
    };

    return () => {
      const { animation, slideDirection } = props;
      const { isReverse } = state;
      currentChildren = flattenChildren(slots.default?.());
      const children = currentChildren;
      const { class: className, style, ...rest } = attrs as any;
      const carouselWrapperCls = cls(className, { [cssClasses.CAROUSEL]: true });
      return h(
        'div',
        {
          class: carouselWrapperCls,
          style,
          onMouseenter: debouncedMouseEnter,
          onMouseleave: debouncedMouseLeave,
          ...getDataAttr(rest),
        },
        [
          h(
            'div',
            {
              class: cls([`${cssClasses.CAROUSEL_CONTENT}-${animation}`], {
                [cssClasses.CAROUSEL_CONTENT]: true,
                [`${cssClasses.CAROUSEL_CONTENT}-reverse`]: slideDirection === 'left' ? isReverse : !isReverse,
              }),
              'x-semi-prop': 'children',
            },
            renderChildren(children)
          ),
          renderIndicator(children),
          renderArrow(children),
        ]
      );
    };
  },
});
(Carousel as any).elementType = 'Carousel';

export default Carousel;
