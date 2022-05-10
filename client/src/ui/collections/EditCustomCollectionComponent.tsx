import * as React from "react";
import { CustomCollection } from "../../domain/Collection";
import { MediaFile } from "../../domain/MediaFile";
import { ChangeEvent } from "react";
import GalleryWithFilter from "../gallery/GalleryWithFilter";
import { State } from "../../reducers/rootReducer";
import { connect } from "react-redux";
import { saveCollection } from "../../actions/collectionsActions";
import { themeStyles } from "../../theme/theme";
import { uploadFile, PeopleMap } from "../../actions/mediaFileActions";
import { getScreenWidth } from "../../util/screen_size";
import { joinUrlFragments } from "src/domain/util";

const styles = {
  nameInput: {
    padding: "10px",
    borderRadius: "10px",
    width: "300px",
    margin: "0 10px",
    border: "1px dashed black",
  },
  container: {
    margin: "0 20px",
  },
  uploadInput: {
    display: "none",
  },
};

type Props = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
  collection: CustomCollection;
  saveCollection: (collection: CustomCollection) => Promise<CustomCollection>;
  uploadFile: (file: File) => Promise<MediaFile>;
};

type ComponentState = {
  name: string;
  hashesInCollectionSet: Set<string>;
};

class EditCustomCollectionComponent extends React.Component<
  Props,
  ComponentState
> {
  state = {
    name: this.props.collection.name,
    hashesInCollectionSet: new Set<string>(this.props.collection.fileHashes),
  };

  onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    this.setState((state) => ({
      ...state,
      name,
    }));
  };
  addToFilesInCollection = (hash: string) => {
    this.setState((state) => {
      const hashesInCollectionSet = new Set(state.hashesInCollectionSet);
      hashesInCollectionSet.add(hash);

      return {
        ...state,
        hashesInCollectionSet,
      };
    });
  };
  removeFromFilesInCollection = (hash: string) => {
    this.setState((state) => {
      const hashesInCollectionSet = new Set(state.hashesInCollectionSet);
      hashesInCollectionSet.delete(hash);

      return {
        ...state,
        hashesInCollectionSet,
      };
    });
  };
  onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const { collection, saveCollection } = this.props;

    const newCollection = new CustomCollection(
      collection.id,
      this.state.name,
      Array.from(this.state.hashesInCollectionSet)
    );

    const returnedCollection = await saveCollection(newCollection);

    const encodedType = encodeURIComponent(returnedCollection.type);
    const encodedIdentifier = encodeURIComponent(
      returnedCollection.identifier()
    );
    window.location.hash = joinUrlFragments([
      "#/collections",
      encodedType,
      encodedIdentifier,
    ]);
  };

  render() {
    const { peopleMap } = this.props;

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

    const commonGalleryProps = {
      peopleMap,
      getRowWidth: () => getScreenWidth(),
    };

    const itemsInCollectionGalleryProps = {
      ...commonGalleryProps,
      mediaFiles: filesInCollection,
      onClickThumbnail: onClickFilesInCollectionThumbnail,
    };

    const itemsOutOfCollectionGalleryProps = {
      ...commonGalleryProps,
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
            onChange={(event) => this.onNameChange(event)}
          />
          <button
            type="submit"
            onClick={this.onSubmit}
            style={themeStyles.button}
          >
            Save
          </button>
          <label style={themeStyles.button}>
            Upload
            <input
              style={styles.uploadInput}
              type="file"
              multiple={true}
              onChange={this.onFileUploadSelected}
            />
          </label>
          <h3>Items in collection</h3>
          <GalleryWithFilter {...itemsInCollectionGalleryProps} />
          <h3>Items out of collection</h3>
          <GalleryWithFilter {...itemsOutOfCollectionGalleryProps} />
        </form>
      </div>
    );
  }

  private onFileUploadSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }
    this.setState((state) => {
      return {
        isUploadingEnabled: false,
        ...state,
      };
    });
    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];

      this.uploadFile(file);
    }
  };

  private async uploadFile(file: File) {
    const { uploadFile } = this.props;
    const { hashesInCollectionSet } = this.state;

    const mediaFile = await uploadFile(file);
    hashesInCollectionSet.add(mediaFile.hashValue);
    this.setState((state) => ({
      ...state,
      hashesInCollectionSet,
    }));
  }
}

function mapStateToProps(state: State) {
  const { mediaFiles: mediaFiles } = state.mediaFilesReducer;

  return {
    mediaFiles,
  };
}

export default connect(mapStateToProps, { uploadFile, saveCollection })(
  EditCustomCollectionComponent
); // as React.ComponentType<{collection: Collection}>;

// tslint:disable-next-line
// https://stackoverflow.com/questions/48701121/jsx-element-type-does-not-have-any-construct-or-call-signatures-typescript
