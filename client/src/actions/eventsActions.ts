
export enum EventActionType {
    EVENT_RECEIVED = 'EVENT_RECEIVED',
}

export type EventAction = {
    type: EventActionType.EVENT_RECEIVED,
    data: string,
};

export type Message = {
    data: string,
};

// export function connectToWebsocket() {
//     return async(dispatch: (action: EventAction) => void, getState: () => State) => {
//         const state = getState();
//         const { websocketToken } = state.activeUserReducer.activeUser || {};
//         if (!token) {
//             throw new Error('no token');
//         }
//         const websocketUrl = `${SERVER_BASE_URL}/api/events/?token=${token}`.replace('http', 'ws');

//         const eventsWebsocket = new WebSocket(websocketUrl);

//         eventsWebsocket.onmessage = function (event: Message) {
//             dispatch({
//                 type: EventActionType.EVENT_RECEIVED,
//                 data: event.data,
//             });
//         };
//     };
// }
