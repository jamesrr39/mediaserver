import { Action } from "redux";
import { Collection, CustomCollection } from "../domain/Collection";
import { Dispatch } from "react";
import { createErrorMessage } from "./util";
import { State } from "../reducers/rootReducer";

export enum CollectionActions {
  FETCH_COLLECTIONS = "FETCH_COLLECTIONS",
  COLLECTION_FETCH_STARTED = "COLLECTION_FETCH_STARTED",
  COLLECTIONS_FETCHED = "COLLECTIONS_FETCHED",
  COLLECTION_FETCH_FAILED = "COLLECTION_FETCH_FAILED",
  COLLECTION_SAVED = "COLLECTION_SAVED",
  SAVE_COLLECTION = "SAVE_COLLECTION",
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
  type: CollectionActions.SAVE_COLLECTION;
  collection: CustomCollection;
};

export type CollectionsFetchFailedAction = {
  type: CollectionActions.COLLECTION_FETCH_FAILED;
};

export type CollectionsAction =
  | CollectionsFetchedAction
  | FetchCollectionsAction
  | CollectionsFetchFailedAction
  | CollectionSavedAction
  | SaveCollectionAction
  | FetchCollectionsStartedAction;

type CustomCollectionJSON = {
  id: number;
} & Collection;

export type FetchCollectionsResponse = {
  customCollections: CustomCollection[];
};

export function fetchCollections() {
  return async (
    dispatch: Dispatch<CollectionsAction>,
  ): Promise<FetchCollectionsResponse> => {
    dispatch({
      type: CollectionActions.FETCH_COLLECTIONS,
    });
    const response = await fetch(`/api/collections/`);
    if (!response.ok) {
      dispatch({
        type: CollectionActions.COLLECTION_FETCH_FAILED,
      });
      throw new Error(createErrorMessage(response));
    }

    const collectionsJSON: CustomCollectionJSON[] = await response.json();

    const customCollections = collectionsJSON.map(
      (collectionJSON) =>
        new CustomCollection(
          collectionJSON.id,
          collectionJSON.name,
          collectionJSON.fileHashes
        )
    );

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
  return async (
    dispatch: (action: CollectionsAction) => void,
  ) => {
    const url =
      collection.id === 0
        ? `/api/collections/`
        : `/api/collections/${encodeURIComponent(collection.id)}`;
    const method = collection.id === 0 ? "POST" : "PUT";

    console.log('url::', url, method, collection, collection.toJSON())

const body = JSON.stringify(collection)

    const response = await fetch(url, {
      method,
      body,
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const collectionJSON = await response.json();

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
