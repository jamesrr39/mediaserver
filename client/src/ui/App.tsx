import * as React from "react";
import { useQuery } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { State } from "../reducers/rootReducer";
// workaround to solve "React is not defined" error (https://stackoverflow.com/a/52352349)
window.React = React;

import LoginScreen from "./login/LoginScreen";
import MediaServer from "./MediaServer";

import { UserActionType } from "src/actions/userActions";
import { Person } from "../domain/People";

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
      return { user };
    }

    dispatch({
      type: UserActionType.USER_LOGIN,
      user,
    });

    return { user };
  });
}

function App() {
  const { activeUser } = useSelector((state: State) => state.activeUserReducer);

  const { isLoading, error, data } = useCurrentUser();

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

  if (!activeUser && !data.user) {
    return <LoginScreen />;
  }
  return <MediaServer />;
}

export default App;
