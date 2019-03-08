import { AbstractMediaFile } from './AbstractMediaFile';
import { MapLocation, SuggestedLocation } from './Location';
import { MediaFileType } from './MediaFileType';
import { MediaFile } from './MediaFile';

export class PictureMetadata extends AbstractMediaFile {
  public readonly fileType = MediaFileType.Picture;
  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly fileSizeBytes: number,
    public readonly exif: null|ExifData,
    public readonly rawSize: RawSize,
    public readonly suggestedLocation?: SuggestedLocation) {
      super(hashValue, relativePath, fileSizeBytes);
    }

  getTimeTaken(): Date | null {
    if (this.exif === null) {
      return null;
    }

    if (this.exif.DateTime) {
      return parseExifDate(this.exif.DateTime);
    }

    if (this.exif.DateTimeDigitized) {
      return parseExifDate(this.exif.DateTimeDigitized);
    }

    if (this.exif.DateTimeOriginal) {
      return parseExifDate(this.exif.DateTimeOriginal);
    }

    return null;
  }

  getLocation(): MapLocation|null {
    const {exif} = this;
    if (exif === null) {
      return null;
    }

    const {GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef, GPSMapDatum} = exif;
    switch (GPSMapDatum) {
      case 'WGS-84':
        if (
          !GPSLatitude ||
          (GPSLatitudeRef !== 'N' && GPSLatitudeRef !== 'S') ||
          !GPSLongitude ||
          (GPSLongitudeRef !== 'W' && GPSLongitudeRef !== 'E')) {
          return null;
        }
        return parseWGS84ToLocation(GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef);
      default:
        // TODO: log this info
        return null;
    }
  }
}

function parseWGS84ToLocation(
  GPSLatitude: string[],
  GPSLatitudeRef: string,
  GPSLongitude: string[],
  GPSLongitudeRef: string): MapLocation|null {
  const latDegs = asDecimal(GPSLatitude[0]);
  const latMins = asDecimal(GPSLatitude[1]);
  const latSecs = asDecimal(GPSLatitude[2]);
  const lat = ((((latSecs / 60) + latMins) / 60) + latDegs) * (GPSLatitudeRef === 'N' ? 1 : -1);

  const longDegs = asDecimal(GPSLongitude[0]);
  const longMins = asDecimal(GPSLongitude[1]);
  const longSecs = asDecimal(GPSLongitude[2]);
  const lon = ((((longSecs / 60) + longMins) / 60) + longDegs) * (GPSLongitudeRef === 'E' ? 1 : -1);

  return {
    lat,
    lon,
  };
}

function asDecimal(value: string): number {
  const fragments = value.split('/');
  switch (fragments.length) {
    case 1:
      return parseInt(value, 10);
    case 2:
      const numerator = parseInt(fragments[0], 10);
      const denominator = parseInt(fragments[1], 10);
      return numerator / denominator;
    default:
      throw new Error(`could not understand "${value}"`);
  }
}

/**
 * sorts two dates, most recent first.
 * sortNullAfter indicates whether a should be b sorted after b if a is null and b has a date
 */
export function createCompareTimeTakenFunc(sortNullAfter: boolean) {
  return (a: MediaFile, b: MediaFile) => {
    const aTaken = a.getTimeTaken();
    const bTaken = b.getTimeTaken();

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
      return a.relativePath > b.relativePath ? 1 : -1;
    }

    return (bTime > aTime) ? 1 : -1;
  };
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

export type RawSize = {
  width: number,
  height: number,
};

export type ExifData = {
  DateTime?: string;
  DateTimeDigitized?: string;
  DateTimeOriginal?: string;
  GPSAltitude?: string;
  GPSAltitudeRef?: string;
  GPSDateStamp?: string;
  GPSInfoIFDPointer?: string;
  GPSLatitude?: string[];
  GPSLatitudeRef?: 'N' | 'S';
  GPSLongitude?: string[];
  GPSLongitudeRef?: 'W' | 'E';
  GPSMapDatum?: string;
};
/*
Reference to GPS keys: https://sno.phy.queensu.ca/~phil/exiftool/TagNames/GPS.html
Known exif keys:

"ApertureValue"
"ColorSpace"
"ComponentsConfiguration"
"CompressedBitsPerPixel"
"CustomRendered"
"DateTime"
"DateTimeDigitized"
"DateTimeOriginal"
"DigitalZoomRatio"
"ExifIFDPointer"
"ExifVersion"
"ExposureBiasValue"
"ExposureMode"
"ExposureTime"
"FNumber"
"FileSource"
"Flash"
"FlashpixVersion"
"FocalLength"
"FocalPlaneResolutionUnit"
"FocalPlaneXResolution"
"FocalPlaneYResolution"
"ISOSpeedRatings"
"ImageDescription"
"InteroperabilityIFDPointer"
"InteroperabilityIndex"
"Make"
"MakerNote"
"MaxApertureValue"
"MeteringMode"
"Model"
"Orientation"
"PixelXDimension"
"PixelYDimension"
"ResolutionUnit"
"SceneCaptureType"
"SensingMethod"
"ShutterSpeedValue"
"ThumbJPEGInterchangeFormat"
"ThumbJPEGInterchangeFormatLength"
"UserComment"
"WhiteBalance"
"XResolution"
"YCbCrPositioning"
"YResolution"
"GPSAltitude"
"GPSAltitudeRef"
"GPSDateStamp"
"GPSInfoIFDPointer"
"GPSLatitude"
"GPSLatitudeRef"
"GPSLongitude"
"GPSLongitudeRef"
"GPSMapDatum"
"GPSStatus"
"GPSTimeStamp"
"GPSVersionID"
"ImageUniqueID"
"Software"
"BrightnessValue"
"Contrast"
"ExposureProgram"
"Saturation"
"SceneType"
"Sharpness"
"ExposureIndex"
"FlashEnergy"
"LightSource"
"SubjectDistance"
"SubjectDistanceRange"
"SubSecTime"
"SubSecTimeDigitized"
"SubSecTimeOriginal"
*/
