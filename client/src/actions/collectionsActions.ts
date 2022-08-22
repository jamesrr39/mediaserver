import { Action } from "redux";
import { Collection, CustomCollection } from "../domain/Collection";
import { Dispatch } from "react";
import { createErrorMessage } from "./util";

export enum CollectionActions {
  COLLECTIONS_FETCHED = "COLLECTIONS_FETCHED",
  COLLECTION_SAVED = "COLLECTION_SAVED",
}

export interface CollectionsFetchedAction extends Action {
  type: CollectionActions.COLLECTIONS_FETCHED;
  customCollections: CustomCollection[];
}

export type CollectionSavedAction = {
  type: CollectionActions.COLLECTION_SAVED;
  collection: CustomCollection;
};

export type CollectionsAction =
  | CollectionsFetchedAction
  | CollectionSavedAction;

type CustomCollectionJSON = {
  id: number;
} & Collection;

export type FetchCollectionsResponse = {
  customCollections: CustomCollection[];
};

export async function fetchCollections() {
  const response = await fetch(`/api/collections/`);
  if (!response.ok) {
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

  return customCollections;
}

export function saveCollection(collection: CustomCollection) {
  return async (dispatch: (action: CollectionsAction) => void) => {
    const url =
      collection.id === 0
        ? `/api/collections/`
        : `/api/collections/${encodeURIComponent(collection.id)}`;
    const method = collection.id === 0 ? "POST" : "PUT";

    console.log("url::", url, method, collection, collection.toJSON());

    const body = JSON.stringify(collection);

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
