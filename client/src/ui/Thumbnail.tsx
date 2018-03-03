import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';

const thumbnailStyle = {
  height: '200px',
  minWidth: '200px',
  backgroundColor: '#bbb',
};

export interface ThumbnailProps {
  pictureMetadata: PictureMetadata;
  scrollObservable: Observable;
}

type ThumbnailState = {
  isImageQueuedOrLoaded: boolean;
};

export class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
  private element: null|HTMLElement = null;

  private scrollListener: () => void;

  constructor(props: ThumbnailProps) {
    super(props);

    this.state = {
      isImageQueuedOrLoaded: false,
    };

    this.scrollListener = this._scrollListener.bind(this);

    // this.scrollListener = () => {
    //   // tslint:disable-next-line
    //   // console.log("triggered scrollListener")
    //   if (!this.isInViewport()) {
    //     // tslint:disable-next-line
    //     // console.log("not in viewport", this.props.pictureMetadata.hashValue)
    //     return;
    //   }
    //   // tslint:disable-next-line
    //   console.log("removing listener as it's in viewport", this.props.pictureMetadata.hashValue)
    // FIXME sometimes this is duplicated
    //   this.props.scrollObservable.removeListener(this.scrollListener);
    //   this.setState({
    //     isImageQueuedOrLoaded: true,
    //   });
    // };
  }

  componentWillMount() {
    this.props.scrollObservable.addListener(this.scrollListener);
  }

  componentWillUnmount() {
    // tslint:disable-next-line
    console.log("removing listener for ", this.props.pictureMetadata.hashValue)
    this.props.scrollObservable.removeListener(this.scrollListener);
  }

  render() {
    // tslint:disable-next-line
    // console.log("adding listener for ", this.props.pictureMetadata.hashValue, this.scrollListener)

    // tslint:disable-next-line

    const imgSrc = '//localhost:9050/picture/' + this.props.pictureMetadata.hashValue + '?h=200';

    if (!this.state.isImageQueuedOrLoaded) {
      // tslint:disable-next-line
      // console.log("not queued or loaded:", this.props.pictureMetadata.hashValue)
    }

    let img;
    if (this.state.isImageQueuedOrLoaded) {
      img = <img src={imgSrc} />;
    } else {
      img = '';
    }
    // const img = <img src={imgSrc} />;

    return (
      <div style={thumbnailStyle} ref={el => this.element = el}>
        {img}
      </div>
    );
  }

  private _scrollListener() {
    // tslint:disable-next-line
    console.log("assessing scrollListener for image", this.props.pictureMetadata.hashValue);
    if (!this.isInViewport()) {
      // tslint:disable-next-line
      // console.log("not in viewport", this.props.pictureMetadata.hashValue)
      return;
    }
    // tslint:disable-next-line
    // console.log("removing listener as it's in viewport", this.props.pictureMetadata.hashValue) // FIXME sometimes this is duplicated
    // this.props.scrollObservable.removeListener(this.scrollListener); FIXME can remove other peoples callbacks
    this.setState({
      isImageQueuedOrLoaded: true,
    });
  }

  private isInViewport(offset: number = 0) {
    if (!this.element) {
      return false;
    }

    const top = this.element.getBoundingClientRect().top;
    const isInViewport = (top + offset) >= 0 && (top - offset) <= window.innerHeight;
    // tslint:disable-next-line
    console.log(`is ${this.props.pictureMetadata.hashValue} in viewport: ${isInViewport}`);
    return isInViewport;
  }
}
