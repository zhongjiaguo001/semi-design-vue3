import ConfigProvider, { defaultResponsiveMap, configProviderProps } from './ConfigProvider';
import ConfigConsumer from './ConfigConsumer';
import semiGlobal, { getDefaultPropsFromGlobalConfig } from './semiGlobal';
export { ConfigProvider, ConfigConsumer, defaultResponsiveMap, configProviderProps, semiGlobal, getDefaultPropsFromGlobalConfig };
export type { SemiGlobalConfig } from './semiGlobal';
export * from './context';
export default ConfigProvider;
