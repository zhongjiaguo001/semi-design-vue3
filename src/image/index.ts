import Image, { imageProps, imageEmits } from './Image';
import Preview, { previewProps, previewEmits } from './Preview';
import PreviewInner, { previewInnerProps, previewInnerEmits } from './PreviewInner';
import PreviewImage, { previewImageProps } from './PreviewImage';
import PreviewHeader, { previewHeaderProps } from './PreviewHeader';
import PreviewFooter, { previewFooterProps } from './PreviewFooter';
import { PreviewContextKey, providePreviewContext, usePreviewContext } from './previewContext';

(Image as any).Preview = Preview;
(Image as any).PreviewInner = PreviewInner;

const ImagePreview = Preview;

export {
  Image,
  Preview,
  ImagePreview,
  PreviewInner,
  PreviewImage,
  PreviewHeader,
  PreviewFooter,
  imageProps,
  imageEmits,
  previewProps,
  previewEmits,
  previewInnerProps,
  previewInnerEmits,
  previewImageProps,
  previewHeaderProps,
  previewFooterProps,
  PreviewContextKey,
  providePreviewContext,
  usePreviewContext,
};
export type { ImagePreviewObject } from './Image';
export type { RatioType } from './PreviewImage';
export type { MenuProps } from './PreviewFooter';
export type { PreviewContextProps } from './previewContext';
export default Image;
