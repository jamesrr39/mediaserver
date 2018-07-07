import { PictureMetadata } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';
import { NotificationLevel } from './ui/NotificationBarComponent';
import { QueuedFile } from './fileQueue';
import { newNotificationAction, NotifyAction } from './actions/notificationActions';

// export const FETCH_PICTURES_METADATA = 'FETCH_PICTURES_METADATA';

export enum FilesActionTypes {
  FETCH_PICTURES_METADATA = 'FETCH_PICTURES_METADATA',
  PICTURES_METADATA_FETCHED = 'PICTURES_METADATA_FETCHED',
  UPLOAD_FILE = 'UPLOAD_FILE',
  PICTURE_SUCCESSFULLY_UPLOADED = 'PICTURE_SUCCESSFULLY_UPLOADED',
}

export interface FetchPicturesMetadataAction extends Action {
  type: FilesActionTypes.FETCH_PICTURES_METADATA;
}

export interface PicturesMetadataFetchedAction extends Action {
  type: FilesActionTypes.PICTURES_METADATA_FETCHED;
  picturesMetadatas: PictureMetadata[];
}

export interface UploadFileAction extends Action {
  type: FilesActionTypes.UPLOAD_FILE;
  file: QueuedFile;
}

export interface PictureSuccessfullyUploadedAction extends Action {
  type: FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED;
  pictureMetadata: PictureMetadata;
}

export type MediaserverAction = (
  UploadFileAction |
  PicturesMetadataFetchedAction |
  UploadFileAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction);

export function fetchPicturesMetadata() {
  return (dispatch: (action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction) => void) => {
    dispatch({
      type: FilesActionTypes.FETCH_PICTURES_METADATA,
    } as FetchPicturesMetadataAction);
    return fetch(`${SERVER_BASE_URL}/api/pictureMetadata/`)
      .then(response => response.json())
      .then((picturesMetadatas: PictureMetadata[]) => dispatch({
        type: FilesActionTypes.PICTURES_METADATA_FETCHED,
        picturesMetadatas,
      }));
  };
}

export function queueFileForUpload(file: File) {
  return (dispatch: (action: MediaserverAction | NotifyAction) => void) => {
    const onSuccess = (pictureMetadata: PictureMetadata) => {
      dispatch({
        type: FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED,
        pictureMetadata,
      } as PictureSuccessfullyUploadedAction);

      dispatch(newNotificationAction(NotificationLevel.INFO, `uploaded '${file.name}'`));
    };

    const onFailure = (response: Response) => {
      if (response.status === 409) {
        dispatch(newNotificationAction(NotificationLevel.INFO, `'${file.name}' already uploaded`));
        return;
      }

      dispatch(newNotificationAction(
        NotificationLevel.ERROR,
        `error uploading '${file.name}': ${response.statusText}`));

    };

    dispatch({
      type: FilesActionTypes.UPLOAD_FILE,
      file: {
        file,
        onSuccess,
        onFailure,
      }
    } as UploadFileAction);
  };
}
