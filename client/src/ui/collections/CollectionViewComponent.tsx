import * as React from 'react';
import { Collection } from '../../domain/Collection';
import GalleryWithFilter from '../gallery/GalleryWithFilter';
import { connect } from 'react-redux';
import { MediaFile } from '../../domain/MediaFile';
import { State } from '../../reducers/rootReducer';
import { getScreenWidth } from '../../util/screen_size';
import { PeopleMap } from '../../actions/mediaFileActions';

type Props = {
  mediaFilesMap: Map<string, MediaFile>;
  collection: Collection;
  routeUrl: string;
  peopleMap: PeopleMap;
};

const styles = {
  container: {
    margin: '0 20px',
  },
};

class CollectionViewComponent extends React.Component<Props> {
  render() {
    const { collection, mediaFilesMap, routeUrl, peopleMap } = this.props;

    const mediaFiles = collection.fileHashes.map((hash, index) => {
      const mediaFile = mediaFilesMap.get(hash);
      if (!mediaFile) {
        throw new Error(`couldn't find media file for ${hash}`);
      }
      return mediaFile;
    });

    const galleryProps = {
      mediaFiles,
      peopleMap,
      mediaFileUrlBase: `${routeUrl}/detail`,
      showMap: true,
      getRowWidth: () => getScreenWidth(),
    };

    return (
      <div style={styles.container}>
        <h1>{this.props.collection.name}</h1>
        <GalleryWithFilter {...galleryProps} />
      </div>
    );
  }
}

export default connect((state: State) => ({
  mediaFilesMap: state.mediaFilesReducer.mediaFilesMap,
}))(CollectionViewComponent);
