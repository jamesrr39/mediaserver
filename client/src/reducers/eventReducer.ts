import { Action } from 'redux';
import { SERVER_BASE_URL } from '../configs';
import { DebouncedObservable } from '../util/Observable';

const websocketUrl = `${SERVER_BASE_URL}/api/events/`.replace('http', 'ws');

const websocketObservable = new DebouncedObservable(0);
const eventsWebsocket = new WebSocket(websocketUrl);

eventsWebsocket.onmessage = function (event: {data: string}) {
  websocketObservable.triggerEvent(event.data);
};

export type EventsState = {x: number};

const eventsInitialState = {x: 1};

export enum EventTypes {
    ThumbnailResizeSuccessful = 'job.successful.thumbnail_resize_job',
}
  
export interface ThumbnailResizeSuccessfulEvent extends Action {
    type: EventTypes.ThumbnailResizeSuccessful;
}

type EventAction = ThumbnailResizeSuccessfulEvent;

export function eventsReducer(
    state: EventsState = eventsInitialState,
    action: EventAction) {
    switch (action.type) {
        case EventTypes.ThumbnailResizeSuccessful:
            console.log(action);
            
            return {...state};
        default:
            console.error('unrecognised', action, state);
            return {...state};
    }
}
