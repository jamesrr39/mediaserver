import * as React from 'react';
import { FitTrack, Record, getLapsFromRecords, getSpeedsFromRecords } from '../../domain/FitTrack';
import MapComponent from '../MapComponent';
import { fetchRecordsForTrack } from '../../actions/mediaFileActions';
import { connect } from 'react-redux';
import SpeedChart from './SpeedChart';

const styles = {
  container: {
    width: '100%',
    overflow: 'auto',
    height: '100vh',
  },
};

type Props = {
  trackSummary: FitTrack;
  fetchRecordsForTrack: (trackSummary: FitTrack) => Promise<Record[]>
};

type State = {
  trackRecords?: Record[];
};

class TrackModalContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.trackSummary.hashValue !== this.props.trackSummary.hashValue) {
      this.setState(state => ({
        trackRecords: undefined,
      }));
      this.fetchRecords();
    }
  }

  fetchRecords = async () => {
    const trackRecords = await this.props.fetchRecordsForTrack(this.props.trackSummary);
    this.setState(state => ({
      ...state,
      trackRecords
    }));
  }

  render() {
    const { trackSummary } = this.props;

    const map = this.renderRecordInformation();

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
        <small>{trackSummary.relativePath}</small>
        <p>{trackSummary.totalDistance}m in {trackSummary.getDuration().getDisplayString()}</p>
        {map}
      </div>
    );
  }

  private renderRecordInformation() {
    const { trackRecords } = this.state;

    if (!trackRecords) {
      return <p>loading</p>;
    }

    return (
      <React.Fragment >
        {this.renderMap(trackRecords)}
        {this.renderTable(trackRecords)}
        {this.renderSpeedChart(trackRecords)}
      </React.Fragment>
    ) ;
  }

  private renderSpeedChart(trackRecords: Record[]) {
    const {trackSummary} = this.props;

    const speeds = getSpeedsFromRecords(trackRecords, 10);
    if (speeds.length === 0) {
      return null;
    }

    const maxTimeThroughSeconds = speeds[speeds.length - 1].startTimeThroughSeconds;
    const maxSpeed = Math.max(...speeds.map(speedWithTime => speedWithTime.speed));

    const points = speeds.map((speed, index) => {
      const y = speed.speed / maxSpeed;
      const x = speed.startTimeThroughSeconds / maxTimeThroughSeconds;

      return {
        x,
        y,
      };
    });

    const speedChartProps = {
      points,
      k: trackSummary.hashValue,
    };
    
    return <SpeedChart {...speedChartProps} />;
  }

  private renderMap(trackRecords: Record[]) {
    const { trackSummary } = this.props;

    const mapProps = {
      size: {
        width: '100%',
        height: '400px'
      },
      tracks: [{
        trackSummary,
        points: trackRecords.map(record => ({
          lat: record.posLat,
          lon: record.posLong,
        })),
        activityBounds: trackSummary.activityBounds,
      }],
    };

    return <MapComponent {...mapProps} />;
  }

  private renderTable(trackRecords: Record[]) {
    const lapIntervalDistance = 1000;
    const laps = getLapsFromRecords(trackRecords, lapIntervalDistance);
    const lapsRows = laps.map((lap, index) => (
      <tr key={index}>
        <td>{index}</td>
        <td>{lap.time.getDisplayString()}</td>
      </tr>
    ));

    return (
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
  }
}

export default connect(undefined, {fetchRecordsForTrack})(TrackModalContent);