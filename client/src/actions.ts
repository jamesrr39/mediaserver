import { PictureMetadata } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';
import { NotificationLevel, GalleryNotification } from './ui/NotificationBarComponent';
import { newNotificationAction, NotifyAction } from './actions/notificationActions';
import { MediaFile } from './domain/MediaFile';
import { MediaFileJSON, fromJSON } from './domain/deserialise';

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

export interface PictureSuccessfullyUploadedAction extends Action {
  type: FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED;
  pictureMetadata: PictureMetadata;
}

export type MediaserverAction = (
  PicturesMetadataFetchedAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction);

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
        const mediaFiles = mediaFilesJSON.map(json => fromJSON(json));
        dispatch({
          type: FilesActionTypes.PICTURES_METADATA_FETCHED,
          mediaFiles,
        });
      }).catch((errMessage) => {
        dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.ERROR, errMessage)));
      });
  };
}

// const REMOVE_INFO_NOTIFICATION_AFTER_MS = 3000; // 3s

// export function queueFileForUpload(file: File) {
//   return async (dispatch: (action: MediaserverAction) => void) => {
//     // const onSuccess = (pictureMetadata: PictureMetadata, uploadsRemaining: number) => {
//     //   dispatch({
//     //     type: FilesActionTypes.PICTURE_SUCCESSFULLY_UPLOADED,
//     //     pictureMetadata,
//     //   } as PictureSuccessfullyUploadedAction);

//       // const message = `uploaded '${file.name}'. ${uploadsRemaining} uploads left.`;
//       // const notification = new GalleryNotification(NotificationLevel.INFO, message);
//       // dispatch(newNotificationAction(notification));
//       // setTimeout(
//       //   () => dispatch(removeNotification(notification) as RemoveNotificationAction),
//       //   REMOVE_INFO_NOTIFICATION_AFTER_MS);

//       // if (onSuccessCb) {
//       //   onSuccessCb(pictureMetadata);
//       // }
//     // };

//     // const onFailure = (response: Response, uploadsRemaining: number) => {
//     //   if (response.status === 409) {
//     //     const message = `'${file.name}' already uploaded. ${uploadsRemaining} uploads left.`;
//     //     const notification = new GalleryNotification(NotificationLevel.INFO, message);
//     //     dispatch(newNotificationAction(notification));
//     //     setTimeout(
//     //       () => dispatch(removeNotification(notification) as RemoveNotificationAction),
//     //       REMOVE_INFO_NOTIFICATION_AFTER_MS);
//     //     return;
//     //   }

//     //   dispatch(newNotificationAction(new GalleryNotification(
//     //     NotificationLevel.ERROR,
//     //     `error uploading '${file.name}': ${response.statusText}`)));
//     // };

//     dispatch({
//       type: FilesActionTypes.UPLOAD_FILE,
//       file: {
//         file,
//       }
//     } as UploadFileAction);
//   };
// }
