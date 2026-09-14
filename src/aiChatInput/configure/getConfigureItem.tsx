import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import cls from 'classnames';
import get from 'lodash/get';
import { useConfigure } from './context';

export interface ConfigureItemOpts {
  valueKey?: string;
  onKeyChangeFnName?: string;
  valuePath?: string;
  className?: string;
  defaultProps?: Record<string, any>;
}

export default function getConfigureItem(Component: any, opts: ConfigureItemOpts = {}) {
  return defineComponent({
    name: `Configure${(Component as any).name || 'Item'}`,
    inheritAttrs: false,
    props: {
      field: { type: String, default: undefined },
      initValue: { type: [String, Number, Boolean, Object, Array] as PropType<any>, default: undefined },
      onChange: { type: Function as PropType<(value: any) => void>, default: undefined },
      className: { type: String, default: undefined },
    },
    setup(props, { attrs, slots }) {
      const ctx = useConfigure();
      onMounted(() => {
        if (props.initValue !== undefined) ctx.onChange({ [props.field]: props.initValue }, true);
      });
      onBeforeUnmount(() => ctx.onRemove(props.field));

      return () => {
        const {
          valueKey = 'value',
          onKeyChangeFnName = 'onChange',
          valuePath,
          className: optsCls,
          defaultProps = {},
        } = opts;
        const onItemChange = (value: any) => {
          const valueResult = valuePath ? get(value, valuePath) : value;
          ctx.onChange({ [props.field]: valueResult });
          props.onChange?.(valueResult);
        };
        return h(
          Component,
          {
            class: cls({ [props.className as string]: props.className, [optsCls as string]: optsCls }),
            ...defaultProps,
            ...attrs,
            [valueKey]: ctx.value?.[props.field],
            [onKeyChangeFnName]: onItemChange,
          },
          slots
        );
      };
    },
  });
}
