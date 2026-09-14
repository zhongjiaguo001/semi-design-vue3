import { defineComponent, reactive, watch, onBeforeUnmount, computed, h, toRef } from 'vue';
import type { PropType } from 'vue';
import { BASE_CLASS_PREFIX } from '@douyinfe/semi-foundation/lib/es/base/constants';
import warning from '@douyinfe/semi-foundation/lib/es/utils/warning';
import DefaultLocale from '../locale/source/zh_CN';
import type { Locale } from '../locale/interface';
import { provideConfigContext, useConfigContext, type ContextValue, type ScreensBreakpoints, type BreakpointKey } from './context';
import { registerMediaQuery } from '../_utils';
import { useThemeProvider } from '../theme/provider';
import type { ThemeConfig } from '../theme/interface';

export const defaultResponsiveMap = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1600px)',
};

export const configProviderProps = {
  locale: { type: Object as PropType<Locale>, default: undefined },
  timeZone: { type: [String, Number] as PropType<string | number>, default: undefined },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
  responsiveMap: { type: Object as PropType<Record<string, string>>, default: undefined },
  responsiveObserve: { type: Boolean, default: undefined },
  /** Ant-Design style theme config: { token, algorithm, components } */
  theme: { type: Object as PropType<ThemeConfig>, default: undefined },
};

