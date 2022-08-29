import { useState } from "react";
import {
  getLapsFromRecords,
  DEFAULT_LAP_INTERVAL,
  FitTrack,
  Record,
} from "src/domain/FitTrack";
import { useTrackRecords } from "src/hooks/trackRecordHooks";
import SpeedChart from "../SpeedChart";
import TimeDistanceToggle from "./TimeDistanceToggle";
import TrackModalMap from "./TrackModalMap";
import TrackModalTable from "./TrackModalTable";
import TrackSliderComponent from "./TrackSliderComponent";

type Props = {
  trackSummary: FitTrack;
};

export default function TrackDetailsComponent(props: Props) {
  const { trackSummary } = props;
  const [highlightedRecord, setHighlightedRecord] = useState(
    undefined as undefined | Record
  );

  const { data, isLoading, error } = useTrackRecords([trackSummary]);

  if (error) {
    return <div className="alert alert-danger">Error fetching records</div>;
  }

  if (isLoading) {
    return <div className="alert alert-info">Loading records...</div>;
  }

  const trackRecords = data.get(trackSummary.hashValue);

  return (
    <div className="container-fluid">
      {/* <div className="row">
        <div className="col-12">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={(e) => {
              alert("not implemented"); not implemented error
              // if (this.state.trackExtractionPoints) {
              //   this.setState((state) => ({
              //     ...state,
              //     trackExtractionPoints: undefined,
              //   }));
              //   return;
              // }

              // this.setState((state) => ({
              //   ...state,
              //   trackExtractionPoints: {},
              // }));
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
      </div> */}
      <div className="row">
        <div className="col-12">
          <TrackModalMap
            trackRecords={trackRecords}
            trackSummary={trackSummary}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <TimeDistanceToggle onChange={() => alert("TODO: not implemented")} />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <TrackSliderComponent
            min={0}
            max={trackSummary.getDuration().getSeconds()}
            onChange={() => alert("not implemented")}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <SpeedChart
            trackRecords={trackRecords}
            onChartMouseOver={(idx) => setHighlightedRecord(trackRecords[idx])}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <TrackModalTable
            trackSummary={trackSummary}
            laps={getLapsFromRecords(trackRecords, DEFAULT_LAP_INTERVAL)}
          />
        </div>
      </div>
    </div>
  );
}
