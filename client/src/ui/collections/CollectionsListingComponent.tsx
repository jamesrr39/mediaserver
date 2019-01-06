import * as React from 'react';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { extractFolderCollectionsFromPicturesMetadatas, CustomCollection } from '../../domain/Collection';
import { PictureMetadata } from '../../domain/PictureMetadata';
import CollectionGroupListingComponent from './CollectionGroupListingComponent';

type Props = {
  collections: CustomCollection[];
  picturesMetadatas: PictureMetadata[];
};

const styles = {
  container: {
    margin: '0 20px',
  },
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const props = {
      title: 'By Folder',
      collections: extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas),
    };
    const comp = <CollectionGroupListingComponent {...props} />;
    return comp;
  }
  renderCustomCollections() {
    const props = {
      title: 'Your Collections',
      collections: this.props.collections,
      canAddCollection: true,
    };

    return <CollectionGroupListingComponent {...props} />;
  }
  render() {
    return (
      <div style={styles.container}>
        <h1>Collections</h1>
        {this.renderCustomCollections()}
        {this.renderFolderCollections()}
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    collections: state.collectionsReducer.customCollections,
    picturesMetadatas: state.picturesMetadatasReducer.picturesMetadatas,
  };
}

export default connect(mapStateToProps)(CollectionsComponent);
