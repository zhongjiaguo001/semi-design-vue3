import { defineComponent, h } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/carousel/constants';
import { getDataAttr } from '../_utils';

export type CarouselIndicatorType = (typeof strings.TYPE_MAP)[number];
export type CarouselIndicatorPosition = (typeof strings.POSITION_MAP)[number];
export type CarouselIndicatorSize = (typeof strings.SIZE)[number];
export type CarouselTheme = (typeof strings.THEME_MAP)[number];
export type CarouselTrigger = (typeof strings.TRIGGER)[number];

export const carouselIndicatorProps = {
  activeIndex: { type: Number, default: 0 },
  className: { type: String, default: undefined },
  position: { type: String as PropType<CarouselIndicatorPosition>, default: 'center' },
  size: { type: String as PropType<CarouselIndicatorSize>, default: 'small' },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  theme: { type: String as PropType<CarouselTheme>, default: 'light' },
  total: { type: Number, default: 0 },
  type: { type: String as PropType<CarouselIndicatorType>, default: 'dot' },
  trigger: { type: String as PropType<CarouselTrigger>, default: 'click' },
};

const CarouselIndicator = defineComponent({
  name: 'CarouselIndicator',
  inheritAttrs: false,
  props: carouselIndicatorProps,
  emits: ['indicatorChange'],
  setup(props, { attrs, emit }) {
    const onIndicatorChange = (activeIndex: number) => emit('indicatorChange', activeIndex);
    const handleIndicatorClick = (activeIndex: number) => {
      if (props.trigger === 'click') onIndicatorChange(activeIndex);
    };
    const handleIndicatorHover = (activeIndex: number) => {
      if (props.trigger === 'hover') onIndicatorChange(activeIndex);
    };

    const renderIndicatorContent = () => {
      const { total, theme, size, activeIndex } = props;
      const content = [];
      for (let i = 0; i < total; i++) {
        content.push(
          h('span', {
            key: i,
            'data-index': i,
            class: cls([`${cssClasses.CAROUSEL_INDICATOR}-item`], {
              [`${cssClasses.CAROUSEL_INDICATOR}-item-active`]: i === activeIndex,
              [`${cssClasses.CAROUSEL_INDICATOR}-item-${theme}`]: theme,
              [`${cssClasses.CAROUSEL_INDICATOR}-item-${size}`]: size,
            }),
            onClick: () => handleIndicatorClick(i),
            onMouseenter: () => handleIndicatorHover(i),
          })
        );
      }
      return content;
    };

    return () => {
      const { type, className, position, style } = props;
      const classNames = cls(className, attrs.class as any, {
        [cssClasses.CAROUSEL_INDICATOR]: true,
        [`${cssClasses.CAROUSEL_INDICATOR}-${type}`]: type,
        [`${cssClasses.CAROUSEL_INDICATOR}-${position}`]: position,
      });
      return h('div', { class: classNames, style: [style, attrs.style as any], ...getDataAttr(attrs as any) }, renderIndicatorContent());
    };
  },
});

export default CarouselIndicator;
