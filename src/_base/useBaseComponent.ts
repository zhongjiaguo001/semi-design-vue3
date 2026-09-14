/**
 * Vue adapter for the Semi Foundation / Adapter architecture.
 *
 * Semi Design splits every component into a framework-agnostic `Foundation`
 * (published in @douyinfe/semi-foundation) and a framework specific adapter.
 * In React the adapter is `BaseComponent` (this.props / this.state / setState).
 * This composable is the Vue equivalent: it exposes the same adapter surface on
 * top of Vue's reactive props / state so foundations can be reused untouched.
 */
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import log from '@douyinfe/semi-foundation/lib/es/utils/log';
import { useConfigContext } from '../configProvider/context';

const camelizeRE = /-(\w)/g;
export const camelize = (str: string): string => str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = (str: string): string => str.replace(hyphenateRE, '-$1').toLowerCase();

export interface DefaultAdapter<P = Record<string, any>, S = Record<string, any>> {
  getContext(key: string): any;
  getContexts(): any;
  getProp(key: string): any;
  getProps(): P;
  getState(key: string): any;
  getStates(): S;
  setState(states: Partial<S>, cb?: () => void): void;
  getCache(key: string): any;
  getCaches(): Record<string, any>;
  setCache(key: string, value: any): void;
  stopPropagation(e: any): void;
  persistEvent(e: any): void;
}

export interface UseBaseComponentOptions {
  /** name of the primary controlled prop, so plain `v-model` (modelValue) works as an alias */
  modelProp?: string;
  /** extra context values resolved through getContext(key) */
  contexts?: Record<string, any> | (() => Record<string, any>);
}

/**
 * Returns the set of prop keys that were explicitly passed by the parent.
 * Semi foundations decide "controlled vs uncontrolled" with `key in props`,
 * but Vue always materialises every declared prop, so we consult the raw vnode props.
 */
export function getPassedPropKeys(instance: ComponentInternalInstance | null): Set<string> {
  const raw = (instance && instance.vnode && instance.vnode.props) || {};
  const set = new Set<string>();
  for (const key of Object.keys(raw)) {
    set.add(key);
    set.add(camelize(key));
    set.add(hyphenate(key));
  }
  return set;
}

export function useBaseComponent<P extends Record<string, any>, S extends Record<string, any>>(
  props: P,
  initialState: S,
  options: UseBaseComponentOptions = {}
) {
  const instance = getCurrentInstance();
  const state = reactive(initialState) as S;
  const cache: Record<string, any> = {};
  const configContext = useConfigContext();
  const { modelProp } = options;

  const isPassed = (key: string) => {
    const passed = getPassedPropKeys(instance);
    if (passed.has(key)) return true;
    if (modelProp && key === modelProp && passed.has('modelValue')) return true;
    return false;
  };

  const readProp = (key: string) => {
    if (modelProp && key === modelProp) {
      const passed = getPassedPropKeys(instance);
      if (!passed.has(modelProp) && !passed.has(hyphenate(modelProp)) && passed.has('modelValue')) {
        return (props as any).modelValue;
      }
    }
    return (props as any)[key];
  };

  /**
   * A view of props with React semantics:
   *  - `key in props` is only true for props explicitly passed by the parent
   *  - reading a prop returns its (defaulted) value
   *  - `modelValue` (plain v-model) is transparently aliased to `modelProp`
   */
  const propsView = new Proxy(props, {
    has(_t, key) {
      return typeof key === 'string' ? isPassed(key) : false;
    },
    get(_t, key) {
      if (typeof key !== 'string') return Reflect.get(props, key);
      return readProp(key);
    },
    ownKeys() {
      const keys = new Set<string>();
      for (const k of Object.keys(props)) {
        if (isPassed(k)) keys.add(k);
      }
      return Array.from(keys);
    },
    getOwnPropertyDescriptor(_t, key) {
      if (typeof key === 'string' && isPassed(key)) {
        return { configurable: true, enumerable: true, writable: true, value: readProp(key) };
      }
      return undefined;
    },
  }) as P;

  const resolveContexts = () => {
    const extra = typeof options.contexts === 'function' ? options.contexts() : options.contexts || {};
    return { ...configContext, ...extra };
  };

  const adapter: DefaultAdapter<P, S> = {
    getContext: (key) => {
      const ctx = resolveContexts();
      return key ? (ctx as any)[key] : undefined;
    },
    getContexts: () => resolveContexts(),
    getProp: (key) => readProp(key),
    getProps: () => propsView,
    getState: (key) => (state as any)[key],
    getStates: () => state,
    setState: (states, cb) => {
      if (states) {
        Object.assign(state, states);
      }
      if (typeof cb === 'function') {
        nextTick(cb);
      }
    },
    getCache: (key) => key && cache[key],
    getCaches: () => cache,
    setCache: (key, value) => {
      if (key) cache[key] = value;
    },
    stopPropagation: (e) => {
      try {
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
      } catch (error) {
        /* ignore */
      }
    },
    persistEvent: () => undefined,
  };

  /** is the given prop controlled by the parent? (React `hasOwnProperty` semantics) */
  const isControlled = (key: string) => isPassed(key);

  const setStateAsync = (states: Partial<S>) =>
    new Promise<void>((resolve) => adapter.setState(states, resolve));

  return {
    instance,
    state,
    cache,
    adapter,
    propsView,
    isControlled,
    setStateAsync,
    log: (text: string, ...rest: any[]) => log(text, ...rest),
  };
}

/**
 * Wire foundation lifecycle to the Vue lifecycle (componentDidMount / componentWillUnmount).
 */
export function useFoundationLifecycle(foundation: { init?: (...args: any[]) => void; destroy?: (...args: any[]) => void }) {
  onMounted(() => {
    foundation && typeof foundation.init === 'function' && foundation.init();
  });
  onBeforeUnmount(() => {
    foundation && typeof foundation.destroy === 'function' && foundation.destroy();
  });
}
