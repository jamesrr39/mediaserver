import * as React from 'react';
import { PictureMetadata, getTimeTaken } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import NotificationBarComponent from './NotificationBarComponent';

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

class Gallery extends React.Component<GalleryProps> {
  componentDidMount() {
      this.props.scrollObservable.triggerEvent();
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent();
  }

  render() {
    this.props.picturesMetadatas.sort((a, b) => {
      const aTaken = getTimeTaken(a);
      const bTaken = getTimeTaken(b);

      if (aTaken === bTaken) {
        return 0;
      }

      if (aTaken === null) {
        return -1;
      }

      if (bTaken === null) {
        return 1;
      }

      return (aTaken.getTime() > bTaken.getTime()) ? 1 : -1;
    });

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
