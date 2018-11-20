import { MediaFile, MediaFileType } from './MediaFile';
import { FitTrack } from './FitTrack';

export class GalleryFilter {
  constructor(
    public readonly startDate?: Date,
    public readonly endDate?: Date
  ) {
    if (startDate && endDate && startDate > endDate) {
      throw new Error('filter start date is after end date');
    }
  }

  public filter = (mediaFile: MediaFile): boolean => {
    switch (mediaFile.fileType) {
      case MediaFileType.FitTrack:
        const track = mediaFile as FitTrack;
        if (this.endDate && this.endDate < track.startTime) {
          return false;
        }
        if (this.startDate && this.startDate > track.endTime) {
          return false;
        }
        break;
      default:
        const fileDate = mediaFile.getTimeTaken();
        if (fileDate === null) {
          return false;
        }
        if ((this.startDate && this.startDate > fileDate) || (this.endDate && this.endDate < fileDate)) {
          return false;
        }
        break;
    }

    return true;
  }
}
