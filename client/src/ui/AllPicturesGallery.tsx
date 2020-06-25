import * as React from 'react';

import { State } from '../reducers/rootReducer';
import { connect } from 'react-redux';
import GalleryWithFilter from './gallery/GalleryWithFilter';
import { MediaFile } from '../domain/MediaFile';
import { getScreenWidth } from '../util/screen_size';
import { PeopleMap } from '../actions/mediaFileActions';

type GalleryProps = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
};

class AllPicturesGallery extends React.Component<GalleryProps> {
  render() {
    const {mediaFiles, peopleMap} = this.props;

    return <GalleryWithFilter
      mediaFiles={mediaFiles}
      peopleMap={peopleMap}
      showMap={false}
      getRowWidth={() => getScreenWidth()}
      mediaFileUrlBase="/gallery/detail"
    />;
  }
}

function mapStateToProps(state: State) {
  const { mediaFiles, peopleMap } = state.mediaFilesReducer;

  return {
    mediaFiles,
    peopleMap,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
