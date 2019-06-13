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

export type GalleryProps = {
  mediaFiles: MediaFile[];
  scrollObservable: Observable<{}>;
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
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
    showMap: true,
    tracks: [],
    galleryFilter: new GalleryFilter(null),
  };

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

  private fetchRecords = async (trackSummaries: FitTrack[]) => {
    const tracksDetails = await this.props.fetchRecordsForTracks(trackSummaries);

    const trackDatas = trackSummaries.map(trackSummary => {
      const records = tracksDetails.get(trackSummary.hashValue);
      if (!records) {
        throw new Error(`track details not found for track ${trackSummary.hashValue} (${trackSummary.relativePath})`);
      }

      return {
        trackSummary,
        activityBounds: trackSummary.activityBounds,
        points: records.map(record => ({
          lat: record.posLat,
          lon: record.posLong,
        })),
        openTrackUrl: this.props.mediaFileUrlBase,
      };
    });

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
  fetchRecordsForTracks
})(GalleryWithFilter);
