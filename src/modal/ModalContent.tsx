import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import _get from 'lodash/get';
import _isFunction from 'lodash/isFunction';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/modal/constants';
import ModalContentFoundation from '@douyinfe/semi-foundation/lib/es/modal/modalContentFoundation';
import FocusTrapHandle from '@douyinfe/semi-foundation/lib/es/utils/FocusHandle';
import '@douyinfe/semi-foundation/lib/es/typography/typography.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import Button from '../button/Button';
import { IconClose } from '../icons/generated';
import { getDataAttr, normalizeNode, toPx } from '../_utils';

let uuid = 0;

export const modalContentProps = {
  mask: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  closable: { type: Boolean, default: true },
  centered: { type: Boolean, default: false },
  size: { type: String, default: 'small' },
  width: { type: [String, Number] as PropType<string | number>, default: undefined },
  height: { type: [String, Number] as PropType<string | number>, default: undefined },
  isFullScreen: { type: Boolean, default: false },
  /** resolved footer node (null/false renders no footer) */
  footer: { type: [String, Number, Object, Array, Boolean] as PropType<any>, default: null },
  /** resolved header node; used only when `hasHeader` is true */
  header: { type: [String, Number, Object, Array, Boolean] as PropType<any>, default: null },
  hasHeader: { type: Boolean, default: false },
  title: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
  icon: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  closeIcon: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  contentClassName: { type: String, default: '' },
  maskClassName: { type: String, default: '' },
  maskExtraProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  contentExtraProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  maskFixed: { type: Boolean, default: false },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  closeOnEsc: { type: Boolean, default: true },
  preventScroll: { type: Boolean, default: false },
  modalRender: { type: Function as PropType<(node: VNodeChild) => VNodeChild>, default: undefined },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
  onClose: { type: Function as PropType<(e?: any) => void>, default: undefined },
  onAnimationEnd: { type: Function as PropType<(e?: any) => void>, default: undefined },
};

