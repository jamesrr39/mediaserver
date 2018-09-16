import { MediaFileType, MediaFile } from './MediaFile';

export class VideoMetadata extends MediaFile {
  constructor(
    public readonly hashValue: string,
    public readonly relativeFilePath: string,
    public readonly fileSizeBytes: number,
  ) {
    super(MediaFileType.Video, hashValue, relativeFilePath, fileSizeBytes);
  }

  getTimeTaken() {
    return null; // TODO
  }
  getLocation() {
    return null;
  }
}
