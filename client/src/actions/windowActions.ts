import { DebouncedObservable } from '../util/Observable';

export enum WindowActionType {
    RESIZE,
    SCROLL
}

export type WindowResizeAction = {
    type: WindowActionType.RESIZE,
    innerHeight: number,
    innerWidth: number,
};

export type WindowScrollAction = {
    type: WindowActionType.SCROLL,
    scrollY: number,
};

export type WindowAction = WindowResizeAction | WindowScrollAction;

// a type that can be satisfied by the "window" object
export type Win = {
    scrollY: number,
    innerHeight: number,
    innerWidth: number,
    addEventListener(eventName: ('scroll' | 'resize'), callback: () => void): void,
};

export function listenToWindowActions(win: Win) {
    return async(dispatch: (action: WindowAction) => void) => {

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

        win.addEventListener('scroll', () => scrollObservable.triggerEvent());
        win.addEventListener('resize', () => resizeObservable.triggerEvent());
    };
}
