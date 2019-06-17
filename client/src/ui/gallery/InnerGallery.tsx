import * as React from 'react';
import { createCompareTimeTakenFunc } from '../../domain/PictureMetadata';

import { Observable } from '../../util/Observable';
import MapComponent, { MapMarker, TrackMapData } from '../MapComponent';
import { SERVER_BASE_URL } from '../../configs';
import { MediaFile } from '../../domain/MediaFile';
import { MediaFileType } from '../../domain/MediaFileType';
import { FitTrack, Record } from '../../domain/FitTrack';
import { getScreenWidth } from '../../util/screen_size';
import { joinUrlFragments } from '../../util/url';
import { filesToRows, GalleryRow, BuildLinkFunc, Row } from './GalleryRow';
import { mediaFilesToDateGroups, groupsMapToGroups } from '../../domain/MediaFileGroup';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<{}>;
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

const ROWS_IN_INCREMENT = 1;

export type InnerGalleryProps = {
  showMap: boolean;
  tracks: TrackMapData[];
  filterJson: string;
} & GalleryProps;

const styles = {
  thumbnail: {
      margin: '0 10px 10px 0',
  },
  mapContainer: {
    margin: '30px 20px',
  },
};

type InnerGalleryState = {
  lastIndexShown: number,
  rows: Row[],
};

export class InnerGallery extends React.Component<InnerGalleryProps, InnerGalleryState> {
  state = {
    lastIndexShown: 0,
    rows: []
  };
  
  componentDidMount() {
    const {scrollObservable} = this.props;

    scrollObservable.triggerEvent({});
    scrollObservable.addListener(this.onScroll);
    scrollObservable.addListener(this.onResize);
  }

  componentWillUnmount() {
    const {scrollObservable} = this.props;

    scrollObservable.removeListener(this.onScroll);
    scrollObservable.removeListener(this.onResize);
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent({});
  }

  render() {
    return (
      <React.Fragment>
        {this.props.showMap && this.renderMap()}
        <div>
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

    if (markers.length === 0 && tracks.length === 0) {
      return null;
    }

    const mapProps = {
      size: {
        width: '100%',
        height: '600px',
      },
      markers,
      tracks,
      extraLatLongMapPadding: 0.001,
      zoomControl: true,
    };

    return (
      <div style={styles.mapContainer}>
        <a href="#" onClick={this.hideMap}>Hide Map</a>
        <MapComponent {...mapProps} />
      </div>
    );
  }

  private renderThumbnails = () => {
    const {scrollObservable, onClickThumbnail, mediaFileUrlBase, filterJson} = this.props;
    const {rows} = this.state;

    let buildLink: (undefined | BuildLinkFunc)  = undefined;
    if (mediaFileUrlBase) {
      buildLink = (mediaFile: MediaFile) => {
        const query = `filterJson=${encodeURIComponent(filterJson)}`;
        const linkUrl = `${mediaFileUrlBase}/${mediaFile.hashValue}?${query}`;
        return linkUrl;
      };
    }

    return rows.map((row, index) => {
      const {lastIndexShown} = this.state;
      if (index > (lastIndexShown + ROWS_IN_INCREMENT)) {
        // don't render anything below the cut
        return null;
      }

      const rowProps = {
        row,
        scrollObservable,
        onClickThumbnail,
        buildLink,
      };

      return <GalleryRow key={index} {...rowProps} />;
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

    this.setRowsState();

    const scrolledTo = window.scrollY;
    const bodyHeight = document.documentElement.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;

    const distanceFromBottom = bodyHeight - (scrolledTo + viewportHeight);
    if (distanceFromBottom < (viewportHeight)) {
      this.setState((state) => ({
        ...state,
        lastIndexShown: state.lastIndexShown + ROWS_IN_INCREMENT,
      }));
    }
  }

  private onResize = () => {
    this.setRowsState();
  }

  private setRowsState() {
    const {mediaFiles} = this.props;
    const rowWidth = getScreenWidth();

    const groupsMap = mediaFilesToDateGroups(mediaFiles);
    const groups = groupsMapToGroups(groupsMap);
    const rows = filesToRows(rowWidth, groups);

    if (rows.length !== this.state.rows.length) {
      this.setState((state) => ({
        ...state,
        rows,
      }));
    }
  }
}
