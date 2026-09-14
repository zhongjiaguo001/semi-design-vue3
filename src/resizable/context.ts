import { inject, provide, reactive } from 'vue';
import type { InjectionKey, Ref } from 'vue';

export interface ResizeContextValue {
  direction: 'horizontal' | 'vertical';
  registerItem: (
    ref: Ref<HTMLElement | null>,
    min?: string,
    max?: string,
    defaultSize?: string | number,
    onResizeStart?: (e: any, dir: string) => void,
    onChange?: (size: { width: number; height: number }, e: any, dir: string) => void,
    onResizeEnd?: (size: { width: number; height: number }, e: any, dir: string) => void
  ) => number;
  registerHandler: (ref: Ref<HTMLElement | null>) => number;
  notifyResizeStart: (handlerIndex: number, e: any, type: 'mouse' | 'touch') => void;
  getGroupSize: () => { width: number; height: number };
}

export const ResizeContextKey: InjectionKey<ResizeContextValue> = Symbol('SemiResizeContext');

export function provideResizeContext(value: ResizeContextValue) {
  provide(ResizeContextKey, value);
}

const EMPTY = reactive({
  direction: 'horizontal',
  registerItem: () => -1,
  registerHandler: () => -1,
  notifyResizeStart: () => undefined,
  getGroupSize: () => ({ width: 0, height: 0 }),
}) as ResizeContextValue;

export function useResizeContext(): ResizeContextValue {
  return inject(ResizeContextKey, EMPTY);
}
