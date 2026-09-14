import { computed, inject, onBeforeUnmount, provide, watch, ref, shallowRef } from 'vue';
import type { InjectionKey, Ref, ComputedRef } from 'vue';
import type { MapToken, ThemeConfig } from './interface';
import { generateThemeCss, type GeneratedTheme } from './cssVars';
import { getDesignToken, defaultSeedToken } from './algorithm';

export interface ThemeContextValue {
  token: ComputedRef<MapToken>;
  hashId: ComputedRef<string>;
  config: ComputedRef<ThemeConfig | undefined>;
}

export const ThemeContextKey: InjectionKey<ThemeContextValue> = Symbol('SemiThemeContext');

const defaultToken = getDesignToken({});

/* ---------------- style sheet manager ---------------- */
const refCount = new Map<string, number>();

function styleId(hash: string) {
  return `semi-theme-${hash}`;
}

export function injectThemeStyle(theme: GeneratedTheme) {
  if (typeof document === 'undefined' || !theme.css) return;
  const id = styleId(theme.hash);
  const count = refCount.get(id) || 0;
  refCount.set(id, count + 1);
  if (count === 0 && !document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.setAttribute('data-semi-theme', theme.hash);
    style.textContent = theme.css;
    document.head.appendChild(style);
  }
}

export function removeThemeStyle(theme: GeneratedTheme) {
  if (typeof document === 'undefined' || !theme.css) return;
  const id = styleId(theme.hash);
  const count = (refCount.get(id) || 1) - 1;
  if (count <= 0) {
    refCount.delete(id);
    const el = document.getElementById(id);
    el && el.parentNode && el.parentNode.removeChild(el);
  } else {
    refCount.set(id, count);
  }
}

/** for tests / debugging */
export function getInjectedThemeStyles(): HTMLStyleElement[] {
  if (typeof document === 'undefined') return [];
  return Array.from(document.querySelectorAll('style[data-semi-theme]')) as HTMLStyleElement[];
}

/**
 * Used by ConfigProvider: turns the `theme` prop into an injected stylesheet + scope class name,
 * and provides the resulting token to descendants (`useToken`).
 */
export function useThemeProvider(config: Ref<ThemeConfig | undefined>) {
  const parent = inject(ThemeContextKey, undefined);
  const generated = shallowRef<GeneratedTheme | null>(null);

  const compute = () => {
    const cfg = config.value;
    if (!cfg) return null;
    const parentToken = cfg.inherit === false ? undefined : parent?.token.value;
    return generateThemeCss(cfg, parentToken);
  };

  watch(
    () => [config.value, parent?.token.value] as const,
    () => {
      const next = compute();
      const prev = generated.value;
      if (prev && next && prev.hash === next.hash) return;
      if (next) injectThemeStyle(next);
      if (prev) removeThemeStyle(prev);
      generated.value = next;
    },
    { immediate: true, deep: true }
  );

  onBeforeUnmount(() => {
    if (generated.value) removeThemeStyle(generated.value);
    generated.value = null;
  });

  const token = computed<MapToken>(() => generated.value?.token || parent?.token.value || defaultToken);
  const hashId = computed(() => generated.value?.hash || parent?.hashId.value || '');
  const className = computed(() => generated.value?.className || '');
  const isDark = computed(() => Boolean(generated.value ? generated.value.isDark : parent?.token.value?.isDark));

  provide(ThemeContextKey, {
    token,
    hashId,
    config: computed(() => config.value || parent?.config.value),
  });

  return { token, hashId, className, isDark, generated };
}

/**
 * antd-like `theme.useToken()`.
 */
export function useToken() {
  const ctx = inject(ThemeContextKey, undefined);
  const token = computed<MapToken>(() => (ctx ? ctx.token.value : defaultToken));
  const hashId = computed(() => (ctx ? ctx.hashId.value : ''));
  const theme = computed(() => (ctx ? ctx.config.value : undefined));
  return { token, hashId, theme };
}

export { defaultToken, defaultSeedToken };
