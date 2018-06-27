import { PictureMetadata } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';
import { GalleryNotification } from './ui/NotificationBarComponent';
import { QueuedFile } from './fileQueue';

export const FETCH_PICTURES_METADATA = 'FETCH_PICTURES_METADATA';

export interface FetchPicturesMetadataAction extends Action {
  type: 'FETCH_PICTURES_METADATA';
}

export const PICTURES_METADATA_FETCHED = 'PICTURES_METADATA_FETCHED';

export interface PicturesMetadataFetchedAction extends Action {
  type: 'PICTURES_METADATA_FETCHED';
  picturesMetadatas: PictureMetadata[];
}

export const UPLOAD_FILE = 'UPLOAD_FILE';

export interface UploadFileAction extends Action {
  type: 'UPLOAD_FILE';
  file: QueuedFile;
}

export const PICTURE_SUCCESSFULLY_UPLOADED = 'PICTURE_SUCCESSFULLY_UPLOADED';

export interface PictureSuccessfullyUploadedAction extends Action {
  type: 'PICTURE_SUCCESSFULLY_UPLOADED';
  pictureMetadata: PictureMetadata;
}

export const NOTIFY = 'NOTIFY';

export interface NotifyAction extends Action {
  type: 'NOTIFY';
  notification: GalleryNotification;
}

export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

export interface RemoveNotificationAction extends Action {
  type: 'REMOVE_NOTIFICATION';
  notification: GalleryNotification;
}

export type MediaserverAction =
  NotifyAction |
  RemoveNotificationAction |
  UploadFileAction |
  PicturesMetadataFetchedAction |
  UploadFileAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction;

export function fetchPicturesMetadata() {
  return (dispatch: (action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction) => void) => {
    dispatch({
      type: FETCH_PICTURES_METADATA,
    } as FetchPicturesMetadataAction);
    return fetch(`${SERVER_BASE_URL}/api/pictureMetadata/`)
      .then(response => response.json())
      .then((picturesMetadatas: PictureMetadata[]) => dispatch({
        type: PICTURES_METADATA_FETCHED,
        picturesMetadatas,
      }));
  };
}

export function queueFileForUpload(file: File) {
  return (dispatch: (action: MediaserverAction) => void) => {
    const onSuccess = (pictureMetadata: PictureMetadata) => {
      dispatch({
        type: PICTURE_SUCCESSFULLY_UPLOADED,
        pictureMetadata,
      } as PictureSuccessfullyUploadedAction);

      const notification = {
        level: 'info',
        text: `uploaded '${file.name}'`,
      };
      dispatch({
        type: NOTIFY,
        notification,
      } as NotifyAction);

      const cb = () => dispatch({
        type: REMOVE_NOTIFICATION,
        notification,
      } as RemoveNotificationAction);
      setTimeout(cb, 3000);
    };

    const onFailure = (response: Response) => {
      dispatch({
        type: NOTIFY,
        notification: {
          level: 'error',
          text: `error uploading '${file.name}': ${response.statusText}`,
        },
      } as NotifyAction);
    };

    dispatch({
      type: UPLOAD_FILE,
      file: {
        file,
        onSuccess,
        onFailure,
      }
    } as UploadFileAction);
  };
}

//
// export function uploadFile(file: File) {
//   return (dispatch: (action:
//     RemoveNotificationAction | UploadFileAction | PictureSuccessfullyUploadedAction | NotifyAction) => void) => {
//     dispatch({
//       type: UPLOAD_FILE,
//     });
//     const formData = new FormData();
//     formData.append('file', file);
//     return fetch(`${SERVER_BASE_URL}/picture/`, {
//         method: 'POST',
//         body: formData,
//       })
//       .then(response => {
//         if (!response.ok) {
//           throw Error(response.statusText);
//         }
//         return response.json();
//       })
//       .then((pictureMetadata: PictureMetadata) => {
//         dispatch({
//           type: PICTURE_SUCCESSFULLY_UPLOADED,
//           pictureMetadata,
//         });
//         const notification = {
//           level: 'info',
//           text: `uploaded '${file.name}'`,
//         } as GalleryNotification;
//         dispatch({
//           type: NOTIFY,
//           notification,
//         });
//         const cb = () => dispatch({
//           type: REMOVE_NOTIFICATION,
//           notification,
//         });
//         setTimeout(cb, 3000);
//       })
//       .catch((error: Error) => dispatch({
//             type: NOTIFY,
//             notification: {
//               level: 'error',
//               text: `error uploading '${file.name}': ${error.message}`,
//             },
//           })
//       );
//   };
// }

export function notify(notification: GalleryNotification) {
  return (dispatch: (action: NotifyAction | RemoveNotificationAction) => void) => {
    dispatch({
      type: NOTIFY,
      notification,
    });
  };
}

export function removeNotification(notification: GalleryNotification) {
  return (dispatch: (action: RemoveNotificationAction) => void) => {
    dispatch({
      type: REMOVE_NOTIFICATION,
      notification,
    });
  };
}
