import { defineComponent, h, ref, onMounted, onBeforeUnmount, onUpdated } from 'vue';
import { numbers } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import { IconChevronRightStroked } from '../icons/generated';

const HorizontalScroller = defineComponent({
  name: 'AIChatInputHorizontalScroller',
  props: {
    prefix: { type: String, required: true },
  },
  setup(props, { slots }) {
    const scrollContainerRef = ref<HTMLDivElement | null>(null);
    const canScrollLeft = ref(false);
    const canScrollRight = ref(false);
    let resizeObserver: ResizeObserver | null = null;

    const checkScrollAbility = () => {
      const container = scrollContainerRef.value;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      canScrollLeft.value = scrollLeft > 1;
      canScrollRight.value = Math.ceil(scrollLeft) < scrollWidth - clientWidth;
    };

    const handleScroll = (scrollAmount: number) => {
      scrollContainerRef.value?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    onMounted(() => {
      const container = scrollContainerRef.value;
      if (!container) return;
      checkScrollAbility();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(checkScrollAbility);
        resizeObserver.observe(container);
      }
      container.addEventListener('scroll', checkScrollAbility);
    });
    onBeforeUnmount(() => {
      resizeObserver?.disconnect();
      scrollContainerRef.value?.removeEventListener('scroll', checkScrollAbility);
    });
    onUpdated(() => checkScrollAbility());

    return () =>
      h('div', { class: `${props.prefix}-scroll-wrapper` }, [
        canScrollLeft.value
          ? h(
              'button',
              {
                class: `${props.prefix}-scroll-button ${props.prefix}-scroll-button-left`,
                onClick: () => handleScroll(-numbers.SCROLL_AMOUNT),
                'aria-label': 'Scroll left',
                type: 'button',
              },
              [h(IconChevronRightStroked, { class: `${props.prefix}-scroll-button-left-icon` })]
            )
          : null,
        h('div', { class: `${props.prefix}-scroll-container`, ref: scrollContainerRef }, slots.default?.()),
        canScrollRight.value
          ? h(
              'button',
              {
                class: `${props.prefix}-scroll-button ${props.prefix}-scroll-button-right`,
                onClick: () => handleScroll(numbers.SCROLL_AMOUNT),
                'aria-label': 'Scroll right',
                type: 'button',
              },
              [h(IconChevronRightStroked)]
            )
          : null,
      ]);
  },
});

export default HorizontalScroller;
