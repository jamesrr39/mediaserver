import * as React from 'react';

import { State } from '../reducers';
import { connect } from 'react-redux';
import Gallery from './Gallery';
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
      <Gallery {...props} />
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
