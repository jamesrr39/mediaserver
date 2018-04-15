import * as React from 'react';
import { State } from '../reducers';
import { connect } from 'react-redux';
import { PictureMetadata } from '../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../configs';

type Props = {
  match: {
    params: {
      hash: string;
    }
  }
  picturesMetadatas: PictureMetadata[]
};

const styles = {
  modal: {
    position: 'fixed',
    height: '100%',
    width: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'black',
    zIndex: 10000,
    color: 'white',
  } as React.CSSProperties,
};

class PictureModal extends React.Component<Props> {
  render() {
    const { picturesMetadatas, match } = this.props;
    let pictureMetadata: null|PictureMetadata = null;
    let i;

    for (i = 0; i < picturesMetadatas.length; i++) {
      if (picturesMetadatas[i].hashValue === match.params.hash) {
        pictureMetadata = picturesMetadatas[i];
        break;
      }
    }

    if (pictureMetadata === null) {
      return (<p>Image not found</p>);
    }

    const pictureURL = `${SERVER_BASE_URL}/picture/${pictureMetadata.hashValue}`;

    return (
      <div style={styles.modal}>
        <div>Modal Body 2 ({this.props.match.params.hash})</div>
        <img src={pictureURL} />
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas } = state.picturesMetadatas;

  return {
    picturesMetadatas,
  };
}

export default connect(mapStateToProps)(PictureModal);
