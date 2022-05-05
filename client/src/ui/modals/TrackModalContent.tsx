import * as React from "react";
import { FitTrack, Record, getLapsFromRecords } from "../../domain/FitTrack";
import MapComponent from "../MapComponent";
import { fetchRecordsForTracks } from "../../actions/mediaFileActions";
import { connect } from "react-redux";
import SpeedChart from "./SpeedChart";
import { Duration } from "../../domain/duration";
import * as Leaflet from "leaflet";

function displayDistance(distanceMetres: number): string {
  const flooredDistanceMetres = Math.floor(distanceMetres);
  if (flooredDistanceMetres < 1000) {
    return `${flooredDistanceMetres}m`;
  }

  const wholeKm = Math.floor(flooredDistanceMetres / 1000);
  const remainderMetres = flooredDistanceMetres - wholeKm * 1000;

  return `${wholeKm}.${remainderMetres}km`;
}

const styles = {
  container: {
    width: "100%",
    overflow: "auto",
    height: "100%",
  },
};

type Props = {
  trackSummary: FitTrack;
  ts: number;
  fetchRecordsForTracks: (
    trackSummaries: FitTrack[]
  ) => Promise<Map<string, Record[]>>;
};

type State = {
  trackRecords?: Record[];
  trackExtractionPoints?: TrackExtractionData;
};

type TrackExtractionData = { start?: Leaflet.LatLng; end?: Leaflet.LatLng };

class TrackModalContent extends React.Component<Props, State> {
  state = {
    trackRecords: undefined as undefined | Record[],
    trackExtractionPoints: undefined as undefined | TrackExtractionData,
  };

  componentDidMount() {
    this.fetchRecords();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    console.log("TrackModalContent: update");
    if (
      prevProps.trackSummary.hashValue !== this.props.trackSummary.hashValue
    ) {
      this.setState((state) => ({
        ...state,
        trackRecords: undefined,
      }));
      this.fetchRecords();
    }
  }

  fetchRecords = async () => {
    const { trackSummary } = this.props;
    const trackRecordsMap = await this.props.fetchRecordsForTracks([
      trackSummary,
    ]);
    const trackRecords = trackRecordsMap.get(trackSummary.hashValue);
    if (!trackRecords) {
      throw new Error(
        `couldn't get records for track ${trackSummary.hashValue}`
      );
    }

    this.setState((state) => ({
      ...state,
      trackRecords,
    }));
  };

  render() {
    const { trackSummary } = this.props;

    const map = this.renderRecordInformation();

    const opts = {
      weekday: "long" as "long",
      day: "numeric" as "numeric",
      month: "long" as "long",
      year: "numeric" as "numeric",
    };

    return (
      <div style={styles.container}>
        <h3>
          {trackSummary.startTime.toLocaleDateString(undefined, opts)} at{" "}
          {trackSummary.startTime.toLocaleTimeString()}
        </h3>
        <small>{trackSummary.relativePath}</small>
        <p>
          {displayDistance(trackSummary.totalDistance)} in{" "}
          {trackSummary.getDuration().getDisplayString()}
        </p>
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
      <>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(e) => {
            if (this.state.trackExtractionPoints) {
              this.setState((state) => ({
                ...state,
                trackExtractionPoints: undefined,
              }));
              return;
            }

            this.setState((state) => ({
              ...state,
              trackExtractionPoints: {},
            }));
          }}
        >
          Extract section
        </button>
        {this.state.trackExtractionPoints && (
          <>
            <span>
              {this.state.trackExtractionPoints.start
                ? this.state.trackExtractionPoints.start.toString()
                : "Please select the start point"}
            </span>
            {this.state.trackExtractionPoints.start && (
              <span>
                {this.state.trackExtractionPoints.end
                  ? this.state.trackExtractionPoints.end.toString()
                  : "Please select the end point"}
              </span>
            )}
          </>
        )}
        {this.renderMap(trackRecords)}
        {this.renderTable(trackRecords)}
        <SpeedChart {...{ trackRecords }} />
      </>
    );
  }

  private renderMap(trackRecords: Record[]) {
    const { trackSummary } = this.props;

    const size = {
      width: "100%",
      height: "400px",
    };
    const tracks = [
      {
        trackSummary,
        points: trackRecords.map((record) => ({
          lat: record.posLat,
          lon: record.posLong,
        })),
        activityBounds: trackSummary.activityBounds,
      },
    ];

    let onClickPoint = undefined;
    if (this.state.trackExtractionPoints) {
      onClickPoint = (latLng: Leaflet.LatLng) => {
        // if start is set already, set end
        if (this.state.trackExtractionPoints.start) {
          this.setState((state) => ({
            ...state,
            trackExtractionPoints: {
              ...state.trackExtractionPoints,
              end: latLng,
            },
          }));
          return;
        }

        // start is not set, set it
        this.setState((state) => ({
          ...state,
          trackExtractionPoints: {
            ...state.trackExtractionPoints,
            start: latLng,
          },
        }));
        return;
      };
    }

    return (
      <MapComponent
        size={size}
        tracks={tracks}
        zoomControl={true}
        onClickPoint={onClickPoint}
      />
    );
  }

  private renderTable(trackRecords: Record[]) {
    const { trackSummary } = this.props;
    const lapIntervalDistance = 1000;
    const laps = getLapsFromRecords(trackRecords, lapIntervalDistance);
    const lapsRows = laps.map((lap, index) => (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>{lap.distance.toFixed(2)}m</td>
        <td>{lap.time.getDisplayString()}</td>
      </tr>
    ));

    const duration = new Duration(trackSummary.startTime, trackSummary.endTime);

    return (
      <table>
        <thead>
          <tr>
            <th>Lap</th>
            <th>Distance</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {lapsRows}
          <tr>
            <td>Total</td>
            <td>{trackSummary.totalDistance}m</td>
            <td>{duration.getDisplayString()}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}

export default connect(undefined, { fetchRecordsForTracks })(TrackModalContent);
