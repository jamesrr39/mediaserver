import { Action } from 'redux';
import { SERVER_BASE_URL } from '../configs';
import { NotificationLevel, GalleryNotification } from '../ui/NotificationBarComponent';
import { newNotificationAction, NotifyAction } from './notificationActions';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileJSON, fromJSON } from '../domain/deserialise';
import { FitTrack, Record } from '../domain/FitTrack';
import { State } from '../reducers/fileReducer';

export enum FilesActionTypes {
  FETCH_MEDIA_FILES,
  MEDIA_FILES_FETCHED,
  QUEUE_FOR_UPLOAD,
  FILE_SUCCESSFULLY_UPLOADED,
  TRACK_RECORDS_FETCHED_ACTION,
}

export interface FetchPicturesMetadataAction extends Action {
  type: FilesActionTypes.FETCH_MEDIA_FILES;
}

export interface PicturesMetadataFetchedAction extends Action {
  type: FilesActionTypes.MEDIA_FILES_FETCHED;
  mediaFiles: MediaFile[];
}

export interface PictureSuccessfullyUploadedAction extends Action {
  type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED;
  mediaFile: MediaFile;
}

export type TrackRecordsFetchedAction = {
  type: FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION;
  trackSummaryIdsMap: Map<string, Promise<Record[]>>,
};

export type QueueForUploadAction = {
  type: FilesActionTypes.QUEUE_FOR_UPLOAD,
  file: File,
};

export type MediaserverAction = (
  PicturesMetadataFetchedAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction | 
  TrackRecordsFetchedAction |
  QueueForUploadAction
);

type TrackJSON = {
  hash: string,
  records: RecordJSON[],
};

type RecordJSON = {
  timestamp: string,
  posLat: number,
  posLong: number,
  distance: number,
  altitude: number
};

export function fetchPicturesMetadata() {
  return (dispatch: (action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction | NotifyAction) => void) => {
    dispatch({
      type: FilesActionTypes.FETCH_MEDIA_FILES,
    } as FetchPicturesMetadataAction);
    return fetch(`${SERVER_BASE_URL}/api/files/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response;
      })
      .then(response => response.json())
      .then((mediaFilesJSON: MediaFileJSON[]) => {
        const mediaFiles = mediaFilesJSON.map(json => fromJSON(json));
        dispatch({
          type: FilesActionTypes.MEDIA_FILES_FETCHED,
          mediaFiles,
        });
      }).catch((errMessage) => {
        dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.ERROR, errMessage)));
      });
  };
}

async function fetchTrackRecords(hashes: string[]) {
  const response = await fetch(`${SERVER_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/graphql',
    },
    body: `
    {
      tracks(hashes:${JSON.stringify(hashes)}) {
        hash
        records {
          timestamp
          distance
          posLat
          posLong
          altitude
        }
      }
    }
    `,
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  type Response = {
    data: {
      tracks: TrackJSON[],
    },
  };
  const responseBody = (await response.json()) as Response;
  return responseBody.data;
}

type Resolver = (records: Record[]) => void;

export function fetchRecordsForTracks(trackSummaries: FitTrack[]) {
  return (dispatch: (action: TrackRecordsFetchedAction) => void, getState: () => State) => {
    const state = getState();

    const trackSummaryIdsMap = new Map<string, Promise<Record[]>>();
    const trackSummariesToFetch: string[] = [];
    // figure out which already have promises, and which need to be fetched
    trackSummaries.forEach(trackSummary => {
      const recordsFromStatePromise = state.mediaFilesReducer.trackRecordsMap.get(trackSummary.hashValue);
      if (recordsFromStatePromise) {
        trackSummaryIdsMap.set(trackSummary.hashValue, recordsFromStatePromise);
        return;
      }

      trackSummariesToFetch.push(trackSummary.hashValue);
    });

    if (trackSummariesToFetch.length !== 0) {
      const resolverMap = new Map<string, Resolver>();
      trackSummariesToFetch.forEach(hash => {
        const promise = new Promise<Record[]>((resolve, reject) => {
          const resolver = (records: Record[]) => {
            resolve(records);
          };
          resolverMap.set(hash, resolver);
        });

        trackSummaryIdsMap.set(hash, promise);
      });
      fetchTrackRecords(trackSummariesToFetch).then(response => {
        response.tracks.forEach(track => {
          const records = track.records.map(record => ({
            ...record,
            timestamp: new Date(record.timestamp),
          }));
          const resolver = resolverMap.get(track.hash);
          if (!resolver) {
            throw new Error(`couldn't find resolver for ${track.hash}`);
          }
          resolver(records);
        });
      });

      const dispatchMap = new Map<string, Promise<Record[]>>();
      trackSummariesToFetch.forEach(hash => {
        const promise = trackSummaryIdsMap.get(hash);
        if (!promise) {
          throw new Error(`couldn't find promise for ${hash}`);
        }
        dispatchMap.set(hash, promise);
      });

      dispatch({
        type: FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION,
        trackSummaryIdsMap: dispatchMap,
      });
    }

    return new Promise<Map<string, Record[]>>((resolve, reject) => {
      const map = new Map<string, Record[]>();
      trackSummaryIdsMap.forEach((recordsPromise, hash) => {
        recordsPromise.then(records => {
          map.set(hash, records);
          if (map.size === trackSummaries.length) {
            resolve(map);
          }
        });
      });
    });
  };
}

export function uploadFile(file: File) {
  return async (
    dispatch: (action: MediaserverAction) => void, 
    getState: () => State,
  ) => {
    const state = getState();

    const mediaFile = await state.mediaFilesReducer.uploadQueue.uploadOrQueue(file);
    dispatch({
      type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED,
      mediaFile,
    });

    return mediaFile;
  };
}