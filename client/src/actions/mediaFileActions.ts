import { Action } from 'redux';
import { SERVER_BASE_URL } from '../configs';
import { NotificationLevel, GalleryNotification } from '../ui/NotificationBarComponent';
import { newNotificationAction, NotifyAction } from './notificationActions';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileJSON, fromJSON } from '../domain/deserialise';
import { FitTrack, Record } from '../domain/FitTrack';
import { State } from '../reducers/rootReducer';
import { Person } from '../domain/People';
import { nameForMediaFileType } from '../domain/MediaFileType';
import { DataResponse } from './util';
import { createMediaFileWithParticipants } from '../domain/util';

export type PeopleMap = Map<number, Person>;

export enum FilesActionTypes {
  FETCH_MEDIA_FILES,
  MEDIA_FILES_FETCHED,
  MEDIA_FILES_FETCH_FAILED,
  QUEUE_FOR_UPLOAD,
  FILE_SUCCESSFULLY_UPLOADED,
  TRACK_RECORDS_FETCHED_ACTION,
  PEOPLE_FETCHED_ACTION,
  PARTICIPANTS_SET_ON_MEDIAFILE,
  PEOPLE_CREATED,
}

export interface PersonCreatedAction extends Action {
  type: FilesActionTypes.PEOPLE_CREATED;
  people: Person[];
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

export type PeopleFetchedAction = {
  type: FilesActionTypes.PEOPLE_FETCHED_ACTION,
  people: Person[],
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
  PeopleFetchedAction |
  ParticipantAddedToMediaFile |
  PicturesMetadataFetchFailedAction | 
  PersonCreatedAction
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
  return (dispatch: (
    action: FetchPicturesMetadataAction | PicturesMetadataFetchedAction | 
      PicturesMetadataFetchFailedAction | NotifyAction
    ) => void) => {
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
        dispatch({
          type: FilesActionTypes.MEDIA_FILES_FETCH_FAILED,
        });
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

    const mediaFile = await state.mediaFilesReducer.uploadQueue.uploadOrQueue(file);
    dispatch({
      type: FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED,
      mediaFile,
    });

    return mediaFile;
  };
}

type PeopleJSON = {
  data: {people: Person[]}
};

export function fetchAllPeople() {
  return async(
    dispatch: (action: MediaserverAction) => void) => {
      const response = await fetch(`${SERVER_BASE_URL}/api/graphql?query={people{id,name}}`);
      if (!response.ok) {
        throw new Error('failed to fetch people');
      }

      const peopleJSON: PeopleJSON = await response.json();

      dispatch({
        type: FilesActionTypes.PEOPLE_FETCHED_ACTION,
        people: peopleJSON.data.people,
      });
    };
}

export function createPerson(name: string) {
  return async(dispatch: (action: MediaserverAction) => void) => {
    const response = await fetch(`${SERVER_BASE_URL}/api/graphql?query={people{id,name}}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/graphql',
      },
      body: `mutation {
        createPeople(names: ${JSON.stringify(name)}) {id,name}
      }`,
    });

    if (!response.ok) {
      throw new Error('failed to save person');
    }

    const json: DataResponse<Person> = await response.json();
    const person = json.data;

    dispatch({
      type: FilesActionTypes.PEOPLE_CREATED,
      people: [person],
    });

    return person;
  };
}

export function setParticipantsOnMediaFile(mediaFile: MediaFile, participants: Person[]) {
  return async(dispatch: (action: MediaserverAction) => void) => {
    for (let participant of participants) {
      if (participant.id === 0) {
        throw new Error(`couldn't save, got participant id 0`);
      }
    }

    const participantIds = participants.map(participant => participant.id);

    const response = await fetch(`${SERVER_BASE_URL}/api/graphql?query={people{id,name}}`, {
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
