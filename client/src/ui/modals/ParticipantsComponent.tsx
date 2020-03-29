import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import CreateableSelect from 'react-select/creatable';
import { ValueType } from 'react-select/src/types';
import { connect } from 'react-redux';
import { State } from '../../reducers/rootReducer';
import { PeopleMap } from '../../reducers/mediafileReducer';
import { Person } from '../../domain/People';
import { addParticipantToMediaFile } from '../../actions/mediaFileActions';

const styles = {
    selectStyles: {
      color: 'black',
    },
};

type SelectedOption = {value: string, label: string};

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
            <ul>
                {names.map((name, index) => <li key={index}>{name}</li>)}
            </ul>
        );
    }

    private renderEditView(names: string[]) {
        const {people} = this.props;

        const peopleOptions = people.map(person => ({
            value: person.id + '',
            label: person.name,
        }));

        return (
            <ul>
                {names.map((name, index) => <li key={index}>{name}</li>)}

                <li>
                    Tag someone who was here
                    <span style={styles.selectStyles}>
                    <CreateableSelect
                        options={peopleOptions} 
                        onChange={(selected) => this.onChoosePerson(selected)}
                    />
                    </span>
                </li>
            </ul>
        );
    }

    private onChoosePerson(selected: ValueType<SelectedOption>) {
        if (!selected) {
        return;
        }

        const {addParticipantToMediaFile, mediaFile} = this.props;

        const {peopleMap} = this.props;

        const attachPersonToMediaFile = (selected: SelectedOption) => {
            const id = parseInt(selected.value, 10);

            let person = peopleMap.get(id);
            if (!person) {
                person = {
                id: 0,
                name: selected.value,
                };
            }

            addParticipantToMediaFile(mediaFile, person);
        };

        if (selected instanceof Array) {
            selected.forEach(selectedItem => attachPersonToMediaFile(selectedItem));
        } else {
            attachPersonToMediaFile(selected as SelectedOption);
        }
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