import * as React from 'react';
import { CustomCollection } from '../../domain/Collection';
import { MediaFile } from '../../domain/MediaFile';
import { ChangeEvent } from 'react';
import Gallery from '../Gallery';
import { State } from '../../reducers';
import { connect } from 'react-redux';
import { saveCollection, CollectionsAction } from '../../collectionsActions';
import { themeStyles } from '../../theme/theme';
import { compose, Dispatch } from 'redux';
import { newNotificationAction, NotifyAction } from '../../actions/notificationActions';
import { GalleryNotification, NotificationLevel } from '../NotificationBarComponent';
import { FileQueue } from '../../fileQueue';

const styles = {
  nameInput: {
    padding: '10px',
    borderRadius: '10px',
    width: '300px',
    margin: '0 10px',
    border: '1px dashed black',
  },
  container: {
    margin: '0 20px',
  },
  uploadInput: {
    display: 'none',
  },
};

type Props = {
  mediaFiles: MediaFile[],
  collection: CustomCollection,
  dispatch: Dispatch<CollectionsAction | NotifyAction>;
  uploadQueue: FileQueue;
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
  onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { dispatch, collection } = this.props;

    const newCollection = new CustomCollection(
      collection.id,
      this.state.name,
      Array.from(this.state.hashesInCollectionSet),
    );

    const returnedCollection = await saveCollection(newCollection)(dispatch);

    dispatch(newNotificationAction(new GalleryNotification(NotificationLevel.INFO, 'Saved!')));

    const encodedType = encodeURIComponent(returnedCollection.type);
    const encodedIdentifier = encodeURIComponent(returnedCollection.identifier());
    window.location.hash = `#/collections/${encodedType}/${encodedIdentifier}`;
  }

  render() {
    const filesInCollection: MediaFile[] = [];
    const filesOutOfCollection: MediaFile[] = [];
    this.props.mediaFiles.forEach((pictureMetadata) => {
      if (this.state.hashesInCollectionSet.has(pictureMetadata.hashValue)) {
        filesInCollection.push(pictureMetadata);
      } else {
        filesOutOfCollection.push(pictureMetadata);
      }
    });

    const onClickFilesInCollectionThumbnail = (mediaFile: MediaFile) => {
      this.removeFromFilesInCollection(mediaFile.hashValue);
    };

    const onClickFilesOutOfCollectionThumbnail = (mediaFile: MediaFile) => {
      this.addToFilesInCollection(mediaFile.hashValue);
    };

    const itemsInCollectionGalleryProps = {
      mediaFiles: filesInCollection,
      onClickThumbnail: onClickFilesInCollectionThumbnail,
    };

    const itemsOutOfCollectionGalleryProps = {
      mediaFiles: filesOutOfCollection,
      onClickThumbnail: onClickFilesOutOfCollectionThumbnail,
    };

    return (
      <div style={styles.container}>
        <form>
          <input
            type="text"
            placeholder="name"
            style={styles.nameInput}
            value={this.state.name}
            onChange={event => this.onNameChange(event)}
          />
          <button type="submit" onClick={this.onSubmit} style={themeStyles.button}>Save</button>
          <label style={themeStyles.button}>
            Upload
            <input style={styles.uploadInput} type="file" multiple={true} onChange={this.onFileUploadSelected} />
          </label>
          <h3>Items in collection</h3>
          <Gallery {...itemsInCollectionGalleryProps} />
          <h3>Items out of collection</h3>
          <Gallery {...itemsOutOfCollectionGalleryProps} />
        </form>
      </div>
    );
  }

  private onFileUploadSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }
    this.setState(state => {
      return {
        isUploadingEnabled: false,
        ...state,
      };
    });
    for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];

        this.uploadFile(file);
    }
  }

  private async uploadFile(file: File) {
    const { uploadQueue } = this.props;
    const { hashesInCollectionSet } = this.state;
    
    const mediaFile = await uploadQueue.uploadOrQueue(file);
    hashesInCollectionSet.add(mediaFile.hashValue);
    this.setState(state => ({
      ...state,
      hashesInCollectionSet,
    }));
  }
}

function mapStateToProps(state: State) {
  const { mediaFiles: mediaFiles, uploadQueue } = state.mediaFilesReducer;

  return {
    mediaFiles,
    uploadQueue,
  };
}

export default compose(
  // withRouter,
  connect(mapStateToProps),
)(EditCustomCollectionComponent); // as React.ComponentType<{collection: Collection}>;

// tslint:disable-next-line
// https://stackoverflow.com/questions/48701121/jsx-element-type-does-not-have-any-construct-or-call-signatures-typescript
