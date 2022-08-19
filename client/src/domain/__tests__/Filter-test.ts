import { DateFilter } from "../filter/DateFilter";
import { GalleryFilter } from "../filter/GalleryFilter";
import { PictureMetadata } from "../PictureMetadata";

test("filter", () => {
  const filter = new GalleryFilter(
    new DateFilter({
      start: new Date("2000-01-01T00:00:00"),
      end: new Date("2000-01-01T00:00:02"),
      includeFilesWithoutDates: false,
    })
  );

  const mf1 = new PictureMetadata(
    "",
    "",
    0,
    [],
    { DateTime: "2000:01:01 00:00:01" }, // new Date(1000)
    { width: 0, height: 0 }
  );

  expect(filter.filter(mf1)).toBeTruthy();

  const mf2 = new PictureMetadata(
    "",
    "",
    0,
    [],
    { DateTime: "1999:01:01 00:00:00" }, // new Date(1000)
    { width: 0, height: 0 }
  );

  expect(filter.filter(mf2)).toBeFalsy();

  const mf3 = new PictureMetadata(
    "",
    "",
    0,
    [],
    { DateTime: "2001:01:01 00:00:01" }, // new Date(1000)
    { width: 0, height: 0 }
  );

  expect(filter.filter(mf3)).toBeFalsy();
});
