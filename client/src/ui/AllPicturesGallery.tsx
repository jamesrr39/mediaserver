import * as React from 'react';

import { State } from '../reducers/rootReducer';
import { connect } from 'react-redux';
import GalleryWithFilter from './gallery/Gallery';
import { MediaFile } from '../domain/MediaFile';
import { getScreenWidth } from '../util/screen_size';
import { PeopleMap } from '../actions/mediaFileActions';

type GalleryProps = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
};

class AllPicturesGallery extends React.Component<GalleryProps> {
  render() {
    const props = {
      mediaFiles: this.props.mediaFiles,
      mediaFileUrlBase: '/gallery/detail',
      showMap: false,
      getRowWidth: () => getScreenWidth(),
      peopleMap: this.props.peopleMap,
    };

    return <GalleryWithFilter {...props} />;
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
