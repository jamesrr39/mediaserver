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
import { SelectedSection } from "src/ui/MapComponent";

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
  let selectedSection = undefined as SelectedSection | undefined;
  if (!showingWholeTrack) {
    let startIdx: undefined | number = undefined;
    let endIdx: undefined | number = undefined;
    const trackRecordsInRange = [];
    trackRecords.forEach((record, recordIdx) => {
      const isFilteredIn =
        record.timestamp.getTime() - trackSummary.startTime.getTime() >=
          timeRange.lower * 1000 &&
        record.timestamp.getTime() - trackSummary.startTime.getTime() <=
          timeRange.upper * 1000;

      if (!isFilteredIn) {
        return;
      }

      trackRecordsInRange.push(record);

      // Check startIdx specifically against undefined.
      // Just checking truthy would mean that startIdx = 0, which is valid, is evaluated as "false"
      if (startIdx === undefined) {
        startIdx = recordIdx;
      }

      // continually overwrite endIdx as long as the record is filtered in
      endIdx = recordIdx;
    });

    if (trackRecordsInRange.length !== 0) {
      // prevent crashing on 0 records selected
      selectedSection = {
        startIdx,
        endIdx,
      };
    }
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <TrackModalMap
            trackRecords={trackRecords}
            trackSummary={trackSummary}
            highlightedRecord={highlightedRecord}
            selectedSection={selectedSection}
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
            trackSummary={trackSummary}
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
