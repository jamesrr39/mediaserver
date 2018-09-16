import { MediaFileType } from './MediaFile';
import { ExifData, RawSize, PictureMetadata } from './PictureMetadata';
import { VideoMetadata } from './VideoMetadata';

type PictureMetadataJSON = {
  fileType: MediaFileType.Picture;
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
  exif: null|ExifData;
  rawSize: RawSize;
};

type VideoMetadataJSON = {
  fileType: MediaFileType.Video;
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
};

export type MediaFileJSON = {
  fileType: MediaFileType;
} & (PictureMetadataJSON | VideoMetadataJSON);

export function fromJSON(json: MediaFileJSON) {
  switch (json.fileType) {
  case MediaFileType.Picture:
    return new PictureMetadata(json.hashValue, json.relativeFilePath, json.fileSizeBytes, json.exif, json.rawSize);
  case MediaFileType.Video:
    return new VideoMetadata(json.hashValue, json.relativeFilePath, json.fileSizeBytes);
  default:
    throw new Error(`type '${json}' not supported`);
  }
}
