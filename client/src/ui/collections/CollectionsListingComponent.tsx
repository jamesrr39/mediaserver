import * as React from 'react';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { Collection, extractFolderCollectionsFromPicturesMetadatas } from '../../domain/Collection';
import { PictureMetadata } from '../../domain/PictureMetadata';
import CollectionGroupListingComponent from './CollectionGroupListingComponent';

type Props = {
  collections: Collection[];
  picturesMetadatas: PictureMetadata[];
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const props = {
      title: 'By Folder',
      collections: extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas),
    };

    return <CollectionGroupListingComponent {...props} />;
  }
  renderCustomCollections() {
    const props = {
      title: 'Your Collections',
      collections: this.props.collections,
    };

    return <CollectionGroupListingComponent {...props} />;
  }
  render() {
    return (
      <div>
        Collections
        {this.renderCustomCollections()}
        {this.renderFolderCollections()}
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    collections: state.collections.collections,
    picturesMetadatas: state.picturesMetadatas.picturesMetadatas,
  };
}

export default connect(mapStateToProps)(CollectionsComponent);
