import { Person } from "../domain/People";
import { createErrorMessage, DataResponse } from "./util";

export enum UserActionType {
  USER_LOGIN = "USER_LOGIN",
  // ON_TOKEN_IN_REDUCER = 'ON_TOKEN_IN_REDUCER'
}

export type UserActionLogin = {
  type: UserActionType.USER_LOGIN;
  user: Person;
};

export type UserAction = UserActionLogin;

export async function fetchUsers() {
  const response = await fetch(`/api/login/users/`);
  if (!response.ok) {
    throw new Error(createErrorMessage(response));
  }

  const respBody: DataResponse<{ people: Person[] }> = await response.json();

  return respBody.data.people;
}

export async function login(userId: number) {
  const response = await fetch(`/api/login/`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(createErrorMessage(response));
  }

  const respBody: DataResponse<{ user: Person; token: string }> =
    await response.json();

  const { user } = respBody.data;

  return user;
}

export async function createUserAndLogin(username: string) {
  const response = await fetch(`/api/login/users/`, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    throw new Error(createErrorMessage(response));
  }

  const respBody: DataResponse<{ user: Person; token: string }> =
    await response.json();

  const { user } = respBody.data;

  return user;
}
