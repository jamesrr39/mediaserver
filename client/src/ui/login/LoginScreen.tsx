import * as React from 'react';
import { Person } from '../../domain/People';
import { fetchUsers, login, createUserAndLogin } from '../../actions/userActions';
import { connect } from 'react-redux';

type Props = {
    fetchUsers: () => Promise<Person[]>,
    login: (userId: number) => Promise<void>,
    createUserAndLogin: (username: string) => Promise<void>,
};

type ComponentState = {
    loaded: boolean,
    people: Person[],
    errorMessage?: string,
};

class LoginScreen extends React.Component<Props, ComponentState> {
    state = {
        loaded: false,
        people: [] as Person[],
        errorMessage: undefined,
    };
    componentDidMount() {
        this.props.fetchUsers()
            .then(people => this.setState(state => ({...state, people, loaded: true})))
            .catch(err => this.setState(state => ({...state, errorMessage: err, loaded: true})));
    }
    render() {
        const {loaded, people, errorMessage} = this.state;

        if (!loaded) {
            return 'Loading...';
        }

        if (errorMessage) {
            return 'error: ' + errorMessage;
        }

        if (people.length === 0) {
            return (
                <div>
                    <p>No users found. Create one?</p>
                    <form>
                        <label>
                            Username:
                            <input type="text" name="username" />
                        </label>
                        <button type="submit" onClick={event => {
                            event.preventDefault();
                            const form = event.currentTarget.form;
                            if (!form) {
                                throw new Error('couldn\'t find form');
                            }
                            const username = (form.elements.namedItem('username') as HTMLInputElement).value;

                            this.createUserAndLogin(username);
                        }}>Create user!</button>
                    </form>
                </div>
            );
        }

        return (
            <div>
                <p>Select a user:</p>

                <ul style={{listStyle: 'none'}}>
                {people.map((person, idx) => {
                    return (
                        <li key={idx}>
                            <button onClick={() => this.loginWithExistingUser(person)}>{person.name}</button>
                        </li>
                    );
                })}
                </ul>
            </div>
        );
    }

    private async loginWithExistingUser(user: Person) {
        try {
            await this.props.login(user.id);
        } catch (err) {
            this.setState(state => ({...state, errorMessage: err, loaded: true}));
        }
    }

    private async createUserAndLogin(username: string) {
        try {
            await this.props.createUserAndLogin(username);
        } catch (err) {
            this.setState(state => ({...state, errorMessage: err, loaded: true}));
        }
    }
}

export default connect(undefined, {
    fetchUsers,
    login,
    createUserAndLogin,
})(LoginScreen);
