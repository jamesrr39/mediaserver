import * as React from 'react';
import { createCompareTimeTakenFunc, PictureMetadata } from '../domain/PictureMetadata';

import { Observable, DebouncedObservable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MapComponent, { MapMarker, TrackMapData } from './MapComponent';
import { SERVER_BASE_URL } from '../configs';
import { MediaFile, MediaFileType } from '../domain/MediaFile';
import { FitTrack } from '../domain/FitTrack';
import { isNarrowScreen } from '../util/screen_size';
import { fetchRecordsForTrack } from '../actions/trackActions';
import { FilterComponent } from './gallery/FilterComponent';
import { GalleryFilter } from '../domain/Filter';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<{}>;
  pictureModalUrlbase?: string; // example: /gallery/picture
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
};

const gallerySortingFunc = createCompareTimeTakenFunc(true);

export type StatelessGalleryProps = {
  showMap: boolean;
  tracks: TrackMapData[];
} & GalleryProps;

type GalleryState = {
  showMap: boolean;
  tracks: TrackMapData[];
  galleryFilter: GalleryFilter;
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

class StatelessGallery extends React.Component<StatelessGalleryProps> {
  componentDidMount() {
    this.props.scrollObservable.triggerEvent({});
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent({});
  }

  render() {
    // tslint:disable-next-line
    console.log('rendering stateless gallery')

    const pictureContainerStyle = isNarrowScreen()
      ? styles.picturesContainer
      : {...styles.picturesContainer, ...styles.wideScreenContainer};

    return (
      <React.Fragment>
        {this.props.showMap && this.renderMap()}
        <div style={pictureContainerStyle}>
          {this.renderThumbnails()}
        </div>
      </React.Fragment>
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
    const { showMap, mediaFiles, tracks } = this.props;

    if (!showMap) {
      return (
        <div style={styles.mapContainer}>
          <a href="#" onClick={this.showMap}>Show Map</a>
        </div>
      );
    }

    const markers = this.getMarkers(mediaFiles);

    if (markers.length === 0) {
      return '';
    }

    const mapProps = {
      size: {
        width: '100%',
        height: '600px',
      },
      markers,
      tracks: tracks,
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
    const {
      mediaFiles,
      scrollObservable,
      pictureModalUrlbase,
      onClickThumbnail
    } = this.props;

    return mediaFiles.map((mediaFile, index) => {
      const thumbnailProps = {
        scrollObservable,
        mediaFile,
      };

      const linkUrl = `${pictureModalUrlbase}/${mediaFile.hashValue}`;

      let innerHtml = <Thumbnail {...thumbnailProps} />;
      if (pictureModalUrlbase) {
        innerHtml = (
          <Link to={linkUrl}>
            {innerHtml}
          </Link>
        );
      }

      if (onClickThumbnail) {
        const onClickThumbnailCb = (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          if (onClickThumbnail) {
            onClickThumbnail(mediaFile);
          }
        };

        innerHtml = (
          <a href="#" onClick={onClickThumbnailCb}>{innerHtml}</a>
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

type InnerGalleryProps = {
  onFilterChangeObservable: Observable<GalleryFilter>;
} & GalleryProps;

class InnerGallery extends React.Component<InnerGalleryProps, GalleryState> {
  state = {
    showMap: true,
    tracks: [],
    galleryFilter: new GalleryFilter(),
  };

  componentDidMount() {
    const { mediaFiles, onFilterChangeObservable } = this.props;

    mediaFiles.forEach(mediaFile => {
      if (mediaFile.fileType !== MediaFileType.FitTrack) {
        return;
      }

      const trackSummary = mediaFile as FitTrack;
      this.fetchRecords(trackSummary);
    });

    onFilterChangeObservable.addListener(this.filterChangeCallback);
  }

  componentDidUnmount() {
    this.props.onFilterChangeObservable.removeListener(this.filterChangeCallback);
  }

  render() {
    // tslint:disable-next-line
    console.log('rendering outer gallery')

    const { showMap, tracks, galleryFilter } = this.state;
    const mediaFiles = this.props.mediaFiles.filter(galleryFilter.filter);

    mediaFiles.sort(gallerySortingFunc);

    const statelessGalleryProps = {
      ...this.props,
      mediaFiles,
      tracks,
      showMap,
    };

    return (
      <StatelessGallery {...statelessGalleryProps} />
    );
  }

  private fetchRecords = async (trackSummary: FitTrack) => {
    const records = await fetchRecordsForTrack(trackSummary);

    const trackData = {
      activityBounds: trackSummary.activityBounds,
      points: records.map(record => ({
        lat: record.posLat,
        long: record.posLong,
      }))
    };

    // tslint:disable-next-line
    console.log('fetched track data')
    this.setState(state => ({
      ...state,
      tracks: state.tracks.concat([trackData]),
    }));
  }

  private filterChangeCallback = (galleryFilter: GalleryFilter) => {
    this.setState(state => ({
      ...state,
      galleryFilter,
    }));
  }
}

class Gallery extends React.Component<GalleryProps> {

  private onFilterChangeObservable = new DebouncedObservable<GalleryFilter>(50);

  render() {
    const filterComponentProps = {
      initialFilter: new GalleryFilter(),
      onFilterChange: (filter: GalleryFilter) => {
        // tslint:disable-next-line
        console.log('filter change')
        this.onFilterChangeObservable.triggerEvent(filter);

        // this.setState(state => ({...state, filter}));
      },
    };

    const innerGalleryProps = {
      ...this.props,
      onFilterChangeObservable: this.onFilterChangeObservable,
    };

    return (
      <div>
        <FilterComponent {...filterComponentProps} />
        <InnerGallery {...innerGalleryProps} />
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
