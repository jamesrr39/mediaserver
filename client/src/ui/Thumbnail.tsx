import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { SERVER_BASE_URL } from '../configs';

const generateThumbnailStyle = (pictureMetadata: PictureMetadata) => {
  const ratio = 200 / pictureMetadata.rawSize.height;
  const width = pictureMetadata.rawSize.width * ratio;

  return {
    maxHeight: '200px',
    backgroundColor: '#bbb',
    maxWidth: width,
  };
};

export interface ThumbnailProps {
  pictureMetadata: PictureMetadata;
  scrollObservable: Observable;
}

type ThumbnailState = {
  isImageQueuedOrLoaded: boolean;
};

export class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
  state = {
    isImageQueuedOrLoaded: false,
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

    let img;
    if (this.state.isImageQueuedOrLoaded) {
      const onload = () => {
        if (this.element) {
          this.element.style.backgroundColor = 'transparent';
        }
      };
      img = <img src={imgSrc} onLoad={onload} />;
    } else {
      img = '';
    }

    const thumbnailStyle = generateThumbnailStyle(this.props.pictureMetadata);

    return (
      <div style={thumbnailStyle} ref={el => this.element = el}>
        {img}
      </div>
    );
  }

  private _scrollListener() {
    if (!this.isInViewport()) {
      return;
    }

    this.setState({
      isImageQueuedOrLoaded: true,
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
