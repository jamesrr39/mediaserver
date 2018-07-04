import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  pictureModalUrlbase?: string; // example: /gallery/picture
  onClickThumbnail?: (pictureMetadata: PictureMetadata) => void;
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
};

class Gallery extends React.Component<GalleryProps> {
  componentDidMount() {
    this.props.scrollObservable.triggerEvent();
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent();
  }

  render() {
    const pictures = this.props.picturesMetadatas.map((pictureMetadata, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        pictureMetadata,
      };

      const linkUrl = `${this.props.pictureModalUrlbase}/${pictureMetadata.hashValue}`;

      let innerHtml = <Thumbnail {...thumbnailProps} />;
      if (this.props.pictureModalUrlbase) {
        innerHtml = (
          <Link to={linkUrl}>
            {innerHtml}
          </Link>
        );
      }

      if (this.props.onClickThumbnail) {
        // FIXME any
        // tslint:disable-next-line
        const onClickThumbnail = (event: any) => {
          event.preventDefault();
          if (this.props.onClickThumbnail) {
            this.props.onClickThumbnail(pictureMetadata);
          }
        };

        innerHtml = (
          <a href="#" onClick={onClickThumbnail}>{innerHtml}</a>
        );
      }

      return (
        <div key={index} style={styles.thumbnail}>
          {innerHtml}
        </div>);
    });

    return (
      <div style={styles.gallery}>
        {pictures}
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { scrollObservable } = state.picturesMetadatas;

  return {
    scrollObservable,
  };
}

export default connect(mapStateToProps)(Gallery);
