export type PictureMetadata = {
  hashValue: string;
  relativeFilePath: string;
  fileSizeBytes: number;
  exif: null|Object;
  rawSize: {
    width: number;
    height: number;
  }
};
