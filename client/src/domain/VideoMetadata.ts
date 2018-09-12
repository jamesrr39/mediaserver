import { MediaFileType, MediaFile } from './MediaFile';

export class VideoMetadata extends MediaFile {
  public readonly fileType = MediaFileType.Video;

  constructor(
    public readonly hashValue: string,
    public readonly relativeFilePath: string,
    public readonly fileSizeBytes: number,
  ) {
    super();
  }

  getTimeTaken() {
    return null; // TODO
  }
  getLocation() {
    return null;
  }
}
