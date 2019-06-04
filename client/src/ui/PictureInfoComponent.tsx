import * as React from 'react';
import { SMALL_SCREEN_WIDTH } from '../util/screen_size';
import MapComponent, { newDivIcon } from './MapComponent';
import { MediaFile } from '../domain/MediaFile';

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

const mapContainerSize = {
  width: `${INFO_CONTAINER_WIDTH}px`,
  height: `${INFO_CONTAINER_WIDTH}px`,
};

type Props = {
  mediaFile: MediaFile;
};

class PictureInfoComponent extends React.Component<Props> {
  render() {
    const { mediaFile } = this.props;

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

    return (
      <div>
        <p>{mediaFile.getName()}</p>
        <p>{timeTakenText}</p>
        {mapContainer}
        {reason}
      </div>
    );
  }
}

export default PictureInfoComponent;
