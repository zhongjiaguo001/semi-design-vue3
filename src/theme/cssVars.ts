import type { MapToken, ComponentTokenMap, ThemeConfig } from './interface';
import { toTriplet, withAlpha, parseColor } from './colors';
import { getDesignToken } from './algorithm';

/**
 * Root css class of every component, used to scope `components` tokens
 * (antd `components: { Button: {...} }` => `.semi-theme-x .semi-button { ... }`).
 */
export const componentClassMap: Record<string, string> = {
  Anchor: 'semi-anchor',
  AutoComplete: 'semi-autocomplete',
  Avatar: 'semi-avatar',
  BackTop: 'semi-backtop',
  Badge: 'semi-badge',
  Banner: 'semi-banner',
  Breadcrumb: 'semi-breadcrumb',
  Button: 'semi-button',
  Calendar: 'semi-calendar',
  Card: 'semi-card',
  Carousel: 'semi-carousel',
  Cascader: 'semi-cascader',
  Checkbox: 'semi-checkbox',
  Collapse: 'semi-collapse',
  Collapsible: 'semi-collapsible',
  DatePicker: 'semi-datepicker',
  Descriptions: 'semi-descriptions',
  Divider: 'semi-divider',
  Dropdown: 'semi-dropdown',
  Empty: 'semi-empty',
  Form: 'semi-form',
  Input: 'semi-input-wrapper',
  InputNumber: 'semi-input-number',
  Layout: 'semi-layout',
  List: 'semi-list',
  Modal: 'semi-modal',
  Navigation: 'semi-navigation',
  Notification: 'semi-notification-notice',
  Pagination: 'semi-page',
  Popconfirm: 'semi-popconfirm',
  Popover: 'semi-popover',
  Progress: 'semi-progress',
  Radio: 'semi-radio',
  Rating: 'semi-rating',
  Select: 'semi-select',
  SideSheet: 'semi-sidesheet',
  Skeleton: 'semi-skeleton',
  Slider: 'semi-slider',
  Space: 'semi-space',
  Spin: 'semi-spin',
  Steps: 'semi-steps',
  Switch: 'semi-switch',
  Table: 'semi-table',
  Tabs: 'semi-tabs',
  Tag: 'semi-tag',
  TagInput: 'semi-tagInput',
  TextArea: 'semi-input-textarea-wrapper',
  Timeline: 'semi-timeline',
  TimePicker: 'semi-timepicker',
  Toast: 'semi-toast',
  Tooltip: 'semi-tooltip',
  Transfer: 'semi-transfer',
  Tree: 'semi-tree',
  TreeSelect: 'semi-tree-select',
  Typography: 'semi-typography',
  Upload: 'semi-upload',
};

const paletteNames = {
  primary: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
} as const;

const semanticGroups: Array<{ semi: string; token: 'Primary' | 'Success' | 'Warning' | 'Error' | 'Info'; palette: 'primary' | 'success' | 'warning' | 'error' | 'info' }> = [
  { semi: 'primary', token: 'Primary', palette: 'primary' },
  { semi: 'success', token: 'Success', palette: 'success' },
  { semi: 'warning', token: 'Warning', palette: 'warning' },
  { semi: 'danger', token: 'Error', palette: 'error' },
  { semi: 'info', token: 'Info', palette: 'info' },
];

/**
 * Map the (antd-style) design token onto Semi Design css variables.
 * Only variables affected by tokens are emitted so untouched styles keep the
 * values from the default theme.
 */
