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
    border: '1px black dotted',
    margin: '10px',
    padding: '5px',
  },
  collectionsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  thumbnailHtml: {
    width: '200px',
    height: '200px',
    overflow: 'hidden',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
  } as React.CSSProperties,
};

class CollectionsComponent extends React.Component<Props> {
  renderFolderCollections() {
    const collectionsList = extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas)
      .map((collection, index) => {
        const linkUrl = `/collections/${encodeURIComponent(collection.type)}/${encodeURIComponent(collection.name)}`;
        const thumbnailStyle = {
          ...styles.thumbnailHtml,
        };

        let thumbnailHtml = <span>?</span>;
        if (collection.hashes.length !== 0) {
          const url = `/picture/${collection.hashes[0]}?h=200`;
          thumbnailStyle.backgroundImage = `url(${url})`;
          thumbnailHtml = <span />;
        }

        return (
          <div key={index} style={styles.collectionBox}>
            <Link to={linkUrl}>
              <div style={thumbnailStyle}>{thumbnailHtml}</div>
              <p>{collection.name}</p>
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
