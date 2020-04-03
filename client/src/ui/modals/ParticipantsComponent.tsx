import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import CreateableSelect from 'react-select/creatable';
import { ValueType } from 'react-select/src/types';
import { connect } from 'react-redux';
import { State } from '../../reducers/rootReducer';
import { Person } from '../../domain/People';
import { addParticipantToMediaFile, PeopleMap } from '../../actions/mediaFileActions';

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
    addParticipantToMediaFile: (mediaFile: MediaFile, participant: Person) => void;
};

type ComponentState = {
    editing: boolean,
};

class PartipantsComponent extends React.Component<Props, ComponentState> {
    state = {
        editing: false,
    };

    render() {
        const {mediaFile, peopleMap} = this.props;
        const {editing} = this.state;

        const participantNames = mediaFile.participantIds.map(id => {
            const person = peopleMap.get(id);

            if (!person) {
                throw new Error(`unknown person. ID: ${id}`);
            }

            return person.name;
        });
    
        return (
            <>
                <h3>Who was here</h3>
                {editing ? this.renderEditView(participantNames) : this.renderReadView(participantNames)}
            </>
        );
    }

    private renderReadView(names: string[]) {
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

    private renderEditView(names: string[]) {
        const {people} = this.props;

        const peopleOptions = people.map(person => ({
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
                        defaultValue={peopleOptions}
                    />
                </span>

                <button onClick={event => this.setState(state => ({...state, editing: false}))}>
                        Finished Editing
                </button>
            </>
        );
    }

    private onChoosePerson(selectedItems: SelectedOption[]) {
        
        const {addParticipantToMediaFile, mediaFile, peopleMap} = this.props;

        selectedItems.forEach(selected => {
            const id = parseInt(selected.value, 10);
            
            let person = peopleMap.get(id);
            if (!person) {
                person = {
                    id: 0,
                    name: selected.value,
                };
            }

            addParticipantToMediaFile(mediaFile, person);
        });
    }
}

function mapStateToProps(state: State) {
    const {people, peopleMap} = state.mediaFilesReducer;

    return {
      people,
      peopleMap,
    };
  }

export default connect(mapStateToProps, {addParticipantToMediaFile}) (PartipantsComponent);