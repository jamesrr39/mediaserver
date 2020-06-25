export type DataResponse<T> = {
    data: T
};

export function createErrorMessage(response: Response) {
    return `failed to load from ${response.url}, response status: ${response.status}`;

}