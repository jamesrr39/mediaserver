import { LoadingStatus } from '../domain/LoadingStatus';
import { CollectionActions, CollectionsAction } from '../collectionsActions';
import { CustomCollection } from '../domain/Collection';

export type CollectionReducerState = {
    loadingStatus: LoadingStatus,
    customCollections: CustomCollection[];
};
  
const collectionInitialState = {
    loadingStatus: LoadingStatus.NOT_STARTED,
    customCollections: [],
};

export function collectionsReducer(
    state: CollectionReducerState = collectionInitialState,
    action: CollectionsAction) {
switch (action.type) {
    case CollectionActions.COLLECTION_FETCH_STARTED:
    return {
        ...state,
        loadingStatus: LoadingStatus.IN_PROGRESS,
    };
    case CollectionActions.COLLECTION_FETCH_FAILED:
    return {
        ...state,
        loadingStatus: LoadingStatus.FAILED,
    };
    case CollectionActions.COLLECTIONS_FETCHED:
    return {
        ...state,
        loadingStatus: LoadingStatus.SUCCESSFUL,
        customCollections: action.customCollections,
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
