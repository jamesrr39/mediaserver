import * as React from "react";
import { Collection } from "../../domain/Collection";
import GalleryWithFilter from "../gallery/GalleryWithFilter";
import { connect } from "react-redux";
import { MediaFile } from "../../domain/MediaFile";
import { State } from "../../reducers/rootReducer";
import { PeopleMap } from "../../actions/mediaFileActions";
import Gallery from "../gallery/Gallery";

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

  return (
    <>
      <h1>{collection.name}</h1>
      <Gallery
        mediaFiles={mediaFiles}
        peopleMap={peopleMap}
        mediaFileUrlBase={`${routeUrl}/detail`}
        showMap={true}
      />
    </>
  );
}

export default connect((state: State) => ({
  mediaFilesMap: state.mediaFilesReducer.mediaFilesMap,
}))(CollectionViewComponent);
