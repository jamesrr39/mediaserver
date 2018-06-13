import * as React from 'react';
import { PictureMetadata, createCompareTimeTakenFunc } from '../domain/PictureMetadata';

import { State } from '../reducers';
import { connect } from 'react-redux';
import Gallery from './Gallery';

export interface GalleryProps {
  picturesMetadatas: PictureMetadata[];
}

const gallerySortingFunc = createCompareTimeTakenFunc(true);

class AllPicturesGallery extends React.Component<GalleryProps> {
  render() {
    this.props.picturesMetadatas.sort(gallerySortingFunc);
    const props = {
      picturesMetadatas: this.props.picturesMetadatas,
      pictureModalUrlbase: '/gallery/picture',
    };

    return (
      <Gallery {...props} />
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas } = state.picturesMetadatas;

  return {
    picturesMetadatas,
  };
}

export default connect(mapStateToProps)(AllPicturesGallery);