export function tokenToCssVars(token: MapToken, partial?: Record<string, any>): Record<string, string> {
  const vars: Record<string, string> = {};
  const has = (key: string) => !partial || partial[key] !== undefined || partial.__all;

  // palette triplets (used directly by some component styles, e.g. var(--semi-blue-6))
  (Object.keys(paletteNames) as Array<keyof typeof paletteNames>).forEach((key) => {
    const seedKey = key === 'error' ? 'colorError' : `color${key[0].toUpperCase()}${key.slice(1)}`;
    if (!has(seedKey) && !has('algorithm')) return;
    const palette = token.palettes?.[key];
    if (!palette) return;
    palette.forEach((color, i) => {
      vars[`--semi-${paletteNames[key]}-${i}`] = toTriplet(color);
    });
  });

  // semantic colors
  semanticGroups.forEach(({ semi, token: t, palette }) => {
    const seedKey = `color${t}`;
    if (!has(seedKey) && !has('algorithm')) return;
    const p = token.palettes?.[palette];
    if (!p) return;
    vars[`--semi-color-${semi}`] = (token as any)[`color${t}`] || p[5];
    vars[`--semi-color-${semi}-hover`] = (token as any)[`color${t}Hover`] || p[6];
    vars[`--semi-color-${semi}-active`] = (token as any)[`color${t}Active`] || p[7];
    if (semi !== 'warning' && semi !== 'danger') {
      vars[`--semi-color-${semi}-disabled`] = p[2];
    }
    vars[`--semi-color-${semi}-light-default`] = (token as any)[`color${t}Bg`] || p[0];
    vars[`--semi-color-${semi}-light-hover`] = (token as any)[`color${t}BgHover`] || p[1];
    vars[`--semi-color-${semi}-light-active`] = (token as any)[`color${t}Border`] || p[2];
  });

  if (has('colorPrimary') || has('algorithm')) {
    vars['--semi-color-focus-border'] = token.colorPrimary;
  }
  if (has('colorLink') || has('colorPrimary') || has('algorithm')) {
    vars['--semi-color-link'] = token.colorLink || token.colorPrimary;
    vars['--semi-color-link-hover'] = token.colorLinkHover || token.colorPrimaryHover;
    vars['--semi-color-link-active'] = token.colorLinkActive || token.colorPrimaryActive;
    vars['--semi-color-link-visited'] = token.colorLink || token.colorPrimary;
  }

  // neutrals
  if (has('colorTextBase') || has('algorithm')) {
    const text = token.colorTextBase;
    vars['--semi-color-text-0'] = token.colorText || withAlpha(text, 1);
    vars['--semi-color-text-1'] = token.colorTextSecondary || withAlpha(text, 0.8);
    vars['--semi-color-text-2'] = token.colorTextTertiary || withAlpha(text, 0.62);
    vars['--semi-color-text-3'] = token.colorTextQuaternary || withAlpha(text, 0.35);
    vars['--semi-color-disabled-text'] = token.colorTextDisabled || withAlpha(text, 0.35);
    vars['--semi-color-border'] = token.colorBorder;
    vars['--semi-color-fill-0'] = token.colorFillTertiary;
    vars['--semi-color-fill-1'] = token.colorFillSecondary;
    vars['--semi-color-fill-2'] = token.colorFill;
    vars['--semi-color-disabled-fill'] = token.colorFillQuaternary;
    vars['--semi-color-tertiary'] = withAlpha(text, 0.62);
    vars['--semi-color-tertiary-hover'] = withAlpha(text, 0.72);
    vars['--semi-color-tertiary-active'] = withAlpha(text, 0.82);
    vars['--semi-color-tertiary-light-default'] = withAlpha(text, 0.05);
    vars['--semi-color-tertiary-light-hover'] = withAlpha(text, 0.09);
    vars['--semi-color-tertiary-light-active'] = withAlpha(text, 0.13);
  } else {
    ['colorText', 'colorTextSecondary', 'colorTextTertiary', 'colorTextQuaternary', 'colorTextDisabled', 'colorBorder', 'colorFill', 'colorFillSecondary', 'colorFillTertiary'].forEach((k) => {
      if (!has(k)) return;
      const map: Record<string, string> = {
        colorText: '--semi-color-text-0',
        colorTextSecondary: '--semi-color-text-1',
        colorTextTertiary: '--semi-color-text-2',
        colorTextQuaternary: '--semi-color-text-3',
        colorTextDisabled: '--semi-color-disabled-text',
        colorBorder: '--semi-color-border',
        colorFill: '--semi-color-fill-2',
        colorFillSecondary: '--semi-color-fill-1',
        colorFillTertiary: '--semi-color-fill-0',
      };
      vars[map[k]] = (token as any)[k];
    });
  }
  if (has('colorBgBase') || has('algorithm')) {
    const bg = token.colorBgBase;
    vars['--semi-color-bg-0'] = token.isDark ? bg : bg;
    vars['--semi-color-bg-1'] = token.colorBgContainer;
    vars['--semi-color-bg-2'] = token.isDark ? token.colorBgElevated : bg;
    vars['--semi-color-bg-3'] = token.isDark ? token.colorBgSpotlight : bg;
    vars['--semi-color-bg-4'] = token.isDark ? token.colorBgSpotlight : bg;
    vars['--semi-color-nav-bg'] = token.colorBgContainer;
    vars['--semi-color-disabled-bg'] = token.colorBgContainerDisabled;
    vars['--semi-color-disabled-border'] = token.colorBgContainerDisabled;
    vars['--semi-color-default'] = token.colorFillQuaternary;
    vars['--semi-color-default-hover'] = token.colorFillTertiary;
    vars['--semi-color-default-active'] = token.colorFillSecondary;
    vars['--semi-color-overlay-bg'] = token.colorBgMask;
    if (token.isDark) {
      vars['--semi-color-white'] = 'rgba(255, 255, 255, 1)';
      vars['--semi-color-black'] = 'rgba(0, 0, 0, 1)';
      vars['--semi-white'] = '255,255,255';
      vars['--semi-black'] = '0,0,0';
      vars['--semi-shadow-elevated'] = 'inset 0 0 0 1px rgba(255, 255, 255, .1), 0 4px 14px rgba(0, 0, 0, .25)';
    }
  } else {
    if (has('colorBgContainer')) {
      vars['--semi-color-bg-1'] = token.colorBgContainer;
      vars['--semi-color-bg-2'] = token.colorBgContainer;
    }
    if (has('colorBgElevated')) {
      vars['--semi-color-bg-3'] = token.colorBgElevated;
      vars['--semi-color-bg-4'] = token.colorBgElevated;
    }
    if (has('colorBgMask')) vars['--semi-color-overlay-bg'] = token.colorBgMask;
  }

  // radius
  if (has('borderRadius') || has('borderRadiusXS') || has('borderRadiusSM') || has('borderRadiusLG')) {
    vars['--semi-border-radius-extra-small'] = `${token.borderRadiusXS}px`;
    vars['--semi-border-radius-small'] = `${token.borderRadiusSM ?? token.borderRadius}px`;
    vars['--semi-border-radius-medium'] = `${Math.round(token.borderRadius * 2)}px`;
    vars['--semi-border-radius-large'] = `${Math.round(token.borderRadius * 4)}px`;
  }

  // font
  if (has('fontFamily')) vars['--semi-font-family'] = token.fontFamily;
  if (has('fontSize') || has('algorithm')) {
    vars['--semi-font-size-small'] = `${token.fontSizeSM}px`;
    vars['--semi-font-size-regular'] = `${token.fontSize}px`;
    vars['--semi-font-size-large'] = `${token.fontSizeLG}px`;
  }
  if (has('controlHeight') || has('algorithm')) {
    vars['--semi-height-control-small'] = `${token.controlHeightSM}px`;
    vars['--semi-height-control-default'] = `${token.controlHeight}px`;
    vars['--semi-height-control-large'] = `${token.controlHeightLG}px`;
  }
  if (has('motion')) {
    const duration = token.motion ? undefined : '0ms';
    if (duration) {
      ['slowest', 'slower', 'slow', 'normal', 'fast', 'faster', 'fastest'].forEach((k) => {
        vars[`--semi-transition_duration-${k}`] = duration;
      });
    }
  }
  return vars;
}

