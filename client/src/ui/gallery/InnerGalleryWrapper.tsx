import * as React from 'react';
import { createCompareTimeTakenFunc } from '../../domain/PictureMetadata';

import { Observable } from '../../util/Observable';
import { TrackMapData } from '../MapComponent';
import { MediaFile } from '../../domain/MediaFile';
import { MediaFileType } from '../../domain/MediaFileType';
import { FitTrack, Record } from '../../domain/FitTrack';
import { GalleryFilter } from '../../domain/Filter';
import InnerGallery from './InnerGallery';
import { CancellablePromise } from '../../util/promises';
import { connect } from 'react-redux';
import { fetchRecordsForTracks, PeopleMap } from '../../actions/mediaFileActions';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<void>;
  resizeObservable: Observable<void>;
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  peopleMap: PeopleMap,
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
  getRowWidth(): number;
  isThumbnailVisible(el: HTMLElement): void;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

type GalleryState = {
  showMap: boolean;
  tracks: TrackMapData[];
  galleryFilter: GalleryFilter;
};

type InnerGalleryWrapperProps = {
  onFilterChangeObservable: Observable<GalleryFilter>;
} & GalleryProps;

class InnerGalleryWrapper extends React.Component<InnerGalleryWrapperProps, GalleryState> {
  state = {
    showMap: this.props.showMap || false,
    tracks: [],
    galleryFilter: new GalleryFilter(null),
  };

  private fetchRecordsPromise?: CancellablePromise<Map<string, Record[]>>;

  componentDidMount() {
    const { mediaFiles, onFilterChangeObservable } = this.props;
    const tracks: FitTrack[] = [];

    mediaFiles.forEach(mediaFile => {
      if (mediaFile.fileType !== MediaFileType.FitTrack) {
        return;
      }

      tracks.push(mediaFile);
    });

    onFilterChangeObservable.addListener(this.filterChangeCallback);
  }

  componentWillUnmount() {
    this.props.onFilterChangeObservable.removeListener(this.filterChangeCallback);
    if (this.fetchRecordsPromise) {
     this.fetchRecordsPromise.cancel();
    }
  }

  render() {
    const {getRowWidth, isThumbnailVisible, resizeObservable, scrollObservable, peopleMap} = this.props;
    const { showMap, tracks, galleryFilter } = this.state;
    const mediaFiles = this.props.mediaFiles.filter(galleryFilter.filter);

    mediaFiles.sort(gallerySortingFunc);

    const statelessGalleryProps = {
      ...this.props,
      mediaFiles,
      tracks,
      showMap,
      filterJson: JSON.stringify(galleryFilter.toJsObject()),
      getRowWidth,
      isThumbnailVisible,
      resizeObservable,
      scrollObservable,
      peopleMap,
    };

    return (
        <InnerGallery {...statelessGalleryProps} />
    );
  }

  private filterChangeCallback = (galleryFilter: GalleryFilter) => {
    this.setState(state => ({
      ...state,
      galleryFilter,
    }));
  }
}

export default connect(undefined, {fetchRecordsForTracks})(InnerGalleryWrapper);
