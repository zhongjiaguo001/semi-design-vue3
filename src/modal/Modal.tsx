import { defineComponent, h, watch, onMounted, onBeforeUnmount, Fragment } from 'vue';
import type { PropType, CSSProperties, VNodeChild } from 'vue';
import cls from 'classnames';
import isPromise from '@douyinfe/semi-foundation/lib/es/utils/isPromise';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/modal/constants';
import ModalFoundation from '@douyinfe/semi-foundation/lib/es/modal/modalFoundation';
import '@douyinfe/semi-foundation/lib/es/modal/modal.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useLocale } from '../locale';
import CSSAnimation from '../_cssAnimation';
import Portal from '../_portal/Portal';
import Button from '../button/Button';
import { getScrollbarWidth } from '../_utils';
import ModalContent from './ModalContent';

export type ModalSize = (typeof strings.SIZE)[number];
export type OKType = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type Directions = (typeof strings.directions)[number];

const nodeType = [String, Number, Object, Array, Function, Boolean] as PropType<any>;

export const modalProps = {
  mask: { type: Boolean, default: true },
  closable: { type: Boolean, default: true },
  centered: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  width: { type: [String, Number] as PropType<string | number>, default: undefined },
  height: { type: [String, Number] as PropType<string | number>, default: undefined },
  confirmLoading: { type: Boolean, default: undefined },
  cancelLoading: { type: Boolean, default: undefined },
  okText: { type: String, default: undefined },
  okType: { type: String as PropType<OKType>, default: 'primary' },
  cancelText: { type: String, default: undefined },
  maskClosable: { type: Boolean, default: true },
  /** React `onCancel`: may return a promise (button shows loading until it settles) */
  onCancel: { type: Function as PropType<(e: MouseEvent) => void | Promise<any>>, default: undefined },
  /** React `onOk`: may return a promise (button shows loading until it settles) */
  onOk: { type: Function as PropType<(e: MouseEvent) => void | Promise<any>>, default: undefined },
  modalRender: { type: Function as PropType<(node: VNodeChild) => VNodeChild>, default: undefined },
  afterClose: { type: Function as PropType<() => void>, default: undefined },
  okButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  cancelButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  modalContentClass: { type: String, default: undefined },
  maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  zIndex: { type: Number, default: 1000 },
  title: { type: nodeType, default: undefined },
  icon: { type: nodeType, default: undefined },
  header: { type: nodeType, default: undefined },
  footer: { type: nodeType, default: undefined },
  hasCancel: { type: Boolean, default: true },
  motion: { type: Boolean, default: true },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  maskFixed: { type: Boolean, default: false },
  closeIcon: { type: nodeType, default: undefined },
  closeOnEsc: { type: Boolean, default: true },
  size: { type: String as PropType<ModalSize>, default: 'small' },
  keepDOM: { type: Boolean, default: false },
  lazyRender: { type: Boolean, default: true },
  direction: { type: String as PropType<Directions>, default: undefined },
  fullScreen: { type: Boolean, default: false },
  footerFill: { type: Boolean, default: false },
  preventScroll: { type: Boolean, default: false },
};

export const modalEmits = ['update:visible', 'afterClose'];

interface ModalState {
  displayNone: boolean;
  isFullScreen: boolean;
  onOKReturnPromiseStatus?: 'pending' | 'fulfilled' | 'rejected';
  onCancelReturnPromiseStatus?: 'pending' | 'fulfilled' | 'rejected';
}

