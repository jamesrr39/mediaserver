export type PictureMetadata = {
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
  exif: null|ExifData;
  rawSize: {
    width: number;
    height: number;
  }
};

/**
 * sorts two dates, most recent first.
 * sortNullAfter indicates whether a should be b sorted after b if a is null and b has a date
 */
export function createCompareTimeTakenFunc(sortNullAfter: boolean) {
  return (a: PictureMetadata, b: PictureMetadata) => {
    const aTaken = getTimeTaken(a);
    const bTaken = getTimeTaken(b);

    if (aTaken === null && bTaken === null) {
      return 0;
    }

    if (aTaken === null) {
      return (sortNullAfter) ? 1 : -1;
    }

    if (bTaken === null) {
      return (sortNullAfter) ? -1 : 1;
    }

    const aTime = aTaken.getTime();
    const bTime = bTaken.getTime();
    if (aTime === bTime) {
      return 0;
    }

    return (bTime > aTime) ? 1 : -1;
  };
}

function getTimeTaken(pictureMetadata: PictureMetadata) {
  if (pictureMetadata.exif === null) {
    return null;
  }

  if (pictureMetadata.exif.DateTime) {
    return parseExifDate(pictureMetadata.exif.DateTime);
  }

  if (pictureMetadata.exif.DateTimeDigitized) {
    return parseExifDate(pictureMetadata.exif.DateTimeDigitized);
  }

  if (pictureMetadata.exif.DateTimeOriginal) {
    return parseExifDate(pictureMetadata.exif.DateTimeOriginal);
  }

  return null;
}

// convert ex. 2018:01:22 16:29:03 to a Date
function parseExifDate(dateString: string) {
  const fragments = dateString.split(' ');
  const dateFragments = fragments[0].split(':');
  const timeFragments = fragments[1].split(':');
  const date = new Date(
    parseInt(dateFragments[0], 10),
    parseInt(dateFragments[1], 10) - 1,
    parseInt(dateFragments[2], 10),
    parseInt(timeFragments[0], 10),
    parseInt(timeFragments[1], 10),
    parseInt(timeFragments[2], 10)
  );
  return date;
}

// class TimezonelessDate {
//   constructor(
//     public readonly year: number,
//     public readonly month: number,
//     public readonly day: number,
//     public readonly hour: number,
//     public readonly minute: number,
//     public readonly second: number,
//   ) {}
//
//   asUTCTimestamp() {}
// }

type ExifData = {
  DateTime?: string;
  DateTimeDigitized?: string;
  DateTimeOriginal?: string;
};
