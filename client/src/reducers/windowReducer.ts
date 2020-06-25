import { WindowAction, WindowActionType } from '../actions/windowActions';

export type WindowState = {
  innerHeight: number,
  innerWidth: number,
  scrollY: number,
};

export function createWindowReducer(initialState: WindowState) {
  return (
    state: WindowState = initialState, 
    action: WindowAction,
  ) => {
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
