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

// Added to fix 'Property 'notification' is missing in type 'AnyAction' but required in type 'RemoveNotificationAction'
// TODO remove this?
export interface NoopNotifyAction extends Action {
  type: 'NO-OP';
}

export type NotificationAction = NotifyAction | RemoveNotificationAction | NoopNotifyAction;
// export type NotificationAction = Action;

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