const ConfigProvider = defineComponent({
  name: 'ConfigProvider',
  props: configProviderProps,
  setup(props, { slots }) {
    const parent = useConfigContext();

    const screens = reactive<ScreensBreakpoints>({ xs: false, sm: false, md: false, lg: false, xl: false, xxl: false });
    let unRegisters: Array<() => void> = [];
    let hasRegistered = false;
    let hasWarned = false;
    let currentScreensRef: ScreensBreakpoints | null = null;
    const screensListeners = new Set<(s: ScreensBreakpoints) => void>();
    const changeListeners = new Set<{ breakpoints?: BreakpointKey[]; callback: (s: BreakpointKey, m: boolean) => void }>();

    const getResponsiveMap = () => props.responsiveMap || parent.responsiveMap || defaultResponsiveMap;

    const notifyListeners = (changedScreen?: BreakpointKey, match?: boolean) => {
      screensListeners.forEach((listener) => listener({ ...screens }));
      if (changedScreen != null && match != null) {
        changeListeners.forEach(({ breakpoints, callback }) => {
          if (!breakpoints || breakpoints.includes(changedScreen)) callback(changedScreen, match);
        });
      }
    };

    const updateScreen = (screen: BreakpointKey, matches: boolean) => {
      if (currentScreensRef && currentScreensRef[screen] !== matches) {
        currentScreensRef = { ...currentScreensRef, [screen]: matches };
      }
      if (screens[screen] !== matches) {
        screens[screen] = matches;
        notifyListeners(screen, matches);
      }
    };

    const registerMediaQueries = () => {
      if (hasRegistered) return;
      const responsiveMap = getResponsiveMap();
      const keys = Object.keys(responsiveMap) as BreakpointKey[];
      const initial: ScreensBreakpoints = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        keys.forEach((k) => {
          initial[k] = window.matchMedia(responsiveMap[k]).matches;
        });
      }
      currentScreensRef = initial;
      unRegisters = keys.map((screen) =>
        registerMediaQuery(responsiveMap[screen], {
          match: () => updateScreen(screen, true),
          unmatch: () => updateScreen(screen, false),
          callInInit: false,
        })
      );
      hasRegistered = true;
      Object.assign(screens, initial);
    };

    const unregisterMediaQueries = () => {
      unRegisters.forEach((fn) => fn());
      unRegisters = [];
      hasRegistered = false;
      currentScreensRef = null;
    };

    const ensureRegistered = () => {
      if (!props.responsiveObserve) {
        if (!hasWarned) {
          hasWarned = true;
          warning(
            true,
            '[Semi] ConfigProvider responsive observing is disabled by default. Set <ConfigProvider responsiveObserve> to enable breakpoint subscriptions.'
          );
        }
        return;
      }
      if (screensListeners.size === 0 && changeListeners.size === 0) return;
      registerMediaQueries();
    };

    const maybeUnregister = () => {
      if (props.responsiveObserve && screensListeners.size === 0 && changeListeners.size === 0) {
        unregisterMediaQueries();
      }
    };

    const onBreakpoint: any = (arg1: any, arg2?: any) => {
      if (typeof arg1 === 'function') {
        const cb = arg1;
        screensListeners.add(cb);
        ensureRegistered();
        cb({ ...(currentScreensRef ?? screens) });
        return () => {
          screensListeners.delete(cb);
          maybeUnregister();
        };
      }
      const breakpoints = Array.isArray(arg1) ? (arg1 as BreakpointKey[]) : undefined;
      const cb = arg2;
      const entry = { breakpoints, callback: cb };
      changeListeners.add(entry);
      ensureRegistered();
      const initialScreens = currentScreensRef ?? screens;
      if (breakpoints && typeof cb === 'function') {
        breakpoints.forEach((bp) => cb(bp, initialScreens[bp]));
      }
      return () => {
        changeListeners.delete(entry);
        maybeUnregister();
      };
    };

    watch(
      () => props.responsiveObserve,
      (val, prev) => {
        if (prev && !val) unregisterMediaQueries();
        if (!prev && val) ensureRegistered();
      }
    );
    watch(
      () => props.responsiveMap,
      () => {
        if (hasRegistered) {
          unregisterMediaQueries();
          registerMediaQueries();
        }
      }
    );
    onBeforeUnmount(() => {
      unregisterMediaQueries();
      screensListeners.clear();
      changeListeners.clear();
    });

    // ---- theme (Ant Design style) ----
    const theme = useThemeProvider(toRef(props, 'theme'));

    const context = reactive<ContextValue>({}) as ContextValue;
    // keep the context in sync with props + parent context
    watch(
      [
        () => props.locale,
        () => props.timeZone,
        () => props.getPopupContainer,
        () => props.direction,
        () => props.responsiveMap,
        () => ({ ...parent }),
        () => theme.className.value,
        () => theme.isDark.value,
      ],
      () => {
        const next: ContextValue = {
          ...parent,
          locale: props.locale ?? parent.locale ?? (DefaultLocale as unknown as Locale),
          timeZone: props.timeZone ?? parent.timeZone,
          getPopupContainer: props.getPopupContainer ?? parent.getPopupContainer,
          direction: props.direction ?? parent.direction ?? 'ltr',
          responsiveMap: getResponsiveMap(),
          onBreakpoint,
          screens,
          themeClassName: [parent.themeClassName, theme.className.value].filter(Boolean).join(' ') || undefined,
          themeDark: theme.isDark.value,
        };
        for (const key of Object.keys(context)) {
          if (!(key in next)) delete (context as any)[key];
        }
        Object.assign(context, next);
      },
      { immediate: true }
    );

    provideConfigContext(context);

    const wrapperClass = computed(() => {
      const cls: string[] = [];
      if (context.direction === 'rtl') cls.push(`${BASE_CLASS_PREFIX}-rtl`);
      if (theme.className.value) cls.push(theme.className.value);
      if (theme.isDark.value) cls.push(`${BASE_CLASS_PREFIX}-always-dark`);
      return cls;
    });

    return () => {
      const children = slots.default?.();
      if (wrapperClass.value.length === 0) {
        return Array.isArray(children) && children.length === 1 ? children[0] : children;
      }
      // `display: contents` keeps layout untouched while still letting css variables cascade
      return h(
        'div',
        {
          class: wrapperClass.value,
          style: context.direction === 'rtl' ? undefined : { display: 'contents' },
        },
        children
      );
    };
  },
});

/** static property for parity with React `ConfigProvider.defaultResponsiveMap` */
(ConfigProvider as any).defaultResponsiveMap = defaultResponsiveMap;

export default ConfigProvider;
