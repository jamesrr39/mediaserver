import * as React from "react";
import { State } from "../../reducers/rootReducer";
import { connect } from "react-redux";
import {
  extractFolderCollectionsFrommediaFiles,
  CustomCollection,
} from "../../domain/Collection";
import CollectionGroupListingComponent from "./CollectionGroupListingComponent";
import { MediaFile } from "../../domain/MediaFile";

type Props = {
  collections: CustomCollection[];
  mediaFiles: MediaFile[];
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const props = {
      title: "By Folder",
      collections: extractFolderCollectionsFrommediaFiles(
        this.props.mediaFiles
      ),
    };

    return <CollectionGroupListingComponent {...props} />;
  }
  renderCustomCollections() {
    const props = {
      title: "Your Collections",
      collections: this.props.collections,
      canAddCollection: true,
    };

    return <CollectionGroupListingComponent {...props} />;
  }
  render() {
    return (
      <>
        <div className="container-fluid">
          <h1>Collections</h1>
        </div>
        {this.renderCustomCollections()}
        {this.renderFolderCollections()}
      </>
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