/**
 * Extra rules that cannot be expressed as Semi css variables because the
 * corresponding values are compiled constants in Semi's scss (font size,
 * control heights). They are emitted only when those tokens are customised.
 */
export function tokenToExtraRules(scope: string, token: MapToken, partial?: Record<string, any>): string {
  const has = (key: string) => !partial || partial[key] !== undefined || partial.__all;
  const rules: string[] = [];
  const sel = (cls: string) => (scope ? `${scope} ${cls}` : cls);
  if (has('fontFamily')) {
    rules.push(`${scope || 'body'}{font-family:${token.fontFamily};}`);
  }
  if (has('fontSize')) {
    const fs = token.fontSize;
    rules.push(
      `${sel('.semi-button')},${sel('.semi-input')},${sel('.semi-input-textarea')},${sel('.semi-select-selection')},${sel('.semi-input-number')},${sel('.semi-typography')},${sel('.semi-checkbox-addon')},${sel('.semi-radio-addon')},${sel('.semi-tabs-tab')},${sel('.semi-table')}{font-size:${fs}px;}`
    );
    rules.push(`${sel('.semi-button-size-small')},${sel('.semi-input-small')},${sel('.semi-tag')}{font-size:${token.fontSizeSM}px;}`);
    rules.push(`${sel('.semi-button-size-large')},${sel('.semi-input-large')}{font-size:${token.fontSizeLG}px;}`);
  }
  if (has('controlHeight')) {
    const h = token.controlHeight;
    const hs = token.controlHeightSM;
    const hl = token.controlHeightLG;
    rules.push(
      `${sel('.semi-button')},${sel('.semi-input-wrapper')},${sel('.semi-input')},${sel('.semi-select')},${sel('.semi-input-number')},${sel('.semi-tagInput')},${sel('.semi-cascader')},${sel('.semi-tree-select')},${sel('.semi-datepicker .semi-input-wrapper')}{height:${h}px;min-height:${h}px;line-height:${h - 2}px;}`
    );
    rules.push(
      `${sel('.semi-button-size-small')},${sel('.semi-input-wrapper-small')},${sel('.semi-input-small')},${sel('.semi-select-small')},${sel('.semi-input-number-small')}{height:${hs}px;min-height:${hs}px;line-height:${hs - 2}px;}`
    );
    rules.push(
      `${sel('.semi-button-size-large')},${sel('.semi-input-wrapper-large')},${sel('.semi-input-large')},${sel('.semi-select-large')},${sel('.semi-input-number-large')}{height:${hl}px;min-height:${hl}px;line-height:${hl - 2}px;}`
    );
  }
  return rules.join('\n');
}

