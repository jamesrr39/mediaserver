import * as React from "react";
import { Person } from "../../domain/People";
import {
  fetchUsers,
  login,
  createUserAndLogin,
  UserActionType,
} from "../../actions/userActions";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "react-query";

function useLoginWithExistingUser() {
  const dispatch = useDispatch();

  return useMutation((u: Person) => {
    const user = login(u.id);

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });

    return user;
  });
}

function useCreateUserAndLogin() {
  const dispatch = useDispatch();

  return useMutation((username: string) => {
    const user = createUserAndLogin(username);

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });

    return user;
  });
}

function LoginScreen() {
  const { isLoading, error, data } = useQuery("login", () => fetchUsers());
  const createUserAndLoginMutation = useCreateUserAndLogin();
  const loginWithExistingUserMutation = useLoginWithExistingUser();

  if (isLoading) {
    return "Loading...";
  }

  if (error) {
    return "Error loading users";
  }

  if (loginWithExistingUserMutation.isLoading) {
    return "Logging in...";
  }

  if (loginWithExistingUserMutation.error) {
    return "Error logging in";
  }

  if (createUserAndLoginMutation.isLoading) {
    return "Creating a new user and logging in...";
  }

  if (createUserAndLoginMutation.error) {
    return "Error creating a new user and logging in";
  }

  const people = data;

  if (people.length === 0) {
    return (
      <div>
        <p>No users found. Create one?</p>
        <form>
          <label>
            Username:
            <input type="text" name="username" />
          </label>
          <button
            type="submit"
            onClick={(event) => {
              event.preventDefault();
              const form = event.currentTarget.form;

              const username = (
                form.elements.namedItem("username") as HTMLInputElement
              ).value;

              createUserAndLoginMutation.mutate(username);
            }}
          >
            Create user!
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p>Select a user:</p>

      <ul style={{ listStyle: "none" }}>
        {people.map((person, idx) => {
          return (
            <li key={idx}>
              <button
                className="btn btn-primary"
                onClick={() => loginWithExistingUserMutation.mutate(person)}
              >
                {person.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default LoginScreen;
