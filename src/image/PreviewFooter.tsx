import { defineComponent, h, ref } from 'vue';
import type { PropType, VNodeChild } from 'vue';
import cls from 'classnames';
import _throttle from 'lodash/throttle';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/image/constants';
import PreviewFooterFoundation from '@douyinfe/semi-foundation/lib/es/image/previewFooterFoundation';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import Tooltip from '../tooltip/Tooltip';
import Divider from '../divider';
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconRotate, IconDownload, IconWindowAdaptionStroked, IconRealSizeStroked } from '../icons/generated';
import type { RatioType } from './PreviewImage';

const prefixCls = cssClasses.PREFIX;
const footerPrefixCls = `${cssClasses.PREFIX}-preview-footer`;

export interface MenuProps {
  min: number;
  max: number;
  step: number;
  curPage: number;
  totalNum: number;
  ratio: RatioType;
  zoom: number;
  disabledPrev: boolean;
  disabledNext: boolean;
  disableDownload: boolean;
  disabledZoomIn: boolean;
  disabledZoomOut: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRatioClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  menuItems: VNodeChild[];
}

export const previewFooterProps = {
  curPage: { type: Number, default: 1 },
  totalNum: { type: Number, default: 1 },
  disabledPrev: { type: Boolean, default: false },
  disabledNext: { type: Boolean, default: false },
  disableDownload: { type: Boolean, default: false },
  className: { type: String, default: undefined },
  zoom: { type: Number, default: 100 },
  ratio: { type: String as PropType<RatioType>, default: 'adaptation' },
  min: { type: Number, default: 10 },
  max: { type: Number, default: 500 },
  step: { type: Number, default: 10 },
  zIndex: { type: Number, default: undefined },
  prevTip: { type: String, default: undefined },
  nextTip: { type: String, default: undefined },
  zoomInTip: { type: String, default: undefined },
  zoomOutTip: { type: String, default: undefined },
  rotateTip: { type: String, default: undefined },
  downloadTip: { type: String, default: undefined },
  adaptiveTip: { type: String, default: undefined },
  originTip: { type: String, default: undefined },
  showTooltip: { type: Boolean, default: false },
  onZoomIn: { type: Function as PropType<(zoom: number) => void>, default: undefined },
  onZoomOut: { type: Function as PropType<(zoom: number) => void>, default: undefined },
  onPrev: { type: Function as PropType<() => void>, default: undefined },
  onNext: { type: Function as PropType<() => void>, default: undefined },
  onAdjustRatio: { type: Function as PropType<(type: RatioType) => void>, default: undefined },
  onRotate: { type: Function as PropType<(direction: 'left' | 'right') => void>, default: undefined },
  onDownload: { type: Function as PropType<() => void>, default: undefined },
  renderPreviewMenu: { type: Function as PropType<(props: MenuProps) => VNodeChild>, default: undefined },
};

