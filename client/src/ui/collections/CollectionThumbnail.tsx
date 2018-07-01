import * as React from 'react';
import { Link } from 'react-router-dom';
import { Collection } from '../../domain/Collection';

const styles = {
  collectionBox: {
    border: '1px black dotted',
    margin: '10px',
    padding: '5px',
  },
  thumbnailHtml: {
    width: '200px',
    height: '200px',
    overflow: 'hidden',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
  } as React.CSSProperties,
};

type Props = {
  collection: Collection
};

class CollectionThumbnail extends React.Component<Props> {
  render() {
    const {name, hashes, type} = this.props.collection;

    const linkUrl = `/collections/${encodeURIComponent(type)}/${encodeURIComponent(name)}`;

    const thumbnailStyle = {
      ...styles.thumbnailHtml,
    };

    let thumbnailHtml = <span>?</span>;
    if (hashes.length !== 0) {
      const url = `/picture/${hashes[0]}?h=200`;
      thumbnailStyle.backgroundImage = `url(${url})`;
      thumbnailHtml = <span />;
    }

    return (
      <div style={styles.collectionBox}>
        <Link to={linkUrl}>
          <div style={thumbnailStyle}>{thumbnailHtml}</div>
          <p>{name}</p>
        </Link>
      </div>
    );
  }
}

export default CollectionThumbnail;
