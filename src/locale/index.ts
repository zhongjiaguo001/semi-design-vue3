import { computed, defineComponent, inject, provide } from 'vue';
import type { InjectionKey, PropType, ComputedRef } from 'vue';
import _get from 'lodash/get';
import DefaultLocale from './source/zh_CN';
import { useConfigContext } from '../configProvider/context';
import type { Locale } from './interface';

export const LocaleContextKey: InjectionKey<ComputedRef<Locale | undefined>> = Symbol('SemiLocaleContext');

export const LocaleProvider = defineComponent({
  name: 'LocaleProvider',
  props: {
    locale: { type: Object as PropType<Locale>, default: () => DefaultLocale },
  },
  setup(props, { slots }) {
    provide(
      LocaleContextKey,
      computed(() => props.locale)
    );
    return () => slots.default?.();
  },
});

export interface LocaleResult<T = any> {
  locale: ComputedRef<T>;
  localeCode: ComputedRef<string>;
  dateFnsLocale: ComputedRef<any>;
  currency: ComputedRef<string>;
  /** the whole locale object */
  full: ComputedRef<Locale>;
}

/**
 * Vue counterpart of <LocaleConsumer componentName="...">.
 * Resolution order: ConfigProvider locale -> LocaleProvider locale -> zh_CN.
 */
export function useLocale<T = any>(componentName: keyof Locale | string): LocaleResult<T> {
  const configCtx = useConfigContext();
  const injected = inject(LocaleContextKey, undefined);
  const full = computed<Locale>(() => {
    const fromProvider = injected ? injected.value : undefined;
    let locale: any = configCtx.locale || fromProvider;
    if (!locale || !locale.code) locale = DefaultLocale as unknown as Locale;
    return locale;
  });
  return {
    full,
    locale: computed(() => (full.value as any)[componentName]),
    localeCode: computed(() => full.value.code),
    dateFnsLocale: computed(() => _get(full.value, 'dateFnsLocale', _get(DefaultLocale, 'dateFnsLocale'))),
    currency: computed(() => _get(full.value, 'currency')),
  };
}

export { DefaultLocale };
export type { Locale };
export { default as LocaleConsumer, localeConsumerProps } from './LocaleConsumer';
/** alias of the injection key, mirrors React `LocaleContext` */
export const LocaleContext = LocaleContextKey;
