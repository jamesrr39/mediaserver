import { PictureMetadata } from './domain/PictureMetadata';
import { Action } from 'redux';
import { SERVER_BASE_URL } from './configs';

export const FETCH_PICTURES_METADATA = 'FETCH_PICTURES_METADATA';

export const PICTURES_METADATA_FETCHED = 'PICTURES_METADATA_FETCHED';

export interface PicturesMetadataFetchedAction extends Action {
  picturesMetadatas: PictureMetadata[];
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
