import { MapLocation } from './Location';

export enum MediaFileType {
  Picture = 1,
  Video = 2,
}

export abstract class MediaFile {
  constructor(
    public readonly fileType: MediaFileType,
    public readonly hashValue: string,
    public readonly relativeFilePath: string,
    public readonly  fileSizeBytes: number) {}
  getName() {
    const lastSlash = this.relativeFilePath.lastIndexOf('/');
    if (lastSlash === -1) {
      return this.relativeFilePath;
    }
    return this.relativeFilePath.substring(lastSlash + 1);
  }
  abstract getTimeTaken(): Date | null;
  abstract getLocation(): MapLocation | null;
}
