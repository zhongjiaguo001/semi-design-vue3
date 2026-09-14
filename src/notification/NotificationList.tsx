import { defineComponent, h, nextTick, createApp, Fragment } from 'vue';
import type { App, CSSProperties } from 'vue';
import cls from 'classnames';
import NotificationListFoundation from '@douyinfe/semi-foundation/lib/es/notification/notificationListFoundation';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/notification/constants';
import getUuid, { getUuidShort } from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/notification/notification.css';
import { useBaseComponent } from '../_base/useBaseComponent';
import { useConfigContext } from '../configProvider/context';
import CSSAnimation from '../_cssAnimation';
import Notice from './Notice';
import useNotification from './useNotification';
import type { NoticePosition, NoticeType, NoticeTheme, NoticeDirection } from './Notice';

export interface NotificationConfigProps {
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  duration?: number;
  position?: NoticePosition;
  zIndex?: number;
  direction?: NoticeDirection;
}

export interface NoticeOptions extends NotificationConfigProps {
  id?: string;
  title?: any;
  content?: any;
  type?: NoticeType;
  theme?: NoticeTheme;
  icon?: any;
  showClose?: boolean;
  className?: string;
  style?: CSSProperties;
  motion?: boolean;
  getPopupContainer?: () => HTMLElement;
  onClick?: (e: MouseEvent) => void;
  onClose?: () => void;
  onCloseClick?: (id: string | number) => void;
  [key: string]: any;
}

export interface NoticeInstance extends NoticeOptions {
  id: string;
}

interface NotificationListState {
  notices: NoticeInstance[];
  removedItems: NoticeInstance[];
  updatedItems: NoticeInstance[];
}

const POSITIONS = ['top', 'left', 'bottom', 'right'] as const;
const ALL_PLACEMENTS: NoticePosition[] = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'];

const setPosInStyle = (noticeInstance: NoticeInstance) => {
  const style: Record<string, any> = {};
  POSITIONS.forEach((pos) => {
    if (pos in noticeInstance) {
      const val = noticeInstance[pos];
      style[pos] = typeof val === 'number' ? `${val}px` : val;
    }
  });
  return style;
};

/** React `NotificationList` (instance part). Exposes add/has/update/remove/destroyAll. */
export const NotificationList = defineComponent({
  name: 'NotificationList',
  setup(_, { expose }) {
    const context = useConfigContext();
    const { state, adapter: baseAdapter } = useBaseComponent<any, NotificationListState>({} as any, {
      notices: [],
      removedItems: [],
      updatedItems: [],
    });
    let noticeStorage: NoticeInstance[] = [];
    const noticeRefs = new Map<string, any>();

    const adapter = {
      ...baseAdapter,
      updateNotices: (notices: NoticeInstance[], removedItems: NoticeInstance[] = [], updatedItems: NoticeInstance[] = []) => {
        noticeStorage = [...notices];
        state.notices = notices;
        state.removedItems = removedItems;
        state.updatedItems = updatedItems;
        nextTick(() => {
          updatedItems.forEach((item) => noticeRefs.get(item.id)?.restartCloseTimer?.());
        });
      },
      getNotices: () => noticeStorage,
    };
    const foundation = new (NotificationListFoundation as any)(adapter);

    const api = {
      add: (opts: NoticeInstance) => foundation.addNotice(opts),
      has: (id: string) => foundation.has(id),
      remove: (id: string) => foundation.removeNotice(String(id)),
      update: (id: string, opts: NoticeOptions) => foundation.update(id, opts),
      destroyAll: () => foundation.destroyAll(),
      foundation,
    };
    expose(api);

    const renderNoticeInPosition = (notices: NoticeInstance[], position: NoticePosition, removedItems: NoticeInstance[]) => {
      if (!notices.length) return null;
      const style = setPosInStyle(notices[0]);
      return h(
        'div',
        { placement: position, key: position, class: cls(cssClasses.LIST), style },
        notices.map((notice) => {
          const isRemoved = removedItems.find((removedItem) => removedItem.id === notice.id) !== undefined;
          return h(
            CSSAnimation,
            {
              key: notice.id,
              motion: notice.motion !== false,
              animationState: isRemoved ? 'leave' : 'enter',
              startClassName: `${cssClasses.NOTICE}-animation-${isRemoved ? 'hide' : 'show'}_${position}`,
              onAnimationEnd: () => {
                if (!isRemoved) return;
                if (!state.removedItems.some((removed) => removed.id === notice.id)) return;
                state.removedItems = state.removedItems.filter((removed) => removed.id !== notice.id);
              },
            },
            {
              default: ({ animationClassName, animationEventsNeedBind, isAnimating }: any) => {
                if (isRemoved && !isAnimating) return null;
                const { className, style: noticeStyle, motion: _m, getPopupContainer: _g, zIndex: _z, top: _t, left: _l, bottom: _b, right: _r, ...rest } = notice;
                return h(Notice, {
                  ...rest,
                  className: cls({ [className as string]: Boolean(className), [animationClassName]: true }),
                  onAnimationStart: animationEventsNeedBind.onAnimationstart,
                  onAnimationEnd: animationEventsNeedBind.onAnimationend,
                  style: { ...(noticeStyle || {}) },
                  close: api.remove,
                  ref: (inst: any) => {
                    if (inst) noticeRefs.set(notice.id, inst);
                    else noticeRefs.delete(notice.id);
                  },
                });
              },
            }
          );
        })
      );
    };

    return () => {
      const { removedItems } = state;
      const notices = Array.from(new Set([...state.notices, ...removedItems]));
      const noticesInPosition: Record<NoticePosition, NoticeInstance[]> = { top: [], topLeft: [], topRight: [], bottom: [], bottomLeft: [], bottomRight: [] };
      notices.forEach((notice) => {
        const direction = notice.direction || context.direction;
        const defaultPosition: NoticePosition = direction === 'rtl' ? 'topLeft' : 'topRight';
        const position = (notice.position || defaultPosition) as NoticePosition;
        (noticesInPosition[position] || noticesInPosition[defaultPosition]).push(notice);
      });
      return h(
        Fragment,
        null,
        ALL_PLACEMENTS.map((pos) => renderNoticeInPosition(noticesInPosition[pos], pos, removedItems))
      );
    };
  },
});

