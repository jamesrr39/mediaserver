import { MediaFileType, MediaFile } from './MediaFile';

export class VideoMetadata extends MediaFile {
  public readonly fileType = MediaFileType.Video;

  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly fileSizeBytes: number,
  ) {
    super(hashValue, relativePath, fileSizeBytes);
  }

  getTimeTaken() {
    return null; // TODO
  }
  getLocation() {
    return null;
  }
}
