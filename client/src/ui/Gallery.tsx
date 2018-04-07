import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { Link } from 'react-router-dom';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
}

const styles = {
  gallery: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    // flexDirection: 'row',
  } as React.CSSProperties,
  thumbnail: {
      margin: '0 10px 10px 0',
  }
};

export class Gallery extends React.Component<GalleryProps> {
  render() {
    const pictures = this.props.picturesMetadatas.map((pictureMetadata, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        pictureMetadata,
      };

      const linkUrl = `/picture/${pictureMetadata.hashValue}`;

      return (
        <div key={index} style={styles.thumbnail}>
          <Link to={linkUrl}>
            <Thumbnail {...thumbnailProps} />
          </Link>
        </div>);
    });

    return (<div style={styles.gallery}>{pictures}</div>);
  }
}
