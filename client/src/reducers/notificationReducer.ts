import { GalleryNotification } from '../ui/NotificationBarComponent';
import { NotificationActionTypes, NotificationAction } from '../actions/notificationActions';

const notificationsInitialState = {
  notifications: [],
};

export type NotificationsState = {
  notifications: GalleryNotification[],
};

export function notificationsReducer(
  state: NotificationsState = notificationsInitialState,
  action: NotificationAction
) {
  switch (action.type) {
  case NotificationActionTypes.NOTIFY:
    return {
      ...state,
      notifications: state.notifications.concat([action.notification]),
    };
  case NotificationActionTypes.REMOVE_NOTIFICATION:
    const notifications = state.notifications.concat([]); // copy
    const index = notifications.indexOf(action.notification);
    if (index === -1) {
      return state;
    }

    notifications.splice(index, 1);
    return {
      ...state,
      notifications,
    };
    default:
      return state;
  }
}
