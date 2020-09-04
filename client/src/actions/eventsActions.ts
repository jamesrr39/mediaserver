import { SERVER_BASE_URL } from './../configs';

export enum EventActionType {
    EVENT_RECEIVED = 'EVENT_RECEIVED',
}

export type EventAction = {
    type: EventActionType.EVENT_RECEIVED,
    data: string,
};

type Message = {
    data: string,
};

export function connectToWebsocket() {
    return async(dispatch: (action: EventAction) => void) => {
        const websocketUrl = `${SERVER_BASE_URL}/api/events/`.replace('http', 'ws');

        const eventsWebsocket = new WebSocket(websocketUrl);

        eventsWebsocket.onmessage = function (event: Message) {
            dispatch({
                type: EventActionType.EVENT_RECEIVED,
                data: event.data,
            });
        };
    };
}
