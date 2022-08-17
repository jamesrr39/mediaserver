import * as React from "react";

import { State } from "../reducers/rootReducer";
import { connect } from "react-redux";
import GalleryWithFilter from "./gallery/GalleryWithFilter";
import { MediaFile } from "../domain/MediaFile";
import { PeopleMap } from "../actions/mediaFileActions";

type GalleryProps = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
  rowWidth: number;
};

function AllPicturesGallery(props: GalleryProps) {
  const { mediaFiles, peopleMap, rowWidth } = props;

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
    rowWidth: state.windowReducer.innerWidth,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
