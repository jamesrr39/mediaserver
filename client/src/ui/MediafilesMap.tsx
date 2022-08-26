import * as React from "react";

import createRootReducer, { State } from "../reducers/rootReducer";
import { connect, useDispatch, useSelector } from "react-redux";
import { MediaFile } from "../domain/MediaFile";
import { InnerMap } from "./gallery/InnerMap";
import { FitTrack, Record } from "../domain/FitTrack";
import { TrackMapData } from "./MapComponent";
import { MediaFileType } from "../domain/MediaFileType";
import { fetchRecordsForTracks } from "../actions/mediaFileActions";
import FilterComponent from "./gallery/FilterComponent";
import GalleryFilter from "../domain/filter/GalleryFilter";
import { useQuery } from "react-query";
import { DateFilter } from "src/domain/filter/DateFilter";

function useFetchRecordsForTracks(trackSummaries: FitTrack[]) {
  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  return useQuery(
    `track-records-${trackSummaries
      .map((summary) => summary.hashValue)
      .join("-")}`,
    () => fetchRecordsForTracks(trackSummaries)(dispatch, () => state)
  );
}

type Props = {
  mediaFiles: MediaFile[];
  mediaFileUrlBase: string;
};

function MediafilesMap(props: Props) {
  const { mediaFiles, mediaFileUrlBase } = props;
  const trackSummaries = mediaFiles
    .filter((mediaFile) => mediaFile.fileType === MediaFileType.FitTrack)
    .map((summary) => summary as FitTrack);
  const [filter, setFilter] = React.useState<GalleryFilter>(
    new GalleryFilter(
      new DateFilter({
        includeFilesWithoutDates: true,
      })
    )
  );

  const { data, isLoading, error } = useFetchRecordsForTracks(trackSummaries);

  if (error) {
    return <p>Error loading tracks</p>;
  }

  if (isLoading) {
    return <p>loading...</p>;
  }

  const filteredTrackMapData: TrackMapData[] = [];

  trackSummaries
    .filter((trackSummary) => {
      return filter.filter(trackSummary);
    })
    .forEach((trackSummary) => {
      const { activityBounds } = trackSummary;
      const records = data.get(trackSummary.hashValue);
      if (!records) {
        throw new Error(`no data found for track ${trackSummary.hashValue}`);
      }

      const points = records.map((record) => ({
        lat: record.posLat,
        lon: record.posLong,
      }));

      filteredTrackMapData.push({
        trackSummary,
        activityBounds,
        points,
      });
    });

  return (
    <>
      <FilterComponent initialFilter={filter} onFilterChange={setFilter} />
      <InnerMap
        tracks={filteredTrackMapData}
        mediaFiles={mediaFiles}
        mediaFileUrlBase={mediaFileUrlBase}
      />
    </>
  );
}

// renderMap(tracks: TrackMapData[]) {
//   const { mediaFiles, mediaFileUrlBase } = this.props;

//   const filterProps = {
//     initialFilter: this.state.filter,
//     onFilterChange: (filter: GalleryFilter) => {
//       this.onFilterChangeObservable.triggerEvent(filter);
//     },
//   };

//   const mapProps = {
//     tracks,
//     mediaFileUrlBase,
//     mediaFiles,
//   };

//   return (
//     <>
//       <FilterComponent {...filterProps} />
//       <InnerMap {...mapProps} />
//     </>
//   );
// }

// private async fetchRecords() {
//   const trackSummaries: FitTrack[] = [];
//   this.props.mediaFiles.forEach((file) => {
//     if (file.fileType === MediaFileType.FitTrack) {
//       trackSummaries.push(file);
//     }
//   });

//   this.fetchRecordsPromise = makeCancelable(
//     fetchRecordsForTracks(trackSummaries)
//   );

//   const tracksDetails = await this.fetchRecordsPromise.promise;
//   console.log("mediaFileUrlBase", this.props.mediaFileUrlBase);
//   const trackDatas = trackSummariesToTrackDatas(
//     trackSummaries,
//     tracksDetails,
//     this.props.mediaFileUrlBase
//   );

//   this.setState((state) => ({
//     ...state,
//     tracks: state.tracks.concat(trackDatas),
//     loaded: true,
//   }));
// }

function mapStateToProps(state: State) {
  const { mediaFiles } = state.mediaFilesReducer;

  return {
    mediaFiles,
  };
}

export default connect(mapStateToProps)(MediafilesMap);
