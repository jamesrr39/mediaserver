export enum MediaFileType {
  Picture = 1,
  Video = 2,
  FitTrack = 3,
}

export function nameForMediaFileType(fileType: MediaFileType): string {
  switch (fileType) {
    case MediaFileType.Picture:
      return "pictures";
    case MediaFileType.Video:
      return "videos";
    case MediaFileType.FitTrack:
      return "tracks";
    default:
      throw new Error(`unknown media file type: ${fileType}`);
  }
}
