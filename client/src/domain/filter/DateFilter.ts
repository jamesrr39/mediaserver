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
  constructor(public readonly filterObj: DateFilterObject) {
    const { start, end } = filterObj;

    if (start && end && start > end) {
      throw new Error("filter start date is after end date");
    }
  }
  summary(): string {
    const { start, end, includeFilesWithoutDates } = this.filterObj;

    if (!start && !end) {
      return "All date ranges";
    }

    if (start && end) {
      if (includeFilesWithoutDates) {
        return `Between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}, including files without dates`;
      }

      return `Between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}, excluding files without dates`;
    }

    if (!start) {
      // only an end date
      if (includeFilesWithoutDates) {
        return `Before ${end.toLocaleDateString()}, including files without dates`;
      }

      return `Before ${end.toLocaleDateString()}, excluding files without dates`;
    }

    // only a start date

    if (includeFilesWithoutDates) {
      return `After ${start.toLocaleDateString()}, including files without dates`;
    }

    return `After ${start.toLocaleDateString()}, excluding files without dates`;
  }

  public filter = (mediaFile: MediaFile): boolean => {
    switch (mediaFile.fileType) {
      case MediaFileType.FitTrack:
        if (
          this.filterObj.end &&
          isDate1Before(this.filterObj.end, mediaFile.startTime)
        ) {
          return false;
        }
        if (
          this.filterObj.start &&
          isDate1After(this.filterObj.start, mediaFile.endTime)
        ) {
          return false;
        }
        break;
      default:
        const fileDate = mediaFile.getTimeTaken();
        if (fileDate === null) {
          return this.filterObj.includeFilesWithoutDates;
        }

        if (
          (this.filterObj.start &&
            isDate1After(this.filterObj.start, fileDate)) ||
          (this.filterObj.end && isDate1Before(this.filterObj.end, fileDate))
        ) {
          return false;
        }
        break;
    }

    return true;
  };
}
