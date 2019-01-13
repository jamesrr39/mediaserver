import * as React from 'react';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { extractFolderCollectionsFromPicturesMetadatas, CustomCollection } from '../../domain/Collection';
import CollectionGroupListingComponent from './CollectionGroupListingComponent';
import { MediaFile } from '../../domain/MediaFile';
// import { compose } from 'redux';
// import { withRouter } from 'react-router';

type Props = {
  collections: CustomCollection[];
  picturesMetadatas: MediaFile[];
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

    return <CollectionGroupListingComponent {...props} />;
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
