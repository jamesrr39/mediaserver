import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
}

const galleryStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  // flexDirection: 'row',
} as React.CSSProperties;

const thumbnailContainerStyle = {
  margin: '0 10px 10px 0',
};

export class Gallery extends React.Component<GalleryProps> {
  render() {
    const pictures = this.props.picturesMetadatas.map((pictureMetadata, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        pictureMetadata,
      };

      return (
        <div key={index} style={thumbnailContainerStyle}>
          <Thumbnail {...thumbnailProps} />
        </div>);
    });

    return (<div style={galleryStyle}>{pictures}</div>);
  }
}
