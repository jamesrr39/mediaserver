import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from './reducers';
// import { Dispatch } from 'react-redux';
// import { Action } from 'redux';
// import { PICTURE_SUCCESSFULLY_UPLOADED } from './actions';

// tslint:disable-next-line
// const customMiddleware = (store: any) => (next: Dispatch<any>) => (action: Dispatch<any>) => {
//   switch (action.type) {
//     case PICTURE_SUCCESSFULLY_UPLOADED: {
//       break;
//     }
//     default:{
//       break;
//     }
//   }
//
//   // tslint:disable-next-line
//   console.log("Middleware triggered:", action, store, next);
//   next(action);
// };

// tslint:disable-next-line
export default function configureStore(preloadedState?: any) {
  return createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(
      thunkMiddleware,
      // customMiddleware
    )
  );
}
