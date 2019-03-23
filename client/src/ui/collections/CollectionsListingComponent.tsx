import * as React from 'react';
import { State } from '../../reducers/fileReducer';
import { connect } from 'react-redux';
import { extractFolderCollectionsFrommediaFiles, CustomCollection } from '../../domain/Collection';
import CollectionGroupListingComponent from './CollectionGroupListingComponent';
import { MediaFile } from '../../domain/MediaFile';

type Props = {
  collections: CustomCollection[];
  mediaFiles: MediaFile[];
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
      collections: extractFolderCollectionsFrommediaFiles(this.props.mediaFiles),
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
    mediaFiles: state.mediaFilesReducer.mediaFiles,
  };
}

export default connect(mapStateToProps)(CollectionsComponent);
