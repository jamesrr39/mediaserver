import * as React from 'react';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { Collection } from '../../domain/Collection';
import { Link } from 'react-router-dom';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { CollectionTypeFolder } from '../../domain/Collection';

export function extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas: PictureMetadata[]) {
  const collectionsMap = new Map<string, string[]>();
  picturesMetadatas.forEach((pictureMetadata) => {
    const filepathFragments = pictureMetadata.relativeFilePath.split('/');
    filepathFragments.splice(filepathFragments.length - 1, 1);
    filepathFragments.splice(0, 1);
    for (let i = 0; i < filepathFragments.length; i++) {
      const folder = filepathFragments.slice(0, i + 1).join('/');
      if (folder === '') {
        continue;
      }
      const picturesMetadataList = collectionsMap.get(folder) || [];
      picturesMetadataList.push(pictureMetadata.hashValue);
      collectionsMap.set(folder, picturesMetadataList);
    }
  });
  const collectionsList: Collection[] = [];
  collectionsMap.forEach((hashes, name) => {
    collectionsList.push({
      hashes,
      name,
      type: CollectionTypeFolder,
    });
  });
  return collectionsList;
}

type Props = {
  collections: Collection[];
  picturesMetadatas: PictureMetadata[];
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const collectionsList = extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas)
      .map((collection, index) => {
        const linkUrl = `/collections/${encodeURIComponent(collection.type)}/${encodeURIComponent(collection.name)}`;
        return (
          <div key={index}>
            <Link to={linkUrl}>
              {collection.name}
            </Link>
          </div>
        );
      });

    return (
      <div>
        <h2>By Folder</h2>
        {collectionsList}
      </div>
    );
  }
  render() {
    const collectionsElements = this.props.collections.map((collection, index) => {
      const linkUrl = `/collections/${collection.type}/${collection.name}`;
      return (
        <div key={index}>
          <Link to={linkUrl}>
            {collection.name}
          </Link>
        </div>
      );
    });

    return (
      <div>
        My Collections
        {this.renderFolderCollections()}
        {collectionsElements}
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
