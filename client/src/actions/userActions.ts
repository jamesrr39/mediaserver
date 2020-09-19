import { Person } from '../domain/People';
import { createErrorMessage, DataResponse } from './util';
import { SERVER_BASE_URL } from '../configs';

export enum UserActionType {
  USER_LOGIN = 'USER_LOGIN',
}

export type UserActionLogin = {
  type: UserActionType.USER_LOGIN,
  user: Person,
};

export type UserAction = UserActionLogin;

export function fetchUsers() {
    return async(): Promise<Person[]> => {
        const response = await fetch(`${SERVER_BASE_URL}/api/login/users`);
        if (!response.ok) {
          throw new Error(createErrorMessage(response));
        }
      
        const respBody: DataResponse<Person[]> = await response.json();

        return respBody.data;
    };
}

export function login(userId: number) {
  return async(dispatch: (action: UserAction) => void ): Promise<void> => {
    const response = await fetch(`${SERVER_BASE_URL}/api/login/`, {method: 'POST'});
    if (!response.ok) {
      throw new Error(createErrorMessage(response));
    }

    const respBody: DataResponse<Person> = await response.json();

    dispatch({
      type: UserActionType.USER_LOGIN,
      user: respBody.data,
    });
  };
}