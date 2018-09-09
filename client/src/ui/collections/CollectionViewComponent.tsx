import * as React from 'react';
import { Collection } from '../../domain/Collection';
import { PictureMetadata } from '../../domain/PictureMetadata';
import Gallery from '../Gallery';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { History } from 'history';
import { themeStyles } from '../../theme/theme';

type Props = {
  picturesMetadatasMap: Map<string, PictureMetadata>;
  collection: Collection;
  routeUrl: string;
  history: History;
};

class CollectionViewComponent extends React.Component<Props> {
  render() {
    const { history, collection, picturesMetadatasMap, routeUrl } = this.props;

    const picturesMetadatas = collection.fileHashes.map((hash, index) => {
      const pictureMetadata = picturesMetadatasMap.get(hash);
      if (!pictureMetadata) {
        throw new Error(`couldn't find picture metadata for ${hash}`);
      }
      return pictureMetadata;
    });

    const galleryProps = {
      picturesMetadatas,
      pictureModalUrlbase: `${routeUrl}/picture`,
      showMap: true,
    };

    const encodedType = encodeURIComponent(collection.type);
    const encodedIdentifier = encodeURIComponent(collection.identifier());
    const editUrl = `/collections/${encodedType}/${encodedIdentifier}/edit`;

    return (
      <div>
        <button style={themeStyles.button} onClick={() => history.push(editUrl)}>&#9998; Edit</button>
        {this.props.collection.name}
        <Gallery {...galleryProps} />
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect(state => state),
)(CollectionViewComponent);
