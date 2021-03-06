import { SERVER_BASE_URL } from '../configs';
import { Action } from 'redux';
import { Collection, CustomCollection } from '../domain/Collection';
import { Dispatch } from 'react';
import { createErrorMessage, fetchWithAuth } from './util';
import { State } from '../reducers/rootReducer';

export enum CollectionActions {
  FETCH_COLLECTIONS = 'FETCH_COLLECTIONS',
  COLLECTION_FETCH_STARTED = 'COLLECTION_FETCH_STARTED',
  COLLECTIONS_FETCHED = 'COLLECTIONS_FETCHED',
  COLLECTION_FETCH_FAILED = 'COLLECTION_FETCH_FAILED',
  COLLECTION_SAVED = 'COLLECTION_SAVED',
  SAVE_COLLECTION = 'SAVE_COLLECTION',
}

export interface FetchCollectionsStartedAction extends Action {
  type: CollectionActions.COLLECTION_FETCH_STARTED;
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

export type CollectionsFetchFailedAction = {
  type: CollectionActions.COLLECTION_FETCH_FAILED,
};

export type CollectionsAction = CollectionsFetchedAction | 
  FetchCollectionsAction | CollectionsFetchFailedAction | CollectionSavedAction | SaveCollectionAction | 
  FetchCollectionsStartedAction;

type CustomCollectionJSON = {
  id: number;
} & Collection;

export type FetchCollectionsResponse = {
  customCollections: CustomCollection[]
};

export function fetchCollections() {
  return async (dispatch: Dispatch<CollectionsAction>, getState: () => State): Promise<FetchCollectionsResponse> => {
    const state = getState();

    dispatch({
      type: CollectionActions.FETCH_COLLECTIONS,
    });
    const response = await fetchWithAuth(state, `${SERVER_BASE_URL}/api/collections/`);
    if (!response.ok) {
      dispatch({
        type: CollectionActions.COLLECTION_FETCH_FAILED,
      });
      throw new Error(createErrorMessage(response));
    }

    const collectionsJSON: CustomCollectionJSON[] = await response.json();

    const customCollections = collectionsJSON.map(collectionJSON => new CustomCollection(
      collectionJSON.id,
      collectionJSON.name,
      collectionJSON.fileHashes,
    ));

    dispatch({
      type: CollectionActions.COLLECTIONS_FETCHED,
      customCollections,
    });

    return {
      customCollections,
    };
  };
}

export function saveCollection(collection: CustomCollection) {
  return async (dispatch: (action: CollectionsAction) => void, getState: () => State) => {
    const state = getState();

    const url = (collection.id === 0)
      ? `${SERVER_BASE_URL}/api/collections/`
      : `${SERVER_BASE_URL}/api/collections/${collection.id}`;
    const method = (collection.id === 0) ? 'POST' : 'PUT';
    
    const response = await fetchWithAuth(state, url, {
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
    dispatch({
      type: CollectionActions.COLLECTION_SAVED,
      collection: returnedCollection,
    });

    return returnedCollection;
  };
}
