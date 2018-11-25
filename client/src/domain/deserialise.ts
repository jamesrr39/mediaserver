import { MediaFileType } from './MediaFileType';
import { ExifData, RawSize, PictureMetadata } from './PictureMetadata';
import { VideoMetadata } from './VideoMetadata';
import { ActivityBounds, FitTrack } from './FitTrack';

interface BaseMediaFileJSON {
  hashValue: string;
  relativePath: string;
  fileSizeBytes: number;
  fileType: MediaFileType;
}

type PictureMetadataJSON = {
  fileType: MediaFileType.Picture;
  exif: null|ExifData;
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

export type MediaFileJSON = {
  fileType: MediaFileType;
} & (PictureMetadataJSON | VideoMetadataJSON | FitFileMetadataJSON);

export function fromJSON(json: MediaFileJSON) {
  switch (json.fileType) {
  case MediaFileType.Picture:
    return new PictureMetadata(json.hashValue, json.relativePath, json.fileSizeBytes, json.exif, json.rawSize);
  case MediaFileType.Video:
    return new VideoMetadata(json.hashValue, json.relativePath, json.fileSizeBytes);
  case MediaFileType.FitTrack:
    return new FitTrack(
      json.hashValue,
      json.relativePath,
      json.fileSizeBytes,
      new Date(json.startTime),
      new Date(json.endTime),
      json.deviceManufacturer,
      json.deviceProduct,
      json.totalDistance,
      json.activityBounds,
    );
  default:
    throw new Error(`type '${json}' not supported`);
  }
}
