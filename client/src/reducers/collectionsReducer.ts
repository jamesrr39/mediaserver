import {
  CollectionActions,
  CollectionsAction,
} from "../actions/collectionsActions";
import { CustomCollection } from "../domain/Collection";

export type CollectionReducerState = {
  customCollections: CustomCollection[];
};

const collectionInitialState = {
  customCollections: [],
};

export function collectionsReducer(
  state: CollectionReducerState = collectionInitialState,
  action: CollectionsAction
) {
  switch (action.type) {
    case CollectionActions.COLLECTIONS_FETCHED:
      return {
        ...state,
        customCollections: action.customCollections,
      };
    case CollectionActions.COLLECTION_SAVED:
      const collectionsWithoutUpdated = state.customCollections.filter(
        (customCollection) => customCollection.id !== action.collection.id
      );
      collectionsWithoutUpdated.push(action.collection);

      return {
        ...state,
        customCollections: collectionsWithoutUpdated,
      };
    default:
      return state;
  }
}
