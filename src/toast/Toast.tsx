import { defineComponent, h, ref, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import ToastFoundation from '@douyinfe/semi-foundation/lib/es/toast/toastFoundation';
import { numbers, cssClasses, strings } from '@douyinfe/semi-foundation/lib/es/toast/constants';
import '@douyinfe/semi-foundation/lib/es/toast/toast.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import Button from '../button/Button';
import { IconClose, IconAlertTriangle, IconInfoCircle, IconTickCircle, IconAlertCircle } from '../icons/generated';
import { isSemiIcon, normalizeNode, cloneVNode, toPx } from '../_utils';

const prefixCls = cssClasses.PREFIX;

export type ToastType = (typeof strings.types)[number];
export type ToastTheme = (typeof strings.themes)[number];
export type ToastDirection = (typeof strings.directions)[number];

export const toastProps = {
  /** custom toast id (official API: number; strings are accepted too) */
  id: { type: [String, Number] as PropType<string | number>, default: undefined },
  /** React `onClose` (called when the toast closes) */
  onClose: { type: Function as PropType<() => void>, default: undefined },
  content: { type: [String, Number, Object, Array, Function] as PropType<any>, default: '' },
  /** called by the list to remove this toast */
  close: { type: Function as PropType<(id: string | number) => void>, default: undefined },
  duration: { type: Number, default: numbers.duration },
  theme: { type: String as PropType<ToastTheme>, default: 'normal' },
  type: { type: String as PropType<ToastType>, default: undefined },
  textMaxWidth: { type: [String, Number] as PropType<string | number>, default: 450 },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  className: { type: String, default: undefined },
  showClose: { type: Boolean, default: true },
  stack: { type: Boolean, default: false },
  stackExpanded: { type: Boolean, default: false },
  icon: { type: [String, Object, Function, Array] as PropType<any>, default: undefined },
  direction: { type: String as PropType<ToastDirection>, default: undefined },
  positionInList: { type: Object as PropType<{ length: number; index: number }>, default: undefined },
  onAnimationStart: { type: Function as PropType<(e?: any) => void>, default: undefined },
  onAnimationEnd: { type: Function as PropType<(e?: any) => void>, default: undefined },
};

const Toast = defineComponent({
  name: 'Toast',
  inheritAttrs: false,
  props: toastProps,
  setup(props, { attrs, slots, expose }) {
    const context = useConfigContext();
    const { adapter: baseAdapter } = useBaseComponent(props as any, {});
    const toastEle = ref<HTMLElement | null>(null);

    const adapter = {
      ...baseAdapter,
      notifyWrapperToRemove: (id: string) => {
        props.close && props.close(id);
      },
      notifyClose: () => {
        props.onClose && props.onClose();
      },
    };
    const foundation = new (ToastFoundation as any)(adapter);

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const clearCloseTimer = () => foundation.clearCloseTimer_();
    const startCloseTimer = () => foundation.startCloseTimer_();
    const restartCloseTimer = () => foundation.restartCloseTimer();
    const close = (e?: any) => foundation.close(e);

    const renderIcon = () => {
      const { type } = props;
      const iconMap: Record<string, any> = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        error: IconAlertCircle,
      };
      const iconSize = 'large';
      const iconCls = cls(`${prefixCls}-icon`, `${prefixCls}-icon-${type}`);
      const custom: any = slots.icon ? slots.icon() : normalizeNode(props.icon);
      if (custom) {
        return isSemiIcon(custom) ? cloneVNode(custom, { size: iconSize, class: `${prefixCls}-icon` }) : custom;
      }
      if (type && iconMap[type]) {
        return h(iconMap[type], { size: iconSize, class: iconCls });
      }
      return null;
    };

    expose({ foundation, clearCloseTimer, startCloseTimer, restartCloseTimer, close, getId: () => foundation._id });

    return () => {
      const { type, theme, showClose, textMaxWidth, className, style } = props;
      const direction = props.direction || context.direction;
      const toastCls = cls(prefixCls, className, attrs.class as any, {
        [`${prefixCls}-${type}`]: true,
        [`${prefixCls}-${theme}`]: theme === 'light',
        [`${prefixCls}-rtl`]: direction === 'rtl',
      });
      const textStyle: CSSProperties = { maxWidth: toPx(textMaxWidth) };
      const reservedIndex = props.positionInList ? props.positionInList.length - props.positionInList.index - 1 : 0;
      const content = slots.default ? slots.default() : normalizeNode(props.content);
      const toastNode = h(
        'div',
        {
          ref: toastEle,
          role: 'alert',
          'aria-label': `${type ? type : 'default'} type`,
          class: toastCls,
          style: { ...(style || {}), transform: `translate3d(0,0,${reservedIndex * -10}px)` },
          onMouseenter: clearCloseTimer,
          onMouseleave: startCloseTimer,
          onAnimationstart: props.onAnimationStart,
          onAnimationend: props.onAnimationEnd,
        },
        [
          h('div', { class: `${prefixCls}-content` }, [
            renderIcon(),
            h('span', { class: `${prefixCls}-content-text`, style: textStyle, 'x-semi-prop': 'content' }, [content]),
            showClose
              ? h('div', { class: `${prefixCls}-close-button` }, [
                  h(Button, { onClick: (e: MouseEvent) => close(e), type: 'tertiary', theme: 'borderless', size: 'small' }, { icon: () => h(IconClose, { 'x-semi-prop': 'icon' }) }),
                ])
              : null,
          ]),
        ]
      );
      if (props.stack) {
        const height = (props.stackExpanded && toastEle.value && getComputedStyle(toastEle.value).height) || 0;
        return h('div', { class: `${prefixCls}-zero-height-wrapper`, style: { height: toPx(height) } }, [toastNode]);
      }
      return toastNode;
    };
  },
});

(Toast as any).elementType = 'Toast';

export default Toast;
