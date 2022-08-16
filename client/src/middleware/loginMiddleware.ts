import { State } from "../reducers/rootReducer";
import { UserAction, UserActionType } from "../actions/userActions";
import { fetchPicturesMetadata } from "../actions/mediaFileActions";
import { fetchCollections } from "../actions/collectionsActions";
// import { connectToWebsocket } from '../actions/eventsActions';
import { listenToWindowActions } from "../actions/windowActions";
import { fetchAllPeople } from "../actions/peopleActions";
import { Dispatch } from "react";

// tslint:disable-next-line:no-any
type NextType = (action: UserAction) => any;

// tslint:disable-next-line:no-any
export function loginMiddleware({
  getState,
  dispatch,
}: {
  getState: () => State;
  dispatch: Dispatch<any>;
}) {
  return (next: NextType) => (action: UserAction) => {
    const nextState = next(action);

    switch (action.type) {
      case UserActionType.USER_LOGIN:
        const fns = [
          fetchPicturesMetadata(),
          fetchCollections(),
          fetchAllPeople(),
          // connectToWebsocket(),
          listenToWindowActions(window),
        ];

        Promise.all(fns.map((fn) => dispatch(fn)));

        break;
      default:
        break;
    }

    return nextState;
  };
}
