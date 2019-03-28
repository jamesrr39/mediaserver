import * as React from 'react';
import { Collection } from '../../domain/Collection';
import Gallery from '../Gallery';
import { connect } from 'react-redux';
import { themeStyles } from '../../theme/theme';
import { Link } from 'react-router-dom';
import { joinUrlFragments } from '../../util/url';
import { MediaFile } from '../../domain/MediaFile';
import { State } from '../../reducers/fileReducer';

type Props = {
  mediaFilesMap: Map<string, MediaFile>;
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
    const { collection, mediaFilesMap, routeUrl } = this.props;

    const mediaFiles = collection.fileHashes.map((hash, index) => {
      const mediaFile = mediaFilesMap.get(hash);
      if (!mediaFile) {
        throw new Error(`couldn't find media file for ${hash}`);
      }
      return mediaFile;
    });

    const galleryProps = {
      mediaFiles,
      mediaFileUrlBase: '/' + joinUrlFragments(routeUrl, 'detail'),
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

export default connect((state: State) => ({
  mediaFilesMap: state.mediaFilesReducer.mediaFilesMap,
}))(CollectionViewComponent);

type CollectionViewNavBarProps = {
  collection: Collection;
};

export const CollectionViewNavBarComponent = (props: CollectionViewNavBarProps) => {
  const { collection } = props;
  
  const editUrl = '/' + joinUrlFragments(
    'collections',
    encodeURIComponent(collection.type),
    encodeURIComponent(collection.identifier()),
    'edit'
  );

  return (
    <Link style={themeStyles.button} to={editUrl}>
      &#9998; Edit
    </Link>
  );
};
