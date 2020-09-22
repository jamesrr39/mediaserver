import { Person } from '../domain/People';
import { PeopleMap } from '../actions/mediaFileActions';
import { LoadingState } from '../actions/util';
import { PeopleAction, PeopleActionTypes } from '../actions/peopleActions';

export type PeopleState = {
people: Person[],
peopleMap: PeopleMap,
loadingState: LoadingState,
};

const peopleInitialState = {
  people: [],
  peopleMap: new Map<number, Person>(),
  loadingState: LoadingState.NOT_STARTED,
};

export function peopleReducer(
    state: PeopleState = peopleInitialState, 
    action: PeopleAction) {
    switch (action.type) {
        case PeopleActionTypes.PEOPLE_FETCH_STARTED:
            return {
                ...state,
                loadingState: LoadingState.IN_PROGRESS,
            };
        case PeopleActionTypes.PEOPLE_FETCHED: {
            const {people} = action;
            const peopleMap = new Map<number, Person>();
            people.forEach(person => peopleMap.set(person.id, person));

            return {
                ...state,
                people,
                peopleMap,
                loadingState: LoadingState.SUCCESS,
            };
        }

        case PeopleActionTypes.PEOPLE_CREATED: {
            const {people} = action;

            people.forEach(person => state.peopleMap.set(person.id, person));
            return {
                ...state,
                people: state.people.concat(people),
            };
        }

        case PeopleActionTypes.PEOPLE_FETCH_FAILED:
            return {
                ...state,
                loadingState: LoadingState.FAILED,
            };
        default:
            return state;
    }
  }