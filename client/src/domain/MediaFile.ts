import { MapLocation } from './Location';

export enum MediaFileType {
  Picture = 1,
  Video = 2,
  FitTrack = 3,
}

export abstract class MediaFile {
  public abstract readonly fileType: MediaFileType;

  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly  fileSizeBytes: number) {}
  getName() {
    const lastSlash = this.relativePath.lastIndexOf('/');
    if (lastSlash === -1) {
      return this.relativePath;
    }
    return this.relativePath.substring(lastSlash + 1);
  }
  abstract getTimeTaken(): Date | null;
  abstract getLocation(): MapLocation | null;
}
