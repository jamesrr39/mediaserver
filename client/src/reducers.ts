import { combineReducers } from 'redux';
import { PictureMetadata } from './domain/PictureMetadata';
import {
  MediaserverAction,
  FilesActionTypes,
 } from './actions';
import { DebouncedObservable, Observable } from './util/Observable';
import { CustomCollection } from './domain/Collection';
import { CollectionsAction, COLLECTIONS_FETCHED, COLLECTION_SAVED } from './collectionsActions';
import { FileQueue } from './fileQueue';
import { notificationsReducer, NotificationsState } from './reducers/notificationReducer';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => scrollObservable.triggerEvent());

type PicturesMetadataState = {
  isReady: boolean,
  isFetching: boolean,
  picturesMetadatas: PictureMetadata[],
  scrollObservable: Observable,
  picturesMetadatasMap: Map<string, PictureMetadata>,
  uploadQueue: FileQueue,
};

export type State = {
  picturesMetadatas: PicturesMetadataState,
  collections: CollectionReducerState,
  notificationsReducer: NotificationsState,
};

const picturesMetadatasInitialState = {
  isReady: false,
  isFetching: false,
  picturesMetadatas: [],
  scrollObservable,
  picturesMetadatasMap: new Map<string, PictureMetadata>(),
  uploadQueue: new FileQueue(4),
};

function picturesMetadatas(state: PicturesMetadataState = picturesMetadatasInitialState, action: MediaserverAction) {
  switch (action.type) {
    case FilesActionTypes.FETCH_PICTURES_METADATA:
      return {
        ...state,
        isFetching: true,
      };
    case FilesActionTypes.PICTURES_METADATA_FETCHED:
      const picturesMetadatasMap = new Map<string, PictureMetadata>();
      action.picturesMetadatas.forEach(pictureMetadata => {
        picturesMetadatasMap.set(pictureMetadata.hashValue, pictureMetadata);
      });
      return {
        ...state,
        isReady: true,
        isFetching: false,
        picturesMetadatas: action.picturesMetadatas,
        picturesMetadatasMap,
      };
    case FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED:
      return {
        ...state,
        picturesMetadatas: state.picturesMetadatas.concat([action.pictureMetadata])
      };
    case FilesActionTypes.UPLOAD_FILE:
      state.uploadQueue.uploadOrQueue(action.file);

      return {
        ...state,
      };
    default:
      return state;
  }
}

type CollectionReducerState = {
  isReady: boolean;
  customCollections: CustomCollection[];
};

const collectionInitialState = {
  isReady: false,
  customCollections: [],
};

function collections(state: CollectionReducerState = collectionInitialState, action: CollectionsAction) {
  switch (action.type) {
    case COLLECTIONS_FETCHED:
      return {
        ...state,
        isReady: true,
        customCollections: action.customCollections,
      };
    case COLLECTION_SAVED:
      const collectionsWithoutUpdated = state.customCollections.filter(
        customCollection => customCollection.id !== action.collection.id);
      collectionsWithoutUpdated.push(action.collection);

      return {
        ...state,
        customCollections: collectionsWithoutUpdated,
      };
    default:
      return state;
  }
}

export default combineReducers({
  picturesMetadatas,
  collections,
  notificationsReducer,
});