function varsToCss(vars: Record<string, string>) {
  return Object.keys(vars)
    .map((k) => `${k}:${vars[k]};`)
    .join('');
}

export interface GeneratedTheme {
  hash: string;
  className: string;
  css: string;
  token: MapToken;
  isDark: boolean;
}

function hashString(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/**
 * Turn a ThemeConfig into css text + a scope class name.
 */
export function generateThemeCss(config: ThemeConfig, parentToken?: MapToken): GeneratedTheme {
  const token = getDesignToken(config, parentToken);
  const partial: Record<string, any> = { ...(config.token || {}) };
  if (config.algorithm) partial.algorithm = true;
  if (config.inherit === false) partial.__all = true;
  const hash = hashString(
    JSON.stringify({
      token: config.token,
      alg: (Array.isArray(config.algorithm) ? config.algorithm : config.algorithm ? [config.algorithm] : []).map((a) => a.name),
      components: config.components,
      inherit: config.inherit,
      target: config.target,
      parent: parentToken ? parentToken.colorPrimary + parentToken.colorBgBase + parentToken.isDark : '',
    })
  );
  const className = config.target === 'body' ? '' : `semi-theme-${hash}`;
  // `body .semi-always-dark` (0,1,1) in semi-theme-default must not outrank the scope (hence the doubled class)
  const scope = className ? `.${className}.${className}, body .${className}` : 'body, body[theme-mode]';
  const rootVars = tokenToCssVars(token, partial);
  let css = '';
  if (Object.keys(rootVars).length) {
    css += `${scope}{${varsToCss(rootVars)}}\n`;
  }
  css += tokenToExtraRules(className ? `.${className}` : '', token, partial);

  // component level overrides
  const components: ComponentTokenMap = config.components || {};
  for (const name of Object.keys(components)) {
    const compToken = components[name] || {};
    const cls = componentClassMap[name] || `semi-${name.toLowerCase()}`;
    // seeds of the component inherit from the resolved theme token, derived tokens are recomputed
    const merged = getDesignToken({ token: compToken, algorithm: config.algorithm }, token);
    const compVars = tokenToCssVars(merged, { ...compToken });
    // plain custom variables: `--xxx` keys are forwarded as-is
    Object.keys(compToken).forEach((k) => {
      if (k.startsWith('--')) compVars[k] = String(compToken[k]);
    });
    const selector = className ? `.${className} .${cls}` : `.${cls}`;
    const decls: string[] = [];
    if (compToken.fontSize !== undefined) decls.push(`font-size:${merged.fontSize}px;`);
    if (compToken.fontFamily !== undefined) decls.push(`font-family:${merged.fontFamily};`);
    if (compToken.controlHeight !== undefined) decls.push(`height:${merged.controlHeight}px;min-height:${merged.controlHeight}px;`);
    if (Object.keys(compVars).length || decls.length) {
      css += `
${selector}{${varsToCss(compVars)}${decls.join('')}}`;
    }
  }
  return { hash, className, css: css.trim(), token, isDark: !!token.isDark };
}


export { parseColor };
