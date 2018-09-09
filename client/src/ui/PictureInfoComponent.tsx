import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import { SMALL_SCREEN_WIDTH } from '../util/screen_size';
import MapComponent from './MapComponent';

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

const mapContainerSize = {
  width: `${INFO_CONTAINER_WIDTH}px`,
  height: `${INFO_CONTAINER_WIDTH}px`,
};

type Props = {
  pictureMetadata: PictureMetadata;
};

class PictureInfoComponent extends React.Component<Props> {
  render() {
    const { pictureMetadata } = this.props;

    const dateTaken = pictureMetadata.getTimeTaken();
    const timeTakenText = dateTaken ? dateTaken.toUTCString() : 'Unknown Date';
    const location = pictureMetadata.getLocation();
    const mapContainer = (location !== null)
      ? <MapComponent {...{size: mapContainerSize, markers: [{location}]}} />
      : <p>No Location Data available</p>;

    return (
      <div>
        <p>{pictureMetadata.getName()}</p>
        <p>{timeTakenText}</p>
        {mapContainer}
      </div>
    );
  }
}

export default PictureInfoComponent;
