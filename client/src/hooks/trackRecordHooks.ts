import { useQuery } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { fetchRecordsForTracks } from "src/actions/mediaFileActions";
import { FitTrack, Record } from "src/domain/FitTrack";
import { State } from "src/reducers/rootReducer";
import { TrackMapData } from "src/ui/MapComponent";

export function useTrackRecords(trackSummaries: FitTrack[]) {
  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  return useQuery(
    `track-records-${trackSummaries
      .map((summary) => summary.hashValue)
      .join("-")}`,
    async () => {
      if (trackSummaries.length === 0) {
        return new Map<string, Record[]>;
      }

      const trackData = await fetchRecordsForTracks(trackSummaries)(
        dispatch,
        () => state
      );

      return trackData;
    }
  );
}

export function useTrackMapData(trackSummaries: FitTrack[]) {
  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  return useQuery(
    `track-map-data-${trackSummaries
      .map((summary) => summary.hashValue)
      .join("-")}`,
    async () => {
      const trackMapData: TrackMapData[] = [];

      if (trackSummaries.length === 0) {
        return trackMapData;
      }

      const trackData = await fetchRecordsForTracks(trackSummaries)(
        dispatch,
        () => state
      );

      trackSummaries.forEach((trackSummary) => {
        const { activityBounds } = trackSummary;
        const records = trackData.get(trackSummary.hashValue);
        if (!records) {
          throw new Error(`no data found for track ${trackSummary.hashValue}`);
        }

        const points = records.map((record) => ({
          lat: record.posLat,
          lon: record.posLong,
        }));

        trackMapData.push({
          trackSummary,
          activityBounds,
          points,
        });
      });

      return trackMapData;
    }
  );
}
