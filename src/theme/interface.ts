/**
 * Ant-Design style theme types.
 *
 * Usage mirrors antd:
 *   <ConfigProvider :theme="{ token: { colorPrimary: '#00b96b' }, algorithm: theme.darkAlgorithm, components: { Button: { colorPrimary: '#f00' } } }">
 */

export interface SeedToken {
  // ---- colors ----
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  /** link color, defaults to colorPrimary */
  colorLink?: string;
  colorTextBase: string;
  colorBgBase: string;
  // ---- font ----
  fontFamily: string;
  fontSize: number;
  // ---- radius ----
  borderRadius: number;
  // ---- size ----
  controlHeight: number;
  lineWidth: number;
  // ---- motion ----
  motion: boolean;
  /** hue step / saturation etc. are fixed by the palette algorithm */
}

export interface ColorPaletteToken {
  colorPrimaryBg: string;
  colorPrimaryBgHover: string;
  colorPrimaryBorder: string;
  colorPrimaryBorderHover: string;
  colorPrimaryHover: string;
  colorPrimaryActive: string;
  colorPrimaryText: string;
  colorPrimaryTextHover: string;
  colorPrimaryTextActive: string;

  colorSuccessBg: string;
  colorSuccessBgHover: string;
  colorSuccessBorder: string;
  colorSuccessBorderHover: string;
  colorSuccessHover: string;
  colorSuccessActive: string;

  colorWarningBg: string;
  colorWarningBgHover: string;
  colorWarningBorder: string;
  colorWarningBorderHover: string;
  colorWarningHover: string;
  colorWarningActive: string;

  colorErrorBg: string;
  colorErrorBgHover: string;
  colorErrorBorder: string;
  colorErrorBorderHover: string;
  colorErrorHover: string;
  colorErrorActive: string;

  colorInfoBg: string;
  colorInfoBgHover: string;
  colorInfoBorder: string;
  colorInfoBorderHover: string;
  colorInfoHover: string;
  colorInfoActive: string;

  colorLinkHover: string;
  colorLinkActive: string;
}

export interface NeutralToken {
  colorText: string;
  colorTextSecondary: string;
  colorTextTertiary: string;
  colorTextQuaternary: string;
  colorTextDisabled: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorBgLayout: string;
  colorBgSpotlight: string;
  colorBgMask: string;
  colorBorder: string;
  colorBorderSecondary: string;
  colorFill: string;
  colorFillSecondary: string;
  colorFillTertiary: string;
  colorFillQuaternary: string;
  colorBgContainerDisabled: string;
  colorWhite: string;
  colorBlack: string;
}

export interface SizeToken {
  borderRadiusXS: number;
  borderRadiusSM: number;
  borderRadiusLG: number;
  controlHeightSM: number;
  controlHeightLG: number;
  fontSizeSM: number;
  fontSizeLG: number;
  lineHeight: number;
}

export interface MapToken extends SeedToken, ColorPaletteToken, NeutralToken, SizeToken {
  /** 10-step palettes generated from the seeds (index 5 = seed) */
  palettes: Record<'primary' | 'success' | 'warning' | 'error' | 'info', string[]>;
  /** whether tokens were derived with the dark algorithm */
  isDark: boolean;
}

export type GlobalToken = MapToken;

export type MappingAlgorithm = (seedToken: SeedToken, mapToken?: MapToken) => MapToken;

export type ComponentTokenMap = Record<string, Partial<SeedToken & ColorPaletteToken & NeutralToken & SizeToken> & Record<string, any>>;

export interface ThemeConfig {
  token?: Partial<SeedToken> & Partial<ColorPaletteToken> & Partial<NeutralToken> & Partial<SizeToken>;
  algorithm?: MappingAlgorithm | MappingAlgorithm[];
  components?: ComponentTokenMap;
  /** inherit tokens from the parent ConfigProvider (default: true) */
  inherit?: boolean;
  /** custom class name prefix for the generated theme scope class */
  hashed?: boolean;
  /**
   * Where the generated css variables live:
   *  - 'scope' (default): a `.semi-theme-<hash>` class applied to a wrapper + portals
   *  - 'body': appended to <body> so the whole page (including popups) is themed
   */
  target?: 'scope' | 'body';
}