const ModalContent = defineComponent({
  name: 'ModalContent',
  inheritAttrs: false,
  props: modalContentProps,
  setup(props, { slots, attrs }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      dialogMouseDown: false,
      prevFocusElement: FocusTrapHandle.getActiveElement() as HTMLElement | null,
    });
    const modalDialogRef = ref<HTMLElement | null>(null);
    const dialogId = `dialog-${uuid++}`;
    let focusTrapHandle: any = null;
    let timeoutId: any = null;

    const adapter = {
      ...baseAdapter,
      notifyClose: (e: any) => {
        props.onClose?.(e);
      },
      notifyDialogMouseDown: () => {
        state.dialogMouseDown = true;
      },
      notifyDialogMouseUp: () => {
        if (state.dialogMouseDown) {
          // Not setting setTimeout triggers close when modal external mouseUp
          timeoutId = setTimeout(() => {
            state.dialogMouseDown = false;
          }, 0);
        }
      },
      addKeyDownEventListener: () => {
        document.addEventListener('keydown', foundation.handleKeyDown);
      },
      removeKeyDownEventListener: () => {
        document.removeEventListener('keydown', foundation.handleKeyDown);
      },
      getMouseState: () => state.dialogMouseDown,
      modalDialogFocus: () => {
        const { preventScroll } = props;
        let activeElementInDialog = false;
        const el = modalDialogRef.value;
        if (el) {
          const activeElement = FocusTrapHandle.getActiveElement();
          activeElementInDialog = el.contains(activeElement);
          focusTrapHandle?.destroy();
          focusTrapHandle = new (FocusTrapHandle as any)(el, { preventScroll });
        }
        if (!activeElementInDialog) {
          el?.focus({ preventScroll });
        }
      },
      modalDialogBlur: () => {
        modalDialogRef.value?.blur();
        focusTrapHandle?.destroy();
      },
      prevFocusElementReFocus: () => {
        const { prevFocusElement } = state;
        const { preventScroll } = props;
        const focus = _get(prevFocusElement, 'focus');
        _isFunction(focus) && (prevFocusElement as any).focus({ preventScroll });
      },
    };

    const foundation = new (ModalContentFoundation as any)(adapter);

    onMounted(() => {
      foundation.handleKeyDownEventListenerMount();
      foundation.modalDialogFocus();
      const el = modalDialogRef.value;
      const nodes = FocusTrapHandle.getFocusableElements(el);
      if (el && !el.contains(document.activeElement)) {
        // focus on first focusable element
        (nodes[0] as HTMLElement | undefined)?.focus();
      }
    });

    onBeforeUnmount(() => {
      clearTimeout(timeoutId);
      foundation.destroy();
    });

    const onDialogMouseDown = () => foundation.handleDialogMouseDown();
    const onMaskMouseUp = () => foundation.handleMaskMouseUp();
    const onMaskClick = (e: MouseEvent) => foundation.handleMaskClick(e);
    const close = (e: any) => foundation.close(e);

    const getMaskElement = () => {
      const { mask, maskClassName, maskStyle, maskExtraProps } = props;
      if (mask) {
        return h('div', {
          key: 'mask',
          ...maskExtraProps,
          class: cls(`${cssClasses.DIALOG}-mask`, maskClassName),
          style: maskStyle,
        });
      }
      return null;
    };

    const renderCloseBtn = () => {
      const { closable } = props;
      if (!closable) return null;
      const iconType = slots.closeIcon ? slots.closeIcon() : props.closeIcon ? normalizeNode(props.closeIcon) : h(IconClose, { 'x-semi-prop': 'closeIcon' });
      return h(
        Button,
        {
          'aria-label': 'close',
          class: `${cssClasses.DIALOG}-close`,
          key: 'close-btn',
          onClick: close,
          type: 'tertiary',
          theme: 'borderless',
          size: 'small',
        },
        { icon: () => iconType }
      );
    };

    const hasIcon = () => Boolean(slots.icon) || Boolean(props.icon);

    const renderIcon = () => {
      if (!hasIcon()) return null;
      const icon = slots.icon ? slots.icon() : normalizeNode(props.icon);
      return h('span', { class: `${cssClasses.DIALOG}-icon-wrapper`, 'x-semi-prop': 'icon' }, [icon]);
    };

    const hasTitle = () => Boolean(slots.title) || (props.title !== null && props.title !== undefined);

    const renderHeader = () => {
      if (props.hasHeader) {
        return slots.header ? slots.header() : normalizeNode(props.header);
      }
      if (!hasTitle()) return null;
      const closer = renderCloseBtn();
      const icon = renderIcon();
      const title = slots.title ? slots.title() : normalizeNode(props.title);
      return h('div', { class: `${cssClasses.DIALOG}-header` }, [
        icon,
        h(
          'h5',
          {
            class: cls('semi-typography', 'semi-typography-primary', 'semi-typography-normal', 'semi-typography-h5', `${cssClasses.DIALOG}-title`),
            id: `${cssClasses.DIALOG}-title`,
            'x-semi-prop': 'title',
          },
          [title]
        ),
        closer,
      ]);
    };

    const renderBody = () => {
      const { bodyStyle } = props;
      const bodyCls = cls(`${cssClasses.DIALOG}-body`, { [`${cssClasses.DIALOG}-withIcon`]: hasIcon() });
      const children = slots.default?.();
      const hasHeader = hasTitle() || props.hasHeader;
      if (hasHeader) {
        return h('div', { class: bodyCls, id: `${cssClasses.DIALOG}-body`, style: bodyStyle, 'x-semi-prop': 'children' }, children);
      }
      return h('div', { class: `${cssClasses.DIALOG}-body-wrapper` }, [
        renderIcon(),
        h('div', { class: bodyCls, style: bodyStyle, 'x-semi-prop': 'children' }, children),
        renderCloseBtn(),
      ]);
    };

    const getDialogElement = () => {
      const style: CSSProperties = {};
      const digCls = cls(`${cssClasses.DIALOG}`, {
        [`${cssClasses.DIALOG}-centered`]: props.centered,
        [`${cssClasses.DIALOG}-${props.size}`]: props.size,
      });
      if (props.width) style.width = toPx(props.width);
      if (props.height) style.height = toPx(props.height);
      if (props.isFullScreen) {
        style.width = '100%';
        style.height = '100%';
        style.margin = 'unset';
      }
      const body = renderBody();
      const header = renderHeader();
      const footerNode = slots.footer ? slots.footer() : props.footer ? normalizeNode(props.footer) : null;
      const footer = footerNode ? h('div', { class: `${cssClasses.DIALOG}-footer`, 'x-semi-prop': 'footer' }, [footerNode]) : null;
      const modalContentElement = h(
        'div',
        {
          role: 'dialog',
          ref: modalDialogRef,
          'aria-modal': 'true',
          'aria-labelledby': `${cssClasses.DIALOG}-title`,
          'aria-describedby': `${cssClasses.DIALOG}-body`,
          tabindex: -1,
          onAnimationend: props.onAnimationEnd,
          class: cls([
            `${cssClasses.DIALOG}-content`,
            props.contentClassName,
            {
              [`${cssClasses.DIALOG}-content-fullScreen`]: props.isFullScreen,
              [`${cssClasses.DIALOG}-content-height-set`]: props.height || _get(props.style, 'height'),
            },
          ]),
        },
        [header, body, footer]
      );
      return h(
        'div',
        {
          key: 'dialog-element',
          class: digCls,
          onMousedown: onDialogMouseDown,
          style: { ...(props.style || {}), ...style },
          id: dialogId,
        },
        [props.modalRender ? props.modalRender(modalContentElement) : modalContentElement]
      );
    };

    return () => {
      const { maskClosable, className, getPopupContainer, maskFixed } = props;
      const direction = props.direction ?? context.direction;
      const classList = cls(className, attrs.class as any, {
        [`${cssClasses.DIALOG}-popup`]: getPopupContainer && getPopupContainer() !== globalThis?.document?.body && !maskFixed,
        [`${cssClasses.DIALOG}-fixed`]: maskFixed,
        [`${cssClasses.DIALOG}-rtl`]: direction === 'rtl',
      });
      const dataAttr = getDataAttr(attrs as any);
      return h('div', { class: classList, ...dataAttr }, [
        getMaskElement(),
        h(
          'div',
          {
            role: 'none',
            class: cls({
              [`${cssClasses.DIALOG}-wrap`]: true,
              [`${cssClasses.DIALOG}-wrap-center`]: props.centered,
            }),
            onClick: maskClosable ? onMaskClick : undefined,
            onMouseup: maskClosable ? onMaskMouseUp : undefined,
            ...props.contentExtraProps,
          },
          [getDialogElement()]
        ),
      ]);
    };
  },
});

export default ModalContent;
