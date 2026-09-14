/**
 * Port of `@douyinfe/semi-ui/_utils/semi-global`.
 * A process wide singleton used to override component default props:
 *
 *   semiGlobal.config.overrideDefaultProps = { Select: { zIndex: 2000 } };
 */
export interface SemiGlobalConfig {
  overrideDefaultProps?: Record<string, Record<string, any>>;
  [key: string]: any;
}

class SemiGlobal {
  config: SemiGlobalConfig = {};
}

export const semiGlobal = new SemiGlobal();

/**
 * Port of `getDefaultPropsFromGlobalConfig(componentName, defaultProps)`:
 * returns a live view of `defaultProps` where entries from
 * `semiGlobal.config.overrideDefaultProps[componentName]` win (read lazily, so
 * overrides registered after component definition are still honoured).
 */
export function getDefaultPropsFromGlobalConfig<T extends Record<string, any>>(componentName: string, semiDefaultProps: T = {} as T): T {
  const getFromGlobalConfig = (): Record<string, any> => semiGlobal?.config?.overrideDefaultProps?.[componentName] || {};
  const hasOwn = (target: any, key: PropertyKey) => Object.prototype.hasOwnProperty.call(target, key);
  return new Proxy({ ...semiDefaultProps }, {
    get(target, key, receiver) {
      const fromGlobal = getFromGlobalConfig();
      const desc = Reflect.getOwnPropertyDescriptor(target, key);
      if (desc && !desc.configurable && !desc.writable) return Reflect.get(target, key, receiver);
      if (typeof key === 'string' && hasOwn(fromGlobal, key)) return fromGlobal[key];
      return Reflect.get(target, key, receiver);
    },
    has(target, key) {
      return (typeof key === 'string' && hasOwn(getFromGlobalConfig(), key)) || Reflect.has(target, key);
    },
    ownKeys(target) {
      return Array.from(new Set([...Reflect.ownKeys(target), ...Object.keys(getFromGlobalConfig())]));
    },
    getOwnPropertyDescriptor(target, key) {
      const fromGlobal = getFromGlobalConfig();
      if (typeof key === 'string' && hasOwn(fromGlobal, key)) {
        return { value: fromGlobal[key], writable: true, enumerable: true, configurable: true };
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  }) as T;
}

export default semiGlobal;
