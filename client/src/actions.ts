import { PictureMetadata } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';

export const FETCH_PICTURES_METADATA = 'FETCH_PICTURES_METADATA';

export const PICTURES_METADATA_FETCHED = 'PICTURES_METADATA_FETCHED';

export interface PicturesMetadataFetchedAction extends Action {
  picturesMetadatas: PictureMetadata[];
}

export const UPLOAD_FILE = 'UPLOAD_FILE';

export const PICTURE_SUCCESSFULLY_UPLOADED = 'PICTURE_SUCCESSFULLY_UPLOADED';

export interface PictureSuccessfullyUploadedAction extends Action {
  pictureMetadata: PictureMetadata;
}

export function fetchPicturesMetadata() {
  // tslint:disable-next-line
  return (dispatch: (action: Action) => void) => {
    dispatch({
      type: FETCH_PICTURES_METADATA,
    });
    return fetch(`${SERVER_BASE_URL}/api/pictureMetadata/`)
      .then(response => response.json())
      .then((picturesMetadatas: PictureMetadata[]) => dispatch({
        type: PICTURES_METADATA_FETCHED,
        picturesMetadatas,
      } as PicturesMetadataFetchedAction));
  };
}

export function uploadFile(file: File) {
  return (dispatch: (action: Action) => void) => {
    dispatch({
      type: UPLOAD_FILE,
    });
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${SERVER_BASE_URL}/picture/`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then((pictureMetadata: PictureMetadata) => dispatch({
        type: PICTURE_SUCCESSFULLY_UPLOADED,
        pictureMetadata,
      } as PictureSuccessfullyUploadedAction)
    ).then(() => fetchPicturesMetadata()(dispatch)).catch((error => {
      // tslint:disable-next-line
      console.log(error);
    }));
  };
}