const Modal = defineComponent({
  name: 'Modal',
  inheritAttrs: false,
  props: modalProps,
  emits: modalEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const { state, adapter: baseAdapter, propsView } = useBaseComponent<any, ModalState>(props as any, {
      displayNone: !props.visible,
      isFullScreen: props.fullScreen,
      onOKReturnPromiseStatus: undefined,
      onCancelReturnPromiseStatus: undefined,
    });
    const { locale } = useLocale('Modal');

    let bodyOverflow: string | null = null;
    let scrollBarWidth = 0;
    let originBodyWidth = '100%';
    let haveRendered = false;

    const isBodyContainer = () => {
      const { getPopupContainer } = props;
      return !getPopupContainer || getPopupContainer() === globalThis?.document?.body;
    };

    /**
     * Close (emit `update:visible`) once the callback result settles. A rejected promise keeps the modal
     * open; the returned promise always resolves so the foundation does not re-throw the rejection.
     */
    const closeAfter = (result: any) => {
      if (isPromise(result)) {
        return (result as Promise<any>).then(
          (v) => {
            emit('update:visible', false);
            return v;
          },
          () => undefined
        );
      }
      emit('update:visible', false);
      return result;
    };

    const adapter = {
      ...baseAdapter,
      getProps: () => propsView,
      disabledBodyScroll: () => {
        bodyOverflow = document.body.style.overflow || '';
        if (isBodyContainer() && bodyOverflow !== 'hidden') {
          document.body.style.overflow = 'hidden';
          document.body.style.width = `calc(${originBodyWidth || '100%'} - ${scrollBarWidth}px)`;
        }
      },
      enabledBodyScroll: () => {
        if (isBodyContainer() && bodyOverflow !== null && bodyOverflow !== 'hidden') {
          document.body.style.overflow = bodyOverflow;
          document.body.style.width = originBodyWidth;
        }
      },
      notifyCancel: (e: any) => closeAfter(props.onCancel?.(e)),
      notifyOk: (e: any) => closeAfter(props.onOk?.(e)),
      notifyClose: () => {
        props.afterClose?.();
        emit('afterClose');
      },
      toggleDisplayNone: (displayNone: boolean, callback?: (d: boolean) => void) => {
        if (displayNone !== state.displayNone) {
          state.displayNone = displayNone;
          callback && callback(displayNone);
        }
      },
      notifyFullScreen: (isFullScreen: boolean) => {
        if (isFullScreen !== state.isFullScreen) {
          state.isFullScreen = isFullScreen;
        }
      },
    };

    const foundation = new (ModalFoundation as any)(adapter);

    const handleCancel = (e: any) => foundation.handleCancel(e);
    const handleOk = (e: any) => foundation.handleOk(e);
    const updateState = () => foundation.toggleDisplayNone(!props.visible);

    // getDerivedStateFromProps
    watch(
      () => props.fullScreen,
      (fullScreen) => {
        state.isFullScreen = fullScreen;
      }
    );
    watch(
      () => props.visible,
      (visible, prev) => {
        if (visible && state.displayNone) {
          state.displayNone = false;
        }
        // hide => show
        if (!prev && visible) {
          foundation.beforeShow();
        }
      }
    );
    watch(
      () => state.displayNone,
      (displayNone, prev) => {
        if (!prev && displayNone) {
          foundation.afterHide();
        }
      }
    );

    onMounted(() => {
      scrollBarWidth = getScrollbarWidth();
      originBodyWidth = document.body.style.width;
      if (props.visible) {
        foundation.beforeShow();
      }
    });

    onBeforeUnmount(() => {
      if (props.visible) {
        foundation.destroy();
      } else {
        foundation.enabledBodyScroll();
      }
    });

    const renderFooter = () => {
      const { okText, okType, cancelText, confirmLoading, cancelLoading, hasCancel, footerFill } = props;
      const cancelBtn = hasCancel
        ? h(
            Button,
            {
              'aria-label': 'cancel',
              onClick: handleCancel,
              loading: cancelLoading === undefined ? state.onCancelReturnPromiseStatus === 'pending' : cancelLoading,
              type: 'tertiary',
              block: footerFill,
              autofocus: true,
              ...props.cancelButtonProps,
              style: { ...(footerFill ? { marginLeft: 'unset' } : {}), ...(props.cancelButtonProps?.style || {}) },
              'x-semi-children-alias': 'cancelText',
            },
            () => cancelText || locale.value?.cancel
          )
        : null;
      const okBtn = h(
        Button,
        {
          'aria-label': 'confirm',
          type: okType,
          theme: 'solid',
          block: footerFill,
          loading: confirmLoading === undefined ? state.onOKReturnPromiseStatus === 'pending' : confirmLoading,
          onClick: handleOk,
          ...props.okButtonProps,
          'x-semi-children-alias': 'okText',
        },
        () => okText || locale.value?.confirm
      );
      return h('div', { class: cls({ [`${cssClasses.DIALOG}-footerfill`]: footerFill }) }, [cancelBtn, okBtn]);
    };

    const resolveFooter = () => {
      if (slots.footer) return slots.footer();
      if ('footer' in propsView) return props.footer;
      return renderFooter();
    };

    expose({ foundation });

    return () => {
      const { motion, maskStyle, keepDOM, style, zIndex, getPopupContainer, visible, modalContentClass, className, lazyRender } = props;
      let wrapperStyle: CSSProperties = { zIndex };
      if (getPopupContainer && getPopupContainer() !== globalThis?.document?.body) {
        wrapperStyle = { zIndex, position: 'static' };
      }
      const classList = cls(className, attrs.class as any, {
        [`${cssClasses.DIALOG}-displayNone`]: keepDOM && state.displayNone,
      });
      const shouldRender =
        visible ||
        (keepDOM && (!lazyRender || haveRendered)) ||
        (motion && !state.displayNone); /* When there is animation, we use displayNone to judge whether animation is ended and judge whether to unmount content */
      if (shouldRender) {
        haveRendered = true;
      }
      const hasHeader = Boolean(slots.header) || 'header' in propsView;
      const { class: _c, style: _s, ...restAttrs } = attrs as any;

      return h(
        CSSAnimation,
        {
          motion,
          animationState: visible ? 'enter' : 'leave',
          startClassName: visible ? `${cssClasses.DIALOG}-content-animate-show` : `${cssClasses.DIALOG}-content-animate-hide`,
          onAnimationEnd: updateState,
        },
        {
          default: ({ animationClassName, animationEventsNeedBind }: any) =>
            h(
              CSSAnimation,
              {
                motion,
                animationState: visible ? 'enter' : 'leave',
                startClassName: visible ? `${cssClasses.DIALOG}-mask-animate-show` : `${cssClasses.DIALOG}-mask-animate-hide`,
                onAnimationEnd: updateState,
              },
              {
                default: ({ animationClassName: maskAnimationClassName, animationEventsNeedBind: maskAnimationEventsNeedBind }: any) =>
                  shouldRender
                    ? h(
                        Portal,
                        { style: wrapperStyle, getPopupContainer },
                        {
                          default: () =>
                            h(
                              ModalContent,
                              {
                                ...restAttrs,
                                mask: props.mask,
                                maskClosable: props.maskClosable,
                                closable: props.closable,
                                centered: props.centered,
                                size: props.size,
                                width: props.width,
                                height: props.height,
                                title: props.title,
                                icon: props.icon,
                                closeIcon: props.closeIcon,
                                bodyStyle: props.bodyStyle,
                                maskFixed: props.maskFixed,
                                closeOnEsc: props.closeOnEsc,
                                preventScroll: props.preventScroll,
                                modalRender: props.modalRender,
                                direction: props.direction,
                                header: props.header,
                                hasHeader,
                                contentExtraProps: animationEventsNeedBind,
                                maskExtraProps: maskAnimationEventsNeedBind,
                                isFullScreen: state.isFullScreen,
                                contentClassName: cls(animationClassName, modalContentClass),
                                maskClassName: maskAnimationClassName,
                                className: classList,
                                getPopupContainer,
                                maskStyle,
                                style,
                                footer: resolveFooter(),
                                onClose: handleCancel,
                              },
                              {
                                default: slots.default,
                                title: slots.title,
                                icon: slots.icon,
                                closeIcon: slots.closeIcon,
                                header: slots.header,
                              }
                            ),
                        }
                      )
                    : h(Fragment, null, []),
              }
            ),
        }
      );
    };
  },
});

(Modal as any).elementType = 'Modal';

export default Modal;
