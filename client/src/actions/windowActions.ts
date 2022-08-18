import { State } from "src/reducers/rootReducer";
import { DebouncedObservable } from "ts-util/dist/Observable";

export type WindowSize = {
  innerHeight: number;
  innerWidth: number;
};

export enum WindowActionType {
  RESIZE = "RESIZE",
  SCROLL = "SCROLL",
}

export type WindowResizeAction = {
  type: WindowActionType.RESIZE;
  innerHeight: number;
  innerWidth: number;
};

export type WindowScrollAction = {
  type: WindowActionType.SCROLL;
  scrollY: number;
};

export type WindowAction = WindowResizeAction | WindowScrollAction;

// a type that can be satisfied by the "window" object
export type Win = {
  scrollY: number;
  addEventListener(eventName: "scroll" | "resize", callback: () => void): void;
} & WindowSize;

export function listenToWindowActions(win: Win) {
  return async (
    dispatch: (action: WindowAction) => void,
    getState: () => State
  ) => {
    const state = getState();

    state.windowReducer.scrollObservable.addListener(() => {
      dispatch({
        type: WindowActionType.SCROLL,
        scrollY: win.scrollY,
      });
    });

    state.windowReducer.resizeObservable.addListener(() => {
      dispatch({
        type: WindowActionType.RESIZE,
        innerHeight: win.innerHeight,
        innerWidth: win.innerWidth,
      });
    });

    win.addEventListener("scroll", () =>
      state.windowReducer.scrollObservable.triggerEvent()
    );
    win.addEventListener("resize", () =>
      state.windowReducer.resizeObservable.triggerEvent()
    );
  };
}
