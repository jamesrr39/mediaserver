import { DebouncedObservable, Observable } from '../util/Observable';
import { SERVER_BASE_URL } from '../configs';

const scrollObservable = new DebouncedObservable<void>(150);
const resizeObservable = new DebouncedObservable<void>(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => resizeObservable.triggerEvent());

const websocketUrl = `${SERVER_BASE_URL}/api/events/`.replace('http', 'ws');

const eventsObservable = new DebouncedObservable<Event>(0);
const eventsWebsocket = new WebSocket(websocketUrl);

type Message = {
  data: string,
};

eventsWebsocket.onmessage = function (event: Message) {
  console.log('event', event);
  eventsObservable.triggerEvent(JSON.stringify(event.data));
};

export type Event = {
};

export type DIState = {
  scrollObservable: Observable<void>,
  resizeObservable: Observable<void>,
  eventsObservable: Observable<Event>
};

export function dependencyInjectionReducer(state: DIState = {scrollObservable, resizeObservable, eventsObservable}) {
    return state;
}
