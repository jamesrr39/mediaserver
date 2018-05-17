import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import GalleryTopBar from './GalleryTopBar';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
}

const styles = {
  gallery: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  thumbnail: {
      margin: '0 10px 10px 0',
  }
};

class Gallery extends React.Component<GalleryProps> {
  componentWillUpdate() {
    this.props.scrollObservable.triggerEvent();
  }

  render() {
    const pictures = this.props.picturesMetadatas.map((pictureMetadata, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        pictureMetadata,
      };

      const linkUrl = `#/picture/${pictureMetadata.hashValue}`;

      return (
        <div key={index} style={styles.thumbnail}>
          <a href={linkUrl}>
            <Thumbnail {...thumbnailProps} />
          </a>
        </div>);
    });

    return (
      <div>
        <GalleryTopBar />
        <div style={styles.gallery}>
          {pictures}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas, scrollObservable } = state.picturesMetadatas;

  return {
    picturesMetadatas,
    scrollObservable,
  };
}

export default connect(mapStateToProps)(Gallery);