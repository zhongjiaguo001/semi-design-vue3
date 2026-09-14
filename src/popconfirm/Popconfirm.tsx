import { defineComponent, h, ref, watch, Fragment } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import _omit from 'lodash/omit';
import _get from 'lodash/get';
import { cssClasses, numbers } from '@douyinfe/semi-foundation/lib/es/popconfirm/constants';
import PopconfirmFoundation from '@douyinfe/semi-foundation/lib/es/popconfirm/popconfirmFoundation';
import '@douyinfe/semi-foundation/lib/es/popconfirm/popconfirm.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import { useLocale } from '../locale';
import Popover, { popoverProps } from '../popover/Popover';
import { tooltipEmits } from '../tooltip/Tooltip';
import type { Position, Trigger } from '../tooltip/Tooltip';
import Button from '../button/Button';
import type { ButtonType } from '../button/Button';
import { IconClose, IconAlertTriangle } from '../icons/generated';
import { normalizeNode, isVNode, flattenChildren } from '../_utils';

const { content: _c, title: _t, className: _cn, style: _s, position: _p, trigger: _tr, visible: _v, zIndex: _z, prefixCls: _pc, stopPropagation: _sp, ...restPopoverProps } = popoverProps as any;

export const popconfirmProps = {
  ...(restPopoverProps as Omit<typeof popoverProps, 'content' | 'title' | 'className' | 'style' | 'position' | 'trigger' | 'visible' | 'zIndex' | 'prefixCls' | 'stopPropagation'>),
  motion: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  content: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
  title: { type: [String, Number, Object, Array, Function] as PropType<any>, default: undefined },
  prefixCls: { type: String, default: cssClasses.PREFIX },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  icon: { type: [String, Number, Object, Array, Function, Boolean] as PropType<any>, default: () => h(IconAlertTriangle, { size: 'extra-large' }) },
  okText: { type: String, default: undefined },
  okType: { type: String as PropType<ButtonType>, default: 'primary' },
  cancelText: { type: String, default: undefined },
  cancelType: { type: String as PropType<ButtonType>, default: 'tertiary' },
  /** React `onCancel`: may return a promise (cancel button shows loading until it settles) */
  onCancel: { type: Function as PropType<(e: MouseEvent) => void | Promise<any>>, default: undefined },
  /** React `onConfirm`: may return a promise (ok button shows loading until it settles) */
  onConfirm: { type: Function as PropType<(e: MouseEvent) => void | Promise<any>>, default: undefined },
  visible: { type: Boolean, default: undefined },
  defaultVisible: { type: Boolean, default: false },
  okButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  cancelButtonProps: { type: Object as PropType<Record<string, any>>, default: undefined },
  stopPropagation: { type: [Boolean, String] as PropType<boolean | string>, default: true },
  showCloseIcon: { type: Boolean, default: true },
  zIndex: { type: Number, default: numbers.DEFAULT_Z_INDEX },
  trigger: { type: String as PropType<Trigger>, default: 'click' },
  position: { type: String as PropType<Position>, default: undefined },
};

export const popconfirmEmits = [...tooltipEmits, 'update:visible'];

interface PopconfirmState {
  cancelLoading: boolean;
  confirmLoading: boolean;
  visible: boolean;
}

