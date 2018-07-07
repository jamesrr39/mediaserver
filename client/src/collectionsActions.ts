import { SERVER_BASE_URL } from './configs';
import { Action } from 'redux';
import { Collection, CustomCollection } from './domain/Collection';
import { NotifyAction, newNotificationAction } from './actions/notificationActions';
import { NotificationLevel } from './ui/NotificationBarComponent';

export const FETCH_COLLECTIONS = 'FETCH_COLLECTIONS';

export interface FetchCollectionsAction extends Action {
  type: 'FETCH_COLLECTIONS';
}

export const COLLECTIONS_FETCHED = 'COLLECTIONS_FETCHED';

export interface CollectionsFetchedAction extends Action {
  type: 'COLLECTIONS_FETCHED';
  customCollections: CustomCollection[];
}

export const COLLECTION_SAVED = 'COLLECTION_SAVED';
// FIXME: use enum for action

export type CollectionSavedAction = {
  type: 'COLLECTION_SAVED';
  collection: CustomCollection;
};

export type CollectionsAction = CollectionsFetchedAction | FetchCollectionsAction | CollectionSavedAction;

type CustomCollectionJSON = {
  id: number;
} & Collection;

export function fetchCollections() {
  return (dispatch: (action: CollectionsAction) => void) => {
    dispatch({
      type: FETCH_COLLECTIONS,
    });
    return fetch(`${SERVER_BASE_URL}/api/collections/`)
      .then(response => response.json())
      .then((collectionsJSON: CustomCollectionJSON[]) => {
        const customCollections = collectionsJSON.map(collectionJSON => new CustomCollection(
          collectionJSON.id,
          collectionJSON.name,
          collectionJSON.fileHashes,
        ));
        dispatch({
          type: COLLECTIONS_FETCHED,
          customCollections,
        });
      });
  };
}

export function saveCollection(collection: CustomCollection, onSuccess: () => void) {
  return (dispatch: (action: CollectionsAction | NotifyAction) => void) => {
    const url = (collection.id === 0)
      ? `${SERVER_BASE_URL}/api/collections/`
      : `${SERVER_BASE_URL}/api/collections/${collection.id}`;
    const method = (collection.id === 0) ? 'POST' : 'PUT';
    fetch(url, {
      method,
      body: JSON.stringify(collection),
    }).then((response: Response) => {
      if (!response.ok) {
        throw new Error(`${response.statusText} (${response.status})`);
      }
      response.json().then((collectionJSON: CustomCollectionJSON) => {
        const returnedCollection = new CustomCollection(
          collectionJSON.id,
          collectionJSON.name,
          collectionJSON.fileHashes
        );
        dispatch(newNotificationAction(NotificationLevel.INFO, 'Saved!'));
        dispatch({
          type: COLLECTION_SAVED,
          collection: returnedCollection,
        });
        onSuccess();
      });
    }).catch((errMessage: string) => {
      dispatch(newNotificationAction(NotificationLevel.ERROR, `error saving: '${errMessage}'`));
    });
  };
}
