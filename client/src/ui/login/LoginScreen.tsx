import * as React from 'react';
import { Person } from '../../domain/People';
import { connect } from 'react-redux';

type Props = {
    fetchUsers: () => Promise<Person[]>,
    login: (username: string) => Promise<void>,
};

type ComponentState = {
    loaded: boolean,
    users: Person[],
    errorMessage?: string,
}

class LoginScreen extends React.Component<Props, ComponentState> {
    state = {
        loaded: false,
        users: [],
        errorMessage: undefined,
    };
    componentDidMount() {
        this.props.fetchUsers()
            .then(users => this.setState(state => ({...state, users, loaded: true})))
            .catch(err => this.setState(state => ({...state, errorMessage: err, loaded: true})));
    }
    render() {
        const {loaded, users, errorMessage} = this.state;

        if (!loaded) {
            return 'Loading...';
        }

        if (errorMessage) {
            return 'error: ' + errorMessage;
        }

        return <div>
            <p>Select a user:</p>

            {users.map(user => {
                return <button>{user}</button>;
            })}
        </div>;
    }
}

export default connect(undefined, {})(LoginScreen);