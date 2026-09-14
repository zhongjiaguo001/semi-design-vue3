import { defineComponent, h } from 'vue';

export const TriangleArrow = defineComponent({
  name: 'TriangleArrow',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h(
        'svg',
        {
          'aria-hidden': 'true',
          ...attrs,
          width: '24',
          height: '7',
          viewBox: '0 0 24 7',
          fill: 'currentColor',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        [h('path', { d: 'M24 0V1C20 1 18.5 2 16.5 4C14.5 6 14 7 12 7C10 7 9.5 6 7.5 4C5.5 2 4 1 0 1V0H24Z' })]
      );
  },
});

export const TriangleArrowVertical = defineComponent({
  name: 'TriangleArrowVertical',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h(
        'svg',
        {
          'aria-hidden': 'true',
          ...attrs,
          width: '7',
          height: '24',
          xmlns: 'http://www.w3.org/2000/svg',
          fill: 'currentColor',
        },
        [h('path', { d: 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z' })]
      );
  },
});
