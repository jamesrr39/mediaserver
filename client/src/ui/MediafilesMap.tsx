import * as React from "react";

import { State } from "../reducers/rootReducer";
import { connect } from "react-redux";
import { MediaFile } from "../domain/MediaFile";
import { InnerMap } from "./gallery/InnerMap";
import { FitTrack } from "../domain/FitTrack";
import { MediaFileType } from "../domain/MediaFileType";
import FilterComponent from "./gallery/FilterComponent";
import GalleryFilter from "../domain/filter/GalleryFilter";
import { DateFilter } from "src/domain/filter/DateFilter";
import { useTrackMapData } from "src/hooks/trackRecordHooks";

type Props = {
  mediaFiles: MediaFile[];
  mediaFileUrlBase: string;
};

function MediafilesMap(props: Props) {
  const { mediaFiles, mediaFileUrlBase } = props;

  const [filter, setFilter] = React.useState<GalleryFilter>(
    new GalleryFilter(
      new DateFilter({
        includeFilesWithoutDates: true,
      })
    )
  );

  return (
    <>
      <FilterComponent initialFilter={filter} onFilterChange={setFilter} />
      <InnerMap mediaFiles={mediaFiles} mediaFileUrlBase={mediaFileUrlBase} />
    </>
  );
}

function mapStateToProps(state: State) {
  const { mediaFiles } = state.mediaFilesReducer;

  return {
    mediaFiles,
  };
}

export default connect(mapStateToProps)(MediafilesMap);
