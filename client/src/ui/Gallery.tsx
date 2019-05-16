import * as React from 'react';
import { createCompareTimeTakenFunc } from '../domain/PictureMetadata';

import { Observable, DebouncedObservable } from '../util/Observable';
import { Thumbnail } from './Thumbnail';
import { State } from '../reducers/fileReducer';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MapComponent, { MapMarker, TrackMapData } from './MapComponent';
import { SERVER_BASE_URL } from '../configs';
import { MediaFile } from '../domain/MediaFile';
import { MediaFileType } from '../domain/MediaFileType';
import { FitTrack, Record } from '../domain/FitTrack';
import { isNarrowScreen } from '../util/screen_size';
import { fetchRecordsForTrack } from '../actions/mediaFileActions';
import { FilterComponent } from './gallery/FilterComponent';
import { GalleryFilter } from '../domain/Filter';
import { joinUrlFragments } from '../util/url';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<{}>;
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  fetchRecordsForTrack: (trackSummary: FitTrack) => Promise<Record[]>;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

const PHOTOS_IN_INCREMENT = 40;

export type InnerGalleryProps = {
  showMap: boolean;
  tracks: TrackMapData[];
  filterJson: string;
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

type InnerGalleryState = {
  lastIndexShown: number,
};

class InnerGallery extends React.Component<InnerGalleryProps, InnerGalleryState> {
  state = {
    lastIndexShown: 0,
  };
  
  componentDidMount() {
    const {scrollObservable} = this.props;

    scrollObservable.triggerEvent({});
    scrollObservable.addListener(this.onScroll);
  }

  componentWillUnmount() {
    this.props.scrollObservable.removeListener(this.onScroll);
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent({});
  }

  render() {
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
      mediaFileUrlBase,
      onClickThumbnail,
      filterJson
    } = this.props;

    return mediaFiles.map((mediaFile, index) => {
      const thumbnailProps = {
        scrollObservable,
        mediaFile,
      };

      const {lastIndexShown} = this.state;
      if (index > (lastIndexShown + PHOTOS_IN_INCREMENT)) {
        return null;
      }
      
      const query = `filterJson=${encodeURIComponent(filterJson)}`;
      const linkUrl = `${mediaFileUrlBase}/${mediaFile.hashValue}?${query}`;

      let innerHtml = <Thumbnail {...thumbnailProps} />;
      if (mediaFileUrlBase) {
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

  private getMarkers = (mediaFiles: MediaFile[]) => {
    const markers: MapMarker[] = [];
    mediaFiles.forEach((metadata) => {
      const location = metadata.getLocation();
      if (!location) {
        return;
      }

      const markerData: MapMarker = {
        location,
      };

      if (this.props.mediaFileUrlBase) {
        switch (metadata.fileType) {
          case MediaFileType.Picture:
            const linkUrl = `#${this.props.mediaFileUrlBase}/${metadata.hashValue}`;

            markerData.popupData = {
              name: metadata.getName(),
              imagePreviewUrl: joinUrlFragments(SERVER_BASE_URL, 'picture', metadata.hashValue),
              linkUrl,
              pictureRawSize: metadata.rawSize,
            };
            break;
          default:
            // do nothing
        }
      }
      markers.push(markerData);
    });

    return markers;
  }

  private onScroll = () => {
    const {lastIndexShown} = this.state;
    if (lastIndexShown >= this.props.mediaFiles.length) {
      // we are already showing everything
      return;
    }

    const scrolledTo = window.scrollY;
    const bodyHeight = document.documentElement.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;

    const distanceFromBottom = bodyHeight - (scrolledTo + viewportHeight);
    if (distanceFromBottom < (viewportHeight)) {
      this.setState((state) => ({
        ...state,
        lastIndexShown: state.lastIndexShown + PHOTOS_IN_INCREMENT,
      }));
    }
  }
}

type GalleryWrapperProps = {
  onFilterChangeObservable: Observable<GalleryFilter>;
} & GalleryProps;

class GalleryWrapper extends React.Component<GalleryWrapperProps, GalleryState> {
  state = {
    showMap: true,
    tracks: [],
    galleryFilter: new GalleryFilter(null),
  };

  componentDidMount() {
    const { mediaFiles, onFilterChangeObservable } = this.props;

    mediaFiles.forEach(mediaFile => {
      if (mediaFile.fileType !== MediaFileType.FitTrack) {
        return;
      }

      this.fetchRecords(mediaFile);
    });

    onFilterChangeObservable.addListener(this.filterChangeCallback);
  }

  componentWillUnmount() {
    this.props.onFilterChangeObservable.removeListener(this.filterChangeCallback);
  }

  render() {
    const { showMap, tracks, galleryFilter } = this.state;
    const mediaFiles = this.props.mediaFiles.filter(galleryFilter.filter);

    mediaFiles.sort(gallerySortingFunc);

    const statelessGalleryProps = {
      ...this.props,
      mediaFiles,
      tracks,
      showMap,
      filterJson: JSON.stringify(galleryFilter.toJsObject()),
    };

    return (
      <InnerGallery {...statelessGalleryProps} />
    );
  }

  private fetchRecords = async (trackSummary: FitTrack) => {
    const records = await this.props.fetchRecordsForTrack(trackSummary);

    const trackData = {
      trackSummary,
      activityBounds: trackSummary.activityBounds,
      points: records.map(record => ({
        lat: record.posLat,
        lon: record.posLong,
      })),
      openTrackUrl: this.props.mediaFileUrlBase,
    };

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

type DateRange = {
  start?: Date,
  end?: Date,
};

function getDateRange(mediaFiles: MediaFile[]): DateRange {
  let start: Date|undefined = undefined;
  let end: Date|undefined = undefined;

  mediaFiles.forEach(mediaFile => {
    const timeTaken = mediaFile.getTimeTaken();
    if (timeTaken === null) {
      return;
    }

    if (!start || timeTaken < start) {
      start = timeTaken;
    }

    if (!end || timeTaken > end) {
      end = timeTaken;
    }
  });

  return { start, end };
}

class Gallery extends React.Component<GalleryProps> {

  private onFilterChangeObservable = new DebouncedObservable<GalleryFilter>(50);

  render() {
    const dateRange = getDateRange(this.props.mediaFiles);

    const filterComponentProps = {
      initialFilter: new GalleryFilter(null),
      initialStartDateValue: dateRange.start,
      initialEndDateValue: dateRange.end,
      onFilterChange: (filter: GalleryFilter) => {
        this.onFilterChangeObservable.triggerEvent(filter);
      },
    };

    const innerGalleryProps = {
      ...this.props,
      onFilterChangeObservable: this.onFilterChangeObservable,
    };

    return (
      <div>
        <FilterComponent {...filterComponentProps} />
        <GalleryWrapper {...innerGalleryProps} />
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { scrollObservable } = state.mediaFilesReducer;

  return {
    scrollObservable,
  };
}

export default connect(mapStateToProps, {
  fetchRecordsForTrack
})(Gallery);
