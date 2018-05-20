import { combineReducers } from 'redux';
import { PictureMetadata } from './domain/PictureMetadata';
import {
  FETCH_PICTURES_METADATA,
  PICTURES_METADATA_FETCHED,
  MediaserverAction,
  NOTIFY,
  REMOVE_NOTIFICATION,
  PICTURE_SUCCESSFULLY_UPLOADED,
 } from './actions';
import { DebouncedObservable, Observable } from './util/Observable';
import { GalleryNotification } from './ui/NotificationBarComponent';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => scrollObservable.triggerEvent());

type PicturesMetadataState = {
  isFetching: boolean,
  picturesMetadatas: PictureMetadata[],
  scrollObservable: Observable,
  notifications: GalleryNotification[],
};

export type State = {
  picturesMetadatas: PicturesMetadataState,
};

const initialState = {
  isFetching: false,
  picturesMetadatas: [],
  scrollObservable,
  notifications: [],
};

function picturesMetadatas(state: PicturesMetadataState = initialState, action: MediaserverAction) {
  switch (action.type) {
    case FETCH_PICTURES_METADATA:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case PICTURES_METADATA_FETCHED:
      return Object.assign({}, state, {
        isFetching: false,
        picturesMetadatas: action.picturesMetadatas,
      });
    case NOTIFY:
      return {
        ...state,
        notifications: state.notifications.concat([action.notification]),
      };
    case REMOVE_NOTIFICATION:
      const notifications = state.notifications.concat([]); // copy
      const index = notifications.indexOf(action.notification);
      if (index === -1) {
        return state;
      }

      notifications.splice(index, 1);
      return {
        ...state,
        notifications,
      };
    case PICTURE_SUCCESSFULLY_UPLOADED:
      return {
        ...state,
        picturesMetadatas: state.picturesMetadatas.concat([action.pictureMetadata])
      };
    default:
      return state;
  }
}

export default combineReducers({
  picturesMetadatas,
});
