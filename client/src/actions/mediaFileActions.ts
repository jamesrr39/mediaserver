import { Action, Dispatch } from "redux";
import { fromJSON, MediaFileJSON } from "../domain/deserialise";
import { FitTrack, Record } from "../domain/FitTrack";
import { MediaFile } from "../domain/MediaFile";
import { nameForMediaFileType } from "../domain/MediaFileType";
import { Person } from "../domain/People";
import { createMediaFileWithParticipants } from "../domain/util";
import { State } from "../reducers/rootReducer";
import { createErrorMessage } from "./util";
import { Resolvable } from "ts-util/src/Promises";

export type PeopleMap = Map<number, Person>;

export enum FilesActionTypes {
  MEDIA_FILES_FETCHED = "MEDIA_FILES_FETCHED",
  QUEUE_FOR_UPLOAD = "QUEUE_FOR_UPLOAD",
  FILE_SUCCESSFULLY_UPLOADED = "FILE_SUCCESSFULLY_UPLOADED",
  PARTICIPANTS_SET_ON_MEDIAFILE = "PARTICIPANTS_SET_ON_MEDIAFILE",
  TRACK_RECORDS_QUEUED_FOR_FETCH = "TRACK_RECORDS_QUEUED_FOR_FETCH",
}

export interface PicturesMetadataFetchedAction extends Action {
  type: FilesActionTypes.MEDIA_FILES_FETCHED;
  mediaFiles: MediaFile[];
}

export interface PictureSuccessfullyUploadedAction extends Action {
  type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED;
  mediaFile: MediaFile;
}

export type QueueForUploadAction = {
  type: FilesActionTypes.QUEUE_FOR_UPLOAD;
  file: File;
};

export type ParticipantAddedToMediaFile = {
  type: FilesActionTypes.PARTICIPANTS_SET_ON_MEDIAFILE;
  mediaFile: MediaFile;
  participants: Person[];
};

export type TractRecordsQueuedForFetch = {
  type: FilesActionTypes.TRACK_RECORDS_QUEUED_FOR_FETCH;
  resolvableMap: Map<string, Resolvable<Record[]>>;
};

export type MediaserverAction =
  | PicturesMetadataFetchedAction
  | PictureSuccessfullyUploadedAction
  | QueueForUploadAction
  | ParticipantAddedToMediaFile
  | TractRecordsQueuedForFetch;

type TrackJSON = {
  hash: string;
  records: RecordJSON[];
};

type RecordJSON = {
  timestamp: string;
  posLat: number;
  posLong: number;
  distance: number;
  altitude: number;
};

export type FetchPicturesMetadataResponse = {
  mediaFiles: MediaFile[];
};

export function fetchPicturesMetadata() {
  return async function (dispatch: Dispatch) {
    const response = await fetch(`/api/files/`);
    if (!response.ok) {
      throw new Error(createErrorMessage(response));
    }

    const mediaFilesJSON: MediaFileJSON[] = await response.json();

    const mediaFiles = mediaFilesJSON.map((json) => fromJSON(json));

    dispatch({
      type: FilesActionTypes.MEDIA_FILES_FETCHED,
      mediaFiles,
    });

    return mediaFiles;
  };
}

async function fetchTrackRecords(hashes: string[]) {
  const response = await fetch(`/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/graphql",
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
      tracks: TrackJSON[];
    };
  };
  const responseBody = (await response.json()) as Response;
  const { tracks } = responseBody.data;

  return tracks.map((trackJSON) => {
    return {
      ...trackJSON,
      records: trackJSON.records.map((record) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      })),
    };
  });
}

function fetchMissingHashes(
  hashesToFetch: string[],
  trackSummaryIdsMap: Map<string, Promise<Record[]>>
) {
  return async (dispatch: (action: MediaserverAction) => void) => {
    const trackSummaryIdsMapForNewTracks = new Map<string, Promise<Record[]>>();
    const resolveMap = new Map<string, Resolvable<Record[]>>();
    hashesToFetch.forEach((hash) => {
      const resolvable = new Resolvable<Record[]>();
      resolveMap.set(hash, resolvable);
    });

    dispatch({
      type: FilesActionTypes.TRACK_RECORDS_QUEUED_FOR_FETCH,
      resolvableMap: resolveMap,
    });

    const tracks = await fetchTrackRecords(hashesToFetch);

    tracks.forEach((track) => {
      const { hash, records } = track;
      const resolvable = resolveMap.get(hash);
      resolvable.resolve(records);
      const { promise } = resolvable;

      trackSummaryIdsMapForNewTracks.set(hash, promise);
      trackSummaryIdsMap.set(hash, promise);
    });
  };
}

export function fetchRecordsForTracks(trackSummaries: FitTrack[]) {
  return async (
    dispatch: (action: MediaserverAction) => void,
    getState: () => State
  ) => {
    const state = getState();

    const trackSummaryIdsMap = new Map<string, Promise<Record[]>>();
    const hashesToFetch: string[] = [];
    // figure out which already have promises, and which need to be fetched
    trackSummaries.forEach((trackSummary) => {
      const { hashValue } = trackSummary;

      const recordsFromStatePromise =
        state.mediaFilesReducer.trackRecordsMap.get(hashValue);
      if (recordsFromStatePromise) {
        // records are already fetched or queued to fetched
        trackSummaryIdsMap.set(hashValue, recordsFromStatePromise);
        return;
      }

      hashesToFetch.push(hashValue);
    });

    if (hashesToFetch.length !== 0) {
      await fetchMissingHashes(hashesToFetch, trackSummaryIdsMap)(dispatch);
    }

    return new Promise<Map<string, Record[]>>((resolve, reject) => {
      const map = new Map<string, Record[]>();
      trackSummaryIdsMap.forEach(async (recordsPromise, hash) => {
        const records = await recordsPromise;
        map.set(hash, records);
        if (trackSummaryIdsMap.size === map.size) {
          resolve(map);
        }
      });
    });
  };
}

export function uploadFile(file: File) {
  return async (
    dispatch: (action: MediaserverAction) => void,
    getState: () => State
  ) => {
    const state = getState();

    const mediaFile = await state.mediaFilesReducer.uploadQueue.uploadOrQueue(
      state,
      file
    );
    dispatch({
      type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED,
      mediaFile,
    });

    return mediaFile;
  };
}

export function setParticipantsOnMediaFile(
  mediaFile: MediaFile,
  participants: Person[]
) {
  return async (
    dispatch: (action: MediaserverAction) => void,
    getState: () => State
  ) => {
    for (let participant of participants) {
      if (participant.id === 0) {
        throw new Error(`couldn't save, got participant id 0`);
      }
    }

    const participantIds = participants.map((participant) => participant.id);

    const response = await fetch(`/api/graphql?query={people{id,name}}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/graphql",
      },
      body: `mutation {
        updateMediaFiles(hashes: ["${
          mediaFile.hashValue
        }"], participantIds: ${JSON.stringify(participantIds)})
        {${nameForMediaFileType(mediaFile.fileType)}{participantIds}}
      }`,
    });

    if (!response.ok) {
      throw new Error("failed to save person");
    }

    const newMediaFile = createMediaFileWithParticipants(
      mediaFile,
      participantIds
    );

    dispatch({
      type: FilesActionTypes.PARTICIPANTS_SET_ON_MEDIAFILE,
      mediaFile: newMediaFile,
      participants,
    });
  };
}
