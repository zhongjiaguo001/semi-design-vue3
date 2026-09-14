/**
 * Small color toolkit + the Ant Design palette algorithm
 * (a re-implementation of @ant-design/colors `generate`).
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface HSV {
  h: number;
  s: number;
  v: number;
}

const NAMED: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  transparent: 'rgba(0,0,0,0)',
};

export function parseColor(input: string): RGB | null {
  if (!input || typeof input !== 'string') return null;
  let str = input.trim().toLowerCase();
  if (NAMED[str]) str = NAMED[str];
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length !== 6 && hex.length !== 8) return null;
    const num = parseInt(hex.slice(0, 6), 16);
    if (Number.isNaN(num)) return null;
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a };
  }
  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (rgbMatch) {
    let a = 1;
    if (rgbMatch[4] !== undefined) {
      a = rgbMatch[4].endsWith('%') ? parseFloat(rgbMatch[4]) / 100 : parseFloat(rgbMatch[4]);
    }
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3], a };
  }
  const hslMatch = str.match(/^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (hslMatch) {
    const h = +hslMatch[1];
    const s = +hslMatch[2] / 100;
    const l = +hslMatch[3] / 100;
    let a = 1;
    if (hslMatch[4] !== undefined) {
      a = hslMatch[4].endsWith('%') ? parseFloat(hslMatch[4]) / 100 : parseFloat(hslMatch[4]);
    }
    const { r, g, b } = hslToRgb(h, s, l);
    return { r, g, b, a };
  }
  return null;
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): HSV {
  const rr = r / 255,
    gg = g / 255,
    bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hsvToRgb({ h, s, v }: HSV): { r: number; g: number; b: number } {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

const toHex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export function toHex({ r, g, b, a }: { r: number; g: number; b: number; a?: number }): string {
  const base = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  if (a !== undefined && a < 1) return `${base}${toHex2(a * 255)}`;
  return base;
}

export function toRgbString({ r, g, b, a }: RGB): string {
  return a === undefined || a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

/** "r,g,b" triplet used by Semi palette variables (--semi-blue-5: 0,100,250) */
export function toTriplet(color: string): string {
  const c = parseColor(color);
  if (!c) return '0,0,0';
  return `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`;
}

export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color);
  if (!c) return color;
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${alpha})`;
}

/** mix(color1, color2, amount) – tinycolor semantics: amount% of color2 over color1 */
export function mix(color1: string, color2: string, amount: number): string {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  if (!c1 || !c2) return color2;
  const p = amount / 100;
  return toHex({
    r: (c2.r - c1.r) * p + c1.r,
    g: (c2.g - c1.g) * p + c1.g,
    b: (c2.b - c1.b) * p + c1.b,
    a: (c2.a - c1.a) * p + c1.a,
  });
}

export function lighten(color: string, amount: number) {
  return mix(color, '#ffffff', amount);
}
export function darken(color: string, amount: number) {
  return mix(color, '#000000', amount);
}

export function isDarkColor(color: string): boolean {
  const c = parseColor(color);
  if (!c) return false;
  // relative luminance (YIQ)
  return (c.r * 299 + c.g * 587 + c.b * 114) / 1000 < 128;
}

/* -------------------------------------------------------------- */
/* Ant Design palette algorithm                                    */
/* -------------------------------------------------------------- */

const hueStep = 2;
const saturationStep = 0.16;
const saturationStep2 = 0.05;
const brightnessStep1 = 0.05;
const brightnessStep2 = 0.15;
const lightColorCount = 5;
const darkColorCount = 4;

const darkColorMap = [
  { index: 7, amount: 15 },
  { index: 6, amount: 25 },
  { index: 5, amount: 30 },
  { index: 5, amount: 45 },
  { index: 5, amount: 65 },
  { index: 5, amount: 85 },
  { index: 4, amount: 90 },
  { index: 3, amount: 95 },
  { index: 2, amount: 97 },
  { index: 1, amount: 98 },
];

function getHue(hsv: HSV, i: number, light?: boolean) {
  let hue: number;
  if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
    hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
  } else {
    hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
  }
  if (hue < 0) hue += 360;
  else if (hue >= 360) hue -= 360;
  return hue;
}

function getSaturation(hsv: HSV, i: number, light?: boolean) {
  if (hsv.h === 0 && hsv.s === 0) return hsv.s;
  let saturation: number;
  if (light) saturation = hsv.s - saturationStep * i;
  else if (i === darkColorCount) saturation = hsv.s + saturationStep;
  else saturation = hsv.s + saturationStep2 * i;
  if (saturation > 1) saturation = 1;
  if (light && i === lightColorCount && saturation > 0.1) saturation = 0.1;
  if (saturation < 0.06) saturation = 0.06;
  return Number(saturation.toFixed(2));
}

function getValue(hsv: HSV, i: number, light?: boolean) {
  let value: number;
  if (light) value = hsv.v + brightnessStep1 * i;
  else value = hsv.v - brightnessStep2 * i;
  if (value > 1) value = 1;
  return Number(value.toFixed(2));
}

export interface GenerateOptions {
  theme?: 'dark' | 'default';
  backgroundColor?: string;
}

/**
 * Generate a 10 color palette (index 5 is the input color) from a seed color.
 */
export function generate(color: string, opts: GenerateOptions = {}): string[] {
  const patterns: string[] = [];
  const rgb = parseColor(color) || { r: 0, g: 100, b: 250, a: 1 };
  const hsv = rgbToHsv(rgb);
  for (let i = lightColorCount; i > 0; i -= 1) {
    const c = hsvToRgb({ h: getHue(hsv, i, true), s: getSaturation(hsv, i, true), v: getValue(hsv, i, true) });
    patterns.push(toHex(c));
  }
  patterns.push(toHex(rgb));
  for (let i = 1; i <= darkColorCount; i += 1) {
    const c = hsvToRgb({ h: getHue(hsv, i), s: getSaturation(hsv, i), v: getValue(hsv, i) });
    patterns.push(toHex(c));
  }
  if (opts.theme === 'dark') {
    return darkColorMap.map(({ index, amount }) => mix(opts.backgroundColor || '#141414', patterns[index], amount));
  }
  return patterns;
}
