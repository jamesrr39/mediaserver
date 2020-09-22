import { State } from '../reducers/rootReducer';

export type DataResponse<T> = {
    data: T
};

export function createErrorMessage(response: Response) {
    return `failed to load from ${response.url}, response status: ${response.status}`;
}

export function fetchWithAuth(state: State, url: string, requestInfo?: RequestInit) {
    const { token } = state.activeUserReducer && state.activeUserReducer.activeUser || {};
    if (!token) {
        throw new Error('no token in state requesting ' + url);
    }

    const existingHeaders = (requestInfo && requestInfo.headers) || {};
    const headers = new Headers(existingHeaders);
    headers.set('Authorization', `Bearer ${token}`);

    const newRequestInfo = {
        ...(requestInfo || {}),
        headers,
    };

    return fetch(url, newRequestInfo);
}

export enum LoadingState {
    NOT_STARTED,
    IN_PROGRESS,
    SUCCESS,
    FAILED,
}
