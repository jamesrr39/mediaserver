import * as React from 'react';
import { PictureMetadata, createCompareTimeTakenFunc } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import NotificationBarComponent from './NotificationBarComponent';
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
  } as React.CSSProperties,
  thumbnail: {
      margin: '0 10px 10px 0',
  },
  notificationsComponent: {
    position: 'fixed',
    left: '30px',
    bottom: '30px',
  } as React.CSSProperties,
};

const gallerySortingFunc = createCompareTimeTakenFunc(true);

class Gallery extends React.Component<GalleryProps> {
  componentDidMount() {
    this.props.scrollObservable.triggerEvent();
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent();
  }

  render() {
    this.props.picturesMetadatas.sort(gallerySortingFunc);

    const pictures = this.props.picturesMetadatas.map((pictureMetadata, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        pictureMetadata,
      };

      const linkUrl = `/gallery/picture/${pictureMetadata.hashValue}`;

      return (
        <div key={index} style={styles.thumbnail}>
          <Link to={linkUrl}>
            <Thumbnail {...thumbnailProps} />
          </Link>
        </div>);
    });

    return (
      <div>
        <div style={styles.gallery}>
          {pictures}
        </div>
        <div style={styles.notificationsComponent}>
          <NotificationBarComponent />
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
