import { MediaFile } from './MediaFile';
import { VideoMetadata } from './VideoMetadata';
import { FitTrack } from './FitTrack';
import { PictureMetadata } from './PictureMetadata';
import { MediaFileType } from './MediaFileType';

export function createMediaFileWithParticipants(mediaFile: MediaFile, participantIds: number[]) {
    switch (mediaFile.fileType) {
        case MediaFileType.Picture: {
            return new PictureMetadata(
                mediaFile.hashValue,
                mediaFile.relativePath,
                mediaFile.fileSizeBytes,
                participantIds,
                mediaFile.exif,
                mediaFile.rawSize,
                mediaFile.suggestedLocation);
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
