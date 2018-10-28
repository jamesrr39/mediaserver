import * as React from 'react';
import { FitTrack } from '../domain/FitTrack';

type Props = {
  mediaFile: FitTrack;
};

export class TrackModalContent extends React.Component<Props> {
  render() {
    return (
      <div>
        <p>{this.props.mediaFile.totalDistance}m</p>
        <p>{this.props.mediaFile.startTime.toISOString()}</p>
        <p>{this.props.mediaFile.deviceManufacturer} {this.props.mediaFile.deviceProduct}</p>
      </div>
    );
  }
}
