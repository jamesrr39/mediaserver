import { Person } from "../domain/People";
import { UserAction, UserActionType } from "../actions/userActions";

export type ActiveUserReducerState = {
  activeUser?: {
    user: Person;
  };
};

const initialActiveUserReducerState = {
  activeUser: undefined,
};

export function activeUserReducer(
  state: ActiveUserReducerState = initialActiveUserReducerState,
  action: UserAction
) {
  switch (action.type) {
    case UserActionType.USER_LOGIN:
      const { user } = action;

      return {
        ...state,
        activeUser: {
          user,
        },
      };
    default:
      return state;
  }
}
