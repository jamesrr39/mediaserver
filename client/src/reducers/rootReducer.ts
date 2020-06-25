import { combineReducers } from 'redux';
import { WindowState, createWindowReducer } from './windowReducer';
import { MediaFilesState, mediaFilesReducer } from './mediafileReducer';
import { NotificationsState, notificationsReducer } from './notificationReducer';
import { CollectionReducerState, collectionsReducer } from './collectionsReducer';
import { EventState, eventReducer } from './eventReducer';

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
  windowReducer: WindowState,
  eventReducer: EventState,
};

export default function createRootReducer(win: WindowState) {
  return combineReducers({
    mediaFilesReducer,
    collectionsReducer,
    notificationsReducer,
    windowReducer: createWindowReducer(win),
    eventReducer,
  });
}
