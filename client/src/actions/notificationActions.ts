import { Action } from 'redux';
import { GalleryNotification } from '../ui/NotificationBarComponent';

export enum NotificationActionTypes {
  NOTIFY = 'NOTIFY',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
}

export interface NotifyAction extends Action {
  type: NotificationActionTypes.NOTIFY;
  notification: GalleryNotification;
}

export interface RemoveNotificationAction extends Action {
  type: NotificationActionTypes.REMOVE_NOTIFICATION;
  notification: GalleryNotification;
}

export type NotificationAction = NotifyAction | RemoveNotificationAction;

export function newNotificationAction(notification: GalleryNotification): NotifyAction {
  return {
    type: NotificationActionTypes.NOTIFY,
    notification,
  };
}

export function removeNotification(notification: GalleryNotification) {
  return {
    type: NotificationActionTypes.REMOVE_NOTIFICATION,
    notification,
  };
}
