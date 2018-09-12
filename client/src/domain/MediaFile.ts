import { Location } from './Location';

export enum MediaFileType {
  Picture = 1,
  Video = 2,
}

export abstract class MediaFile {
  abstract fileType: MediaFileType;
  abstract hashValue: string;
  abstract relativeFilePath: string;
  abstract fileSizeBytes: number;
  getName() {
    const lastSlash = this.relativeFilePath.lastIndexOf('/');
    if (lastSlash === -1) {
      return this.relativeFilePath;
    }
    return this.relativeFilePath.substring(lastSlash + 1);
  }
  abstract getTimeTaken(): Date | null;
  abstract getLocation(): Location | null;
}
