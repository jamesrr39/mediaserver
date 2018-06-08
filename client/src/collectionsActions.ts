import { SERVER_BASE_URL } from './configs';
import { Action } from 'redux';
import { Collection } from './domain/Collection';

export const FETCH_COLLECTIONS = 'FETCH_COLLECTIONS';

export interface FetchCollectionsAction extends Action {
  type: 'FETCH_COLLECTIONS';
}

export const COLLECTIONS_FETCHED = 'COLLECTIONS_FETCHED';

export interface CollectionsFetchedAction extends Action {
  type: 'COLLECTIONS_FETCHED';
  collections: Collection[];
}

export type CollectionsAction = CollectionsFetchedAction | FetchCollectionsAction;

export function fetchCollections() {
  return (dispatch: (action: CollectionsAction) => void) => {
    dispatch({
      type: FETCH_COLLECTIONS,
    });
    return fetch(`${SERVER_BASE_URL}/api/collections/`)
      .then(response => response.json())
      .then((collections: Collection[]) => dispatch({
        type: COLLECTIONS_FETCHED,
        collections,
      }));
  };
}
