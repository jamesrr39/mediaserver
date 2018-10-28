import * as React from 'react';
import { createCompareTimeTakenFunc, PictureMetadata } from '../domain/PictureMetadata';

import { Observable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MapComponent, { MapMarker } from './MapComponent';
import { SERVER_BASE_URL } from '../configs';
import { MediaFile } from '../domain/MediaFile';
import { isNarrowScreen } from '../util/screen_size';

export interface GalleryProps {
  mediaFiles: MediaFile[];
  scrollObservable: Observable;
  pictureModalUrlbase?: string; // example: /gallery/picture
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
}

type GalleryState = {
  showMap: boolean;
};

const styles = {
  wideScreenContainer: {
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
    margin: '30px 20px',
  },
};

const gallerySortingFunc = createCompareTimeTakenFunc(true);

class Gallery extends React.Component<GalleryProps, GalleryState> {
  state = {
    showMap: true,
  };

  componentDidMount() {
    this.props.scrollObservable.triggerEvent();
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent();
  }

  render() {
    this.props.mediaFiles.sort(gallerySortingFunc);
    const pictureContainerStyle = isNarrowScreen()
      ? styles.picturesContainer
      : {...styles.picturesContainer, ...styles.wideScreenContainer};

    return (
      <div>
        {this.props.showMap && this.renderMap()}
        <div style={pictureContainerStyle}>
          {this.renderThumbnails()}
        </div>
      </div>
    );
  }

  private showMap = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    this.setState(state => ({
      ...state,
      showMap: true,
    }));
  }

  private hideMap = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    this.setState(state => ({
      ...state,
      showMap: false,
    }));
  }

  private renderMap = () => {
    if (!this.state.showMap) {
      return (
        <div style={styles.mapContainer}>
          <a href="#" onClick={this.showMap}>Show Map</a>
        </div>
      );
    }

    const markers = this.getMarkers(this.props.mediaFiles);

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
        <a href="#" onClick={this.hideMap}>Hide Map</a>
        <MapComponent {...mapProps} />
      </div>
    );
  }

  private renderThumbnails = () => {
    return this.props.mediaFiles.map((mediaFile, index) => {
      const thumbnailProps = {
        scrollObservable: this.props.scrollObservable,
        mediaFile,
      };

      const linkUrl = `${this.props.pictureModalUrlbase}/${mediaFile.hashValue}`;

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
            this.props.onClickThumbnail(mediaFile);
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

  private getMarkers = (picturesMetadatas: MediaFile[]) => {
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
          pictureRawSize: (metadata as PictureMetadata).rawSize, // TODO remove cast
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
