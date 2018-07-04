import * as React from 'react';
import { CustomCollection } from '../../domain/Collection';
import { ChangeEvent } from 'react';
import Gallery from '../Gallery';
import { State } from '../../reducers';
import { connect, Dispatch } from 'react-redux';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { Action } from 'redux';
import { saveCollection } from '../../collectionsActions';
import { themeStyles } from '../../theme/theme';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { History } from 'history';

const styles = {
  nameInput: {
    padding: '10px',
    borderRadius: '10px',
    width: '300px',
    margin: '0 10px',
    border: '1px dashed black',
  },
};

type Props = {
  picturesMetadatas: PictureMetadata[],
  collection: CustomCollection,
  dispatch: Dispatch<Action>;
  history: History;
};

type ComponentState = {
  name: string;
  hashesInCollectionSet: Set<string>;
};

class EditCustomCollectionComponent extends React.Component<Props, ComponentState> {
  state = {
    name: this.props.collection.name,
    hashesInCollectionSet: new Set<string>(this.props.collection.fileHashes),
  };

  onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    this.setState(state => ({
        ...state,
        name,
    }));
  }
  addToFilesInCollection = (hash: string) => {
    this.setState(state => {
      const hashesInCollectionSet = new Set(state.hashesInCollectionSet);
      hashesInCollectionSet.add(hash);

      return {
        ...state,
        hashesInCollectionSet,
      };
    });
  }
  removeFromFilesInCollection = (hash: string) => {
    this.setState(state => {
      const hashesInCollectionSet = new Set(state.hashesInCollectionSet);
      hashesInCollectionSet.delete(hash);

      return {
        ...state,
        hashesInCollectionSet,
      };
    });
  }
  onSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, collection, history } = this.props;

    const newCollection = new CustomCollection(
      collection.id,
      this.state.name,
      Array.from(this.state.hashesInCollectionSet),
    );
    const encodedType = encodeURIComponent(newCollection.type);
    const encodedIdentifier = encodeURIComponent(newCollection.identifier());
    const successUrl = `/collections/${encodedType}/${encodedIdentifier}`;
    const onSuccess = () => {
      history.push(successUrl);
    };

    dispatch(
      saveCollection(
        newCollection,
        onSuccess,
      ),
    );
  }
  render() {
    const filesInCollection: PictureMetadata[] = [];
    const filesOutOfCollection: PictureMetadata[] = [];
    this.props.picturesMetadatas.forEach((pictureMetadata) => {
      if (this.state.hashesInCollectionSet.has(pictureMetadata.hashValue)) {
        filesInCollection.push(pictureMetadata);
      } else {
        filesOutOfCollection.push(pictureMetadata);
      }
    });

    const onClickFilesInCollectionThumbnail = (pictureMetadata: PictureMetadata) => {
      this.removeFromFilesInCollection(pictureMetadata.hashValue);
    };

    const onClickFilesOutOfCollectionThumbnail = (pictureMetadata: PictureMetadata) => {
      this.addToFilesInCollection(pictureMetadata.hashValue);
    };

    const itemsInCollectionGalleryProps = {
      picturesMetadatas: filesInCollection,
      onClickThumbnail: onClickFilesInCollectionThumbnail,
    };

    const itemsOutOfCollectionGalleryProps = {
      picturesMetadatas: filesOutOfCollection,
      onClickThumbnail: onClickFilesOutOfCollectionThumbnail,
    };

    return (
      <div>
        <form>
          <input
            type="text"
            placeholder="name"
            style={styles.nameInput}
            value={this.state.name}
            onChange={event => this.onNameChange(event)}
          />
          <button type="submit" onClick={this.onSubmit} style={themeStyles.button}>Save</button>
          <h3>Items in collection</h3>
          <Gallery {...itemsInCollectionGalleryProps} />
          <h3>Items out of collection</h3>
          <Gallery {...itemsOutOfCollectionGalleryProps} />
        </form>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    picturesMetadatas: state.picturesMetadatas.picturesMetadatas,
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EditCustomCollectionComponent);
