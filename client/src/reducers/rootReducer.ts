import { combineReducers } from 'redux';
import { DIState, dependencyInjectionReducer } from './dependcyInjectionReducer';
import { MediaFilesState, mediaFilesReducer } from './mediafileReducer';
import { NotificationsState, notificationsReducer } from './notificationReducer';
import { EventsState, eventsReducer } from './eventReducer';
import { CollectionReducerState, collectionsReducer } from './collectionsReducer';

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
  dependencyInjectionReducer: DIState,
  eventsReducer: EventsState,
};

export default combineReducers({
  mediaFilesReducer,
  collectionsReducer,
  notificationsReducer,
  dependencyInjectionReducer,
  eventsReducer,
});
