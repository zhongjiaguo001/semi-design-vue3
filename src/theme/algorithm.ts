import type { SeedToken, MapToken, MappingAlgorithm, ThemeConfig } from './interface';
import { generate, withAlpha, mix, isDarkColor } from './colors';

export const defaultSeedToken: SeedToken = {
  colorPrimary: '#0064fa',
  colorSuccess: '#3bb346',
  colorWarning: '#ff7d1a',
  colorError: '#f93920',
  colorInfo: '#0064fa',
  colorLink: undefined,
  colorTextBase: '#1c1f23',
  colorBgBase: '#ffffff',
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSize: 14,
  borderRadius: 3,
  controlHeight: 32,
  lineWidth: 1,
  motion: true,
};

function paletteTokens(prefix: string, palette: string[]) {
  return {
    [`${prefix}Bg`]: palette[0],
    [`${prefix}BgHover`]: palette[1],
    [`${prefix}Border`]: palette[2],
    [`${prefix}BorderHover`]: palette[3],
    [`${prefix}Hover`]: palette[6],
    [`${prefix}Active`]: palette[7],
    [`${prefix}Text`]: palette[5],
    [`${prefix}TextHover`]: palette[6],
    [`${prefix}TextActive`]: palette[7],
  };
}

function sizeTokens(seed: SeedToken) {
  const r = seed.borderRadius;
  return {
    borderRadiusXS: Math.max(1, Math.round(r / 2)),
    borderRadiusSM: r,
    borderRadiusLG: Math.round(r * 2),
    controlHeightSM: Math.round(seed.controlHeight * 0.75),
    controlHeightLG: Math.round(seed.controlHeight * 1.25),
    fontSizeSM: Math.max(10, seed.fontSize - 2),
    fontSizeLG: seed.fontSize + 2,
    lineHeight: 20 / 14,
  };
}

/**
 * Light theme algorithm: derive every map token from the seeds.
 */
export const defaultAlgorithm: MappingAlgorithm = (seed) => {
  const primary = generate(seed.colorPrimary);
  const success = generate(seed.colorSuccess);
  const warning = generate(seed.colorWarning);
  const error = generate(seed.colorError);
  const info = generate(seed.colorInfo);
  const link = generate(seed.colorLink || seed.colorPrimary);
  const text = seed.colorTextBase;
  const bg = seed.colorBgBase;
  return {
    ...seed,
    ...(paletteTokens('colorPrimary', primary) as any),
    ...(paletteTokens('colorSuccess', success) as any),
    ...(paletteTokens('colorWarning', warning) as any),
    ...(paletteTokens('colorError', error) as any),
    ...(paletteTokens('colorInfo', info) as any),
    colorLink: link[5],
    colorLinkHover: link[6],
    colorLinkActive: link[7],
    colorText: withAlpha(text, 1),
    colorTextSecondary: withAlpha(text, 0.8),
    colorTextTertiary: withAlpha(text, 0.62),
    colorTextQuaternary: withAlpha(text, 0.35),
    colorTextDisabled: withAlpha(text, 0.35),
    colorBgContainer: bg,
    colorBgElevated: bg,
    colorBgLayout: mix(bg, text, 2),
    colorBgSpotlight: withAlpha(text, 0.85),
    colorBgMask: 'rgba(22, 22, 26, 0.6)',
    colorBorder: withAlpha(text, 0.08),
    colorBorderSecondary: withAlpha(text, 0.05),
    colorFill: withAlpha(text, 0.13),
    colorFillSecondary: withAlpha(text, 0.09),
    colorFillTertiary: withAlpha(text, 0.05),
    colorFillQuaternary: withAlpha(text, 0.04),
    colorBgContainerDisabled: mix(bg, text, 6),
    colorWhite: '#ffffff',
    colorBlack: '#000000',
    ...sizeTokens(seed),
    palettes: { primary, success, warning, error, info },
    isDark: false,
  };
};

/**
 * Dark theme algorithm: palettes are blended towards the dark background,
 * neutrals are inverted (same values Semi uses for `theme-mode="dark"`).
 */
