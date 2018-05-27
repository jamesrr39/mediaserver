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

export function getTimeTaken(pictureMetadata: PictureMetadata) {
  if (pictureMetadata.exif === null) {
    return null;
  }

  if (pictureMetadata.exif.DateTime) {
    return new Date(pictureMetadata.exif.DateTime);
  }

  if (pictureMetadata.exif.DateTimeDigitized) {
    return new Date(pictureMetadata.exif.DateTimeDigitized);
  }

  if (pictureMetadata.exif.DateTimeOriginal) {
    return new Date(pictureMetadata.exif.DateTimeOriginal);
  }

  return null;
}

type ExifData = {
  DateTime?: string;
  DateTimeDigitized?: string;
  DateTimeOriginal?: string;
};
