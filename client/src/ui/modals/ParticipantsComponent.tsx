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

class PartipantsComponent extends React.Component<Props> {
    render() {
        const {mediaFile, peopleMap, people} = this.props;

        const participantNames = mediaFile.participantIds.map(id => {
            const person = peopleMap.get(id);
            let name = '(unknown)';
            if (person) {
            name = person.name;
            }
            return name;
        });
    
        const peopleOptions = people.map(person => ({
            value: person.id + '',
            label: person.name,
        }));

        return (
            <>
                <h3>Who was here</h3>
                <ul>
                {participantNames.map((participantName, index) => <li key={index}>{participantName}</li>)}
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
            </>
        );
    }

    private onChoosePerson(selected: ValueType<SelectedOption>) {
        if (!selected) {
        return;
        }

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

            this.props.addParticipantToMediaFile(this.props.mediaFile, person);
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