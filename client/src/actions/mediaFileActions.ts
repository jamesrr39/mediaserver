import { Action } from 'redux';
import { SERVER_BASE_URL } from '../configs';
import { NotificationLevel, GalleryNotification } from '../ui/NotificationBarComponent';
import { newNotificationAction, NotifyAction } from './notificationActions';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileJSON, fromJSON } from '../domain/deserialise';
import { FitTrack, Record } from '../domain/FitTrack';
import { State } from '../reducers';

export enum FilesActionTypes {
  FETCH_MEDIA_FILES = 'FETCH_PICTURES_METADATA',
  MEDIA_FILES_FETCHED = 'PICTURES_METADATA_FETCHED',
  UPLOAD_FILE = 'UPLOAD_FILE',
  FILE_SUCCESSFULLY_UPLOADED = 'PICTURE_SUCCESSFULLY_UPLOADED',
  TRACK_RECORDS_FETCHED_ACTION = 'TRACK_RECORDS_FETCHED_ACTION',
}

export interface FetchPicturesMetadataAction extends Action {
  type: FilesActionTypes.FETCH_MEDIA_FILES;
}

export interface PicturesMetadataFetchedAction extends Action {
  type: FilesActionTypes.MEDIA_FILES_FETCHED;
  mediaFiles: MediaFile[];
}

export interface PictureSuccessfullyUploadedAction extends Action {
  type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED;
  mediaFile: MediaFile;
}

export type TrackRecordsFetchedAction = {
  type: FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION;
  fileHash: string;
  records: Record[];
};

export type MediaserverAction = (
  PicturesMetadataFetchedAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction | TrackRecordsFetchedAction);

export function fetchPicturesMetadata() {
  return (dispatch: (action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction | NotifyAction) => void) => {
    dispatch({
      type: FilesActionTypes.FETCH_MEDIA_FILES,
    } as FetchPicturesMetadataAction);
    return fetch(`${SERVER_BASE_URL}/api/files/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response;
      })
      .then(response => response.json())
      .then((mediaFilesJSON: MediaFileJSON[]) => {
        const mediaFiles = mediaFilesJSON.map(json => fromJSON(json));
        dispatch({
          type: FilesActionTypes.MEDIA_FILES_FETCHED,
          mediaFiles,
        });
      }).catch((errMessage) => {
        dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.ERROR, errMessage)));
      });
  };
}

export function fetchRecordsForTrack(trackSummary: FitTrack) {
  return async (dispatch: (action: TrackRecordsFetchedAction) => void, getState: () => State) => {
    const state = getState();
    const recordsFromState = state.mediaFilesReducer.trackRecordsMap.get(trackSummary.hashValue);
    if (recordsFromState) {
      return recordsFromState;
    }

    const response = await fetch(`${SERVER_BASE_URL}/api/tracks/${trackSummary.hashValue}/records`);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const records = (await response.json()) as Record[];

    dispatch({
      type: FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION,
      fileHash: trackSummary.hashValue,
      records,
    });

    return records;
  };
}
