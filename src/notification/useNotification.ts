import { defineComponent, h, shallowReactive, Fragment } from 'vue';
import type { Component } from 'vue';
import cls from 'classnames';
import { cssClasses } from '@douyinfe/semi-foundation/lib/es/notification/constants';
import getUuid from '@douyinfe/semi-foundation/lib/es/utils/uuid';
import '@douyinfe/semi-foundation/lib/es/notification/notification.css';
import Notice from './Notice';
import type { NoticePosition } from './Notice';
import type { NoticeOptions } from './NotificationList';

const defaultConfig: NoticeOptions = { duration: 3, position: 'topRight', motion: true, content: '', title: '', zIndex: 1010 };
const ALL_PLACEMENTS: NoticePosition[] = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'];

interface HookNoticeEntry {
  id: string;
  config: NoticeOptions;
}

export interface UseNotificationResult {
  notification: {
    success: (config: NoticeOptions) => string;
    info: (config: NoticeOptions) => string;
    error: (config: NoticeOptions) => string;
    warning: (config: NoticeOptions) => string;
    open: (config: NoticeOptions) => string;
    close: (id: string | number) => void;
  };
  /** render this component somewhere inside your tree (e.g. under ConfigProvider) */
  NotificationHolder: Component;
}

/**
 * Vue counterpart of React `Notification.useNotification()`: notices are rendered by `NotificationHolder`
 * grouped by position, so they inherit ConfigProvider context from where the holder is placed.
 */
export default function useNotification(): UseNotificationResult {
  const elements = shallowReactive<HookNoticeEntry[]>([]);

  const removeElement = (id: string | number) => {
    const idx = elements.findIndex((e) => e.id === String(id));
    if (idx >= 0) elements.splice(idx, 1);
  };

  const addNotice = (config: NoticeOptions) => {
    const id = getUuid('semi_notice_');
    elements.unshift({ id, config: { ...config, id } });
    return id;
  };

  const NotificationHolder = defineComponent({
    name: 'NotificationHolder',
    setup() {
      return () => {
        const noticesInPosition: Record<NoticePosition, HookNoticeEntry[]> = { top: [], topLeft: [], topRight: [], bottom: [], bottomLeft: [], bottomRight: [] };
        elements.forEach((entry) => {
          const position = (entry.config.position || 'topRight') as NoticePosition;
          (noticesInPosition[position] || noticesInPosition.topRight).push(entry);
        });
        return h(
          Fragment,
          null,
          ALL_PLACEMENTS.map((pos) => {
            const notices = noticesInPosition[pos];
            if (!notices.length) return null;
            return h(
              'div',
              { key: pos, class: cls(cssClasses.LIST), placement: pos },
              notices.map((entry) => {
                const { motion: _m, zIndex: _z, position: _p, getPopupContainer: _g, top: _t, left: _l, bottom: _b, right: _r, ...rest } = entry.config;
                return h(Notice, { key: entry.id, ...rest, onHookClose: () => removeElement(entry.id) });
              })
            );
          })
        );
      };
    },
  });

  return {
    notification: {
      success: (config) => addNotice({ ...defaultConfig, ...config, type: 'success' }),
      info: (config) => addNotice({ ...defaultConfig, ...config, type: 'info' }),
      error: (config) => addNotice({ ...defaultConfig, ...config, type: 'error' }),
      warning: (config) => addNotice({ ...defaultConfig, ...config, type: 'warning' }),
      open: (config) => addNotice({ ...defaultConfig, ...config, type: 'default' }),
      close: (id) => removeElement(id),
    },
    NotificationHolder,
  };
}
