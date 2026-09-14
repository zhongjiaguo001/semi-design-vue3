import { inject, provide, reactive, computed } from 'vue';
import type { InjectionKey } from 'vue';
import type { Locale } from '../locale/interface';

export interface ScreensBreakpoints {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
}
export type BreakpointKey = keyof ScreensBreakpoints;

export interface ContextValue {
  direction?: 'ltr' | 'rtl';
  timeZone?: string | number;
  locale?: Locale;
  getPopupContainer?: () => HTMLElement;
  responsiveMap?: Record<string, string>;
  screens?: ScreensBreakpoints;
  onBreakpoint?: ((cb: (screens: ScreensBreakpoints) => void) => () => void) &
    ((breakpoints: BreakpointKey[], cb: (screen: BreakpointKey, match: boolean) => void) => () => void);
  /** class names that carry theme css variables (attached to portals as well) */
  themeClassName?: string;
  /** whether the current theme uses the dark algorithm */
  themeDark?: boolean;
  [key: string]: any;
}

export const ConfigContextKey: InjectionKey<ContextValue> = Symbol('SemiConfigContext');

const EMPTY: ContextValue = reactive({});

export function useConfigContext(): ContextValue {
  return inject(ConfigContextKey, EMPTY);
}

export function provideConfigContext(value: ContextValue) {
  provide(ConfigContextKey, value);
}

export function useDirection() {
  const ctx = useConfigContext();
  return computed(() => ctx.direction || 'ltr');
}
