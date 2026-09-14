import { defineComponent, h, watch, onMounted, onBeforeUnmount, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/sideSheet/constants';
import SideSheetFoundation from '@douyinfe/semi-foundation/lib/es/sideSheet/sideSheetFoundation';
import '@douyinfe/semi-foundation/lib/es/sideSheet/sideSheet.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import CSSAnimation from '../_cssAnimation';
import Portal from '../_portal/Portal';
import { getScrollbarWidth } from '../_utils';
import SideSheetContent from './SideSheetContent';

const prefixCls = cssClasses.PREFIX;
const defaultHeight = strings.HEIGHT;

export type SideSheetPlacement = (typeof strings.PLACEMENT)[number];
export type SideSheetSize = (typeof strings.SIZE)[number];

const nodeType = [String, Number, Object, Array, Function, Boolean] as PropType<any>;

export const sideSheetProps = {
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  closable: { type: Boolean, default: true },
  closeIcon: { type: nodeType, default: undefined },
  disableScroll: { type: Boolean, default: true },
  getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
  height: { type: [Number, String] as PropType<number | string>, default: undefined },
  mask: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  maskStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  motion: { type: Boolean, default: true },
  placement: { type: String as PropType<SideSheetPlacement>, default: 'right' },
  size: { type: String as PropType<SideSheetSize>, default: 'small' },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  title: { type: nodeType, default: undefined },
  visible: { type: Boolean, default: false },
  width: { type: [Number, String] as PropType<number | string>, default: undefined },
  zIndex: { type: Number, default: 1000 },
  closeOnEsc: { type: Boolean, default: false },
  footer: { type: nodeType, default: null },
  keepDOM: { type: Boolean, default: false },
  canVerticalSetWidth: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  /** React `afterVisibleChange` (also emitted as `afterVisibleChange`) */
  afterVisibleChange: { type: Function as PropType<(visible: boolean) => void>, default: undefined },
};

export const sideSheetEmits = ['update:visible', 'cancel', 'afterVisibleChange'];

const SideSheet = defineComponent({
  name: 'SideSheet',
  inheritAttrs: false,
  props: sideSheetProps,
  emits: sideSheetEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, {
      displayNone: !props.visible,
    });

    let bodyOverflow = '';
    let scrollBarWidth = 0;
    let originBodyWidth = '100%';

    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);

    const adapter = {
      ...baseAdapter,
      disabledBodyScroll: () => {
        const { getPopupContainer } = props;
        bodyOverflow = document.body.style.overflow || '';
        if (!getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = 'hidden';
          document.body.style.width = `calc(${originBodyWidth || '100%'} - ${scrollBarWidth}px)`;
        }
      },
      enabledBodyScroll: () => {
        const { getPopupContainer } = props;
        if (!getPopupContainer && bodyOverflow !== 'hidden') {
          document.body.style.overflow = bodyOverflow;
          document.body.style.width = originBodyWidth;
        }
      },
      notifyCancel: (e: any) => {
        // React `onCancel` -> `emit('cancel')` (an `onCancel` listener is resolved by Vue automatically)
        emit('cancel', e);
        emit('update:visible', false);
      },
      notifyVisibleChange: (visible: boolean) => {
        props.afterVisibleChange && props.afterVisibleChange(visible);
        emit('afterVisibleChange', visible);
      },
      setOnKeyDownListener: () => {
        if (typeof window !== 'undefined') {
          window.addEventListener('keydown', handleKeyDown);
        }
      },
      removeKeyDownListener: () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', handleKeyDown);
        }
      },
      toggleDisplayNone: (displayNone: boolean) => {
        if (displayNone !== state.displayNone) {
          state.displayNone = displayNone;
        }
      },
    };

    const foundation = new (SideSheetFoundation as any)(adapter);

    const handleCancel = (e: any) => foundation.handleCancel(e);
    const updateState = () => foundation.toggleDisplayNone(!props.visible);

    // getDerivedStateFromProps + componentDidUpdate
    watch(
      () => [props.visible, props.motion] as const,
      ([visible, motion], prev) => {
        const prevVisible = prev ? prev[0] : undefined;
        if (visible && state.displayNone) {
          state.displayNone = false;
        }
        if (!visible && !motion && !state.displayNone) {
          state.displayNone = true;
        }
        if (!prevVisible && visible) {
          foundation.beforeShow();
        }
        if (prevVisible && !visible) {
          foundation.afterHide();
        }
      }
    );
    watch(
      () => state.displayNone,
      (displayNone) => {
        foundation.onVisibleChange(!displayNone);
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
      }
    });

    expose({ foundation });

    return () => {
      const { placement, className, width, height, motion, visible, style, maskStyle, size, zIndex, getPopupContainer, keepDOM, canVerticalSetWidth } = props;
      let wrapperStyle: CSSProperties = { zIndex };
      if (getPopupContainer) {
        wrapperStyle = { zIndex, position: 'static' };
      }
      const direction = context.direction;
      const isVertical = placement === 'left' || placement === 'right';
      const isHorizontal = placement === 'top' || placement === 'bottom';
      const sheetHeight = isHorizontal ? (height ? height : defaultHeight) : '100%';
      const classList = cls(prefixCls, className, attrs.class as any, {
        [`${prefixCls}-${placement}`]: placement,
        [`${prefixCls}-popup`]: getPopupContainer,
        [`${prefixCls}-horizontal`]: isHorizontal,
        [`${prefixCls}-rtl`]: direction === 'rtl',
        [`${prefixCls}-hidden`]: keepDOM && state.displayNone,
      });
      const { class: _c, style: _s, ...restAttrs } = attrs as any;
      const widthProps = isVertical || canVerticalSetWidth ? (width ? { width } : {}) : { width: '100%' };
      const shouldRender = visible || keepDOM || (motion && !state.displayNone); /* When there is animation, we use displayNone to judge whether animation is ended and judge whether to unmount content */

      // Since user could change animate duration, we don't know which animation end first. So we call updateState func twice.
      return h(
        CSSAnimation,
        {
          motion,
          animationState: visible ? 'enter' : 'leave',
          startClassName: visible ? `${prefixCls}-animation-mask_show` : `${prefixCls}-animation-mask_hide`,
          onAnimationEnd: updateState,
        },
        {
          default: ({ animationClassName: maskAnimationClassName, animationEventsNeedBind: maskAnimationEventsNeedBind }: any) =>
            h(
              CSSAnimation,
              {
                motion,
                animationState: visible ? 'enter' : 'leave',
                startClassName: visible ? `${prefixCls}-animation-content_show_${placement}` : `${prefixCls}-animation-content_hide_${placement}`,
                onAnimationEnd: updateState /* for no mask case */,
              },
              {
                default: ({ animationClassName, animationStyle, animationEventsNeedBind }: any) =>
                  shouldRender
                    ? h(
                        Portal,
                        { getPopupContainer, style: wrapperStyle },
                        {
                          default: () =>
                            h(
                              SideSheetContent,
                              {
                                ...restAttrs,
                                ...widthProps,
                                mask: props.mask,
                                maskClosable: props.maskClosable,
                                closable: props.closable,
                                closeIcon: props.closeIcon,
                                title: props.title,
                                footer: props.footer,
                                bodyStyle: props.bodyStyle,
                                headerStyle: props.headerStyle,
                                'aria-label': props.ariaLabel ?? (restAttrs as any)['aria-label'],
                                size,
                                className: classList,
                                height: sheetHeight,
                                onClose: handleCancel,
                                maskExtraProps: maskAnimationEventsNeedBind,
                                wrapperExtraProps: animationEventsNeedBind,
                                dialogClassName: animationClassName,
                                maskClassName: maskAnimationClassName,
                                maskStyle: { ...maskStyle },
                                style: { ...animationStyle, ...style },
                              },
                              {
                                default: slots.default,
                                title: slots.title,
                                footer: slots.footer,
                                closeIcon: slots.closeIcon,
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

(SideSheet as any).elementType = 'SideSheet';

export default SideSheet;
