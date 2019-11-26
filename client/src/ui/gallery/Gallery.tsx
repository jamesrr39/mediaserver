import * as React from 'react';
import { createCompareTimeTakenFunc } from '../../domain/PictureMetadata';

import { Observable, DebouncedObservable } from '../../util/Observable';
import { State } from '../../reducers/fileReducer';
import { connect } from 'react-redux';
import { TrackMapData } from '../MapComponent';
import { MediaFile } from '../../domain/MediaFile';
import { MediaFileType } from '../../domain/MediaFileType';
import { FitTrack, Record } from '../../domain/FitTrack';
import { fetchRecordsForTracks } from '../../actions/mediaFileActions';
import { FilterComponent } from './FilterComponent';
import { GalleryFilter } from '../../domain/Filter';
import { InnerGallery } from './InnerGallery';
import { trackSummariesToTrackDatas } from '../../actions/selectors';
import { CancellablePromise, makeCancelable } from '../../util/promises';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<{}>;
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
  getRowWidth(): number;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

type GalleryState = {
  showMap: boolean;
  tracks: TrackMapData[];
  galleryFilter: GalleryFilter;
};

export type InnerGalleryProps = {
  showMap: boolean;
  tracks: TrackMapData[];
  filterJson: string;
} & GalleryProps;

type GalleryWrapperProps = {
  onFilterChangeObservable: Observable<GalleryFilter>;
} & GalleryProps;

class GalleryWrapper extends React.Component<GalleryWrapperProps, GalleryState> {
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

    this.fetchRecords(tracks);

    onFilterChangeObservable.addListener(this.filterChangeCallback);
  }

  componentWillUnmount() {
    this.props.onFilterChangeObservable.removeListener(this.filterChangeCallback);
    if (this.fetchRecordsPromise) {
     this.fetchRecordsPromise.cancel();
    }
  }

  render() {
    const {getRowWidth} = this.props;
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
    };

    return (
      <InnerGallery {...statelessGalleryProps} />
    );
  }

  private fetchRecords = async (trackSummaries: FitTrack[]) => {
    this.fetchRecordsPromise = makeCancelable(this.props.fetchRecordsForTracks(trackSummaries));
    const tracksDetails = await this.fetchRecordsPromise.promise;

    const trackDatas = trackSummariesToTrackDatas(trackSummaries, tracksDetails, this.props.mediaFileUrlBase);

    this.setState(state => ({
      ...state,
      tracks: state.tracks.concat(trackDatas),
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

class GalleryWithFilter extends React.Component<GalleryProps> {

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

    const wrapperStyles = {
      height: '400px',
      // overflowY: 'scroll' as 'scroll',
    };

    return (
      <div>
        <FilterComponent {...filterComponentProps} />
        <div style={wrapperStyles}>
          <GalleryWrapper {...innerGalleryProps} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { scrollObservable } = state.dependencyInjection;

  return {
    scrollObservable,
  };
}

export default connect(mapStateToProps, {
  fetchRecordsForTracks
})(GalleryWithFilter);
