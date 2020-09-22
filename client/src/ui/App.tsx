import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../reducers/rootReducer';

import LoginScreen from './login/LoginScreen';
import MediaServer from './MediaServer';

type Props = {
    loggedIn: boolean
};

class App extends React.Component<Props> {
    render() {
        const { loggedIn } = this.props;

        if (!loggedIn) {
            return <LoginScreen onSuccessfulLogin={() => console.log('logged in...')} />;
        }
        return <MediaServer />;
    }
}

export default connect((state: State) => {
  const { activeUser } = state.activeUserReducer;

  return {
      loggedIn: Boolean(activeUser),
  };
})(App);
