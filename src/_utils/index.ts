import { Fragment, Comment, Text, isVNode, cloneVNode, h, toRaw } from 'vue';
import type { VNode, VNodeChild, Slots, Component } from 'vue';
import { isHTMLElement } from '@douyinfe/semi-foundation/lib/es/utils/dom';

export function stopPropagation(e: any, noImmediate?: boolean) {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  if (!noImmediate && e && typeof e.stopImmediatePropagation === 'function') {
    e.stopImmediatePropagation();
  }
}

export const noop = () => undefined;

/** pick `data-*` attributes from an attrs / props object */
export function getDataAttr(props: Record<string, any> = {}) {
  return Object.keys(props).reduce((acc, key) => {
    if (key.startsWith('data-')) acc[key] = props[key];
    return acc;
  }, {} as Record<string, any>);
}

export function registerMediaQuery(
  media: string,
  { match, unmatch, callInInit = true }: { match?: (e: any) => void; unmatch?: (e: any) => void; callInInit?: boolean }
) {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mediaQueryList = window.matchMedia(media);
    function handlerMediaChange(e: any) {
      if (e.matches) {
        match && match(e);
      } else {
        unmatch && unmatch(e);
      }
    }
    callInInit && handlerMediaChange(mediaQueryList);
    if ('addEventListener' in mediaQueryList) {
      mediaQueryList.addEventListener('change', handlerMediaChange);
      return () => mediaQueryList.removeEventListener('change', handlerMediaChange);
    }
    (mediaQueryList as any).addListener(handlerMediaChange);
    return () => (mediaQueryList as any).removeListener(handlerMediaChange);
  }
  return () => undefined;
}

/** Whether a vnode is a Semi icon (built-in or custom created by convertIcon) */
export const isSemiIcon = (node: any): boolean =>
  isVNode(node) && !!node.type && typeof node.type === 'object' && (node.type as any).elementType === 'Icon';

export function getActiveElement() {
  return typeof document !== 'undefined' ? document.activeElement : null;
}

export function isNodeContainsFocus(node: Element) {
  const activeElement = getActiveElement();
  return activeElement === node || node.contains(activeElement);
}

export function getFocusableElements(node: any): HTMLElement[] {
  if (!isHTMLElement(node)) {
    return [];
  }
  const focusableSelectorsList = [
    "input:not([disabled]):not([tabindex='-1'])",
    "textarea:not([disabled]):not([tabindex='-1'])",
    "button:not([disabled]):not([tabindex='-1'])",
    "a[href]:not([tabindex='-1'])",
    "select:not([disabled]):not([tabindex='-1'])",
    "area[href]:not([tabindex='-1'])",
    "iframe:not([tabindex='-1'])",
    "object:not([tabindex='-1'])",
    "*[tabindex]:not([tabindex='-1'])",
    "*[contenteditable]:not([tabindex='-1'])",
  ];
  return Array.from(node.querySelectorAll(focusableSelectorsList.join(','))) as HTMLElement[];
}

export async function runAfterTicks(func: () => any, numberOfTicks: number): Promise<void> {
  if (numberOfTicks === 0) {
    await func();
    return;
  }
  await new Promise<void>((resolve) => {
    setTimeout(async () => {
      await runAfterTicks(func, numberOfTicks - 1);
      resolve();
    }, 0);
  });
}

