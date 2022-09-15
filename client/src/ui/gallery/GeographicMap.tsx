import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import MapComponent, { MapMarker, TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import { MediaFileType } from "../../domain/MediaFileType";
import { useTrackMapData } from "src/hooks/trackRecordHooks";
import { FitTrack } from "src/domain/FitTrack";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

function getMarkers(mediaFiles: MediaFile[], mediaFileUrlBase?: string) {
  const markers: MapMarker[] = [];
  mediaFiles.forEach((mediaFile) => {
    const location = mediaFile.getLocation();
    if (!location) {
      return;
    }

    const marker: MapMarker = {
      location,
    };

    if (mediaFileUrlBase) {
      switch (mediaFile.fileType) {
        case MediaFileType.Picture:
          const linkUrl = `#${mediaFileUrlBase}/${mediaFile.hashValue}`;

          marker.popupData = {
            name: mediaFile.getName(),
            imagePreviewUrl: `file/picture/${encodeURIComponent(
              mediaFile.hashValue
            )}`,
            linkUrl,
            pictureRawSize: mediaFile.rawSize,
          };
          break;
        default:
        // do nothing
      }
    }
    markers.push(marker);
  });

  return markers;
}

type Props = {
  mediaFileUrlBase?: string;
  mediaFiles: MediaFile[];
};

const styles = {
  thumbnail: {
    margin: "0 10px 10px 0",
  },
  mapContainer: {
    margin: "30px 20px",
  },
};

export default function GeographicMap(props: Props) {
  const { mediaFiles, mediaFileUrlBase } = props;

  const markers = getMarkers(mediaFiles, mediaFileUrlBase);

  const {
    data: tracks,
    isLoading,
    error,
  } = useTrackMapData(
    mediaFiles
      .filter((file) => file.fileType === MediaFileType.FitTrack)
      .map((file) => file as FitTrack)
  );

  if (error) {
    return <div className="alert alert-danger">error loading track data</div>;
  }

  if (isLoading) {
    return <div className="alert alert-info">Loading...</div>;
  }

  if (markers.length === 0 && tracks.length === 0) {
    return null;
  }

  return (
    <div style={styles.mapContainer}>
      <MapComponent
        size={{
          width: "100%",
          height: "400px", // TODO variable sized height
        }}
        markers={markers}
        tracks={tracks.map((track) => ({
          ...track,
          openTrackUrl: mediaFileUrlBase,
        }))}
        extraLatLongMapPadding={0.001}
        zoomControl={true}
      />
    </div>
  );
}
