import { THUMBNAIL_HEIGHTS } from "src/generated/thumbnail_sizes";
import { MediaFile } from "../MediaFile";
import { MediaFileType } from "../MediaFileType";
import { Filter } from "./Filter";

function isDate1Before(date1: Date, date2: Date): boolean {
  if (date1.getFullYear() < date2.getFullYear()) {
    return true;
  }

  if (date1.getFullYear() > date2.getFullYear()) {
    return false;
  }

  if (date1.getMonth() < date2.getMonth()) {
    return true;
  }

  if (date1.getMonth() > date2.getMonth()) {
    return false;
  }

  if (date1.getDate() < date2.getDate()) {
    return true;
  }

  return false;
}

function isDate1After(date1: Date, date2: Date): boolean {
  if (date1.getFullYear() > date2.getFullYear()) {
    return true;
  }

  if (date1.getFullYear() < date2.getFullYear()) {
    return false;
  }

  if (date1.getMonth() > date2.getMonth()) {
    return true;
  }

  if (date1.getMonth() < date2.getMonth()) {
    return false;
  }

  if (date1.getDate() > date2.getDate()) {
    return true;
  }

  return false;
}

type DateFilterObject = {
  start?: Date;
  end?: Date;
  includeFilesWithoutDates: boolean;
};

export class DateFilter implements Filter {
  public readonly start?: Date;
  public readonly end?: Date;
  public readonly includeFilesWithoutDates: boolean;
  constructor(filterObj?: DateFilterObject) {
    if (!filterObj) {
      this.includeFilesWithoutDates = true;
      return;
    }

    const { start, end, includeFilesWithoutDates } = filterObj;

    if (start && end && start > end) {
      throw new Error("filter start date is after end date");
    }

    this.start = start;
    this.end = end;
    this.includeFilesWithoutDates = includeFilesWithoutDates;
  }
  summary(): string {
    if (!this.start && !this.end) {
      return "All date ranges";
    }

    if (this.start && this.end) {
      if (this.includeFilesWithoutDates) {
        return `Between ${this.start.toLocaleDateString()} and ${this.end.toLocaleDateString()}, including files without dates`;
      }

      return `Between ${this.start.toLocaleDateString()} and ${this.end.toLocaleDateString()}, excluding files without dates`;
    }

    if (!this.start) {
      // only an end date
      if (this.includeFilesWithoutDates) {
        return `Before ${this.end.toLocaleDateString()}, including files without dates`;
      }

      return `Before ${this.end.toLocaleDateString()}, excluding files without dates`;
    }

    // only a start date

    if (this.includeFilesWithoutDates) {
      return `After ${this.start.toLocaleDateString()}, including files without dates`;
    }

    return `After ${this.start.toLocaleDateString()}, excluding files without dates`;
  }

  public filter = (mediaFile: MediaFile): boolean => {
    switch (mediaFile.fileType) {
      case MediaFileType.FitTrack:
        if (this.end && isDate1Before(this.end, mediaFile.startTime)) {
          return false;
        }
        if (this.start && isDate1After(this.start, mediaFile.endTime)) {
          return false;
        }
        break;
      default:
        const fileDate = mediaFile.getTimeTaken();
        if (fileDate === null) {
          return this.includeFilesWithoutDates;
        }

        if (
          (this.start && isDate1After(this.start, fileDate)) ||
          (this.end && isDate1Before(this.end, fileDate))
        ) {
          return false;
        }
        break;
    }

    return true;
  };
}
