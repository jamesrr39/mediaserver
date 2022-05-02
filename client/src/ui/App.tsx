import * as React from 'react';
// workaround to solve "React is not defined" error (https://stackoverflow.com/a/52352349)
window.React = React;
import { connect, useStore } from 'react-redux';
import { State } from '../reducers/rootReducer';

import LoginScreen from './login/LoginScreen';
import MediaServer from './MediaServer';

type Props = {
    loggedIn: boolean
};

function App(props: Props) {
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
