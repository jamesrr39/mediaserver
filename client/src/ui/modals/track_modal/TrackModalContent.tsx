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
import TrackDetailsComponent from "./TrackDetailsComponent";

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

const dateLocaleOpts = {
  weekday: "long" as "long",
  day: "numeric" as "numeric",
  month: "long" as "long",
  year: "numeric" as "numeric",
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
};

type TrackExtractionData = { start?: Record; end?: Record };

class TrackModalContent extends React.Component<Props, State> {
  state = {
    trackRecords: undefined as undefined | Record[],
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
    const { trackRecords } = this.state;

    return (
      <div style={styles.container}>
        <h3>
          {trackSummary.startTime.toLocaleDateString(undefined, dateLocaleOpts)}{" "}
          at {trackSummary.startTime.toLocaleTimeString()}
        </h3>
        <small>{trackSummary.relativePath}</small>
        <p>
          {displayDistance(trackSummary.totalDistance)} in{" "}
          {trackSummary.getDuration().getDisplayString()}
        </p>
        {!trackRecords && (
          <div className="alert alert-info">Loading records...</div>
        )}
        {trackRecords && (
          <TrackDetailsComponent
            trackSummary={trackSummary}
            trackRecords={trackRecords}
          />
        )}
      </div>
    );
  }
}

export default connect(undefined, { fetchRecordsForTracks })(TrackModalContent);
