import * as React from 'react';
import { FitTrack, Record, getLapsFromRecords } from '../domain/FitTrack';
import MapComponent from './MapComponent';
import { fetchRecordsForTrack } from '../actions/trackActions';

const styles = {
  container: {
    width: '100%',
  },
};

type Props = {
  trackSummary: FitTrack;
};

type State = {
  trackRecords: null|Record[];
};

export class TrackModalContent extends React.Component<Props, State> {
  state = {
    trackRecords: null
  };

  componentDidMount() {
    this.fetchRecords();
  }

  fetchRecords = async () => {
    const trackRecords = await fetchRecordsForTrack(this.props.trackSummary);
    this.setState(state => ({
      ...state,
      trackRecords
    }));
  }

  render() {
    const { trackRecords } = this.state;
    const { trackSummary } = this.props;

    const map = trackRecords === null ? <p>loading</p> : this.renderMap(trackRecords) ;

    const opts = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };

    return (
      <div style={styles.container}>
        <h3>
          {trackSummary.startTime.toLocaleDateString(undefined, opts)} at {trackSummary.startTime.toLocaleTimeString()}
        </h3>
        <p>{trackSummary.totalDistance}m in {trackSummary.getDuration().getDisplayString()}</p>
        {map}
      </div>
    );
  }

  private renderMap(trackRecords: Record[]) {
    // size: {
    //   width: string,
    //   height: string,
    // },
    // markers: MapMarker[],
    // extraLatLongMapPadding?: number,
    const mapProps = {
      size: {
        width: '100%',
        height: '400px'
      },
      tracks: [{
        points: trackRecords.map(record => ({
          lat: record.posLat,
          long: record.posLong,
        })),
        activityBounds: this.props.trackSummary.activityBounds,
      }],
    };

    const lapIntervalDistance = 1000;
    const laps = getLapsFromRecords(trackRecords, lapIntervalDistance);
    const lapsRows = laps.map((lap, index) => (
      <tr key={index}>
        <td>{index}</td>
        <td>{lap.time.getDisplayString()}</td>
      </tr>
    ));
    const tableHtml = (
      <table>
        <thead>
          <tr>
            <th>Kilometer</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {lapsRows}
        </tbody>
      </table>
    );

    return (
      <React.Fragment>
        <MapComponent {...mapProps} />
        {tableHtml}
      </React.Fragment>
    );
  }
}
