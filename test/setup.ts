import { config } from '@vue/test-utils';
import { vi } from 'vitest';

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => ({ destroy: () => undefined, play: () => undefined, stop: () => undefined, pause: () => undefined }),
  },
}));

// jsdom lacks these APIs used by semi-foundation
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}
if (!(globalThis as any).ResizeObserver) {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!(globalThis as any).IntersectionObserver) {
  (globalThis as any).IntersectionObserver = class {
    constructor(public cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: any) => setTimeout(cb, 0) as any;
  window.cancelAnimationFrame = (id: any) => clearTimeout(id);
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
const emptyClientRect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON() { return this; } });
const emptyClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} });
if (typeof Element !== 'undefined' && !Element.prototype.getClientRects) {
  Element.prototype.getClientRects = emptyClientRects as any;
}
if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) Range.prototype.getClientRects = emptyClientRects as any;
  if (!Range.prototype.getBoundingClientRect) Range.prototype.getBoundingClientRect = emptyClientRect as any;
}

if (!(window as any).DOMRect) {
  (window as any).DOMRect = class DOMRect {
    constructor(public x = 0, public y = 0, public width = 0, public height = 0) {}
    get top() { return this.y; }
    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get bottom() { return this.y + this.height; }
    toJSON() { return this; }
  };
}
config.global.stubs = {};

// jsdom does not implement `:hover`; track hover state via mouse events so
// semi-foundation's `triggerDOM.matches(':hover')` checks work in tests.
const hovered = new Set<EventTarget | null>();
document.addEventListener('mouseenter', (e) => hovered.add(e.target), true);
document.addEventListener('mouseover', (e) => hovered.add(e.target), true);
document.addEventListener('mouseleave', (e) => hovered.delete(e.target), true);
document.addEventListener('mouseout', (e) => hovered.delete(e.target), true);
const originalMatches = Element.prototype.matches;
Element.prototype.matches = function (selector: string) {
  if (selector === ':hover') {
    let el: Element | null = this;
    while (el) {
      if (hovered.has(el)) return true;
      el = el.parentElement;
    }
    return false;
  }
  return originalMatches.call(this, selector);
};

// jsdom has no canvas; TextArea line numbers measure text with it
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as any;
}

if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = function () {};
  HTMLMediaElement.prototype.load = function () {};
}
