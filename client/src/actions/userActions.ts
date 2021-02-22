import { Person } from '../domain/People';
import { createErrorMessage, DataResponse } from './util';

export enum UserActionType {
  USER_LOGIN = 'USER_LOGIN',
  // ON_TOKEN_IN_REDUCER = 'ON_TOKEN_IN_REDUCER'
}

export type UserActionLogin = {
  type: UserActionType.USER_LOGIN,
  user: Person,
};

export type UserAction = UserActionLogin;

export function fetchUsers() {
    return async(): Promise<Person[]> => {
        const response = await fetch(`/api/login/users/`);
        if (!response.ok) {
          throw new Error(createErrorMessage(response));
        }
      
        const respBody: DataResponse<{people: Person[]}> = await response.json();

        return respBody.data.people;
    };
}

export function login(userId: number) {
  return async(dispatch: (action: UserAction) => void): Promise<void> => {
    const response = await fetch(`/api/login/`, {
      method: 'POST',
      body: JSON.stringify({userId}),
    });
    if (!response.ok) {
      throw new Error(createErrorMessage(response));
    }

    const respBody: DataResponse<{user: Person, token: string}> = await response.json();

    const {user} = respBody.data;

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });
  };
}

export function createUserAndLogin(username: string) {
  return async(dispatch: (action: UserAction) => void): Promise<void> => {
    const response = await fetch(`/api/login/users/`, {
      method: 'POST',
      body: JSON.stringify({username}),
    });
    if (!response.ok) {
      throw new Error(createErrorMessage(response));
    }

    const respBody: DataResponse<{user: Person, token: string}> = await response.json();

    const {user} = respBody.data;

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });
  };
}
