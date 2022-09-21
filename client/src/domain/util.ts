import { FitTrack } from "./FitTrack";
import { MediaFile } from "./MediaFile";
import { MediaFileType } from "./MediaFileType";
import { PictureMetadata } from "./PictureMetadata";
import { VideoMetadata } from "./VideoMetadata";

export function createMediaFileWithParticipants(
  mediaFile: MediaFile,
  participantIds: number[]
) {
  switch (mediaFile.fileType) {
    case MediaFileType.Picture: {
      return new PictureMetadata(
        mediaFile.hashValue,
        mediaFile.relativePath,
        mediaFile.fileSizeBytes,
        participantIds,
        mediaFile.exif,
        mediaFile.rawSize,
        mediaFile.suggestedLocation
      );
    }
    case MediaFileType.FitTrack: {
      return new FitTrack(
        mediaFile.hashValue,
        mediaFile.relativePath,
        mediaFile.fileSizeBytes,
        participantIds,
        mediaFile.startTime,
        mediaFile.endTime,
        mediaFile.deviceManufacturer,
        mediaFile.deviceProduct,
        mediaFile.totalDistance,
        mediaFile.activityBounds,
        mediaFile.suggestedLocation
      );
    }
    case MediaFileType.Video: {
      return new VideoMetadata(
        mediaFile.hashValue,
        mediaFile.relativePath,
        mediaFile.fileSizeBytes,
        participantIds,
        mediaFile.suggestedLocation
      );
    }
    default:
      throw new Error(`unknown type "${mediaFile}"`);
  }
}

// TODO: move to ts-util
export function joinUrlFragments(fragments: string[]): string {
  const finishedFragments = [];

  fragments.forEach((fragment, idx) => {
    if (fragments.length === 0) {
      return;
    }

    if (idx !== 0) {
      const fragmentStartsWithSlash = fragment.charAt(0) === "/";
      if (fragmentStartsWithSlash) {
        fragment = fragment.substring(1);
      }
    }

    if (idx !== fragments.length - 1) {
      const fragmentEndsWithSlash =
        fragment.charAt(fragment.length - 1) === "/";
      if (fragmentEndsWithSlash) {
        fragment = fragment.substring(0, fragment.length - 1);
      }
    }

    finishedFragments.push(fragment);
  });

  return finishedFragments.join("/");
}
