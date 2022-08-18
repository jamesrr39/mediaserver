import * as React from "react";

import { State } from "../reducers/rootReducer";
import { connect } from "react-redux";
import GalleryWithFilter from "./gallery/GalleryWithFilter";
import { MediaFile } from "../domain/MediaFile";
import { PeopleMap } from "../actions/mediaFileActions";

type GalleryProps = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
};

function AllPicturesGallery(props: GalleryProps) {
  const { mediaFiles, peopleMap } = props;

  return (
    <GalleryWithFilter
      mediaFiles={mediaFiles}
      peopleMap={peopleMap}
      showMap={false}
      mediaFileUrlBase="/gallery/detail"
    />
  );
}

function mapStateToProps(state: State) {
  const { mediaFiles } = state.mediaFilesReducer;
  const { peopleMap } = state.peopleReducer;

  return {
    mediaFiles,
    peopleMap,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
