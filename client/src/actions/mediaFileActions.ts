import { Action } from 'redux';
import { SERVER_BASE_URL } from '../configs';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileJSON, fromJSON } from '../domain/deserialise';
import { FitTrack, Record } from '../domain/FitTrack';
import { State } from '../reducers/rootReducer';
import { Person } from '../domain/People';
import { nameForMediaFileType } from '../domain/MediaFileType';
import { createErrorMessage, fetchWithAuth } from './util';
import { createMediaFileWithParticipants } from '../domain/util';

export type PeopleMap = Map<number, Person>;

export enum FilesActionTypes {
  FETCH_MEDIA_FILES = 'FETCH_MEDIA_FILES',
  MEDIA_FILES_FETCHED = 'MEDIA_FILES_FETCHED',
  MEDIA_FILES_FETCH_FAILED = 'MEDIA_FILES_FETCH_FAILED',
  QUEUE_FOR_UPLOAD = 'QUEUE_FOR_UPLOAD',
  FILE_SUCCESSFULLY_UPLOADED = 'FILE_SUCCESSFULLY_UPLOADED',
  TRACK_RECORDS_FETCHED_ACTION = 'TRACK_RECORDS_FETCHED_ACTION',
  PARTICIPANTS_SET_ON_MEDIAFILE = 'PARTICIPANTS_SET_ON_MEDIAFILE',
}

export interface PicturesMetadataFetchFailedAction extends Action {
  type: FilesActionTypes.MEDIA_FILES_FETCH_FAILED;
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

export type ParticipantAddedToMediaFile = {
  type: FilesActionTypes.PARTICIPANTS_SET_ON_MEDIAFILE,
  mediaFile: MediaFile,
  participants: Person[],
};

export type MediaserverAction = (
  PicturesMetadataFetchedAction |
  PictureSuccessfullyUploadedAction |
  FetchPicturesMetadataAction | 
  TrackRecordsFetchedAction |
  QueueForUploadAction |
  ParticipantAddedToMediaFile |
  PicturesMetadataFetchFailedAction
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

export type FetchPicturesMetadataResponse = {
  mediaFiles: MediaFile[],
};

export function fetchPicturesMetadata() {
  return async (dispatch: (action: MediaserverAction) => FetchPicturesMetadataResponse, getState: () => State) => {
    const state = getState();

    dispatch({
      type: FilesActionTypes.FETCH_MEDIA_FILES,
    });

    const response = await fetchWithAuth(state, `${SERVER_BASE_URL}/api/files/`);
    if (!response.ok) {
      throw new Error(createErrorMessage(response));
    }
      
    const mediaFilesJSON: MediaFileJSON[] = await response.json();

    const mediaFiles = mediaFilesJSON.map(json => fromJSON(json));
    dispatch({
      type: FilesActionTypes.MEDIA_FILES_FETCHED,
      mediaFiles,
    });

    return {
      mediaFiles,
    };
  };
}

async function fetchTrackRecords(state: State, hashes: string[]) {
  const response = await fetchWithAuth(state, `${SERVER_BASE_URL}/api/graphql`, {
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
  return async (
    dispatch: (action: TrackRecordsFetchedAction) => void, 
    getState: () => State,
  ) => {
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
      // dispatch queue action here
      // dispatch({
      //   type: FilesActionTypes.TRACK_RECORDS_FETCH_QUEUED_ACTION,
      //   trackSummaryIds: trackSummariesToFetch,
      // });
      fetchTrackRecords(state, trackSummariesToFetch).then(response => {
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

    const mediaFile = await state.mediaFilesReducer.uploadQueue.uploadOrQueue(state, file);
    dispatch({
      type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED,
      mediaFile,
    });

    return mediaFile;
  };
}

export function setParticipantsOnMediaFile(mediaFile: MediaFile, participants: Person[]) {
  return async(dispatch: (action: MediaserverAction) => void, getState: () => State) => {
    const state = getState();

    for (let participant of participants) {
      if (participant.id === 0) {
        throw new Error(`couldn't save, got participant id 0`);
      }
    }

    const participantIds = participants.map(participant => participant.id);

    const response = await fetchWithAuth(state, `${SERVER_BASE_URL}/api/graphql?query={people{id,name}}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/graphql',
      },
      body: `mutation {
        updateMediaFiles(hashes: ["${mediaFile.hashValue}"], participantIds: ${JSON.stringify(participantIds)})
        {${nameForMediaFileType(mediaFile.fileType)}{participantIds}}
      }`,
    });

    if (!response.ok) {
      throw new Error('failed to save person');
    }

    const newMediaFile = createMediaFileWithParticipants(mediaFile, participantIds);

    dispatch({
      type: FilesActionTypes.PARTICIPANTS_SET_ON_MEDIAFILE,
      mediaFile: newMediaFile,
      participants,
    });
  };
}
