import { CollectionActions, CollectionsAction } from '../actions/collectionsActions';
import { LoadingState } from '../actions/util';
import { CustomCollection } from '../domain/Collection';

export type CollectionReducerState = {
    customCollections: CustomCollection[];
    loadingState: LoadingState;
};
  
const collectionInitialState = {
    customCollections: [],
    loadingState: LoadingState.NOT_STARTED,
};

export function collectionsReducer(
    state: CollectionReducerState = collectionInitialState,
    action: CollectionsAction) {
switch (action.type) {
    case CollectionActions.COLLECTION_FETCH_STARTED:
        return {
            ...state,
            loadingState: LoadingState.IN_PROGRESS,
        };
    case CollectionActions.COLLECTIONS_FETCHED:
        return {
            ...state,
            customCollections: action.customCollections,
            loadingState: LoadingState.SUCCESS,
        };
    case CollectionActions.COLLECTION_FETCH_FAILED:
        return {
            ...state,
            loadingState: LoadingState.FAILED,
        };
    case CollectionActions.COLLECTION_SAVED:
    const collectionsWithoutUpdated = state.customCollections.filter(
        customCollection => customCollection.id !== action.collection.id);
    collectionsWithoutUpdated.push(action.collection);

    return {
        ...state,
        customCollections: collectionsWithoutUpdated,
    };
    default:
    return state;
}
}
