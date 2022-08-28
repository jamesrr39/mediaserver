import * as React from "react";
import { Collection } from "../../domain/Collection";
import GalleryWithFilter from "../gallery/GalleryWithFilter";
import { connect } from "react-redux";
import { MediaFile } from "../../domain/MediaFile";
import { State } from "../../reducers/rootReducer";
import { PeopleMap } from "../../actions/mediaFileActions";
import Gallery from "../gallery/Gallery";
import { TrackMapData } from "../MapComponent";
import { MediaFileType } from "src/domain/MediaFileType";
import { useTrackMapData } from "src/hooks/trackRecordHooks";
import { FitTrack } from "src/domain/FitTrack";
import { InnerMap } from "../gallery/InnerMap";
import GalleryFilter from "src/domain/filter/GalleryFilter";
import { DateFilter } from "src/domain/filter/DateFilter";

type Props = {
  mediaFilesMap: Map<string, MediaFile>;
  collection: Collection;
  routeUrl: string;
  peopleMap: PeopleMap;
};

function CollectionViewComponent(props: Props) {
  const { collection, mediaFilesMap, routeUrl, peopleMap } = props;

  const mediaFiles = collection.fileHashes.map((hash, index) => {
    const mediaFile = mediaFilesMap.get(hash);
    if (!mediaFile) {
      throw new Error(`couldn't find media file for ${hash}`);
    }
    return mediaFile;
  });

  const trackSummaries = mediaFiles
    .filter((mediaFile) => mediaFile.fileType === MediaFileType.FitTrack)
    .map((mediaFile) => mediaFile as FitTrack);

  const { data: trackData, isLoading, error } = useTrackMapData(trackSummaries);

  return (
    <>
      <h1>{collection.name}</h1>
      <InnerMap mediaFiles={mediaFiles} />
      <Gallery
        mediaFiles={mediaFiles}
        peopleMap={peopleMap}
        mediaFileUrlBase={`${routeUrl}/detail`}
        showMap={true}
        filter={
          new GalleryFilter(new DateFilter({ includeFilesWithoutDates: true }))
        }
        isThumbnailVisible={() => true} // TODO: replace
      />
    </>
  );
}

export default connect((state: State) => ({
  mediaFilesMap: state.mediaFilesReducer.mediaFilesMap,
}))(CollectionViewComponent);
