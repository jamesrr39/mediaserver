import { combineReducers } from "redux";
import { WindowState, createWindowReducer } from "./windowReducer";
import { MediaFilesState, mediaFilesReducer } from "./mediafileReducer";
import {
  NotificationsState,
  notificationsReducer,
} from "./notificationReducer";
import {
  CollectionReducerState,
  collectionsReducer,
} from "./collectionsReducer";
import { EventState, eventReducer } from "./eventReducer";
import { ActiveUserReducerState, activeUserReducer } from "./activeUserReducer";
import { PeopleState, peopleReducer } from "./peopleReducer";
import { Observable } from "ts-util/src/Observable";

export type State = {
  mediaFilesReducer: MediaFilesState;
  collectionsReducer: CollectionReducerState;
  notificationsReducer: NotificationsState;
  windowReducer: WindowState;
  eventReducer: EventState;
  activeUserReducer: ActiveUserReducerState;
  peopleReducer: PeopleState;
};

export default function createRootReducer(
  win: WindowState,
  scrollObservable: Observable<void>,
  resizeObservable: Observable<void>
) {
  return combineReducers({
    mediaFilesReducer,
    collectionsReducer,
    notificationsReducer,
    windowReducer: createWindowReducer({
      ...win,
      scrollObservable,
      resizeObservable,
    }),
    eventReducer,
    activeUserReducer,
    peopleReducer,
  });
}
