import * as React from "react";
import { PictureMetadata } from "../domain/PictureMetadata";

import { Observable } from "ts-util/src/Observable";
import { THUMBNAIL_HEIGHTS } from "../generated/thumbnail_sizes";
import { MediaFile } from "../domain/MediaFile";
import { MediaFileType } from "../domain/MediaFileType";
import { PictureThumbnail } from "./thumbnails/PictureThumbnail";
import { VideoThumbnail } from "./thumbnails/VideoFileThumbnail";
import TrackThumbnail from "./thumbnails/TrackThumbnail";
import { Size } from "../domain/Size";
import { connect } from "react-redux";
import { State } from "src/reducers/rootReducer";
import {
  GalleryContainerContext,
  ScrollResizeContext,
} from "src/context/WindowContext";
import { useIsThumbnailVisible } from "src/hooks/windowHooks";

const WIDE_SCREEN_THUMBNAIL_HEIGHT = 200;
const NARROW_SCREEN_THUMBNAIL_HEIGHT = 100;
const NARROW_SCREEN_THUMBNAIL_WIDTH = 100;

function getImageHeightToRequest(
  narrowScreen: boolean,
  pictureMetadata: PictureMetadata
) {
  const { height, width } = pictureMetadata.rawSize;

  if (!narrowScreen) {
    if (height > WIDE_SCREEN_THUMBNAIL_HEIGHT) {
      return WIDE_SCREEN_THUMBNAIL_HEIGHT;
    }
    return height;
  }

  if (height > width) {
    const ratio = width / height;
    const thumbnailHeight = THUMBNAIL_HEIGHTS.find((thumbnailHeightSetting) => {
      return ratio * thumbnailHeightSetting > NARROW_SCREEN_THUMBNAIL_WIDTH;
    });
    if (thumbnailHeight) {
      return thumbnailHeight;
    }
    return height;
  }
  return NARROW_SCREEN_THUMBNAIL_HEIGHT;
}

export function getSizeForThumbnail(mediaFile: MediaFile) {
  const narrowScreen = false;

  switch (mediaFile.fileType) {
    case MediaFileType.Picture: {
      const heightToRequest = getImageHeightToRequest(narrowScreen, mediaFile);
      const ratio = heightToRequest / mediaFile.rawSize.height;
      const width = narrowScreen
        ? NARROW_SCREEN_THUMBNAIL_WIDTH
        : mediaFile.rawSize.width * ratio;
      const height = narrowScreen
        ? NARROW_SCREEN_THUMBNAIL_HEIGHT
        : WIDE_SCREEN_THUMBNAIL_HEIGHT;
      return { height, width };
    }
    case MediaFileType.Video:
      const height = narrowScreen
        ? NARROW_SCREEN_THUMBNAIL_HEIGHT
        : WIDE_SCREEN_THUMBNAIL_HEIGHT;
      const width = narrowScreen
        ? NARROW_SCREEN_THUMBNAIL_WIDTH
        : (height * 16) / 9;
      return { height, width };
    default:
      return {
        width: WIDE_SCREEN_THUMBNAIL_HEIGHT,
        height: WIDE_SCREEN_THUMBNAIL_HEIGHT,
      };
  }
}

const generateThumbnailStyle = (mediaFile: MediaFile, isLoaded: boolean) => {
  const { height, width } = getSizeForThumbnail(mediaFile);

  if (isLoaded) {
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundImage: "",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    };
  }

  return {
    height: `${height}px`,
    backgroundColor: "#bbb",
    width: `${width}px`,
  };
};

export type ThumbnailProps = {
  mediaFile: MediaFile;
  size: Size;
};

function Thumbnail(props: ThumbnailProps) {
  const { mediaFile, size } = props;

  const [isQueued, setIsQueued] = React.useState(false);

  const element = React.useRef();

  const scrollResizeContext = React.useContext(ScrollResizeContext);
  const galleryContainer = React.useContext(GalleryContainerContext);

  const isThumbnailVisible = useIsThumbnailVisible();

  const onScroll = () => {
    if (!element) {
      return;
    }

    if (!isThumbnailVisible(galleryContainer, element.current)) {
      return;
    }

    setIsQueued(true);
  };

  React.useEffect(() => {
    scrollResizeContext.addListener(onScroll);

    scrollResizeContext.triggerEvent();

    // function returned is called on unmount
    return () => scrollResizeContext.removeListener(onScroll);
  }, []);

  if (!isQueued) {
    const thumbnailStyle = generateThumbnailStyle(mediaFile, isQueued);

    return <div style={thumbnailStyle} ref={element} />;
  }

  switch (mediaFile.fileType) {
    case MediaFileType.Picture: {
      const props = {
        pictureMetadata: mediaFile,
        size,
      };
      return <PictureThumbnail {...props} />;
    }
    case MediaFileType.Video: {
      const props = {
        videoMetadata: mediaFile,
        size,
      };
      return <VideoThumbnail {...props} />;
    }
    case MediaFileType.FitTrack: {
      const props = {
        trackSummary: mediaFile,
        size,
      };
      return <TrackThumbnail {...props} />;
    }
    default:
      return <div>(Unknown Item)</div>;
  }
}

export default Thumbnail;
