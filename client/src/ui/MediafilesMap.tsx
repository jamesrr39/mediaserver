import * as React from 'react';

import { State } from '../reducers/fileReducer';
import { connect } from 'react-redux';
import { MediaFile } from '../domain/MediaFile';
import { InnerMap } from './gallery/InnerMap';
import { FitTrack, Record } from '../domain/FitTrack';
import { TrackMapData } from './MapComponent';
import { MediaFileType } from '../domain/MediaFileType';
import { fetchRecordsForTracks } from '../actions/mediaFileActions';
import { FilterComponent } from './gallery/FilterComponent';
import { GalleryFilter } from '../domain/Filter';
import { DebouncedObservable } from '../util/Observable';
import { trackSummariesToTrackDatas } from '../actions/selectors';
import { CancellablePromise, makeCancelable } from '../util/promises';

type Props = {
  mediaFiles: MediaFile[];
  mediaFileUrlBase: string;
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
};

type ComponentState = {
  tracks: TrackMapData[];
};

class MediafilesMap extends React.Component<Props, ComponentState> {
  state = {
    tracks: [],
    filter: new GalleryFilter(null),
  };

  private onFilterChangeObservable = new DebouncedObservable<GalleryFilter>(50);
  
  private fetchRecordsPromise?: CancellablePromise<Map<string, Record[]>>;

  componentDidMount() {
    this.onFilterChangeObservable.addListener(filter => {
      this.setState(state => ({
        ...state,
        filter,
      }));
    });
    this.fetchRecords();
  }

  componentWillUnmount() {
    if (this.fetchRecordsPromise) {
      this.fetchRecordsPromise.cancel();
    }
  }

  render() {
    const {mediaFiles, mediaFileUrlBase} = this.props;

    const filterProps = {
      initialFilter: this.state.filter,
      onFilterChange: (filter: GalleryFilter) => {
        this.onFilterChangeObservable.triggerEvent(filter);
      },
    };

    const mapProps = {
      tracks: this.state.tracks,
      mediaFileUrlBase,
      mediaFiles,
    };

    return (
      <>
        <FilterComponent {...filterProps} />
        <InnerMap {...mapProps} />;
      </>
    );
  }

  private async fetchRecords() {
    const trackSummaries: FitTrack[] = [];
    this.props.mediaFiles.forEach((file => {
      if (file.fileType === MediaFileType.FitTrack) {
        trackSummaries.push(file);
      }
    }));

    this.fetchRecordsPromise = makeCancelable(this.props.fetchRecordsForTracks(trackSummaries));

    const tracksDetails = await this.fetchRecordsPromise.promise;

    const trackDatas = trackSummariesToTrackDatas(trackSummaries, tracksDetails, this.props.mediaFileUrlBase);

    this.setState(state => ({
      ...state,
      tracks: state.tracks.concat(trackDatas),
    }));
  }
}

function mapStateToProps(state: State) {
  const { mediaFiles } = state.mediaFilesReducer;

  return {
    mediaFiles,
  };
}

export default connect(mapStateToProps, {
  fetchRecordsForTracks
})(MediafilesMap);