export const darkAlgorithm: MappingAlgorithm = (seed) => {
  const bgBase = seed.colorBgBase && !isDarkColor(seed.colorBgBase) ? '#16161a' : seed.colorBgBase || '#16161a';
  const textBase = seed.colorTextBase && isDarkColor(seed.colorTextBase) ? '#f9f9f9' : seed.colorTextBase || '#f9f9f9';
  const gen = (c: string) => generate(c, { theme: 'dark', backgroundColor: bgBase });
  const primary = gen(seed.colorPrimary);
  const success = gen(seed.colorSuccess);
  const warning = gen(seed.colorWarning);
  const error = gen(seed.colorError);
  const info = gen(seed.colorInfo);
  const link = gen(seed.colorLink || seed.colorPrimary);
  return {
    ...seed,
    colorBgBase: bgBase,
    colorTextBase: textBase,
    ...(paletteTokens('colorPrimary', primary) as any),
    ...(paletteTokens('colorSuccess', success) as any),
    ...(paletteTokens('colorWarning', warning) as any),
    ...(paletteTokens('colorError', error) as any),
    ...(paletteTokens('colorInfo', info) as any),
    colorPrimary: primary[5],
    colorSuccess: success[5],
    colorWarning: warning[5],
    colorError: error[5],
    colorInfo: info[5],
    colorLink: link[5],
    colorLinkHover: link[6],
    colorLinkActive: link[7],
    colorText: withAlpha(textBase, 1),
    colorTextSecondary: withAlpha(textBase, 0.8),
    colorTextTertiary: withAlpha(textBase, 0.6),
    colorTextQuaternary: withAlpha(textBase, 0.35),
    colorTextDisabled: withAlpha(textBase, 0.35),
    colorBgContainer: mix(bgBase, '#ffffff', 6),
    colorBgElevated: mix(bgBase, '#ffffff', 14),
    colorBgLayout: bgBase,
    colorBgSpotlight: mix(bgBase, '#ffffff', 26),
    colorBgMask: 'rgba(22, 22, 26, 0.6)',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
    colorFill: 'rgba(255, 255, 255, 0.2)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.16)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.12)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.08)',
    colorBgContainerDisabled: mix(bgBase, '#ffffff', 10),
    colorWhite: '#ffffff',
    colorBlack: '#000000',
    ...sizeTokens(seed),
    palettes: { primary, success, warning, error, info },
    isDark: true,
  };
};

/**
 * Compact algorithm: smaller controls & fonts. Must be combined with default/dark algorithm
 * (like antd: `algorithm: [theme.darkAlgorithm, theme.compactAlgorithm]`).
 */
export const compactAlgorithm: MappingAlgorithm = (seed, map) => {
  const base = map || defaultAlgorithm(seed);
  const compactSeed: SeedToken = {
    ...seed,
    fontSize: Math.max(10, seed.fontSize - 2),
    controlHeight: Math.max(16, Math.round(seed.controlHeight - 8)),
  };
  return {
    ...base,
    fontSize: compactSeed.fontSize,
    controlHeight: compactSeed.controlHeight,
    ...sizeTokens(compactSeed),
    palettes: base.palettes,
    isDark: base.isDark,
  };
};

export function normalizeAlgorithms(algorithm?: MappingAlgorithm | MappingAlgorithm[]): MappingAlgorithm[] {
  if (!algorithm) return [defaultAlgorithm];
  const list = Array.isArray(algorithm) ? algorithm : [algorithm];
  // compact alone: run default first so map tokens exist
  if (list.length && !list.includes(defaultAlgorithm) && !list.includes(darkAlgorithm)) {
    return [defaultAlgorithm, ...list];
  }
  return list;
}

/**
 * Compute the full design token from a theme config (same idea as antd `theme.getDesignToken`).
 */
export function getDesignToken(config: ThemeConfig = {}, parentToken?: MapToken): MapToken {
  const inherit = config.inherit !== false;
  const baseSeed: SeedToken = inherit && parentToken ? pickSeed(parentToken) : defaultSeedToken;
  const seed: SeedToken = { ...baseSeed, ...pickSeed(config.token || {}) };
  const algorithms = normalizeAlgorithms(config.algorithm);
  let map: MapToken | undefined;
  for (const alg of algorithms) {
    map = alg(seed, map);
  }
  // allow overriding any derived token directly
  return { ...(map as MapToken), ...(config.token || {}) } as MapToken;
}

export function pickSeed(obj: Partial<SeedToken> | Record<string, any>): SeedToken {
  const out: any = {};
  for (const key of Object.keys(defaultSeedToken)) {
    if (obj && (obj as any)[key] !== undefined) out[key] = (obj as any)[key];
  }
  return out;
}
