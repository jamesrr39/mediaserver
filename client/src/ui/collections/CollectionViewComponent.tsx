import * as React from 'react';
import { Collection } from '../../domain/Collection';
import { PictureMetadata } from '../../domain/PictureMetadata';
import Gallery from '../Gallery';

type Props = {
  picturesMetadatasMap: Map<string, PictureMetadata>;
  collection: Collection;
  routeUrl: string;
};

class CollectionViewComponent extends React.Component<Props> {
  render() {
    const picturesMetadatas = this.props.collection.hashes.map((hash, index) => {
      const pictureMetadata = this.props.picturesMetadatasMap.get(hash);
      if (!pictureMetadata) {
        throw new Error(`couldn't find picture metadata for ${hash}`);
      }
      return pictureMetadata;
    });

    const galleryProps = {
      picturesMetadatas,
      pictureModalUrlbase: `${this.props.routeUrl}/picture`,
    };

    return (
      <div>
        {this.props.collection.name}
        <Gallery {...galleryProps} />
      </div>
    );
  }
}

export default CollectionViewComponent;
