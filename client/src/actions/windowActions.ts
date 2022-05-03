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
  return async (dispatch: (action: WindowAction) => void) => {
    const scrollObservable = new DebouncedObservable<void>(150);
    const resizeObservable = new DebouncedObservable<void>(150);

    scrollObservable.addListener(() => {
      dispatch({
        type: WindowActionType.SCROLL,
        scrollY: win.scrollY,
      });
    });

    resizeObservable.addListener(() => {
      dispatch({
        type: WindowActionType.RESIZE,
        innerHeight: win.innerHeight,
        innerWidth: win.innerWidth,
      });
    });

    win.addEventListener("scroll", () => scrollObservable.triggerEvent());
    win.addEventListener("resize", () => resizeObservable.triggerEvent());
  };
}
