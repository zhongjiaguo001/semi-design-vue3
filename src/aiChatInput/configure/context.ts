import { inject, provide, type InjectionKey } from 'vue';

export interface ConfigureContextType {
  value: Record<string, any>;
  onChange: (value: Record<string, any>, init?: boolean) => void;
  onRemove: (field: string) => void;
}

export const ConfigureContextKey: InjectionKey<ConfigureContextType> = Symbol('SemiAIChatInputConfigure');

export function provideConfigure(ctx: ConfigureContextType) {
  provide(ConfigureContextKey, ctx);
}

export function useConfigure() {
  return inject(ConfigureContextKey, {
    value: {},
    onChange: () => undefined,
    onRemove: () => undefined,
  });
}
