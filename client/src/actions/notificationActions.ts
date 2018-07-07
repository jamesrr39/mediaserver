import { Action } from 'redux';
import { GalleryNotification, NotificationLevel } from '../ui/NotificationBarComponent';

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

export function newNotificationAction(level: NotificationLevel, text: string): NotifyAction {
  return {
    type: NotificationActionTypes.NOTIFY,
    notification: {
      level,
      text,
    },
  };
}

export function removeNotification(notification: GalleryNotification) {
  return (dispatch: (action: RemoveNotificationAction) => void) => {
    dispatch({
      type: NotificationActionTypes.REMOVE_NOTIFICATION,
      notification,
    });
  };
}
