import Carousel, { carouselProps, carouselEmits } from './Carousel';
import CarouselIndicator, { carouselIndicatorProps } from './CarouselIndicator';
import CarouselArrow, { carouselArrowProps } from './CarouselArrow';

export { Carousel, CarouselIndicator, CarouselArrow, carouselProps, carouselEmits, carouselIndicatorProps, carouselArrowProps };
export type { CarouselAnimation, CarouselSlideDirection, CarouselAutoPlayObject } from './Carousel';
export type { CarouselIndicatorType, CarouselIndicatorPosition, CarouselIndicatorSize, CarouselTheme, CarouselTrigger } from './CarouselIndicator';
export type { CarouselArrowType, CarouselArrowProps } from './CarouselArrow';
export default Carousel;
