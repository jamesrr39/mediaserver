import { combineReducers } from 'redux';
import { DIState, dependencyInjectionReducer } from './dependcyInjectionReducer';
import { MediaFilesState, mediaFilesReducer } from './mediafileReducer';
import { NotificationsState, notificationsReducer } from './notificationReducer';
import { CollectionReducerState, collectionsReducer } from './collectionsReducer';
import { EventState, eventReducer } from './eventReducer';

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
  dependencyInjectionReducer: DIState,
  eventReducer: EventState,
};

export default combineReducers({
  mediaFilesReducer,
  collectionsReducer,
  notificationsReducer,
  dependencyInjectionReducer,
  eventReducer,
});
