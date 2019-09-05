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
import { Person } from '../domain/People';
import { LoadingStatus } from '../domain/LoadingStatus';

const scrollObservable = new DebouncedObservable<{}>(150);

window.addEventListener('scroll', (thing) => scrollObservable.triggerEvent(thing));
window.addEventListener('resize', (thing) => scrollObservable.triggerEvent(thing));

export type PeopleMap = Map<number, Person>;

type MediaFilesState = {
  loadingStatus: LoadingStatus,
  mediaFiles: MediaFile[],
  scrollObservable: Observable<{}>,
  mediaFilesMap: Map<string, MediaFile>,
  uploadQueue: FileQueue,
  trackRecordsMap: Map<string, Promise<Record[]>>,
  people: Person[],
  peopleMap: PeopleMap,
};

export type State = {
  mediaFilesReducer: MediaFilesState,
  collectionsReducer: CollectionReducerState,
  notificationsReducer: NotificationsState,
};

const maxConcurrentUploads = 2;

const mediaFilesInitialState = {
  loadingStatus: LoadingStatus.NOT_STARTED,
  mediaFiles: [],
  scrollObservable,
  mediaFilesMap: new Map<string, MediaFile>(),
  uploadQueue: new FileQueue(maxConcurrentUploads),
  trackRecordsMap: new Map<string, Promise<Record[]>>(),
  people: [],
  peopleMap: new Map<number, Person>(),
};

function mediaFilesReducer(
  state: MediaFilesState = mediaFilesInitialState, 
  action: MediaserverAction) {
  switch (action.type) {
    case FilesActionTypes.FETCH_MEDIA_FILES:
      return {
        ...state,
        loadingStatus: LoadingStatus.IN_PROGRESS,
      };
    case FilesActionTypes.MEDIA_FILES_FETCHED:
      const mediaFilesMap = new Map<string, MediaFile>();
      action.mediaFiles.forEach(mediaFile => {
        mediaFilesMap.set(mediaFile.hashValue, mediaFile);
      });
      return {
        ...state,
        loadingStatus: LoadingStatus.SUCCESSFUL,
        mediaFiles: action.mediaFiles,
        mediaFilesMap: mediaFilesMap,
      };
      case FilesActionTypes.MEDIA_FILES_FETCH_FAILED:
          return {
            ...state,
            loadingStatus: LoadingStatus.FAILED,
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
    case FilesActionTypes.PEOPLE_FETCHED_ACTION:
      const {people} = action;
      const peopleMap = new Map<number, Person>();
      people.forEach(person => {
        peopleMap.set(person.id, person);
      });

      return {
        ...state,
        people,
        peopleMap,
      };
    default:
      return state;
  }
}

type CollectionReducerState = {
  loadingStatus: LoadingStatus,
  customCollections: CustomCollection[];
};

const collectionInitialState = {
  loadingStatus: LoadingStatus.NOT_STARTED,
  customCollections: [],
};

function collectionsReducer(state: CollectionReducerState = collectionInitialState, action: CollectionsAction) {
  switch (action.type) {
    case CollectionActions.COLLECTION_FETCH_STARTED:
      return {
        ...state,
        loadingStatus: LoadingStatus.IN_PROGRESS,
      };
    case CollectionActions.COLLECTION_FETCH_FAILED:
      return {
        ...state,
        loadingStatus: LoadingStatus.FAILED,
      };
    case CollectionActions.COLLECTIONS_FETCHED:
      return {
        ...state,
        loadingStatus: LoadingStatus.SUCCESSFUL,
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
