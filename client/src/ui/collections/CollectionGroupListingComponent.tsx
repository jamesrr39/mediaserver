import * as React from 'react';
import { Collection } from '../../domain/Collection';
import CollectionThumbnail from './CollectionThumbnail';
import { Link } from 'react-router-dom';
import { themeStyles } from '../../theme/theme';

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

    return (
      <div>
        <h2>{this.props.title}</h2>
        {this.renderAddCollectionBtn()}
        <div style={styles.collectionsWrapper}>
          {itemsHtml}
        </div>
      </div>
    );
  }

  private renderAddCollectionBtn = () => {
    if (!this.props.canAddCollection) {
      return '';
    }

    return (
      <Link style={themeStyles.button} to={'/collections/custom/new'}>
        &#43; Add
      </Link>
    );
  }
}

export default CollectionGroupListingComponent;
