import { defaultAlgorithm, darkAlgorithm, compactAlgorithm, getDesignToken, defaultSeedToken } from './algorithm';
import { useToken, useThemeProvider, ThemeContextKey, getInjectedThemeStyles } from './provider';
import { generateThemeCss, tokenToCssVars, componentClassMap } from './cssVars';
import { generate } from './colors';

/**
 * antd-like `theme` namespace:
 *   import { theme } from 'semi-design-vue'
 *   theme.darkAlgorithm / theme.useToken() / theme.getDesignToken()
 */
export const theme = {
  defaultAlgorithm,
  darkAlgorithm,
  compactAlgorithm,
  getDesignToken,
  useToken,
  defaultSeed: defaultSeedToken,
  generate,
};

export {
  defaultAlgorithm,
  darkAlgorithm,
  compactAlgorithm,
  getDesignToken,
  defaultSeedToken,
  useToken,
  useThemeProvider,
  ThemeContextKey,
  generateThemeCss,
  tokenToCssVars,
  componentClassMap,
  getInjectedThemeStyles,
  generate,
};
export * from './interface';
export * from './colors';
