import * as React from 'react';
import { PictureMetadata, createCompareTimeTakenFunc } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MapComponent, { MapMarker } from './MapComponent';
import { SERVER_BASE_URL } from '../configs';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  pictureModalUrlbase?: string; // example: /gallery/picture
  onClickThumbnail?: (pictureMetadata: PictureMetadata) => void;
  showMap?: boolean;
}

const styles = {
  container: {
    margin: '0 20px',
  },
  picturesContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  thumbnail: {
      margin: '0 10px 10px 0',
  },
  mapContainer: {
    margin: '30px 0',
  },
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

    return (
      <div style={styles.container}>
        {this.props.showMap && this.renderMap()}
        <div style={styles.picturesContainer}>
          {this.renderThumbnails()}
        </div>
      </div>
    );
  }

  private renderMap = () => {
    const markers = this.getMarkers(this.props.picturesMetadatas);

    if (markers.length === 0) {
      return '';
    }

    const mapProps = {
      size: {
        width: '100%',
        height: '600px',
      },
      markers,
      extraLatLongMapPadding: 0.001,
    };

    return (
      <div style={styles.mapContainer}>
        <MapComponent {...mapProps} />
      </div>
    );
  }

  private renderThumbnails = () => {
    return this.props.picturesMetadatas.map((pictureMetadata, index) => {
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
        const onClickThumbnail = (event: React.MouseEvent<HTMLAnchorElement>) => {
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
        </div>
      );
    });
  }

  private getMarkers = (picturesMetadatas: PictureMetadata[]) => {
    const markers: MapMarker[] = [];
    picturesMetadatas.forEach((metadata) => {
      const location = metadata.getLocation();
      if (!location) {
        return;
      }

      const markerData: MapMarker = {
        location,
      };

      if (this.props.pictureModalUrlbase) {
        const linkUrl = `#${this.props.pictureModalUrlbase}/${metadata.hashValue}`;

        markerData.popupData = {
          name: metadata.getName(),
          imagePreviewUrl: `${SERVER_BASE_URL}/picture/${metadata.hashValue}`,
          linkUrl,
          pictureRawSize: metadata.rawSize,
        };
      }
      markers.push(markerData);
    });

    return markers;
  }
}

function mapStateToProps(state: State) {
  const { scrollObservable } = state.picturesMetadatas;

  return {
    scrollObservable,
  };
}

export default connect(mapStateToProps)(Gallery);
