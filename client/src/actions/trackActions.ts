import { SERVER_BASE_URL } from '../configs';
import { FitTrack, Record } from '../domain/FitTrack';

export async function fetchRecordsForTrack(trackSummary: FitTrack) {
  const response = await fetch(`${SERVER_BASE_URL}/api/tracks/${trackSummary.hashValue}/records`);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const records = (await response.json()) as Record[];

  return records;
}
