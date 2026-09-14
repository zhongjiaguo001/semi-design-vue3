import { defineComponent, h } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/aiChatInput/constants';
import Button from '../../button/Button';
import getConfigureItem from './getConfigureItem';

const ConfigureButtonInner = defineComponent({
  name: 'AIChatInputConfigureButtonInner',
  inheritAttrs: false,
  props: {
    value: { type: [Boolean, String, Number, Object] as any, default: undefined },
    onChange: { type: Function, default: undefined },
    onClick: { type: Function, default: undefined },
    className: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { class: attrClass, ...rest } = attrs as any;
      return h(
        Button,
        {
          class: cls(`${cssClasses.PREFIX}-footer-configure-button`, props.className, attrClass, {
            [`${cssClasses.PREFIX}-footer-configure-button-active`]: Boolean(props.value),
          }),
          theme: 'outline',
          type: 'tertiary',
          ...rest,
          onClick: () => {
            const newValue = !props.value;
            props.onChange?.(newValue);
            props.onClick?.(newValue);
          },
        },
        slots
      );
    };
  },
});

export default getConfigureItem(ConfigureButtonInner);
