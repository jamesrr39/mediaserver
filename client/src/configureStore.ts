import { createStore } from "redux";
import { Observable } from "ts-util/src/Observable";
import rootReducer from "./reducers/rootReducer";
import { WindowState } from "./reducers/windowReducer";

// tslint:disable-next-line
export default function configureStore(
  win: WindowState,
  scrollObservable: Observable<void>,
  resizeObservable: Observable<void>
) {
  return createStore(rootReducer(win, scrollObservable, resizeObservable));
}
