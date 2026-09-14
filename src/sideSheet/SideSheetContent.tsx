import { defineComponent, h, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/sideSheet/constants';
import Button from '../button/Button';
import { IconClose } from '../icons/generated';
import { getDataAttr, normalizeNode, toPx } from '../_utils';

let uuid = 0;
const prefixCls = cssClasses.PREFIX;

export const sideSheetContentProps = {
  mask: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  maskClassName: { type: String, default: '' },
  maskExtraProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  wrapperExtraProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  dialogClassName: { type: String, default: '' },
  className: { type: String, default: undefined },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  height: { type: [Number, String] as PropType<number | string>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  title: { type: [String, Number, Object, Array, Function, Boolean] as PropType<any>, default: undefined },
  footer: { type: [String, Number, Object, Array, Function, Boolean] as PropType<any>, default: null },
  closable: { type: Boolean, default: true },
  closeIcon: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  size: { type: String, default: 'small' },
  onClose: { type: Function as PropType<(e: any) => void>, default: undefined },
};

const SideSheetContent = defineComponent({
  name: 'SideSheetContent',
  inheritAttrs: false,
  props: sideSheetContentProps,
  setup(props, { slots, attrs }) {
    const sideSheetId = `sidesheet-${uuid++}`;
    let timeoutId: any = null;
    onBeforeUnmount(() => clearTimeout(timeoutId));

    const close = (e: any) => {
      props.onClose && props.onClose(e);
    };
    const onMaskClick = (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        close(e);
      }
    };

    const getMaskElement = () => {
      const { mask, maskStyle, maskClosable, maskClassName, maskExtraProps } = props;
      if (mask) {
        return h('div', {
          'aria-hidden': true,
          key: 'mask',
          class: cls(`${prefixCls}-mask`, maskClassName ?? ''),
          style: maskStyle,
          onClick: maskClosable ? onMaskClick : undefined,
          ...maskExtraProps,
        });
      }
      return null;
    };

    const renderHeader = () => {
      const { closable, headerStyle } = props;
      const titleNode = slots.title ? slots.title() : normalizeNode(props.title);
      const header = slots.title || props.title ? h('div', { class: `${prefixCls}-title`, 'x-semi-prop': 'title' }, [titleNode]) : null;
      let closer = null;
      if (closable) {
        const iconType = slots.closeIcon ? slots.closeIcon() : props.closeIcon ? normalizeNode(props.closeIcon) : h(IconClose);
        closer = h(
          Button,
          {
            class: `${prefixCls}-close`,
            key: 'close-btn',
            onClick: close,
            type: 'tertiary',
            theme: 'borderless',
            size: 'small',
          },
          { icon: () => iconType }
        );
      }
      return h('div', { class: `${prefixCls}-header`, role: 'heading', 'aria-level': 1, style: { ...headerStyle } }, [header, closer]);
    };

    const getDialogElement = () => {
      const style: CSSProperties = {};
      if (props.width) {
        style.width = toPx(props.width);
        // When the mask is false, the width is set on the wrapper. At this time, sidesheet-inner does not need to set
        // the width again, otherwise the percentage will be accumulated repeatedly when the width is a percentage
        if (!props.mask) {
          style.width = '100%';
        }
      }
      if (props.height) {
        style.height = toPx(props.height);
      }
      const header = renderHeader();
      const footerNode = slots.footer ? slots.footer() : props.footer ? normalizeNode(props.footer) : null;
      return h(
        'div',
        {
          key: 'dialog-element',
          role: 'dialog',
          tabindex: -1,
          id: sideSheetId,
          'aria-label': (attrs as any)['aria-label'],
          class: cls(`${prefixCls}-inner`, `${prefixCls}-inner-wrap`, props.dialogClassName ?? '', `${prefixCls}-size-${props.size}`),
          style: { ...(props.style || {}), ...style },
          ...props.wrapperExtraProps,
        },
        [
          h('div', { class: `${prefixCls}-content` }, [
            header,
            h('div', { class: `${prefixCls}-body`, style: props.bodyStyle, 'x-semi-prop': 'children' }, slots.default?.()),
            footerNode ? h('div', { class: `${prefixCls}-footer`, 'x-semi-prop': 'footer' }, [footerNode]) : null,
          ]),
        ]
      );
    };

    return () => {
      const { mask, className, width, size } = props;
      const wrapperCls = cls(className, attrs.class as any, {
        [`${prefixCls}-fixed`]: !mask,
        [`${prefixCls}-size-${size}`]: !mask,
      });
      const wrapperStyle: CSSProperties = {};
      if (!mask && width) {
        wrapperStyle.width = toPx(width);
      }
      return h('div', { class: wrapperCls, style: wrapperStyle, ...getDataAttr(attrs as any) }, [getMaskElement(), getDialogElement()]);
    };
  },
});

export default SideSheetContent;
