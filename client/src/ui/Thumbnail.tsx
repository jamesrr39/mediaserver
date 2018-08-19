import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { SERVER_BASE_URL } from '../configs';

const generateThumbnailStyle = (pictureMetadata: PictureMetadata, isLoaded: boolean) => {
  const ratio = 200 / pictureMetadata.rawSize.height;
  const width = pictureMetadata.rawSize.width * ratio;

  if (isLoaded) {
    return {
      width: `${width}px`,
      height: '200px',
      backgroundImage: '',
      backgroundRepeat: 'no-repeat',
    };
  }

  return {
    height: '200px',
    backgroundColor: '#bbb',
    width,
  };
};

export interface ThumbnailProps {
  pictureMetadata: PictureMetadata;
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
    const imgSrc = `${SERVER_BASE_URL}/picture/${this.props.pictureMetadata.hashValue}?h=200`;

    const thumbnailStyle = generateThumbnailStyle(this.props.pictureMetadata, this.state.isImageLoaded);

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
