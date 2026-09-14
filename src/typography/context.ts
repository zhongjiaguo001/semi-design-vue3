import { inject, provide } from 'vue';
import type { InjectionKey, Ref } from 'vue';

export type TypographySize = 'small' | 'normal' | 'inherit';

/** Vue counterpart of typography/context.js (`SizeContext`, default 'normal') */
export const TypographySizeContextKey: InjectionKey<Ref<TypographySize>> = Symbol('SemiTypographySizeContext');

export function useTypographySize(): Ref<TypographySize> | undefined {
  return inject(TypographySizeContextKey, undefined);
}
export function provideTypographySize(size: Ref<TypographySize>) {
  provide(TypographySizeContextKey, size);
}
