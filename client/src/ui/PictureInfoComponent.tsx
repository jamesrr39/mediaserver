import * as React from 'react';
import { SMALL_SCREEN_WIDTH } from '../util/screen_size';
import MapComponent, { newDivIcon } from './MapComponent';
import { MediaFile } from '../domain/MediaFile';
import CreateableSelect from 'react-select/creatable';
import { ValueType } from 'react-select/src/types';
import { connect } from 'react-redux';
import { State, PeopleMap } from '../reducers/fileReducer';
import { Person } from '../domain/People';

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

type SelectedOption = {value: string, label: string};

const mapContainerSize = {
  width: `${INFO_CONTAINER_WIDTH}px`,
  height: `${INFO_CONTAINER_WIDTH}px`,
};

type Props = {
  mediaFile: MediaFile;
  people: Person[];
  peopleMap: PeopleMap;
};

class PictureInfoComponent extends React.Component<Props> {
  render() {
    const { mediaFile, people, peopleMap } = this.props;

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
      <div>
        <p>{mediaFile.getName()}</p>
        <p>{timeTakenText}</p>
        <ul>
          {participantNames.map(participantName => <li>{participantName}</li>)}
          <li>
            Tag someone who was here
            <CreateableSelect
              options={peopleOptions} 
              onChange={(selected) => this.onChoosePerson(selected)}
            />
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

      const person = peopleMap.get(id);
      console.log(selected, person);
    };

    if (selected instanceof Array) {
      selected.forEach(selectedItem => attachPersonToMediaFile(selectedItem));
    } else {
      attachPersonToMediaFile(selected as SelectedOption);
    }
  }
}

export default connect((state: State) => {
  return {
    people: state.mediaFilesReducer.people,
    peopleMap: state.mediaFilesReducer.peopleMap,
  };
})(PictureInfoComponent);
