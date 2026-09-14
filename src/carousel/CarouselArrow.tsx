import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import _get from 'lodash/get';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/carousel/constants';
import { IconChevronLeft, IconChevronRight } from '../icons/generated';
import { normalizeNode } from '../_utils';
import type { CarouselTheme } from './CarouselIndicator';

export type CarouselArrowType = (typeof strings.ARROW_MAP)[number];

export interface CarouselArrowProps {
  leftArrow?: { props?: Record<string, any>; children?: any };
  rightArrow?: { props?: Record<string, any>; children?: any };
}

export const carouselArrowProps = {
  type: { type: String as PropType<CarouselArrowType>, default: 'always' },
  theme: { type: String as PropType<CarouselTheme>, default: 'light' },
  prev: { type: Function as PropType<() => void>, default: undefined },
  next: { type: Function as PropType<() => void>, default: undefined },
  arrowProps: { type: Object as PropType<CarouselArrowProps>, default: undefined },
};

const CarouselArrow = defineComponent({
  name: 'CarouselArrow',
  props: carouselArrowProps,
  setup(props, { slots }) {
    const renderLeftIcon = () => {
      if (slots.leftArrow) return slots.leftArrow();
      const custom = _get(props, 'arrowProps.leftArrow.children');
      return custom !== undefined ? normalizeNode(custom) : h(IconChevronLeft, { 'aria-label': 'Previous index', size: 'inherit' });
    };
    const renderRightIcon = () => {
      if (slots.rightArrow) return slots.rightArrow();
      const custom = _get(props, 'arrowProps.rightArrow.children');
      return custom !== undefined ? normalizeNode(custom) : h(IconChevronRight, { 'aria-label': 'Next index', size: 'inherit' });
    };
    return () => {
      const { type, theme, prev, next } = props;
      const classNames = cls({
        [cssClasses.CAROUSEL_ARROW]: true,
        [`${cssClasses.CAROUSEL_ARROW}-${theme}`]: theme,
        [`${cssClasses.CAROUSEL_ARROW}-hover`]: type === 'hover',
      });
      const leftClassNames = cls({
        [`${cssClasses.CAROUSEL_ARROW}-prev`]: true,
        [`${cssClasses.CAROUSEL_ARROW}-${theme}`]: theme,
      });
      const rightClassNames = cls({
        [`${cssClasses.CAROUSEL_ARROW}-next`]: true,
        [`${cssClasses.CAROUSEL_ARROW}-${theme}`]: theme,
      });
      return h('div', { class: classNames }, [
        h(
          'div',
          {
            class: leftClassNames,
            onClick: prev,
            ..._get(props, 'arrowProps.leftArrow.props'),
            'x-semi-prop': 'arrowProps.leftArrow.children',
          },
          [renderLeftIcon()]
        ),
        h(
          'div',
          {
            class: rightClassNames,
            onClick: next,
            ..._get(props, 'arrowProps.rightArrow.props'),
            'x-semi-prop': 'arrowProps.rightArrow.children',
          },
          [renderRightIcon()]
        ),
      ]);
    };
  },
});

export default CarouselArrow;