const PreviewFooter = defineComponent({
  name: 'ImagePreviewFooter',
  inheritAttrs: false,
  props: previewFooterProps,
  setup(props, { attrs, slots, expose }) {
    const { adapter } = useBaseComponent(props as any, {});
    const foundation = new (PreviewFooterFoundation as any)(adapter);
    const { locale } = useLocale('Image');
    const rootRef = ref<HTMLElement | null>(null);
    expose({ getElement: () => rootRef.value });

    const changeSliderValue = (type: 'plus' | 'minus') => foundation.changeSliderValue(type);
    const handleMinusClick = () => changeSliderValue('minus');
    const handlePlusClick = () => changeSliderValue('plus');
    const handleRotateLeft = () => foundation.handleRotate('left');
    const handleRotateRight = () => foundation.handleRotate('right');
    const handleSlideChange = _throttle((value: number) => foundation.handleValueChange(value), 50);
    const handleRatioClick = () => foundation.handleRatioClick();

    const getLocalTextByKey = (key: string) => locale.value?.[key];

    const getFinalIconElement = (element: VNodeChild, content: any, key: string, gap = false) => {
      const { showTooltip, zIndex } = props;
      return showTooltip
        ? h(
            Tooltip,
            { content, key: `tooltip-${key}`, zIndex: (zIndex || 0) + 1 },
            { default: () => h('span', { class: cls(`${prefixCls}-tooltip-children-wrapper`, { [`${footerPrefixCls}-gap`]: gap }) }, [element]) }
          )
        : element;
    };

    const getIconChevronLeft = () => {
      const { disabledPrev, onPrev, prevTip } = props;
      const icon = h(IconChevronLeft, { key: 'chevron-left', size: 'large', class: disabledPrev ? `${footerPrefixCls}-disabled` : '', onClick: !disabledPrev ? onPrev : undefined });
      return getFinalIconElement(icon, prevTip ?? getLocalTextByKey('prevTip'), 'chevron-left');
    };
    const getIconChevronRight = () => {
      const { disabledNext, onNext, nextTip } = props;
      const icon = h(IconChevronRight, { key: 'chevron-right', size: 'large', class: disabledNext ? `${footerPrefixCls}-disabled` : '', onClick: !disabledNext ? onNext : undefined });
      return getFinalIconElement(icon, nextTip ?? getLocalTextByKey('nextTip'), 'chevron-right');
    };
    const getIconMinus = () => {
      const { zoomOutTip, zoom, min } = props;
      const disabledZoomOut = zoom === min;
      const icon = h(IconMinus, { key: 'minus', size: 'large', onClick: !disabledZoomOut ? handleMinusClick : undefined, class: disabledZoomOut ? `${footerPrefixCls}-disabled` : '' });
      return getFinalIconElement(icon, zoomOutTip ?? getLocalTextByKey('zoomOutTip'), 'minus');
    };
    const getIconPlus = () => {
      const { zoomInTip, zoom, max } = props;
      const disabledZoomIn = zoom === max;
      const icon = h(IconPlus, { key: 'plus', size: 'large', onClick: !disabledZoomIn ? handlePlusClick : undefined, class: disabledZoomIn ? `${footerPrefixCls}-disabled` : '' });
      return getFinalIconElement(icon, zoomInTip ?? getLocalTextByKey('zoomInTip'), 'plus');
    };
    const getIconRatio = () => {
      const { ratio, originTip, adaptiveTip, showTooltip } = props;
      const iconProps: Record<string, any> = { key: 'ratio', size: 'large', class: showTooltip ? undefined : `${footerPrefixCls}-gap`, onClick: handleRatioClick };
      const icon = ratio === 'adaptation' ? h(IconRealSizeStroked, iconProps) : h(IconWindowAdaptionStroked, iconProps);
      const content = ratio === 'adaptation' ? originTip ?? getLocalTextByKey('originTip') : adaptiveTip ?? getLocalTextByKey('adaptiveTip');
      return getFinalIconElement(icon, content, 'ratio', true);
    };
    const getIconRotate = () => {
      const { rotateTip } = props;
      const icon = h(IconRotate, { key: 'rotate', size: 'large', onClick: handleRotateLeft });
      return getFinalIconElement(icon, rotateTip ?? getLocalTextByKey('rotateTip'), 'rotate');
    };
    const getIconDownload = () => {
      const { downloadTip, onDownload, disableDownload, showTooltip } = props;
      const icon = h(IconDownload, {
        key: 'download',
        size: 'large',
        onClick: !disableDownload ? onDownload : undefined,
        class: cls({ [`${footerPrefixCls}-gap`]: !showTooltip, [`${footerPrefixCls}-disabled`]: disableDownload }),
      });
      return getFinalIconElement(icon, downloadTip ?? getLocalTextByKey('downloadTip'), 'download', true);
    };
    const getNumberInfo = () => {
      const { curPage, totalNum } = props;
      return h('div', { class: `${footerPrefixCls}-page`, key: 'info' }, [String(curPage), '/', String(totalNum)]);
    };
    /**
     * Minimal inline substitute for Semi `Slider` (ported separately): a native range input
     * wrapped with the Semi slider classes.
     */
    const getSlider = () => {
      const { zoom, min, max, step } = props;
      return h('div', { class: 'semi-slider-wrapper', key: 'slider', style: { display: 'inline-flex', alignItems: 'center' } }, [
        h('input', {
          type: 'range',
          class: 'semi-slider',
          'aria-label': 'zoom',
          'aria-valuetext': `${zoom}%`,
          value: zoom,
          min,
          max,
          step,
          onInput: (e: Event) => handleSlideChange(Number((e.target as HTMLInputElement).value)),
          onChange: (e: Event) => handleSlideChange(Number((e.target as HTMLInputElement).value)),
        }),
      ]);
    };
    const getMenu = () => [getIconChevronLeft(), getNumberInfo(), getIconChevronRight(), getIconMinus(), getSlider(), getIconPlus(), getIconRatio(), getIconRotate(), getIconDownload()];
    const getFooterMenu = () => {
      const menuItems = getMenu();
      menuItems.splice(3, 0, h(Divider, { layout: 'vertical', key: 'divider-first' }));
      menuItems.splice(8, 0, h(Divider, { layout: 'vertical', key: 'divider-second' }));
      return menuItems;
    };
    const customRenderViewMenu = () => {
      const { min, max, step, curPage, totalNum, ratio, zoom, disabledPrev, disabledNext, disableDownload, onNext, onPrev, onDownload } = props;
      const menuProps: MenuProps = {
        min,
        max,
        step,
        curPage,
        totalNum,
        ratio,
        zoom,
        disabledPrev,
        disabledNext,
        disableDownload,
        onNext: onNext as any,
        onPrev: onPrev as any,
        onDownload: onDownload as any,
        onRotateLeft: handleRotateLeft,
        onRotateRight: handleRotateRight,
        disabledZoomIn: zoom === max,
        disabledZoomOut: zoom === min,
        onRatioClick: handleRatioClick,
        onZoomIn: handlePlusClick,
        onZoomOut: handleMinusClick,
        menuItems: getMenu(),
      };
      if (slots.previewMenu) return slots.previewMenu(menuProps);
      return props.renderPreviewMenu!(menuProps);
    };

    return () => {
      const { className } = props;
      const hasCustom = Boolean(props.renderPreviewMenu || slots.previewMenu);
      const menuCls = cls(footerPrefixCls, `${footerPrefixCls}-wrapper`, className, attrs.class as any, { [`${footerPrefixCls}-content`]: !hasCustom });
      return h('section', { class: menuCls, ref: rootRef }, hasCustom ? [customRenderViewMenu()] : getFooterMenu());
    };
  },
});

export default PreviewFooter;
