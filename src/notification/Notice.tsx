import { defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import type { PropType, CSSProperties } from 'vue';
import cls from 'classnames';
import { cssClasses, numbers, strings } from '@douyinfe/semi-foundation/lib/es/notification/constants';
import NotificationFoundation from '@douyinfe/semi-foundation/lib/es/notification/notificationFoundation';
import { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/notification/notification.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import Button from '../button/Button';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '../icons/generated';
import { isSemiIcon, normalizeNode, cloneVNode } from '../_utils';

const prefixCls = cssClasses.NOTICE;
const { types } = strings;

export type NoticePosition = 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type NoticeType = (typeof strings.types)[number];
export type NoticeTheme = (typeof strings.themes)[number];
export type NoticeDirection = (typeof strings.directions)[number];

const nodeType = [String, Number, Object, Array, Function] as PropType<any>;

export const noticeProps = {
  duration: { type: Number, default: numbers.duration },
  id: { type: String, default: '' },
  title: { type: nodeType, default: '' },
  content: { type: nodeType, default: '' },
  position: { type: String as PropType<NoticePosition>, default: undefined },
  type: { type: String as PropType<NoticeType>, default: undefined },
  theme: { type: String as PropType<NoticeTheme>, default: 'normal' },
  icon: { type: nodeType, default: undefined },
  /** React `onClick` */
  onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
  /** React `onClose`: called when the notice closes (timer / close button) */
  onClose: { type: Function as PropType<() => void>, default: undefined },
  /** React `onCloseClick`: called when the close button is clicked */
  onCloseClick: { type: Function as PropType<(id: string | number) => void>, default: undefined },
  showClose: { type: Boolean, default: true },
  /** private: called by the list to remove this notice */
  close: { type: Function as PropType<(id: string) => void>, default: undefined },
  onHookClose: { type: Function as PropType<() => void>, default: undefined },
  direction: { type: String as PropType<NoticeDirection>, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<CSSProperties>, default: undefined },
  onAnimationStart: { type: Function as PropType<(e?: any) => void>, default: undefined },
  onAnimationEnd: { type: Function as PropType<(e?: any) => void>, default: undefined },
};

const Notice = defineComponent({
  name: 'Notice',
  inheritAttrs: false,
  props: noticeProps,
  setup(props, { attrs, slots, expose }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter } = useBaseComponent(props as any, { visible: true });
    const titleID = getUuidShort({});

    const adapter = {
      ...baseAdapter,
      notifyWrapperToRemove: (id: string) => {
        props.close && props.close(id);
      },
      notifyClose: () => {
        props.onClose && props.onClose();
        props.onHookClose && props.onHookClose();
      },
    };
    const foundation = new (NotificationFoundation as any)(adapter);

    onMounted(() => foundation.init());
    onBeforeUnmount(() => foundation.destroy());

    const clearCloseTimer = () => foundation._clearCloseTimer();
    const startCloseTimer = () => foundation._startCloseTimer();
    const restartCloseTimer = () => foundation.restartCloseTimer();
    const close = (e?: any) => {
      props.onCloseClick && props.onCloseClick(props.id);
      foundation.close(e);
    };
    const notifyClick = (e: MouseEvent) => {
      props.onClick && props.onClick(e);
    };

    const renderTypeIcon = () => {
      const { type } = props;
      const iconMap: Record<string, any> = {
        warning: h(IconAlertTriangle, { size: 'large' }),
        success: h(IconTickCircle, { size: 'large' }),
        info: h(IconInfoCircle, { size: 'large' }),
        error: h(IconAlertCircle, { size: 'large' }),
      };
      let iconType: any = type ? iconMap[type] : undefined;
      const iconCls = cls({ [`${prefixCls}-icon`]: true, [`${prefixCls}-${type}`]: true });
      const custom: any = slots.icon ? slots.icon() : normalizeNode(props.icon);
      if (custom) {
        iconType = custom;
      }
      if (iconType) {
        return h('div', { class: iconCls, 'x-semi-prop': 'icon' }, [isSemiIcon(iconType) ? cloneVNode(iconType, { size: iconType.props?.size || 'large' }) : iconType]);
      }
      return null;
    };

    expose({ foundation, clearCloseTimer, startCloseTimer, restartCloseTimer, close });

    return () => {
      const direction = props.direction || context.direction;
      const { theme, type, className, showClose, style } = props;
      const { visible } = state;
      const wrapper = cls(prefixCls, className, attrs.class as any, {
        [`${prefixCls}-close`]: !visible,
        [`${prefixCls}-icon-show`]: (types as readonly string[]).includes(type as string),
        [`${prefixCls}-${type}`]: true,
        [`${prefixCls}-${theme}`]: theme === 'light',
        [`${prefixCls}-rtl`]: direction === 'rtl',
      });
      const title = slots.title ? slots.title() : normalizeNode(props.title);
      const content = slots.default ? slots.default() : slots.content ? slots.content() : normalizeNode(props.content);
      const hasTitle = slots.title || (props.title !== '' && props.title !== null && props.title !== undefined);
      const hasContent = slots.default || slots.content || (props.content !== '' && props.content !== null && props.content !== undefined);
      return h(
        'div',
        {
          class: wrapper,
          style,
          onMouseenter: clearCloseTimer,
          onMouseleave: startCloseTimer,
          onClick: notifyClick,
          'aria-labelledby': titleID,
          role: 'alert',
          onAnimationend: props.onAnimationEnd,
          onAnimationstart: props.onAnimationStart,
        },
        [
          h('div', null, [renderTypeIcon()]),
          h('div', { class: `${prefixCls}-inner` }, [
            h('div', { class: `${prefixCls}-content-wrapper` }, [
              hasTitle ? h('div', { id: titleID, class: `${prefixCls}-title`, 'x-semi-prop': 'title' }, [title]) : '',
              hasContent ? h('div', { class: `${prefixCls}-content`, 'x-semi-prop': 'content' }, [content]) : '',
            ]),
            showClose
              ? h(Button, { class: `${prefixCls}-icon-close`, type: 'tertiary', theme: 'borderless', size: 'small', onClick: close }, { icon: () => h(IconClose) })
              : null,
          ]),
        ]
      );
    };
  },
});

(Notice as any).elementType = 'Notice';

export default Notice;
