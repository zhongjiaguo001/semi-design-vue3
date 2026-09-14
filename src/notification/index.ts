import Notice, { noticeProps } from './Notice';
import { NotificationList, createNotification } from './NotificationList';
import useNotification from './useNotification';
import type { NotificationApi, NoticeOptions, NotificationConfigProps, NoticeInstance } from './NotificationList';
import type { UseNotificationResult } from './useNotification';

/** the default (singleton) notification manager, the React `Notification` default export */
const Notification: NotificationApi = createNotification();

export { Notification, Notice, NotificationList, createNotification, useNotification, noticeProps };
export type { NotificationApi, NoticeOptions, NotificationConfigProps, NoticeInstance, UseNotificationResult };
export type { NoticePosition, NoticeType, NoticeTheme, NoticeDirection } from './Notice';
export default Notification;
