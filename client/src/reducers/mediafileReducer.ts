import {
  MediaserverAction,
  FilesActionTypes,
} from "../actions/mediaFileActions";
import { FileQueue } from "../fileQueue";
import { MediaFile } from "../domain/MediaFile";
import { Record, FitTrack } from "../domain/FitTrack";

export type MediaFilesState = {
  mediaFiles: MediaFile[];
  mediaFilesMap: Map<string, MediaFile>;
  uploadQueue: FileQueue;
  trackRecordsMap: Map<string, Promise<Record[]>>;
  fetchTrackRecordsQueue: FitTrack[];
};

const maxConcurrentUploads = 2;

const mediaFilesInitialState = {
  mediaFiles: [],
  mediaFilesMap: new Map<string, MediaFile>(),
  uploadQueue: new FileQueue(maxConcurrentUploads),
  trackRecordsMap: new Map<string, Promise<Record[]>>(),
  fetchTrackRecordsQueue: [],
};

export function mediaFilesReducer(
  state: MediaFilesState = mediaFilesInitialState,
  action: MediaserverAction
) {
  switch (action.type) {
    case FilesActionTypes.MEDIA_FILES_FETCHED:
      const mediaFilesMap = new Map<string, MediaFile>();
      action.mediaFiles.forEach((mediaFile) => {
        mediaFilesMap.set(mediaFile.hashValue, mediaFile);
      });
      return {
        ...state,
        mediaFiles: action.mediaFiles,
        mediaFilesMap: mediaFilesMap,
      };
    case FilesActionTypes.FILE_SUCCESSFULLY_UPLOADED:
      return {
        ...state,
        mediaFiles: state.mediaFiles.concat([action.mediaFile]),
      };
    case FilesActionTypes.TRACK_RECORDS_FETCHED_ACTION:
      const newMap = new Map(state.trackRecordsMap);
      action.trackSummaryIdsMap.forEach((records, hash) => {
        newMap.set(hash, records);
      });
      return {
        ...state,
        trackRecordsMap: newMap,
      };
    case FilesActionTypes.PARTICIPANTS_SET_ON_MEDIAFILE:
      const { mediaFile } = action;

      // create the new list. Replace the old mediafile with the new one, using the hashValue
      const mediaFiles = state.mediaFiles.map((mediaFileInList) => {
        if (mediaFile.hashValue === mediaFileInList.hashValue) {
          return mediaFile;
        }

        return mediaFileInList;
      });

      state.mediaFilesMap.set(mediaFile.hashValue, mediaFile);

      return {
        ...state,
        mediaFiles,
      };
    default:
      return state;
  }
}
