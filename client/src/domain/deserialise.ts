import { MediaFileType } from "./MediaFileType";
import { ExifData, RawSize, PictureMetadata } from "./PictureMetadata";
import { VideoMetadata } from "./VideoMetadata";
import { ActivityBounds, FitTrack } from "./FitTrack";
import { SuggestedLocation } from "./Location";

export interface BaseMediaFileJSON {
  hashValue: string;
  relativePath: string;
  fileSizeBytes: number;
  fileType: MediaFileType;
  fileModType: string;
  participantIds: number[];
  suggestedLocation?: SuggestedLocation;
}

type PictureMetadataJSON = {
  fileType: MediaFileType.Picture;
  exif: null | ExifData;
  rawSize: RawSize;
} & BaseMediaFileJSON;

type VideoMetadataJSON = {
  fileType: MediaFileType.Video;
} & BaseMediaFileJSON;

type FitFileMetadataJSON = {
  fileType: MediaFileType.FitTrack;
  startTime: string;
  endTime: string;
  deviceManufacturer: string;
  deviceProduct: string;
  totalDistance: number;
  activityBounds: ActivityBounds;
} & BaseMediaFileJSON;

export type MediaFileJSON =
  | PictureMetadataJSON
  | VideoMetadataJSON
  | FitFileMetadataJSON;

export function fromJSON(json: MediaFileJSON) {
  switch (json.fileType) {
    case MediaFileType.Picture:
      return new PictureMetadata(
        json.hashValue,
        json.relativePath,
        json.fileSizeBytes,
        json.participantIds,
        json.exif,
        json.rawSize,
        json.suggestedLocation
      );
    case MediaFileType.Video:
      return new VideoMetadata(
        json.hashValue,
        json.relativePath,
        json.fileSizeBytes,
        json.participantIds,
        json.suggestedLocation
      );
    case MediaFileType.FitTrack:
      return new FitTrack(
        json.hashValue,
        json.relativePath,
        json.fileSizeBytes,
        json.participantIds,
        new Date(json.startTime),
        new Date(json.endTime),
        json.deviceManufacturer,
        json.deviceProduct,
        json.totalDistance,
        json.activityBounds,
        json.suggestedLocation
      );
    default:
      throw new Error(`type '${json}' not supported`);
  }
}
