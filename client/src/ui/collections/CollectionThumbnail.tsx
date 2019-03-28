import * as React from 'react';
import { Link } from 'react-router-dom';
import { Collection } from '../../domain/Collection';
import { SERVER_BASE_URL } from '../../configs';
import { joinUrlFragments } from '../../util/url';

export const styles = {
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
  nameStyle: {
    textOverflow: 'ellipsis',
  },
};

type Props = {
  collection: Collection
};

class CollectionThumbnail extends React.Component<Props> {
  render() {
    const {name, fileHashes, type} = this.props.collection;
    const identifier = this.props.collection.identifier();

    const linkUrl = `/collections/${encodeURIComponent(type)}/${encodeURIComponent(identifier)}`;

    const thumbnailStyle = {
      ...styles.thumbnailHtml,
    };

    let thumbnailHtml = <span>?</span>;
    if (fileHashes.length !== 0) {
      const imageUrl = joinUrlFragments(SERVER_BASE_URL, 'picture', `${fileHashes[0]}?h=200`);
      thumbnailStyle.backgroundImage = `url(${imageUrl})`;
      thumbnailHtml = <span />;
    }

    return (
      <div style={styles.collectionBox}>
        <Link to={linkUrl}>
          <div style={thumbnailStyle}>{thumbnailHtml}</div>
          <p style={styles.nameStyle}>{name}</p>
        </Link>
      </div>
    );
  }
}

export default CollectionThumbnail;
