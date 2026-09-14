import { inject, provide, reactive } from 'vue';
import type { InjectionKey } from 'vue';

export interface PreviewContextProps {
  isGroup: boolean;
  previewSrc: string[];
  titles?: any[];
  currentIndex: number;
  visible: boolean;
  lazyLoad: boolean;
  previewObserver?: IntersectionObserver | null;
  setCurrentIndex: (index: number) => void;
  handleVisibleChange: (visible: boolean) => void;
  setDownloadName?: (src: string) => string;
}

export const PreviewContextKey: InjectionKey<PreviewContextProps> = Symbol('SemiImagePreviewContext');

export function providePreviewContext(value: PreviewContextProps) {
  provide(PreviewContextKey, value);
}

const EMPTY = reactive({}) as Partial<PreviewContextProps>;

export function usePreviewContext(): Partial<PreviewContextProps> {
  return inject(PreviewContextKey, EMPTY);
}
