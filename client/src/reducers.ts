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
import { Collection } from './domain/Collection';
import { CollectionsAction, COLLECTIONS_FETCHED } from './collectionsActions';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => scrollObservable.triggerEvent());

type PicturesMetadataState = {
  isFetching: boolean,
  picturesMetadatas: PictureMetadata[],
  scrollObservable: Observable,
  notifications: GalleryNotification[],
  picturesMetadatasMap: Map<string, PictureMetadata>,
};

export type State = {
  picturesMetadatas: PicturesMetadataState,
  collections: CollectionReducerState,
};

const picturesMetadatasInitialState = {
  isFetching: false,
  picturesMetadatas: [],
  scrollObservable,
  notifications: [],
  picturesMetadatasMap: new Map<string, PictureMetadata>(),
};

function picturesMetadatas(state: PicturesMetadataState = picturesMetadatasInitialState, action: MediaserverAction) {
  switch (action.type) {
    case FETCH_PICTURES_METADATA:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case PICTURES_METADATA_FETCHED:
      const picturesMetadatasMap = new Map<string, PictureMetadata>();
      action.picturesMetadatas.forEach(pictureMetadata => {
        picturesMetadatasMap.set(pictureMetadata.hashValue, pictureMetadata);
      });
      return Object.assign({}, state, {
        isFetching: false,
        picturesMetadatas: action.picturesMetadatas,
        picturesMetadatasMap,
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

type CollectionReducerState = {
  collections: Collection[];
};

const collectionInitialState = {
  collections: [],
};

function collections(state: CollectionReducerState = collectionInitialState, action: CollectionsAction) {
  switch (action.type) {
    case COLLECTIONS_FETCHED:
      return {
        ...state,
        collections: action.collections,
      };
    default:
      return state;
  }
}

export default combineReducers({
  picturesMetadatas,
  collections,
});
