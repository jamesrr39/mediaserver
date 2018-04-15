import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { Link } from 'react-router-dom';
import { State } from '../reducers';
import { connect } from 'react-redux';

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

class Gallery extends React.Component<GalleryProps> {
  componentDidMount() {
    this.props.scrollObservable.triggerEvent();
  }

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

function mapStateToProps(state: State) {
  const { picturesMetadatas, scrollObservable } = state.picturesMetadatas;

  return {
    picturesMetadatas,
    scrollObservable,
  };
}

export default connect(mapStateToProps)(Gallery);
