import { Observable } from "ts-util/dist/Observable";
import { DebouncedObservable } from "ts-util/src/Observable";
import {
  listenToWindowActions,
  WindowAction,
  WindowActionType,
} from "../actions/windowActions";

// TODO move to React Context?
export type WindowState = {
  innerHeight: number;
  innerWidth: number;
  scrollY: number;
  addEventListener(eventName: "scroll" | "resize", callback: () => void): void;
  scrollObservable: Observable<void>;
  resizeObservable: Observable<void>;
};

export function createWindowReducer(initialState: WindowState) {
  listenToWindowActions(initialState);

  return (state: WindowState = initialState, action: WindowAction) => {
    switch (action.type) {
      case WindowActionType.RESIZE:
        return {
          ...state,
          innerHeight: action.innerHeight,
          innerWidth: action.innerWidth,
        };
      case WindowActionType.SCROLL:
        return {
          ...state,
          scrollY: action.scrollY,
        };
      default:
        return state;
    }
  };
}
