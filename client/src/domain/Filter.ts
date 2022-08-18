import { MediaFile } from "./MediaFile";
import { MediaFileType } from "./MediaFileType";

type FilterJson = {
  date?: {
    start: number;
    end: number;
    includeFilesWithoutDates: boolean;
  };
};

export class GalleryFilter {
  constructor(public readonly dateFilter: DateFilter | null) {}

  public filter = (mediaFile: MediaFile): boolean => {
    if (this.dateFilter !== null) {
      if (!this.dateFilter.filter(mediaFile)) {
        return false;
      }
    }

    return true;
  };

  public getSummary() {
    const { dateFilter } = this;
    if (!dateFilter) {
      return "Showing all files";
    }

    const includingWithoutDatesText = dateFilter.includeFilesWithoutDates
      ? "including"
      : "excluding";

    return [
      "Showing files with dates between",
      dateFilter.startDate.toLocaleDateString(),
      "and",
      dateFilter.endDate.toLocaleDateString(),
      includingWithoutDatesText,
      "files without dates",
    ].join(" ");
  }

  public toJsObject(): FilterJson {
    if (this.dateFilter) {
      return {
        date: {
          start: this.dateFilter.startDate.getTime(),
          end: this.dateFilter.endDate.getTime(),
          includeFilesWithoutDates: this.dateFilter.includeFilesWithoutDates,
        },
      };
    }

    return {};
  }

  public toJSON(): string {
    return JSON.stringify(this.toJsObject());
  }
}

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

export class DateFilter {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly includeFilesWithoutDates: boolean
  ) {
    if (startDate && endDate && startDate > endDate) {
      throw new Error("filter start date is after end date");
    }
  }

  public filter = (mediaFile: MediaFile): boolean => {
    switch (mediaFile.fileType) {
      case MediaFileType.FitTrack:
        if (isDate1Before(this.endDate, mediaFile.startTime)) {
          return false;
        }
        if (isDate1After(this.startDate, mediaFile.endTime)) {
          return false;
        }
        break;
      default:
        const fileDate = mediaFile.getTimeTaken();
        if (fileDate === null) {
          return this.includeFilesWithoutDates;
        }
        if (
          isDate1After(this.startDate, fileDate) ||
          isDate1Before(this.endDate, fileDate)
        ) {
          return false;
        }
        break;
    }

    return true;
  };
}

export function filterFromJson(json: string) {
  const filterJson: FilterJson = JSON.parse(json);
  if (filterJson.date) {
    return new GalleryFilter(
      new DateFilter(
        new Date(filterJson.date.start),
        new Date(filterJson.date.end),
        filterJson.date.includeFilesWithoutDates
      )
    );
  }

  return new GalleryFilter(null);
}
