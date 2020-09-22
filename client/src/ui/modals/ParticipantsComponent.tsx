import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import CreateableSelect from 'react-select/creatable';
import { ValueType } from 'react-select/src/types';
import { connect } from 'react-redux';
import { State } from '../../reducers/rootReducer';
import { Person } from '../../domain/People';
import { PeopleMap, setParticipantsOnMediaFile } from '../../actions/mediaFileActions';
import { createPerson } from '../../actions/peopleActions';

const styles = {
    selectStyles: {
      color: 'black',
    },
};

type SelectedOption = {value: string, label: string, __isNew__?: boolean};

type Props = {
    mediaFile: MediaFile,
    people: Person[];
    peopleMap: PeopleMap;
    setParticipantsOnMediaFile: (mediaFile: MediaFile, participants: Person[]) => void;
    createPerson: (name: string) => Promise<Person>
};

type ComponentState = {
    editing: boolean,
};

class PartipantsComponent extends React.Component<Props, ComponentState> {
    state = {
        editing: false,
    };

    render() {
        const {editing} = this.state;
    
        return (
            <>
                <h3>Who was here</h3>
                {editing ? this.renderEditView() : this.renderReadView()}
            </>
        );
    }

    private renderReadView() {
        const {mediaFile, peopleMap} = this.props;

        const names = mediaFile.participantIds.map(id => {
            const person = peopleMap.get(id);

            if (!person) {
                return `unknown person (ID: ${id})`;
            }

            return person.name;
        });

        return (
            <>
                <ul>
                    {names.map((name, index) => <li key={index}>{name}</li>)}
                </ul>
                <button onClick={event => this.setState(state => ({...state, editing: true}))}>
                    Edit
                </button>
            </>
        );
    }

    private renderEditView() {
        const {people, mediaFile} = this.props;

        const peopleInFile = people.filter(person => mediaFile.participantIds.includes(person.id)).map(person => ({
            value: person.id + '',
            label: person.name,
        }));

        const allPeople = people.map(person => ({
            value: person.id + '',
            label: person.name,
        }));

        return (
            <>
                <span style={styles.selectStyles}>
                    <CreateableSelect
                        isMulti={true}
                        onChange={(selected: ValueType<SelectedOption[]>) => 
                            this.onChoosePerson(selected as SelectedOption[])}
                        defaultValue={peopleInFile}
                        // options={(allPeople as unknown) as undefined}
                        options={allPeople as unknown as undefined}
                    />
                </span>

                <button onClick={event => this.setState(state => ({...state, editing: false}))}>
                        Finished Editing
                </button>
            </>
        );
    }

    private async onChoosePerson(selectedItems: SelectedOption[]) {
        
        const {setParticipantsOnMediaFile, mediaFile, peopleMap, createPerson} = this.props;

        const people: Person[] = [];
        for (let selected of selectedItems) {
            const id = parseInt(selected.value, 10);

            let person = peopleMap.get(id);
            if (!person) {
                person = await createPerson(selected.label);
            }

            people.push(person);
        }

        setParticipantsOnMediaFile(mediaFile, people);
    }
}

function mapStateToProps(state: State) {
    const {people, peopleMap} = state.peopleReducer;

    return {
        people,
        peopleMap,
    };
}

export default connect(mapStateToProps, {setParticipantsOnMediaFile, createPerson}) (PartipantsComponent);