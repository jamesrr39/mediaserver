import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from './reducers/rootReducer';
import { WindowState } from './reducers/windowReducer';
import { loginMiddleware } from './middleware/loginMiddleware';

// tslint:disable-next-line
export default function configureStore(win: WindowState) {
  return createStore(
    rootReducer(win),
    applyMiddleware(
      thunkMiddleware,
      loginMiddleware,
    )
  );
}
