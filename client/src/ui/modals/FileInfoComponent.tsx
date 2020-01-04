import * as React from 'react';
import { SMALL_SCREEN_WIDTH } from '../../util/screen_size';
import MapComponent, { newDivIcon } from '../MapComponent';
import { MediaFile } from '../../domain/MediaFile';
import CreateableSelect from 'react-select/creatable';
import { ValueType } from 'react-select/src/types';
import { connect } from 'react-redux';
import { State, PeopleMap } from '../../reducers/fileReducer';
import { Person } from '../../domain/People';
import { addParticipantToMediaFile } from '../../actions/mediaFileActions';
import { styles as TopBarStyles } from './ModalTopBar';

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

type SelectedOption = {value: string, label: string};

const styles = {
  selectStyles: {
    color: 'black',
  },
  container: {
    backgroundColor: '#333',
    padding: '40px 10px 0',
    height: '100%',
  },
};

const mapContainerSize = {
  width: `${INFO_CONTAINER_WIDTH}px`,
  height: `${INFO_CONTAINER_WIDTH}px`,
};

type Props = {
  mediaFile: MediaFile;
  people: Person[];
  peopleMap: PeopleMap;
  addParticipantToMediaFile: (mediaFile: MediaFile, participant: Person) => void;
  onCloseButtonClicked?: () => void;
};

class FileInfoComponent extends React.Component<Props> {
  render() {
    const { mediaFile, people, peopleMap, onCloseButtonClicked } = this.props;

    const dateTaken = mediaFile.getTimeTaken();
    const timeTakenText = dateTaken ? dateTaken.toUTCString() : 'Unknown Date';
    let location = mediaFile.getLocation();
    let icon = undefined;
    if (location === null && mediaFile.suggestedLocation) {
      location = mediaFile.suggestedLocation;
      icon = newDivIcon();
    }
    const mapContainer = (location !== null)
      ? <MapComponent {...{size: mapContainerSize, markers: [{location, icon}], zoomControl: true}} />
      : <p>No Location Data available</p>;

    const reason = mediaFile.suggestedLocation && mediaFile.suggestedLocation.reason;
    
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
      <div style={styles.container}>
        {onCloseButtonClicked && (
          <div style={TopBarStyles.topBar}>
            <button
              onClick={onCloseButtonClicked}
              style={TopBarStyles.navigationButton}
              className="fa fa-info-circle"
              aria-label="Info"
            />
        </div>
        )}
        <p>{mediaFile.getName()}</p>
        <p>{timeTakenText}</p>
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
        {mapContainer}
        {reason}
      </div>
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
  return {
    people: state.mediaFilesReducer.people,
    peopleMap: state.mediaFilesReducer.peopleMap,
  };
}

export default connect(mapStateToProps, { addParticipantToMediaFile })(FileInfoComponent);
