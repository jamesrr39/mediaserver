import * as React from 'react';

import { State } from '../reducers';
import { connect } from 'react-redux';
import Gallery from './Gallery';
import { MediaFile } from '../domain/MediaFile';

export interface GalleryProps {
  picturesMetadatas: MediaFile[];
}

class AllPicturesGallery extends React.Component<GalleryProps> {
  render() {
    const props = {
      mediaFiles: this.props.picturesMetadatas,
      pictureModalUrlbase: '/gallery/detail',
      showMap: true,
    };

    return (
      <Gallery {...props} />
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas } = state.picturesMetadatasReducer;

  return {
    picturesMetadatas,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