const Popconfirm = defineComponent({
  name: 'Popconfirm',
  inheritAttrs: false,
  props: popconfirmProps,
  emits: popconfirmEmits,
  setup(props, { slots, attrs, emit, expose }) {
    const context = useConfigContext();
    const { locale } = useLocale('Popconfirm');
    const { state, adapter: baseAdapter, propsView, isControlled } = useBaseComponent<any, PopconfirmState>(props as any, {
      cancelLoading: false,
      confirmLoading: false,
      visible: props.defaultVisible || false,
    });
    const footerRef = ref<HTMLElement | null>(null);
    const popoverRef = ref<any>(null);

    const adapter = {
      ...baseAdapter,
      getProps: () => propsView,
      setVisible: (visible: boolean) => {
        state.visible = visible;
      },
      updateConfirmLoading: (loading: boolean) => {
        state.confirmLoading = loading;
      },
      updateCancelLoading: (loading: boolean) => {
        state.cancelLoading = loading;
      },
      // `onConfirm` / `onCancel` are props (Vue's `@confirm` / `@cancel` compile to them) because the
      // foundation needs their return value (a promise turns the button into loading state)
      notifyConfirm: (e: any) => props.onConfirm?.(e),
      notifyCancel: (e: any) => props.onCancel?.(e),
      notifyVisibleChange: (visible: boolean) => {
        emit('update:visible', visible);
        emit('visibleChange', visible);
      },
      notifyClickOutSide: (e: any) => emit('clickOutSide', e),
      focusCancelButton: () => {
        const buttonNode = footerRef.value?.querySelector('[data-type=cancel]') as HTMLElement | null;
        buttonNode?.focus({ preventScroll: true });
      },
      focusOkButton: () => {
        const buttonNode = footerRef.value?.querySelector('[data-type=ok]') as HTMLElement | null;
        buttonNode?.focus({ preventScroll: true });
      },
      focusPrevFocusElement: () => {
        popoverRef.value?.focusTrigger();
      },
    };
    const foundation = new (PopconfirmFoundation as any)(adapter);

    // getDerivedStateFromProps
    watch(
      () => props.visible,
      (visible) => {
        if (isControlled('visible')) state.visible = Boolean(visible);
      },
      { immediate: true }
    );

    const handleCancel = (e: MouseEvent) => foundation.handleCancel(e);
    const handleConfirm = (e: MouseEvent) => foundation.handleConfirm(e);
    const handleVisibleChange = (visible: boolean) => foundation.handleVisibleChange(visible);
    const handleClickOutSide = (e: any) => foundation.handleClickOutSide(e);
    const stopImmediatePropagation = (e: Event) => e && e.stopImmediatePropagation && e.stopImmediatePropagation();

    const renderControls = () => {
      const { okText, cancelText, okType, cancelType, cancelButtonProps, okButtonProps } = props;
      const { cancelLoading, confirmLoading } = state;
      return h(Fragment, null, [
        h(
          Button,
          {
            'data-type': 'cancel',
            type: cancelType,
            onClick: handleCancel,
            loading: cancelLoading,
            ..._omit(cancelButtonProps, 'autoFocus'),
          },
          () => cancelText || _get(locale.value, 'cancel')
        ),
        h(
          Button,
          {
            'data-type': 'ok',
            type: okType,
            theme: 'solid',
            onClick: handleConfirm,
            loading: confirmLoading,
            ..._omit(okButtonProps, 'autoFocus'),
          },
          () => okText || _get(locale.value, 'confirm')
        ),
      ]);
    };

    const renderConfirmPopCard = ({ initialFocusRef }: any) => {
      const { className, style, cancelType, prefixCls, showCloseIcon } = props;
      const direction = context.direction;
      const popCardCls = cls(prefixCls, className, { [`${prefixCls}-rtl`]: direction === 'rtl' });
      const titleNode = slots.title ? slots.title() : normalizeNode(props.title);
      const showTitle = Boolean(slots.title) || (props.title !== null && typeof props.title !== 'undefined');
      const contentNode = slots.content
        ? slots.content({ initialFocusRef })
        : typeof props.content === 'function' && !(props.content as any).setup && !(props.content as any).render
          ? props.content({ initialFocusRef })
          : normalizeNode(props.content);
      const showContent = Boolean(slots.content) || !(props.content === null || typeof props.content === 'undefined');
      const iconNode: any = slots.icon ? flattenChildren(slots.icon())[0] : normalizeNode(props.icon);
      const hasIcon = isVNode(iconNode);
      const bodyCls = cls({ [`${prefixCls}-body`]: true, [`${prefixCls}-body-withIcon`]: hasIcon });
      return h('div', { class: popCardCls, onClick: stopImmediatePropagation, style }, [
        h('div', { class: `${prefixCls}-inner` }, [
          h('div', { class: `${prefixCls}-header` }, [
            hasIcon ? h('i', { class: `${prefixCls}-header-icon`, 'x-semi-prop': 'icon' }, [iconNode]) : null,
            h('div', { class: `${prefixCls}-header-body` }, [showTitle ? h('div', { class: `${prefixCls}-header-title`, 'x-semi-prop': 'title' }, [titleNode]) : null]),
            showCloseIcon
              ? h(Button, { class: `${prefixCls}-btn-close`, size: 'small', theme: 'borderless', type: cancelType, onClick: handleCancel }, { icon: () => h(IconClose) })
              : null,
          ]),
          showContent ? h('div', { class: bodyCls, 'x-semi-prop': 'content' }, [contentNode]) : null,
          h('div', { class: `${prefixCls}-footer`, ref: footerRef }, [renderControls()]),
        ]),
      ]);
    };

    expose({
      foundation,
      focusTrigger: () => popoverRef.value?.focusTrigger(),
      rePosition: () => popoverRef.value?.rePosition(),
    });

    return () => {
      // rtl changes the default position
      const direction = context.direction;
      const defaultPosition: Position = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
      const {
        className: _cls,
        prefixCls: _pre,
        disabled,
        style: _sty,
        position,
        content: _co,
        title: _ti,
        icon: _ic,
        okText: _ot,
        okType: _oty,
        cancelText: _ct,
        cancelType: _cty,
        onCancel: _oc,
        onConfirm: _ocf,
        visible: _vis,
        defaultVisible: _dv,
        okButtonProps: _obp,
        cancelButtonProps: _cbp,
        showCloseIcon: _sci,
        ...rest
      } = props as any;
      const children = slots.default?.();
      if (disabled) {
        return children;
      }
      const { visible } = state;
      const popProps: Record<string, any> = {
        onVisibleChange: handleVisibleChange,
        className: cssClasses.POPOVER,
        onClickOutSide: handleClickOutSide,
        onEscKeyDown: (e: any) => emit('escKeyDown', e),
        onAfterClose: () => emit('afterClose'),
      };
      if (isControlled('visible')) {
        popProps.trigger = 'custom';
      }
      return h(
        Popover,
        {
          ...attrs,
          ...rest,
          ref: popoverRef,
          visible,
          position: position || defaultPosition,
          ...popProps,
        },
        {
          default: () => children,
          // a render function so the content updates whenever Popconfirm state changes
          content: ({ initialFocusRef }: any) => renderConfirmPopCard({ initialFocusRef }),
        }
      );
    };
  },
});

(Popconfirm as any).elementType = 'Popconfirm';

export default Popconfirm;
