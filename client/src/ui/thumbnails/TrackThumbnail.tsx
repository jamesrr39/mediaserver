import * as React from "react";
import { FitTrack, Record } from "../../domain/FitTrack";
import MapComponent from "../MapComponent";
import { fetchRecordsForTracks } from "../../actions/mediaFileActions";
import { connect } from "react-redux";
import { Size } from "../../domain/Size";

type Props = {
  size: Size;
  trackSummary: FitTrack;
  fetchRecordsForTracks: (
    trackSummaries: FitTrack[]
  ) => Promise<Map<string, Record[]>>;
};

type ComponentState = {
  trackRecords: Record[];
};

class TrackThumbnail extends React.Component<Props, ComponentState> {
  state = {
    trackRecords: [] as Record[],
  };

  componentDidMount() {
    this.fetchRecords();
  }

  render() {
    const { width, height } = this.props.size;
    const { trackSummary } = this.props;
    const { trackRecords } = this.state;

    const props = {
      size: {
        width: width + "px",
        height: height + "px",
      },
      tracks: [
        {
          trackSummary,
          points: trackRecords.map((record) => {
            const { posLat, posLong } = record;

            return {
              lat: posLat,
              lon: posLong,
            };
          }),
          activityBounds: trackSummary.activityBounds,
        },
      ],
      zoomControl: false,
    };
    return (
      <div>
        <MapComponent {...props} />
      </div>
    );
  }

  private async fetchRecords() {
    const tracksDetails = await this.props.fetchRecordsForTracks([
      this.props.trackSummary,
    ]);
    const records = tracksDetails.get(this.props.trackSummary.hashValue);
    if (!records) {
      throw new Error(
        `couldn't get records for ${this.props.trackSummary.hashValue}`
      );
    }

    this.setState((state) => ({
      ...state,
      trackRecords: records,
    }));
  }
}

export default connect(undefined, { fetchRecordsForTracks })(TrackThumbnail);
