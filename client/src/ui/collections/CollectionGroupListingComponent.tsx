import * as React from 'react';
import { Collection } from '../../domain/Collection';
import CollectionThumbnail, { collectionThumbnailStyles } from './CollectionThumbnail';
import { Link } from 'react-router-dom';

const styles = {
  collectionsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties,
};

type Props = {
  title: string,
  collections: Collection[],
  canAddCollection?: boolean,
};

class CollectionGroupListingComponent extends React.Component<Props> {
  render() {
    const itemsHtml = this.props.collections.map((collection, index) => {
      const props = {
        collection,
      };

      return (
        <div key={index}>
          <CollectionThumbnail {...props} />
        </div>
      );
    });

    let addCollectionBtn = <span />;
    if (this.props.canAddCollection) {
      const addCollectionBtnThumbnailHtmlStyle = {
        ...collectionThumbnailStyles.thumbnailHtml,
        lineHeight: collectionThumbnailStyles.thumbnailHtml.height,
        textAlign: 'center',
      };

      addCollectionBtn = (
        <div style={collectionThumbnailStyles.collectionBox}>
          <Link to="/collections/custom/new">
            <div style={addCollectionBtnThumbnailHtmlStyle}>
            + New
            </div>
          </Link>
        </div>
      );
    }

    return (
      <div>
        <h2>{this.props.title}</h2>
        <div style={styles.collectionsWrapper}>
          {addCollectionBtn}
          {itemsHtml}
        </div>
      </div>
    );
  }
}

export default CollectionGroupListingComponent;
