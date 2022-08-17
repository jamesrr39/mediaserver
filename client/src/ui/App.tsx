import * as React from "react";
// workaround to solve "React is not defined" error (https://stackoverflow.com/a/52352349)
window.React = React;
import { connect, useDispatch, useStore } from "react-redux";
import { useQuery } from "react-query";
import { State } from "../reducers/rootReducer";

import LoginScreen from "./login/LoginScreen";
import MediaServer from "./MediaServer";

import { Person } from "../domain/People";
import { UserActionType } from "src/actions/userActions";

type Props = {
  loggedIn: boolean;
};

function useCurrentUser() {
  const dispatch = useDispatch();
  return useQuery("current-user", async () => {
    const resp = await fetch("/api/currentuser");

    if (!resp.ok || resp.status !== 200) {
      const respBody: { message: string } = await resp.json();

      return Promise.reject(respBody.message);
    }

    const body: { user?: Person } = await resp.json();
    const { user } = body;

    if (!user) {
      return;
    }

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });

    return user;
  });
}

function App(props: Props) {
  const { isLoading, error } = useCurrentUser();

  if (error) {
    return (
      <div className="alert alert-danger">
        Error when loading users. Please make sure you have an internet
        connection and the server is running.
      </div>
    );
  }

  if (isLoading) {
    return <div className="alert alert-info">Loading...</div>;
  }

  if (!props.loggedIn) {
    return <LoginScreen />;
  }
  return <MediaServer />;
}

export default connect((state: State) => {
  const { activeUser } = state.activeUserReducer;

  return {
    loggedIn: Boolean(activeUser),
  };
})(App);
