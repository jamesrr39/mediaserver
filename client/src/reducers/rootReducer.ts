import { combineReducers } from "redux";
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
  eventReducer: EventState;
  activeUserReducer: ActiveUserReducerState;
  peopleReducer: PeopleState;
};

export default function createRootReducer() {
  return combineReducers({
    mediaFilesReducer,
    collectionsReducer,
    notificationsReducer,
    eventReducer,
    activeUserReducer,
    peopleReducer,
  });
}
