import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import MapComponent, { MapMarker, TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import { MediaFileType } from "../../domain/MediaFileType";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

function getMarkers(mediaFiles: MediaFile[], mediaFileUrlBase?: string) {
  const markers: MapMarker[] = [];
  mediaFiles.forEach((metadata) => {
    const location = metadata.getLocation();
    if (!location) {
      return;
    }

    const markerData: MapMarker = {
      location,
    };

    if (mediaFileUrlBase) {
      switch (metadata.fileType) {
        case MediaFileType.Picture:
          const linkUrl = `#${mediaFileUrlBase}/${metadata.hashValue}`;

          markerData.popupData = {
            name: metadata.getName(),
            imagePreviewUrl: `file/picture/${encodeURIComponent(
              metadata.hashValue
            )}`,
            linkUrl,
            pictureRawSize: metadata.rawSize,
          };
          break;
        default:
        // do nothing
      }
    }
    markers.push(markerData);
  });

  return markers;
}

type Props = {
  tracks: TrackMapData[];
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

export function InnerMap(props: Props) {
  const { mediaFiles, tracks, mediaFileUrlBase } = props;

  const markers = getMarkers(mediaFiles, mediaFileUrlBase);

  if (markers.length === 0 && tracks.length === 0) {
    return null;
  }

  const mapProps = {
    size: {
      width: "100%",
      height: "600px",
    },
    markers,
    tracks,
    extraLatLongMapPadding: 0.001,
    zoomControl: true,
  };

  return (
    <div style={styles.mapContainer}>
      <MapComponent {...mapProps} />
    </div>
  );
}
