import { MediaFile } from "../MediaFile";
import { DateFilter } from "./DateFilter";

export function toISO8601Date(d: Date) {
  return d.toISOString().split("T")[0];
}

type DateFilterObject = {
  start?: Date;
  end?: Date;
  includeFilesWithoutDates: boolean;
};

type FilterObject = {
  date: DateFilterObject;
};

export default class GalleryFilter {
  constructor(public readonly dateFilter: DateFilter) {}

  public filter = (mediaFile: MediaFile): boolean => {
    if (!this.dateFilter.filter(mediaFile)) {
      return false;
    }

    return true;
  };

  public toJSON(): string {
    type SerializedDateFilter = {
      start?: string;
      end?: string;
      includeFilesWithoutDates: boolean;
    };

    const { start, end, includeFilesWithoutDates } = this.dateFilter;

    const filter: { date: SerializedDateFilter } = {
      date: {
        includeFilesWithoutDates,
      },
    };

    if (start) {
      filter.date.start = toISO8601Date(start);
    }

    if (end) {
      filter.date.end = toISO8601Date(end);
    }

    return JSON.stringify(filter);
  }
}

export function filterFromJson(json: string) {
  const filterJson = JSON.parse(json);

  let dateFilterObj: undefined | DateFilterObject;
  if (filterJson.date) {
    const { start, end, includeFilesWithoutDates } = filterJson.date;
    dateFilterObj = {
      start: start && new Date(start),
      end: end && new Date(end),
      includeFilesWithoutDates: includeFilesWithoutDates === "true",
    };
  }

  return new GalleryFilter(new DateFilter(dateFilterObj));
}
