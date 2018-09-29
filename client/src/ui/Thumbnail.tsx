import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { SERVER_BASE_URL } from '../configs';
import { isNarrowScreen } from '../util/screen_size';
import { THUMBNAIL_HEIGHTS } from '../generated/thumbnail_sizes';
import { MediaFile, MediaFileType } from '../domain/MediaFile';
import { VideoMetadata } from '../domain/VideoMetadata';

const WIDE_SCREEN_THUMBNAIL_HEIGHT = 200;
const NARROW_SCREEN_THUMBNAIL_HEIGHT = 100;
const NARROW_SCREEN_THUMBNAIL_WIDTH = 100;

const styles = {
  video: {
    pointerEvents: 'none',
  },
};

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

const generateThumbnailStyle = (pictureMetadata: PictureMetadata, isLoaded: boolean, narrowScreen: boolean) => {
  const heightToRequest = getImageHeightToRequest(narrowScreen, pictureMetadata);
  const ratio = heightToRequest / pictureMetadata.rawSize.height;
  const width = narrowScreen ? NARROW_SCREEN_THUMBNAIL_WIDTH : (pictureMetadata.rawSize.width * ratio);
  const height = narrowScreen ? NARROW_SCREEN_THUMBNAIL_HEIGHT : WIDE_SCREEN_THUMBNAIL_HEIGHT;

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
    width,
  };
};

export interface ThumbnailProps {
  pictureMetadata: MediaFile;
  scrollObservable: Observable;
}

type ThumbnailState = {
  isImageQueued: boolean;
  isImageLoaded: boolean;
};

export class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
  state = {
    isImageQueued: false,
    isImageLoaded: false,
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
    const { pictureMetadata } = this.props;

    switch (pictureMetadata.fileType) {
      case MediaFileType.Picture:
        return this.generateImageThumbnailHtml(pictureMetadata as PictureMetadata); // TODO: remove cast
      case MediaFileType.Video:
        return this.generateVideoThumbnailHtml(pictureMetadata as VideoMetadata);
      default:
        return <div>{pictureMetadata.getName()}</div>;
    }

  }

  private generateVideoThumbnailHtml = (mediaFile: VideoMetadata) => {
    const videoUrl = `${SERVER_BASE_URL}/video/${mediaFile.hashValue}`;

    const narrowScreen = isNarrowScreen();
    const thumbnailHeight = narrowScreen ? NARROW_SCREEN_THUMBNAIL_HEIGHT : WIDE_SCREEN_THUMBNAIL_HEIGHT;
    const thumbnailWidth = narrowScreen ? NARROW_SCREEN_THUMBNAIL_WIDTH : undefined;

    return (
      <div>
        <video height={thumbnailHeight} width={thumbnailWidth} controls={true} style={styles.video}>
          <source src={videoUrl} />
          Your browser does not support HTML5 video.
        </video>
      </div>
    );
  }

  private generateImageThumbnailHtml = (pictureMetadata: PictureMetadata) => {
    const narrowScreen = isNarrowScreen();
    const thumbnailHeight = getImageHeightToRequest(narrowScreen, pictureMetadata);
    const imgSrc = `${SERVER_BASE_URL}/picture/${pictureMetadata.hashValue}?h=${thumbnailHeight}`;

    const thumbnailStyle = generateThumbnailStyle(
      pictureMetadata, this.state.isImageLoaded, narrowScreen);

    if (this.state.isImageLoaded) {
      thumbnailStyle.backgroundImage = `url(${imgSrc})`;
    } else if (this.state.isImageQueued) {
      const image = new Image();
      image.onload = () => {
        this.setState(state => ({
          ...state,
          isImageQueued: false,
          isImageLoaded: true,
        }));
      };
      image.src = imgSrc;
    }

    return (
      <div style={thumbnailStyle} ref={el => this.element = el} />
    );
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
