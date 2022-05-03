import { AbstractMediaFile } from "./AbstractMediaFile";
import { MediaFileType } from "./MediaFileType";
import { SuggestedLocation } from "./Location";

export class VideoMetadata extends AbstractMediaFile {
  public readonly fileType = MediaFileType.Video;

  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly fileSizeBytes: number,
    public readonly participantIds: number[],
    public readonly suggestedLocation?: SuggestedLocation
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
