import { SERVER_BASE_URL } from './configs';
import { Action } from 'redux';
import { Collection, CustomCollection } from './domain/Collection';
import { Dispatch } from 'react';

export enum CollectionActions {
  FETCH_COLLECTIONS = 'FETCH_COLLECTIONS',
  COLLECTIONS_FETCHED = 'COLLECTIONS_FETCHED',
  COLLECTION_SAVED = 'COLLECTION_SAVED',
  SAVE_COLLECTION = 'SAVE_COLLECTION',
}

export interface FetchCollectionsAction extends Action {
  type: CollectionActions.FETCH_COLLECTIONS;
}

export interface CollectionsFetchedAction extends Action {
  type: CollectionActions.COLLECTIONS_FETCHED;
  customCollections: CustomCollection[];
}

export type CollectionSavedAction = {
  type: CollectionActions.COLLECTION_SAVED;
  collection: CustomCollection;
};

export type SaveCollectionAction = {
  type: CollectionActions.SAVE_COLLECTION,
  collection: CustomCollection,
};

export type CollectionsAction = CollectionsFetchedAction | 
  FetchCollectionsAction | CollectionSavedAction | SaveCollectionAction;

type CustomCollectionJSON = {
  id: number;
} & Collection;

export function fetchCollections() {
  return (dispatch: Dispatch<CollectionsAction>) => {
    dispatch({
      type: CollectionActions.FETCH_COLLECTIONS,
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
          type: CollectionActions.COLLECTIONS_FETCHED,
          customCollections,
        });
      });
  };
}

export function saveCollection(collection: CustomCollection) {
  return async (dispatch: (action: CollectionsAction) => void) => {
    const url = (collection.id === 0)
      ? `${SERVER_BASE_URL}/api/collections/`
      : `${SERVER_BASE_URL}/api/collections/${collection.id}`;
    const method = (collection.id === 0) ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      body: JSON.stringify(collection),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const collectionJSON = await response.json();
    // collectionJSON: CustomCollectionJSON) => {
    const returnedCollection = new CustomCollection(
      collectionJSON.id,
      collectionJSON.name,
      collectionJSON.fileHashes
    );
      // dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.INFO, 'Saved!')));
    dispatch({
      type: CollectionActions.COLLECTION_SAVED,
      collection: returnedCollection,
    });

    return returnedCollection;
    
    // onSuccess(returnedCollection);
    
    // }).catch((errMessage: string) => {
    //   dispatch(newNotificationAction(
    //     new GalleryNotification(NotificationLevel.ERROR, `error saving: '${errMessage}'`)));
    // });
  };
}
