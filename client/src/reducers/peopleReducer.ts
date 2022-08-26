import { Person } from "../domain/People";
import { PeopleMap } from "../actions/mediaFileActions";
import { PeopleAction, PeopleActionTypes } from "../actions/peopleActions";

export type PeopleState = {
  people: Person[];
  peopleMap: PeopleMap;
};

export const peopleInitialState = {
  people: [],
  peopleMap: new Map<number, Person>(),
};

export function peopleReducer(
  state: PeopleState = peopleInitialState,
  action: PeopleAction
) {
  switch (action.type) {
    case PeopleActionTypes.PEOPLE_FETCHED: {
      const { people } = action;
      const peopleMap = new Map<number, Person>();
      people.forEach((person) => peopleMap.set(person.id, person));

      return {
        ...state,
        people,
        peopleMap,
      };
    }

    case PeopleActionTypes.PEOPLE_CREATED: {
      const { people } = action;

      people.forEach((person) => state.peopleMap.set(person.id, person));
      return {
        ...state,
        people: state.people.concat(people),
      };
    }

    case PeopleActionTypes.PEOPLE_FETCH_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
}
