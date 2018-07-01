import * as React from 'react';
import { Collection } from '../../domain/Collection';
import CollectionThumbnail from './CollectionThumbnail';

const styles = {
  collectionsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties,
};

type Props = {
  title: string,
  collections: Collection[],
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

    return (
      <div>
        <h2>{this.props.title}</h2>
        <div style={styles.collectionsWrapper}>
          {itemsHtml}
        </div>
      </div>
    );
  }
}

export default CollectionGroupListingComponent;
