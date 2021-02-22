import { Person } from '../domain/People';
import { State } from '../reducers/rootReducer';
import { createErrorMessage, DataResponse } from './util';

export enum PeopleActionTypes {
    PEOPLE_FETCHED = 'PEOPLE_FETCHED',
    PEOPLE_FETCH_FAILED = 'PEOPLE_FETCH_FAILED',
    PEOPLE_CREATED = 'PEOPLE_CREATED',
    PEOPLE_FETCH_STARTED = 'PEOPLE_FETCH_STARTED',
}

export interface PersonCreatedAction {
    type: PeopleActionTypes.PEOPLE_CREATED;
    people: Person[];
}

export type PeopleFetchedAction = {
    type: PeopleActionTypes.PEOPLE_FETCHED,
    people: Person[],
};

export type PeopleFetchStartedAction = {
    type: PeopleActionTypes.PEOPLE_FETCH_STARTED,
};

export type PeopleFetchedFailedAction = {
    type: PeopleActionTypes.PEOPLE_FETCH_FAILED,
};

export type PeopleAction = 
    PersonCreatedAction | 
    PeopleFetchedAction | 
    PeopleFetchedFailedAction | 
    PeopleFetchStartedAction;

export type FetchAllPeopleResponse = {
    people: Person[],
};

export function fetchAllPeople() {
    return async(
        dispatch: (action: PeopleAction) => void, getState: () => State): Promise<FetchAllPeopleResponse> => {

        dispatch({
            type: PeopleActionTypes.PEOPLE_FETCH_STARTED,
        });

        const response = await fetch(`/api/graphql?query={people{id,name,isUser}}`);
        if (!response.ok) {
            dispatch({
                type: PeopleActionTypes.PEOPLE_FETCH_FAILED,
            });
            throw new Error(createErrorMessage(response));
        }

        const peopleJSON: DataResponse<{people: Person[]}> = await response.json();
        const {people} = peopleJSON.data;

        dispatch({
            type: PeopleActionTypes.PEOPLE_FETCHED,
            people,
        });

        return {
            people, 
        };
    };
}

export function createPerson(name: string) {
    return async(dispatch: (action: PeopleAction) => void, getState: () => State) => {
        const response = await fetch(`/api/graphql?query={people{id,name}}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/graphql',
            },
            body: `mutation {
                createPeople(names: ${JSON.stringify(name)}) {id,name}
            }`,
        });

        if (!response.ok) {
            throw new Error(createErrorMessage(response));
        }

        const json: DataResponse<Person> = await response.json();
        const person = json.data;

        dispatch({
            type: PeopleActionTypes.PEOPLE_CREATED,
            people: [person],
        });

        return person;
    };
}