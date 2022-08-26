import { createStore } from "redux";
import rootReducer from "./reducers/rootReducer";

// tslint:disable-next-line
export default function configureStore() {
  return createStore(rootReducer());
}