export function getScrollbarWidth() {
  if (typeof window !== 'undefined' && Object.prototype.toString.call(globalThis) === '[object Window]') {
    return window.innerWidth - document.documentElement.clientWidth;
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* VNode helpers – the Vue counterparts of React.Children utilities    */
/* ------------------------------------------------------------------ */

/** Flatten slot output (fragments, arrays, v-for) into a plain list of meaningful vnodes */
export function flattenChildren(children: VNodeChild | VNodeChild[] | undefined, filterEmpty = true): VNode[] {
  const res: VNode[] = [];
  const walk = (child: any) => {
    if (child === null || child === undefined || child === false || child === true) return;
    if (Array.isArray(child)) {
      child.forEach(walk);
      return;
    }
    if (isVNode(child)) {
      if (child.type === Fragment) {
        walk(child.children);
        return;
      }
      if (filterEmpty && child.type === Comment) return;
      if (filterEmpty && child.type === Text && typeof child.children === 'string' && child.children.trim() === '') return;
      res.push(child);
      return;
    }
    // raw string / number
    res.push(h(Text, String(child)) as VNode);
  };
  walk(children);
  return res;
}

/** Render a slot if present, otherwise fall back to a prop value */
export function renderSlotOrProp(slots: Slots, name: string, prop?: any, slotProps?: any): VNodeChild {
  const slot = slots[name];
  if (slot) return slot(slotProps);
  if (typeof prop === 'function') return prop(slotProps);
  return prop;
}

export function hasSlotOrProp(slots: Slots, name: string, prop?: any) {
  return Boolean(slots[name]) || (prop !== undefined && prop !== null && prop !== false);
}

/** Get the underlying component definition name of a vnode (for `elementType` checks) */
export function getVNodeElementType(node: any): string | undefined {
  if (!isVNode(node) || !node.type || typeof node.type !== 'object') return undefined;
  return (node.type as any).elementType;
}

export function isComponentVNode(node: any): boolean {
  return isVNode(node) && typeof node.type === 'object';
}

export function isElementVNode(node: any): boolean {
  return isVNode(node) && typeof node.type === 'string';
}

/** Get the root DOM element from a vnode after it was mounted */
export function getVNodeDOM(node: VNode | null | undefined): HTMLElement | null {
  if (!node) return null;
  if (node.component) {
    const sub = node.component.subTree;
    if (sub && sub.el && (sub.el as any).nodeType === 1) return sub.el as HTMLElement;
    return (node.component.proxy as any)?.$el ?? null;
  }
  if (node.el && (node.el as any).nodeType === 1) return node.el as HTMLElement;
  return null;
}

/** Resolve a ref value (component instance or element) to a DOM element */
export function resolveDOM(target: any): HTMLElement | null {
  if (!target) return null;
  if (isHTMLElement(target)) return target as HTMLElement;
  if (target.$el && isHTMLElement(target.$el)) return target.$el;
  if (isVNode(target)) return getVNodeDOM(target);
  return null;
}

export { cloneVNode, isVNode };
export type { VNode, VNodeChild, Component };

/**
 * Normalise "node-like" prop values into renderable children:
 *  - VNode / string / number are returned as-is
 *  - a component definition (object or function) is instantiated with `h`
 *  - a render function (() => VNode) is invoked
 */
export function normalizeNode(node: any, props?: Record<string, any>): VNodeChild {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (isVNode(node)) return props ? cloneVNode(node, props) : node;
  if (Array.isArray(node)) return node.map((n) => normalizeNode(n, props)) as any;
  if (typeof node === 'function') {
    // component defined via defineComponent(() => ...) has __vccOpts / props; treat plain arrow as render fn
    if ((node as any).__vccOpts || (node as any).props || (node as any).setup) return h(toRaw(node), props);
    return node(props);
  }
  if (typeof node === 'object' && (node.setup || node.render || node.template || node.__vccOpts || node.name)) {
    return h(toRaw(node), props);
  }
  return node;
}

/** Convert a value to a css unit string */
export function toPx(value: number | string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}

const cssPxKeyRE = /^(left|top|right|bottom|width|height|minWidth|minHeight|maxWidth|maxHeight|margin|marginTop|marginRight|marginBottom|marginLeft|padding|paddingTop|paddingRight|paddingBottom|paddingLeft|inset)$/;

/**
 * Vue 3.5's style patch assigns numeric values as unitless (`el.style.left = 92`),
 * which the browser drops. React auto-appends `px`; this helper does the same for
 * dimension/offset keys used by Semi's tooltip/popover positioning.
 */
export function toCssStyle(style: Record<string, any> | null | undefined): Record<string, any> | undefined {
  if (!style) return style as any;
  const out: Record<string, any> = {};
  for (const key of Object.keys(style)) {
    const v = style[key];
    if (v == null || v === '') continue;
    out[key] = typeof v === 'number' && !Number.isNaN(v) && cssPxKeyRE.test(key) ? `${v}px` : v;
  }
  return out;
}

/**
 * Wrap a `propsView` (React `key in props` semantics) so that some keys resolve to
 * computed fallbacks (e.g. `timeZone` from ConfigProvider, `dateFnsLocale` / `locale`
 * from LocaleProvider) exactly like the React `LocaleConsumer` / `ConfigContext.Consumer`
 * wrappers inject them as props. Keys whose extra value is `undefined` fall through.
 */
export function extendPropsView<P extends object>(propsView: P, getExtra: () => Record<string, any>): P {
  const hasExtra = (key: PropertyKey) => {
    if (typeof key !== 'string') return false;
    const extra = getExtra();
    return key in extra && extra[key] !== undefined;
  };
  return new Proxy(propsView, {
    has(target, key) {
      return hasExtra(key) || Reflect.has(target, key);
    },
    get(target, key) {
      if (hasExtra(key)) return getExtra()[key as string];
      return Reflect.get(target, key);
    },
    ownKeys(target) {
      const keys = new Set<string | symbol>(Reflect.ownKeys(target));
      Object.keys(getExtra()).forEach((k) => hasExtra(k) && keys.add(k));
      return Array.from(keys);
    },
    getOwnPropertyDescriptor(target, key) {
      if (hasExtra(key)) {
        return { configurable: true, enumerable: true, writable: true, value: getExtra()[key as string] };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  }) as P;
}

/**
 * Render a React-style "node" prop that may also be supplied as a named slot:
 * the slot wins, otherwise the prop is normalised through `normalizeNode`
 * (string / VNode / component definition / render function).
 */
export function renderNode(slots: Slots, name: string, prop?: any, slotProps?: any): VNodeChild {
  const slot = slots[name];
  if (slot) return slot(slotProps);
  return normalizeNode(prop, slotProps);
}
