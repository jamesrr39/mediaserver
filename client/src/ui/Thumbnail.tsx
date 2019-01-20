import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { isNarrowScreen } from '../util/screen_size';
import { THUMBNAIL_HEIGHTS } from '../generated/thumbnail_sizes';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileType } from '../domain/MediaFileType';
import { PictureThumbnail } from './thumbnails/PictureThumbnail';
import { VideoThumbnail } from './thumbnails/VideoFileThumbnail';
import { TrackThumbnail } from './thumbnails/TrackThumbnail';

const WIDE_SCREEN_THUMBNAIL_HEIGHT = 200;
const NARROW_SCREEN_THUMBNAIL_HEIGHT = 100;
const NARROW_SCREEN_THUMBNAIL_WIDTH = 100;

function getImageHeightToRequest(narrowScreen: boolean, pictureMetadata: PictureMetadata) {
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
      return (ratio * thumbnailHeightSetting) > NARROW_SCREEN_THUMBNAIL_WIDTH;
    });
    if (thumbnailHeight) {
      return thumbnailHeight;
    }
    return height;
  }
  return NARROW_SCREEN_THUMBNAIL_HEIGHT;
}

function getSizeForThumbnail(mediaFile: MediaFile) {
  const narrowScreen = isNarrowScreen();

  switch (mediaFile.fileType) {
    case MediaFileType.Picture: {
      const heightToRequest = getImageHeightToRequest(narrowScreen, mediaFile);
      const ratio = heightToRequest / mediaFile.rawSize.height;
      const width = narrowScreen ? NARROW_SCREEN_THUMBNAIL_WIDTH : (mediaFile.rawSize.width * ratio);
      const height = narrowScreen ? NARROW_SCREEN_THUMBNAIL_HEIGHT : WIDE_SCREEN_THUMBNAIL_HEIGHT;
      return {height, width};
    }
    default: {
      const height = narrowScreen ? NARROW_SCREEN_THUMBNAIL_HEIGHT : WIDE_SCREEN_THUMBNAIL_HEIGHT;
      const width = narrowScreen ? NARROW_SCREEN_THUMBNAIL_WIDTH : (height * 16 / 9);
      return {height, width};
    }
  }
}

const generateThumbnailStyle = (mediaFile: MediaFile, isLoaded: boolean) => {
  const { height, width } = getSizeForThumbnail(mediaFile);

  if (isLoaded) {
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundImage: '',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };
  }

  return {
    height: `${height}px`,
    backgroundColor: '#bbb',
    width: `${width}px`,
  };
};

export interface ThumbnailProps {
  mediaFile: MediaFile;
  scrollObservable: Observable<{}>;
}

type ThumbnailState = {
  isImageQueued: boolean;
};

export class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
  state = {
    isImageQueued: false,
  };

  private element: null|HTMLElement = null;

  private scrollListener: () => void;

  constructor(props: ThumbnailProps) {
    super(props);

    this.scrollListener = this._scrollListener.bind(this);
  }

  componentWillMount() {
    this.props.scrollObservable.addListener(this.scrollListener);
  }

  componentWillUnmount() {
    this.props.scrollObservable.removeListener(this.scrollListener);
  }

  render() {
    const { mediaFile } = this.props;
    const thumbnailStyle = generateThumbnailStyle(
      mediaFile, this.state.isImageQueued);

    if (!(this.state.isImageQueued)) {
      return (
        <div style={thumbnailStyle} ref={el => this.element = el} />
      );
    }

    const { width, height } = getSizeForThumbnail(mediaFile);

    const size = {
      height,
      width,
    };

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

  private _scrollListener() {
    if (!this.isInViewport()) {
      return;
    }

    this.setState({
      isImageQueued: true,
    });
  }

  private isInViewport() {
    if (!this.element) {
      return false;
    }

    const top = this.element.getBoundingClientRect().top;
    const offset = this.element.offsetHeight;
    const isInViewport = (top + offset) >= 0 && (top - offset) <= window.innerHeight;
    return isInViewport;
  }
}
