import * as React from 'react';

import { State } from '../reducers/fileReducer';
import { connect } from 'react-redux';
import GalleryWithFilter from './gallery/Gallery';
import { MediaFile } from '../domain/MediaFile';

type GalleryProps = {
  mediaFiles: MediaFile[];
};

class AllPicturesGallery extends React.Component<GalleryProps> {
  render() {
    const props = {
      mediaFiles: this.props.mediaFiles,
      mediaFileUrlBase: '/gallery/detail',
      showMap: true,
    };

    return (
      <GalleryWithFilter {...props} />
    );
  }
}

function mapStateToProps(state: State) {
  const { mediaFiles } = state.mediaFilesReducer;

  return {
    mediaFiles,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
