import { Record, FitTrack } from "../domain/FitTrack";

export function trackSummariesToTrackDatas(
  trackSummaries: FitTrack[],
  tracksDetails: Map<string, Record[]>,
  mediaFileUrlBase?: string
) {
  return trackSummaries.map((trackSummary) => {
    const records = tracksDetails.get(trackSummary.hashValue);
    if (!records) {
      throw new Error(
        `track details not found for track ${trackSummary.hashValue} (${trackSummary.relativePath})`
      );
    }

    return {
      trackSummary,
      activityBounds: trackSummary.activityBounds,
      points: records.map((record) => ({
        lat: record.posLat,
        lon: record.posLong,
      })),
      openTrackUrl: mediaFileUrlBase,
    };
  });
}
