import { defineComponent, h, onMounted, ref } from 'vue';
import cls from 'classnames';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';

/**
 * The gradient spinner used by Spin / loading Buttons.
 */
export default defineComponent({
  name: 'SpinIcon',
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    customIconCls: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    const gradientId = ref(props.id ? `linearGradient-${props.id}` : 'linearGradient-semi-spin');
    onMounted(() => {
      if (!props.id) {
        gradientId.value = `linearGradient-${getUuidShort({ prefix: 'semi-spin-gradient' })}`;
      }
    });
    return () =>
      h(
        'svg',
        {
          ...attrs,
          class: cls(props.className, props.customIconCls, attrs.class as any),
          width: '48',
          height: '48',
          viewBox: '0 0 36 36',
          version: '1.1',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          'data-icon': 'spin',
        },
        [
          h('defs', null, [
            h('linearGradient', { x1: '0%', y1: '100%', x2: '100%', y2: '100%', id: gradientId.value }, [
              h('stop', { 'stop-color': 'currentColor', 'stop-opacity': '0', offset: '0%' }),
              h('stop', { 'stop-color': 'currentColor', 'stop-opacity': '0.50', offset: '39.9430698%' }),
              h('stop', { 'stop-color': 'currentColor', offset: '100%' }),
            ]),
          ]),
          h('g', { stroke: 'none', 'stroke-width': '1', fill: 'none', 'fill-rule': 'evenodd' }, [
            h('rect', { 'fill-opacity': '0.01', fill: 'none', x: '0', y: '0', width: '36', height: '36' }),
            h('path', {
              d: 'M34,18 C34,9.163444 26.836556,2 18,2 C11.6597233,2 6.18078805,5.68784135 3.59122325,11.0354951',
              stroke: `url(#${gradientId.value})`,
              'stroke-width': '4',
              'stroke-linecap': 'round',
            }),
          ]),
        ]
      );
  },
});
