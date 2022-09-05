import * as React from "react";
import { Person } from "../../domain/People";
import {
  fetchUsers,
  login,
  createUserAndLogin,
} from "../../actions/userActions";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "react-query";

const styles = {
  loginWithExistingButton: {
    minWidth: "300px",
  },
};

function useLoginWithExistingUserMutation() {
  const dispatch = useDispatch();

  return useMutation((userId: number) => {
    const user = login(userId)(dispatch);

    return user;
  });
}

function useCreateUserAndLoginMutation() {
  const dispatch = useDispatch();

  return useMutation((username: string) => {
    const user = createUserAndLogin(username)(dispatch);

    return user;
  });
}

function LoginScreen() {
  const { isLoading, error, data } = useQuery("users", () => fetchUsers());
  const createUserAndLoginMutation = useCreateUserAndLoginMutation();
  const loginWithExistingUserMutation = useLoginWithExistingUserMutation();

  if (isLoading) {
    return <div className="alert alert-info">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">"Error loading users"</div>;
  }

  if (loginWithExistingUserMutation.isLoading) {
    return <div className="alert alert-info">Logging in...</div>;
  }

  if (loginWithExistingUserMutation.error) {
    return <div className="alert alert-danger">"Error logging in</div>;
  }

  if (createUserAndLoginMutation.isLoading) {
    return (
      <div className="alert alert-info">
        Creating a new user and logging in...
      </div>
    );
  }

  if (createUserAndLoginMutation.error) {
    return (
      <div className="alert alert-danger">
        Error creating a new user and logging in
      </div>
    );
  }

  const people = data;

  if (people.length === 0) {
    return (
      <div className="row">
        <div className="col">
          <div className="container-fluid">
            <p>No users found. Create one?</p>
            <form>
              <label>
                Username:
                <input className="form-control" type="text" name="username" />
              </label>
              <button
                type="submit"
                className="btn btn-secondary"
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <p>Select a user:</p>

      <div>
        {people.map((person, idx) => {
          return (
            <div key={idx} className="row">
              <div className="col-12">
                <div className="p-2 d-flex justify-content-center">
                  <button
                    style={styles.loginWithExistingButton}
                    className="btn btn-secondary"
                    onClick={() =>
                      loginWithExistingUserMutation.mutate(person.id)
                    }
                  >
                    {person.name}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LoginScreen;
