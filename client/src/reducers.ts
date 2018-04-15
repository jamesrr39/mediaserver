import { combineReducers, Action } from 'redux';
import { PictureMetadata } from './domain/PictureMetadata';
import { FETCH_PICTURES_METADATA, PICTURES_METADATA_FETCHED, PicturesMetadataFetchedAction } from './actions';
import { DebouncedObservable, Observable } from './util/Observable';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => scrollObservable.triggerEvent());

type PicturesMetadataState = {
  isFetching: boolean,
  picturesMetadatas: PictureMetadata[],
  scrollObservable: Observable,
};

export type State = {
  picturesMetadatas: PicturesMetadataState,
};

const initialState = {
  isFetching: false,
  picturesMetadatas: [],
  scrollObservable,
};

function picturesMetadatas(state: PicturesMetadataState = initialState, action: Action) {
  switch (action.type) {
    case FETCH_PICTURES_METADATA:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case PICTURES_METADATA_FETCHED:
      return Object.assign({}, state, {
        isFetching: false,
        picturesMetadatas: (action as PicturesMetadataFetchedAction).picturesMetadatas,
      });
    default:
      return state;
  }
}

export default combineReducers({
  picturesMetadatas,
});
