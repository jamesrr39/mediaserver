import { MediaFile } from "../MediaFile";
import { MediaFileType } from "../MediaFileType";
import { DateFilter } from "./DateFilter";
import { Filter } from "./Filter";

export function toISO8601Date(d: Date) {
  return d.toISOString().split("T")[0];
}

type FilterObject = {
  date: {
    start?: string;
    end?: string;
    includeFilesWithoutDates: boolean;
  };
};

export class GalleryFilter {
  constructor(public readonly dateFilter: DateFilter) {}

  public filter = (mediaFile: MediaFile): boolean => {
    if (!this.dateFilter.filter(mediaFile)) {
      return false;
    }

    return true;
  };

  public toJsObject(): FilterObject {
    const { start, end, includeFilesWithoutDates } = this.dateFilter.filterObj;

    const filter: FilterObject = {
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

    return filter;
  }

  public toJSON(): string {
    return JSON.stringify(this.toJsObject());
  }
}

export function filterFromJson(json: string) {
  const filterJson: FilterObject = JSON.parse(json);

  return new GalleryFilter(
    new DateFilter({
      start: filterJson.date.start && new Date(filterJson.date.start),
      end: filterJson.date.end && new Date(filterJson.date.end),
      includeFilesWithoutDates: filterJson.date.includeFilesWithoutDates,
    })
  );
}
