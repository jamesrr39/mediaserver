import * as React from 'react';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { Collection, extractFolderCollectionsFromPicturesMetadatas } from '../../domain/Collection';
import { Link } from 'react-router-dom';
import { PictureMetadata } from '../../domain/PictureMetadata';

type Props = {
  collections: Collection[];
  picturesMetadatas: PictureMetadata[];
};

const styles = {
  collectionBox: {
    backgroundColor: '#ccc',
    margin: '10px',
  },
  collectionsWrapper: {
    display: 'flex',
  },
  collectionNameText: {
    textAlign: 'center',
  },
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const collectionsList = extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas)
      .map((collection, index) => {
        const linkUrl = `/collections/${encodeURIComponent(collection.type)}/${encodeURIComponent(collection.name)}`;

        const thumbnails = collection.hashes.slice(0, 4).map((hash, thumbnailIndex) => {
          const url = `/picture/${hash}?h=100`;
          return <img key={thumbnailIndex} src={url} />;
        });
        return (
          <div key={index} style={styles.collectionBox}>
            <Link to={linkUrl}>
              <p style={styles.collectionNameText}>{collection.name}</p>
              {thumbnails}
            </Link>
          </div>
        );
      });

    return (
      <div>
        <h2>By Folder</h2>
        <div style={styles.collectionsWrapper}>
          {collectionsList}
        </div>
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
