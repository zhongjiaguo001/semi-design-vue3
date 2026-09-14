import { defineComponent, h, isVNode } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/upload/constants';
import FileCardFoundation from '@douyinfe/semi-foundation/lib/es/upload/fileCardFoundation';
import { getFileSize } from '@douyinfe/semi-foundation/lib/es/upload/utils';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import { IconAlertCircle, IconClose, IconClear, IconFile, IconRefresh } from '../icons/generated';
import Button from '../button/Button';
import Tooltip from '../tooltip/Tooltip';
import Spin from '../spin/Spin';
import Progress from '../progress/Progress';
import { Text as TypographyText } from '../typography/Typography';
import { normalizeNode, toPx } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type FileItemStatus = 'success' | 'uploadFail' | 'validateFail' | 'validating' | 'uploading' | 'wait';

const svgAttrs = { focusable: 'false', 'aria-hidden': 'true', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

export const ErrorSvg = (props: Record<string, any> = {}) =>
  h('svg', { ...svgAttrs, width: '16', height: '16', viewBox: '0 0 16 16', ...props }, [
    h('circle', { cx: '7.99992', cy: '7.99992', r: '6.66667', fill: 'white' }),
    h('path', {
      'fill-rule': 'evenodd',
      'clip-rule': 'evenodd',
      d: 'M15.3332 8.00008C15.3332 12.0502 12.0499 15.3334 7.99984 15.3334C3.94975 15.3334 0.666504 12.0502 0.666504 8.00008C0.666504 3.94999 3.94975 0.666748 7.99984 0.666748C12.0499 0.666748 15.3332 3.94999 15.3332 8.00008ZM8.99984 11.6667C8.99984 11.1145 8.55212 10.6667 7.99984 10.6667C7.44755 10.6667 6.99984 11.1145 6.99984 11.6667C6.99984 12.219 7.44755 12.6667 7.99984 12.6667C8.55212 12.6667 8.99984 12.219 8.99984 11.6667ZM7.99984 3.33341C7.27573 3.33341 6.7003 3.94171 6.74046 4.66469L6.94437 8.33495C6.97549 8.89513 7.4388 9.33341 7.99984 9.33341C8.56087 9.33341 9.02419 8.89513 9.05531 8.33495L9.25921 4.66469C9.29938 3.94171 8.72394 3.33341 7.99984 3.33341Z',
      fill: '#F93920',
    }),
  ]);

export const ReplaceSvg = (props: Record<string, any> = {}) =>
  h('svg', { ...svgAttrs, width: '28', height: '28', viewBox: '0 0 28 28', ...props }, [
    h('circle', { cx: '14', cy: '14', r: '14', fill: '#16161A', 'fill-opacity': '0.6' }),
    h('path', { d: 'M9 10.25V18.25L10.25 13.25H17.875V11.75C17.875 11.4739 17.6511 11.25 17.375 11.25H14L12.75 9.75H9.5C9.22386 9.75 9 9.97386 9 10.25Z', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('path', { d: 'M18 18.25L19 13.25H10.2031L9 18.25H18Z', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ]);

export const DirectorySvg = (props: Record<string, any> = {}) =>
  h('svg', { ...svgAttrs, width: '24', height: '24', viewBox: '0 0 24 24', ...props }, [
    h('path', {
      d: 'M6 17V7.58824C6 7.26336 6.26863 7 6.6 7H10.5L12 8.76471H16.05C16.3814 8.76471 16.65 9.02806 16.65 9.35294V11.1176H7.5L6 17ZM6 17L7.44375 11.1176H18L16.8 17L6 17Z',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  ]);

/**
 * Lightweight progress renderer kept for backwards compatibility (the cards now render the real
 * `Progress` component, as React does).
 */
export const renderProgress = (percent: number, type: 'line' | 'circle', extra: Record<string, any> = {}) => {
  const perc = Math.min(100, Math.max(0, Number(percent) || 0));
  if (type === 'circle') {
    const width = 24;
    const strokeWidth = 4;
    const radius = (width - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return h('div', { class: 'semi-progress-circle', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': perc, ...extra }, [
      h('svg', { class: 'semi-progress-circle-ring', width, height: width, viewBox: `0 0 ${width} ${width}` }, [
        h('circle', { class: 'semi-progress-circle-ring-track', cx: width / 2, cy: width / 2, r: radius, 'stroke-width': strokeWidth, fill: 'none', stroke: extra.orbitStroke }),
        h('circle', {
          class: 'semi-progress-circle-ring-inner',
          cx: width / 2,
          cy: width / 2,
          r: radius,
          'stroke-width': strokeWidth,
          fill: 'none',
          stroke: 'var(--semi-color-success)',
          'stroke-dasharray': `${circumference} ${circumference}`,
          'stroke-dashoffset': (1 - perc / 100) * circumference,
        }),
      ]),
    ]);
  }
  return h('div', { class: 'semi-progress semi-progress-horizontal', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': perc, ...extra }, [
    h('div', { class: 'semi-progress-track', 'aria-hidden': 'true' }, [h('div', { class: 'semi-progress-track-inner', style: { width: `${perc}%`, background: 'var(--semi-color-success)' }, 'aria-hidden': 'true' })]),
  ]);
};

export const fileCardProps = {
  className: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  listType: { type: String, default: strings.FILE_LIST_DEFAULT },
  name: { type: String, default: '' },
  onPreviewClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
  onRemove: { type: Function as PropType<() => void>, default: () => undefined },
  onReplace: { type: Function as PropType<() => void>, default: () => undefined },
  onRetry: { type: Function as PropType<() => void>, default: () => undefined },
  percent: { type: Number, default: undefined },
  preview: { type: Boolean, default: false },
  previewFile: { type: Function as PropType<(fileItem: any) => VNodeChild>, default: undefined },
  picWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
  picHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  showReplace: { type: Boolean, default: false },
  showRetry: { type: Boolean, default: false },
  size: { type: [Number, String] as PropType<number | string>, default: '' },
  status: { type: String as PropType<FileItemStatus>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  url: { type: String, default: undefined },
  validateMessage: { type: [String, Object, Function] as PropType<any>, default: undefined },
  index: { type: Number, default: undefined },
  showPicInfo: { type: Boolean, default: false },
  showTooltip: { type: [Boolean, Object] as PropType<boolean | Record<string, any>>, default: true },
  renderPicInfo: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  renderPicClose: { type: Function as PropType<(props: { className: string; remove: (e: MouseEvent) => void }) => VNodeChild>, default: undefined },
  renderPicPreviewIcon: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  renderFileOperation: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  renderThumbnail: { type: Function as PropType<(props: any) => VNodeChild>, default: undefined },
  uid: { type: String, default: undefined },
  fileInstance: { type: Object as PropType<File>, default: undefined },
  response: { type: null as any, default: undefined },
  _sizeInvalid: { type: Boolean, default: undefined },
  shouldUpload: { type: Boolean, default: undefined },
};

const FileCard = defineComponent({
  name: 'UploadFileCard',
  inheritAttrs: false,
  props: fileCardProps,
  setup(props, { attrs }) {
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { fallbackPreview: false });
    const adapter = {
      ...baseAdapter,
      updateFallbackPreview: (fallbackPreview: boolean) => {
        state.fallbackPreview = fallbackPreview;
      },
    };
    const foundation = new (FileCardFoundation as any)(adapter);
    const { locale } = useLocale('Upload');

    const transSize = (size: number | string) => (typeof size === 'number' ? getFileSize(size) : size);
    const cardProps = () => ({ ...attrs, ...props });

    const onRemove = (e: MouseEvent) => {
      e.stopPropagation();
      props.onRemove && props.onRemove();
    };
    const onReplace = (e: MouseEvent) => {
      e.stopPropagation();
      props.onReplace && props.onReplace();
    };
    const onRetry = (e: MouseEvent) => {
      e.stopPropagation();
      props.onRetry && props.onRetry();
    };

    const renderValidateMessage = () => {
      const { status, validateMessage } = props;
      if (typeof validateMessage === 'string' && status === strings.FILE_STATUS_VALIDATING) {
        return [h(Spin, { size: 'small', wrapperClassName: `${prefixCls}-file-card-icon-loading` }), validateMessage];
      }
      if (typeof validateMessage === 'string') {
        return [h(IconAlertCircle, { class: `${prefixCls}-file-card-icon-error` }), validateMessage];
      }
      const node = normalizeNode(validateMessage);
      if (isVNode(node) || (Array.isArray(node) && node.length)) return node;
      return null;
    };

    const renderPicValidateMsg = () => {
      const { status, validateMessage } = props;
      let icon: VNodeChild = null;
      if (validateMessage && status === strings.FILE_STATUS_VALIDATING) {
        icon = h('span', { class: `${prefixCls}-tooltip-children-wrapper ${prefixCls}-picture-file-card-icon-loading` }, [h(Spin, { size: 'small' })]);
      } else if (validateMessage && (status === strings.FILE_STATUS_VALID_FAIL || status === strings.FILE_STATUS_UPLOAD_FAIL)) {
        icon = h('div', { class: `${prefixCls}-picture-file-card-icon-error` }, [ErrorSvg()]);
      }
      return icon ? h(Tooltip, { content: validateMessage, trigger: 'hover', position: 'bottom' }, { default: () => icon }) : null;
    };

    const renderPic = () => {
      const { fallbackPreview } = state;
      const { url, percent, status, disabled, style, onPreviewClick, showPicInfo, renderPicInfo, renderPicClose, renderPicPreviewIcon, renderThumbnail, name, index, picHeight, picWidth } = props;
      const showProgress = status === strings.FILE_STATUS_UPLOADING && percent !== 100;
      const showRetry = status === strings.FILE_STATUS_UPLOAD_FAIL && props.showRetry;
      const showReplace = status === strings.FILE_STATUS_SUCCESS && props.showReplace;
      const showPreview = status === strings.FILE_STATUS_SUCCESS && !props.showReplace;
      const customThumbnail = typeof renderThumbnail === 'function';
      const filePicCardCls = cls(attrs.class as any, {
        [`${prefixCls}-picture-file-card`]: true,
        [`${prefixCls}-picture-file-card-preview-fallback`]: fallbackPreview,
        [`${prefixCls}-picture-file-card-disabled`]: disabled,
        [`${prefixCls}-picture-file-card-show-pointer`]: typeof onPreviewClick !== 'undefined',
        [`${prefixCls}-picture-file-card-error`]: status === strings.FILE_STATUS_UPLOAD_FAIL,
        [`${prefixCls}-picture-file-card-uploading`]: showProgress,
        [`${prefixCls}-picture-file-card-custom-thumbnail`]: customThumbnail && picHeight && picWidth,
      });
      const retry = h('div', { role: 'button', tabindex: 0, class: `${prefixCls}-picture-file-card-retry`, onClick: onRetry }, [h(IconRefresh, { class: `${prefixCls}-picture-file-card-icon-retry` })]);
      const replace = h(
        Tooltip,
        { trigger: 'hover', position: 'top', content: locale.value?.replace, showArrow: false, spacing: 4 } as any,
        { default: () => h('div', { role: 'button', tabindex: 0, class: `${prefixCls}-picture-file-card-replace`, onClick: onReplace }, [ReplaceSvg({ class: `${prefixCls}-picture-file-card-icon-replace` })]) }
      );
      const preview = h('div', { class: `${prefixCls}-picture-file-card-preview` }, [typeof renderPicPreviewIcon === 'function' ? renderPicPreviewIcon(cardProps()) : null]);
      const close =
        typeof renderPicClose === 'function'
          ? renderPicClose({ className: `${prefixCls}-picture-file-card-close`, remove: onRemove })
          : h('div', { role: 'button', tabindex: 0, class: `${prefixCls}-picture-file-card-close`, onClick: onRemove }, [h(IconClear, { class: `${prefixCls}-picture-file-card-icon-close` })]);
      const picInfo = typeof renderPicInfo === 'function' ? renderPicInfo(cardProps()) : h('div', { class: `${prefixCls}-picture-file-card-pic-info` }, String((index ?? 0) + 1));
      const imgStyle: CSSProperties = {};
      const itemStyle: CSSProperties = style ? { ...style } : {};
      if (picHeight) {
        itemStyle.height = toPx(picHeight);
        imgStyle.height = toPx(picHeight);
      }
      if (picWidth) {
        itemStyle.width = toPx(picWidth);
        imgStyle.width = toPx(picWidth);
      }
      const defaultThumbTail = !fallbackPreview ? h('img', { src: url, alt: name, onError: (error: Event) => foundation.handleImageError(error), style: imgStyle }) : h(IconFile, { size: 'large' });
      const thumbnail = customThumbnail ? renderThumbnail!(cardProps()) : defaultThumbTail;
      return h('div', { role: 'listitem', class: filePicCardCls, style: [itemStyle, attrs.style as any], onClick: onPreviewClick }, [
        thumbnail,
        showProgress ? h(Progress, { percent: percent as number, type: 'circle', size: 'small', orbitStroke: '#FFF', 'aria-label': 'uploading file progress' }) : null,
        showRetry ? retry : null,
        showReplace ? replace : null,
        showPreview ? preview : null,
        showPicInfo ? picInfo : null,
        !disabled ? close : null,
        renderPicValidateMsg(),
      ]);
    };

    const renderFile = () => {
      const { name, size, percent, url, showRetry: propsShowRetry, showReplace: propsShowReplace, preview, previewFile, status, style, onPreviewClick, renderFileOperation, showTooltip } = props;
      const { fallbackPreview } = state;
      const fileCardCls = cls(attrs.class as any, {
        [`${prefixCls}-file-card`]: true,
        [`${prefixCls}-file-card-fail`]: status === strings.FILE_STATUS_VALID_FAIL || status === strings.FILE_STATUS_UPLOAD_FAIL,
        [`${prefixCls}-file-card-show-pointer`]: typeof onPreviewClick !== 'undefined',
      });
      const previewCls = cls({
        [`${prefixCls}-file-card-preview`]: true,
        [`${prefixCls}-file-card-preview-placeholder`]: !preview || previewFile || fallbackPreview,
      });
      const infoCls = `${prefixCls}-file-card-info`;
      const closeCls = `${prefixCls}-file-card-close`;
      const replaceCls = `${prefixCls}-file-card-replace`;
      const showProgress = !(percent === 100 || typeof percent === 'undefined') && status === strings.FILE_STATUS_UPLOADING;
      const showRetry = status === strings.FILE_STATUS_UPLOAD_FAIL && propsShowRetry;
      const showReplace = status === strings.FILE_STATUS_SUCCESS && propsShowReplace;
      const fileSize = transSize(size);
      let previewContent: VNodeChild = preview && !fallbackPreview ? h('img', { src: url, alt: name, onError: (error: Event) => foundation.handleImageError(error) }) : h(IconFile, { size: 'large' });
      if (previewFile) {
        previewContent = previewFile(cardProps());
      }
      const operation =
        typeof renderFileOperation === 'function'
          ? renderFileOperation(cardProps())
          : h(Button, { onClick: onRemove, type: 'tertiary', icon: h(IconClose), theme: 'borderless', size: 'small', class: closeCls });
      // Typography.Text with ellipsis: `showTooltip` (boolean | { type, opts, renderTooltip }) is forwarded as in React
      const nameNode = h(TypographyText, { class: `${infoCls}-name`, ellipsis: { showTooltip: showTooltip as any } }, { default: () => name });
      return h('div', { role: 'listitem', class: fileCardCls, style: [style, attrs.style as any], onClick: onPreviewClick }, [
        h('div', { class: previewCls }, [previewContent]),
        h('div', { class: `${infoCls}-main` }, [
          h('div', { class: `${infoCls}-main-text` }, [
            nameNode,
            h('span', null, [
              h('span', { class: `${infoCls}-size` }, fileSize as string),
              showReplace
                ? h(
                    Tooltip,
                    { trigger: 'hover', position: 'top', showArrow: false, content: locale.value?.replace },
                    { default: () => h('span', { class: `${prefixCls}-tooltip-children-wrapper ${replaceCls}` }, [h(Button, { onClick: onReplace, type: 'tertiary', theme: 'borderless', size: 'small', icon: DirectorySvg() })]) }
                  )
                : null,
            ]),
          ]),
          showProgress ? h(Progress, { percent: percent as number, style: { width: '100%' }, 'aria-label': 'uploading file progress' }) : null,
          h('div', { class: `${infoCls}-main-control` }, [
            h('span', { class: `${infoCls}-validate-message` }, [renderValidateMessage()]),
            showRetry ? h('span', { role: 'button', tabindex: 0, class: `${infoCls}-retry`, onClick: onRetry }, locale.value?.retry) : null,
          ]),
        ]),
        operation,
      ]);
    };

    return () => {
      const { listType } = props;
      if (listType === strings.FILE_LIST_PIC) return renderPic();
      if (listType === strings.FILE_LIST_DEFAULT) return renderFile();
      return null;
    };
  },
});

export default FileCard;
