import { useCallback, useState } from "react";
import {
  DEFAULT_LAP_INTERVAL,
  FitTrack,
  getLapsFromRecords,
  Record,
} from "src/domain/FitTrack";
import { useTrackRecords } from "src/hooks/trackRecordHooks";
import SpeedChart from "../SpeedChart";
import TimeDistanceToggle, { Value } from "./TimeDistanceToggle";
import TrackModalMap from "./TrackModalMap";
import TrackModalTable from "./TrackModalTable";
import TrackSliderComponent from "./TrackSliderComponent";
import { Time } from "ts-util/src/Time";

type Props = {
  trackSummary: FitTrack;
};

export default function TrackDetailsComponent(props: Props) {
  const { trackSummary } = props;
  const [highlightedRecord, setHighlightedRecord] = useState(
    undefined as undefined | Record
  );

  const initialTimeRange = {
    lower: 0,
    upper: trackSummary.getDuration().getSeconds(),
  };

  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const showingWholeTrack =
    initialTimeRange.lower === timeRange.lower &&
    initialTimeRange.upper === timeRange.upper;

  const [timeDistanceToggle, setTimeDistanceToggle] = useState("time" as Value);
  const onTimeDistanceToggleChange = useCallback(
    (value: Value) => setTimeDistanceToggle(value),
    []
  );

  const { data, isLoading, error } = useTrackRecords([trackSummary]);

  if (error) {
    return <div className="alert alert-danger">Error fetching records</div>;
  }

  if (isLoading) {
    return <div className="alert alert-info">Loading records...</div>;
  }

  const trackRecords = data.get(trackSummary.hashValue);

  let trackRecordsInRange = trackRecords;
  if (!showingWholeTrack) {
    trackRecordsInRange = trackRecords.filter((record) => {
      return (
        record.timestamp.getTime() - trackSummary.startTime.getTime() >=
          timeRange.lower * 1000 &&
        record.timestamp.getTime() - trackSummary.startTime.getTime() <=
          timeRange.upper * 1000
      );
    });
  }

  return (
    <div className="container-fluid">
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
          <TimeDistanceToggle onChange={onTimeDistanceToggleChange} />
          {showingWholeTrack && <p>Showing whole track</p>}
          {!showingWholeTrack && (
            <p>
              Showing from {new Time(timeRange.lower).toString()} to{" "}
              {new Time(timeRange.upper).toString()}
            </p>
          )}
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <TrackSliderComponent
            min={0}
            max={trackSummary.getDuration().getSeconds()}
            onChange={(newValue) => setTimeRange(newValue)}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <SpeedChart
            trackRecords={trackRecordsInRange}
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
