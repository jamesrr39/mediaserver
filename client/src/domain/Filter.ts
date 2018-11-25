import { MediaFile } from './MediaFile';
import { MediaFileType } from './MediaFileType';

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
        if (this.endDate && this.endDate < mediaFile.startTime) {
          return false;
        }
        if (this.startDate && this.startDate > mediaFile.endTime) {
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
