import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { useLocale } from './index';
import type { Locale } from './interface';

export const localeConsumerProps = {
  /** component name whose i18n slice is returned as `localeData` */
  componentName: { type: String as PropType<keyof Locale | string>, default: '' },
  /** React `children` render function: (localeData, localeCode, dateFnsLocale, currency) => VNode */
  children: {
    type: Function as PropType<(localeData: any, localeCode: string, dateFnsLocale: any, currency: string) => any>,
    default: undefined,
  },
};

/**
 * Vue port of React `<LocaleConsumer componentName="...">{(localeData, localeCode, dateFnsLocale, currency) => ...}</LocaleConsumer>`.
 * Use the scoped default slot: `<LocaleConsumer componentName="TimePicker" v-slot="{ localeData, localeCode, dateFnsLocale, currency }">`.
 * The slot also receives the positional args as `args` for a 1:1 mapping of the React render function.
 * Resolution order (same as React): ConfigProvider locale -> LocaleProvider locale -> zh_CN.
 */
const LocaleConsumer = defineComponent({
  name: 'LocaleConsumer',
  props: localeConsumerProps,
  setup(props, { slots }) {
    const result = useLocale(props.componentName);
    return () => {
      const full = result.full.value as any;
      const localeData = full[props.componentName];
      const localeCode = result.localeCode.value;
      const dateFnsLocale = result.dateFnsLocale.value;
      const currency = result.currency.value;
      if (slots.default) {
        return slots.default({ localeData, localeCode, dateFnsLocale, currency, args: [localeData, localeCode, dateFnsLocale, currency] });
      }
      if (typeof props.children === 'function') {
        return props.children(localeData, localeCode, dateFnsLocale, currency);
      }
      return null;
    };
  },
});

export default LocaleConsumer;
