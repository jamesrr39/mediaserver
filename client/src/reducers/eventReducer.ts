import { EventAction, EventActionType } from "../actions/eventsActions";

export type EventState = {};

export function eventReducer(state: EventState = {}, action: EventAction) {
  switch (action.type) {
    case EventActionType.EVENT_RECEIVED:
      console.log("event received:", action);
      return state;
    default:
      return state;
  }
}
