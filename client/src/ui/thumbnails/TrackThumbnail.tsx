import * as React from 'react';
import { FitTrack, Record } from '../../domain/FitTrack';
import MapComponent from '../MapComponent';
import { fetchRecordsForTrack } from '../../actions/trackActions';

type Props = {
  size: {width: number, height: number},
  trackSummary: FitTrack,
};

type ComponentState = {
  trackRecords: Record[],
};

export class TrackThumbnail extends React.Component<Props, ComponentState> {
  state = {
    trackRecords: [] as Record[],
  };
  
  componentDidMount() {
    this.fetchRecords();
  }

  render () {
    const { width, height } = this.props.size;
    const { trackSummary } = this.props;
    const { trackRecords } = this.state;

    const props = {
      size: {
        width: width + 'px',
        height: height + 'px',
      },
      tracks: [{
        trackSummary,
        points: trackRecords.map(record => {
          const {posLat, posLong} = record;
          
          return {
            lat: posLat,
            long: posLong,
          };
        }),
        activityBounds: trackSummary.activityBounds,
      }],
    };
    return (
      <div>
        <MapComponent {...props} />
      </div>
    );
  }

  private async fetchRecords() {
    const trackRecords = await fetchRecordsForTrack(this.props.trackSummary);

    this.setState(state => ({
      ...state,
      trackRecords,
    }));
  }
}