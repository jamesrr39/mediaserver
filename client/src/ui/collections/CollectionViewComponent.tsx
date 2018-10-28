import * as React from 'react';
import { Collection } from '../../domain/Collection';
import { PictureMetadata } from '../../domain/PictureMetadata';
import Gallery from '../Gallery';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { themeStyles } from '../../theme/theme';
import { Link } from 'react-router-dom';

type Props = {
  picturesMetadatasMap: Map<string, PictureMetadata>;
  collection: Collection;
  routeUrl: string;
};

const styles = {
  container: {
    margin: '0 20px',
  },
};

class CollectionViewComponent extends React.Component<Props> {
  render() {
    const { collection, picturesMetadatasMap, routeUrl } = this.props;

    const mediaFiles = collection.fileHashes.map((hash, index) => {
      const mediaFile = picturesMetadatasMap.get(hash);
      if (!mediaFile) {
        throw new Error(`couldn't find picture metadata for ${hash}`);
      }
      return mediaFile;
    });

    const galleryProps = {
      mediaFiles,
      pictureModalUrlbase: `${routeUrl}/picture`,
      showMap: true,
    };

    return (
      <div style={styles.container}>
        <h1>{this.props.collection.name}</h1>
        <Gallery {...galleryProps} />
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect(state => state),
)(CollectionViewComponent);

type CollectionViewNavBarProps = {
  collection: Collection;
};

export const CollectionViewNavBarComponent = (props: CollectionViewNavBarProps) => {
  const { collection } = props;

  const encodedType = encodeURIComponent(collection.type);
  const encodedIdentifier = encodeURIComponent(collection.identifier());
  const editUrl = `/collections/${encodedType}/${encodedIdentifier}/edit`;

  return (
    <Link style={themeStyles.button} to={editUrl}>
      &#9998; Edit
    </Link>
  );
};