export interface NotificationApi {
  addNotice: (notice: NoticeOptions) => string;
  removeNotice: (id: string | number) => string | number;
  open: (opts: NoticeOptions) => string;
  info: (opts: NoticeOptions) => string;
  success: (opts: NoticeOptions) => string;
  error: (opts: NoticeOptions) => string;
  warning: (opts: NoticeOptions) => string;
  close: (id: string | number) => string | number;
  destroyAll: () => void;
  config: (opts: NotificationConfigProps) => void;
  getWrapperId: () => string | null;
  useNotification: typeof useNotification;
  defaultConfig: NoticeOptions;
}

/** React `NotificationList` static part: a manager backed by a singleton Vue app */
export function createNotification(): NotificationApi {
  let app: App | null = null;
  let instance: any = null;
  let wrapperId: string | null = null;
  const defaultConfig: NoticeOptions = { duration: 3, position: 'topRight', motion: true, content: '', title: '', zIndex: 1010 };

  const api: NotificationApi = {
    defaultConfig,
    useNotification,
    addNotice(notice: NoticeOptions) {
      notice = { ...defaultConfig, ...notice };
      const id = notice.id ?? getUuid('notification');
      if (!instance) {
        const { getPopupContainer } = notice;
        const div = document.createElement('div');
        if (!wrapperId) {
          // React: getUuid('notification-wrapper').slice(0, 32) - a short random id avoids same-millisecond collisions
          wrapperId = getUuidShort({ prefix: 'notification-wrapper' });
        }
        div.className = cssClasses.WRAPPER;
        div.id = wrapperId;
        div.style.zIndex = String(typeof notice.zIndex === 'number' ? notice.zIndex : defaultConfig.zIndex);
        const container = getPopupContainer ? getPopupContainer() : null;
        (container || document.body).appendChild(div);
        app = createApp(NotificationList);
        instance = app.mount(div);
        instance.add({ ...notice, id });
      } else if (instance.has(`${id}`)) {
        instance.update(id, notice);
      } else {
        instance.add({ ...notice, id });
      }
      return id;
    },
    removeNotice(id: string | number) {
      instance && instance.remove(String(id));
      return id;
    },
    info: (opts) => api.addNotice({ ...defaultConfig, ...opts, type: 'info' }),
    success: (opts) => api.addNotice({ ...defaultConfig, ...opts, type: 'success' }),
    error: (opts) => api.addNotice({ ...defaultConfig, ...opts, type: 'error' }),
    warning: (opts) => api.addNotice({ ...defaultConfig, ...opts, type: 'warning' }),
    open: (opts) => api.addNotice({ ...defaultConfig, ...opts, type: 'default' }),
    close: (id) => api.removeNotice(id),
    destroyAll() {
      if (instance) {
        instance.destroyAll();
        const wrapper = wrapperId ? document.querySelector(`#${wrapperId}`) : null;
        app?.unmount();
        app = null;
        if (wrapper) {
          wrapper.parentNode?.removeChild(wrapper);
        }
        instance = null;
        wrapperId = null;
      }
    },
    config(opts: NotificationConfigProps) {
      POSITIONS.forEach((pos) => {
        if (pos in opts) defaultConfig[pos] = opts[pos];
      });
      if (typeof opts.zIndex === 'number') defaultConfig.zIndex = opts.zIndex;
      if (typeof opts.duration === 'number') defaultConfig.duration = opts.duration;
      if (typeof opts.position === 'string') defaultConfig.position = opts.position;
    },
    getWrapperId: () => wrapperId,
  };
  return api;
}
