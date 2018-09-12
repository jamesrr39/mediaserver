import { PictureMetadata, ExifData, RawSize } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';
import { NotificationLevel, GalleryNotification } from './ui/NotificationBarComponent';
import { QueuedFile } from './fileQueue';
import {
  newNotificationAction, NotifyAction, removeNotification, RemoveNotificationAction
 } from './actions/notificationActions';
import { MediaFileType, MediaFile } from './domain/MediaFile';
import { VideoMetadata } from './domain/VideoMetadata';

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
  mediaFiles: MediaFile[];
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

type PictureMetadataJSON = {
  fileType: MediaFileType.Picture;
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
  exif: null|ExifData;
  rawSize: RawSize;
};

type VideoMetadataJSON = {
  fileType: MediaFileType.Video;
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
};

type MediaFileJSON = {
  fileType: MediaFileType;
} & (PictureMetadataJSON | VideoMetadataJSON);

export function fetchPicturesMetadata() {
  return (dispatch: (action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction | NotifyAction) => void) => {
    dispatch({
      type: FilesActionTypes.FETCH_PICTURES_METADATA,
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
        const mediaFiles: MediaFile[] = [];
        mediaFilesJSON.forEach(json => {
          switch (json.fileType) {
          case MediaFileType.Picture:
            mediaFiles.push(
              new PictureMetadata(json.hashValue, json.relativeFilePath, json.fileSizeBytes, json.exif, json.rawSize));
            break;
          case MediaFileType.Video:
            mediaFiles.push(
              new VideoMetadata(json.hashValue, json.relativeFilePath, json.fileSizeBytes)
            );
            break;
          default:
            // do nothing
            break;
          }
        });
        dispatch({
          type: FilesActionTypes.PICTURES_METADATA_FETCHED,
          mediaFiles,
        });
      }).catch((errMessage) => {
        dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.ERROR, errMessage)));
      });
  };
}

const REMOVE_INFO_NOTIFICATION_AFTER_MS = 3000; // 3s

export function queueFileForUpload(file: File) {
  return (dispatch: (action: MediaserverAction | NotifyAction | RemoveNotificationAction) => void) => {
    const onSuccess = (pictureMetadata: PictureMetadata, uploadsRemaining: number) => {
      dispatch({
        type: FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED,
        pictureMetadata,
      } as PictureSuccessfullyUploadedAction);

      const message = `uploaded '${file.name}'. ${uploadsRemaining} uploads left.`;
      const notification = new GalleryNotification(NotificationLevel.INFO, message);
      dispatch(newNotificationAction(notification));
      setTimeout(
        () => dispatch(removeNotification(notification) as RemoveNotificationAction),
        REMOVE_INFO_NOTIFICATION_AFTER_MS);
    };

    const onFailure = (response: Response, uploadsRemaining: number) => {
      if (response.status === 409) {
        const message = `'${file.name}' already uploaded. ${uploadsRemaining} uploads left.`;
        const notification = new GalleryNotification(NotificationLevel.INFO, message);
        dispatch(newNotificationAction(notification));
        setTimeout(
          () => dispatch(removeNotification(notification) as RemoveNotificationAction),
          REMOVE_INFO_NOTIFICATION_AFTER_MS);
        return;
      }

      dispatch(newNotificationAction(new GalleryNotification(
        NotificationLevel.ERROR,
        `error uploading '${file.name}': ${response.statusText}`)));
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
