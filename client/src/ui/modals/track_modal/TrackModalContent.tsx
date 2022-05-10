import * as React from "react";
import { FitTrack, Record, getLapsFromRecords } from "../../../domain/FitTrack";
import MapComponent from "../../MapComponent";
import { fetchRecordsForTracks } from "../../../actions/mediaFileActions";
import { connect } from "react-redux";
import SpeedChart from "../SpeedChart";
import * as Leaflet from "leaflet";
import TrackModalTable from "./TrackModalTable";
import TimeDistanceToggle from "./TimeDistanceToggle";
import TrackSliderComponent from "./TrackSliderComponent";

function displayDistance(distanceMetres: number): string {
  const flooredDistanceMetres = Math.floor(distanceMetres);
  if (flooredDistanceMetres < 1000) {
    return `${flooredDistanceMetres}m`;
  }

  const wholeKm = Math.floor(flooredDistanceMetres / 1000);
  const remainderMetres = flooredDistanceMetres - wholeKm * 1000;

  return `${wholeKm}.${remainderMetres}km`;
}

const LAP_INTERVAL = 1000;

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
  highlightedRecord?: Record;
};

type TrackExtractionData = { start?: Record; end?: Record };

class TrackModalContent extends React.Component<Props, State> {
  state = {
    trackRecords: undefined as undefined | Record[],
    trackExtractionPoints: undefined as undefined | TrackExtractionData,
    highlightedRecord: undefined as undefined | Record,
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
    const { trackSummary } = this.props;
    const { trackRecords } = this.state;

    if (!trackRecords) {
      return <p>loading</p>;
    }

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
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
          </div>
        </div>
        <div className="row">
          <div className="col-12">{this.renderMap(trackRecords)}</div>
        </div>
        <div className="row">
          <div className="col-12">
            <TimeDistanceToggle />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <TrackSliderComponent />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <SpeedChart
              trackRecords={trackRecords}
              onChartMouseOver={(idx) =>
                this.setState((state) => ({
                  ...state,
                  highlightedRecord: this.state.trackRecords[idx],
                }))
              }
            />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <TrackModalTable
              trackSummary={trackSummary}
              laps={getLapsFromRecords(trackRecords, LAP_INTERVAL)}
            />
          </div>
        </div>
      </div>
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
          // this.setState((state) => ({
          //   ...state,
          //   trackExtractionPoints: {
          //     ...state.trackExtractionPoints,
          //     end: latLng,
          //   },
          // }));
          return;
        }

        // start is not set, set it
        // this.setState((state) => ({
        //   ...state,
        //   trackExtractionPoints: {
        //     ...state.trackExtractionPoints,
        //     start: latLng,
        //   },
        // }));
        return;
      };
    }

    let markers = undefined;
    const { highlightedRecord } = this.state;
    if (highlightedRecord) {
      markers = [
        {
          location: {
            lat: highlightedRecord.posLat,
            lon: highlightedRecord.posLong,
          },
        },
      ];
    }

    return (
      <MapComponent
        size={size}
        tracks={tracks}
        zoomControl={true}
        onClickPoint={onClickPoint}
        markers={markers}
      />
    );
  }
}

export default connect(undefined, { fetchRecordsForTracks })(TrackModalContent);
