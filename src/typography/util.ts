import _omit from 'lodash/omit';

/**
 * JS text truncation (port of semi-ui typography/util.js, itself referenced from antd typography).
 * Measures the text in a hidden shadow container and binary-searches the longest prefix
 * (or prefix + suffix when `ellipsisPos === 'middle'`) that fits into `rows` lines.
 */
let ellipsisContainer: HTMLDivElement | undefined;

function pxToNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/^\d*(\.\d*)?/);
  return match ? Number(match[0]) : 0;
}

function styleToString(style: CSSStyleDeclaration): string {
  const styleNames: string[] = Array.prototype.slice.apply(style);
  return styleNames.map((name) => `${name}: ${style.getPropertyValue(name)};`).join('');
}

export interface FixedContent {
  expand?: HTMLElement | null;
  copy?: HTMLElement | null;
}

/** Whether the element has been laid out (jsdom / display:none containers have no layout) */
export function hasLayout(el: HTMLElement | null | undefined): boolean {
  if (!el) return false;
  if (el.offsetWidth || el.offsetHeight) return true;
  if (typeof el.getBoundingClientRect === 'function') {
    const rect = el.getBoundingClientRect();
    return Boolean(rect && (rect.width || rect.height));
  }
  return false;
}

const getRenderText = (
  originEle: HTMLElement,
  rows: number,
  content = '',
  fixedContent: FixedContent = {},
  ellipsisStr = '...',
  suffix = '',
  ellipsisPos: 'end' | 'middle' = 'end',
  isStrong?: boolean
): string => {
  if (content.length === 0) {
    return '';
  }
  // No layout engine (jsdom) or hidden container: degrade gracefully and keep the full text.
  if (!hasLayout(originEle)) {
    return content;
  }
  if (!ellipsisContainer) {
    ellipsisContainer = document.createElement('div');
    ellipsisContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ellipsisContainer);
  }
  const container = ellipsisContainer;
  // Get origin style
  const originStyle = window.getComputedStyle(originEle);
  const originCSS = styleToString(originStyle);
  const lineHeight = pxToNumber(originStyle.lineHeight);
  const maxHeight = Math.round(lineHeight * (rows + 1) + pxToNumber(originStyle.paddingTop) + pxToNumber(originStyle.paddingBottom));
  // Set shadow
  container.setAttribute('style', originCSS);
  container.style.position = 'fixed';
  container.style.left = '0';
  // When the width value obtained by window.getComputedStyle is auto, get the exact width through offsetWidth
  if (originStyle.getPropertyValue('width') === 'auto' && originEle.offsetWidth) {
    container.style.width = `${originEle.offsetWidth}px`;
  }
  container.style.height = 'auto';
  container.style.top = '-999999px';
  container.style.zIndex = '-1000';
  isStrong && (container.style.fontWeight = '600');
  // clean up css overflow
  container.style.textOverflow = 'clip';
  (container.style as any).webkitLineClamp = 'none';
  // Clear container content
  container.innerHTML = '';

  // Check if ellipsis in measure div is enough for content
  function inRange() {
    const widthInRange = container.scrollWidth <= container.offsetWidth;
    const heightInRange = container.scrollHeight < maxHeight;
    return rows === 1 ? widthInRange && heightInRange : heightInRange;
  }

  // ========================= Find match ellipsis content =========================
  const ellipsisContentHolder = document.createElement('span');
  const textNode = document.createTextNode(content);
  ellipsisContentHolder.appendChild(textNode);
  if (suffix.length > 0) {
    const ellipsisTextNode = document.createTextNode(suffix);
    ellipsisContentHolder.appendChild(ellipsisTextNode);
  }
  container.appendChild(ellipsisContentHolder);
  // Expand node needs to be added only when text needTruncated
  Object.values(_omit(fixedContent, 'expand')).map((node) => node && container.appendChild(node.cloneNode(true)));

  function appendExpandNode() {
    container.innerHTML = '';
    container.appendChild(ellipsisContentHolder);
    Object.values(fixedContent).map((node) => node && container.appendChild(node.cloneNode(true)));
  }

  function getCurrentText(text: string, pos: number) {
    const end = text.length;
    if (!pos) {
      return ellipsisStr;
    }
    if (ellipsisPos === 'end') {
      return text.slice(0, pos) + ellipsisStr;
    }
    return text.slice(0, pos) + ellipsisStr + text.slice(end - pos, end);
  }

  // Get maximum text
  function measureText(node: Text, fullText: string, startLoc = 0, endLoc = fullText.length, lastSuccessLoc = 0): string {
    const midLoc = Math.floor((startLoc + endLoc) / 2);
    const currentText = getCurrentText(fullText, midLoc);
    node.textContent = currentText;
    if (startLoc >= endLoc - 1 && endLoc > 0) {
      // Loop when step is small
      for (let step = endLoc; step >= startLoc; step -= 1) {
        const currentStepText = getCurrentText(fullText, step);
        node.textContent = currentStepText;
        if (inRange()) {
          return currentStepText;
        }
      }
    } else if (endLoc === 0) {
      return ellipsisStr;
    }
    if (inRange()) {
      return measureText(node, fullText, midLoc, endLoc, midLoc);
    }
    return measureText(node, fullText, startLoc, midLoc, lastSuccessLoc);
  }

  let resText = content;
  // First judge whether the total length of fullText, plus suffix (possible) and copied icon (possible) meets expectations.
  // If it does not, add an expand button and find the largest content that meets the size limit
  if (!inRange()) {
    appendExpandNode();
    resText = measureText(textNode, content, 0, ellipsisPos === 'middle' ? Math.floor(content.length / 2) : content.length);
  }
  container.innerHTML = '';
  return resText;
};

export default getRenderText;

/**
 * Copy text to the clipboard (replacement for the `copy-text-to-clipboard` dependency of semi-ui).
 * Uses the synchronous execCommand path when available and falls back to the async Clipboard API.
 * Returns whether a copy attempt succeeded.
 */
export function copyTextToClipboard(text: string): boolean {
  if (typeof document === 'undefined') return false;
  let success = false;
  if (typeof document.execCommand === 'function') {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.contain = 'strict';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.fontSize = '12pt';
    const selection = document.getSelection();
    const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    document.body.appendChild(el);
    el.select();
    el.selectionStart = 0;
    el.selectionEnd = text.length;
    try {
      success = document.execCommand('copy');
    } catch (e) {
      success = false;
    }
    document.body.removeChild(el);
    if (originalRange && selection) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }
  }
  if (!success && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      const p = navigator.clipboard.writeText(text);
      if (p && typeof (p as any).catch === 'function') (p as Promise<void>).catch(() => undefined);
      success = true;
    } catch (e) {
      success = false;
    }
  }
  return success;
}
