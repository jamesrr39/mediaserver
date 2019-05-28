import { combineReducers } from 'redux';
import {
  MediaserverAction,
  FilesActionTypes,
 } from '../actions/mediaFileActions';
import { DebouncedObservable, Observable } from '../util/Observable';
import { CustomCollection } from '../domain/Collection';
import { CollectionsAction, CollectionActions } from '../collectionsActions';
import { FileQueue } from '../fileQueue';
import { notificationsReducer, NotificationsState } from './notificationReducer';
import { MediaFile } from '../domain/MediaFile';
import { Record } from '../domain/FitTrack';

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
  trackRecordsMap: Map<string, Record[]>,
};

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
};

const maxConcurrentUploads = 2;

const mediaFilesInitialState = {
  isReady: false,
  isFetching: false,
  mediaFiles: [],
  scrollObservable,
  mediaFilesMap: new Map<string, MediaFile>(),
  uploadQueue: new FileQueue(maxConcurrentUploads),
  trackRecordsMap: new Map<string, Record[]>(),
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
    case FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION:
      const newMap = new Map(state.trackRecordsMap);
      action.trackSummaryIdsMap.forEach((records, hash) => {
          newMap.set(hash, records);
      });
      return {
        ...state,
        trackRecordsMap: newMap,
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
