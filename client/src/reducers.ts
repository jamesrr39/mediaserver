import { combineReducers } from 'redux';
import {
  MediaserverAction,
  FilesActionTypes,
 } from './actions';
import { DebouncedObservable, Observable } from './util/Observable';
import { CustomCollection } from './domain/Collection';
import { CollectionsAction, CollectionActions } from './collectionsActions';
import { FileQueue } from './fileQueue';
import { notificationsReducer, NotificationsState } from './reducers/notificationReducer';
import { MediaFile } from './domain/MediaFile';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', (thing) => scrollObservable.triggerEvent(thing));
window.addEventListener('resize', (thing) => scrollObservable.triggerEvent(thing));

type PicturesMetadataState = {
  isReady: boolean,
  isFetching: boolean,
  picturesMetadatas: MediaFile[],
  scrollObservable: Observable<{}>,
  picturesMetadatasMap: Map<string, MediaFile>,
  uploadQueue: FileQueue,
};

export type State = {
  picturesMetadatasReducer: PicturesMetadataState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
};

const picturesMetadatasInitialState = {
  isReady: false,
  isFetching: false,
  picturesMetadatas: [],
  scrollObservable,
  picturesMetadatasMap: new Map<string, MediaFile>(),
  uploadQueue: new FileQueue(4),
};

function picturesMetadatasReducer(
  state: PicturesMetadataState = picturesMetadatasInitialState, 
  action: MediaserverAction) {
  switch (action.type) {
    case FilesActionTypes.FETCH_PICTURES_METADATA:
      return {
        ...state,
        isFetching: true,
      };
    case FilesActionTypes.PICTURES_METADATA_FETCHED:
      const picturesMetadatasMap = new Map<string, MediaFile>();
      action.mediaFiles.forEach(pictureMetadata => {
        picturesMetadatasMap.set(pictureMetadata.hashValue, pictureMetadata);
      });
      return {
        ...state,
        isReady: true,
        isFetching: false,
        picturesMetadatas: action.mediaFiles,
        picturesMetadatasMap,
      };
    case FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED:
      return {
        ...state,
        picturesMetadatas: state.picturesMetadatas.concat([action.pictureMetadata])
      };
    // case FilesActionTypes.UPLOAD_FILE:
    //   state.uploadQueue.uploadOrQueue(action.file);

    //   return {
    //     ...state,
    //   };
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

function collectionsReducer(state: CollectionReducerState = collectionInitialState, action: CollectionsAction) {
  switch (action.type) {
    case CollectionActions.COLLECTIONS_FETCHED:
      return {
        ...state,
        isReady: true,
        customCollections: action.customCollections,
      };
    case CollectionActions.COLLECTION_SAVED:
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
  picturesMetadatasReducer,
  collectionsReducer,
  notificationsReducer,
});
