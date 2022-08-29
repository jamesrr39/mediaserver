import * as React from "react";

import { useSelector } from "react-redux";
import { DateFilter } from "src/domain/filter/DateFilter";
import GalleryFilter from "../domain/filter/GalleryFilter";
import { State } from "../reducers/rootReducer";
import FilterComponent from "./gallery/FilterComponent";
import { InnerMap } from "./gallery/InnerMap";

type Props = {
  mediaFileUrlBase: string;
};

function MediafilesMap(props: Props) {
  const { mediaFileUrlBase } = props;
  const { mediaFiles } = useSelector((state: State) => state.mediaFilesReducer);

  const [filter, setFilter] = React.useState<GalleryFilter>(
    new GalleryFilter(
      new DateFilter({
        includeFilesWithoutDates: true,
      })
    )
  );

  const filteredMediaFiles = mediaFiles.filter((mediaFile) =>
    filter.filter(mediaFile)
  );

  return (
    <>
      <FilterComponent initialFilter={filter} onFilterChange={setFilter} />
      {filteredMediaFiles.length === 0 && (
        <div className="alert alert-info">No tracks with this filter</div>
      )}
      {filteredMediaFiles.length !== 0 && (
        <InnerMap
          mediaFiles={filteredMediaFiles}
          mediaFileUrlBase={mediaFileUrlBase}
        />
      )}
    </>
  );
}

export default MediafilesMap;
