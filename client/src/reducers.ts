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

type MediaFilesState = {
  isReady: boolean,
  isFetching: boolean,
  mediaFiles: MediaFile[],
  scrollObservable: Observable<{}>,
  mediaFilesMap: Map<string, MediaFile>,
  uploadQueue: FileQueue,
};

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
};

const mediaFilesInitialState = {
  isReady: false,
  isFetching: false,
  mediaFiles: [],
  scrollObservable,
  mediaFilesMap: new Map<string, MediaFile>(),
  uploadQueue: new FileQueue(4),
};

function mediaFilesReducer(
  state: MediaFilesState = mediaFilesInitialState, 
  action: MediaserverAction) {
  switch (action.type) {
    case FilesActionTypes.FETCH_MEDIA_FILES:
      return {
        ...state,
        isFetching: true,
      };
    case FilesActionTypes.MEDIA_FILES_FETCHED:
      const mediaFilesMap = new Map<string, MediaFile>();
      action.mediaFiles.forEach(mediaFile => {
        mediaFilesMap.set(mediaFile.hashValue, mediaFile);
      });
      return {
        ...state,
        isReady: true,
        isFetching: false,
        mediaFiles: action.mediaFiles,
        mediaFilesMap: mediaFilesMap,
      };
    case FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED:
      return {
        ...state,
        mediaFiles: state.mediaFiles.concat([action.mediaFile])
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
  mediaFilesReducer,
  collectionsReducer,
  notificationsReducer,
});
