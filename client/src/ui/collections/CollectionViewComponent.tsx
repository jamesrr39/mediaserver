import * as React from 'react';
import { Collection } from '../../domain/Collection';

type Props = {
  collection: Collection;
};

class CollectionViewComponent extends React.Component<Props> {
  render() {
    const gallery = this.props.collection.hashes.map((hash, index) => {
      return (
        <div key={index}>
          {hash}
        </div>
      );
    });

    return (
      <div>
        {this.props.collection.name}
        {gallery}
      </div>
    );
  }
}

export default CollectionViewComponent;
